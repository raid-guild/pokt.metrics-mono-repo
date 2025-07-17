import { fetchPoolSnapshot } from './fetchers';
import { storePoolSnapshots } from './services';
import { PoolSnapshotRow } from './types';
import { getHourlyBlocks } from './utils/helpers';

const main = async () => {
  try {
    // eslint-disable-next-line no-console
    console.log('Historical sync is running...');
    // TODO: this range is temporary for testing
    const startBlock = BigInt(22561622);
    const endBlock = BigInt(22563622);

    const blocks = await getHourlyBlocks(startBlock, endBlock);

    const poolSnapshots: PoolSnapshotRow[] = [];

    for (const block of blocks) {
      const snapshot = await fetchPoolSnapshot('Ethereum', block.blockNumber, block.blockTimestamp);
      if (snapshot) poolSnapshots.push(snapshot);
    }

    const validSnapshots = poolSnapshots.filter((snapshot) => snapshot !== undefined);
    if (validSnapshots.length > 0) {
      await storePoolSnapshots(validSnapshots);
    } else {
      // eslint-disable-next-line no-console
      console.log('No valid snapshots found.');
    }

    // eslint-disable-next-line no-console
    console.log('Historical sync finished.');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Historical sync failed:', error);
    process.exit(1);
  }
};

main();
