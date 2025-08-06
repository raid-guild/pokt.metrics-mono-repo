import { runIndexer } from '@pokt.metrics/indexer/dist';

const main = async () => {
  try {
    // eslint-disable-next-line no-console
    console.log('Historical sync is running...');

    await runIndexer();

    // eslint-disable-next-line no-console
    console.log('Historical sync finished.');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Historical sync failed:', error);
    process.exit(1);
  }
};

main();
