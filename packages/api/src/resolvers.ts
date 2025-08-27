import { db } from './db';
import { TTLCache } from './utils/ttlCache';

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

const POOL_CREATED_TIMESTAMP: Record<Chain, number> = {
  [Chain.BASE]: 1724361475,
  [Chain.ETHEREUM]: 1696841963,
  [Chain.SOLANA]: 1724398200,
};

const intervalToMultiplier: Record<'_15m' | '_30m' | '_1h', number> = {
  _15m: 15,
  _30m: 30,
  _1h: 60,
};

const roundTimestampToInterval = (timestamp: number, interval: '_15m' | '_30m' | '_1h'): number => {
  return (
    Math.round(Number(timestamp) / (intervalToMultiplier[interval] * 60 * 1000)) *
    (intervalToMultiplier[interval] * 60)
  );
};

// Price snapshots: one query for all tokens, time-bounded, then per-token top N buckets
const COMBINED_PRICE_SNAPSHOTS_SQL = `
WITH agg AS (
  SELECT
    token_address,
    time_bucket($2::interval, to_timestamp(timestamp / 1000.0)) AS bucket,
    AVG(price) AS price,
    MIN(timestamp) AS timestamp,
    pool_address,
    chain,
    exchange
  FROM price_snapshots
  WHERE token_address = ANY($1)
    AND timestamp >= $3
    AND timestamp <  $4
  GROUP BY token_address, bucket, pool_address, chain, exchange
),
ranked AS (
  SELECT
    agg.*,
    row_number() OVER (PARTITION BY token_address ORDER BY bucket DESC) AS rn
  FROM agg
)
SELECT *
FROM ranked
WHERE rn <= $5
ORDER BY token_address, bucket DESC
`;

// Pool snapshots: top N most recent rows per token in one query
const COMBINED_POOL_SNAPSHOTS_SQL = `
WITH ranked AS (
  SELECT
    ps.*,
    row_number() OVER (
      PARTITION BY token_address
      ORDER BY timestamp DESC
    ) AS rn
  FROM pool_snapshots ps
  WHERE token_address = ANY($1)
)
SELECT *
FROM ranked
WHERE rn <= $2
ORDER BY token_address, timestamp DESC
`;

// 24h stats (avg, high, low) per token in one pass
const STATS_24H_SQL = `
SELECT
  token_address,
  AVG(price) AS avg_24h,
  MAX(price) AS max_24h,
  MIN(price) AS min_24h
FROM price_snapshots
WHERE timestamp >= $1
  AND timestamp <  $2
GROUP BY token_address
`;

const ONE_HOUR = 60 * 60 * 1000;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new TTLCache<string, any>(ONE_HOUR);

const K_MARKET = 'marketData:v1';
const K_POOL = (limit: number) => `poolSnapshots:v1:limit=${limit}`;

export const resolvers = {
  Query: {
    marketData: async () =>
      cache.get(K_MARKET, async () => {
        const { rows: basicMarketData } = await db.query(
          'SELECT * FROM market_data ORDER BY timestamp DESC LIMIT 1'
        );

        const nowMs = Date.now();
        const from24hMs = nowMs - 24 * 60 * 60 * 1000;
        const { rows: statsRows } = await db.query(STATS_24H_SQL, [from24hMs, nowMs]);

        const byToken: Record<string, { max_24h: number; min_24h: number }> = {};
        for (const r of statsRows) {
          byToken[r.token_address] = {
            max_24h: Number(r.max_24h ?? 0),
            min_24h: Number(r.min_24h ?? 0),
          };
        }

        const averageMax24h =
          Object.values(byToken).reduce((acc, { max_24h }) => acc + max_24h, 0) /
          Object.values(byToken).length;
        const averageMin24h =
          Object.values(byToken).reduce((acc, { min_24h }) => acc + min_24h, 0) /
          Object.values(byToken).length;

        return {
          ...basicMarketData[0],
          day_high_price: averageMax24h,
          day_low_price: averageMin24h,
          timestamp: Math.floor(basicMarketData[0].timestamp / 1000),
        };
      }),

    poolSnapshots: async (_: unknown, { limit = 1 }) =>
      cache.get(K_POOL(limit), async () => {
        const tokens = [POKT_BY_CHAIN.base, POKT_BY_CHAIN.ethereum, POKT_BY_CHAIN.solana];

        const [{ rows: poolRows }, { rows: statsRows }] = await Promise.all([
          db.query(COMBINED_POOL_SNAPSHOTS_SQL, [tokens, limit]),
          (() => {
            const nowMs = Date.now();
            const from24hMs = nowMs - 24 * 60 * 60 * 1000;
            return db.query(STATS_24H_SQL, [from24hMs, nowMs]);
          })(),
        ]);

        // Map helpers
        const latestByToken: Record<
          string,
          {
            average_price: number;
            avg_price_change_perc: number;
            pool_age: number;
            timestamp: number;
            token_address: string;
          }
        > = {};
        for (const r of poolRows) {
          // rn=1 row will naturally overwrite later ones; we only need the most recent per token
          if (!latestByToken[r.token_address]) {
            latestByToken[r.token_address] = { ...r, avg_price_change_perc: 0 };
          }
        }

        const { rows: prevStatsRows } = await (async () => {
          const nowMs = Date.now();
          const from48hMs = nowMs - 48 * 60 * 60 * 1000;
          const to24hMs = nowMs - 24 * 60 * 60 * 1000;
          return db.query(STATS_24H_SQL, [from48hMs, to24hMs]);
        })();

        const statsByToken: Record<
          string,
          { avg_24h: number; max_24h: number; min_24h: number; prev_avg_24h: number }
        > = {};
        for (const r of statsRows) {
          statsByToken[r.token_address] = {
            avg_24h: Number(r.avg_24h ?? 0),
            max_24h: Number(r.max_24h ?? 0),
            min_24h: Number(r.min_24h ?? 0),
            prev_avg_24h: 0,
          };
        }

        for (const r of prevStatsRows) {
          statsByToken[r.token_address].prev_avg_24h = Number(r.avg_24h ?? 0);
        }

        const baseRow = latestByToken[POKT_BY_CHAIN.base];
        const ethRow = latestByToken[POKT_BY_CHAIN.ethereum];
        const solRow = latestByToken[POKT_BY_CHAIN.solana];

        if (baseRow) {
          baseRow.average_price = statsByToken[POKT_BY_CHAIN.base]?.avg_24h ?? 0;
          baseRow.pool_age = POOL_CREATED_TIMESTAMP[Chain.BASE];
          baseRow.timestamp = Math.floor(baseRow.timestamp / 1000);

          const prevAverageprice = statsByToken[POKT_BY_CHAIN.base]?.prev_avg_24h ?? 0;
          if (prevAverageprice) {
            baseRow.avg_price_change_perc =
              (baseRow.average_price - prevAverageprice) / prevAverageprice;
          } else {
            baseRow.avg_price_change_perc = 0;
          }
        }
        if (ethRow) {
          ethRow.average_price = statsByToken[POKT_BY_CHAIN.ethereum]?.avg_24h ?? 0;
          ethRow.pool_age = POOL_CREATED_TIMESTAMP[Chain.ETHEREUM];
          ethRow.timestamp = Math.floor(ethRow.timestamp / 1000);

          const prevAverageprice = statsByToken[POKT_BY_CHAIN.ethereum]?.prev_avg_24h ?? 0;
          if (prevAverageprice) {
            ethRow.avg_price_change_perc =
              (ethRow.average_price - prevAverageprice) / prevAverageprice;
          } else {
            ethRow.avg_price_change_perc = 0;
          }
        }
        if (solRow) {
          solRow.average_price = statsByToken[POKT_BY_CHAIN.solana]?.avg_24h ?? 0;
          solRow.pool_age = POOL_CREATED_TIMESTAMP[Chain.SOLANA];
          solRow.timestamp = Math.floor(solRow.timestamp / 1000);

          const prevAverageprice = statsByToken[POKT_BY_CHAIN.solana]?.prev_avg_24h ?? 0;
          if (prevAverageprice) {
            solRow.avg_price_change_perc =
              (solRow.average_price - prevAverageprice) / prevAverageprice;
          } else {
            solRow.avg_price_change_perc = 0;
          }
        }

        return {
          base: baseRow,
          ethereum: ethRow,
          solana: solRow,
        };
      }),

    priceSnapshots: async (
      _: unknown,
      { interval, limit = 192 }: PoolArgs & { interval: '_15m' | '_30m' | '_1h' }
    ) => {
      const tokens = [POKT_BY_CHAIN.base, POKT_BY_CHAIN.ethereum, POKT_BY_CHAIN.solana];

      // Compute time window in ms for the requested number of buckets
      const nowMs = Date.now();
      const windowMinutes = limit * intervalToMultiplier[interval];
      const fromMs = nowMs - windowMinutes * 60 * 1000;
      const toMs = nowMs;

      // Run the heavy bucketed query with parallelism disabled for this statement only
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        await client.query('SET LOCAL max_parallel_workers_per_gather = 0');

        const { rows } = await client.query(COMBINED_PRICE_SNAPSHOTS_SQL, [
          tokens, // $1
          intervalToMultiplier[interval] + ' minutes', // $2 :: interval
          fromMs, // $3
          toMs, // $4
          limit, // $5
        ]);

        await client.query('COMMIT');

        // Split rows back into per-chain arrays and adjust timestamp rounding
        const baseRows = [];
        const ethRows = [];
        const solRows = [];

        for (const row of rows) {
          const roundedTs = roundTimestampToInterval(Number(row.timestamp), interval);
          const withRounded = { ...row, timestamp: roundedTs };
          if (row.token_address === POKT_BY_CHAIN.base) baseRows.push(withRounded);
          else if (row.token_address === POKT_BY_CHAIN.ethereum) ethRows.push(withRounded);
          else if (row.token_address === POKT_BY_CHAIN.solana) solRows.push(withRounded);
        }

        return {
          base: baseRows,
          ethereum: ethRows,
          solana: solRows,
        };
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    },
  },
};
