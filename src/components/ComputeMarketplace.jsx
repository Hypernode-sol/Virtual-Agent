import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Cpu, Wallet, Clock, CheckCircle, Loader, AlertCircle, Download } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3002';

const ComputeMarketplace = () => {
  const { publicKey, connected } = useWallet();
  const { toast } = useToast();
  const [jobType, setJobType] = useState('inference'); // inference, training, rendering
  const [resourceType, setResourceType] = useState('GPU'); // GPU or CPU
  const [estimatedTime, setEstimatedTime] = useState(1); // hours
  const [jobDescription, setJobDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myJobs, setMyJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [availableResources, setAvailableResources] = useState({ gpu: 0, cpu: 0 });
  const [scriptFile, setScriptFile] = useState(null);
  const [datasetFiles, setDatasetFiles] = useState([]);
  const [requirements, setRequirements] = useState('');

  // Pricing per hour (average prices for consumer GPUs)
  // Based on market rates: RTX 4090 (~1,500), RTX 3090 (~800), RTX 3080 (~600), RTX 3070 (~400)
  const PRICING = {
    GPU: 1000, // HYPER per hour (average consumer GPU)
    CPU: 100,  // HYPER per hour
  };

  const estimatedCost = (PRICING[resourceType] * estimatedTime).toFixed(2);

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
    if (!connected || !publicKey) {
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

      toast({
        title: 'Submitting job...',
        description: 'Creating your compute job',
      });

      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('wallet', publicKey.toString());
      formData.append('jobType', jobType);
      formData.append('resourceType', resourceType);
      formData.append('estimatedTime', estimatedTime);
      formData.append('description', jobDescription);
      formData.append('cost', parseFloat(estimatedCost));
      formData.append('requirements', requirements);
      formData.append('script', scriptFile);

      // Add dataset files
      datasetFiles.forEach((file, index) => {
        formData.append(`dataset_${index}`, file);
      });

      const response = await fetch(`${BACKEND_API_URL}/api/jobs/submit`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit job');
      }

      const data = await response.json();

      toast({
        title: 'Job submitted successfully!',
        description: `Job ID: ${data.jobId}. Your code is being deployed to an available GPU...`,
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
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit job',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadResults = async (jobId) => {
    if (!connected || !publicKey) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to download results',
        variant: 'destructive',
      });
      return;
    }

    try {
      toast({
        title: 'Preparing download...',
        description: 'Compressing job outputs',
      });

      const url = `${BACKEND_API_URL}/api/jobs/${jobId}/download?wallet=${publicKey.toString()}`;

      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `job-${jobId}-results.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Download started!',
        description: 'Your job results are being downloaded',
      });
    } catch (error) {
      toast({
        title: 'Download failed',
        description: error.message || 'Failed to download results',
        variant: 'destructive',
      });
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

      {/* Submit Job */}
      {!connected ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/40 border border-yellow-500/30 rounded-lg p-6 text-center"
        >
          <p className="text-yellow-400 mb-2">⚠️ Wallet not connected</p>
          <p className="text-gray-400 text-sm">
            Connect your Solana wallet to submit compute jobs.
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-black/40 border border-gray-700 rounded-lg p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4">Submit Compute Job</h3>

          {/* Job Type Selection */}
          <div className="mb-6">
            <label className="text-white text-sm font-medium mb-3 block">Job Type</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <JobTypeCard
                type="inference"
                icon={Zap}
                title="AI Inference"
                description="Run AI models for predictions"
                selected={jobType === 'inference'}
                onClick={() => setJobType('inference')}
              />
              <JobTypeCard
                type="training"
                icon={Cpu}
                title="Model Training"
                description="Train machine learning models"
                selected={jobType === 'training'}
                onClick={() => setJobType('training')}
              />
              <JobTypeCard
                type="rendering"
                icon={Zap}
                title="Rendering"
                description="3D rendering and video processing"
                selected={jobType === 'rendering'}
                onClick={() => setJobType('rendering')}
              />
            </div>
          </div>

          {/* Resource Type */}
          <div className="mb-6">
            <label className="text-white text-sm font-medium mb-3 block">Resource Type</label>
            <div className="flex gap-4">
              <button
                onClick={() => setResourceType('GPU')}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  resourceType === 'GPU'
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-gray-700 bg-black/40 hover:border-gray-600'
                }`}
              >
                <Zap className={`h-6 w-6 mx-auto mb-2 ${resourceType === 'GPU' ? 'text-cyan-400' : 'text-gray-400'}`} />
                <p className="text-white font-semibold">GPU</p>
                <p className="text-gray-400 text-sm">{PRICING.GPU} HYPER/hour</p>
              </button>
              <button
                onClick={() => setResourceType('CPU')}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  resourceType === 'CPU'
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-gray-700 bg-black/40 hover:border-gray-600'
                }`}
              >
                <Cpu className={`h-6 w-6 mx-auto mb-2 ${resourceType === 'CPU' ? 'text-cyan-400' : 'text-gray-400'}`} />
                <p className="text-white font-semibold">CPU</p>
                <p className="text-gray-400 text-sm">{PRICING.CPU} HYPER/hour</p>
              </button>
            </div>
          </div>

          {/* Estimated Time */}
          <div className="mb-6">
            <label className="text-white text-sm font-medium mb-3 block">
              Estimated Time: {estimatedTime} hour{estimatedTime > 1 ? 's' : ''}
            </label>
            <input
              type="range"
              min="1"
              max="24"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Job Description */}
          <div className="mb-6">
            <label className="text-white text-sm font-medium mb-3 block">Job Description</label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Describe your compute job..."
              rows={4}
              className="w-full bg-black/60 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Upload Python Script */}
          <div className="mb-6">
            <label className="text-white text-sm font-medium mb-3 block">
              Python Script <span className="text-red-400">*</span>
            </label>
            <div className="bg-black/60 border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-cyan-500 transition-colors">
              <input
                type="file"
                accept=".py"
                onChange={(e) => setScriptFile(e.target.files[0])}
                className="hidden"
                id="script-upload"
              />
              <label htmlFor="script-upload" className="cursor-pointer">
                {scriptFile ? (
                  <div className="text-cyan-400">
                    <p className="font-medium">{scriptFile.name}</p>
                    <p className="text-sm text-gray-400 mt-1">{(scriptFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-400 mb-2">Click to upload your Python script</p>
                    <p className="text-sm text-gray-500">train.py, inference.py, etc.</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Upload Dataset */}
          <div className="mb-6">
            <label className="text-white text-sm font-medium mb-3 block">
              Dataset Files (Optional)
            </label>
            <div className="bg-black/60 border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-cyan-500 transition-colors">
              <input
                type="file"
                multiple
                onChange={(e) => setDatasetFiles(Array.from(e.target.files))}
                className="hidden"
                id="dataset-upload"
              />
              <label htmlFor="dataset-upload" className="cursor-pointer">
                {datasetFiles.length > 0 ? (
                  <div className="text-cyan-400">
                    <p className="font-medium">{datasetFiles.length} file(s) selected</p>
                    <div className="text-sm text-gray-400 mt-2 max-h-20 overflow-y-auto">
                      {datasetFiles.map((file, i) => (
                        <p key={i}>{file.name}</p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-400 mb-2">Click to upload dataset files</p>
                    <p className="text-sm text-gray-500">CSV, JSON, images, etc.</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Requirements */}
          <div className="mb-6">
            <label className="text-white text-sm font-medium mb-3 block">
              Python Requirements (Optional)
            </label>
            <textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="torch==2.0.0&#10;transformers>=4.30.0&#10;pandas"
              rows={3}
              className="w-full bg-black/60 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 font-mono text-sm"
            />
            <p className="text-gray-500 text-xs mt-1">List Python packages (one per line)</p>
          </div>

          {/* Cost Estimate */}
          <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-cyan-400" />
                <span className="text-white font-medium">Estimated Cost</span>
              </div>
              <span className="text-2xl font-bold text-cyan-400">{estimatedCost} HYPER</span>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmitJob}
            disabled={submitting || !jobDescription.trim()}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3"
          >
            {submitting ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Job'
            )}
          </Button>
        </motion.div>
      )}

      {/* My Jobs */}
      {connected && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-black/40 border border-gray-700 rounded-lg p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4">My Jobs</h3>
          {loadingJobs ? (
            <div className="text-center py-8">
              <Loader className="h-8 w-8 animate-spin text-cyan-400 mx-auto" />
              <p className="text-gray-400 mt-2">Loading jobs...</p>
            </div>
          ) : myJobs.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No jobs submitted yet</p>
          ) : (
            <div className="space-y-3">
              {myJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-black/60 border border-gray-700 rounded-lg p-4 hover:border-cyan-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-white font-mono text-sm">Job ID: {job.id}</p>
                      <p className="text-gray-400 text-sm mt-1">{job.description}</p>
                    </div>
                    <div className={`flex items-center gap-1 ${getStatusColor(job.status)}`}>
                      {getStatusIcon(job.status)}
                      <span className="text-sm font-medium capitalize">{job.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400 mt-3">
                    <span>Type: {job.resourceType}</span>
                    <span>•</span>
                    <span>Cost: {job.cost} HYPER</span>
                    <span>•</span>
                    <span>Time: {job.estimatedTime}h</span>
                  </div>

                  {/* Show result/logs if job is completed or failed */}
                  {job.result && (job.status === 'completed' || job.status === 'failed') && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-cyan-400 text-sm font-medium">Output:</p>
                        {job.status === 'completed' && (
                          <Button
                            onClick={() => handleDownloadResults(job.id)}
                            size="sm"
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download Results
                          </Button>
                        )}
                      </div>
                      <div className="bg-black/80 border border-gray-800 rounded p-3 max-h-48 overflow-y-auto">
                        <pre className="text-gray-300 text-xs font-mono whitespace-pre-wrap">
                          {job.result.logs || job.result}
                        </pre>
                      </div>
                      {job.result.exitCode !== undefined && (
                        <p className="text-gray-500 text-xs mt-2">
                          Exit code: {job.result.exitCode}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default ComputeMarketplace;
