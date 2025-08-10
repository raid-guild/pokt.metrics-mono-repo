/* eslint-disable */
/* prettier-ignore */

export type introspection_types = {
    'Boolean': unknown;
    'Chain': { name: 'Chain'; enumValues: 'ethereum' | 'base' | 'solana'; };
    'Float': unknown;
    'Int': unknown;
    'Interval': { name: 'Interval'; enumValues: '_15m' | '_30m' | '_1h'; };
    'MarketData': { kind: 'OBJECT'; name: 'MarketData'; fields: { 'all_time_high': { name: 'all_time_high'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'Float'; ofType: null; }; } }; 'all_time_low': { name: 'all_time_low'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'Float'; ofType: null; }; } }; 'circulating_supply': { name: 'circulating_supply'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'Float'; ofType: null; }; } }; 'day_high_price': { name: 'day_high_price'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'Float'; ofType: null; }; } }; 'day_low_price': { name: 'day_low_price'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'Float'; ofType: null; }; } }; 'day_volume': { name: 'day_volume'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'Float'; ofType: null; }; } }; 'market_cap': { name: 'market_cap'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'Float'; ofType: null; }; } }; 'price': { name: 'price'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'Float'; ofType: null; }; } }; 'timestamp': { name: 'timestamp'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'Int'; ofType: null; }; } }; }; };
    'PoolSnapshotRow': { kind: 'OBJECT'; name: 'PoolSnapshotRow'; fields: { 'average_price': { name: 'average_price'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'Float'; ofType: null; }; } }; 'block_number': { name: 'block_number'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; } }; 'chain': { name: 'chain'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'ENUM'; name: 'Chain'; ofType: null; }; } }; 'circulating_supply': { name: 'circulating_supply'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'Float'; ofType: null; }; } }; 'exchange': { name: 'exchange'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; } }; 'holders': { name: 'holders'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'Float'; ofType: null; }; } }; 'market_cap': { name: 'market_cap'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'Float'; ofType: null; }; } }; 'pool_address': { name: 'pool_address'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; } }; 'pool_age': { name: 'pool_age'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'Int'; ofType: null; }; } }; 'timestamp': { name: 'timestamp'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'Int'; ofType: null; }; } }; 'token_address': { name: 'token_address'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; } }; 'tvl_usd': { name: 'tvl_usd'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'Float'; ofType: null; }; } }; 'volatility': { name: 'volatility'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'Float'; ofType: null; }; } }; 'volume_usd': { name: 'volume_usd'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'Float'; ofType: null; }; } }; }; };
    'PoolSnapshots': { kind: 'OBJECT'; name: 'PoolSnapshots'; fields: { 'base': { name: 'base'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'OBJECT'; name: 'PoolSnapshotRow'; ofType: null; }; } }; 'ethereum': { name: 'ethereum'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'OBJECT'; name: 'PoolSnapshotRow'; ofType: null; }; } }; 'solana': { name: 'solana'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'OBJECT'; name: 'PoolSnapshotRow'; ofType: null; }; } }; }; };
    'PriceSnapshot': { kind: 'OBJECT'; name: 'PriceSnapshot'; fields: { 'block_number': { name: 'block_number'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; } }; 'chain': { name: 'chain'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'ENUM'; name: 'Chain'; ofType: null; }; } }; 'exchange': { name: 'exchange'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; } }; 'pool_address': { name: 'pool_address'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; } }; 'price': { name: 'price'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'Float'; ofType: null; }; } }; 'timestamp': { name: 'timestamp'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'Int'; ofType: null; }; } }; 'token_address': { name: 'token_address'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; } }; }; };
    'PriceSnapshots': { kind: 'OBJECT'; name: 'PriceSnapshots'; fields: { 'base': { name: 'base'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'LIST'; name: never; ofType: { kind: 'NON_NULL'; name: never; ofType: { kind: 'OBJECT'; name: 'PriceSnapshot'; ofType: null; }; }; }; } }; 'ethereum': { name: 'ethereum'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'LIST'; name: never; ofType: { kind: 'NON_NULL'; name: never; ofType: { kind: 'OBJECT'; name: 'PriceSnapshot'; ofType: null; }; }; }; } }; 'solana': { name: 'solana'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'LIST'; name: never; ofType: { kind: 'NON_NULL'; name: never; ofType: { kind: 'OBJECT'; name: 'PriceSnapshot'; ofType: null; }; }; }; } }; }; };
    'Query': { kind: 'OBJECT'; name: 'Query'; fields: { 'marketData': { name: 'marketData'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'OBJECT'; name: 'MarketData'; ofType: null; }; } }; 'poolSnapshots': { name: 'poolSnapshots'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'OBJECT'; name: 'PoolSnapshots'; ofType: null; }; } }; 'priceSnapshots': { name: 'priceSnapshots'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'OBJECT'; name: 'PriceSnapshots'; ofType: null; }; } }; }; };
    'String': unknown;
};

/** An IntrospectionQuery representation of your schema.
 *
 * @remarks
 * This is an introspection of your schema saved as a file by GraphQLSP.
 * It will automatically be used by `gql.tada` to infer the types of your GraphQL documents.
 * If you need to reuse this data or update your `scalars`, update `tadaOutputLocation` to
 * instead save to a .ts instead of a .d.ts file.
 */
export type introspection = {
  name: never;
  query: 'Query';
  mutation: never;
  subscription: never;
  types: introspection_types;
};

import * as gqlTada from 'gql.tada';

declare module 'gql.tada' {
  interface setupSchema {
    introspection: introspection
  }
}