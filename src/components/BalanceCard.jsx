import React, { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { RefreshCw, Zap, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

// SPL token mint for HYPER
const HYPER_MINT_ADDRESS = '92s9qna3djkMncZzkacyNQ38UKnNXZFh4Jgqe3Cmpump';

const BalanceCard = () => {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [balances, setBalances] = useState({ sol: 0, hyper: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBalances = useCallback(async () => {
    if (!connected || !publicKey || !connection) {
      setBalances({ sol: 0, hyper: 0 });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // SOL balance
      const solLamports = await connection.getBalance(publicKey);
      const sol = solLamports / LAMPORTS_PER_SOL;

      // HYPER SPL token balance
      const hyperMint = new PublicKey(HYPER_MINT_ADDRESS);
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, { mint: hyperMint });
      let hyper = 0;
      if (tokenAccounts.value.length > 0) {
        const accountInfo = tokenAccounts.value[0].account.data.parsed.info;
        hyper = accountInfo.tokenAmount.uiAmount || 0;
      }

      setBalances({ sol, hyper });
    } catch (e) {
      console.error('Failed to fetch balances:', e);
      setError('Could not fetch balances. Please try again.');
      setBalances({ sol: 0, hyper: 0 });
    } finally {
      setLoading(false);
    }
  }, [connection, publicKey, connected]);

  useEffect(() => {
    if (connected) {
      fetchBalances();
      const interval = setInterval(fetchBalances, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [connected, fetchBalances]);

  return (
    <motion.div 
      className="bg-gradient-to-br from-gray-900 to-black border border-cyan-500/30 rounded-xl p-6 glow-border-soft w-full h-full"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
            <h3 className="text-xl font-bold text-white">Your Wallet Balance</h3>
            {publicKey && (
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-400 bg-black/20 px-3 py-1 rounded-md border border-white/10 w-fit">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>{publicKey.toBase58().slice(0, 6) + '...' + publicKey.toBase58().slice(-6)}</span>
                </div>
            )}
        </div>
        <Button
          onClick={fetchBalances}
          variant="outline"
          size="sm"
          className="border-cyan-600/50 text-cyan-300 hover:bg-cyan-600/10 disabled:opacity-50 mt-4 sm:mt-0"
          disabled={!connected || loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200 mb-4">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-black/30 p-4 rounded-lg border border-white/5 flex items-center justify-between">
          <div className="flex items-center">
            <img src="https://horizons-cdn.hostinger.com/1e54f271-6c35-4f84-9c56-0768238922fb/59cf7c7c3d037649d6e2eab14c67b73d.png" alt="SOL" className="w-10 h-10 mr-4 rounded-full" />
            <div>
                <h4 className="text-lg font-semibold text-white">SOL</h4>
                <p className="text-sm text-gray-400">Solana</p>
            </div>
          </div>
          <p className="text-2xl font-mono text-cyan-300">{balances.sol.toFixed(4)}</p>
        </div>

        <div className="bg-black/30 p-4 rounded-lg border border-white/5 flex items-center justify-between">
          <div className="flex items-center">
            <img src="https://horizons-cdn.hostinger.com/1e54f271-6c35-4f84-9c56-0768238922fb/80593c66de65c1a2ab5f58f5c58843e3.jpg" alt="HYPER" className="w-10 h-10 mr-4 rounded-full" />
            <div>
                <h4 className="text-lg font-semibold text-white">HYPER</h4>
                <p className="text-sm text-gray-400">Hypernode</p>
            </div>
          </div>
          <p className="text-2xl font-mono text-blue-300">{balances.hyper.toFixed(4)}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default BalanceCard;