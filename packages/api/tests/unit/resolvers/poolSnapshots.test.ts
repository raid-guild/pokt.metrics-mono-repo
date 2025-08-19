import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/db', () => ({ db: { query: vi.fn(), connect: vi.fn() } }));
import { db } from '../../../src/db';
import { resolvers } from '../../../src/resolvers';

describe('Query.poolSnapshots', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns latest per-token rows with avg_24h injected, pool_age set, and timestamps in seconds', async () => {
    // Promise.all -> first call: pool snapshots; second call: 24h stats
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query as any)
      .mockResolvedValueOnce({
        rows: [
          // Ordered by token_address, timestamp DESC (latest first by token)
          {
            token_address: '0x764a726d9ced0433a8d7643335919deb03a9a935', // BASE
            pool_address: '0xpoolB',
            average_price: 0, // will be overwritten by avg_24h
            pool_age: 0, // will be overwritten
            timestamp: 1_754_998_299_000, // ms -> expect floor / 1000 in resolver
            rn: 1,
          },
          {
            token_address: '0x67f4c72a50f8df6487720261e188f2abe83f57d7', // ETH
            pool_address: '0xpoolE',
            average_price: 0,
            pool_age: 0,
            timestamp: 1_754_998_200_000,
            rn: 1,
          },
          {
            token_address: '6CAsXfiCXZfP8APCG6Vma2DFMindopxiqYQN4LSQfhoC', // SOL
            pool_address: '0xpoolS',
            average_price: 0,
            pool_age: 0,
            timestamp: 1_754_998_100_000,
            rn: 1,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            token_address: '0x764a726d9ced0433a8d7643335919deb03a9a935',
            avg_24h: 0.41,
            max_24h: 0,
            min_24h: 0,
          },
          {
            token_address: '0x67f4c72a50f8df6487720261e188f2abe83f57d7',
            avg_24h: 0.52,
            max_24h: 0,
            min_24h: 0,
          },
          {
            token_address: '6CAsXfiCXZfP8APCG6Vma2DFMindopxiqYQN4LSQfhoC',
            avg_24h: 0.63,
            max_24h: 0,
            min_24h: 0,
          },
        ],
      });

    const res = await resolvers.Query.poolSnapshots({}, { limit: 1 });

    // timestamp should be seconds; pool_age should come from constants in your resolver
    expect(res.base).toMatchObject({
      average_price: 0.41,
      pool_address: '0xpoolB',
      timestamp: Math.floor(1_754_998_299_000 / 1000),
      pool_age: 1724361475,
    });
    expect(res.ethereum).toMatchObject({
      average_price: 0.52,
      pool_address: '0xpoolE',
      timestamp: Math.floor(1_754_998_200_000 / 1000),
      pool_age: 1696841963,
    });
    expect(res.solana).toMatchObject({
      average_price: 0.63,
      pool_address: '0xpoolS',
      timestamp: Math.floor(1_754_998_100_000 / 1000),
      pool_age: 1724398200,
    });

    // Ensure the two queries executed in expected order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((db.query as any).mock.calls[0][0]).toMatch(/FROM\s+pool_snapshots/i);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((db.query as any).mock.calls[1][0]).toMatch(/AVG\(price\)\s+AS\s+avg_24h/i);
  });
});
