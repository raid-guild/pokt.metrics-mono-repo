import { cacheExchange, Client, fetchExchange } from 'urql';

export const GRAPHQL_ENDPOINT = 'https://pokt-metrics-api.onrender.com/graphql';

export const client = new Client({
  url: GRAPHQL_ENDPOINT,
  exchanges: [cacheExchange, fetchExchange],
});
