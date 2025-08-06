import { db } from '../db/client';
import { logger } from '../utils/logger';

const TABLES_TO_PRUNE = ['market_data', 'pool_snapshots', 'price_snapshots'];

const PRUNE_THRESHOLD_DAYS = 30;
const PRUNE_INTERVAL_MS = 24 * 60 * 60 * 1000; // once per day

let lastPruneTime: number | null = null;

export const pruneOldData = async () => {
  const now = Date.now();

  if (lastPruneTime && now - lastPruneTime < PRUNE_INTERVAL_MS) {
    return; // Skip if pruned within last 24h
  }

  lastPruneTime = now;

  const cutoffDate = new Date(now - PRUNE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);
  const cutoffTimestamp = cutoffDate.getTime();

  logger.info({ cutoffDate }, '🧹 Pruning old data');

  for (const table of TABLES_TO_PRUNE) {
    try {
      const { rowCount } = await db.query(`DELETE FROM ${table} WHERE timestamp < $1`, [
        cutoffTimestamp,
      ]);
      logger.info({ rowCount, table }, '🗑️ Deleted rows from table');

      const { rows } = await db.query(`SELECT MIN(timestamp) as oldest FROM ${table}`);
      const oldest = rows[0]?.oldest
        ? new Date(Number(rows[0].oldest)).toISOString()
        : 'unknown (table may be empty)';
      logger.info({ oldest, table }, '📆 Oldest row in table');
    } catch (err) {
      logger.error({ error: err, table }, '❌ Failed to prune or fetch oldest row in table');
    }
  }
};
