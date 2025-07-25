import { MachineType } from './utils/chains';

export type PoolSnapshotRow = {
  block_number: bigint;
  chain_id: string;
  exchange: string;
  machine_type: MachineType;
  pool_address: string;
  price: number;
  timestamp: bigint;
  token_address: string;
  tvl_usd: number;
  volume_usd: number;
};

export type PriceSnapshotRow = {
  block_number: bigint;
  chain_id: string;
  exchange: string;
  machine_type: MachineType;
  pool_address: string;
  price: number;
  timestamp: bigint;
  token_address: string;
};

export type TokenPriceRow = {
  chain_id: string;
  exchange: string;
  machine_type: MachineType;
  price: number;
  timestamp: number;
  token_address: string;
};
