import { fetchPoolSnapshot, fetchTokenPrice } from './fetchers';

const main = async () => {
  // eslint-disable-next-line no-console
  console.log('Indexer is running...');

  const tokenPrices = await fetchTokenPrice();
  // eslint-disable-next-line no-console
  console.log('Token prices:', tokenPrices);

  const poolSnapshots = await fetchPoolSnapshot();
  // eslint-disable-next-line no-console
  console.log('Pool snapshots:', poolSnapshots);
};

main();
