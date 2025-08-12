import { Chain } from './utils/chains';

export type MarketDataRow = {
  all_time_high: number;
  all_time_low: number;
  circulating_supply: number;
  day_volume: number;
  market_cap: number;
  price: number;
  timestamp: bigint;
};

export type PoolSnapshotRow = {
  block_number: bigint;
  chain: Chain;
  circulating_supply: number;
  exchange: string;
  holders: number;
  market_cap: number;
  pool_address: string;
  timestamp: bigint;
  token_address: string;
  tvl_usd: number;
  volatility: number;
  volume_usd: number;
};

export type PriceSnapshotRow = {
  block_number: bigint;
  chain: Chain;
  exchange: string;
  pool_address: string;
  price: number;
  timestamp: bigint;
  token_address: string;
};

export type TokenPriceRow = {
  chain_id: string;
  exchange: string;
  price: number;
  timestamp: number;
  token_address: string;
};
