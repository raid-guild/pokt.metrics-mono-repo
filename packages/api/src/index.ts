import 'dotenv/config';

import { ApolloServer } from 'apollo-server-express';
import express from 'express';

import redis from './lib/redis';
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

  app.get('/health', async (req, res) => {
    try {
      const lastRun = await redis.get('indexer:lastRun');
      const alertKey = 'indexer:alertSent';
      const now = Date.now();

      if (!lastRun) {
        const alreadyAlerted = await redis.get(alertKey);
        if (!alreadyAlerted) {
          await sendIndexerAlertEmail('never');
          await redis.set(alertKey, '1', 'EX', 3600); // 1-hour cooldown
        }
        return res.status(200).send('No lastRun recorded');
      }

      const diff = now - Number(lastRun);
      const threshold = 20 * 60 * 1000; // 20 minutes

      if (diff > threshold) {
        const alreadyAlerted = await redis.get(alertKey);
        if (!alreadyAlerted) {
          await sendIndexerAlertEmail(new Date(Number(lastRun)).toISOString());
          await redis.set(alertKey, '1', 'EX', 3600); // 1-hour cooldown
        }
        return res.status(200).send(`Stale indexer: last run ${Math.floor(diff / 60000)} min ago`);
      }

      // Reset the alert flag if the indexer is back to normal
      await redis.del(alertKey);

      return res.status(200).send('ok');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Health check error:', err);
      return res.status(200).send('ok'); // never fail hard
    }
  });

  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 Server ready at ${protocol}://${host}:${port}${server.graphqlPath}`);
  });
}

startServer();
