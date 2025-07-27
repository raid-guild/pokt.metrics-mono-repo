import { PriceSnapshotRow } from '../types';
import { ADDRESSES_BY_CHAIN, Chain } from '../utils/chains';
import { retry } from '../utils/retry';
import { theGraphClient } from './theGraphClient';

export const fetchPriceSnapshot = async (
  chain: Chain,
  nativeTokenPrice: number,
  blockNumber: bigint,
  timestamp: bigint
) => {
  try {
    const priceSnapshot = await retry(
      async () => {
        const { exchange, poolAddress, wpokt } = ADDRESSES_BY_CHAIN[chain];
        if (!chain || !exchange || !poolAddress || !wpokt) {
          throw new Error(`Missing data for chain: ${chain}`);
        }

        if (chain === Chain.ETHEREUM) {
          return theGraphClient[chain.toLowerCase() as 'ethereum']
            .getPoolStats({ poolAddress, blockNumber })
            .then(({ reserveETH, token1Price }): PriceSnapshotRow => {
              const reserveETHValue = parseFloat(reserveETH);
              if (reserveETHValue === 0) {
                throw new Error('reserveETH cannot be zero');
              }

              const wPoktPrice = parseFloat(token1Price) * nativeTokenPrice;

              return {
                block_number: blockNumber,
                chain,
                exchange,
                pool_address: poolAddress,
                price: wPoktPrice,
                timestamp,
                token_address: wpokt,
              };
            });
        }
        if (chain === Chain.BASE) {
          return theGraphClient[chain.toLowerCase() as 'base']
            .getPoolStats({ poolAddress, blockNumber })
            .then(({ totalValueLockedETH, token0Price }): PriceSnapshotRow => {
              const totalValueLockedETHValue = parseFloat(totalValueLockedETH);
              if (totalValueLockedETHValue === 0) {
                throw new Error('totalValueLockedETH cannot be zero');
              }
              const wPoktPrice = parseFloat(token0Price) * nativeTokenPrice;

              return {
                block_number: blockNumber,
                chain,
                exchange,
                pool_address: poolAddress,
                price: wPoktPrice,
                timestamp,
                token_address: wpokt,
              };
            });
        }
        if (chain === Chain.SOLANA) {
          return fetch(`https://api.orca.so/v2/solana/pools/${poolAddress}`, {
            method: 'GET',
          })
            .then((response) => response.json())
            .then(({ data }) => {
              if (!data || !data.price) {
                throw new Error('Failed to fetch price from Solana pool');
              }

              const { price: reciprocalPrice } = data;

              const wPoktPrice = nativeTokenPrice / parseFloat(reciprocalPrice);

              return {
                block_number: blockNumber,
                chain,
                exchange,
                pool_address: poolAddress,
                price: wPoktPrice,
                timestamp,
                token_address: wpokt,
              };
            });
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
    return priceSnapshot;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching pool snapshot:', error);
  }
};
