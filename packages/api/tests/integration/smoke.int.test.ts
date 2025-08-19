import pg from 'pg';
import request from 'supertest';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

let dbC: StartedTestContainer;
let dbUrl: string;

const startTimescale = async () => {
  dbC = await new GenericContainer('timescale/timescaledb:2.14.2-pg16')
    .withEnvironment({
      POSTGRES_PASSWORD: 'test',
      POSTGRES_DB: 'pokt',
      POSTGRES_USER: 'postgres',
    })
    .withExposedPorts(5432)
    .start();

  dbUrl = `postgres://postgres:test@${dbC.getHost()}:${dbC.getMappedPort(5432)}/pokt`;
  process.env.DATABASE_NAME = 'pokt';
  process.env.DATABASE_PORT = dbC.getMappedPort(5432).toString();
  process.env.DATABASE_HOST = 'localhost';
  process.env.DATABASE_PASSWORD = 'test';
  process.env.DATABASE_USER = 'postgres';

  const pool = new pg.Pool({ connectionString: dbUrl });
  await pool.query(`CREATE EXTENSION IF NOT EXISTS timescaledb;`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS market_data (
      all_time_high NUMERIC(30, 12) NOT NULL,
      all_time_low NUMERIC(30, 12) NOT NULL,
      circulating_supply NUMERIC(30, 12) NOT NULL,
      day_volume NUMERIC(30, 12) NOT NULL,
      market_cap NUMERIC(30, 12) NOT NULL,
      price NUMERIC(30, 12) NOT NULL,
      timestamp BIGINT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS price_snapshots (
      block_number BIGINT NOT NULL,
      chain TEXT NOT NULL,
      exchange TEXT NOT NULL,
      pool_address TEXT NOT NULL,
      price NUMERIC(30, 12) NOT NULL,
      timestamp BIGINT NOT NULL,
      token_address TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS pool_snapshots (
      block_number BIGINT NOT NULL,
      chain TEXT NOT NULL,
      circulating_supply NUMERIC(30, 12) NOT NULL,
      exchange TEXT NOT NULL,
      holders NUMERIC(30, 12) NOT NULL,
      market_cap NUMERIC(30, 12) NOT NULL,
      pool_address TEXT NOT NULL,
      timestamp BIGINT NOT NULL,
      token_address TEXT NOT NULL,
      tvl_usd NUMERIC(30, 12) NOT NULL,
      volatility NUMERIC(30, 12) NOT NULL,
      volume_usd NUMERIC(30, 12) NOT NULL
    );
  `);
  await pool.end();
};

// async function stopTimescale() {
//   await dbC?.stop();
// }

const resetTables = async () => {
  const pool = new pg.Pool({ connectionString: dbUrl });
  await pool.query(`TRUNCATE market_data, price_snapshots, pool_snapshots;`);
  await pool.end();
};

const seedMarketAndPrices = async (nowMs: number) => {
  const pool = new pg.Pool({ connectionString: dbUrl });
  await pool.query(
    `INSERT INTO market_data (all_time_high, all_time_low, circulating_supply, day_volume, market_cap, price, timestamp) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [12.3, 1.0, 10.0, 50.0, 200.0, 0.5, nowMs]
  );
  const oneHour = 60 * 60 * 1000;
  await pool.query(
    `
      INSERT INTO price_snapshots (block_number, chain, exchange, pool_address, price, timestamp, token_address)
      VALUES
      (3234234, 'base', 'aerodrome', '0xP', 1.60, $1, '0x764a726d9ced0433a8d7643335919deb03a9a935'),
      (3234232, 'base', 'aerodrome', '0xP', 1.50, $2, '0x764a726d9ced0433a8d7643335919deb03a9a935'),
      (3234231, 'ethereum', 'aerodrome', '0xP', 1.55, $3, '0x67f4c72a50f8df6487720261e188f2abe83f57d7'),
      (3234434, 'solana', 'orca', '0xP', 1.49, $4, '6CAsXfiCXZfP8APCG6Vma2DFMindopxiqYQN4LSQfhoC')
    `,
    [nowMs - 1 * oneHour, nowMs - 1.5 * oneHour, nowMs - 70 * 60 * 1000, nowMs - 100 * 60 * 1000]
  );
  await pool.end();
};

const seedPools = async (nowMs: number) => {
  const pool = new pg.Pool({ connectionString: dbUrl });
  await pool.query(
    `
    INSERT INTO pool_snapshots (block_number, chain, circulating_supply, exchange, holders, market_cap, pool_address, timestamp, token_address, tvl_usd, volatility, volume_usd) VALUES
    (3234234,'base',123,'aerodrome',20,234,'0xpoolB',$1,'0x764a726d9ced0433a8d7643335919deb03a9a935',0,0,0),
    (3234234,'base',123,'aerodrome',20,234,'0xpoolB_old',$2,'0x764a726d9ced0433a8d7643335919deb03a9a935',0,0,0),
    (3234234,'ethereum',123,'aerodrome',20,234,'0xpoolE',$3,'0x67f4c72a50f8df6487720261e188f2abe83f57d7',0,0,0),
    (3234234,'ethereum',123,'aerodrome',20,234,'0xpoolE_old',$4,'0x67f4c72a50f8df6487720261e188f2abe83f57d7',0,0,0),
    (3234234,'solana',123,'aerodrome',20,234,'0xpoolS',$5,'6CAsXfiCXZfP8APCG6Vma2DFMindopxiqYQN4LSQfhoC',0,0,0),
    (3234234,'solana',123,'aerodrome',20,234,'0xpoolS_old',$6,'6CAsXfiCXZfP8APCG6Vma2DFMindopxiqYQN4LSQfhoC',0,0,0)
  `,
    [
      nowMs,
      nowMs - 5 * 60 * 1000,
      nowMs - 2 * 60 * 1000,
      nowMs - 6 * 60 * 1000,
      nowMs - 3 * 60 * 1000,
      nowMs - 7 * 60 * 1000,
    ]
  );
  await pool.end();
};

const seedPricesForBuckets = async (nowMs: number) => {
  const pool = new pg.Pool({ connectionString: dbUrl });
  const t = (min: number) => nowMs - min * 60 * 1000;
  await pool.query(
    `
    INSERT INTO price_snapshots (block_number, chain, exchange, pool_address, price, timestamp, token_address)
    VALUES
    (3234234, 'base', 'aerodrome', '0xP', 1.60, $1, '0x764a726d9ced0433a8d7643335919deb03a9a935'),
    (3234234, 'base', 'aerodrome', '0xP', 1.30, $2, '0x764a726d9ced0433a8d7643335919deb03a9a935'),
    (3234234, 'ethereum', 'aerodrome', '0xP', 1.70, $3, '0x67f4c72a50f8df6487720261e188f2abe83f57d7'),
    (3234234, 'ethereum', 'aerodrome', '0xP', 1.25, $4, '0x67f4c72a50f8df6487720261e188f2abe83f57d7'),
    (3234234, 'solana', 'orca', '0xP', 1.70, $5, '6CAsXfiCXZfP8APCG6Vma2DFMindopxiqYQN4LSQfhoC'),
    (3234234, 'solana', 'orca', '0xP', 1.25, $6, '6CAsXfiCXZfP8APCG6Vma2DFMindopxiqYQN4LSQfhoC')
  `,
    [t(5), t(20), t(6), t(21), t(7), t(22)]
  );
  await pool.end();
};

// Build your server without binding to a port; delay imports until after env is set.
const buildApp = async () => {
  const express = (await import('express')).default;
  const { ApolloServer } = await import('apollo-server-express');
  const { typeDefs } = await import('../../src/schema');
  const { resolvers } = await import('../../src/resolvers');
  const app = express();
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });
  return app;
};

const NOW = Date.now();

beforeAll(async () => {
  await startTimescale();
}, 180_000); // 3 min
// TODO: Maybe bring back later. This is causing GraphQL connection issues
// afterAll(async () => {
//   await stopTimescale();
// }, 60_000);
beforeEach(async () => {
  await resetTables();
}, 60_000);

describe('API smoke integration', () => {
  it('marketData: computes 24h avg high/low; timestamp in seconds', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
    await seedMarketAndPrices(NOW);
    const app = await buildApp();

    const res = await request(app).post('/graphql').send({
      query: `query { marketData { market_cap price day_high_price day_low_price timestamp } }`,
    });

    expect(res.status).toBe(200);
    const d = res.body.data.marketData;
    expect(Number(d.price)).toBeCloseTo(0.5, 6);
    expect(Number(d.day_high_price)).toBeCloseTo(1.5466666666666669, 6);
    expect(Number(d.day_low_price)).toBeCloseTo(1.5133333333333334, 6);
    expect(d.timestamp).toBe(Math.floor(NOW / 1000));
    vi.useRealTimers();
  });

  it('poolSnapshots: uses latest per token, injects avg_24h, ms→s, sets pool_age', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
    await seedPools(NOW);
    await seedMarketAndPrices(NOW); // provides avg_24h inputs
    const app = await buildApp();

    const res = await request(app)
      .post('/graphql')
      .send({
        query: `query {
          poolSnapshots {
            base { pool_address average_price pool_age timestamp }
            ethereum { pool_address average_price pool_age timestamp }
            solana { pool_address average_price pool_age timestamp }
          }
        }`,
      });

    expect(res.status).toBe(200);
    const d = res.body.data.poolSnapshots;
    expect(d.base.pool_address).toBe('0xpoolB');
    expect(Number(d.base.average_price)).toBeCloseTo(1.55, 6);
    expect(d.base.pool_age).toBe(1724361475);
    expect(d.ethereum.pool_address).toBe('0xpoolE');
    expect(Number(d.ethereum.average_price)).toBeCloseTo(1.55, 6);
    expect(d.ethereum.pool_age).toBe(1696841963);
    expect(d.solana.pool_address).toBe('0xpoolS');
    expect(Number(d.solana.average_price)).toBeCloseTo(1.49, 6);
    expect(d.solana.pool_age).toBe(1724398200);
    vi.useRealTimers();
  });

  it('priceSnapshots: returns ≤limit buckets per chain with 15m rounding (900s multiples)', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
    await seedPricesForBuckets(NOW);
    const app = await buildApp();

    const res = await request(app)
      .post('/graphql')
      .send({
        query: `query($interval: Interval!){
          priceSnapshots(interval: $interval){
            base { timestamp price }
            ethereum { timestamp price }
            solana { timestamp price }
          }
        }`,
        variables: { interval: '_15m' },
      });

    expect(res.status).toBe(200);
    const d = res.body.data.priceSnapshots;
    const is900Multiple = (s: number) => s % 900 === 0;

    expect(d.base.length).toBeLessThanOrEqual(2);
    expect(d.ethereum.length).toBeLessThanOrEqual(2);
    expect(d.solana.length).toBeLessThanOrEqual(2);
    expect(is900Multiple(d.base[0].timestamp)).toBe(true);
    expect(is900Multiple(d.ethereum[0].timestamp)).toBe(true);
    expect(is900Multiple(d.solana[0].timestamp)).toBe(true);
    vi.useRealTimers();
  });
});
