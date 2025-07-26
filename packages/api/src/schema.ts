import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  type PriceSnapshot {
    block_number: String!
    chain_id: String!
    exchange: String!
    machine_type: String!
    pool_address: String!
    price: Float!
    timestamp: String!
    token_address: String!
  }

  enum Interval {
    _15m
    _30m
    _1h
  }

  type Query {
    priceSnapshotsBase(interval: Interval!, limit: Int): [PriceSnapshot!]!
    priceSnapshotsEthereum(interval: Interval!, limit: Int): [PriceSnapshot!]!
    priceSnapshotsSolana(interval: Interval!, limit: Int): [PriceSnapshot!]!
  }
`;
