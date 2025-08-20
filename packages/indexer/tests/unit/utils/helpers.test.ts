import { beforeEach, describe, expect, it, vi } from 'vitest';

// --- Mocks (hoisted) ---
vi.mock('viem', () => {
  const createPublicClient = vi.fn();
  const http = vi.fn((url: string) => ({ url }));
  return { createPublicClient, http };
});
vi.mock('viem/chains', () => ({
  base: { id: 8453, name: 'base' },
  mainnet: { id: 1, name: 'mainnet' },
}));
vi.mock('@solana/web3.js', () => ({
  Connection: vi.fn().mockImplementation(() => ({})),
}));

// helpers to get the mocked viem functions
const getViemMocks = async () => {
  const viem = await import('viem');
  return {
    createPublicClient: viem.createPublicClient as unknown as ReturnType<typeof vi.fn>,
    http: viem.http as unknown as ReturnType<typeof vi.fn>,
  };
};

const setEnv = () => {
  process.env.ETHEREUM_RPC_URL = 'http://localhost:1111';
  process.env.BASE_RPC_URL = 'http://localhost:2222';
  process.env.SOLANA_RPC_URL = 'http://localhost:3333';
};

beforeEach(async () => {
  vi.clearAllMocks();
  vi.resetModules();
  setEnv();
});

describe('isSignificantlyDifferent', () => {
  it('returns false when |a - b| ≤ epsilon and true when > epsilon', async () => {
    const { isSignificantlyDifferent } = await import('../../../src/utils/helpers'); // <-- adjust path if needed
    expect(isSignificantlyDifferent(1, 1)).toBe(false);
    expect(isSignificantlyDifferent(1, 1.0000005)).toBe(false); // < default epsilon
    expect(isSignificantlyDifferent(1, 1.000001)).toBe(false); // = default epsilon
    expect(isSignificantlyDifferent(1, 1.000002)).toBe(true); // > default epsilon
    expect(isSignificantlyDifferent(10, 9.999998, 1e-6)).toBe(true);
  });
});

describe('getHourlyBlocks (Base)', () => {
  it('computes hourly blocks using 2s block time and returns ms timestamps (bigint)', async () => {
    const { createPublicClient } = await getViemMocks();

    // Two distinct clients are created at module import:
    //  - first for Ethereum
    //  - second for Base
    const fakeEthClient = { getBlock: vi.fn() };
    const fakeBaseClient = {
      getBlock: vi.fn().mockImplementation(async ({ blockNumber }: { blockNumber: bigint }) => {
        // seconds = t0 + 2 * (bn - start)
        const t0 = 1_700_000_000n;
        const start = 1000n;
        return { timestamp: t0 + 2n * (blockNumber - start) }; // seconds as bigint
      }),
    };

    createPublicClient
      .mockReturnValueOnce(fakeEthClient) // ethereumClient (unused in this test)
      .mockReturnValueOnce(fakeBaseClient); // baseClient

    const { getHourlyBlocks } = await import('../../../src/utils/helpers'); // imports after mocks are configured

    const startBlock = 1000n;
    const endBlock = 4600n; // 3600 blocks later → 7200 seconds later with 2s blocks
    const out = await getHourlyBlocks('Base', startBlock, endBlock, 3600);

    // Expect 3 points: t0, t0+3600, t0+7200  → blocks 1000, 2800, 4600
    expect(out.map((x) => x.blockNumber)).toEqual([1000n, 2800n, 4600n]);
    // Timestamps are milliseconds (bigint)
    const t0ms = 1_700_000_000n * 1000n;
    expect(out.map((x) => x.blockTimestamp)).toEqual([
      t0ms,
      1_700_003_600n * 1000n,
      1_700_007_200n * 1000n,
    ]);

    // Ensure getBlock was asked for those exact blocks at least once
    expect(fakeBaseClient.getBlock).toHaveBeenCalledWith({ blockNumber: 1000n });
    expect(fakeBaseClient.getBlock).toHaveBeenCalledWith({ blockNumber: 2800n });
    expect(fakeBaseClient.getBlock).toHaveBeenCalledWith({ blockNumber: 4600n });
  });
});

describe('getHourlyBlocks (Ethereum)', () => {
  it('uses 12s block time (approx) and still finds hourly buckets', async () => {
    const { createPublicClient } = await getViemMocks();

    // Mock Ethereum client to simulate 12s blocks from a base height
    const fakeEthClient = {
      getBlock: vi.fn().mockImplementation(async ({ blockNumber }: { blockNumber: bigint }) => {
        const t0 = 1_800_000_000n; // seconds
        const start = 1000n;
        return { timestamp: t0 + 12n * (blockNumber - start) }; // seconds
      }),
    };
    const fakeBaseClient = { getBlock: vi.fn() };

    createPublicClient
      .mockReturnValueOnce(fakeEthClient) // ethereumClient
      .mockReturnValueOnce(fakeBaseClient); // baseClient (unused here)

    const { getHourlyBlocks } = await import('../../../src/utils/helpers');

    const startBlock = 1000n;
    const endBlock = 1600n; // 600 blocks → 600*12=7200 seconds
    const out = await getHourlyBlocks('Ethereum', startBlock, endBlock, 3600);

    // 3 points → blocks 1000, 1300, 1600
    expect(out.map((x) => x.blockNumber)).toEqual([1000n, 1300n, 1600n]);

    const t0ms = 1_800_000_000n * 1000n;
    expect(out.map((x) => x.blockTimestamp)).toEqual([
      t0ms,
      1_800_003_600n * 1000n,
      1_800_007_200n * 1000n,
    ]);
  });
});

describe('getHourlyBlocks (errors & not-implemented)', () => {
  it('throws for Solana (not implemented)', async () => {
    const { createPublicClient } = await getViemMocks();
    // still need two returns because the module creates two clients on import
    createPublicClient
      .mockReturnValueOnce({ getBlock: vi.fn() })
      .mockReturnValueOnce({ getBlock: vi.fn() });

    const { getHourlyBlocks } = await import('../../../src/utils/helpers');
    await expect(getHourlyBlocks('Solana', 1n, 2n)).rejects.toThrow(
      'Solana hourly blocks not implemented'
    );
  });

  it('surfaces getBlock errors via wrapped message', async () => {
    const { createPublicClient } = await getViemMocks();

    // Make startBlock call fail (getBlockTimestamp path)
    const failingEth = {
      getBlock: vi.fn().mockRejectedValue(new Error('boom')),
    };
    const dummyBase = { getBlock: vi.fn() };

    createPublicClient
      .mockReturnValueOnce(failingEth) // ethereumClient (we'll call Ethereum)
      .mockReturnValueOnce(dummyBase);

    const { getHourlyBlocks } = await import('../../../src/utils/helpers');

    await expect(getHourlyBlocks('Ethereum', 1n, 2n)).rejects.toThrow(/Failed to fetch block 1/);
  });
});

describe('module env guards', () => {
  it('throws if required RPC envs are missing at import time', async () => {
    vi.resetModules();
    delete process.env.ETHEREUM_RPC_URL;
    delete process.env.BASE_RPC_URL;
    delete process.env.SOLANA_RPC_URL;

    await expect(import('../../../src/utils/helpers')).rejects.toThrow(/ETHEREUM_RPC_URL/);

    // restore for other tests
    setEnv();
  });
});
