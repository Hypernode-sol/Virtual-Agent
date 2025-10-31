import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Server, ArrowRight, Github, BookOpen } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import CodeBlock from './CodeBlock';
import NodeTable from './NodeTable';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3002';
const WS_ENDPOINT = import.meta.env.VITE_NODE_WS_ENDPOINT || 'wss://nodes.hypernodesolana.org';

const StepCard = ({ number, title, description }) => {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-10 h-10 bg-cyan-500/20 border border-cyan-500/30 rounded-full flex items-center justify-center">
        <span className="text-cyan-400 font-bold">{number}</span>
      </div>
      <div>
        <h4 className="text-white font-semibold mb-1">{title}</h4>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
    </div>
  );
};

const GPUHostsSection = () => {
  const { publicKey, connected } = useWallet();
  const { toast } = useToast();
  const [nodeToken, setNodeToken] = useState('');
  const [generatingToken, setGeneratingToken] = useState(false);
  const [nodes, setNodes] = useState([]);
  const [loadingNodes, setLoadingNodes] = useState(false);
  const [hideLocation, setHideLocation] = useState(false);
  const [selectedOS, setSelectedOS] = useState('linux'); // 'linux' or 'windows'

  // Poll nodes every 10 seconds
  useEffect(() => {
    if (!connected || !publicKey) {
      setNodes([]);
      return;
    }

    const fetchNodes = async () => {
      try {
        setLoadingNodes(true);
        const response = await fetch(
          `${BACKEND_API_URL}/api/nodes/mine?wallet=${publicKey.toString()}`
        );

        if (response.ok) {
          const data = await response.json();
          setNodes(data.nodes || []);
        }
      } catch (error) {
        console.error('Failed to fetch nodes:', error);
      } finally {
        setLoadingNodes(false);
      }
    };

    fetchNodes();
    const interval = setInterval(fetchNodes, 10000);

    return () => clearInterval(interval);
  }, [connected, publicKey]);

  const handleGenerateToken = async () => {
    if (!connected || !publicKey) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your Solana wallet first',
        variant: 'destructive',
      });
      return;
    }

    try {
      setGeneratingToken(true);
      const response = await fetch(`${BACKEND_API_URL}/api/nodes/issue-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          hideLocation: hideLocation,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate token');
      }

      const data = await response.json();
      setNodeToken(data.token);

      toast({
        title: 'Token generated!',
        description: 'Your node token has been created. Copy the commands below.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate token',
        variant: 'destructive',
      });
    } finally {
      setGeneratingToken(false);
    }
  };

  // One-liner install command for Linux/macOS
  const quickInstallUnix = nodeToken
    ? `curl -sSL ${window.location.origin}/install.sh | bash -s -- ${nodeToken} ${WS_ENDPOINT}`
    : '';

  // Simplified install for Windows (PowerShell)
  const quickInstallWindows = nodeToken
    ? `iwr ${window.location.origin}/install-simple.ps1 -OutFile install.ps1; .\\install.ps1 -Token "${nodeToken}" -Endpoint "${WS_ENDPOINT}"`
    : '';

  // Direct download link
  const downloadLink = nodeToken
    ? `${window.location.origin}/install-simple.ps1`
    : '';

  // Docker command for Linux/macOS (using backslash for line continuation)
  const dockerCommandUnix = nodeToken
    ? `docker run -d \\
  --name hypernode-host \\
  --restart unless-stopped \\
  --gpus all \\
  -e HN_ENDPOINT=${WS_ENDPOINT} \\
  -e HN_NODE_TOKEN=${nodeToken} \\
  ghcr.io/hypernode-sol/host:latest`
    : '';

  // Docker command for Windows (using backtick for line continuation in PowerShell)
  const dockerCommandWindows = nodeToken
    ? `docker run -d \`
  --name hypernode-host \`
  --restart unless-stopped \`
  --gpus all \`
  -e HN_ENDPOINT=${WS_ENDPOINT} \`
  -e HN_NODE_TOKEN=${nodeToken} \`
  ghcr.io/hypernode-sol/host:latest`
    : '';

  // Python command for Linux/macOS
  const pythonCommandUnix = nodeToken
    ? `python3 agent.py \\
  --endpoint ${WS_ENDPOINT} \\
  --token ${nodeToken}`
    : '';

  // Python command for Windows
  const pythonCommandWindows = nodeToken
    ? `python agent.py \`
  --endpoint ${WS_ENDPOINT} \`
  --token ${nodeToken}`
    : '';

  return (
    <div className="space-y-8">
      {/* How it works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 backdrop-blur-sm border border-cyan-500/30 rounded-2xl p-6"
      >
        <div className="flex items-center mb-6">
          <Server className="text-cyan-400 h-6 w-6 mr-3" />
          <h3 className="text-xl font-bold text-white">How it works</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StepCard
            number="1"
            title="Connect your Solana wallet"
            description="Use the connect button above to link your Solana wallet"
          />
          <StepCard
            number="2"
            title="Generate a node token"
            description="Create a unique token for your GPU host"
          />
          <StepCard
            number="3"
            title="Run the command on your GPU host"
            description="Copy and execute the command on your machine with GPU"
          />
        </div>
      </motion.div>

      {/* Generate Token Button */}
      {!connected ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/40 border border-yellow-500/30 rounded-lg p-6 text-center"
        >
          <p className="text-yellow-400 mb-2">⚠️ Wallet not connected</p>
          <p className="text-gray-400 text-sm">
            Connect your Solana wallet to register a GPU node.
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-black/40 border border-gray-700 rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-white font-semibold mb-1">Node Configuration</h4>
              <p className="text-gray-400 text-sm">
                Generate a token to register your GPU host
              </p>
            </div>
            <Button
              onClick={handleGenerateToken}
              disabled={generatingToken || !!nodeToken}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
            >
              {generatingToken ? (
                'Generating...'
              ) : nodeToken ? (
                'Token Generated'
              ) : (
                <>
                  Generate Node Token
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
          <div className="flex items-start gap-3 p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-lg">
            <input
              type="checkbox"
              id="hideLocation"
              checked={hideLocation}
              onChange={(e) => setHideLocation(e.target.checked)}
              disabled={!!nodeToken}
              className="mt-1 h-4 w-4 rounded border-gray-600 bg-gray-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-gray-900"
            />
            <label htmlFor="hideLocation" className="flex-1 cursor-pointer">
              <div className="text-white text-sm font-medium mb-1">
                Hide my real location (Privacy Mode)
              </div>
              <div className="text-gray-400 text-xs">
                Your node will appear in "Hypercity" (mid-Atlantic) on the map instead of your real location. This only affects the visual marker; your node will still function normally.
              </div>
            </label>
          </div>
        </motion.div>
      )}

      {/* Commands */}
      {nodeToken && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {/* OS Selector */}
          <div className="flex items-center gap-2 p-2 bg-black/40 border border-gray-700 rounded-lg w-fit">
            <span className="text-gray-400 text-sm mr-2">Operating System:</span>
            <button
              onClick={() => setSelectedOS('linux')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedOS === 'linux'
                  ? 'bg-cyan-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              Linux / macOS
            </button>
            <button
              onClick={() => setSelectedOS('windows')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedOS === 'windows'
                  ? 'bg-cyan-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              Windows
            </button>
          </div>

          {/* Quick Install - RECOMMENDED */}
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border-2 border-cyan-500/40 rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h4 className="text-white font-semibold">⚡ Quick Install</h4>
                <span className="px-2 py-0.5 bg-cyan-500 text-white text-xs font-bold rounded-full">
                  RECOMMENDED
                </span>
              </div>
            </div>

            {selectedOS === 'windows' ? (
              <>
                <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-300 text-sm font-semibold mb-2">
                    ⚠️ Windows Users: Use PowerShell (Not CMD)
                  </p>
                  <p className="text-yellow-200 text-xs">
                    1. Press <kbd className="px-2 py-1 bg-gray-800 rounded">Win + X</kbd><br/>
                    2. Select "Windows PowerShell" or "Terminal"<br/>
                    3. Copy and paste the command below
                  </p>
                </div>
                <p className="text-gray-300 text-sm mb-4">
                  Copy and paste this command into PowerShell:
                </p>
                <CodeBlock code={quickInstallWindows} />

                <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-300 text-xs mb-2">
                    💡 <strong>What this does:</strong>
                  </p>
                  <ul className="text-blue-200 text-xs ml-5 space-y-1 list-disc">
                    <li>Downloads the agent installer</li>
                    <li>Checks if Python is installed</li>
                    <li>Auto-installs dependencies (websockets)</li>
                    <li>Detects your GPU (NVIDIA) or uses CPU</li>
                    <li>Connects to HYPERNODE network</li>
                  </ul>
                </div>

                <div className="mt-4 p-3 bg-gray-800/50 border border-gray-600 rounded-lg">
                  <p className="text-gray-300 text-xs mb-2">
                    <strong>Alternative: Manual Download</strong>
                  </p>
                  <p className="text-gray-400 text-xs mb-2">
                    If the command above doesn't work, download manually:
                  </p>
                  <a
                    href={downloadLink}
                    download="install.ps1"
                    className="inline-flex items-center px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                  >
                    📥 Download install.ps1
                  </a>
                  <p className="text-gray-500 text-xs mt-2">
                    Then run: <code className="bg-gray-900 px-2 py-1 rounded">.\install.ps1 -Token "{nodeToken}" -Endpoint "{WS_ENDPOINT}"</code>
                  </p>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-300 text-sm mb-4">
                  One command to install and start the agent. No manual setup required!
                </p>
                <CodeBlock code={quickInstallUnix} />
                <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-300 text-xs">
                    💡 <strong>Tip:</strong> This command will automatically:
                  </p>
                  <ul className="text-blue-200 text-xs mt-1 ml-5 space-y-1 list-disc">
                    <li>Download the agent</li>
                    <li>Install Python dependencies (websockets)</li>
                    <li>Start your node and connect to the network</li>
                  </ul>
                </div>
              </>
            )}
          </div>

          {/* Advanced Options Label */}
          <div className="text-center py-2">
            <span className="text-gray-500 text-sm font-medium">— Advanced Options —</span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-semibold">Docker Command</h4>
              <a
                href="https://github.com/hypernode-sol/host"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1"
              >
                <Github className="h-4 w-4" />
                View source
              </a>
            </div>
            <CodeBlock code={selectedOS === 'linux' ? dockerCommandUnix : dockerCommandWindows} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-semibold">Python Agent Command</h4>
              <a
                href="https://github.com/hypernode-sol/agent"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1"
              >
                <Github className="h-4 w-4" />
                View source
              </a>
            </div>
            <CodeBlock code={selectedOS === 'linux' ? pythonCommandUnix : pythonCommandWindows} />
          </div>
        </motion.div>
      )}

      {/* My GPU Nodes */}
      {connected && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">My GPU Nodes</h3>
            {nodes.length > 0 && (
              <span className="text-sm text-gray-400">
                {nodes.filter(n => n.isOnline).length} / {nodes.length} online
              </span>
            )}
          </div>
          <NodeTable nodes={nodes} loading={loadingNodes} />
        </motion.div>
      )}

      {/* Documentation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-black/40 border border-gray-700 rounded-lg p-6"
      >
        <div className="flex items-center mb-4">
          <BookOpen className="text-cyan-400 h-5 w-5 mr-2" />
          <h4 className="text-white font-semibold">How to run the host</h4>
        </div>
        <div className="space-y-3 text-sm text-gray-400">
          <div>
            <h5 className="text-white font-medium mb-1">Prerequisites:</h5>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Windows 10/11, macOS, or Linux (Ubuntu 20.04+)</li>
              <li>Docker 20.10+ (with NVIDIA Container Toolkit for GPU support)</li>
              <li>NVIDIA GPU with CUDA support (recommended, CPU also supported)</li>
              <li>Python 3.8+ (for Python agent option)</li>
            </ul>
          </div>
          <div>
            <h5 className="text-white font-medium mb-1">Setup:</h5>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Generate a node token using the button above</li>
              <li>Copy the Docker or Python command</li>
              <li>Run it on your GPU machine</li>
              <li>Return to this page to see your host online</li>
            </ol>
          </div>
          <div className="pt-2">
            <a
              href="https://docs.hypernodesolana.org/gpu-hosting"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
            >
              Full documentation
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default GPUHostsSection;
