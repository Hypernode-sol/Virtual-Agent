import React from 'react';
import { motion } from 'framer-motion';
import { Activity, HardDrive, Coins } from 'lucide-react';

const StatusBadge = ({ isOnline }) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isOnline
          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
          : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
      }`}
    >
      <span className={`w-2 h-2 rounded-full mr-1.5 ${isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
      {isOnline ? 'Online' : 'Offline'}
    </span>
  );
};

const NodeTable = ({ nodes = [], loading = false }) => {
  if (loading) {
    return (
      <div className="bg-black/40 border border-gray-700 rounded-lg p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
        <p className="text-gray-400 mt-4">Loading nodes...</p>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="bg-black/40 border border-gray-700 rounded-lg p-8 text-center">
        <HardDrive className="h-12 w-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400 mb-2">No nodes registered yet.</p>
        <p className="text-gray-500 text-sm">
          Generate a token and run the command on your GPU host to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-black/40 border border-gray-700 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-900/50 border-b border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Node ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Hostname
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                GPU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Last Heartbeat
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Earned
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {nodes.map((node, index) => (
              <motion.tr
                key={node.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="hover:bg-gray-900/30 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-300">
                  {node.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {node.hostname}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 text-cyan-400 mr-2" />
                    {node.gpu}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <StatusBadge isOnline={node.isOnline} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {node.lastHeartbeat}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center text-green-400">
                    <Coins className="h-4 w-4 mr-1" />
                    {node.earned} HYPER
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NodeTable;
