import { indexerQueue } from './queue';

export async function scheduleRecurringJob() {
  await indexerQueue.add(
    'run-indexer',
    {},
    {
      jobId: 'run-indexer-repeat',
      repeat: {
        // TODO: go back to every 15 minutes for production
        // pattern: '*/15 * * * *', // every 15 minutes
        pattern: '0 * * * *', // every hour
        immediately: true, // start immediately on boot
        // limit: 96, // (optional) max 96 runs per day
        limit: 24, // (optional) max 24 runs per day (hourly)
        offset: 0, // (optional) no delay after boot
      },
      removeOnComplete: true,
      removeOnFail: true,
    }
  );
}
