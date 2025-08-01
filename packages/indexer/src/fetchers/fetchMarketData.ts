import 'dotenv/config';

import { db } from '../db/client';
import { MarketDataRow } from '../types';
import { logger } from '../utils/logger';

const ORIGINAL_ALL_TIME_HIGH = 3.1;
const ORIGINAL_ALL_TIME_LOW = 0.008747;
const POKT_CMC_ID = '11823'; // CoinMarketCap ID for Pokt

export const fetchMarketData = async (poktPrice: number): Promise<MarketDataRow | undefined> => {
  try {
    if (!process.env.COINMARKETCAP_API_KEY) {
      throw new Error('COINMARKETCAP_API_KEY is required');
    }

    const response = await fetch(
      `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?id=${POKT_CMC_ID}`,
      {
        headers: {
          'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY,
        },
      }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch market data: ${response.statusText}`);
    }
    const data = await response.json();
    const { circulating_supply } = data.data[POKT_CMC_ID];

    if (!circulating_supply) {
      throw new Error('Circulating supply not found in market data');
    }

    // Get most recent market_data row
    const latestMarketData = await db.query<{ all_time_high: number; all_time_low: number }>(
      'SELECT * FROM market_data ORDER BY timestamp DESC LIMIT 1'
    );
    let allTimeHigh = latestMarketData.rows[0]?.all_time_high || ORIGINAL_ALL_TIME_HIGH;
    let allTimeLow = latestMarketData.rows[0]?.all_time_low || ORIGINAL_ALL_TIME_LOW;

    if (poktPrice > allTimeHigh) {
      allTimeHigh = poktPrice;
    }
    if (poktPrice < allTimeLow) {
      allTimeLow = poktPrice;
    }

    return {
      all_time_high: allTimeHigh,
      all_time_low: allTimeLow,
      circulating_supply: parseFloat(circulating_supply),
      market_cap: parseFloat(circulating_supply) * poktPrice,
      price: poktPrice,
      timestamp: BigInt(Date.now()),
    };
  } catch (error) {
    logger.error({ error }, 'Error fetching market data');
    throw error;
  }
};
