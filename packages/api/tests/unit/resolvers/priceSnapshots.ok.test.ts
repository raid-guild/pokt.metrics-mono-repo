import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/db', () => ({ db: { query: vi.fn(), connect: vi.fn() } }));
import { db } from '../../../src/db';
import { resolvers } from '../../../src/resolvers';

const NOW = Date.parse('2025-08-18T00:00:00Z');

describe('Query.priceSnapshots (ok)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
    vi.clearAllMocks();
  });

  it('wraps query in a transaction, computes window, and splits/rounds rows', async () => {
    // Prepare a reusable fake client we can assert against:
    const fakeClient = {
      query: vi.fn(),
      release: vi.fn(),
    };

    // sequence: BEGIN -> SET LOCAL -> MAIN SQL -> COMMIT
    fakeClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({}) // SET LOCAL max_parallel_workers_per_gather = 0
      .mockResolvedValueOnce({
        rows: [
          {
            token_address: '0x764a726d9ced0433a8d7643335919deb03a9a935',
            timestamp: NOW - 5 * 60_000,
            bucket: new Date(NOW - 15 * 60_000),
            price: 0.1,
            pool_address: '0xP',
            chain: 'base',
            exchange: 'aerodrome',
          },
          {
            token_address: '0x67f4c72a50f8df6487720261e188f2abe83f57d7',
            timestamp: NOW - 10 * 60_000,
            bucket: new Date(NOW - 15 * 60_000),
            price: 0.2,
            pool_address: '0xP',
            chain: 'ethereum',
            exchange: 'aerodrome',
          },
          {
            token_address: '6CAsXfiCXZfP8APCG6Vma2DFMindopxiqYQN4LSQfhoC',
            timestamp: NOW - 14 * 60_000,
            bucket: new Date(NOW - 15 * 60_000),
            price: 0.3,
            pool_address: '0xP',
            chain: 'solana',
            exchange: 'aerodrome',
          },
        ],
      })
      .mockResolvedValueOnce({}); // COMMIT

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.connect as any).mockResolvedValue(fakeClient);

    const limit = 2;
    const interval = '_15m' as const;
    const out: {
      base: Array<{ timestamp: number }>;
      ethereum: Array<{ timestamp: number }>;
      solana: Array<{ timestamp: number }>;
    } = await resolvers.Query.priceSnapshots({}, { interval, limit });

    // Assert the third call (main SQL) params
    const mainCall = fakeClient.query.mock.calls[2];
    const params = mainCall[1];

    const expectedFrom = NOW - limit * 15 * 60_000; // 2 * 15m
    const expectedTo = NOW;

    expect(params[1]).toBe('15 minutes'); // $2 interval
    expect(params[2]).toBe(expectedFrom); // $3 fromMs
    expect(params[3]).toBe(expectedTo); // $4 toMs
    expect(params[4]).toBe(limit); // $5 limit

    // Transaction + release occurred
    expect(fakeClient.query.mock.calls[0][0]).toBe('BEGIN');
    expect(fakeClient.query.mock.calls[1][0]).toMatch(/SET LOCAL/i);
    expect(fakeClient.query.mock.calls[3][0]).toBe('COMMIT');
    expect(fakeClient.release).toHaveBeenCalled();

    // Spot-check rounded timestamps
    const roundTo15mSec = (ms: number) => Math.round(ms / (15 * 60_000)) * (15 * 60);
    expect(out.base[0].timestamp).toBe(roundTo15mSec(NOW - 5 * 60_000));
    expect(out.ethereum[0].timestamp).toBe(roundTo15mSec(NOW - 10 * 60_000));
    expect(out.solana[0].timestamp).toBe(roundTo15mSec(NOW - 14 * 60_000));
  });
});
