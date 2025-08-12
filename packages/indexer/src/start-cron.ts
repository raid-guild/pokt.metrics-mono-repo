import { schedule } from 'node-cron';

import { runIndexer } from '.';
import { logger } from './utils/logger';

schedule('*/5 * * * *', async () => {
  logger.info('▶️ Running indexer job...');
  try {
    await runIndexer();
    logger.info('✅ Indexer job complete');
  } catch (err) {
    logger.error({ error: err }, '❌ Indexer job failed');
  }
});
