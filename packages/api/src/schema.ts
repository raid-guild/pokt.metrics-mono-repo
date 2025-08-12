import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  enum Interval {
    _15m
    _30m
    _1h
  }

  enum Chain {
    ethereum
    base
    solana
  }

  type MarketData {
    all_time_high: Float!
    all_time_low: Float!
    circulating_supply: Float!
    day_high_price: Float!
    day_low_price: Float!
    day_volume: Float!
    market_cap: Float!
    price: Float!
    timestamp: Int!
  }

  type PoolSnapshotRow {
    average_price: Float!
    block_number: String!
    chain: Chain!
    circulating_supply: Float!
    exchange: String!
    holders: Float!
    market_cap: Float!
    pool_address: String!
    pool_age: Int!
    timestamp: Int!
    token_address: String!
    tvl_usd: Float!
    volatility: Float!
    volume_usd: Float!
  }

  type PoolSnapshots {
    base: PoolSnapshotRow!
    ethereum: PoolSnapshotRow!
    solana: PoolSnapshotRow!
  }

  type PriceSnapshot {
    chain: Chain!
    exchange: String!
    pool_address: String!
    price: Float!
    timestamp: Int!
    token_address: String!
  }

  type PriceSnapshots {
    base: [PriceSnapshot!]!
    ethereum: [PriceSnapshot!]!
    solana: [PriceSnapshot!]!
  }

  type Query {
    marketData: MarketData!
    poolSnapshots: PoolSnapshots!
    priceSnapshots(interval: Interval!, limit: Int): PriceSnapshots!
  }
`;
