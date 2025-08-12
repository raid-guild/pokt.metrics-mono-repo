import 'dotenv/config';

// eslint-disable-next-line import/no-named-as-default
import pino, { transport } from 'pino';

const isProd = process.env.NODE_ENV === 'production';

const productionTransport = transport({
  target: '@logtail/pino',
  options: {
    sourceToken: process.env.LOGTAIL_SOURCE_TOKEN,
    options: { endpoint: `https://${process.env.LOGTAIL_INGESTION_SOURCE}` },
  },
});

export const logger = isProd
  ? pino(productionTransport)
  : pino({
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'yyyy-mm-dd HH:MM:ss.l',
          ignore: 'pid,hostname',
        },
      },
    });
