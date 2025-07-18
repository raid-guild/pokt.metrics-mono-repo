import 'dotenv/config';

import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

if (!process.env.ETHEREUM_RPC_URL) {
  throw new Error('ETHEREUM_RPC_URL environment variable is required');
}

export const ethereumClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.ETHEREUM_RPC_URL),
});

/**
 * Determines whether the price has changed significantly enough to insert in db.
 */
export const isSignificantlyDifferent = (a: number, b: number, epsilon = 0.000001): boolean => {
  return Math.abs(a - b) > epsilon;
};

/**
 * Fetches the timestamp of a block.
 * @param blockNumber - The block number to fetch the timestamp for.
 * @returns The timestamp of the block in seconds.
 */
const getBlockTimestamp = async (blockNumber: bigint): Promise<number> => {
  try {
    const block = await ethereumClient.getBlock({ blockNumber });
    return Number(block.timestamp);
  } catch (error) {
    throw new Error(`Failed to fetch block ${blockNumber}: ${error}`);
  }
};

/**
 * Finds the closest block to a target timestamp using binary search.
 * @param targetTime - The target timestamp in seconds.
 * @param low - The lower bound of the block range.
 * @param high - The upper bound of the block range.
 * @returns The block number closest to the target timestamp.
 */
const findClosestBlock = async (targetTime: number, low: bigint, high: bigint): Promise<bigint> => {
  while (low <= high) {
    const mid = (low + high) / 2n;
    const ts = await getBlockTimestamp(mid);

    if (ts === targetTime) return mid;
    if (ts < targetTime) low = mid + 1n;
    else high = mid - 1n;
  }
  return low;
};

/**
 * Gets hourly blocks between two block numbers.
 * @param startBlock - The starting block number.
 * @param endBlock - The ending block number.
 * @param intervalSec - The interval in seconds (default is 3600 for hourly).
 * @returns An array of block numbers at each hour.
 */
export const getHourlyBlocks = async (
  startBlock: bigint,
  endBlock: bigint,
  intervalSec = 3600 // Default to hourly intervals. TODO: switch to 15 minute intervals
): Promise<{ blockNumber: bigint; blockTimestamp: bigint }[]> => {
  const startTime = await getBlockTimestamp(startBlock);
  const endTime = await getBlockTimestamp(endBlock);

  const result: { blockNumber: bigint; blockTimestamp: bigint }[] = [];
  let currentTime = startTime;

  while (currentTime <= endTime) {
    // Estimate based on 12s block time
    const estimate = startBlock + BigInt((currentTime - startTime) / 12);
    const blockNumber = await findClosestBlock(currentTime, estimate - 150n, estimate + 150n);
    const blockTimestamp =
      (await ethereumClient.getBlock({ blockNumber }).then((b) => b.timestamp)) * BigInt(1000); // Convert to ms

    result.push({ blockNumber, blockTimestamp });
    currentTime += intervalSec;
  }

  return result;
};
