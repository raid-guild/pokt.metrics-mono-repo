import { fetchTokenPrice } from './fetchers';

const main = async () => {
  // eslint-disable-next-line no-console
  console.log('Historical sync is running...');

  const ethereumPriceData = await fetchTokenPrice('Ethereum', 22571622);
  // eslint-disable-next-line no-console
  console.log(ethereumPriceData);
  const basePriceData = await fetchTokenPrice('Base', 30764668);
  // eslint-disable-next-line no-console
  console.log(basePriceData);

  // eslint-disable-next-line no-console
  console.log('Historical sync finished.');
};

main();
