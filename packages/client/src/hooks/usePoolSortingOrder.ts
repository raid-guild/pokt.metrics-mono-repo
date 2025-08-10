import { useState } from 'react';

import { TokenPair } from '@/lib/utils';

export const useTokenPairSortingOrder = () => {
  const [sortingOrder, setSortingOrder] = useState<TokenPair[]>([
    TokenPair.wPOKT_wETH,
    TokenPair.POKT_wETH,
    TokenPair.POKT_SOL,
  ]);

  return { sortingOrder, setSortingOrder };
};
