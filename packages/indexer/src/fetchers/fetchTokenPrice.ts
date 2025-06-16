import { ADDRESSES_BY_CHAIN, ApiType } from '../utils/chains';
import { Moralis } from '../utils/moralisClient';
import { retry } from '../utils/retry';

export const fetchTokenPrice = async () => {
  try {
    const prices = await Promise.all(
      Object.entries(ADDRESSES_BY_CHAIN).map(async ([chain, { apiType, networkId, wpokt }]) => {
        return retry(
          async () => {
            if (apiType === ApiType.SolApi) {
              return Moralis.SolApi.token
                .getTokenPrice({ address: wpokt, network: networkId })
                .then((response) => ({
                  chain,
                  price: response.raw.usdPrice,
                }));
            } else {
              return Moralis.EvmApi.token
                .getTokenPrice({ address: wpokt, chain: networkId })
                .then((response) => ({
                  chain,
                  price: response.raw.usdPrice,
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
      })
    );
    return prices;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching token price:', error);
  }
};
