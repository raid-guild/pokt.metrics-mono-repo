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
    const dayAgoTimestamp = Math.floor(Number(timestamp) / 1000) - 86400; // 24 hours ago in seconds
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
      const token1PriceNum = Number(token1Price);
      if (!Number.isFinite(token1PriceNum) || !Number.isFinite(nativeTokenPrice)) {
        throw new Error(
          `Invalid token1Price/nativeTokenPrice for ${chain}: ${token1Price} / ${nativeTokenPrice}`
        );
      }
      const wPoktPrice = token1PriceNum * nativeTokenPrice;

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
      const token0PriceNum = Number(token0Price);
      if (!Number.isFinite(token0PriceNum) || !Number.isFinite(nativeTokenPrice)) {
        throw new Error(
          `Invalid token0Price/nativeTokenPrice for ${chain}: ${token0Price} / ${nativeTokenPrice}`
        );
      }
      const wPoktPrice = token0PriceNum * nativeTokenPrice;

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
        async () => {
          const res = await fetch(`https://api.orca.so/v2/solana/pools/${poolAddress}`, {
            method: 'GET',
          });
          if (!res.ok) {
            throw new Error(`Orca API responded with ${res.status}`);
          }
          return res.json();
        },
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onRetry: (err: any, attempt) =>
            logger.warn({ attempt, chain, error: err.message }, 'Retrying fetch pool stats'),
        }
      );
      if (!poolStats || poolStats.price == null) {
        throw new Error('Failed to fetch price from Solana pool');
      }

      const reciprocal = Number(poolStats.price);
      if (!Number.isFinite(reciprocal) || reciprocal <= 0 || !Number.isFinite(nativeTokenPrice)) {
        throw new Error(
          `Invalid Solana reciprocal/native price: ${poolStats.price} / ${nativeTokenPrice}`
        );
      }
      const wPoktPrice = nativeTokenPrice / reciprocal;

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
