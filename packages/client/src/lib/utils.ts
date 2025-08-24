import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export enum TokenPair {
  wPOKT_wETH = 'wPOKT_wETH',
  POKT_wETH = 'POKT_wETH',
  POKT_SOL = 'POKT_SOL',
}

export function getTokenPairColor(pairName: TokenPair) {
  switch (pairName) {
    case TokenPair.wPOKT_wETH:
      return '#D35400';
    case TokenPair.POKT_wETH:
      return '#0E7490';
    case TokenPair.POKT_SOL:
      return '#6B46C1';
    default:
      return '#000000';
  }
}

export function getTokenPairName(pairName: TokenPair) {
  switch (pairName) {
    case TokenPair.wPOKT_wETH:
      return 'wPOKT/wETH';
    case TokenPair.POKT_wETH:
      return 'POKT/wETH';
    case TokenPair.POKT_SOL:
      return 'POKT/SOL';
    default:
      return pairName;
  }
}

export function getTokenPairChainName(pairName: TokenPair) {
  switch (pairName) {
    case TokenPair.wPOKT_wETH:
      return 'Ethereum';
    case TokenPair.POKT_wETH:
      return 'Base';
    case TokenPair.POKT_SOL:
      return 'Solana';
    default:
      return pairName;
  }
}

export function getTokenPairPlatformLogo(pairName: TokenPair) {
  switch (pairName) {
    case TokenPair.wPOKT_wETH:
      return '/platform_icons/eth-uni.svg';
    case TokenPair.POKT_wETH:
      return '/platform_icons/base-aero.svg';
    case TokenPair.POKT_SOL:
      return '/platform_icons/sol-orca.svg';
    default:
      return pairName;
  }
}

export function getTokenPairPlatformLogoByName(name: string) {
  switch (name) {
    case 'wPOKT/wETH':
      return '/platform_icons/eth-uni.svg';
    case 'POKT/wETH':
      return '/platform_icons/base-aero.svg';
    case 'POKT/SOL':
      return '/platform_icons/sol-orca.svg';
    default:
      return '';
  }
}

export function formatNumber(num?: number): string {
  if (num === undefined) return '0';
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(2)}K`;
  } else {
    return Math.round(num).toString();
  }
}

export function formatNumberWithCommas(num: number): string {
  // Round to nearest integer
  const roundedNum = Math.round(num);
  // Add commas every 3 digits
  return roundedNum.toLocaleString();
}

export function formatPrice(price: number, decimals?: number): string {
  if (price === 0) return '$0.00';

  if (decimals !== undefined) {
    return `$${price.toFixed(decimals)}`;
  }

  const formattedPrice =
    price < 10 ? price.toFixed(4).replace(/\.?0+$/, '') : formatNumberWithCommas(price);

  return `$${formattedPrice}`;
}

export const formatPercentage = (percentage: number): string => {
  return `${(percentage * 100).toFixed(2)}%`.replace(/\.?0+%$/, '%');
};

export function calculatePercentageChange(currentPrice: number, athPrice: number): number {
  if (!athPrice || athPrice === 0) return 0;
  return (currentPrice - athPrice) / athPrice;
}
