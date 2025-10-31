
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, TrendingUp } from 'lucide-react';

const PointsCard = () => {
  const [points, setPoints] = useState(0);

  // The points are currently mocked to be 0 and will not accumulate.
  // This can be updated in the future to reflect actual network points!
  useEffect(() => {
    setPoints(0);
  }, []);

  return (
    <motion.div
      className="bg-gradient-to-br from-gray-900 to-black border border-purple-500/30 rounded-xl p-6 glow-border-soft-purple w-full h-full flex flex-col justify-between"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Your Points</h3>
          <Star className="text-purple-400" />
        </div>
        <p className="text-4xl font-mono text-purple-300 mb-2">
          {points.toFixed(2)}
        </p>
        <div className="flex items-center text-sm text-gray-400">
          <TrendingUp className="w-4 h-4 mr-1 text-gray-400" />
          <span>No activity yet</span>
        </div>
      </div>
      <div className="mt-6">
        <p className="text-xs text-gray-500">
          Points are earned by contributing to the network. They can be redeemed for rewards.
        </p>
      </div>
    </motion.div>
  );
};

export default PointsCard;
