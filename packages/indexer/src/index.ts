import { fetchPoolSnapshots, fetchTokenPrices } from './fetchers';
import { storePoolSnapshots, storeTokenPrices } from './services';

const main = async () => {
  // eslint-disable-next-line no-console
  console.log('Indexer is running...');

  const tokenPrices = await fetchTokenPrices();
  if (tokenPrices) {
    await storeTokenPrices(tokenPrices);
  }

  const poolSnapshots = await fetchPoolSnapshots();
  if (poolSnapshots) {
    await storePoolSnapshots(poolSnapshots);
  }

  // eslint-disable-next-line no-console
  console.log('Indexer finished.');
};

main();
