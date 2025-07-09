import fs from 'fs/promises';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

import { db } from '../src/db/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function run() {
  if (process.env.DATABASE_HOST !== 'localhost') {
    throw new Error('Refusing to run setup on a non-local database');
  }

  // eslint-disable-next-line no-console
  console.log('🔧 Running DB setup...');

  // 1. Read schema file (SQL)
  const schemaPath = path.resolve(__dirname, './schema.sql');
  const schemaSql = await fs.readFile(schemaPath, 'utf8');

  // 2. Execute schema
  await db.query(schemaSql);
  // eslint-disable-next-line no-console
  console.log('✅ Tables created');

  await db.end();
  // eslint-disable-next-line no-console
  console.log('🏁 DB setup complete');
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('❌ DB setup failed:', err);
  process.exit(1);
});
