import { fetchPoolSnapshots, fetchTokenPrices } from './fetchers';

const main = async () => {
  // eslint-disable-next-line no-console
  console.log('Indexer is running...');

  const tokenPrices = await fetchTokenPrices();
  // eslint-disable-next-line no-console
  console.log('Token prices:', tokenPrices);

  const poolSnapshots = await fetchPoolSnapshots();
  // eslint-disable-next-line no-console
  console.log('Pool snapshots:', poolSnapshots);
};

main();
