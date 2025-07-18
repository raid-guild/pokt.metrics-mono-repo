import 'dotenv/config';

import { Pool } from 'pg';

const config = {
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT, 10) : 5432,
  database: process.env.DATABASE_NAME,
};

if (process.env.DATABASE_SSL_ENABLED === 'true') {
  if (!process.env.DATABASE_CA) {
    throw new Error('DATABASE_CA environment variable is required when SSL is enabled');
  }

  Object.assign(config, {
    ssl: {
      rejectUnauthorized: true,
      ca: process.env.DATABASE_CA,
    },
  });
}

export const db = new Pool(config);
