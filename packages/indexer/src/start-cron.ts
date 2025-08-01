import { indexerQueue } from './jobs/queue';
import { scheduleRecurringJob } from './jobs/schedule';
import { indexerWorker } from './jobs/worker';
import { logger } from './utils/logger';

(async () => {
  try {
    const repeatableJobs = await indexerQueue.getJobSchedulers();
    for (const job of repeatableJobs) {
      await indexerQueue.removeJobScheduler(job.key);
      logger.info({ jobKey: job.key }, '🗑️ Removed repeatable job');
    }

    await scheduleRecurringJob();
    logger.info('⏰ Scheduled recurring indexer job');
  } catch (error) {
    logger.error({ error }, '❌ Failed to initialize job scheduling');
    process.exit(1);
  }
})();

indexerWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, '✅ Job finished');
});

indexerWorker.on('failed', (job, err) => {
  logger.error({ error: err, jobId: job?.id }, '❌ Job failed');
});
