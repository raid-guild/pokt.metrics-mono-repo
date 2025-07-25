import { db } from './db';

interface PoolArgs {
  limit?: number;
}

interface HistoryArgs {
  tokenAddress?: string;
  poolAddress?: string;
  chainId: string;
  interval: string;
}

export const resolvers = {
  Query: {
    poolSnapshots: async (_: unknown, { limit = 10 }: PoolArgs) => {
      const { rows } = await db.query(
        `SELECT * FROM pool_snapshots ORDER BY timestamp DESC LIMIT $1`,
        [limit]
      );
      return rows;
    },

    // Time-series data resolvers
    tokenPriceHistory: async (_: unknown, { tokenAddress, chainId, interval }: HistoryArgs) => {
      const { rows } = await db.query(
        `
        SELECT
          time_bucket($3::interval, to_timestamp(timestamp / 1000.0)) AS bucket,
          AVG(price) AS avg_price
        FROM pool_snapshots
        WHERE token_address = $1 AND chain_id = $2
          AND to_timestamp(timestamp / 1000.0) >= now() - interval '1 day'
        GROUP BY bucket
        ORDER BY bucket DESC
        `,
        [tokenAddress, chainId, interval]
      );
      return rows.map((row) => ({
        timestamp: row.bucket.toISOString(),
        avgPrice: parseFloat(row.avg_price),
      }));
    },

    poolTVLHistory: async ({ poolAddress, chainId, interval }: HistoryArgs) => {
      const { rows } = await db.query(
        `
        SELECT
          time_bucket($3::interval, to_timestamp(timestamp / 1000.0)) AS bucket,
          LAST(tvl_usd, to_timestamp(timestamp / 1000.0)) AS tvl
        FROM pool_snapshots
        WHERE pool_address = $1 AND chain_id = $2
          AND to_timestamp(timestamp / 1000.0) >= now() - interval '2 days'
        GROUP BY bucket
        ORDER BY bucket DESC
        `,
        [poolAddress, chainId, interval]
      );
      return rows.map((row) => ({
        timestamp: row.bucket.toISOString(),
        tvl: parseFloat(row.tvl),
      }));
    },
  },
};
