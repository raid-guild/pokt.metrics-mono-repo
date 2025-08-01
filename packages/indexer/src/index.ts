import 'dotenv/config';

import { getMint } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';

import { db } from './db/client';
import { fetchMarketData, fetchPoolSnapshot } from './fetchers';
import { storeMarketData, storePoolSnapshots, storePriceSnapshots } from './services';
import { PoolSnapshotRow } from './types';
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

    // Get Ethereum and Solana prices from CoinGecko
    let response = await retry(
      () =>
        fetch('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=ETH', {
          headers: {
            'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY as string,
          } as HeadersInit,
        }),
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onRetry: (err: any, attempt) =>
          logger.warn({ attempt, error: err }, 'Retrying ETH price fetch'),
      }
    );
    const { data: ethData } = await response.json();
    if (!ethData['ETH']?.quote['USD']?.price) {
      throw new Error('Failed to fetch Ethereum price from CoinGecko');
    }

    const ethPrice = parseFloat(ethData['ETH'].quote['USD'].price);

    response = await retry(
      () =>
        fetch('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=SOL', {
          headers: {
            'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY as string,
          } as HeadersInit,
        }),
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onRetry: (err: any, attempt) =>
          logger.warn({ attempt, error: err }, 'Retrying SOL price fetch'),
      }
    );
    const { data: solData } = await response.json();
    if (!solData['SOL']?.quote['USD']?.price) {
      throw new Error('Failed to fetch Solana price from CoinMarketCap');
    }

    const solanaPrice = parseFloat(solData['SOL'].quote['USD'].price);

    const poolSnapshots: PoolSnapshotRow[] = [];

    // Fetch wPokt price from Ethereum and Base
    let currentBlock = (await ethereumClient.getBlockNumber()) - BigInt(1); // Slight delay to ensure data availability
    let currentTimestamp =
      (await ethereumClient.getBlock({ blockNumber: currentBlock }).then((b) => b.timestamp)) *
      BigInt(1000); // Convert to ms

    const wpoktAddress = ADDRESSES_BY_CHAIN[Chain.ETHEREUM].wpokt as `0x${string}`;
    if (!wpoktAddress) {
      throw new Error('wPokt address not found for Ethereum chain');
    }
    let totalSupply = (await ethereumClient.readContract({
      address: wpoktAddress,
      abi: erc20Abi,
      functionName: 'totalSupply',
    })) as bigint;

    const ethereumPoolSnapshot = await fetchPoolSnapshot(
      Chain.ETHEREUM,
      ethPrice,
      currentBlock,
      currentTimestamp,
      totalSupply
    );

    if (ethereumPoolSnapshot) {
      poolSnapshots.push(ethereumPoolSnapshot);
    }

    currentBlock = (await baseClient.getBlockNumber()) - BigInt(2); // Slight delay to ensure data availability
    currentTimestamp =
      (await baseClient.getBlock({ blockNumber: currentBlock }).then((b) => b.timestamp)) *
      BigInt(1000); // Convert to ms

    totalSupply = (await baseClient.readContract({
      address: ADDRESSES_BY_CHAIN[Chain.BASE].wpokt as `0x${string}`,
      abi: erc20Abi,
      functionName: 'totalSupply',
    })) as bigint;
    const basePoolSnapshot = await fetchPoolSnapshot(
      Chain.BASE,
      ethPrice,
      currentBlock,
      currentTimestamp,
      totalSupply
    );

    if (basePoolSnapshot) {
      poolSnapshots.push(basePoolSnapshot);
    }

    // Fetch wPokt price from Solana
    const currentSolanaSlot = (await solanaClient.getSlot()) - 20; // Slight delay to ensure data availability
    const currentSolanaTimestamp = await solanaClient.getBlockTime(currentSolanaSlot);
    if (currentSolanaTimestamp === null) {
      throw new Error('Failed to fetch Solana block time');
    }

    const mintAddress = new PublicKey(ADDRESSES_BY_CHAIN[Chain.SOLANA].wpokt as string);
    const mintInfo = await getMint(solanaClient, mintAddress);
    if (!mintInfo) {
      throw new Error('Failed to fetch mint info for wPokt on Solana');
    }
    totalSupply = mintInfo.supply;
    const solanaPoolSnapshot = await fetchPoolSnapshot(
      Chain.SOLANA,
      solanaPrice,
      BigInt(currentSolanaSlot),
      BigInt(currentSolanaTimestamp * 1000), // Convert to ms
      totalSupply
    );

    if (solanaPoolSnapshot) {
      poolSnapshots.push(solanaPoolSnapshot);
    }

    // Store all fetched pool snapshots in price_snapshots table
    if (poolSnapshots.length > 0) {
      await storePriceSnapshots(poolSnapshots);
    } else {
      logger.warn('⚠️ No pool snapshots fetched');
    }

    // Get most recent pool_snapshot row
    const latestPoolSnapshot = await db.query<PoolSnapshotRow>(
      'SELECT * FROM pool_snapshots ORDER BY timestamp DESC LIMIT 1'
    );
    const latestPoolSnapshotRow = latestPoolSnapshot.rows[0];

    // If snapshot is over an hour old, store pool snapshots
    if (latestPoolSnapshotRow) {
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      if (latestPoolSnapshotRow.timestamp < BigInt(oneHourAgo)) {
        await storePoolSnapshots(poolSnapshots);
      }
    } else {
      // If no snapshots exist, store the current pool snapshots
      await storePoolSnapshots(poolSnapshots);
    }

    response = await retry(
      () =>
        fetch('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=POKT', {
          headers: {
            'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY as string,
          } as HeadersInit,
        }),
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onRetry: (err: any, attempt) =>
          logger.warn({ attempt, error: err }, 'Retrying POKT price fetch'),
      }
    );
    const { data: poktData } = await response.json();
    if (!poktData['POKT']?.quote['USD']?.price) {
      throw new Error('Failed to fetch POKT price from CoinMarketCap');
    }

    const poktPrice = parseFloat(poktData['POKT'].quote['USD'].price);
    const marketData = await fetchMarketData(poktPrice);

    if (!marketData) {
      logger.error('⚠️ No market data fetched');
      return;
    }

    // Store market data
    await storeMarketData([marketData]);
  } catch (error) {
    logger.error({ error }, 'Error in runIndexer');
    throw error; // Re-throw to be caught in main
  }
};

const main = async () => {
  try {
    logger.info('Indexer is running...');

    await runIndexer();
    // await fetchMarketData();

    logger.info('Indexer finished.');
  } catch (error) {
    logger.error({ error }, 'Error in indexer');
  }
};

main();
