import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import BalanceCard from '@/components/BalanceCard';
import HyperBalance from '@/components/HyperBalance';
import GPUHostsSection from '@/components/GPUHostsSection';
import ComputeMarketplace from '@/components/ComputeMarketplace';
import PricingPanel from '@/components/PricingPanel';


const App = () => {
  const { connected } = useWallet();

  return (
    <>
      <Helmet>
        <title>App - HYPERNODE</title>
        <meta name="description" content="Connect your GPU to the HYPERNODE network and start earning rewards" />
      </Helmet>
      <div className="min-h-screen bg-black text-gray-100 pt-28 pb-16 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-center mb-12"
          >
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold mb-2 glow-text">HYPERNODE App</h1>
              <p className="text-lg text-gray-400">GPU Network Dashboard</p>
            </div>
            <div className="mt-6 md:mt-0">
              <WalletMultiButton className="!bg-gradient-to-r !from-cyan-500 !to-blue-600 !text-white !font-bold !py-3 !px-6 !rounded-lg !shadow-lg transition-all duration-300 transform hover:scale-105" />
            </div>
          </motion.div>

          {/* Wallet Balances */}
          {connected && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-12 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
            >
              <div className="lg:col-span-2">
                <BalanceCard />
              </div>
              <div className="lg:col-span-1">
                <HyperBalance />
              </div>
            </motion.div>
          )}

          {/* Compute Marketplace */}
          <div className="mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h2 className="text-2xl font-semibold mb-6 text-cyan-400 border-b-2 border-cyan-500/30 pb-2">
                Compute Marketplace
              </h2>
              <ComputeMarketplace />
            </motion.div>
          </div>

          {/* Market Pricing Panel */}
          <div className="mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              <PricingPanel />
            </motion.div>
          </div>

          {/* GPU Hosts Section (Beta) */}
          <div className="mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h2 className="text-2xl font-semibold mb-6 text-cyan-400 border-b-2 border-cyan-500/30 pb-2">
                Provide GPU Resources (Earn HYPER)
              </h2>
              <GPUHostsSection />
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default App;