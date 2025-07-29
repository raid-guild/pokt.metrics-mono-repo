import { formatUnits } from 'viem';

import { PoolSnapshotRow } from '../types';
import { ADDRESSES_BY_CHAIN, Chain } from '../utils/chains';
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onRetry: (err: any, attempt) =>
            // eslint-disable-next-line no-console
            console.warn(`Retrying getPoolStats on ${chain} (attempt ${attempt}):`, err.message),
        }
      );
      if (!poolStats) {
        throw new Error(`Failed to fetch pool stats for ${chain} at block ${blockNumber}`);
      }

      const { totalHolders } = await retry(
        async () =>
          moralisClient.evm.getTokenHolders({
            tokenAddress: wpokt,
            chainId: 'eth',
          }),
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onRetry: (err: any, attempt) =>
            // eslint-disable-next-line no-console
            console.warn(`Retrying getTokenHolders on ${chain} (attempt ${attempt}):`, err.message),
        }
      );

      const { reserveUSD, token1Price, volumeETH } = poolStats;
      const wPoktPrice = parseFloat(token1Price) * nativeTokenPrice;
      const volumeUsd = parseFloat(volumeETH) * nativeTokenPrice;

      return {
        block_number: blockNumber,
        chain,
        circulating_supply: Number(formatUnits(totalSupply, 6)),
        exchange,
        holders: totalHolders,
        market_cap:
          parseFloat(token1Price) * nativeTokenPrice * Number(formatUnits(totalSupply, 6)),
        pool_address: poolAddress,
        price: wPoktPrice,
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onRetry: (err: any, attempt) =>
            // eslint-disable-next-line no-console
            console.warn(`Retrying getPoolStats on ${chain} (attempt ${attempt}):`, err.message),
        }
      );
      if (!poolStats) {
        throw new Error(`Failed to fetch pool stats for ${chain} at block ${blockNumber}`);
      }

      const { totalHolders } = await retry(
        () =>
          moralisClient.evm.getTokenHolders({
            tokenAddress: wpokt,
            chainId: 'base',
          }),
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onRetry: (err: any, attempt) =>
            // eslint-disable-next-line no-console
            console.warn(`Retrying getTokenHolders on ${chain} (attempt ${attempt}):`, err.message),
        }
      );

      const { token0Price, totalValueLockedToken0, volumeETH } = poolStats;
      const wPoktPrice = parseFloat(token0Price) * nativeTokenPrice;
      const tvlUsd = parseFloat(totalValueLockedToken0) * nativeTokenPrice * 2;
      const volumeUsd = parseFloat(volumeETH) * nativeTokenPrice;

      return {
        block_number: blockNumber,
        chain,
        circulating_supply: Number(formatUnits(totalSupply, 6)),
        exchange,
        holders: totalHolders,
        market_cap:
          parseFloat(token0Price) * nativeTokenPrice * Number(formatUnits(totalSupply, 6)),
        pool_address: poolAddress,
        price: wPoktPrice,
        timestamp,
        token_address: wpokt,
        tvl_usd: tvlUsd,
        volatility: volumeUsd / tvlUsd,
        volume_usd: volumeUsd,
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
            // eslint-disable-next-line no-console
            console.warn(
              `Retrying fetch pool stats on ${chain} (attempt ${attempt}):`,
              err.message
            ),
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onRetry: (err: any, attempt) =>
            // eslint-disable-next-line no-console
            console.warn(`Retrying getTokenHolders on ${chain} (attempt ${attempt}):`, err.message),
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
        price: wPoktPrice,
        timestamp,
        token_address: wpokt,
        tvl_usd: parseFloat(tvlUsdc),
        volatility: volumeUsd / parseFloat(tvlUsdc),
        volume_usd: volumeUsd,
      };
    }
    throw new Error(`Unsupported chain: ${chain}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching pool snapshot:', error);
  }
};
