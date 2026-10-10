-- Spec 020 (FR-009, FR-020) — The Axiovex Signal subscriber store.
-- Cloudflare D1. Apply to axiovex-newsletter-staging first (T003).
-- Tokens exist at rest ONLY as SHA-256 hashes. No per-subscriber
-- event/open/click data exists anywhere in this schema (FR-015,
-- claim C-020-4 — this file is the schema-inspection evidence).

CREATE TABLE IF NOT EXISTS subscribers (
  email              TEXT PRIMARY KEY,
  status             TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','active','unsubscribed','suppressed')),
  confirm_token_hash TEXT,
  confirm_expires_at TEXT,
  unsub_token_hash   TEXT,
  created_at         TEXT NOT NULL,
  confirmed_at       TEXT,
  unsubscribed_at    TEXT,
  source             TEXT
);
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers (status);
CREATE INDEX IF NOT EXISTS idx_subscribers_confirm ON subscribers (confirm_token_hash);
CREATE INDEX IF NOT EXISTS idx_subscribers_unsub ON subscribers (unsub_token_hash);

-- Aggregate sends log (FR-009) carrying the FR-020 gauge fields:
-- attempted vs sent, duration, hard bounces, complaints, throttling.
CREATE TABLE IF NOT EXISTS sends (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  issue_id        TEXT NOT NULL,
  started_at      TEXT NOT NULL,
  finished_at     TEXT,
  duration_ms     INTEGER,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  sent_count      INTEGER NOT NULL DEFAULT 0,
  bounce_count    INTEGER NOT NULL DEFAULT 0,
  complaint_count INTEGER NOT NULL DEFAULT 0,
  throttle_events INTEGER NOT NULL DEFAULT 0,
  provider_ref    TEXT
);

-- Subscribe-attempt rate limiting (FR-008): hashed IPs only.
CREATE TABLE IF NOT EXISTS rate_events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_hash    TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rate_events_ip ON rate_events (ip_hash, created_at);
