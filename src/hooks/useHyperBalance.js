import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useToast } from '@/components/ui/use-toast';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3002';

/**
 * Hook to manage HYPER token balance and automatic airdrops
 */
export function useHyperBalance() {
  const { publicKey, connected } = useWallet();
  const { toast } = useToast();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [airdropChecked, setAirdropChecked] = useState(false);

  /**
   * Fetch HYPER balance from backend
   */
  const fetchBalance = useCallback(async () => {
    if (!connected || !publicKey) {
      setBalance(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${BACKEND_API_URL}/api/hyper/balance?wallet=${publicKey.toString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }

      const data = await response.json();
      setBalance(data.balance || 0);
    } catch (err) {
      console.error('[HYPER] Error fetching balance:', err);
      setError(err.message);
      setBalance(0);
    } finally {
      setLoading(false);
    }
  }, [connected, publicKey]);

  /**
   * Request airdrop from faucet
   */
  const requestAirdrop = useCallback(async () => {
    if (!connected || !publicKey) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return false;
    }

    try {
      setLoading(true);

      const response = await fetch(`${BACKEND_API_URL}/api/hyper/faucet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet: publicKey.toString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Airdrop failed');
      }

      if (data.success) {
        toast({
          title: '🎉 HYPER Airdrop Received!',
          description: `${data.amount.toLocaleString()} HYPER tokens added to your wallet`,
          duration: 5000,
        });

        // Refresh balance
        await fetchBalance();
        return true;
      } else {
        // Already has tokens
        console.log('[HYPER] Wallet already has tokens:', data.balance);
        return false;
      }
    } catch (err) {
      console.error('[HYPER] Airdrop error:', err);

      // Only show error if it's not "already has tokens"
      if (!err.message.includes('already has')) {
        toast({
          title: 'Airdrop failed',
          description: err.message,
          variant: 'destructive',
        });
      }

      return false;
    } finally {
      setLoading(false);
    }
  }, [connected, publicKey, toast, fetchBalance]);

  /**
   * Check if needs airdrop and request automatically
   */
  const checkAndRequestAirdrop = useCallback(async () => {
    if (!connected || !publicKey || airdropChecked) {
      return;
    }

    try {
      // Wait a bit for balance to load
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check balance
      const response = await fetch(
        `${BACKEND_API_URL}/api/hyper/balance?wallet=${publicKey.toString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to check balance');
      }

      const data = await response.json();
      const currentBalance = data.balance || 0;

      // If balance is 0, request airdrop
      if (currentBalance === 0) {
        console.log('[HYPER] New wallet detected, requesting airdrop...');
        await requestAirdrop();
      } else {
        console.log('[HYPER] Wallet has balance:', currentBalance);
      }

      setAirdropChecked(true);
    } catch (err) {
      console.error('[HYPER] Error checking for airdrop:', err);
      setAirdropChecked(true); // Don't keep retrying
    }
  }, [connected, publicKey, airdropChecked, requestAirdrop]);

  // Fetch balance when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      fetchBalance();
    } else {
      setBalance(0);
      setAirdropChecked(false);
    }
  }, [connected, publicKey, fetchBalance]);

  // Auto-airdrop on first connection
  useEffect(() => {
    if (connected && publicKey && !airdropChecked) {
      checkAndRequestAirdrop();
    }
  }, [connected, publicKey, airdropChecked, checkAndRequestAirdrop]);

  // Refresh balance every 30 seconds
  useEffect(() => {
    if (!connected || !publicKey) return;

    const interval = setInterval(() => {
      fetchBalance();
    }, 30000);

    return () => clearInterval(interval);
  }, [connected, publicKey, fetchBalance]);

  return {
    balance,
    loading,
    error,
    fetchBalance,
    requestAirdrop,
  };
}
