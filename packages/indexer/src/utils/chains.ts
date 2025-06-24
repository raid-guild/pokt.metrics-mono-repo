import { base, mainnet } from 'viem/chains';

export enum MachineType {
  EVM = 'evm',
  SOLANA = 'solana',
}

enum Exchange {
  AERODOME = 'aerodrome',
  UNISWAP_V2 = 'uniswap_v2',
  ORCA_WHIRLPOOL = 'orca_whirlpool',
}

type AddressMap = {
  chainId: string;
  exchange: string;
  machineType: MachineType;
  poolAddress: string;
  wpokt: string;
};

export const ADDRESSES_BY_CHAIN: Record<'Base' | 'Ethereum' | 'Solana', AddressMap> = {
  [base.name]: {
    chainId: '0x2105',
    exchange: Exchange.AERODOME,
    machineType: MachineType.EVM,
    poolAddress: '0x32bb4ad5fed77f7abf97d1435f8d6aaae59aa64e',
    wpokt: '0x764a726d9ced0433a8d7643335919deb03a9a935',
  },
  [mainnet.name]: {
    chainId: '0x1',
    exchange: Exchange.UNISWAP_V2,
    machineType: MachineType.EVM,
    poolAddress: '0xa7fd8ff8f4cada298286d3006ee8f9c11e2ff84e',
    wpokt: '0x67f4c72a50f8df6487720261e188f2abe83f57d7',
  },
  ['Solana']: {
    chainId: 'mainnet',
    exchange: Exchange.ORCA_WHIRLPOOL,
    machineType: MachineType.SOLANA,
    poolAddress: '5qJCeYWzvkrKuD1r7bQDus8ffm2vjrunxNUht6NTeise',
    wpokt: '6CAsXfiCXZfP8APCG6Vma2DFMindopxiqYQN4LSQfhoC',
  },
};
