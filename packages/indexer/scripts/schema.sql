-- Enable if not enabled yet
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Drop existing tables if needed
-- DROP TABLE IF EXISTS price_snapshots CASCADE;
-- DROP TABLE IF EXISTS pool_snapshots CASCADE;
-- DROP TABLE IF EXISTS market_data CASCADE;

-- price_snapshots table
CREATE TABLE IF NOT EXISTS price_snapshots (
  block_number BIGINT NOT NULL,
  chain TEXT NOT NULL,
  exchange TEXT NOT NULL,
  pool_address TEXT NOT NULL,
  price NUMERIC(30, 12) NOT NULL,
  timestamp BIGINT NOT NULL,
  token_address TEXT NOT NULL
);

-- pool_snapshots table
CREATE TABLE IF NOT EXISTS pool_snapshots (
  block_number BIGINT NOT NULL,
  chain TEXT NOT NULL,
  circulating_supply NUMERIC(30, 12) NOT NULL,
  exchange TEXT NOT NULL,
  holders NUMERIC(30, 12) NOT NULL,
  market_cap NUMERIC(30, 12) NOT NULL,
  pool_address TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  token_address TEXT NOT NULL,
  tvl_usd NUMERIC(30, 12) NOT NULL,
  volatility NUMERIC(30, 12) NOT NULL,
  volume_usd NUMERIC(30, 12) NOT NULL
);

-- market_data table
CREATE TABLE IF NOT EXISTS market_data (
  all_time_high NUMERIC(30, 12) NOT NULL,
  all_time_low NUMERIC(30, 12) NOT NULL,
  circulating_supply NUMERIC(30, 12) NOT NULL,
  day_volume NUMERIC(30, 12) NOT NULL,
  market_cap NUMERIC(30, 12) NOT NULL,
  price NUMERIC(30, 12) NOT NULL,
  timestamp BIGINT NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM timescaledb_information.hypertables
    WHERE hypertable_name = 'price_snapshots'
  ) THEN
    PERFORM create_hypertable('price_snapshots', 'timestamp');
  END IF;
END
$$;

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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM timescaledb_information.hypertables
    WHERE hypertable_name = 'market_data'
  ) THEN
    PERFORM create_hypertable('market_data', 'timestamp');
  END IF;
END
$$;
