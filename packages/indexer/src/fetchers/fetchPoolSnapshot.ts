import { formatUnits } from 'viem';

import { PoolSnapshotRow } from '../types';
import { ADDRESSES_BY_CHAIN, Chain } from '../utils/chains';
import { logger } from '../utils/logger';
import { retry } from '../utils/retry';
import { moralisClient } from './moralisClient';
import { theGraphClient } from './theGraphClient';

export const fetchPoolSnapshot = async (
  chain: Chain,
  nativeTokenPrice: number,
  blockNumber: bigint,
  timestamp: bigint,
  totalSupply: bigint
): Promise<PoolSnapshotRow | undefined> => {
  try {
    if (!ADDRESSES_BY_CHAIN[chain]) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

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

      const { totalVolume } = await retry(
        async () =>
          moralisClient.evm.getTokenPairStats({
            poolAddress,
            chainId: 'eth',
          }),
        {
          onRetry: (err: unknown, attempt) =>
            logger.warn(
              { attempt, chain, error: (err as Error)?.message },
              'Retrying getTokenPairStats'
            ),
        }
      );

      const { totalHolders } = await retry(
        async () =>
          moralisClient.evm.getTokenHolders({
            tokenAddress: wpokt,
            chainId: 'eth',
          }),
        {
          onRetry: (err: unknown, attempt) =>
            logger.warn(
              { attempt, chain, error: (err as Error)?.message },
              'Retrying getTokenHolders'
            ),
        }
      );

      const { reserveUSD, token1Price } = poolStats;
      const volumeUsd = totalVolume['24h'];

      return {
        block_number: blockNumber,
        chain,
        circulating_supply: Number(formatUnits(totalSupply, 6)),
        exchange,
        holders: totalHolders,
        market_cap:
          parseFloat(token1Price) * nativeTokenPrice * Number(formatUnits(totalSupply, 6)),
        pool_address: poolAddress,
        timestamp,
        token_address: wpokt,
        tvl_usd: parseFloat(reserveUSD),
        volatility: volumeUsd / parseFloat(reserveUSD),
        volume_usd: volumeUsd,
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

      const { totalVolume } = await retry(
        async () =>
          moralisClient.evm.getTokenPairStats({
            poolAddress,
            chainId: 'base',
          }),
        {
          onRetry: (err: unknown, attempt) =>
            logger.warn(
              { attempt, chain, error: (err as Error)?.message },
              'Retrying getTokenPairStats'
            ),
        }
      );

      const { totalHolders } = await retry(
        () =>
          moralisClient.evm.getTokenHolders({
            tokenAddress: wpokt,
            chainId: 'base',
          }),
        {
          onRetry: (err: unknown, attempt) =>
            logger.warn(
              { attempt, chain, error: (err as Error)?.message },
              'Retrying getTokenHolders'
            ),
        }
      );

      const { token0Price, totalValueLockedToken0 } = poolStats;
      const tvlUsd = parseFloat(totalValueLockedToken0) * nativeTokenPrice * 2;

      return {
        block_number: blockNumber,
        chain,
        circulating_supply: Number(formatUnits(totalSupply, 6)),
        exchange,
        holders: totalHolders,
        market_cap:
          parseFloat(token0Price) * nativeTokenPrice * Number(formatUnits(totalSupply, 6)),
        pool_address: poolAddress,
        timestamp,
        token_address: wpokt,
        tvl_usd: tvlUsd,
        volatility: totalVolume['24h'] / tvlUsd,
        volume_usd: totalVolume['24h'],
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

      const { totalHolders } = await retry(
        () =>
          moralisClient.solana.getTokenHolders({
            tokenAddress: wpokt,
          }),
        {
          onRetry: (err: unknown, attempt) =>
            logger.warn(
              { attempt, chain, error: (err as Error)?.message },
              'Retrying getTokenHolders'
            ),
        }
      );

      const { price: reciprocalPrice, stats, tvlUsdc } = poolStats;

      const wPoktPrice = nativeTokenPrice / parseFloat(reciprocalPrice);
      const volumeUsd = parseFloat(stats['24h'].volume);

      return {
        block_number: blockNumber,
        chain,
        circulating_supply: Number(formatUnits(totalSupply, 6)),
        exchange,
        holders: totalHolders,
        market_cap: wPoktPrice * Number(formatUnits(totalSupply, 6)),
        pool_address: poolAddress,
        timestamp,
        token_address: wpokt,
        tvl_usd: parseFloat(tvlUsdc),
        volatility: volumeUsd / parseFloat(tvlUsdc),
        volume_usd: volumeUsd,
      };
    }
  } catch (error) {
    logger.error({ error }, 'Error fetching pool snapshot');
    throw error; // Re-throw to be caught in runIndexer
  }
};
