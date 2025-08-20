import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// --- Hoisted mocks so they apply before SUT import ---
vi.mock('../../../src/db/client', () => ({
  db: { query: vi.fn() },
}));
vi.mock('../../../src/utils/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

// Import SUT and mocks (after vi.mock so they’re replaced)
import { db } from '../../../src/db/client';
import { fetchMarketData } from '../../../src/fetchers/fetchMarketData';
import { logger } from '../../../src/utils/logger';

const NOW = Date.parse('2025-08-18T00:00:00Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(NOW));
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('fetchMarketData', () => {
  it('uses DB row when present; keeps high/low if price is between them', async () => {
    // DB returns prior ATH/ATL
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query as any).mockResolvedValue({
      rows: [{ all_time_high: 1.25, all_time_low: 0.1 }],
    });

    const out = await fetchMarketData(0.5, 1_000_000, 1234);

    // Called with the expected SQL
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((db.query as any).mock.calls[0][0]).toMatch(/SELECT \* FROM market_data/i);

    expect(out).toEqual({
      all_time_high: 1.25, // unchanged
      all_time_low: 0.1, // unchanged
      circulating_supply: 1_000_000,
      day_volume: 1234,
      market_cap: 500_000, // 1e6 * 0.5
      price: 0.5,
      timestamp: BigInt(NOW), // ms as BigInt
    });
  });

  it('updates all-time high when poktPrice exceeds stored high', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query as any).mockResolvedValue({
      rows: [{ all_time_high: 0.9, all_time_low: 0.4 }],
    });

    const out = await fetchMarketData(1.2, 10, 0);

    expect(out!.all_time_high).toBe(1.2); // updated
    expect(out!.all_time_low).toBe(0.4); // unchanged
    expect(out!.market_cap).toBeCloseTo(12); // 10 * 1.2
  });

  it('updates all-time low when poktPrice is below stored low', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query as any).mockResolvedValue({
      rows: [{ all_time_high: 1.5, all_time_low: 0.6 }],
    });

    const out = await fetchMarketData(0.5, 100, 0);

    expect(out!.all_time_high).toBe(1.5); // unchanged
    expect(out!.all_time_low).toBe(0.5); // updated
    expect(out!.market_cap).toBeCloseTo(50); // 100 * 0.5
  });

  it('falls back to ORIGINAL highs/lows if DB has no rows', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query as any).mockResolvedValue({ rows: [] });

    const out = await fetchMarketData(0.5, 1_000_000, 42);

    // Defaults are 3.1 high and 0.008747 low; price is between → unchanged
    expect(out!.all_time_high).toBe(3.1);
    expect(out!.all_time_low).toBe(0.008747);
    expect(out!.day_volume).toBe(42);
    expect(out!.timestamp).toBe(BigInt(NOW));
  });

  it('sanitizes non-finite DB values and still applies price rules', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query as any).mockResolvedValue({
      // Force NaN/Infinity to test fallback to ORIGINAL_* values
      rows: [{ all_time_high: Number.NaN, all_time_low: Number.POSITIVE_INFINITY }],
    });

    const out = await fetchMarketData(10, 2, 0); // price > default ATH (3.1) → becomes new ATH

    expect(out!.all_time_high).toBe(10); // replaced by price
    expect(out!.all_time_low).toBe(0.008747); // fallback default (price not < default ATL)
  });

  it('logs and rethrows when DB query fails', async () => {
    const err = new Error('db down');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query as any).mockRejectedValue(err);

    await expect(fetchMarketData(1, 1, 1)).rejects.toThrow('db down');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(logger.error as any).toHaveBeenCalledWith(
      expect.objectContaining({ error: err }),
      expect.stringMatching(/Error fetching market data/)
    );
  });
});
