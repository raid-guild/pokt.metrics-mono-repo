import 'dotenv/config';

import { Queue } from 'bullmq';
import IORedis from 'ioredis';

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL environment variable is required');
}

export const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

export const indexerQueue = new Queue('indexer', {
  connection,
});
