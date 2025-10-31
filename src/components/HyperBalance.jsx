import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, RefreshCw, Zap } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useHyperBalance } from '@/hooks/useHyperBalance';
import { Button } from '@/components/ui/button';

export function HyperBalance({ compact = false }) {
  const { connected } = useWallet();
  const { balance, loading, fetchBalance, requestAirdrop } = useHyperBalance();

  if (!connected) {
    return null;
  }

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/30 rounded-lg"
      >
        <Zap className="h-4 w-4 text-cyan-400" />
        <span className="text-sm font-semibold text-white">
          {loading ? (
            <span className="text-gray-400">Loading...</span>
          ) : (
            <>{balance.toLocaleString()} HYPER</>
          )}
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-cyan-400" />
          <span className="text-sm font-medium text-gray-300">Your Balance</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchBalance}
          disabled={loading}
          className="h-8 w-8 p-0 hover:bg-cyan-500/10"
        >
          <RefreshCw className={`h-4 w-4 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl font-bold text-white">
          {loading ? '...' : balance.toLocaleString()}
        </span>
        <span className="text-lg text-cyan-400 font-semibold">HYPER</span>
      </div>

      {balance === 0 && !loading && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-400 mb-2">Need tokens to get started?</p>
          <Button
            onClick={requestAirdrop}
            disabled={loading}
            size="sm"
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
          >
            <Zap className="h-4 w-4 mr-2" />
            Request 10,000 HYPER
          </Button>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-700">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Network</span>
          <span className="text-cyan-400 font-medium">Solana Devnet</span>
        </div>
      </div>
    </motion.div>
  );
}

export default HyperBalance;
