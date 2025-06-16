import 'dotenv/config';

import Moralis from 'moralis';

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;

if (!MORALIS_API_KEY) {
  throw new Error('MORALIS_API_KEY is not defined in environment variables');
}

await Moralis.start({
  apiKey: MORALIS_API_KEY,
});

export { Moralis };
