import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { CheckCircle, AlertTriangle, Loader, RefreshCw, Server, Cpu, Cpu as Gpu, Zap, Gift, Hash, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NetworkBackground from '@/components/NetworkBackground';
import { useToast } from '@/components/ui/use-toast';
import { useNetworkStats } from '@/hooks/useNetworkStats';

const TOKEN_ADDRESSES = {
  HYPERNODE: '92s9qna3djkMncZzkacyNQ38UKnNXZFh4Jgqe3Cmpump',
  SOLANA: 'So11111111111111111111111111111111111111111'
};

const TokenBalanceCard = ({ name, symbol, balance, icon, loading }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/30 rounded-lg p-6 flex items-center justify-between glow-border"
    >
        <div className="flex items-center space-x-4">
            <div className="w-12 h-12 flex items-center justify-center bg-gray-800 rounded-full">
                {icon}
            </div>
            <div>
                <p className="text-xl font-bold text-white">{name}</p>
                <p className="text-sm text-gray-400">{symbol}</p>
            </div>
        </div>
        <div className="text-right">
            {loading ? (
                <Loader className="animate-spin text-cyan-400" size={24} />
            ) : (
                <p className="text-2xl font-bold text-cyan-400">
                    {balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                </p>
            )}
        </div>
    </motion.div>
);

const StatCard = ({ label, value, icon, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/30 rounded-lg p-6 glow-border flex flex-col items-center justify-center text-center"
    >
        {icon}
        <div className="text-2xl md:text-3xl font-bold text-cyan-400 mt-3 mb-1">{value}</div>
        <div className="text-gray-400 text-sm">{label}</div>
    </motion.div>
);

const LaunchApp = () => {
    const { connection } = useConnection();
    const { publicKey, connected } = useWallet();
    const [balances, setBalances] = useState({ sol: 0, hypernode: 0 });
    const [loading, setLoading] = useState(false);
    const [initialFetchDone, setInitialFetchDone] = useState(false);
    const { toast } = useToast();
    const {
        activeNodes,
        activeGPU,
        activeCPU,
        computationsPerSecond,
        rewardsDistributed,
        totalTransactions,
        liquidityPools
    } = useNetworkStats();

    const getBalances = useCallback(async () => {
        if (!connected || !publicKey) return;

        setLoading(true);
        toast({
            title: 'Updating Balances...',
            description: 'Please wait while we fetch data from the blockchain.',
        });

        try {
            const solBalancePromise = connection.getBalance(publicKey);
            const hypernodeToken = new PublicKey(TOKEN_ADDRESSES.HYPERNODE);
            const tokenAccountsPromise = connection.getParsedTokenAccountsByOwner(publicKey, { mint: hypernodeToken });
            
            const [solBalance, tokenAccounts] = await Promise.all([solBalancePromise, tokenAccountsPromise]);
            
            let hypernodeBalance = 0;
            if (tokenAccounts.value.length > 0) {
                hypernodeBalance = tokenAccounts.value[0]?.account.data.parsed.info.tokenAmount.uiAmount || 0;
            }

            setBalances({
                sol: solBalance / LAMPORTS_PER_SOL,
                hypernode: hypernodeBalance,
            });

            toast({
                title: 'Balances Updated!',
                description: 'Your balances have been synced with the network.',
                variant: 'success',
            });
        } catch (error) {
            console.error("Error fetching balances:", error);
            setBalances({ sol: 0, hypernode: 0 }); // Reset on error
            toast({
                title: 'Error Fetching Balances',
                description: 'Could not fetch your balances. The network may be busy. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [connected, publicKey, connection, toast]);

    useEffect(() => {
        if (connected && publicKey && !initialFetchDone) {
            getBalances();
            setInitialFetchDone(true);
        }

        if (!connected) {
            // Reset states when wallet disconnects
            setBalances({ sol: 0, hypernode: 0 });
            setInitialFetchDone(false);
        }
    }, [connected, publicKey, getBalances, initialFetchDone]);

    return (
        <>
            <Helmet>
                <title>Launch App - HYPERNODE</title>
                <meta name="description" content="Connect your wallet and manage your HYPERNODE assets." />
            </Helmet>
            <div className="relative min-h-screen pt-32 pb-20 px-4">
                <NetworkBackground />
                <div className="container mx-auto max-w-6xl text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-5xl md:text-6xl font-bold mb-6 glow-text">HYPERNODE App</h1>
                        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">Connect your wallet to view your assets and interact with the network.</p>
                        <div className="flex justify-center mb-10">
                            <WalletMultiButton style={{ backgroundColor: 'transparent', border: '1px solid #00FFFF', color: '#00FFFF', transition: 'all 0.3s ease' }} />
                        </div>

                        {connected ? (
                            <div className="space-y-16 text-left">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center space-x-3 max-w-2xl mx-auto"
                                >
                                    <CheckCircle className="text-green-400" size={24} />
                                    <div>
                                        <p className="font-bold text-green-400">Wallet Connected</p>
                                        <p className="text-xs text-gray-400 truncate">{publicKey.toBase58()}</p>
                                    </div>
                                </motion.div>
                                
                                <div className="max-w-3xl mx-auto">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-3xl font-bold gradient-text">Your Balances</h2>
                                        <Button onClick={getBalances} variant="ghost" size="sm" className="text-cyan-400 hover:bg-cyan-500/10" disabled={loading}>
                                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                                        </Button>
                                    </div>
                                    <div className="space-y-4">
                                        <TokenBalanceCard name="HYPERNODE" symbol="$HYPER" balance={balances.hypernode} loading={loading && !balances.hypernode} icon={<img src="https://horizons-cdn.hostinger.com/1e54f271-6c35-4f84-9c56-0768238922fb/27dd0eef97ff29791c8c57e6b192dd95.png" alt="HYPERNODE logo" className="w-6 h-6" />} />
                                        <TokenBalanceCard name="Solana" symbol="SOL" balance={balances.sol} loading={loading && !balances.sol} icon={<img alt="Solana coin symbol" className="w-6 h-6" src="https://horizons-cdn.hostinger.com/1e54f271-6c35-4f84-9c56-0768238922fb/687b78b67b8f163af9d217c516191166.webp" />} />
                                    </div>
                                </div>
                                
                                <div>
                                    <h2 className="text-3xl font-bold gradient-text mb-8 text-center">Network Dashboard</h2>
                                     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                        <StatCard label="Active Nodes" value={activeNodes.toLocaleString()} icon={<Server className="w-8 h-8 text-cyan-400" />} delay={0.2} />
                                        <StatCard label="Active GPUs" value={activeGPU.toLocaleString()} icon={<Gpu className="w-8 h-8 text-cyan-400" />} delay={0.3} />
                                        <StatCard label="Active CPUs" value={activeCPU.toLocaleString()} icon={<Cpu className="w-8 h-8 text-cyan-400" />} delay={0.4} />
                                        <StatCard label="Computations/sec" value={computationsPerSecond.toFixed(2)} icon={<Zap className="w-8 h-8 text-cyan-400" />} delay={0.5} />
                                        <StatCard label="Rewards Distributed" value={`$${rewardsDistributed.toLocaleString()}`} icon={<Gift className="w-8 h-8 text-cyan-400" />} delay={0.6} />
                                        <StatCard label="Total Transactions" value={totalTransactions.toLocaleString()} icon={<Hash className="w-8 h-8 text-cyan-400" />} delay={0.7} />
                                        <StatCard label="Liquidity Pools" value={`$${liquidityPools.toLocaleString()}`} icon={<Droplets className="w-8 h-8 text-cyan-400" />} delay={0.8} />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 flex items-center space-x-4 max-w-md mx-auto"
                            >
                                <AlertTriangle className="text-yellow-400" size={32} />
                                <div>
                                    <p className="font-bold text-yellow-400">Wallet Not Connected</p>
                                    <p className="text-gray-300">Please connect your wallet to continue.</p>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </div>
        </>
    );
};

export default LaunchApp;