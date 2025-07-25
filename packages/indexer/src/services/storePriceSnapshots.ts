import { db } from '../db/client';
import { PriceSnapshotRow } from '../types';

export const storePriceSnapshots = async (prices: PriceSnapshotRow[]): Promise<void> => {
  if (prices.length === 0) return;

  const query = `
    INSERT INTO price_snapshots (
      block_number,
      chain_id,
      exchange,
      machine_type,
      pool_address,
      price,
      timestamp,
      token_address
    )
    VALUES ${prices
      .map(
        (_, i) =>
          `($${i * 8 + 1}, $${i * 8 + 2}, $${i * 8 + 3}, $${i * 8 + 4}, $${i * 8 + 5},
             $${i * 8 + 6}, $${i * 8 + 7}, $${i * 8 + 8})`
      )
      .join(', ')}
  `;

  const values = prices.flatMap((p) => [
    p.block_number,
    p.chain_id,
    p.exchange,
    p.machine_type,
    p.pool_address,
    p.price,
    p.timestamp,
    p.token_address,
  ]);

  try {
    await db.query(query, values);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error storing price snapshots:', error);
  }
};
