const {
  errorMock,
  warnMock,
  retryMock,
  graphRequestMock,
  moralisEvmGetTokenHolders,
  moralisSolGetTokenHolders,
} = vi.hoisted(() => ({
  errorMock: vi.fn(),
  warnMock: vi.fn(),
  retryMock: vi.fn(async <T>(fn: () => Promise<T> | T) => await fn()),
  graphRequestMock: vi.fn(),
  moralisEvmGetTokenHolders: vi.fn(),
  moralisSolGetTokenHolders: vi.fn(),
}));

vi.mock('../../../src/utils/logger', () => ({
  logger: {
    error: errorMock,
    warn: warnMock,
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../../src/utils/retry', () => ({
  retry: retryMock, // no spread args = no TS tuple issue
}));

vi.mock('graphql-request', () => ({
  gql: (tpl: TemplateStringsArray) => tpl[0],
  request: graphRequestMock,
}));

vi.mock('../../../src/fetchers/moralisClient', () => ({
  moralisClient: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    evm: { getTokenHolders: (...a: any[]) => moralisEvmGetTokenHolders(...a) },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    solana: { getTokenHolders: (...a: any[]) => moralisSolGetTokenHolders(...a) },
  },
}));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// -------------------- HOISTED MOCKS --------------------

// Chains/config
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

// graphql-request: keep your real client logic, but stub network
const graphRequest = vi.fn();
// NOTE: gql is just a passthrough here; not used by tests
vi.mock('graphql-request', () => ({
  gql: (tpl: TemplateStringsArray) => tpl[0],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request: (...args: any[]) => graphRequest(...args),
}));

// Global fetch for Solana (Response-like)
const fetchSpy = vi.fn();
globalThis.fetch = fetchSpy;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mockOkJsonOnce(body: any, status = 200) {
  fetchSpy.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : '',
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
}

function mockHttpErrorOnce(status = 500, textBody = 'err') {
  fetchSpy.mockResolvedValueOnce({
    ok: false,
    status,
    statusText: 'Error',
    text: async () => textBody,
  });
}

// -------------------- IMPORT SUT AFTER MOCKS --------------------
import { fetchPriceSnapshot } from '../../../src/fetchers/fetchPriceSnapshot';
import { Chain } from '../../../src/utils/chains';

// -------------------- CONSTANTS --------------------
const TS_MS = 1_800_000_000_000n; // ms → seconds = 1_800_000_000
const BLOCK = 12345n;

beforeEach(() => {
  vi.clearAllMocks();
  retryMock.mockReset();
  retryMock.mockImplementation(async <T>(fn: () => Promise<T> | T) => await fn());
});

afterEach(() => {
  fetchSpy.mockReset();
  graphRequest.mockReset();
});

// -------------------- TESTS --------------------

describe('fetchPriceSnapshot — Ethereum', () => {
  it('computes price = token1Price * nativeTokenPrice and passes correct variables', async () => {
    // theGraphClient.ethereum.getPoolStats → constructed from this response
    graphRequest.mockResolvedValueOnce({
      pair: {
        reserveETH: '0', // not used here
        reserveUSD: '0', // not used here
        token1Price: '0.00025', // WPOKT per ETH
      },
      pairDayDatas: [{ dailyVolumeToken1: '50' }], // client reads it; safe to include
    });

    const out = await fetchPriceSnapshot(Chain.ETHEREUM, 2000, BLOCK, TS_MS);

    expect(out).toBeDefined();
    expect(out!.chain).toBe(Chain.ETHEREUM);
    expect(out!.exchange).toBe('uniswap');
    expect(out!.pool_address).toBe('0xPOOL_ETH');
    expect(out!.token_address).toBe('0xWPOKT_ETH');
    expect(out!.block_number).toBe(BLOCK);
    expect(out!.timestamp).toBe(TS_MS);
    // 0.00025 * 2000 = 0.5
    expect(out!.price).toBeCloseTo(0.5, 6);

    // Assert Graph variables
    const [endpoint, , variables, headers] = graphRequest.mock.calls[0];
    const expectedLtDate = Math.floor(Number(TS_MS) / 1000) - 86400;
    expect(typeof endpoint).toBe('string');
    expect(variables).toMatchObject({
      poolAddress: '0xpool_eth', // lowercased by client
      blockNumber: Number(BLOCK),
      ltDate: expectedLtDate,
    });
    expect(headers).toMatchObject({ Authorization: expect.stringContaining('Bearer ') });
  });

  it('throws on invalid token1/native price and logs error', async () => {
    graphRequest.mockResolvedValueOnce({
      pair: { reserveETH: '0', reserveUSD: '0', token1Price: 'NaN' },
      pairDayDatas: [],
    });

    await expect(fetchPriceSnapshot(Chain.ETHEREUM, 2000, BLOCK, TS_MS)).rejects.toThrow(
      /Invalid token1Price\/nativeTokenPrice/i
    );

    expect(errorMock).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(Error) }),
      expect.stringMatching(/Error fetching price snapshot/)
    );
  });

  it('throws "Failed to fetch pool stats" if retry resolves undefined', async () => {
    // Force retry to return undefined instead of calling the function
    retryMock.mockResolvedValueOnce(undefined);

    await expect(fetchPriceSnapshot(Chain.ETHEREUM, 2000, BLOCK, TS_MS)).rejects.toThrow(
      /Failed to fetch pool stats/i
    );
  });
});

describe('fetchPriceSnapshot — Base', () => {
  it('computes price = token0Price * nativeTokenPrice and passes correct variables', async () => {
    graphRequest.mockResolvedValueOnce({
      pool: {
        token0Price: '0.0002',
        totalValueLockedToken0: '800', // not used here
        volumeUSD: '0',
      },
      poolDayDatas: [{ volumeToken0: '20' }],
    });

    const out = await fetchPriceSnapshot(Chain.BASE, 2000, BLOCK, TS_MS);

    expect(out).toBeDefined();
    expect(out!.chain).toBe(Chain.BASE);
    expect(out!.exchange).toBe('aerodrome');
    expect(out!.pool_address).toBe('0xPOOL_BASE');
    expect(out!.token_address).toBe('0xWPOKT_BASE');
    // 0.0002 * 2000 = 0.4
    expect(out!.price).toBeCloseTo(0.4, 6);

    const [, , variables] = graphRequest.mock.calls[0];
    const expectedLtDate = Math.floor(Number(TS_MS) / 1000) - 86400;
    expect(variables).toMatchObject({
      poolAddress: '0xpool_base',
      blockNumber: Number(BLOCK),
      ltDate: expectedLtDate,
    });
  });

  it('throws on invalid token0/native price and logs error', async () => {
    graphRequest.mockResolvedValueOnce({
      pair: { token0Price: 'abc', totalValueLockedToken0: '0', volumeUSD: '0' },
      pool: { token0Price: 'abc', totalValueLockedToken0: '0', volumeUSD: '0' },
      poolDayDatas: [],
    });

    await expect(fetchPriceSnapshot(Chain.BASE, 2000, BLOCK, TS_MS)).rejects.toThrow(
      /Invalid token0Price\/nativeTokenPrice/i
    );

    expect(errorMock).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(Error) }),
      expect.stringMatching(/Error fetching price snapshot/)
    );
  });
});

describe('fetchPriceSnapshot — Solana', () => {
  it('computes price = native / reciprocal (Orca)', async () => {
    mockOkJsonOnce({ data: { price: '2' } }); // reciprocal = 2

    const out = await fetchPriceSnapshot(Chain.SOLANA, 100, BLOCK, TS_MS);

    // 100 / 2 = 50
    expect(out).toBeDefined();
    expect(out!.chain).toBe(Chain.SOLANA);
    expect(out!.exchange).toBe('orca');
    expect(out!.pool_address).toBe('ORCA_POOL');
    expect(out!.token_address).toBe('So11111111111111111111111111111111111111112');
    expect(out!.price).toBeCloseTo(50, 6);

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('https://api.orca.so/v2/solana/pools/ORCA_POOL'),
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('throws on non-OK Orca response and logs error', async () => {
    mockHttpErrorOnce(502, 'bad gateway');

    await expect(fetchPriceSnapshot(Chain.SOLANA, 100, BLOCK, TS_MS)).rejects.toThrow(
      /Orca API responded with 502/
    );

    expect(errorMock).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(Error) }),
      expect.stringMatching(/Error fetching price snapshot/)
    );
  });

  it('throws on invalid reciprocal or missing price', async () => {
    // Missing price
    mockOkJsonOnce({ data: {} });
    await expect(fetchPriceSnapshot(Chain.SOLANA, 100, BLOCK, TS_MS)).rejects.toThrow(
      /Failed to fetch price from Solana pool/
    );

    // Non-finite reciprocal
    mockOkJsonOnce({ data: { price: '0' } });
    await expect(fetchPriceSnapshot(Chain.SOLANA, 100, BLOCK, TS_MS)).rejects.toThrow(
      /Invalid Solana reciprocal\/native price/i
    );
  });
});

describe('fetchPriceSnapshot — misc errors', () => {
  it('throws for unsupported chain', async () => {
    // @ts-expect-error force invalid chain in test
    await expect(fetchPriceSnapshot('bogus', 1, BLOCK, TS_MS)).rejects.toThrow(/Unsupported chain/);
  });
});
