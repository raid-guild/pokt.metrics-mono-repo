import { db } from '../db/client';
import { MarketDataRow } from '../types';
import { logger } from '../utils/logger';

const validateMarketData = (rows: MarketDataRow[]): boolean => {
  for (const row of rows) {
    if (
      row.all_time_high == null ||
      row.all_time_low == null ||
      row.circulating_supply == null ||
      row.day_volume == null ||
      row.market_cap == null ||
      row.price == null ||
      row.timestamp == null
    ) {
      logger.error({ row }, 'Invalid market data');
      return false;
    }

    if (
      typeof row.all_time_high !== 'number' ||
      !Number.isFinite(row.all_time_high) ||
      row.all_time_high < 0
    ) {
      logger.error({ row }, 'Invalid market data');
      return false;
    }
    if (
      typeof row.all_time_low !== 'number' ||
      !Number.isFinite(row.all_time_low) ||
      row.all_time_low < 0
    ) {
      logger.error({ row }, 'Invalid market data');
      return false;
    }
    if (
      typeof row.circulating_supply !== 'number' ||
      !Number.isFinite(row.circulating_supply) ||
      row.circulating_supply < 0
    ) {
      logger.error({ row }, 'Invalid market data');
      return false;
    }
    if (
      typeof row.day_volume !== 'number' ||
      !Number.isFinite(row.day_volume) ||
      row.day_volume < 0
    ) {
      logger.error({ row }, 'Invalid market data');
      return false;
    }
    if (
      typeof row.market_cap !== 'number' ||
      !Number.isFinite(row.market_cap) ||
      row.market_cap < 0
    ) {
      logger.error({ row }, 'Invalid market data');
      return false;
    }
    if (typeof row.price !== 'number' || !Number.isFinite(row.price) || row.price < 0) {
      logger.error({ row }, 'Invalid market data');
      return false;
    }
    if (typeof row.timestamp !== 'bigint') {
      logger.error({ row }, 'Invalid market data');
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
