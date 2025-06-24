import 'dotenv/config';

import { ApolloServer } from 'apollo-server-express';
import express from 'express';

import { resolvers } from './resolvers';
import { typeDefs } from './schema';

async function startServer() {
  const app = express();

  const server = new ApolloServer({
    resolvers,
    typeDefs,
  });

  await server.start();
  server.applyMiddleware({ app });

  const port = process.env.PORT || 4000;
  const host = process.env.HOST || 'localhost';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';

  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 Server ready at ${protocol}://${host}:${port}${server.graphqlPath}`);
  });
}

startServer();
