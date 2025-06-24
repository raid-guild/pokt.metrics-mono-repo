import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  type TokenPriceHistoryPoint {
    timestamp: String!
    avgPrice: Float!
  }

  type PoolTVLHistoryPoint {
    timestamp: String!
    tvl: Float!
  }

  type TokenPrice {
    token_address: String!
    chain_id: String!
    price: Float!
    timestamp: String!
  }

  type PoolTVL {
    pool_address: String!
    chain_id: Int!
    tvl: Float!
    timestamp: String!
  }

  type PoolVolume {
    pool_address: String!
    chain_id: String!
    volume: Float!
    timestamp: String!
  }

  type Query {
    tokenPrices(limit: Int): [TokenPrice!]!
    poolTVLs(limit: Int): [PoolTVL!]!
    poolVolumes(limit: Int): [PoolVolume!]!
    tokenPriceHistory(
      tokenAddress: String!
      chainId: String!
      interval: String!
    ): [TokenPriceHistoryPoint!]!
    poolTVLHistory(
      poolAddress: String!
      chainId: String!
      interval: String!
    ): [PoolTVLHistoryPoint!]!
  }
`;
