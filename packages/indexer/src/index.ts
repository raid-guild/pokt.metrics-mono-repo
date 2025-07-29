import { getMint } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';

import { db } from './db/client';
import { fetchPoolSnapshot } from './fetchers';
import { storePoolSnapshots, storePriceSnapshots } from './services';
import { PoolSnapshotRow } from './types';
import { ADDRESSES_BY_CHAIN, Chain } from './utils/chains';
import { baseClient, ethereumClient, solanaClient } from './utils/helpers';

const erc20Abi = [
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
];

export const runIndexer = async () => {
  // Get Ethereum and Solana prices from CoinGecko
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

  const poolSnapshots: PoolSnapshotRow[] = [];

  // Fetch wPokt price from Ethereum and Base
  let currentBlock = (await ethereumClient.getBlockNumber()) - BigInt(1); // Slight delay to ensure data availability
  let currentTimestamp =
    (await ethereumClient.getBlock({ blockNumber: currentBlock }).then((b) => b.timestamp)) *
    BigInt(1000); // Convert to ms

  const wpoktAddress = ADDRESSES_BY_CHAIN[Chain.ETHEREUM].wpokt as `0x${string}`;
  if (!wpoktAddress) {
    throw new Error('wPokt address not found for Ethereum chain');
  }
  let totalSupply = (await ethereumClient.readContract({
    address: wpoktAddress,
    abi: erc20Abi,
    functionName: 'totalSupply',
  })) as bigint;

  const ethereumPoolSnapshot = await fetchPoolSnapshot(
    Chain.ETHEREUM,
    ethPrice,
    currentBlock,
    currentTimestamp,
    totalSupply
  );

  if (ethereumPoolSnapshot) {
    poolSnapshots.push(ethereumPoolSnapshot);
  }

  currentBlock = (await baseClient.getBlockNumber()) - BigInt(2); // Slight delay to ensure data availability
  currentTimestamp =
    (await baseClient.getBlock({ blockNumber: currentBlock }).then((b) => b.timestamp)) *
    BigInt(1000); // Convert to ms

  totalSupply = (await baseClient.readContract({
    address: ADDRESSES_BY_CHAIN[Chain.BASE].wpokt as `0x${string}`,
    abi: erc20Abi,
    functionName: 'totalSupply',
  })) as bigint;
  const basePoolSnapshot = await fetchPoolSnapshot(
    Chain.BASE,
    ethPrice,
    currentBlock,
    currentTimestamp,
    totalSupply
  );

  if (basePoolSnapshot) {
    poolSnapshots.push(basePoolSnapshot);
  }

  // Fetch wPokt price from Solana
  const currentSolanaSlot = (await solanaClient.getSlot()) - 20; // Slight delay to ensure data availability
  const currentSolanaTimestamp = await solanaClient.getBlockTime(currentSolanaSlot);
  if (currentSolanaTimestamp === null) {
    throw new Error('Failed to fetch Solana block time');
  }

  const mintAddress = new PublicKey(ADDRESSES_BY_CHAIN[Chain.SOLANA].wpokt as string);
  const mintInfo = await getMint(solanaClient, mintAddress);
  if (!mintInfo) {
    throw new Error('Failed to fetch mint info for wPokt on Solana');
  }
  totalSupply = mintInfo.supply;
  const solanaPoolSnapshot = await fetchPoolSnapshot(
    Chain.SOLANA,
    solanaPrice,
    BigInt(currentSolanaSlot),
    BigInt(currentSolanaTimestamp * 1000), // Convert to ms
    totalSupply
  );

  if (solanaPoolSnapshot) {
    poolSnapshots.push(solanaPoolSnapshot);
  }

  // Store all fetched pool snapshots as price snapshots
  if (poolSnapshots.length > 0) {
    await storePriceSnapshots(poolSnapshots);
  } else {
    // eslint-disable-next-line no-console
    console.warn('⚠️ No price snapshots fetched');
  }

  // Get most recent pool_snapshot row
  const latestPoolSnapshot = await db.query<PoolSnapshotRow>(
    'SELECT * FROM pool_snapshots ORDER BY timestamp DESC LIMIT 1'
  );
  const latestPoolSnapshotRow = latestPoolSnapshot.rows[0];

  // If snapshot is over an hour old, store pool snapshots
  if (latestPoolSnapshotRow) {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    if (latestPoolSnapshotRow.timestamp < BigInt(oneHourAgo)) {
      await storePoolSnapshots(poolSnapshots);
    }
  } else {
    // If no snapshots exist, store the current pool snapshots
    await storePoolSnapshots(poolSnapshots);
  }
};

const main = async () => {
  try {
    // eslint-disable-next-line no-console
    console.log('Indexer is running...');

    await runIndexer();

    // eslint-disable-next-line no-console
    console.log('Indexer finished.');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in indexer:', error);
  }
};

main();
