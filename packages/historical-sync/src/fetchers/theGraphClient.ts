import 'dotenv/config';

import { gql, request } from 'graphql-request';

const THE_GRAPH_API_KEY = process.env.THE_GRAPH_API_KEY;

class TheGraphGenericClient {
  constructor(
    protected readonly apiKey: string,
    protected readonly endpoint: string
  ) {
    if (!THE_GRAPH_API_KEY) {
      throw new Error('THE_GRAPH_API_KEY is required');
    }
  }

  protected async fetch(endpoint: string, query: string, variables: Record<string, unknown> = {}) {
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
    };

    try {
      const data = await request(endpoint, query, variables, headers);
      return data;
    } catch (error) {
      throw new Error(`GraphQL request failed: ${error}`);
    }
  }
}

class TheGraphEthereumClient extends TheGraphGenericClient {
  constructor(apiKey: string) {
    super(
      apiKey,
      'https://gateway.thegraph.com/api/subgraphs/id/EYCKATKGBKLWvSfwvBjzfCBmGwYNdVkduYXVivCsLRFu'
    );
  }

  async getPoolStats({ poolAddress, blockNumber }: { poolAddress: string; blockNumber: number }) {
    const data = (await this.fetch(
      this.endpoint,
      gql`
        query GetStats($poolAddress: String!, $blockNumber: Int!) {
          pair(id: $poolAddress, block: { number: $blockNumber }) {
            reserveETH
            reserveUSD
            token1Price
            volumeUSD
          }
        }
      `,
      {
        poolAddress: poolAddress.toLowerCase(),
        blockNumber: blockNumber,
      }
    )) as {
      pair: {
        reserveETH: string;
        reserveUSD: string;
        token1Price: string;
        volumeUSD: string;
      };
    };

    return data.pair;
  }
}

class TheGraphBaseClient extends TheGraphGenericClient {
  constructor(apiKey: string) {
    super(
      apiKey,
      'https://gateway.thegraph.com/api/subgraphs/id/GENunSHWLBXm59mBSgPzQ8metBEp9YDfdqwFr91Av1UM'
    );
  }

  async getPoolStats({ poolAddress, blockNumber }: { poolAddress: string; blockNumber: number }) {
    const data = (await this.fetch(
      this.endpoint,
      gql`
        query GetStats($poolAddress: String!, $blockNumber: Int!) {
          pool(id: $poolAddress, block: { number: $blockNumber }) {
            token0Price
            totalValueLockedETH
            totalValueLockedUSD
            volumeUSD
          }
        }
      `,
      {
        poolAddress: poolAddress.toLowerCase(),
        blockNumber: blockNumber,
      }
    )) as {
      pool: {
        token0Price: string;
        totalValueLockedETH: string;
        totalValueLockedUSD: string;
        volumeUSD: string;
      };
    };

    return data.pool;
  }
}

export class TheGraphClient {
  readonly ethereum: TheGraphEthereumClient;
  readonly base: TheGraphBaseClient;

  constructor(apiKey = THE_GRAPH_API_KEY) {
    if (!apiKey) {
      throw new Error('THE_GRAPH_API_KEY is not set');
    }

    this.ethereum = new TheGraphEthereumClient(apiKey);
    this.base = new TheGraphBaseClient(apiKey);
  }
}

const theGraphClient = new TheGraphClient();
export { theGraphClient };
