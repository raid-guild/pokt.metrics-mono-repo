import { graphql } from 'gql.tada';
import { useQuery } from 'urql';

const query = graphql(`
  query MarketData {
    marketData {
      all_time_high
      all_time_low
      circulating_supply
      day_high_price
      day_low_price
      day_volume
      market_cap
      price
      timestamp
    }
  }
`);
export const useQueryCumulativeMarketData = () => {
  const [result, refetch] = useQuery({
    query,
  });

  const data = result.data;
  const loading = result.fetching;
  const error = result.error;
  return { data, loading, error, refetch };
};
