import 'dotenv/config';

import { ApolloServer } from 'apollo-server-express';
import express from 'express';

import { db } from './db';
import { resolvers } from './resolvers';
import { typeDefs } from './schema';
import { sendIndexerAlertEmail } from './utils/mailer';

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

  let alreadyAlerted = false;
  const LAST_RUN_QUERY = 'SELECT MAX(timestamp) as timestamp FROM price_snapshots';

  app.get('/', (_, res) => {
    res.redirect('/graphql');
  });

  app.get('/healthz', async (_, res) => {
    try {
      const now = Date.now();
      const { rows } = await db.query(LAST_RUN_QUERY);
      const lastIndexerRun = rows[0]?.timestamp ? BigInt(rows[0].timestamp) : null;

      if (!lastIndexerRun) {
        if (!alreadyAlerted) {
          await sendIndexerAlertEmail('never');
          alreadyAlerted = true;
        }
        return res.status(200).send('No lastIndexerRun recorded');
      }

      const diff = now - Number(lastIndexerRun);
      const threshold = 10 * 60 * 1000; // 10 minutes

      if (diff > threshold) {
        if (!alreadyAlerted) {
          await sendIndexerAlertEmail(new Date(Number(lastIndexerRun)).toISOString());
          alreadyAlerted = true;
        }
        return res.status(200).send(`Stale indexer: last run ${Math.floor(diff / 60000)} min ago`);
      }

      return res.status(200).send('ok');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Health check error:', err);
      return res.status(500).json({ status: 'error', message: 'Health check failed' });
    }
  });

  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 Server ready at ${protocol}://${host}:${port}${server.graphqlPath}`);
  });
}

startServer();
