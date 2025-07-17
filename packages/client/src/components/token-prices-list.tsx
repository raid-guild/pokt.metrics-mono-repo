import { graphql } from 'gql.tada';
import { useQuery } from 'urql';

const TokenPricesQuery = graphql(`
  query {
    tokenPrices {
      chain_id
      price
      timestamp
      token_address
    }
  }
`);

const TokenPricesList = () => {
  const [result] = useQuery({
    query: TokenPricesQuery,
    variables: {},
  });

  return <div>
    <h1>Token Prices</h1>
    <pre>{JSON.stringify(result.data, null, 2)}</pre>
  </div>;
};

export default TokenPricesList;
