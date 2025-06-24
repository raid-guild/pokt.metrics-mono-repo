import { db } from '../db/client';
import { TokenPriceRow } from '../types';
import { isSignificantlyDifferent } from '../utils/helpers';

export const storeTokenPrices = async (prices: TokenPriceRow[]): Promise<void> => {
  if (prices.length === 0) return;

  // Deduplicate before inserting
  const filteredPrices: TokenPriceRow[] = [];

  for (const price of prices) {
    const { rows } = await db.query<{ price: number }>(
      `
        SELECT price
        FROM token_prices
        WHERE token_address = $1
          AND chain_id = $2
          AND exchange = $3
        ORDER BY timestamp DESC
        LIMIT 1
      `,
      [price.token_address, price.chain_id, price.exchange]
    );

    const previousPrice = rows[0]?.price;

    if (previousPrice === undefined || isSignificantlyDifferent(previousPrice, price.price)) {
      filteredPrices.push(price);
    } else {
      // eslint-disable-next-line no-console
      console.log(`Skipping duplicate price for ${price.token_address}`);
    }
  }

  if (filteredPrices.length === 0) return;

  const query = `
    INSERT INTO token_prices (
      chain_id,
      exchange,
      machine_type,
      price,
      timestamp,
      token_address
    )
    VALUES ${filteredPrices
      .map(
        (_, i) =>
          `($${i * 6 + 1}, $${i * 6 + 2}, $${i * 6 + 3}, $${i * 6 + 4}, $${i * 6 + 5}, $${i * 6 + 6})`
      )
      .join(', ')}
  `;

  const values = filteredPrices.flatMap((p) => [
    p.chain_id,
    p.exchange,
    p.machine_type,
    p.price,
    p.timestamp,
    p.token_address,
  ]);

  try {
    await db.query(query, values);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error storing token prices:', error);
  }
};
