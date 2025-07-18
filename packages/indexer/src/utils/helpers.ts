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
