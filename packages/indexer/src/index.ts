import { fetchPoolSnapshot } from './fetchers';
import { storePoolSnapshots } from './services';
import { baseClient, ethereumClient } from './utils/helpers';

const main = async () => {
  // eslint-disable-next-line no-console
  console.log('Indexer is running...');

  const poolSnapshots = [];
  const currentEthereumBlock = (await ethereumClient.getBlockNumber()) - BigInt(5); // Slight delay to ensure data availability
  const currentEthereumTimestamp =
    (await ethereumClient
      .getBlock({ blockNumber: currentEthereumBlock })
      .then((b) => b.timestamp)) * BigInt(1000); // Convert to ms
  const ethereumPoolSnapshot = await fetchPoolSnapshot(
    'Ethereum',
    currentEthereumBlock,
    currentEthereumTimestamp
  );

  if (ethereumPoolSnapshot) {
    poolSnapshots.push(ethereumPoolSnapshot);
  }

  const currentBaseBlock = (await baseClient.getBlockNumber()) - BigInt(5); // Slight delay to ensure data availability
  const currentBaseTimestamp =
    (await baseClient.getBlock({ blockNumber: currentBaseBlock }).then((b) => b.timestamp)) *
    BigInt(1000); // Convert to ms
  const basePoolSnapshot = await fetchPoolSnapshot('Base', currentBaseBlock, currentBaseTimestamp);

  if (basePoolSnapshot) {
    poolSnapshots.push(basePoolSnapshot);
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
