import { fetchPoolSnapshot } from './fetchers';

const main = async () => {
  // eslint-disable-next-line no-console
  console.log('Historical sync is running...');

  const ethereumPoolSnapshot = await fetchPoolSnapshot('Ethereum', 22571622);
  // eslint-disable-next-line no-console
  console.log(ethereumPoolSnapshot);
  const basePoolSnapshot = await fetchPoolSnapshot('Base', 30764668);
  // eslint-disable-next-line no-console
  console.log(basePoolSnapshot);

  // eslint-disable-next-line no-console
  console.log('Historical sync finished.');
};

main();
