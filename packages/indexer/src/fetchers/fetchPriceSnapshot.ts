import { PriceSnapshotRow } from '../types';
import { ADDRESSES_BY_CHAIN, Chain } from '../utils/chains';
import { logger } from '../utils/logger';
import { retry } from '../utils/retry';
import { theGraphClient } from './theGraphClient';

export const fetchPriceSnapshot = async (
  chain: Chain,
  nativeTokenPrice: number,
  blockNumber: bigint,
  timestamp: bigint
): Promise<PriceSnapshotRow | undefined> => {
  try {
    const dayAgoTimestamp = Number(timestamp) / 1000 - 86400; // 24 hours ago in seconds
    const { exchange, poolAddress, wpokt } = ADDRESSES_BY_CHAIN[chain];
    if (!chain || !exchange || !poolAddress || !wpokt) {
      throw new Error(`Missing data for chain: ${chain}`);
    }

    if (chain === Chain.ETHEREUM) {
      const poolStats = await retry(
        async () =>
          theGraphClient[chain.toLowerCase() as 'ethereum'].getPoolStats({
            poolAddress,
            blockNumber,
            ltDate: dayAgoTimestamp,
          }),
        {
          onRetry: (err: unknown, attempt) =>
            logger.warn(
              { attempt, chain, error: (err as Error)?.message },
              'Retrying getPoolStats'
            ),
        }
      );
      if (!poolStats) {
        throw new Error(`Failed to fetch pool stats for ${chain} at block ${blockNumber}`);
      }

      const { token1Price } = poolStats;
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
    }

    if (chain === Chain.BASE) {
      const poolStats = await retry(
        () =>
          theGraphClient[chain.toLowerCase() as 'base'].getPoolStats({
            poolAddress,
            blockNumber,
            ltDate: dayAgoTimestamp,
          }),
        {
          onRetry: (err: unknown, attempt) =>
            logger.warn(
              { attempt, chain, error: (err as Error)?.message },
              'Retrying getPoolStats'
            ),
        }
      );
      if (!poolStats) {
        throw new Error(`Failed to fetch pool stats for ${chain} at block ${blockNumber}`);
      }

      const { token0Price } = poolStats;
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
    }

    if (chain === Chain.SOLANA) {
      const { data: poolStats } = await retry(
        () =>
          fetch(`https://api.orca.so/v2/solana/pools/${poolAddress}`, {
            method: 'GET',
          }).then((response) => response.json()),
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onRetry: (err: any, attempt) =>
            logger.warn({ attempt, chain, error: err.message }, 'Retrying fetch pool stats'),
        }
      );
      if (!poolStats || !poolStats.price) {
        throw new Error('Failed to fetch price from Solana pool');
      }

      const { price: reciprocalPrice } = poolStats;
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
    }
    throw new Error(`Unsupported chain: ${chain}`);
  } catch (error) {
    logger.error({ error }, 'Error fetching price snapshot');
    throw error; // Re-throw to be caught in runIndexer
  }
};
