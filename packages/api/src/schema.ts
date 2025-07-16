import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  type PoolSnapshot {
    chain_id: Int!
    pool_address: String!
    price: Float!
    timestamp: String!
    token_address: String!
    tvl_usd: Float!
    volume_usd: Float!
  }

  type PoolTVLHistoryPoint {
    timestamp: String!
    tvl_usd: Float!
  }

  type TokenPriceHistoryPoint {
    timestamp: String!
    avgPrice: Float!
  }

  type Query {
    poolSnapshots(limit: Int): [PoolSnapshot!]!
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
