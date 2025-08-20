import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---- Hoisted mocks (must come before importing the SUT) ----

// viem: only need formatUnits
vi.mock('viem', () => ({
  formatUnits: (v: bigint, d: number) => (Number(v) / Math.pow(10, d)).toString(),
}));

// Chains/config: provide addresses per chain
vi.mock('../../../src/utils/chains', () => {
  const Chain = { ETHEREUM: 'ethereum', BASE: 'base', SOLANA: 'solana' } as const;
  const ADDRESSES_BY_CHAIN = {
    [Chain.ETHEREUM]: {
      exchange: 'uniswap',
      poolAddress: '0xPOOL_ETH',
      wpokt: '0xWPOKT_ETH',
    },
    [Chain.BASE]: {
      exchange: 'aerodrome',
      poolAddress: '0xPOOL_BASE',
      wpokt: '0xWPOKT_BASE',
    },
    [Chain.SOLANA]: {
      exchange: 'orca',
      poolAddress: 'ORCA_POOL',
      wpokt: 'So11111111111111111111111111111111111111112',
    },
  } as const;
  return { Chain, ADDRESSES_BY_CHAIN };
});

// Logger: capture errors/warns
vi.mock('../../../src/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// retry: pass-through (you can make it simulate retries if needed)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const retryMock = vi.fn(async (fn: any) => await fn());

vi.mock('../../../src/utils/retry', () => ({
  // eslint-disable-next-line prefer-spread
  retry: (...args: unknown[]) => retryMock.apply(null, args),
}));

// Moralis: stub EVM + Solana holders
const moralisEvmGetTokenHolders = vi.fn();
const moralisSolGetTokenHolders = vi.fn();
vi.mock('../../../src/fetchers/moralisClient', () => ({
  moralisClient: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    evm: { getTokenHolders: (...a: any[]) => moralisEvmGetTokenHolders(...a) },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    solana: { getTokenHolders: (...a: any[]) => moralisSolGetTokenHolders(...a) },
  },
}));

// The Graph: stub per chain
const ethGetPoolStats = vi.fn();
const baseGetPoolStats = vi.fn();
vi.mock('../../../src/fetchers/theGraphClient', () => ({
  theGraphClient: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ethereum: { getPoolStats: (...a: any[]) => ethGetPoolStats(...a) },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    base: { getPoolStats: (...a: any[]) => baseGetPoolStats(...a) },
  },
}));

// Global fetch for Solana path
const fetchSpy = vi.fn();
globalThis.fetch = fetchSpy;

// ---- Import SUT after mocks ----
import { fetchPoolSnapshot } from '../../../src/fetchers/fetchPoolSnapshot';
import { Chain } from '../../../src/utils/chains';
import { logger } from '../../../src/utils/logger';

const SUPPLY_6DP = 5_000_000n * 1_000_000n; // 5,000,000 tokens with 6 decimals
const TS_MS = 1_800_000_000_000n; // arbitrary ms (seconds=1_800_000_000)
const BLOCK = 12345n;

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  // clean any fetch state between tests
  fetchSpy.mockReset();
});

describe('fetchPoolSnapshot – Ethereum', () => {
  it('computes tvl, market cap, volatility & volume using token1Price/reserveUSD', async () => {
    // Graph returns ETH-based stats
    ethGetPoolStats.mockResolvedValue({
      reserveUSD: '1000000', // $1,000,000 TVL
      token1Price: '0.00025', // WPOKT per ETH (or pair-derived) -> usd via nativeTokenPrice
      volumeETH: '50', // 50 ETH 24h
    });
    // Holders via Moralis (EVM/eth)
    moralisEvmGetTokenHolders.mockResolvedValue({ totalHolders: 1234 });

    const nativeTokenPrice = 2000; // ETH → $2000
    const out = await fetchPoolSnapshot(Chain.ETHEREUM, nativeTokenPrice, BLOCK, TS_MS, SUPPLY_6DP);

    expect(out).toBeDefined();
    expect(out!.chain).toBe(Chain.ETHEREUM);
    expect(out!.exchange).toBe('uniswap');
    expect(out!.pool_address).toBe('0xPOOL_ETH');
    expect(out!.token_address).toBe('0xWPOKT_ETH');
    expect(out!.block_number).toBe(BLOCK);
    expect(out!.timestamp).toBe(TS_MS);
    expect(out!.holders).toBe(1234);
    expect(out!.circulating_supply).toBe(5_000_000); // 5M = formatUnits(5e12, 6)

    // market_cap = token1Price * nativePrice * supply
    // 0.00025 * 2000 = 0.5 ; 0.5 * 5,000,000 = 2,500,000
    expect(out!.market_cap).toBeCloseTo(2_500_000, 6);

    // tvl_usd = reserveUSD
    expect(out!.tvl_usd).toBeCloseTo(1_000_000, 6);

    // volume_usd = volumeETH * nativePrice = 50 * 2000 = 100,000
    expect(out!.volume_usd).toBeCloseTo(100_000, 6);

    // volatility = volume_usd / reserveUSD = 0.1
    expect(out!.volatility).toBeCloseTo(0.1, 6);

    // Check theGraphClient args (ltDate = seconds - 86400)
    const seconds = Number(TS_MS) / 1000;
    const expectedLtDate = Math.floor(seconds) - 86400;
    expect(ethGetPoolStats).toHaveBeenCalledWith({
      poolAddress: '0xPOOL_ETH',
      blockNumber: BLOCK,
      ltDate: expectedLtDate,
    });

    // Ensure Moralis called with eth chainId
    expect(moralisEvmGetTokenHolders).toHaveBeenCalledWith({
      tokenAddress: '0xWPOKT_ETH',
      chainId: 'eth',
    });
  });
});

describe('fetchPoolSnapshot – Base', () => {
  it('computes tvl (token0*2), market cap from token0Price, and volatility', async () => {
    baseGetPoolStats.mockResolvedValue({
      token0Price: '0.0002',
      totalValueLockedToken0: '800', // token0 units
      volumeETH: '20',
    });
    moralisEvmGetTokenHolders.mockResolvedValue({ totalHolders: 222 });

    const nativeTokenPrice = 2000;
    const out = await fetchPoolSnapshot(Chain.BASE, nativeTokenPrice, BLOCK, TS_MS, SUPPLY_6DP);

    expect(out).toBeDefined();
    expect(out!.chain).toBe(Chain.BASE);
    expect(out!.exchange).toBe('aerodrome');
    expect(out!.holders).toBe(222);

    // tvlUsd = totalValueLockedToken0 * nativeTokenPrice * 2
    // 800 * 2000 * 2 = 3,200,000
    expect(out!.tvl_usd).toBeCloseTo(3_200_000, 6);

    // volumeUsd = volumeETH * nativeTokenPrice = 20 * 2000 = 40,000
    expect(out!.volume_usd).toBeCloseTo(40_000, 6);

    // volatility = 40,000 / 3,200,000 = 0.0125
    expect(out!.volatility).toBeCloseTo(0.0125, 6);

    // market_cap = token0Price * nativeTokenPrice * supply
    // 0.0002 * 2000 = 0.4 ; 0.4 * 5,000,000 = 2,000,000
    expect(out!.market_cap).toBeCloseTo(2_000_000, 6);

    // Moralis base call
    expect(moralisEvmGetTokenHolders).toHaveBeenCalledWith({
      tokenAddress: '0xWPOKT_BASE',
      chainId: 'base',
    });
  });
});

describe('fetchPoolSnapshot – Solana', () => {
  it('uses Orca pool API: reciprocal price, tvlUsdc, 24h volume; Moralis Solana holders', async () => {
    // fetch → Orca response
    fetchSpy.mockResolvedValue({
      json: async () => ({
        data: {
          price: '2', // reciprocal price
          tvlUsdc: '20000', // USD
          stats: { '24h': { volume: '1000' } },
        },
      }),
    });
    moralisSolGetTokenHolders.mockResolvedValue({ totalHolders: 3456 });

    const nativeTokenPrice = 100; // SOL USD price
    const out = await fetchPoolSnapshot(Chain.SOLANA, nativeTokenPrice, BLOCK, TS_MS, SUPPLY_6DP);

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('https://api.orca.so/v2/solana/pools/ORCA_POOL'),
      expect.objectContaining({ method: 'GET' })
    );

    // wPoktPrice = native / reciprocal = 100 / 2 = 50
    // market_cap = 50 * 5,000,000 = 250,000,000
    expect(out!.market_cap).toBeCloseTo(250_000_000, 6);

    // tvl_usd = tvlUsdc
    expect(out!.tvl_usd).toBeCloseTo(20_000, 6);

    // volume_usd = stats['24h'].volume
    expect(out!.volume_usd).toBeCloseTo(1_000, 6);

    // volatility = 1000 / 20000 = 0.05
    expect(out!.volatility).toBeCloseTo(0.05, 6);

    expect(out!.holders).toBe(3456);
    expect(out!.token_address).toBe('So11111111111111111111111111111111111111112');
  });

  it('throws when Orca price missing', async () => {
    fetchSpy.mockResolvedValue({ json: async () => ({ data: {} }) });
    moralisSolGetTokenHolders.mockResolvedValue({ totalHolders: 1 });

    await expect(fetchPoolSnapshot(Chain.SOLANA, 1, BLOCK, TS_MS, SUPPLY_6DP)).rejects.toThrow(
      /Failed to fetch price from Solana pool/
    );
  });
});

describe('fetchPoolSnapshot – error handling', () => {
  it('throws and logs when Graph returns falsy (Ethereum)', async () => {
    ethGetPoolStats.mockResolvedValue(undefined);
    moralisEvmGetTokenHolders.mockResolvedValue({ totalHolders: 1 });

    await expect(fetchPoolSnapshot(Chain.ETHEREUM, 1, BLOCK, TS_MS, SUPPLY_6DP)).rejects.toThrow(
      /Failed to fetch pool stats/
    );

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(Error) }),
      expect.stringMatching(/Error fetching pool snapshot/)
    );
  });

  it('throws for unsupported chain', async () => {
    // @ts-expect-error force invalid chain in test
    await expect(fetchPoolSnapshot('bogus', 1, BLOCK, TS_MS, SUPPLY_6DP)).rejects.toThrow(
      /Unsupported chain: bogus/
    );
  });
});
