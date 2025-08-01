import { db } from '../db/client';
import { PoolSnapshotRow } from '../types';
import { logger } from '../utils/logger';

export const storePoolSnapshots = async (pools: PoolSnapshotRow[]): Promise<void> => {
  if (pools.length === 0) return;

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
  }
};
