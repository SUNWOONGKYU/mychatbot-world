-- @task S1DB2
-- Migration: Bot Inheritance (디지털 피상속 시스템)
-- Project: MyChatbot World (MCW)
-- Created: 2026-04-01

-- ============================================================
-- TABLE: mcw_inheritance_settings
-- Bot owner designates an heir and which bots to pass on
-- ============================================================
CREATE TABLE IF NOT EXISTS mcw_inheritance_settings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    heir_email          TEXT NOT NULL,              -- heir identified by email (may not have account yet)
    bots_to_inherit     UUID[] NOT NULL DEFAULT '{}', -- array of mcw_bots.id to inherit
    message             TEXT,                       -- personal message from owner to heir
    active              BOOLEAN NOT NULL DEFAULT TRUE,
    last_verified_at    TIMESTAMPTZ,               -- owner last confirmed this setting
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (owner_id)                               -- one inheritance setting per owner
);

-- RLS: mcw_inheritance_settings
ALTER TABLE mcw_inheritance_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inheritance_settings_select_owner"
    ON mcw_inheritance_settings FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "inheritance_settings_select_heir"
    ON mcw_inheritance_settings FOR SELECT
    USING (
        heir_email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "inheritance_settings_insert_owner"
    ON mcw_inheritance_settings FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "inheritance_settings_update_owner"
    ON mcw_inheritance_settings FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "inheritance_settings_delete_owner"
    ON mcw_inheritance_settings FOR DELETE
    USING (auth.uid() = owner_id);

-- Indexes: mcw_inheritance_settings
CREATE INDEX IF NOT EXISTS idx_mcw_inheritance_settings_owner_id ON mcw_inheritance_settings(owner_id);
CREATE INDEX IF NOT EXISTS idx_mcw_inheritance_settings_heir_email ON mcw_inheritance_settings(heir_email);
CREATE INDEX IF NOT EXISTS idx_mcw_inheritance_settings_active ON mcw_inheritance_settings(active) WHERE active = TRUE;

-- ============================================================
-- TABLE: mcw_inheritance_consents
-- Heir's response to an inheritance request
-- ============================================================
CREATE TABLE IF NOT EXISTS mcw_inheritance_consents (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settings_id         UUID NOT NULL REFERENCES mcw_inheritance_settings(id) ON DELETE CASCADE,
    owner_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    heir_id             UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL until heir registers
    heir_email          TEXT NOT NULL,
    status              TEXT NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'accepted', 'declined')),
    consent_message     TEXT,                       -- optional note from heir
    notified_at         TIMESTAMPTZ,               -- when heir was notified
    responded_at        TIMESTAMPTZ,
    expires_at          TIMESTAMPTZ,               -- consent request expiry
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: mcw_inheritance_consents
ALTER TABLE mcw_inheritance_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inheritance_consents_select_owner"
    ON mcw_inheritance_consents FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "inheritance_consents_select_heir"
    ON mcw_inheritance_consents FOR SELECT
    USING (auth.uid() = heir_id);

CREATE POLICY "inheritance_consents_select_heir_by_email"
    ON mcw_inheritance_consents FOR SELECT
    USING (
        heir_email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "inheritance_consents_insert_service"
    ON mcw_inheritance_consents FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "inheritance_consents_update_heir"
    ON mcw_inheritance_consents FOR UPDATE
    USING (
        auth.uid() = heir_id
        OR heir_email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    );

-- Indexes: mcw_inheritance_consents
CREATE INDEX IF NOT EXISTS idx_mcw_inheritance_consents_settings_id ON mcw_inheritance_consents(settings_id);
CREATE INDEX IF NOT EXISTS idx_mcw_inheritance_consents_owner_id ON mcw_inheritance_consents(owner_id);
CREATE INDEX IF NOT EXISTS idx_mcw_inheritance_consents_heir_id ON mcw_inheritance_consents(heir_id) WHERE heir_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mcw_inheritance_consents_heir_email ON mcw_inheritance_consents(heir_email);
CREATE INDEX IF NOT EXISTS idx_mcw_inheritance_consents_status ON mcw_inheritance_consents(status);
CREATE INDEX IF NOT EXISTS idx_mcw_inheritance_consents_created_at ON mcw_inheritance_consents(created_at DESC);
