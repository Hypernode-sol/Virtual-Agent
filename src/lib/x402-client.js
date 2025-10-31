/**
 * x402 Payment Client (Frontend)
 *
 * Helper utilities for creating and signing x402 payment intents
 * in the browser using Solana wallet adapter
 */

import { v4 as uuidv4 } from 'uuid';
import bs58 from 'bs58';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3002';

/**
 * Payment Intent Builder
 */
export class PaymentIntentBuilder {
  constructor(wallet, amount, jobId) {
    this.wallet = wallet;
    this.amount = amount;
    this.jobId = jobId;
    this.intentId = uuidv4();
    this.timestamp = Date.now();
    this.expiresAt = Date.now() + (3600 * 1000); // 1 hour default
    this.nonce = this.generateNonce();
    this.metadata = {};
  }

  /**
   * Generate random nonce
   */
  generateNonce() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Set expiration time
   */
  expiresIn(milliseconds) {
    this.expiresAt = this.timestamp + milliseconds;
    return this;
  }

  /**
   * Add metadata
   */
  withMetadata(metadata) {
    this.metadata = { ...this.metadata, ...metadata };
    return this;
  }

  /**
   * Build payment intent object
   */
  build() {
    return {
      intentId: this.intentId,
      client: this.wallet,
      amount: this.amount,
      jobId: this.jobId,
      timestamp: this.timestamp,
      expiresAt: this.expiresAt,
      nonce: this.nonce,
      metadata: this.metadata,
    };
  }

  /**
   * Get message to sign (x402 format)
   */
  getSigningMessage() {
    return `HYPERNODE Payment Intent\n\n` +
           `Intent ID: ${this.intentId}\n` +
           `Job ID: ${this.jobId}\n` +
           `Amount: ${this.amount} HYPER\n` +
           `Timestamp: ${new Date(this.timestamp).toISOString()}\n` +
           `Expires: ${new Date(this.expiresAt).toISOString()}\n` +
           `Nonce: ${this.nonce}\n\n` +
           `By signing this message, you authorize this payment.`;
  }
}

/**
 * x402 Client
 */
export class X402Client {
  constructor(backendUrl = BACKEND_API_URL) {
    this.backendUrl = backendUrl;
  }

  /**
   * Create and sign payment intent
   */
  async createAndSignIntent(walletAdapter, amount, jobId, options = {}) {
    try {
      if (!walletAdapter.connected || !walletAdapter.publicKey) {
        throw new Error('Wallet not connected');
      }

      // 1. Build payment intent
      const builder = new PaymentIntentBuilder(
        walletAdapter.publicKey.toString(),
        amount,
        jobId
      );

      if (options.expiresIn) {
        builder.expiresIn(options.expiresIn);
      }

      if (options.metadata) {
        builder.withMetadata(options.metadata);
      }

      const intent = builder.build();
      const message = builder.getSigningMessage();

      // 2. Sign message with wallet
      const messageBytes = new TextEncoder().encode(message);
      const signature = await walletAdapter.signMessage(messageBytes);

      // 3. Encode signature to base58
      const signatureBase58 = bs58.encode(signature);

      return {
        intent,
        signature: signatureBase58,
        message,
      };

    } catch (error) {
      console.error('[x402] Failed to create and sign intent:', error);
      throw error;
    }
  }

  /**
   * Submit job with x402 payment
   */
  async submitJob(walletAdapter, jobData) {
    try {
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

      // 1. Create and sign payment intent
      const { intent, signature } = await this.createAndSignIntent(
        walletAdapter,
        paymentAmount,
        jobId,
        {
          metadata: {
            jobType,
            resourceType,
          },
        }
      );

      // 2. Prepare form data
      const formData = new FormData();
      formData.append('wallet', walletAdapter.publicKey.toString());
      formData.append('jobId', jobId);
      formData.append('jobType', jobType);
      formData.append('resourceType', resourceType);
      formData.append('description', description);
      formData.append('estimatedTime', estimatedTime);
      formData.append('paymentAmount', paymentAmount);
      formData.append('paymentIntent', JSON.stringify(intent));
      formData.append('paymentSignature', signature);

      if (scriptFile) {
        formData.append('script', scriptFile);
      }

      if (requirements) {
        formData.append('requirements', requirements);
      }

      datasetFiles?.forEach((file, index) => {
        formData.append(`dataset_${index}`, file);
      });

      // 3. Submit to backend
      const response = await fetch(`${this.backendUrl}/api/facilitator/submit-job`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit job');
      }

      const result = await response.json();

      return {
        success: true,
        jobId: result.jobId,
        intentId: result.intentId,
        escrow: result.escrow,
        txSignature: result.txSignature,
      };

    } catch (error) {
      console.error('[x402] Failed to submit job:', error);
      throw error;
    }
  }

  /**
   * Register node with Facilitator
   */
  async registerNode(walletAdapter, nodeData, authToken) {
    try {
      const response = await fetch(`${this.backendUrl}/api/facilitator/register-node`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(nodeData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to register node');
      }

      return await response.json();

    } catch (error) {
      console.error('[x402] Failed to register node:', error);
      throw error;
    }
  }

  /**
   * Get payment intent status
   */
  async getPaymentIntent(intentId) {
    try {
      const response = await fetch(
        `${this.backendUrl}/api/facilitator/payment-intent/${intentId}`
      );

      if (!response.ok) {
        throw new Error('Failed to get payment intent');
      }

      return await response.json();

    } catch (error) {
      console.error('[x402] Failed to get payment intent:', error);
      throw error;
    }
  }

  /**
   * Get node data from Facilitator
   */
  async getNodeAccount(nodeId) {
    try {
      const response = await fetch(
        `${this.backendUrl}/api/facilitator/node/${nodeId}`
      );

      if (!response.ok) {
        throw new Error('Failed to get node account');
      }

      return await response.json();

    } catch (error) {
      console.error('[x402] Failed to get node account:', error);
      throw error;
    }
  }

  /**
   * Claim rewards
   */
  async claimRewards(nodeId, amount, authToken) {
    try {
      const response = await fetch(`${this.backendUrl}/api/facilitator/claim-rewards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ nodeId, amount }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to claim rewards');
      }

      return await response.json();

    } catch (error) {
      console.error('[x402] Failed to claim rewards:', error);
      throw error;
    }
  }
}

// Singleton instance
const x402Client = new X402Client();

export default x402Client;
