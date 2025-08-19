import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/db', () => ({ db: { query: vi.fn(), connect: vi.fn() } }));

import { db } from '../../../src/db';
import { resolvers } from '../../../src/resolvers';

describe('Query.marketData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns latest market_data row enhanced with avg high/low over 24h and seconds timestamp', async () => {
    // 1) latest market_data row (timestamp in ms)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query as any).mockResolvedValueOnce({
      rows: [
        {
          market_cap: 123,
          price: 0.5,
          timestamp: 1_754_990_000_000, // ms
        },
      ],
    });

    // 2) 24h stats per token (any two tokens is enough for averaging)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.query as any).mockResolvedValueOnce({
      rows: [
        { token_address: '0xBASE', avg_24h: 0.4, max_24h: 0.6, min_24h: 0.3 },
        { token_address: '0xETH', avg_24h: 0.5, max_24h: 0.7, min_24h: 0.25 },
      ],
    });

    const out = await resolvers.Query.marketData();

    // average of maxes: (0.6+0.7)/2 = 0.65
    // average of mins:  (0.3+0.25)/2 = 0.275
    expect(out.day_high_price).toBeCloseTo(0.65, 12);
    expect(out.day_low_price).toBeCloseTo(0.275, 12);

    expect(out.market_cap).toBe(123);
    expect(out.price).toBe(0.5);
    expect(out.timestamp).toBe(Math.floor(1_754_990_000_000 / 1000));

    // first call: market_data; second call: stats
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((db.query as any).mock.calls[0][0]).toMatch(/SELECT \* FROM market_data/i);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((db.query as any).mock.calls[1][0]).toMatch(/SELECT\s+token_address,\s+AVG\(price\)/i);
  });
});
