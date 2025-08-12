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

const POOL_CREATED_TIMESTAMP: Record<Chain, number> = {
  [Chain.BASE]: 1724361475,
  [Chain.ETHEREUM]: 1696841963,
  [Chain.SOLANA]: 1724398200,
};

const PRICE_SNAPSHOTS_QUERY = `
  SELECT
    time_bucket($2, to_timestamp(timestamp / 1000.0)) AS bucket,
    AVG(price) AS price,
    MIN(timestamp) AS timestamp,
    token_address,
    pool_address,
    chain,
    exchange
  FROM price_snapshots
  WHERE token_address = $1
  GROUP BY bucket, token_address, pool_address, chain, exchange
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

const DAY_HIGH_PRICE_QUERY = `
  SELECT
    MAX(price) AS day_high_price
  FROM price_snapshots
  WHERE token_address = $1
    AND to_timestamp(timestamp / 1000.0) >= NOW() - INTERVAL '24 hours'
`;

const DAY_LOW_PRICE_QUERY = `
  SELECT
    MIN(price) AS day_low_price
  FROM price_snapshots
  WHERE token_address = $1
    AND to_timestamp(timestamp / 1000.0) >= NOW() - INTERVAL '24 hours'
`;

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

export const resolvers = {
  Query: {
    marketData: async () => {
      const { rows: basicMarketData } = await db.query(
        'SELECT * FROM market_data ORDER BY timestamp DESC LIMIT 1'
      );

      const { rows: dayHighPriceRows } = await db.query(DAY_HIGH_PRICE_QUERY, [
        POKT_BY_CHAIN.ethereum,
      ]);
      const dayHighPrice = dayHighPriceRows[0]?.day_high_price ?? 0;

      const { rows: dayLowPriceRows } = await db.query(DAY_LOW_PRICE_QUERY, [
        POKT_BY_CHAIN.ethereum,
      ]);
      const dayLowPrice = dayLowPriceRows[0]?.day_low_price ?? 0;

      const enhancedMarketData = {
        ...basicMarketData[0],
        day_high_price: dayHighPrice,
        day_low_price: dayLowPrice,
      };
      return enhancedMarketData;
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
        ethereumRows[0].pool_age = POOL_CREATED_TIMESTAMP[Chain.ETHEREUM];
        ethereumRows[0].timestamp = Math.floor(ethereumRows[0].timestamp / 1000);
      }

      const { rows: baseRows } = await db.query(POOL_SNAPSHOTS_QUERY, [POKT_BY_CHAIN.base, limit]);
      const { rows: averageBasePriceRows } = await db.query(AVERAGE_PRICE_QUERY, [
        POKT_BY_CHAIN.base,
      ]);
      const averageBasePrice = averageBasePriceRows[0]?.average_price ?? 0;
      if (baseRows.length > 0) {
        baseRows[0].average_price = averageBasePrice;
        baseRows[0].pool_age = POOL_CREATED_TIMESTAMP[Chain.BASE];
        baseRows[0].timestamp = Math.floor(baseRows[0].timestamp / 1000);
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
        solanaRows[0].pool_age = POOL_CREATED_TIMESTAMP[Chain.SOLANA];
        solanaRows[0].timestamp = Math.floor(solanaRows[0].timestamp / 1000);
      }

      return {
        base: baseRows[0],
        ethereum: ethereumRows[0],
        solana: solanaRows[0],
      };
    },
    priceSnapshots: async (
      _: unknown,
      { interval, limit = 192 }: PoolArgs & { interval: '_15m' | '_30m' | '_1h' }
    ) => {
      let params = [POKT_BY_CHAIN.base, interval, limit];
      const { rows: baseRows } = await db.query(PRICE_SNAPSHOTS_QUERY, params);

      params = [POKT_BY_CHAIN.ethereum, interval, limit];
      const { rows: ethereumRows } = await db.query(PRICE_SNAPSHOTS_QUERY, params);

      params = [POKT_BY_CHAIN.solana, interval, limit];
      const { rows: solanaRows } = await db.query(PRICE_SNAPSHOTS_QUERY, params);

      return {
        base: baseRows.map((row) => ({
          ...row,
          timestamp: roundTimestampToInterval(row.timestamp, interval),
        })),
        ethereum: ethereumRows.map((row) => ({
          ...row,
          timestamp: roundTimestampToInterval(row.timestamp, interval),
        })),
        solana: solanaRows.map((row) => ({
          ...row,
          timestamp: roundTimestampToInterval(row.timestamp, interval),
        })),
      };
    },
  },
};
