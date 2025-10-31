/**
 * Hypernode x402 Client (Hybrid Implementation)
 *
 * Wraps x402-solana client with HYPER token support
 * Provides simplified payment handling for Hypernode compute jobs
 */

import { createX402Client } from 'x402-solana/client';
import { getHyperTokenMint, usdToMicroHyper } from '@/config/tokens';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3002';

/**
 * Create Hypernode x402 client with HYPER token
 *
 * @param {Object} wallet - Solana wallet adapter
 * @param {Object} options - Configuration options
 * @returns {Object} x402 client instance
 */
export function createHypernodeX402Client(wallet, options = {}) {
  const {
    network = 'solana-devnet',
    maxPaymentAmount = 100, // Max 100 HYPER by default
    rpcUrl = null,
  } = options;

  // Convert max payment to micro-units
  const maxPaymentMicroUnits = BigInt(usdToMicroHyper(maxPaymentAmount));

  // Get HYPER token mint for network
  const hyperTokenMint = getHyperTokenMint(network);

  // Create x402 client with HYPER configuration
  const client = createX402Client({
    wallet,
    network,
    maxPaymentAmount: maxPaymentMicroUnits,
    rpcUrl: rpcUrl || undefined,
  });

  // Store HYPER token mint for later use
  client._hyperTokenMint = hyperTokenMint;
  client._network = network;

  return client;
}

/**
 * Submit compute job with automatic x402 payment handling
 *
 * This is a convenience wrapper that:
 * 1. Creates payment requirements with HYPER token
 * 2. Handles 402 response automatically
 * 3. Returns job submission result
 *
 * @param {Object} client - x402 client instance
 * @param {Object} jobData - Job submission data
 * @returns {Promise<Object>} Job submission result
 */
export async function submitJobWithPayment(client, jobData) {
  const {
    jobId,
    jobType,
    resourceType,
    description,
    estimatedTime,
    paymentAmount,
    scriptFile,
    datasetFiles,
    requirements,
  } = jobData;

  try {
    // Prepare form data
    const formData = new FormData();
    formData.append('jobId', jobId);
    formData.append('jobType', jobType);
    formData.append('resourceType', resourceType);
    formData.append('description', description);
    formData.append('estimatedTime', estimatedTime.toString());
    formData.append('paymentAmount', usdToMicroHyper(paymentAmount));

    // Add HYPER token mint
    formData.append('tokenMint', client._hyperTokenMint);
    formData.append('network', client._network);

    if (scriptFile) {
      formData.append('script', scriptFile);
    }

    if (requirements) {
      formData.append('requirements', requirements);
    }

    if (datasetFiles && datasetFiles.length > 0) {
      datasetFiles.forEach((file, index) => {
        formData.append(`dataset_${index}`, file);
      });
    }

    // Use x402 client fetch (handles 402 automatically!)
    const response = await client.fetch(
      `${BACKEND_API_URL}/api/facilitator/submit-job`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to submit job' }));
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      success: true,
      jobId: result.jobId,
      intentId: result.intentId,
      escrow: result.escrow,
      txSignature: result.txSignature,
      message: result.message,
    };

  } catch (error) {
    console.error('[Hypernode x402] Failed to submit job:', error);
    throw error;
  }
}

/**
 * Fetch with automatic payment handling (generic)
 *
 * Use this for any API endpoint that requires payment
 *
 * @param {Object} client - x402 client instance
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
export async function fetchWithPayment(client, url, options = {}) {
  // Add HYPER token info to headers
  const headers = {
    ...options.headers,
    'X-Token-Mint': client._hyperTokenMint,
    'X-Network': client._network,
  };

  return client.fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Check if wallet is connected and ready
 *
 * @param {Object} wallet - Solana wallet adapter
 * @returns {boolean} True if wallet is connected
 */
export function isWalletReady(wallet) {
  return !!(wallet && wallet.publicKey && wallet.signMessage);
}

/**
 * Get wallet address string
 *
 * @param {Object} wallet - Solana wallet adapter
 * @returns {string|null} Wallet address or null
 */
export function getWalletAddress(wallet) {
  return wallet?.publicKey?.toString() || null;
}

export default {
  createHypernodeX402Client,
  submitJobWithPayment,
  fetchWithPayment,
  isWalletReady,
  getWalletAddress,
};
