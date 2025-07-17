import 'dotenv/config';

import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

if (!process.env.INFURA_API_KEY) {
  throw new Error('INFURA_API_KEY environment variable is required');
}

export const ethereumClient = createPublicClient({
  chain: mainnet,
  transport: http(`https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`),
});

/**
 * Determines whether the price has changed significantly enough to insert in db.
 */
export const isSignificantlyDifferent = (a: number, b: number, epsilon = 0.000001): boolean => {
  return Math.abs(a - b) > epsilon;
};
