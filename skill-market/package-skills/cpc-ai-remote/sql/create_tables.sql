-- CPC 테이블 생성 (Supabase SQL Editor에서 실행)
-- 1회만 실행하면 됩니다.

-- 소대 테이블
CREATE TABLE IF NOT EXISTS cpc_platoons (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL DEFAULT '',
  purpose     TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'IDLE',
  session_id  TEXT,
  session_url TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 명령 테이블
CREATE TABLE IF NOT EXISTS cpc_commands (
  id          TEXT PRIMARY KEY,
  platoon_id  TEXT NOT NULL REFERENCES cpc_platoons(id),
  text        TEXT NOT NULL,
  source      TEXT NOT NULL DEFAULT 'operator',
  status      TEXT NOT NULL DEFAULT 'PENDING',
  result      TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- RLS 정책 (anon 전체 허용)
ALTER TABLE cpc_platoons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_platoons" ON cpc_platoons
  FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE cpc_commands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_commands" ON cpc_commands
  FOR ALL TO anon USING (true) WITH CHECK (true);
