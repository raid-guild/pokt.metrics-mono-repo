import 'dotenv/config';

import { Connection } from '@solana/web3.js';
import { createPublicClient, http } from 'viem';
import { base, mainnet } from 'viem/chains';

if (!process.env.ETHEREUM_RPC_URL) {
  throw new Error('ETHEREUM_RPC_URL environment variable is required');
}

if (!process.env.BASE_RPC_URL) {
  throw new Error('BASE_RPC_URL environment variable is required');
}

if (!process.env.SOLANA_RPC_URL) {
  throw new Error('SOLANA_RPC_URL environment variable is required');
}

export const ethereumClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.ETHEREUM_RPC_URL),
});

export const baseClient = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL),
});

export const solanaClient = new Connection(process.env.SOLANA_RPC_URL, 'confirmed');

const clients = {
  Base: baseClient,
  Ethereum: ethereumClient,
  Solana: solanaClient,
};

/**
 * Determines whether the price has changed significantly enough to insert in db.
 */
export const isSignificantlyDifferent = (a: number, b: number, epsilon = 0.000001): boolean => {
  return Math.abs(a - b) > epsilon;
};

/**
 * Fetches the timestamp of a block.
 * @param clientName - The name of the client ('Base', 'Ethereum', or 'Solana').
 * @param blockNumber - The block number to fetch the timestamp for.
 * @returns The timestamp of the block in seconds.
 */
const getBlockTimestamp = async (
  clientName: 'Base' | 'Ethereum' | 'Solana',
  blockNumber: bigint
): Promise<number> => {
  try {
    if (clientName === 'Solana') {
      throw new Error('Solana block timestamp fetching not implemented');
    }
    const client = clients[clientName];
    if (!client) throw new Error(`Unsupported client: ${clientName}`);
    const block = await client.getBlock({ blockNumber });
    return Number(block.timestamp);
  } catch (error) {
    throw new Error(`Failed to fetch block ${blockNumber}: ${error}`);
  }
};

/**
 * Finds the closest block to a target timestamp using binary search.
 * @param clientName - The name of the client ('Base', 'Ethereum', or 'Solana').
 * @param targetTime - The target timestamp in seconds.
 * @param low - The lower bound of the block range.
 * @param high - The upper bound of the block range.
 * @returns The block number closest to the target timestamp.
 */
const findClosestBlock = async (
  clientName: 'Base' | 'Ethereum' | 'Solana',
  targetTime: number,
  low: bigint,
  high: bigint
): Promise<bigint> => {
  while (low <= high) {
    const mid = (low + high) / 2n;
    const ts = await getBlockTimestamp(clientName, mid);

    if (ts === targetTime) return mid;
    if (ts < targetTime) low = mid + 1n;
    else high = mid - 1n;
  }
  return low;
};

const blockSeconds = {
  Ethereum: 12,
  Base: 2,
};

/**
 * Gets hourly blocks between two block numbers.
 * @param clientName - The name of the client ('Base', 'Ethereum', or 'Solana').
 * @param startBlock - The starting block number.
 * @param endBlock - The ending block number.
 * @param intervalSec - The interval in seconds (default is 3600 for hourly).
 * @returns An array of block numbers at each hour.
 */
export const getHourlyBlocks = async (
  clientName: 'Base' | 'Ethereum' | 'Solana',
  startBlock: bigint,
  endBlock: bigint,
  intervalSec = 3600 // Default to hourly intervals. TODO: switch to 15 minute intervals
): Promise<{ blockNumber: bigint; blockTimestamp: bigint }[]> => {
  if (clientName === 'Solana') throw new Error('Solana hourly blocks not implemented');
  const client = clients[clientName];
  if (!client) throw new Error(`Unsupported client: ${clientName}`);

  const startTime = await getBlockTimestamp(clientName, startBlock);
  const endTime = await getBlockTimestamp(clientName, endBlock);

  const result: { blockNumber: bigint; blockTimestamp: bigint }[] = [];
  let currentTime = startTime;

  while (currentTime <= endTime) {
    // Estimate based on block time
    const estimate = startBlock + BigInt((currentTime - startTime) / blockSeconds[clientName]!);
    const blockNumber = await findClosestBlock(
      clientName,
      currentTime,
      estimate - 150n,
      estimate + 150n
    );
    const blockTimestamp =
      (await client.getBlock({ blockNumber }).then((b) => b.timestamp)) * BigInt(1000); // Convert to ms

    result.push({ blockNumber, blockTimestamp });
    currentTime += intervalSec;
  }

  return result;
};
