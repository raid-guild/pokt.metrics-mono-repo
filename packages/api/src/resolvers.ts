import { db } from './db';

export enum Chain {
  BASE = 'base',
  ETHEREUM = 'ethereum',
  SOLANA = 'solana',
}

interface PoolArgs {
  limit?: number;
}

export const POKT_BY_CHAIN: Record<Chain, string> = {
  [Chain.BASE]: '0x764a726d9ced0433a8d7643335919deb03a9a935',
  [Chain.ETHEREUM]: '0x67f4c72a50f8df6487720261e188f2abe83f57d7',
  [Chain.SOLANA]: '6CAsXfiCXZfP8APCG6Vma2DFMindopxiqYQN4LSQfhoC',
};

const PRICE_SNAPSHOTS_QUERY = `
  SELECT
    time_bucket($2, to_timestamp(timestamp / 1000.0)) AS bucket,
    AVG(price) AS price,
    MIN(timestamp) AS timestamp,
    token_address,
    pool_address,
    chain,
    exchange,
    block_number
  FROM price_snapshots
  WHERE token_address = $1
  GROUP BY bucket, token_address, pool_address, chain, exchange, block_number
  ORDER BY bucket DESC
  LIMIT $3
`;

export const resolvers = {
  Query: {
    priceSnapshotsBase: async (
      _: unknown,
      { interval, limit = 192 }: PoolArgs & { interval: '_15m' | '_30m' | '_1h' }
    ) => {
      const params = [POKT_BY_CHAIN.base, interval, limit];
      const { rows } = await db.query(PRICE_SNAPSHOTS_QUERY, params);

      return rows.map((row) => ({
        ...row,
        // Floor timestamp to the nearest minute
        timestamp: new Date(Math.floor(Number(row.timestamp) / 60000) * 60000).toISOString(),
      }));
    },
    priceSnapshotsEthereum: async (
      _: unknown,
      { interval, limit = 192 }: PoolArgs & { interval: '_15m' | '_30m' | '_1h' }
    ) => {
      const params = [POKT_BY_CHAIN.ethereum, interval, limit];
      const { rows } = await db.query(PRICE_SNAPSHOTS_QUERY, params);

      return rows.map((row) => ({
        ...row,
        // Floor timestamp to the nearest minute
        timestamp: new Date(Math.floor(Number(row.timestamp) / 60000) * 60000).toISOString(),
      }));
    },
    priceSnapshotsSolana: async (
      _: unknown,
      { interval, limit = 192 }: PoolArgs & { interval: '_15m' | '_30m' | '_1h' }
    ) => {
      const params = [POKT_BY_CHAIN.solana, interval, limit];
      const { rows } = await db.query(PRICE_SNAPSHOTS_QUERY, params);

      return rows.map((row) => ({
        ...row,
        // Floor timestamp to the nearest minute
        timestamp: new Date(Math.floor(Number(row.timestamp) / 60000) * 60000).toISOString(),
      }));
    },
  },
};
