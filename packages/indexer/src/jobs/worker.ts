import { Worker } from 'bullmq';

import { fetchPoolSnapshots, fetchTokenPrices } from '../fetchers';
import { storePoolSnapshots, storeTokenPrices } from '../services';
import { connection } from './queue';

export const indexerWorker = new Worker(
  'indexer',
  async () => {
    // eslint-disable-next-line no-console
    console.log('▶️ Running indexer job...');

    const tokenPrices = await fetchTokenPrices();
    if (tokenPrices) {
      await storeTokenPrices(tokenPrices);
    }

    const poolSnapshots = await fetchPoolSnapshots();
    if (poolSnapshots) {
      await storePoolSnapshots(poolSnapshots);
    }

    // eslint-disable-next-line no-console
    console.log('✅ Indexer job complete');
  },
  { connection }
);
