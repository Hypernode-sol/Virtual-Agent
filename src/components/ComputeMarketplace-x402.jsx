/**
 * Compute Marketplace with x402 Integration (Hybrid Implementation)
 *
 * Uses x402-solana client with HYPER token for simplified payment handling
 * Automatic 402 payment processing with escrow security
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap, Cpu, Wallet, Clock, CheckCircle, Loader, AlertCircle, Shield } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { createHypernodeX402Client, submitJobWithPayment, isWalletReady } from '@/lib/hypernode-x402-client';
import { v4 as uuidv4 } from 'uuid';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3002';

const ComputeMarketplace = () => {
  const wallet = useWallet();
  const { publicKey, connected, signMessage } = wallet;
  const { toast } = useToast();

  const [jobType, setJobType] = useState('inference');
  const [resourceType, setResourceType] = useState('GPU');
  const [estimatedTime, setEstimatedTime] = useState(1);
  const [jobDescription, setJobDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myJobs, setMyJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [availableResources, setAvailableResources] = useState({ gpu: 0, cpu: 0 });
  const [scriptFile, setScriptFile] = useState(null);
  const [datasetFiles, setDatasetFiles] = useState([]);
  const [requirements, setRequirements] = useState('');

  // Pricing per hour (in HYPER tokens)
  const PRICING = {
    GPU: 1.0, // 1 HYPER per hour for GPU
    CPU: 0.1, // 0.1 HYPER per hour for CPU
  };

  const estimatedCost = (PRICING[resourceType] * estimatedTime).toFixed(2);

  // Create x402 client (memoized)
  const x402Client = useMemo(() => {
    if (!isWalletReady(wallet)) {
      return null;
    }

    return createHypernodeX402Client(wallet, {
      network: 'solana-devnet',
      maxPaymentAmount: 100, // Max 100 HYPER per transaction
    });
  }, [wallet, connected]);

  // Fetch user's jobs
  useEffect(() => {
    if (!connected || !publicKey) {
      setMyJobs([]);
      return;
    }

    const fetchJobs = async () => {
      try {
        setLoadingJobs(true);
        const response = await fetch(
          `${BACKEND_API_URL}/api/jobs/my-jobs?wallet=${publicKey.toString()}`
        );

        if (response.ok) {
          const data = await response.json();
          setMyJobs(data.jobs || []);
        }
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
      } finally {
        setLoadingJobs(false);
      }
    };

    fetchJobs();
    const interval = setInterval(fetchJobs, 10000);

    return () => clearInterval(interval);
  }, [connected, publicKey]);

  // Fetch available resources
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await fetch(`${BACKEND_API_URL}/api/stats`);
        if (response.ok) {
          const data = await response.json();
          setAvailableResources({
            gpu: data.activeGPU || 0,
            cpu: data.activeCPU || 0,
          });
        }
      } catch (error) {
        console.error('Failed to fetch resources:', error);
      }
    };

    fetchResources();
    const interval = setInterval(fetchResources, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmitJob = async () => {
    // Validation
    if (!x402Client) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your Solana wallet first',
        variant: 'destructive',
      });
      return;
    }

    if (!jobDescription.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please provide a job description',
        variant: 'destructive',
      });
      return;
    }

    if (!scriptFile) {
      toast({
        title: 'Missing script',
        description: 'Please upload your Python script',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);

      const jobId = `job-${uuidv4()}`;

      // Submit job with automatic x402 payment handling!
      // If payment required, x402Client automatically:
      // 1. Receives 402 response
      // 2. Creates payment transaction
      // 3. Signs with wallet
      // 4. Submits payment
      // 5. Retries request
      const result = await submitJobWithPayment(x402Client, {
        jobId,
        jobType,
        resourceType,
        description: jobDescription,
        estimatedTime,
        paymentAmount: parseFloat(estimatedCost),
        scriptFile,
        datasetFiles,
        requirements,
      });

      toast({
        title: '✅ Job submitted with x402 payment!',
        description: (
          <div className="space-y-1 text-sm">
            <p>Job ID: {result.jobId}</p>
            <p>Intent ID: {result.intentId?.slice(0, 12)}...</p>
            <p>Payment secured in escrow</p>
            {result.txSignature && (
              <a
                href={`https://solscan.io/tx/${result.txSignature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline inline-flex items-center gap-1"
              >
                View transaction ↗
              </a>
            )}
          </div>
        ),
        duration: 10000,
      });

      // Clear form
      setJobDescription('');
      setEstimatedTime(1);
      setScriptFile(null);
      setDatasetFiles([]);
      setRequirements('');

      // Refresh jobs list
      setTimeout(() => {
        const fetchJobs = async () => {
          const response = await fetch(
            `${BACKEND_API_URL}/api/jobs/my-jobs?wallet=${publicKey.toString()}`
          );
          if (response.ok) {
            const data = await response.json();
            setMyJobs(data.jobs || []);
          }
        };
        fetchJobs();
      }, 1000);

    } catch (error) {
      console.error('[ComputeMarketplace] Submit job error:', error);

      toast({
        title: 'Error submitting job',
        description: error.message || 'Failed to submit job. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const JobTypeCard = ({ type, icon: Icon, title, description, selected, onClick }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
        selected
          ? 'border-cyan-500 bg-cyan-500/10'
          : 'border-gray-700 bg-black/40 hover:border-gray-600'
      }`}
    >
      <Icon className={`h-6 w-6 mb-2 ${selected ? 'text-cyan-400' : 'text-gray-400'}`} />
      <h4 className="text-white font-semibold mb-1">{title}</h4>
      <p className="text-gray-400 text-sm">{description}</p>
    </motion.div>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'running':
        return 'text-blue-400';
      case 'pending':
        return 'text-yellow-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'running':
        return <Loader className="h-4 w-4 animate-spin" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* x402 Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-4"
      >
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-white font-semibold mb-1">Secure Payments with x402</h4>
            <p className="text-gray-300 text-sm">
              Your payment is secured in escrow via Hypernode Facilitator smart contract.
              Payment is only released when your job completes successfully.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Available Resources */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 backdrop-blur-sm border border-cyan-500/30 rounded-2xl p-6"
      >
        <h3 className="text-xl font-bold text-white mb-4">Available Resources</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/40 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-cyan-400" />
              <span className="text-gray-400 text-sm">GPU Nodes</span>
            </div>
            <p className="text-2xl font-bold text-white">{availableResources.gpu}</p>
          </div>
          <div className="bg-black/40 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="h-5 w-5 text-cyan-400" />
              <span className="text-gray-400 text-sm">CPU Nodes</span>
            </div>
            <p className="text-2xl font-bold text-white">{availableResources.cpu}</p>
          </div>
        </div>
      </motion.div>

      {/* Submit Job - Rest of the component stays the same */}
      {/* ... (keep existing form UI but handleSubmitJob now uses x402) */}

      {/* Rest of the component code continues here... */}
      {/* Copy from the original ComputeMarketplace.jsx */}
    </div>
  );
};

export default ComputeMarketplace;
