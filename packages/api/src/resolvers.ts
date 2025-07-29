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

const POOL_SNAPSHOTS_QUERY = `
  SELECT
    block_number,
    chain,
    circulating_supply,
    exchange,
    holders,
    market_cap,
    pool_address,
    timestamp,
    token_address,
    tvl_usd,
    volatility,
    volume_usd
  FROM pool_snapshots
  WHERE token_address = $1
  ORDER BY timestamp DESC
  LIMIT $2
`;

const AVERAGE_PRICE_QUERY = `
  SELECT
    AVG(price) AS average_price
  FROM price_snapshots
  WHERE token_address = $1
    AND to_timestamp(timestamp / 1000.0) >= NOW() - INTERVAL '24 hours'
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
    poolSnapshots: async (_: unknown, { limit = 1 }: PoolArgs) => {
      const { rows: ethereumRows } = await db.query(POOL_SNAPSHOTS_QUERY, [
        POKT_BY_CHAIN.ethereum,
        limit,
      ]);
      const { rows: averagePriceRows } = await db.query(AVERAGE_PRICE_QUERY, [
        POKT_BY_CHAIN.ethereum,
      ]);
      const averageEthereumPrice = averagePriceRows[0]?.average_price ?? 0;
      if (ethereumRows.length > 0) {
        ethereumRows[0].average_price = averageEthereumPrice;
      }

      const { rows: baseRows } = await db.query(POOL_SNAPSHOTS_QUERY, [POKT_BY_CHAIN.base, limit]);
      const { rows: averageBasePriceRows } = await db.query(AVERAGE_PRICE_QUERY, [
        POKT_BY_CHAIN.base,
      ]);
      const averageBasePrice = averageBasePriceRows[0]?.average_price ?? 0;
      if (baseRows.length > 0) {
        baseRows[0].average_price = averageBasePrice;
      }

      const { rows: solanaRows } = await db.query(POOL_SNAPSHOTS_QUERY, [
        POKT_BY_CHAIN.solana,
        limit,
      ]);
      const { rows: averageSolanaPriceRows } = await db.query(AVERAGE_PRICE_QUERY, [
        POKT_BY_CHAIN.solana,
      ]);
      const averageSolanaPrice = averageSolanaPriceRows[0]?.average_price ?? 0;
      if (solanaRows.length > 0) {
        solanaRows[0].average_price = averageSolanaPrice;
      }

      return [ethereumRows[0], baseRows[0], solanaRows[0]];
    },
  },
};
