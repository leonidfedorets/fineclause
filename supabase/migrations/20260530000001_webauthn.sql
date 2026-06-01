-- WebAuthn passkey credentials
CREATE TABLE IF NOT EXISTS public.webauthn_credentials (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id   text NOT NULL UNIQUE,
  public_key      text NOT NULL,
  counter         bigint NOT NULL DEFAULT 0,
  device_type     text,
  backed_up       boolean DEFAULT false,
  name            text NOT NULL DEFAULT 'My Device',
  aaguid          text,
  transports      text[],
  created_at      timestamptz DEFAULT now() NOT NULL,
  last_used_at    timestamptz
);

CREATE INDEX idx_wac_user    ON public.webauthn_credentials(user_id);
CREATE INDEX idx_wac_cred_id ON public.webauthn_credentials(credential_id);

ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own passkeys"
  ON public.webauthn_credentials FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Temporary challenges (TTL 5 min, cleaned up after use)
CREATE TABLE IF NOT EXISTS public.webauthn_challenges (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL,
  challenge   text NOT NULL,
  type        text NOT NULL DEFAULT 'registration',
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '5 minutes'),
  created_at  timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_wch_user ON public.webauthn_challenges(user_id);
CREATE INDEX idx_wch_exp  ON public.webauthn_challenges(expires_at);

-- Auto-delete expired challenges (pg cron would be ideal; for now clean on insert)
ALTER TABLE public.webauthn_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service only" ON public.webauthn_challenges
  USING (false); -- only accessible via service role key
