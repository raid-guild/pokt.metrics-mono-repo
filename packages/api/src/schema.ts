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

  type PriceSnapshot {
    block_number: String!
    chain: Chain!
    exchange: String!
    pool_address: String!
    price: Float!
    timestamp: String!
    token_address: String!
  }

  type Query {
    priceSnapshotsBase(interval: Interval!, limit: Int): [PriceSnapshot!]!
    priceSnapshotsEthereum(interval: Interval!, limit: Int): [PriceSnapshot!]!
    priceSnapshotsSolana(interval: Interval!, limit: Int): [PriceSnapshot!]!
  }
`;
