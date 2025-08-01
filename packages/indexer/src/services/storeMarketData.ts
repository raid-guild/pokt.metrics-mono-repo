import { db } from '../db/client';
import { MarketDataRow } from '../types';
import { logger } from '../utils/logger';

export const storeMarketData = async (prices: MarketDataRow[]): Promise<void> => {
  if (prices.length === 0) return;

  const query = `
    INSERT INTO market_data (
      all_time_high,
      all_time_low,
      circulating_supply,
      day_volume,
      market_cap,
      price,
      timestamp
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
    p.all_time_high,
    p.all_time_low,
    p.circulating_supply,
    p.day_volume,
    p.market_cap,
    p.price,
    p.timestamp,
  ]);

  try {
    await db.query(query, values);
  } catch (error) {
    logger.error({ error }, 'Error storing market data:');
  }
};
