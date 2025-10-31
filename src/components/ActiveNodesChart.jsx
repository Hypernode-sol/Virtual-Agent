import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3002';

const ActiveNodesChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`${BACKEND_API_URL}/api/node-history`);
        if (response.ok) {
          const result = await response.json();
          const formattedData = result.history.map(item => ({
            date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            nodes: item.count
          }));
          setData(formattedData);
        }
      } catch (error) {
        console.error('[ActiveNodesChart] Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();

    // Refresh every 30 seconds
    const interval = setInterval(fetchHistory, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Loading chart...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No historical data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="date"
          stroke="#9CA3AF"
          angle={-45}
          textAnchor="end"
          height={80}
          style={{ fontSize: '12px' }}
        />
        <YAxis
          stroke="#9CA3AF"
          style={{ fontSize: '12px' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1F2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#F3F4F6'
          }}
          labelStyle={{ color: '#22D3EE' }}
          itemStyle={{ color: '#22D3EE' }}
        />
        <Bar
          dataKey="nodes"
          fill="#22D3EE"
          radius={[8, 8, 0, 0]}
          name="Active Nodes"
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ActiveNodesChart;
