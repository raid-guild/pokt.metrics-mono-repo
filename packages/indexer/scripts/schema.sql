-- Enable if not enabled yet
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Drop existing tables if needed
DROP TABLE IF EXISTS price_snapshot CASCADE;

-- price_snapshot table
CREATE TABLE IF NOT EXISTS price_snapshot (
  block_number BIGINT NOT NULL,
  chain_id TEXT NOT NULL,
  exchange TEXT NOT NULL,
  machine_type TEXT NOT NULL,
  pool_address TEXT NOT NULL,
  price NUMERIC(30, 12) NOT NULL,
  timestamp BIGINT NOT NULL,
  token_address TEXT NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM timescaledb_information.hypertables
    WHERE hypertable_name = 'price_snapshot'
  ) THEN
    PERFORM create_hypertable('price_snapshot', 'timestamp');
  END IF;
END
$$;
