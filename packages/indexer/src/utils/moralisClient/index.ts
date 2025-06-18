import 'dotenv/config';

import type {
  TokenPairStatsEvmResponse,
  TokenPairStatsSolanaResponse,
  TokenPriceEvmResponse,
  TokenPriceSolanaResponse,
} from './types';

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;

class MoralisBaseClient {
  constructor(
    protected readonly apiKey: string,
    protected readonly baseUrl: string
  ) {
    if (!MORALIS_API_KEY) {
      throw new Error('MORALIS_API_KEY is required');
    }
  }

  protected async fetch(
    path: string,
    queryParams?: Record<string, string>
  ): Promise<
    | TokenPriceEvmResponse
    | TokenPriceSolanaResponse
    | TokenPairStatsEvmResponse
    | TokenPairStatsSolanaResponse
  > {
    const url = new URL(`${this.baseUrl}${path}`);
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => url.searchParams.append(key, value));
    }

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'X-API-Key': this.apiKey,
      },
    });

    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      throw new Error(`Moralis API error (${res.status}): ${msg}`);
    }

    return res.json();
  }
}

class MoralisSolanaClient extends MoralisBaseClient {
  constructor(apiKey: string) {
    super(apiKey, 'https://solana-gateway.moralis.io');
  }

  async getTokenPrice({ tokenAddress }: { tokenAddress: string }) {
    return this.fetch(`/token/mainnet/${tokenAddress}/price`) as Promise<TokenPriceSolanaResponse>;
  }

  async getTokenPairStats({ poolAddress }: { poolAddress: string }) {
    return this.fetch(
      `/token/mainnet/pairs/${poolAddress}/stats`
    ) as Promise<TokenPairStatsSolanaResponse>;
  }
}

class MoralisEvmClient extends MoralisBaseClient {
  constructor(apiKey: string) {
    super(apiKey, 'https://deep-index.moralis.io/api/v2.2');
  }

  async getTokenPrice({ tokenAddress, chainId }: { tokenAddress: string; chainId: string }) {
    return this.fetch(`/erc20/${tokenAddress}/price`, {
      chain: chainId,
    }) as Promise<TokenPriceEvmResponse>;
  }

  async getTokenPairStats({ poolAddress, chainId }: { poolAddress: string; chainId: string }) {
    return this.fetch(`/pairs/${poolAddress}/stats`, {
      chain: chainId,
    }) as Promise<TokenPairStatsEvmResponse>;
  }
}

export class MoralisClient {
  readonly solana: MoralisSolanaClient;
  readonly evm: MoralisEvmClient;

  constructor(apiKey = MORALIS_API_KEY) {
    if (!apiKey) {
      throw new Error('MORALIS_API_KEY is not set');
    }

    this.solana = new MoralisSolanaClient(apiKey);
    this.evm = new MoralisEvmClient(apiKey);
  }
}

const moralisClient = new MoralisClient();
export { moralisClient };
