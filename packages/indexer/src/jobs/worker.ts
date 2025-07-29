import { Worker } from 'bullmq';

import { runIndexer } from '..';
import { connection } from './queue';

export const indexerWorker = new Worker(
  'indexer',
  async () => {
    try {
      // eslint-disable-next-line no-console
      console.log('▶️ Running indexer job...');

      await runIndexer();

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
