import { db } from '../db/client';
import { MarketDataRow } from '../types';
import { logger } from '../utils/logger';

const ORIGINAL_ALL_TIME_HIGH = 3.1;
const ORIGINAL_ALL_TIME_LOW = 0.008747;

export const fetchMarketData = async (
  poktPrice: number,
  circulatingSupply: number,
  volume24h: number
): Promise<MarketDataRow | undefined> => {
  try {
    // Get most recent market_data row
    const latestMarketData = await db.query<{ all_time_high: number; all_time_low: number }>(
      'SELECT * FROM market_data ORDER BY timestamp DESC LIMIT 1'
    );
    let allTimeHigh = latestMarketData.rows[0]?.all_time_high || ORIGINAL_ALL_TIME_HIGH;
    let allTimeLow = latestMarketData.rows[0]?.all_time_low || ORIGINAL_ALL_TIME_LOW;

    const parsedHigh = Number(allTimeHigh);
    const parsedLow = Number(allTimeLow);
    allTimeHigh = Number.isFinite(parsedHigh) ? parsedHigh : ORIGINAL_ALL_TIME_HIGH;
    allTimeLow = Number.isFinite(parsedLow) ? parsedLow : ORIGINAL_ALL_TIME_LOW;

    if (poktPrice > allTimeHigh) {
      allTimeHigh = poktPrice;
    }
    if (poktPrice < allTimeLow) {
      allTimeLow = poktPrice;
    }

    return {
      all_time_high: allTimeHigh,
      all_time_low: allTimeLow,
      circulating_supply: circulatingSupply,
      day_volume: volume24h,
      market_cap: circulatingSupply * poktPrice,
      price: poktPrice,
      timestamp: BigInt(Date.now()),
    };
  } catch (error) {
    logger.error({ error }, 'Error fetching market data');
    throw error; // Re-throw to be caught in runIndexer
  }
};
