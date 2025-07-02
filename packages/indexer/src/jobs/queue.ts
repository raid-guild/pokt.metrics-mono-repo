import 'dotenv/config';

import { Queue } from 'bullmq';
import IORedis from 'ioredis';

export const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

export const indexerQueue = new Queue('indexer', {
  connection,
});
