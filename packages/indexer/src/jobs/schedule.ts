import { indexerQueue } from './queue';

export async function scheduleRecurringJob() {
  await indexerQueue.add(
    'run-indexer',
    {},
    {
      jobId: 'run-indexer-repeat',
      repeat: {
        pattern: '*/15 * * * *', // every 15 minutes
        immediately: true, // start immediately on boot
        limit: 96, // (optional) max 96 runs per day
        offset: 0, // (optional) no delay after boot
      },
      removeOnComplete: true,
      removeOnFail: true,
    }
  );
}
