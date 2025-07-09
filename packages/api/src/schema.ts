import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  type TokenPriceHistoryPoint {
    timestamp: String!
    avgPrice: Float!
  }

  type PoolTVLHistoryPoint {
    timestamp: String!
    tvl_usd: Float!
  }

  type TokenPrice {
    token_address: String!
    chain_id: String!
    price: Float!
    timestamp: String!
  }

  type PoolSnapshot {
    pool_address: String!
    chain_id: Int!
    timestamp: String!
    tvl_usd: Float!
    volume_usd: Float!
  }

  type Query {
    tokenPrices(limit: Int): [TokenPrice!]!
    poolTVLs(limit: Int): [PoolSnapshot!]!
    poolVolumes(limit: Int): [PoolSnapshot!]!
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
