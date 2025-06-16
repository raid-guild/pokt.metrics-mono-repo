import { fetchTokenPrice } from './fetchers';

const main = async () => {
  // eslint-disable-next-line no-console
  console.log('Indexer is running...');

  const tokenPrice = await fetchTokenPrice();
  // eslint-disable-next-line no-console
  console.log('Token Price:', tokenPrice);
};

main();
