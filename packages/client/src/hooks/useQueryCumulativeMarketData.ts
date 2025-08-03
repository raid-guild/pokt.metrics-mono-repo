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

// const query = graphql(`
//   query Snapshots($interval: Interval!) {
//     priceSnapshots(interval: $interval) {
//       base {
//         price
//       }
//       ethereum {
//         block_number
//         chain
//         exchange
//         pool_address
//         price
//         timestamp
//         token_address
//       }
//       solana {
//         block_number
//         chain
//         exchange
//         pool_address
//         price
//         timestamp
//         token_address
//       }
//     }
//     poolSnapshots {
//       base {
//         average_price
//         chain
//         timestamp
//         volume_usd
//         block_number
//         circulating_supply
//         exchange
//         market_cap
//         holders
//         pool_address
//         token_address
//         volatility
//         tvl_usd
//       }
//       ethereum {
//         average_price
//         block_number
//         chain
//         circulating_supply
//         exchange
//         holders
//         market_cap
//         pool_address
//         timestamp
//         token_address
//         tvl_usd
//         volatility
//         volume_usd
//       }
//       solana {
//         average_price
//         block_number
//         chain
//         circulating_supply
//         exchange
//         holders
//         market_cap
//         pool_address
//         timestamp
//         token_address
//         tvl_usd
//         volatility
//         volume_usd
//       }
//     }
//     marketData {
//       all_time_high
//       all_time_low
//       circulating_supply
//       day_high_price
//       day_low_price
//       day_volume
//       market_cap
//       price
//       timestamp
//     }
//   }
// `);

export const useQueryCumulativeMarketData = () => {
  const [result, refetch] = useQuery({
    query,
    // variables: {
    //   interval: '_15m',
    // },
  });

  const data = result.data;
  const loading = result.fetching;
  const error = result.error;
  return { data, loading, error, refetch };
};
