import { ADDRESSES_BY_CHAIN, MachineType } from '../utils/chains';
import { moralisClient } from './moralisClient';
import { retry } from '../utils/retry';

export const fetchPoolSnapshots = async () => {
  try {
    const prices = await Promise.all(
      Object.entries(ADDRESSES_BY_CHAIN).map(
        async ([chain, { chainId, exchange, machineType, poolAddress, wpokt }]) => {
          return retry(
            async () => {
              if (machineType === MachineType.SOLANA) {
                return moralisClient.solana.getTokenPairStats({ poolAddress }).then((response) => ({
                  chain_id: chainId,
                  exchange,
                  machine_type: machineType,
                  pool_address: poolAddress,
                  price: parseFloat(response.currentUsdPrice),
                  timestamp: Date.now(),
                  token_address: wpokt,
                  tvl_usd: parseFloat(response.totalLiquidityUsd),
                  volume_usd: response.totalVolume['24h'],
                }));
              } else {
                return moralisClient.evm
                  .getTokenPairStats({ chainId, poolAddress })
                  .then((response) => ({
                    chain_id: chainId,
                    exchange,
                    machine_type: machineType,
                    pool_address: poolAddress,
                    price: parseFloat(response.currentUsdPrice),
                    timestamp: Date.now(),
                    token_address: wpokt,
                    tvl_usd: parseFloat(response.totalLiquidityUsd),
                    volume_usd: response.totalVolume['24h'],
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
