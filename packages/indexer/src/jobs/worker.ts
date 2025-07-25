import { Worker } from 'bullmq';

import { fetchPriceSnapshot } from '../fetchers';
import { storePriceSnapshots } from '../services';
import { baseClient, ethereumClient, solanaClient } from '../utils/helpers';
import { connection } from './queue';

export const indexerWorker = new Worker(
  'indexer',
  async () => {
    // eslint-disable-next-line no-console
    console.log('▶️ Running indexer job...');

    try {
      let response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd`,
        {
          method: 'GET',
        }
      );
      let data = await response.json();

      if (!data || !data.ethereum || !data.ethereum.usd) {
        throw new Error('Failed to fetch Ethereum price from CoinGecko');
      }

      const ethPrice = parseFloat(data.ethereum.usd);

      response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd`,
        {
          method: 'GET',
        }
      );
      data = await response.json();

      if (!data || !data.solana || !data.solana.usd) {
        throw new Error('Failed to fetch Solana price from CoinGecko');
      }

      const solanaPrice = parseFloat(data.solana.usd);

      const priceSnapshots = [];
      const currentEthereumBlock = (await ethereumClient.getBlockNumber()) - BigInt(1); // Slight delay to ensure data availability
      const currentEthereumTimestamp =
        (await ethereumClient
          .getBlock({ blockNumber: currentEthereumBlock })
          .then((b) => b.timestamp)) * BigInt(1000); // Convert to ms
      const ethereumPriceSnapshot = await fetchPriceSnapshot(
        'Ethereum',
        ethPrice,
        currentEthereumBlock,
        currentEthereumTimestamp
      );

      if (ethereumPriceSnapshot) {
        priceSnapshots.push(ethereumPriceSnapshot);
      }

      const currentBaseBlock = (await baseClient.getBlockNumber()) - BigInt(2); // Slight delay to ensure data availability
      const currentBaseTimestamp =
        (await baseClient.getBlock({ blockNumber: currentBaseBlock }).then((b) => b.timestamp)) *
        BigInt(1000); // Convert to ms
      const basePriceSnapshot = await fetchPriceSnapshot(
        'Base',
        ethPrice,
        currentBaseBlock,
        currentBaseTimestamp
      );

      if (basePriceSnapshot) {
        priceSnapshots.push(basePriceSnapshot);
      }

      const currentSolanaSlot = await solanaClient.getSlot();
      const currentSolanaTimestamp = await solanaClient.getBlockTime(currentSolanaSlot);
      if (currentSolanaTimestamp === null) {
        throw new Error('Failed to fetch Solana block time');
      }

      const solanaPriceSnapshot = await fetchPriceSnapshot(
        'Solana',
        solanaPrice,
        BigInt(currentSolanaSlot),
        BigInt(currentSolanaTimestamp * 1000) // Convert to ms
      );

      if (solanaPriceSnapshot) {
        priceSnapshots.push(solanaPriceSnapshot);
      }

      if (priceSnapshots.length > 0) {
        await storePriceSnapshots(priceSnapshots);
        // eslint-disable-next-line no-console
        console.log(`🏊 Stored ${priceSnapshots.length || 'unknown'} price snapshots`);
      } else {
        // eslint-disable-next-line no-console
        console.warn('⚠️ No price snapshots fetched');
      }

      await connection.set('indexer:lastRun', Date.now());

      // eslint-disable-next-line no-console
      console.log('✅ Indexer job complete');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Indexer job failed:', error);
      throw error; // Re-throw to mark job as failed
    }
  },
  { connection }
);
