import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import {
  Shield,
  Database,
  CheckCircle,
  ExternalLink,
  Activity,
  Hash,
  Clock,
  TrendingUp,
  AlertCircle,
  Zap,
} from 'lucide-react';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3002';
const SOLANA_EXPLORER_URL = 'https://explorer.solana.com';

export default function ValidationMetrics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Fetch metrics data
  const fetchMetrics = async () => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/metrics`);
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 15000); // Poll every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const truncateHash = (hash, length = 8) => {
    if (!hash) return 'N/A';
    return `${hash.substring(0, length)}...${hash.substring(hash.length - length)}`;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  // Container variants for staggered animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  // Card component
  const MetricCard = ({ icon: Icon, title, value, unit = '', color = 'cyan' }) => {
    const colorClasses = {
      cyan: 'text-cyan-400',
      green: 'text-green-400',
      purple: 'text-purple-400',
      blue: 'text-blue-400',
    };

    return (
      <motion.div
        variants={itemVariants}
        className="backdrop-blur-md bg-gradient-to-br from-slate-900/50 to-slate-800/30 border border-cyan-500/20 rounded-xl p-6 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300"
      >
        <div className="flex items-start justify-between mb-4">
          <div className={`${colorClasses[color]} p-2 rounded-lg bg-slate-800/50`}>
            <Icon size={24} />
          </div>
          {color === 'green' && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
        </div>
        <p className="text-slate-400 text-sm mb-2">{title}</p>
        <p className="text-3xl font-bold text-white">
          {value !== null && value !== undefined ? value : 'Loading...'}
          {unit && <span className="text-lg text-slate-400 ml-1">{unit}</span>}
        </p>
      </motion.div>
    );
  };

  // Section header component
  const SectionHeader = ({ icon: Icon, title }) => (
    <motion.div variants={itemVariants} className="mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20">
          <Icon className="text-cyan-400" size={24} />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
          {title}
        </h2>
      </div>
      <div className="h-1 w-20 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full" />
    </motion.div>
  );

  return (
    <>
      <Helmet>
        <title>Validation Metrics - Hypernode Network</title>
        <meta name="description" content="Real-time validation and audit metrics for the Hypernode network including blockchain status, job execution, network nodes, and recent executions." />
        <meta name="keywords" content="hypernode, validation, metrics, blockchain, solana" />
      </Helmet>

      <div className="min-h-screen bg-black text-white">
        {/* Background effects */}
        <div className="fixed inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none" />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Main content */}
        <div className="relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="pt-16 pb-12 px-4 sm:px-6 lg:px-8 border-b border-cyan-500/10"
          >
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="text-cyan-400" size={40} />
                <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
                  Validation Metrics
                </h1>
              </div>
              <p className="text-slate-400 text-lg mt-2">
                Real-time validation and audit metrics for the Hypernode network
              </p>

              {/* Last update timestamp */}
              {lastUpdate && (
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                  <Clock size={16} />
                  <span>Last update: {formatTime(lastUpdate)}</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Error state */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-4 sm:mx-6 lg:mx-8 mt-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3"
            >
              <AlertCircle className="text-red-400 mt-1 flex-shrink-0" size={20} />
              <div>
                <p className="text-red-400 font-semibold">Error loading metrics</p>
                <p className="text-red-300 text-sm mt-1">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Content sections */}
          <motion.div
            initial="hidden"
            animate={!loading ? 'visible' : 'hidden'}
            variants={containerVariants}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
          >
            {/* Solana Blockchain Status Section */}
            <motion.section variants={itemVariants} className="mb-16">
              <SectionHeader icon={Database} title="Solana Blockchain Status" />
              <motion.div
                variants={containerVariants}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                <MetricCard
                  icon={Hash}
                  title="Latest Block"
                  value={metrics?.blockchain?.lastBlock || 'Loading...'}
                  color="cyan"
                />
                <MetricCard
                  icon={Hash}
                  title="Program ID"
                  value={truncateHash(metrics?.blockchain?.programId, 6)}
                  color="purple"
                />
                <MetricCard
                  icon={Clock}
                  title="Last Sync"
                  value={formatTime(metrics?.blockchain?.lastSyncTime)}
                  color="blue"
                />
                <MetricCard
                  icon={CheckCircle}
                  title="Status"
                  value="Synced"
                  color="green"
                />
              </motion.div>
            </motion.section>

            {/* Job Execution Metrics Section */}
            <motion.section variants={itemVariants} className="mb-16">
              <SectionHeader icon={Zap} title="Job Execution Metrics" />
              <motion.div
                variants={containerVariants}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                <MetricCard
                  icon={Activity}
                  title="Total Jobs"
                  value={metrics?.jobs?.total || 0}
                  color="cyan"
                />
                <MetricCard
                  icon={CheckCircle}
                  title="Completed Jobs"
                  value={metrics?.jobs?.completed || 0}
                  color="green"
                />
                <MetricCard
                  icon={Activity}
                  title="Running Jobs"
                  value={metrics?.jobs?.running || 0}
                  color="purple"
                />
                <MetricCard
                  icon={TrendingUp}
                  title="Total Value Paid"
                  value={metrics?.jobs?.totalValuePaid || 0}
                  unit="HYPER"
                  color="blue"
                />
              </motion.div>
            </motion.section>

            {/* Active Network Nodes Section */}
            <motion.section variants={itemVariants} className="mb-16">
              <SectionHeader icon={Activity} title="Active Network Nodes" />
              <motion.div
                variants={containerVariants}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                <MetricCard
                  icon={Activity}
                  title="Active Nodes"
                  value={metrics?.nodes?.active || 0}
                  color="green"
                />
                <MetricCard
                  icon={Database}
                  title="GPU Nodes"
                  value={metrics?.nodes?.byType?.GPU || 0}
                  color="cyan"
                />
                <MetricCard
                  icon={Database}
                  title="CPU Nodes"
                  value={metrics?.nodes?.byType?.CPU || 0}
                  color="purple"
                />
              </motion.div>
            </motion.section>

            {/* Recent Job Executions Table Section */}
            <motion.section variants={itemVariants}>
              <SectionHeader icon={CheckCircle} title="Recent Job Executions" />

              {/* Table */}
              <motion.div
                variants={itemVariants}
                className="backdrop-blur-md bg-gradient-to-br from-slate-900/50 to-slate-800/30 border border-cyan-500/20 rounded-xl overflow-hidden"
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-900/50 border-b border-cyan-500/20">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-400">Job ID</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-400">Node ID</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-400">Audit Hash (SHA-256)</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-400">Completed At</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cyan-500/10">
                      {metrics?.recentExecutions && metrics.recentExecutions.length > 0 ? (
                        metrics.recentExecutions.map((execution, index) => (
                          <motion.tr
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="hover:bg-cyan-500/5 transition-colors duration-200 border-b border-slate-700/30 last:border-b-0"
                          >
                            <td className="px-6 py-4">
                              <code className="text-sm text-slate-300 font-mono">
                                {truncateHash(execution.id, 6)}
                              </code>
                            </td>
                            <td className="px-6 py-4">
                              <code className="text-sm text-slate-300 font-mono">
                                {truncateHash(execution.nodeId, 6)}
                              </code>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Hash size={16} className="text-cyan-400" />
                                <code className="text-xs text-green-400 font-mono">
                                  {truncateHash(execution.hash, 8)}
                                </code>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-slate-400">
                                {formatTimestamp(execution.completedAt)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => navigator.clipboard.writeText(execution.hash)}
                                className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
                                title="Copy full hash"
                              >
                                <Hash size={16} />
                                <span className="text-sm">Copy Hash</span>
                              </button>
                            </td>
                          </motion.tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-6 py-8 text-center text-slate-400">
                            {loading ? 'Loading recent executions...' : 'No recent executions found'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </motion.section>
          </motion.div>

          {/* Loading skeleton */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
            >
              <div className="space-y-8">
                {[1, 2, 3].map((section) => (
                  <div key={section} className="space-y-4">
                    <div className="h-8 w-48 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-lg animate-pulse" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[1, 2, 3, 4].map((card) => (
                        <div
                          key={card}
                          className="h-32 bg-gradient-to-br from-slate-900/50 to-slate-800/30 rounded-xl animate-pulse"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Footer spacing */}
          <div className="h-20" />
        </div>
      </div>
    </>
  );
}
