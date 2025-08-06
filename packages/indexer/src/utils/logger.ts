// eslint-disable-next-line import/no-named-as-default
import pino from 'pino';

const isProd = process.env.NODE_ENV === 'production';

export const logger = isProd
  ? pino() // JSON logs for production
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
