-- @task S4BA3 (보완)
-- 상속 관련 추가 테이블 3개
-- mcw_inheritance_event_logs, mcw_inheritance_persona_settings, mcw_inheritance_transfers
-- RLS: 소유자(owner_id / actor_id / requested_by) 기반
--
-- NOTE: mcw_inheritance_settings.id는 uuid 타입 (20260401_inheritance.sql 기준)

-- ─────────────────────────────────────────────
-- 1. mcw_inheritance_event_logs
--    이벤트 로그 (heir_invited, heir_accepted, heir_declined,
--                heir_removed, transfer_requested, owner_notified_heir_declined)
--    actor_id: 행위자 (로그인 사용자 uuid)
--    target_email: 대상 이메일 (선택)
--    target_id: 대상 사용자 uuid (선택)
--    metadata: 자유 형식 JSONB (message, transfer_id, proof_document_url, note 등)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mcw_inheritance_event_logs (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    inheritance_id uuid NOT NULL REFERENCES public.mcw_inheritance_settings(id) ON DELETE CASCADE,
    event_type     text NOT NULL,
    actor_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_email   text,
    target_id      uuid,
    metadata       jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inheritance_event_logs_inheritance_id ON public.mcw_inheritance_event_logs(inheritance_id);
CREATE INDEX IF NOT EXISTS idx_inheritance_event_logs_actor_id       ON public.mcw_inheritance_event_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_inheritance_event_logs_event_type     ON public.mcw_inheritance_event_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_inheritance_event_logs_created_at     ON public.mcw_inheritance_event_logs(created_at DESC);

ALTER TABLE public.mcw_inheritance_event_logs ENABLE ROW LEVEL SECURITY;

-- 행위자 본인만 자신이 생성한 로그 조회
CREATE POLICY inheritance_event_logs_select_actor
    ON public.mcw_inheritance_event_logs FOR SELECT
    TO authenticated
    USING (auth.uid() = actor_id);

-- 로그인 사용자 삽입 (service_role 통해서만 삽입, 일반 사용자 직접 삽입 금지)
-- API는 service_role 키 사용이므로 authenticated INSERT는 열어두지 않음
-- (anon/authenticated 둘 다 INSERT 불가 → 서버사이드 service_role만 가능)


-- ─────────────────────────────────────────────
-- 2. mcw_inheritance_persona_settings
--    페르소나(챗봇)별 상속 허용 여부 설정
--    inheritance_id + persona_id UNIQUE (upsert 충돌 기준)
--    persona_id: mcw_bots.id (text 타입이므로 논리적 참조)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mcw_inheritance_persona_settings (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    inheritance_id uuid NOT NULL REFERENCES public.mcw_inheritance_settings(id) ON DELETE CASCADE,
    persona_id     text NOT NULL,
    allowed        boolean NOT NULL DEFAULT true,
    updated_at     timestamptz NOT NULL DEFAULT now(),
    UNIQUE(inheritance_id, persona_id)
);

CREATE INDEX IF NOT EXISTS idx_inheritance_persona_settings_inheritance_id ON public.mcw_inheritance_persona_settings(inheritance_id);
CREATE INDEX IF NOT EXISTS idx_inheritance_persona_settings_persona_id     ON public.mcw_inheritance_persona_settings(persona_id);

ALTER TABLE public.mcw_inheritance_persona_settings ENABLE ROW LEVEL SECURITY;

-- 소유자 확인은 mcw_inheritance_settings를 통해 간접 판단
-- NOTE: mcw_inheritance_settings에 heir_id 컬럼 없음 (heir는 heir_email로만 추적)
-- 실제 접근은 service_role(API)이 처리하므로 authenticated 읽기만 허용
CREATE POLICY inheritance_persona_settings_select_authenticated
    ON public.mcw_inheritance_persona_settings FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.mcw_inheritance_settings s
            WHERE s.id = inheritance_id
              AND s.owner_id = auth.uid()
        )
    );


-- ─────────────────────────────────────────────
-- 3. mcw_inheritance_transfers
--    유산 전환 요청
--    status: pending_review → approved → transferred (또는 rejected)
--    proof_document_url: 사망 증명 문서 URL
--    reviewed_by: 관리자 uuid (선택)
--    admin_note: 전환 요청 시 신청자 메모 또는 관리자 검토 노트
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mcw_inheritance_transfers (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    inheritance_id      uuid NOT NULL REFERENCES public.mcw_inheritance_settings(id) ON DELETE CASCADE,
    requested_by        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    original_owner_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    proof_document_url  text,
    status              text NOT NULL DEFAULT 'pending_review'
                            CHECK (status IN ('pending_review', 'approved', 'rejected', 'transferred')),
    admin_note          text,
    reviewed_by         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at         timestamptz,
    transferred_at      timestamptz,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inheritance_transfers_inheritance_id   ON public.mcw_inheritance_transfers(inheritance_id);
CREATE INDEX IF NOT EXISTS idx_inheritance_transfers_requested_by     ON public.mcw_inheritance_transfers(requested_by);
CREATE INDEX IF NOT EXISTS idx_inheritance_transfers_original_owner   ON public.mcw_inheritance_transfers(original_owner_id);
CREATE INDEX IF NOT EXISTS idx_inheritance_transfers_status           ON public.mcw_inheritance_transfers(status);

ALTER TABLE public.mcw_inheritance_transfers ENABLE ROW LEVEL SECURITY;

-- 요청자, 원 소유자만 조회 가능 (관리자는 service_role 접근)
CREATE POLICY inheritance_transfers_select_parties
    ON public.mcw_inheritance_transfers FOR SELECT
    TO authenticated
    USING (auth.uid() = requested_by OR auth.uid() = original_owner_id);

-- 요청자 본인만 생성 가능 (실제 검증은 API에서 수행)
CREATE POLICY inheritance_transfers_insert_requester
    ON public.mcw_inheritance_transfers FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = requested_by);
