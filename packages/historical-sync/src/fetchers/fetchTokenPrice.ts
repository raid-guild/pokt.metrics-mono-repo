import { base, mainnet } from 'viem/chains';

import { TokenPriceRow } from '../types';
import { ADDRESSES_BY_CHAIN } from '../utils/chains';
import { retry } from '../utils/retry';
import { theGraphClient } from './theGraphClient';

export const fetchTokenPrice = async (
  chain: 'Base' | 'Ethereum' | 'Solana',
  blockNumber: number
) => {
  try {
    const price: TokenPriceRow = await retry(
      async () => {
        const { chainId, exchange, machineType, poolAddress, wpokt } = ADDRESSES_BY_CHAIN[chain];
        if (!chainId || !exchange || !machineType || !poolAddress || !wpokt) {
          throw new Error(`Missing data for chain: ${chain}`);
        }

        if (chain === mainnet.name) {
          return theGraphClient[chain.toLowerCase() as 'ethereum']
            .getTokenPrice({ poolAddress, blockNumber })
            .then(({ reserveETH, reserveUSD, token1Price }) => {
              const ethPrice = parseFloat(reserveUSD) / parseFloat(reserveETH);
              const wPoktPrice = parseFloat(token1Price) * ethPrice;

              return {
                chain_id: chainId,
                exchange,
                machine_type: machineType,
                price: wPoktPrice,
                timestamp: Date.now(),
                token_address: wpokt,
              };
            });
        }
        if (chain === base.name) {
          return theGraphClient[chain.toLowerCase() as 'base']
            .getTokenPrice({ poolAddress, blockNumber })
            .then(({ totalValueLockedETH, totalValueLockedUSD, token0Price }) => {
              const ethPrice = parseFloat(totalValueLockedUSD) / parseFloat(totalValueLockedETH);
              const wPoktPrice = parseFloat(token0Price) * ethPrice;

              return {
                chain_id: chainId,
                exchange,
                machine_type: machineType,
                price: wPoktPrice,
                timestamp: Date.now(),
                token_address: wpokt,
              };
            });
        }
        if (chain === 'Solana') {
          return {
            chain_id: chainId,
            exchange,
            machine_type: machineType,
            price: 0.01, // Placeholder price
            timestamp: Date.now(),
            token_address: wpokt,
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
    return price;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching token price:', error);
  }
};
