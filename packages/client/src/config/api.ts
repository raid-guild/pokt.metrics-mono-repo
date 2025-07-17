import { cacheExchange, Client, fetchExchange } from 'urql';

export const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT;

if (!GRAPHQL_ENDPOINT) {
  /* eslint-disable-next-line no-console */
  console.error('⛔  Missing NEXT_PUBLIC_GRAPHQL_ENDPOINT – aborting build');
  process.exit(1);
}

export const client = new Client({
  url: GRAPHQL_ENDPOINT,
  exchanges: [cacheExchange, fetchExchange],
});
