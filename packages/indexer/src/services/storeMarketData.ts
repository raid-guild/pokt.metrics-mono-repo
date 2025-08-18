import { db } from '../db/client';
import { MarketDataRow } from '../types';
import { logger } from '../utils/logger';

const validateMarketData = (prices: MarketDataRow[]): boolean => {
  for (const price of prices) {
    if (
      !price.all_time_high ||
      !price.all_time_low ||
      !price.circulating_supply ||
      !price.day_volume ||
      !price.market_cap ||
      !price.price ||
      !price.timestamp
    ) {
      logger.error({ price }, 'Invalid market data');
      return false;
    }

    if (typeof price.all_time_high !== 'number' || price.all_time_high < 0) {
      logger.error({ price }, 'Invalid market data');
      return false;
    }

    if (typeof price.all_time_low !== 'number' || price.all_time_low < 0) {
      logger.error({ price }, 'Invalid market data');
      return false;
    }

    if (typeof price.circulating_supply !== 'number' || price.circulating_supply < 0) {
      logger.error({ price }, 'Invalid market data');
      return false;
    }

    if (typeof price.day_volume !== 'number' || price.day_volume < 0) {
      logger.error({ price }, 'Invalid market data');
      return false;
    }

    if (typeof price.market_cap !== 'number' || price.market_cap < 0) {
      logger.error({ price }, 'Invalid market data');
      return false;
    }

    if (typeof price.price !== 'number' || price.price < 0) {
      logger.error({ price }, 'Invalid market data');
      return false;
    }
  }
  return true;
};

export const storeMarketData = async (data: MarketDataRow[]): Promise<void> => {
  if (data.length === 0) return;
  if (!validateMarketData(data)) return;

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
    VALUES ${data
      .map(
        (_, i) =>
          `($${i * 7 + 1}, $${i * 7 + 2}, $${i * 7 + 3}, $${i * 7 + 4}, $${i * 7 + 5},
             $${i * 7 + 6}, $${i * 7 + 7})`
      )
      .join(', ')}
  `;

  const values = data.flatMap((d) => [
    d.all_time_high,
    d.all_time_low,
    d.circulating_supply,
    d.day_volume,
    d.market_cap,
    d.price,
    d.timestamp,
  ]);

  try {
    await db.query(query, values);
  } catch (error) {
    logger.error({ error }, 'Error storing market data:');
  }
};
