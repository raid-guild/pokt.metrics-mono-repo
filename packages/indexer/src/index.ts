import { fetchPriceSnapshot } from './fetchers';
import { storePriceSnapshots } from './services';
import { Chain } from './utils/chains';
import { baseClient, ethereumClient, solanaClient } from './utils/helpers';

const main = async () => {
  try {
    // eslint-disable-next-line no-console
    console.log('Indexer is running...');

    let response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd`,
      {
        method: 'GET',
      }
    );
    let data = await response.json();

    if (!data || !data.ethereum || !data.ethereum.usd) {
      throw new Error('Failed to fetch Ethereum price from CoinGecko');
    }

    const ethPrice = parseFloat(data.ethereum.usd);

    response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd`,
      {
        method: 'GET',
      }
    );
    data = await response.json();

    if (!data || !data.solana || !data.solana.usd) {
      throw new Error('Failed to fetch Solana price from CoinGecko');
    }

    const solanaPrice = parseFloat(data.solana.usd);

    const priceSnapshots = [];
    const currentEthereumBlock = (await ethereumClient.getBlockNumber()) - BigInt(1); // Slight delay to ensure data availability
    const currentEthereumTimestamp =
      (await ethereumClient
        .getBlock({ blockNumber: currentEthereumBlock })
        .then((b) => b.timestamp)) * BigInt(1000); // Convert to ms
    const ethereumPriceSnapshot = await fetchPriceSnapshot(
      Chain.ETHEREUM,
      ethPrice,
      currentEthereumBlock,
      currentEthereumTimestamp
    );

    if (ethereumPriceSnapshot) {
      priceSnapshots.push(ethereumPriceSnapshot);
    }

    const currentBaseBlock = (await baseClient.getBlockNumber()) - BigInt(2); // Slight delay to ensure data availability
    const currentBaseTimestamp =
      (await baseClient.getBlock({ blockNumber: currentBaseBlock }).then((b) => b.timestamp)) *
      BigInt(1000); // Convert to ms
    const basePriceSnapshot = await fetchPriceSnapshot(
      Chain.BASE,
      ethPrice,
      currentBaseBlock,
      currentBaseTimestamp
    );

    if (basePriceSnapshot) {
      priceSnapshots.push(basePriceSnapshot);
    }

    const currentSolanaSlot = await solanaClient.getSlot();
    const currentSolanaTimestamp = await solanaClient.getBlockTime(currentSolanaSlot);
    if (currentSolanaTimestamp === null) {
      throw new Error('Failed to fetch Solana block time');
    }

    const solanaPriceSnapshot = await fetchPriceSnapshot(
      Chain.SOLANA,
      solanaPrice,
      BigInt(currentSolanaSlot),
      BigInt(currentSolanaTimestamp * 1000) // Convert to ms
    );

    if (solanaPriceSnapshot) {
      priceSnapshots.push(solanaPriceSnapshot);
    }

    if (priceSnapshots.length > 0) {
      await storePriceSnapshots(priceSnapshots);
    } else {
      // eslint-disable-next-line no-console
      console.warn('⚠️ No price snapshots fetched');
    }

    // eslint-disable-next-line no-console
    console.log('Indexer finished.');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in indexer:', error);
  }
};

main();
