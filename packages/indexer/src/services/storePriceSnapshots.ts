import { db } from '../db/client';
import { PriceSnapshotRow } from '../types';
import { logger } from '../utils/logger';

const validatePriceSnapshots = (prices: PriceSnapshotRow[]): boolean => {
  for (const price of prices) {
    if (
      !price.block_number ||
      !price.chain ||
      !price.exchange ||
      !price.pool_address ||
      !price.price ||
      !price.timestamp ||
      !price.token_address
    ) {
      logger.error({ price }, 'Invalid price snapshot');
      return false;
    }

    if (typeof price.price !== 'number' || price.price <= 0) {
      logger.error({ price }, 'Invalid price snapshot');
      return false;
    }
  }
  return true;
};

export const storePriceSnapshots = async (prices: PriceSnapshotRow[]): Promise<void> => {
  if (prices.length === 0) return;
  if (!validatePriceSnapshots(prices)) return;

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
    logger.error({ error }, 'Error storing price snapshots');
  }
};
