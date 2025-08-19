import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/db', () => ({ db: { query: vi.fn(), connect: vi.fn() } }));
import { db } from '../../../src/db';
import { resolvers } from '../../../src/resolvers';

describe('Query.priceSnapshots (error handling)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('ROLLBACKs on error and always releases the client', async () => {
    const begin = vi.fn().mockResolvedValue({});
    const setLocal = vi.fn().mockResolvedValue({});
    const mainQuery = vi.fn().mockRejectedValue(new Error('boom'));
    const rollback = vi.fn().mockResolvedValue({});
    const release = vi.fn();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.connect as any).mockResolvedValue({
      query: vi
        .fn()
        .mockImplementationOnce(begin)
        .mockImplementationOnce(setLocal)
        .mockImplementationOnce(mainQuery)
        .mockImplementationOnce(rollback), // expect ROLLBACK after throw
      release,
    });

    await expect(
      resolvers.Query.priceSnapshots({}, { interval: '_15m', limit: 1 })
    ).rejects.toThrow('boom');

    expect(begin).toHaveBeenCalled();
    expect(rollback).toHaveBeenCalled();
    expect(release).toHaveBeenCalled();
  });
});
