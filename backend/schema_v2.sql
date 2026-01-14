-- Refunds table
-- Refunds table (FIXED)
CREATE TABLE IF NOT EXISTS refunds (
  id SERIAL PRIMARY KEY,
  payment_id VARCHAR(50) NOT NULL REFERENCES payments(id),
  amount INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Webhook delivery logs
CREATE TABLE IF NOT EXISTS webhook_logs (
  id SERIAL PRIMARY KEY,
  merchant_id INTEGER NOT NULL REFERENCES merchants(id),
  event_type VARCHAR(50) NOT NULL,
  webhook_url TEXT NOT NULL,
  attempt INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL,
  response_code INTEGER,
  next_retry_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Idempotency keys to prevent duplicate requests
CREATE TABLE IF NOT EXISTS idempotency_keys (
  id SERIAL PRIMARY KEY,
  idempotency_key VARCHAR(255) NOT NULL,
  api_path VARCHAR(255) NOT NULL,
  response_body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_idempotency_key
ON idempotency_keys (idempotency_key);
-- Add webhook secret to merchants
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS webhook_secret VARCHAR(255);
