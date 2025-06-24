import { db } from '../db/client';
import { TokenPriceRow } from '../types';

export const storeTokenPrices = async (prices: TokenPriceRow[]): Promise<void> => {
  if (prices.length === 0) return;

  const query = `
    INSERT INTO token_prices (
      chain_id,
      exchange,
      machine_type,
      price,
      timestamp,
      token_address
    )
    VALUES ${prices
      .map(
        (_, i) =>
          `($${i * 6 + 1}, $${i * 6 + 2}, $${i * 6 + 3}, $${i * 6 + 4}, $${i * 6 + 5}, $${i * 6 + 6})`
      )
      .join(', ')}
  `;

  const values = prices.flatMap((p) => [
    p.chain_id,
    p.exchange,
    p.machine_type,
    p.price,
    p.timestamp,
    p.token_address,
  ]);

  await db.query(query, values);
};
