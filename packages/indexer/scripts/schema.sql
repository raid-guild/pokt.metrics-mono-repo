-- Enable if not enabled yet
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Drop existing tables if needed
-- DROP TABLE IF EXISTS token_prices CASCADE;
-- DROP TABLE IF EXISTS pool_snapshots CASCADE;

-- token_prices table
CREATE TABLE IF NOT EXISTS token_prices (
  chain_id TEXT NOT NULL,
  exchange TEXT NOT NULL,
  machine_type TEXT NOT NULL,
  price NUMERIC(30, 12) NOT NULL,
  timestamp BIGINT NOT NULL,
  token_address TEXT NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM timescaledb_information.hypertables
    WHERE hypertable_name = 'token_prices'
  ) THEN
    PERFORM create_hypertable('token_prices', 'timestamp');
  END IF;
END
$$;

-- pool_snapshots table
CREATE TABLE IF NOT EXISTS pool_snapshots (
  chain_id TEXT NOT NULL,
  exchange TEXT NOT NULL,
  machine_type TEXT NOT NULL,
  pool_address TEXT NOT NULL,
  price NUMERIC(30, 12) NOT NULL,
  timestamp BIGINT NOT NULL,
  token_address TEXT NOT NULL,
  tvl_usd NUMERIC(30, 12) NOT NULL,
  volume_usd NUMERIC(30, 12) NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM timescaledb_information.hypertables
    WHERE hypertable_name = 'pool_snapshots'
  ) THEN
    PERFORM create_hypertable('pool_snapshots', 'timestamp');
  END IF;
END
$$;
