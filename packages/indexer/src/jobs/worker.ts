import { Worker } from 'bullmq';

import { fetchPoolSnapshots, fetchTokenPrices } from '../fetchers';
import { storePoolSnapshots, storeTokenPrices } from '../services';
import { connection } from './queue';

export const indexerWorker = new Worker(
  'indexer',
  async () => {
    // eslint-disable-next-line no-console
    console.log('▶️ Running indexer job...');

    try {
      const tokenPrices = await fetchTokenPrices();
      if (tokenPrices) {
        await storeTokenPrices(tokenPrices);
        // eslint-disable-next-line no-console
        console.log(`💰 Stored ${Object.keys(tokenPrices).length} token prices`);
      } else {
        // eslint-disable-next-line no-console
        console.warn('⚠️ No token prices fetched');
      }

      const poolSnapshots = await fetchPoolSnapshots();
      if (poolSnapshots) {
        await storePoolSnapshots(poolSnapshots);
        // eslint-disable-next-line no-console
        console.log(`🏊 Stored ${poolSnapshots.length || 'unknown'} pool snapshots`);
      } else {
        // eslint-disable-next-line no-console
        console.warn('⚠️ No pool snapshots fetched');
      }

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
