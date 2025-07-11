import { TokenPriceRow } from '../types';
import { ADDRESSES_BY_CHAIN, MachineType } from '../utils/chains';
import { retry } from '../utils/retry';
import { moralisClient } from './moralisClient';

export const fetchTokenPrices = async () => {
  try {
    const prices: TokenPriceRow[] = await Promise.all(
      Object.entries(ADDRESSES_BY_CHAIN).map(
        async ([chain, { chainId, exchange, machineType, wpokt }]) => {
          return retry(
            async () => {
              if (machineType === MachineType.SOLANA) {
                return moralisClient.solana
                  .getTokenPrice({ tokenAddress: wpokt })
                  .then((response) => ({
                    chain_id: chainId,
                    exchange,
                    machine_type: machineType,
                    price: parseFloat(response.usdPrice),
                    timestamp: Date.now(),
                    token_address: wpokt,
                  }));
              } else {
                return moralisClient.evm
                  .getTokenPrice({ tokenAddress: wpokt, chainId })
                  .then((response) => ({
                    chain_id: chainId,
                    exchange,
                    machine_type: machineType,
                    price: response.usdPrice,
                    timestamp: Date.now(),
                    token_address: wpokt,
                  }));
              }
            },
            {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onRetry: (err: any, attempt) =>
                // eslint-disable-next-line no-console
                console.warn(`Retrying ${chain} (attempt ${attempt}):`, err.message),
            }
          );
        }
      )
    );
    return prices;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching token price:', error);
  }
};
