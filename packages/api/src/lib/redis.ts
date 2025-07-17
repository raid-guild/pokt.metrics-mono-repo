import 'dotenv/config';

import IORedis from 'ioredis';

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL environment variable is required');
}

const redis = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

// eslint-disable-next-line no-console
redis.on('connect', () => console.log('[Redis] Connected'));
// eslint-disable-next-line no-console
redis.on('error', (err) => console.error('[Redis] Error:', err));

export default redis;
