import 'dotenv/config';

import { gql, request } from 'graphql-request';

const THE_GRAPH_API_KEY = process.env.THE_GRAPH_API_KEY;

class TheGraphGenericClient {
  constructor(
    protected readonly apiKey: string,
    protected readonly endpoint: string
  ) {
    if (!apiKey) {
      throw new Error('API key is required');
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

  async getPoolStats({
    poolAddress,
    blockNumber,
    ltDate,
  }: {
    poolAddress: string;
    blockNumber: bigint;
    ltDate: number;
  }) {
    const data = (await this.fetch(
      this.endpoint,
      gql`
        query GetPoolStats($poolAddress: String!, $blockNumber: Int!, $ltDate: Int!) {
          pair(id: $poolAddress, block: { number: $blockNumber }) {
            reserveETH
            reserveUSD
            token1Price
          }
          pairDayDatas(
            first: 1
            orderBy: date
            orderDirection: desc
            where: { pairAddress: $poolAddress, date_lt: $ltDate }
          ) {
            dailyVolumeToken1
          }
        }
      `,
      {
        poolAddress: poolAddress.toLowerCase(),
        blockNumber: Number(blockNumber),
        ltDate,
      }
    )) as {
      pair: {
        reserveETH: string;
        reserveUSD: string;
        token1Price: string;
      };
      pairDayDatas: Array<{
        dailyVolumeToken1: string;
      }>;
    };

    return { ...data.pair, volumeETH: data.pairDayDatas[0]?.dailyVolumeToken1 ?? '0' };
  }
}

class TheGraphBaseClient extends TheGraphGenericClient {
  constructor(apiKey: string) {
    super(
      apiKey,
      'https://gateway.thegraph.com/api/subgraphs/id/GENunSHWLBXm59mBSgPzQ8metBEp9YDfdqwFr91Av1UM'
    );
  }

  async getPoolStats({
    poolAddress,
    blockNumber,
    ltDate,
  }: {
    poolAddress: string;
    blockNumber: bigint;
    ltDate: number;
  }) {
    const data = (await this.fetch(
      this.endpoint,
      gql`
        query GetPoolStats($poolAddress: String!, $blockNumber: Int!, $ltDate: Int!) {
          pool(id: $poolAddress, block: { number: $blockNumber }) {
            token0Price
            totalValueLockedToken0
            volumeUSD
          }
          poolDayDatas(
            first: 1
            orderBy: date
            orderDirection: desc
            where: { pool: $poolAddress, date_lt: $ltDate }
          ) {
            volumeToken0
          }
        }
      `,
      {
        poolAddress: poolAddress.toLowerCase(),
        blockNumber: Number(blockNumber),
        ltDate,
      }
    )) as {
      pool: {
        token0Price: string;
        totalValueLockedToken0: string;
        volumeUSD: string;
      };
      poolDayDatas: Array<{
        volumeToken0: string;
      }>;
    };

    return { ...data.pool, volumeETH: data.poolDayDatas[0]?.volumeToken0 ?? '0' };
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
