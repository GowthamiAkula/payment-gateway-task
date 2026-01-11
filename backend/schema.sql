-- Merchants table
CREATE TABLE IF NOT EXISTS merchants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  api_key VARCHAR(100) UNIQUE NOT NULL,
  api_secret VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(50) PRIMARY KEY,
  merchant_id INTEGER REFERENCES merchants(id),
  amount INTEGER NOT NULL,
  currency VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(50) PRIMARY KEY,
  order_id VARCHAR(50) REFERENCES orders(id),
  merchant_id INTEGER REFERENCES merchants(id),
  method VARCHAR(20),
  status VARCHAR(20),
  card_last4 VARCHAR(4),
  card_network VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert test merchant (ONLY if not exists)
INSERT INTO merchants (name, api_key, api_secret, is_active)
SELECT 'Test Merchant', 'key_test_abc123', 'secret_test_xyz789', true
WHERE NOT EXISTS (
  SELECT 1 FROM merchants WHERE api_key = 'key_test_abc123'
);
