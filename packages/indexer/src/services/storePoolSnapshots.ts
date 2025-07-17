import { db } from '../db/client';
import { PoolSnapshotRow } from '../types';
import { isSignificantlyDifferent } from '../utils/helpers';

export const storePoolSnapshots = async (pools: PoolSnapshotRow[]): Promise<void> => {
  if (pools.length === 0) return;

  const filteredPools: PoolSnapshotRow[] = [];

  for (const pool of pools) {
    const { rows } = await db.query<{ price: number; tvl_usd: number; volume_usd: number }>(
      `
        SELECT price, tvl_usd, volume_usd
        FROM pool_snapshots
        WHERE pool_address = $1
          AND token_address = $2
          AND chain_id = $3
          AND exchange = $4
        ORDER BY timestamp DESC
        LIMIT 1
      `,
      [pool.pool_address, pool.token_address, pool.chain_id, pool.exchange]
    );

    const last = rows[0];

    if (
      !last ||
      isSignificantlyDifferent(last.price, pool.price) ||
      isSignificantlyDifferent(last.tvl_usd, pool.tvl_usd) ||
      isSignificantlyDifferent(last.volume_usd, pool.volume_usd)
    ) {
      filteredPools.push(pool);
    } else {
      // eslint-disable-next-line no-console
      console.log(`Skipping duplicate snapshot for ${pool.pool_address}`);
    }
  }

  if (filteredPools.length === 0) return;

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
    VALUES ${filteredPools
      .map(
        (_, i) =>
          `($${i * 10 + 1}, $${i * 10 + 2}, $${i * 10 + 3}, $${i * 10 + 4}, $${i * 10 + 5},
             $${i * 10 + 6}, $${i * 10 + 7}, $${i * 10 + 8}, $${i * 10 + 9}, $${i * 10 + 10})`
      )
      .join(', ')}
  `;

  const values = filteredPools.flatMap((p) => [
    p.block_number,
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
