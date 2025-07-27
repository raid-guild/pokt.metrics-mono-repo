export enum Chain {
  BASE = 'base',
  ETHEREUM = 'ethereum',
  SOLANA = 'solana',
}

enum Exchange {
  AERODOME = 'aerodrome',
  UNISWAP_V2 = 'uniswap_v2',
  ORCA_WHIRLPOOL = 'orca_whirlpool',
}

type AddressMap = {
  chain: Chain;
  exchange: string;
  poolAddress: string;
  wpokt: string;
};

export const ADDRESSES_BY_CHAIN: Record<Chain, AddressMap> = {
  [Chain.BASE]: {
    chain: Chain.BASE,
    exchange: Exchange.AERODOME,
    poolAddress: '0x32bb4ad5fed77f7abf97d1435f8d6aaae59aa64e',
    wpokt: '0x764a726d9ced0433a8d7643335919deb03a9a935',
  },
  [Chain.ETHEREUM]: {
    chain: Chain.ETHEREUM,
    exchange: Exchange.UNISWAP_V2,
    poolAddress: '0xa7fd8ff8f4cada298286d3006ee8f9c11e2ff84e',
    wpokt: '0x67f4c72a50f8df6487720261e188f2abe83f57d7',
  },
  [Chain.SOLANA]: {
    chain: Chain.SOLANA,
    exchange: Exchange.ORCA_WHIRLPOOL,
    poolAddress: '5qJCeYWzvkrKuD1r7bQDus8ffm2vjrunxNUht6NTeise',
    wpokt: '6CAsXfiCXZfP8APCG6Vma2DFMindopxiqYQN4LSQfhoC',
  },
};
