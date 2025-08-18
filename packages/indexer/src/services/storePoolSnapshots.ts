import { db } from '../db/client';
import { PoolSnapshotRow } from '../types';
import { logger } from '../utils/logger';

const validatePoolSnapshots = (pools: PoolSnapshotRow[]): boolean => {
  for (const pool of pools) {
    if (
      pool.block_number == null ||
      pool.chain == null ||
      pool.circulating_supply == null ||
      pool.exchange == null ||
      pool.holders == null ||
      pool.market_cap == null ||
      pool.pool_address == null ||
      pool.timestamp == null ||
      pool.token_address == null ||
      pool.tvl_usd == null ||
      pool.volatility == null ||
      pool.volume_usd == null
    ) {
      logger.error({ pool }, 'Invalid pool snapshot');
      return false;
    }

    if (typeof pool.block_number !== 'bigint') {
      logger.error({ pool }, 'Invalid pool snapshot');
      return false;
    }
    if (typeof pool.timestamp !== 'bigint') {
      logger.error({ pool }, 'Invalid pool snapshot');
      return false;
    }
    if (typeof pool.exchange !== 'string' || pool.exchange.trim() === '') {
      logger.error({ pool }, 'Invalid pool snapshot');
      return false;
    }
    if (typeof pool.pool_address !== 'string' || pool.pool_address.trim() === '') {
      logger.error({ pool }, 'Invalid pool snapshot');
      return false;
    }
    if (typeof pool.token_address !== 'string' || pool.token_address.trim() === '') {
      logger.error({ pool }, 'Invalid pool snapshot');
      return false;
    }
    if (
      typeof pool.circulating_supply !== 'number' ||
      !Number.isFinite(pool.circulating_supply) ||
      pool.circulating_supply <= 0
    ) {
      logger.error({ pool }, 'Invalid pool snapshot');
      return false;
    }
    if (typeof pool.holders !== 'number' || !Number.isFinite(pool.holders) || pool.holders < 0) {
      logger.error({ pool }, 'Invalid pool snapshot');
      return false;
    }
    if (
      typeof pool.market_cap !== 'number' ||
      !Number.isFinite(pool.market_cap) ||
      pool.market_cap < 0
    ) {
      logger.error({ pool }, 'Invalid pool snapshot');
      return false;
    }
    if (typeof pool.tvl_usd !== 'number' || !Number.isFinite(pool.tvl_usd) || pool.tvl_usd < 0) {
      logger.error({ pool }, 'Invalid pool snapshot');
      return false;
    }
    if (
      typeof pool.volatility !== 'number' ||
      !Number.isFinite(pool.volatility) ||
      pool.volatility < 0
    ) {
      logger.error({ pool }, 'Invalid pool snapshot');
      return false;
    }
    if (
      typeof pool.volume_usd !== 'number' ||
      !Number.isFinite(pool.volume_usd) ||
      pool.volume_usd < 0
    ) {
      logger.error({ pool }, 'Invalid pool snapshot');
      return false;
    }
  }
  return true;
};

export const storePoolSnapshots = async (pools: PoolSnapshotRow[]): Promise<void> => {
  if (pools.length === 0) return;
  if (!validatePoolSnapshots(pools)) return;

  const query = `
    INSERT INTO pool_snapshots (
      block_number,
      chain,
      circulating_supply,
      exchange,
      holders,
      market_cap,
      pool_address,
      timestamp,
      token_address,
      tvl_usd,
      volatility,
      volume_usd
    )
    VALUES ${pools
      .map(
        (_, i) =>
          `($${i * 12 + 1}, $${i * 12 + 2}, $${i * 12 + 3}, $${i * 12 + 4}, $${i * 12 + 5},
             $${i * 12 + 6}, $${i * 12 + 7}, $${i * 12 + 8}, $${i * 12 + 9}, $${i * 12 + 10},
             $${i * 12 + 11}, $${i * 12 + 12})`
      )
      .join(', ')}
  `;

  const values = pools.flatMap((p: PoolSnapshotRow) => [
    p.block_number,
    p.chain,
    p.circulating_supply,
    p.exchange,
    p.holders,
    p.market_cap,
    p.pool_address,
    p.timestamp,
    p.token_address,
    p.tvl_usd,
    p.volatility,
    p.volume_usd,
  ]);

  try {
    await db.query(query, values);
  } catch (error) {
    logger.error({ error }, 'Error storing pool snapshots');
    throw error; // Re-throw to be caught in runIndexer
  }
};
