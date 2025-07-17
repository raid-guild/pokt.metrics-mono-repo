import { db } from '../db/client';
import { PoolSnapshotRow } from '../types';

export const storePoolSnapshots = async (pools: PoolSnapshotRow[]): Promise<void> => {
  if (pools.length === 0) return;

  const query = `
    INSERT INTO pool_snapshots (
      block_number,
      chain_id,
      exchange,
      machine_type,
      pool_address,
      price,
      timestamp,
      token_address,
      tvl_usd,
      volume_usd
    )
    VALUES ${pools
      .map(
        (_, i) =>
          `($${i * 10 + 1}, $${i * 10 + 2}, $${i * 10 + 3}, $${i * 10 + 4}, $${i * 10 + 5},
             $${i * 10 + 6}, $${i * 10 + 7}, $${i * 10 + 8}, $${i * 10 + 9}, $${i * 10 + 10})`
      )
      .join(', ')}
  `;

  const values = pools.flatMap((p) => [
    p.chain_id,
    p.exchange,
    p.machine_type,
    p.pool_address,
    p.price,
    p.timestamp,
    p.token_address,
    p.tvl_usd,
    p.volume_usd,
  ]);

  try {
    await db.query(query, values);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error storing pool snapshots:', error);
  }
};
