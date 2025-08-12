import 'dotenv/config';

import { getMint } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';

import { db } from './db/client';
import { fetchMarketData, fetchPoolSnapshot, fetchPriceSnapshot } from './fetchers';
import { storeMarketData, storePoolSnapshots, storePriceSnapshots } from './services';
import { pruneOldData } from './services/pruneOldData';
import type { MarketDataRow, PoolSnapshotRow, PriceSnapshotRow } from './types';
import { ADDRESSES_BY_CHAIN, Chain } from './utils/chains';
import { baseClient, ethereumClient, solanaClient } from './utils/helpers';
import { logger } from './utils/logger';
import { retry } from './utils/retry';

const erc20Abi = [
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
];

export const runIndexer = async () => {
  try {
    if (!process.env.COINMARKETCAP_API_KEY) {
      throw new Error('COINMARKETCAP_API_KEY is required');
    }

    // Get Ethereum, Solana, and Base price data
    const response = await retry(
      () =>
        fetch(
          'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=ETH,SOL,POKT',
          {
            headers: {
              'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY as string,
            } as HeadersInit,
          }
        ),
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onRetry: (err: any, attempt) =>
          logger.warn({ attempt, error: err }, 'Retrying ETH, SOL, and POKT price fetch'),
      }
    );
    const { data } = await response.json();
    if (!data['ETH']?.quote['USD']?.price) {
      throw new Error('Failed to fetch Ethereum price from CoinMarketCap');
    }

    const ethPrice = parseFloat(data['ETH'].quote['USD'].price);

    if (!data['SOL']?.quote['USD']?.price) {
      throw new Error('Failed to fetch Solana price from CoinMarketCap');
    }

    const solanaPrice = parseFloat(data['SOL'].quote['USD'].price);

    if (!data['POKT']?.quote['USD']?.price) {
      throw new Error('Failed to fetch POKT price from CoinMarketCap');
    }

    const poktPrice = parseFloat(data['POKT'].quote['USD'].price);

    const priceSnapshots: PriceSnapshotRow[] = [];

    // Fetch wPokt price from Ethereum
    const currentEthereumBlock = (await ethereumClient.getBlockNumber()) - BigInt(1); // Slight delay to ensure data availability
    const currentEthereumTimestamp =
      (await ethereumClient
        .getBlock({ blockNumber: currentEthereumBlock })
        .then((b) => b.timestamp)) * BigInt(1000); // Convert to ms

    const wpoktAddress = ADDRESSES_BY_CHAIN[Chain.ETHEREUM].wpokt as `0x${string}`;
    if (!wpoktAddress) {
      throw new Error('wPokt address not found for Ethereum chain');
    }

    const ethereumPriceSnapshot = await fetchPriceSnapshot(
      Chain.ETHEREUM,
      ethPrice,
      currentEthereumBlock,
      currentEthereumTimestamp
    );

    if (ethereumPriceSnapshot) {
      priceSnapshots.push(ethereumPriceSnapshot);
    }

    // Fetch wPokt price from Base
    const currentBaseBlock = (await baseClient.getBlockNumber()) - BigInt(2); // Slight delay to ensure data availability
    const currentBaseTimestamp =
      (await baseClient.getBlock({ blockNumber: currentBaseBlock }).then((b) => b.timestamp)) *
      BigInt(1000); // Convert to ms

    const basePriceSnapshot = await fetchPriceSnapshot(
      Chain.BASE,
      ethPrice,
      currentBaseBlock,
      currentBaseTimestamp
    );

    if (basePriceSnapshot) {
      priceSnapshots.push(basePriceSnapshot);
    }

    // Fetch wPokt price from Solana
    const currentSolanaSlot = (await solanaClient.getSlot()) - 20; // Slight delay to ensure data availability
    const currentSolanaTimestamp = await solanaClient.getBlockTime(currentSolanaSlot);
    if (currentSolanaTimestamp === null) {
      throw new Error('Failed to fetch Solana block time');
    }

    const solanaPriceSnapshot = await fetchPriceSnapshot(
      Chain.SOLANA,
      solanaPrice,
      BigInt(currentSolanaSlot),
      BigInt(currentSolanaTimestamp * 1000) // Convert to ms
    );

    if (solanaPriceSnapshot) {
      priceSnapshots.push(solanaPriceSnapshot);
    }

    // Store all fetched price snapshots in price_snapshots table
    if (priceSnapshots.length > 0) {
      await storePriceSnapshots(priceSnapshots);
    } else {
      logger.warn('⚠️ No price snapshots fetched');
    }

    // Get most recent pool_snapshot row
    const latestPoolSnapshot = await db.query<PoolSnapshotRow>(
      'SELECT * FROM pool_snapshots ORDER BY timestamp DESC LIMIT 1'
    );
    const latestPoolSnapshotRow = latestPoolSnapshot.rows[0];
    // If snapshot is over an hour old, store pool snapshots
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    if (
      !latestPoolSnapshotRow ||
      (latestPoolSnapshotRow && latestPoolSnapshotRow.timestamp < BigInt(oneHourAgo))
    ) {
      const poolSnapshots: PoolSnapshotRow[] = [];

      const totalEthereumSupply = (await ethereumClient.readContract({
        address: wpoktAddress,
        abi: erc20Abi,
        functionName: 'totalSupply',
      })) as bigint;

      const ethereumPoolSnapshot = await fetchPoolSnapshot(
        Chain.ETHEREUM,
        ethPrice,
        currentEthereumBlock,
        currentEthereumTimestamp,
        totalEthereumSupply
      );

      if (ethereumPoolSnapshot) {
        poolSnapshots.push(ethereumPoolSnapshot);
      }

      const totalBaseSupply = (await baseClient.readContract({
        address: ADDRESSES_BY_CHAIN[Chain.BASE].wpokt as `0x${string}`,
        abi: erc20Abi,
        functionName: 'totalSupply',
      })) as bigint;

      const basePoolSnapshot = await fetchPoolSnapshot(
        Chain.BASE,
        ethPrice,
        currentBaseBlock,
        currentBaseTimestamp,
        totalBaseSupply
      );

      if (basePoolSnapshot) {
        poolSnapshots.push(basePoolSnapshot);
      }

      const mintAddress = new PublicKey(ADDRESSES_BY_CHAIN[Chain.SOLANA].wpokt as string);
      const mintInfo = await getMint(solanaClient, mintAddress);
      if (!mintInfo) {
        throw new Error('Failed to fetch mint info for wPokt on Solana');
      }
      const totalSolanaSupply = mintInfo.supply;

      const solanaPoolSnapshot = await fetchPoolSnapshot(
        Chain.SOLANA,
        solanaPrice,
        BigInt(currentSolanaSlot),
        BigInt(currentSolanaTimestamp * 1000), // Convert to ms
        totalSolanaSupply
      );

      if (solanaPoolSnapshot) {
        poolSnapshots.push(solanaPoolSnapshot);
      }

      // Store all fetched pool snapshots in pool_snapshots table
      if (poolSnapshots.length > 0) {
        await storePoolSnapshots(poolSnapshots);
      } else {
        logger.warn('⚠️ No pool snapshots fetched');
      }
    }

    const latestMarketData = await db.query<MarketDataRow>(
      'SELECT * FROM market_data ORDER BY timestamp DESC LIMIT 1'
    );
    const latestMarketDataRow = latestMarketData.rows[0];

    if (
      !latestMarketDataRow ||
      (latestMarketDataRow && latestMarketDataRow.timestamp < BigInt(oneHourAgo))
    ) {
      if (!data['POKT']?.circulating_supply) {
        throw new Error('Failed to fetch POKT circulating supply from CoinMarketCap');
      }
      if (!data['POKT']?.quote['USD']?.volume_24h) {
        throw new Error('Failed to fetch POKT 24h volume from CoinMarketCap');
      }
      const circulatingSupply = parseFloat(data['POKT'].circulating_supply);
      const volume24h = parseFloat(data['POKT'].quote['USD'].volume_24h);
      const marketData = await fetchMarketData(poktPrice, circulatingSupply, volume24h);

      if (!marketData) {
        logger.error('⚠️ No market data fetched');
        return;
      }

      // Store market data
      await storeMarketData([marketData]);
    }

    // Prune old data
    await pruneOldData();
  } catch (error) {
    logger.error({ error }, 'Error in runIndexer');
    throw error; // Re-throw to be caught in main
  }
};

const main = async () => {
  try {
    logger.info('Indexer is running...');

    await runIndexer();

    logger.info('Indexer finished.');
  } catch (error) {
    logger.error({ error }, 'Error in indexer');
  }
};

main();
