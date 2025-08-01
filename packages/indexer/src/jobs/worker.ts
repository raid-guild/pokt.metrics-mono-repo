import { Worker } from 'bullmq';

import { runIndexer } from '..';
import { logger } from '../utils/logger';
import { connection } from './queue';

export const indexerWorker = new Worker(
  'indexer',
  async () => {
    try {
      logger.info('▶️ Running indexer job...');

      await runIndexer();

      await connection.set('indexer:lastRun', Date.now());

      logger.info('✅ Indexer job complete');
    } catch (error) {
      logger.error({ error }, '❌ Indexer job failed:');
      throw error; // Re-throw to mark job as failed
    }
  },
  { connection }
);
