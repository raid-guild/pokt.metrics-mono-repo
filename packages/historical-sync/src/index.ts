import { fetchPoolSnapshot } from '@pokt.metrics/indexer/dist/fetchers';
import { storePoolSnapshots } from '@pokt.metrics/indexer/dist/services';
import { PoolSnapshotRow } from '@pokt.metrics/indexer/dist/types';
import { getHourlyBlocks } from '@pokt.metrics/indexer/dist/utils/helpers';

const main = async () => {
  try {
    // eslint-disable-next-line no-console
    console.log('Historical sync is running...');

    if (!process.env.CHAIN_NAME) throw new Error('CHAIN_NAME env var is required');
    const chainName = process.env.CHAIN_NAME.toString();
    if (chainName !== 'Ethereum' && chainName !== 'Base' && chainName !== 'Solana') {
      throw new Error('CHAIN_NAME must be one of Ethereum, Base, or Solana');
    }

    if (!process.env.START_BLOCK || !process.env.END_BLOCK) {
      throw new Error('START_BLOCK and END_BLOCK env vars are required');
    }
    const startBlock = BigInt(process.env.START_BLOCK);
    const endBlock = BigInt(process.env.END_BLOCK);

    const blocks = await getHourlyBlocks(chainName, startBlock, endBlock);

    const poolSnapshots: PoolSnapshotRow[] = [];

    for (const block of blocks) {
      const snapshot = await fetchPoolSnapshot(chainName, block.blockNumber, block.blockTimestamp);
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
