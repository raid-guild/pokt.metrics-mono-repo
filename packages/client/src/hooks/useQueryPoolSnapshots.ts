import { graphql, ResultOf } from 'gql.tada';
import { useMemo } from 'react';
import { useQuery } from 'urql';

import { TokenPair } from '@/lib/utils';

import { useTokenPairSortingOrder } from './usePoolSortingOrder';

const query = graphql(`
  query PoolSnapshots {
    poolSnapshots {
      base {
        average_price
        chain
        timestamp
        volume_usd
        block_number
        circulating_supply
        exchange
        market_cap
        holders
        pool_address
        token_address
        volatility
        tvl_usd
      }
      ethereum {
        average_price
        block_number
        chain
        circulating_supply
        exchange
        holders
        market_cap
        pool_address
        timestamp
        token_address
        tvl_usd
        volatility
        volume_usd
      }
      solana {
        average_price
        block_number
        chain
        circulating_supply
        exchange
        holders
        market_cap
        pool_address
        timestamp
        token_address
        tvl_usd
        volatility
        volume_usd
      }
    }
  }
`);

export const useQueryPoolSnapshots = () => {
  const [{ data, fetching, error }, refetch] = useQuery({
    query,
  });
  const { setSortingOrder } = useTokenPairSortingOrder();

  const sortedData = useMemo(() => {
    if (fetching) return null;
    if (!data) return null;

    const result = [
      {
        ...data.poolSnapshots.ethereum,
        tokenPair: TokenPair.wPOKT_wETH,
      },
      {
        ...data.poolSnapshots.solana,
        tokenPair: TokenPair.POKT_SOL,
      },
      {
        ...data.poolSnapshots.base,
        tokenPair: TokenPair.POKT_wETH,
      },
    ];

    const sortedResult = result.toSorted((a, b) => {
      return a.average_price - b.average_price;
    });

    setSortingOrder(sortedResult.map((x) => x.tokenPair));

    return sortedResult;
  }, [fetching, data]);

  return { data: sortedData, fetching, error, refetch };
};

export type PoolSnapshot = {
  tokenPair: TokenPair;
} & ResultOf<typeof query>['poolSnapshots']['ethereum'];
