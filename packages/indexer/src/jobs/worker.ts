import { Worker } from 'bullmq';

import { fetchPoolSnapshot } from '../fetchers';
import { storePoolSnapshots } from '../services';
import { ethereumClient } from '../utils/helpers';
import { connection } from './queue';

export const indexerWorker = new Worker(
  'indexer',
  async () => {
    // eslint-disable-next-line no-console
    console.log('▶️ Running indexer job...');

    try {
      const poolSnapshots = [];
      const currentEthereumBlock = (await ethereumClient.getBlockNumber()) - BigInt(5); // Slight delay to ensure data availability
      const currentEthereumTimestamp =
        (await ethereumClient
          .getBlock({ blockNumber: currentEthereumBlock })
          .then((b) => b.timestamp)) * BigInt(1000); // Convert to ms
      const ethereumPoolSnapshot = await fetchPoolSnapshot(
        'Ethereum',
        currentEthereumBlock,
        currentEthereumTimestamp
      );

      if (ethereumPoolSnapshot) {
        poolSnapshots.push(ethereumPoolSnapshot);
      }

      if (poolSnapshots.length > 0) {
        await storePoolSnapshots(poolSnapshots);
        // eslint-disable-next-line no-console
        console.log(`🏊 Stored ${poolSnapshots.length || 'unknown'} pool snapshots`);
      } else {
        // eslint-disable-next-line no-console
        console.warn('⚠️ No pool snapshots fetched');
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
