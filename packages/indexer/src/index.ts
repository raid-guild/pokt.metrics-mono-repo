import { fetchPoolSnapshot } from './fetchers';
import { storePoolSnapshots } from './services';
import { ethereumClient } from './utils/helpers';

const main = async () => {
  // eslint-disable-next-line no-console
  console.log('Indexer is running...');

  const poolSnapshots = [];
  const currentEthereumBlock = await ethereumClient.getBlockNumber();
  const ethereumPoolSnapshot = await fetchPoolSnapshot('Ethereum', currentEthereumBlock);

  if (ethereumPoolSnapshot) {
    poolSnapshots.push(ethereumPoolSnapshot);
  }

  if (poolSnapshots.length > 0) {
    await storePoolSnapshots(poolSnapshots);
  } else {
    // eslint-disable-next-line no-console
    console.warn('⚠️ No pool snapshots fetched');
  }

  // eslint-disable-next-line no-console
  console.log('Indexer finished.');
};

main();
