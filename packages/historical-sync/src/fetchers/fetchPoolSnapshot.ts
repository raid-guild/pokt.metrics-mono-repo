import { base, mainnet } from 'viem/chains';

import { PoolSnapshotRow } from '../types';
import { ADDRESSES_BY_CHAIN } from '../utils/chains';
import { retry } from '../utils/retry';
import { theGraphClient } from './theGraphClient';

export const fetchPoolSnapshot = async (
  chain: 'Base' | 'Ethereum' | 'Solana',
  blockNumber: number
) => {
  try {
    const poolSnapshot: PoolSnapshotRow = await retry(
      async () => {
        const { chainId, exchange, machineType, poolAddress, wpokt } = ADDRESSES_BY_CHAIN[chain];
        if (!chainId || !exchange || !machineType || !poolAddress || !wpokt) {
          throw new Error(`Missing data for chain: ${chain}`);
        }

        if (chain === mainnet.name) {
          return theGraphClient[chain.toLowerCase() as 'ethereum']
            .getPoolStats({ poolAddress, blockNumber })
            .then(({ reserveETH, reserveUSD, token1Price, volumeUSD }) => {
              const reserveETHValue = parseFloat(reserveETH);
              if (reserveETHValue === 0) {
                throw new Error('reserveETH cannot be zero');
              }
              const ethPrice = parseFloat(reserveUSD) / reserveETHValue;
              const wPoktPrice = parseFloat(token1Price) * ethPrice;

              return {
                chain_id: chainId,
                exchange,
                machine_type: machineType,
                pool_address: poolAddress,
                price: wPoktPrice,
                timestamp: Date.now(),
                token_address: wpokt,
                tvl_usd: parseFloat(reserveUSD),
                volume_usd: parseFloat(volumeUSD),
              };
            });
        }
        if (chain === base.name) {
          return theGraphClient[chain.toLowerCase() as 'base']
            .getPoolStats({ poolAddress, blockNumber })
            .then(({ totalValueLockedETH, totalValueLockedUSD, token0Price, volumeUSD }) => {
              const totalValueLockedETHValue = parseFloat(totalValueLockedETH);
              if (totalValueLockedETHValue === 0) {
                throw new Error('totalValueLockedETH cannot be zero');
              }
              const ethPrice = parseFloat(totalValueLockedUSD) / totalValueLockedETHValue;
              const wPoktPrice = parseFloat(token0Price) * ethPrice;

              return {
                chain_id: chainId,
                exchange,
                machine_type: machineType,
                pool_address: poolAddress,
                price: wPoktPrice,
                timestamp: Date.now(),
                token_address: wpokt,
                tvl_usd: parseFloat(totalValueLockedUSD),
                volume_usd: parseFloat(volumeUSD),
              };
            });
        }
        if (chain === 'Solana') {
          return {
            chain_id: chainId,
            exchange,
            machine_type: machineType,
            pool_address: poolAddress,
            price: 0.01, // Placeholder price
            timestamp: Date.now(),
            token_address: wpokt,
            tvl_usd: 1,
            volume_usd: 1,
          };
        }
        throw new Error(`Unsupported chain: ${chain}`);
      },
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onRetry: (err: any, attempt) =>
          // eslint-disable-next-line no-console
          console.warn(`Retrying ${chain} (attempt ${attempt}):`, err.message),
      }
    );
    return poolSnapshot;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching pool snapshot:', error);
  }
};
