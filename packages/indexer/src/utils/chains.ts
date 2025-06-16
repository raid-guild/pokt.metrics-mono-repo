import { base, mainnet } from 'viem/chains';

export enum ApiType {
  EvmApi = 'EvmApi',
  SolApi = 'SolApi',
}

type AddressMap = {
  apiType: ApiType;
  exchange: string;
  networkId: string;
  wpokt: string;
};

export const ADDRESSES_BY_CHAIN: Record<'Base' | 'Ethereum' | 'Solana', AddressMap> = {
  [base.name]: {
    apiType: ApiType.EvmApi,
    exchange: 'Aerodrome',
    networkId: '0x2105',
    wpokt: '0x764a726d9ced0433a8d7643335919deb03a9a935',
  },
  [mainnet.name]: {
    apiType: ApiType.EvmApi,
    exchange: 'Uniswap v2',
    networkId: '0x1',
    wpokt: '0x67f4c72a50f8df6487720261e188f2abe83f57d7',
  },
  ['Solana']: {
    apiType: ApiType.SolApi,
    exchange: 'Orca Whirlpool',
    networkId: 'mainnet',
    wpokt: '6CAsXfiCXZfP8APCG6Vma2DFMindopxiqYQN4LSQfhoC',
  },
};
