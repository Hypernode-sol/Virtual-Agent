import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3002';

// APENAS GPUs RTX Consumer/Gaming
const GPU_INFO = {
  // RTX 40 series (High-end Gaming)
  'RTX4090': { name: 'RTX 4090', category: 'High-End Gaming', color: 'text-purple-400' },
  'RTX4080': { name: 'RTX 4080', category: 'High-End Gaming', color: 'text-purple-400' },
  'RTX4070': { name: 'RTX 4070', category: 'High-End Gaming', color: 'text-purple-400' },

  // RTX 30 series (Enthusiast Gaming)
  'RTX3090': { name: 'RTX 3090', category: 'Enthusiast Gaming', color: 'text-blue-400' },
  'RTX3080': { name: 'RTX 3080', category: 'Enthusiast Gaming', color: 'text-blue-400' },
  'RTX3070': { name: 'RTX 3070', category: 'Mid-Range Gaming', color: 'text-cyan-400' },
  'RTX3060': { name: 'RTX 3060', category: 'Mid-Range Gaming', color: 'text-cyan-400' },

  // RTX 20 series (Entry-level Gaming)
  'RTX2080': { name: 'RTX 2080', category: 'Entry-Level Gaming', color: 'text-green-400' },
  'RTX2070': { name: 'RTX 2070', category: 'Entry-Level Gaming', color: 'text-green-400' },
  'RTX2060': { name: 'RTX 2060', category: 'Entry-Level Gaming', color: 'text-green-400' },

  // CPU
  'CPU': { name: 'CPU Only', category: 'CPU', color: 'text-gray-400' },
};

export default function PricingPanel() {
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    fetchMarketPrices();
    // Update every 30 seconds
    const interval = setInterval(fetchMarketPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMarketPrices = async () => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/pricing/market`);
      if (!response.ok) throw new Error('Failed to fetch prices');
      const data = await response.json();
      setMarketData(data);
      setLastUpdate(new Date());
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Error fetching market prices:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const getSupplyDemandIndicator = (multiplier) => {
    if (multiplier >= 2.5) {
      return { text: 'Very High Demand', color: 'text-red-400', icon: TrendingUp, bgColor: 'bg-red-900/20' };
    } else if (multiplier >= 1.5) {
      return { text: 'High Demand', color: 'text-orange-400', icon: TrendingUp, bgColor: 'bg-orange-900/20' };
    } else if (multiplier > 0.8) {
      return { text: 'Balanced', color: 'text-yellow-400', icon: Minus, bgColor: 'bg-yellow-900/20' };
    } else if (multiplier > 0.6) {
      return { text: 'High Supply', color: 'text-blue-400', icon: TrendingDown, bgColor: 'bg-blue-900/20' };
    } else {
      return { text: 'Very High Supply', color: 'text-green-400', icon: TrendingDown, bgColor: 'bg-green-900/20' };
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-center">
          <Activity className="w-6 h-6 animate-spin text-purple-400" />
          <span className="ml-2 text-gray-400">Loading market prices...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6">
        <p className="text-red-400">Error loading prices: {error}</p>
        <button
          onClick={fetchMarketPrices}
          className="mt-2 text-sm text-purple-400 hover:text-purple-300"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-purple-400" />
              Market Prices
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Real-time GPU pricing • Updated every 30s
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">HYPER Token Price</div>
            <div className="text-lg font-bold text-purple-400">
              ${marketData?.hyperPriceUSD?.toFixed(4) || '0.0001'}
            </div>
            {lastUpdate && (
              <div className="text-xs text-gray-500 mt-1">
                Updated {lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pricing Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-900/50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                GPU Model
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Base Price (USD)
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Current Price
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                Market Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Multiplier
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {marketData?.prices && Object.entries(marketData.prices).map(([gpuType, priceData]) => {
              const info = GPU_INFO[gpuType] || { name: gpuType, category: 'Unknown', color: 'text-gray-400' };
              const indicator = getSupplyDemandIndicator(priceData.supplyDemandMultiplier);
              const IconComponent = indicator.icon;

              return (
                <tr
                  key={gpuType}
                  className="hover:bg-gray-700/30 transition-colors"
                >
                  {/* GPU Model */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className={`font-medium ${info.color}`}>
                          {info.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          per hour
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-700 text-gray-300">
                      {info.category}
                    </span>
                  </td>

                  {/* Base Price */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-400">
                    ${priceData.basePriceUSD.toFixed(2)}
                  </td>

                  {/* Current Price */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-bold text-white">
                      {priceData.priceInHyper.toLocaleString()} HYPER
                    </div>
                    <div className="text-xs text-gray-500">
                      ≈ ${priceData.priceInUSD.toFixed(2)} USD
                    </div>
                  </td>

                  {/* Market Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${indicator.bgColor} ${indicator.color} flex items-center gap-1`}>
                        <IconComponent className="w-3 h-3" />
                        {indicator.text}
                      </span>
                    </div>
                  </td>

                  {/* Multiplier */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className={`text-sm font-bold ${
                      priceData.supplyDemandMultiplier > 1.5
                        ? 'text-red-400'
                        : priceData.supplyDemandMultiplier < 0.8
                        ? 'text-green-400'
                        : 'text-yellow-400'
                    }`}>
                      {priceData.supplyDemandMultiplier.toFixed(2)}x
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-gray-900/50 border-t border-gray-700">
        <div className="flex items-start gap-2 text-xs text-gray-400">
          <Activity className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-gray-300 mb-1">How pricing works:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Prices adjust automatically based on supply and demand</li>
              <li>High demand = Higher prices (up to 3x base price)</li>
              <li>High supply = Lower prices (down to 0.5x base price)</li>
              <li>Base prices are set in USD and converted to HYPER tokens</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
