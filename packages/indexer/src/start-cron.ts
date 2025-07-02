import { indexerQueue } from './jobs/queue';
import { scheduleRecurringJob } from './jobs/schedule';
import { indexerWorker } from './jobs/worker';

(async () => {
  try {
    const repeatableJobs = await indexerQueue.getJobSchedulers();
    for (const job of repeatableJobs) {
      await indexerQueue.removeJobScheduler(job.key);
      // eslint-disable-next-line no-console
      console.log(`🗑️ Removed repeatable job: ${job.key}`);
    }

    await scheduleRecurringJob();
    // eslint-disable-next-line no-console
    console.log('⏰ Scheduled recurring indexer job');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Failed to initialize job scheduling:', error);
    process.exit(1);
  }
})();

indexerWorker.on('completed', (job) => {
  // eslint-disable-next-line no-console
  console.log(`✅ Job ${job.id} finished at ${new Date().toISOString()}`);
});

indexerWorker.on('failed', (job, err) => {
  // eslint-disable-next-line no-console
  console.error(`❌ Job ${job?.id} failed:`, err);
});
