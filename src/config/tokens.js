/**
 * Token Configuration for Hypernode
 *
 * Defines HYPER token addresses for mainnet and devnet
 */

// HYPER Token Mint Addresses
export const HYPER_TOKEN_MINT = {
  mainnet: 'HYPERxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // TODO: Replace with actual mainnet address
  devnet: 'HYPERdevnetxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // TODO: Replace with actual devnet address
};

// USDC Token Mint Addresses (for reference/fallback)
export const USDC_TOKEN_MINT = {
  mainnet: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  devnet: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
};

// Token decimals
export const TOKEN_DECIMALS = {
  HYPER: 6,  // 6 decimals (same as USDC)
  USDC: 6,
};

/**
 * Get HYPER token address for current network
 */
export function getHyperTokenMint(network = 'devnet') {
  const isMainnet = network === 'solana' || network === 'mainnet-beta';
  return isMainnet ? HYPER_TOKEN_MINT.mainnet : HYPER_TOKEN_MINT.devnet;
}

/**
 * Convert USD to micro-HYPER (with 6 decimals)
 * @param {number} usd - Amount in USD
 * @returns {string} Amount in micro-HYPER
 */
export function usdToMicroHyper(usd) {
  const microUnits = Math.floor(usd * 1_000_000);
  return microUnits.toString();
}

/**
 * Convert micro-HYPER to USD
 * @param {string} microHyper - Amount in micro-HYPER
 * @returns {number} Amount in USD
 */
export function microHyperToUsd(microHyper) {
  return parseInt(microHyper) / 1_000_000;
}

export default {
  HYPER_TOKEN_MINT,
  USDC_TOKEN_MINT,
  TOKEN_DECIMALS,
  getHyperTokenMint,
  usdToMicroHyper,
  microHyperToUsd,
};
