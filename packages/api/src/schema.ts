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
    timestamp: String!
  }

  type PriceSnapshot {
    block_number: String!
    chain: Chain!
    exchange: String!
    pool_address: String!
    price: Float!
    timestamp: String!
    token_address: String!
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
    timestamp: String!
    token_address: String!
    tvl_usd: Float!
    volatility: Float!
    volume_usd: Float!
  }

  type Query {
    marketData: MarketData!
    priceSnapshotsBase(interval: Interval!, limit: Int): [PriceSnapshot!]!
    priceSnapshotsEthereum(interval: Interval!, limit: Int): [PriceSnapshot!]!
    priceSnapshotsSolana(interval: Interval!, limit: Int): [PriceSnapshot!]!
    poolSnapshots: [PoolSnapshotRow!]!
  }
`;
