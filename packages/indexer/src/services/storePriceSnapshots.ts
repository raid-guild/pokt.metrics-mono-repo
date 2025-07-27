import { db } from '../db/client';
import { PriceSnapshotRow } from '../types';

export const storePriceSnapshots = async (prices: PriceSnapshotRow[]): Promise<void> => {
  if (prices.length === 0) return;

  const query = `
    INSERT INTO price_snapshots (
      block_number,
      chain,
      exchange,
      pool_address,
      price,
      timestamp,
      token_address
    )
    VALUES ${prices
      .map(
        (_, i) =>
          `($${i * 7 + 1}, $${i * 7 + 2}, $${i * 7 + 3}, $${i * 7 + 4}, $${i * 7 + 5},
             $${i * 7 + 6}, $${i * 7 + 7})`
      )
      .join(', ')}
  `;

  const values = prices.flatMap((p) => [
    p.block_number,
    p.chain,
    p.exchange,
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
