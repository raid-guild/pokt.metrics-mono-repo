import { graphql, ResultOf, VariablesOf } from 'gql.tada';
import { useQuery } from 'urql';

import { TokenPair } from '@/lib/utils';

const query = graphql(`
  query PriceSnapshots($interval: Interval!) {
    priceSnapshots(interval: $interval) {
      base {
        price
        chain
        exchange
        timestamp
        token_address
        pool_address
      }
      ethereum {
        price
        chain
        exchange
        timestamp
        token_address
        pool_address
      }
      solana {
        price
        chain
        exchange
        timestamp
        token_address
        pool_address
      }
    }
  }
`);

export type Interval = VariablesOf<typeof query>['interval'];

export type PriceSnapshot = {
  tokenPair: TokenPair;
} & ResultOf<typeof query>['priceSnapshots']['ethereum'];

export const useQueryPriceSnapshots = ({ interval }: { interval: Interval }) => {
  const [{ data, fetching, error }, refetch] = useQuery({
    query,
    variables: {
      interval,
    },
  });

  return { data, fetching, error, refetch };
};
