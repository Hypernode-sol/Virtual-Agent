import { useState, useEffect } from 'react';

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3002';

// Hook to fetch real-time network statistics from the backend API
export const useNetworkStats = () => {
  const [stats, setStats] = useState({
    computationsPerSecond: 0,
    activeNodes: 0,
    activeGPU: 0,
    activeCPU: 0,
    totalMemory: 0,
  });

  useEffect(() => {
    // Fetch stats immediately on mount
    const fetchStats = async () => {
      try {
        const response = await fetch(`${BACKEND_API_URL}/api/stats`);
        if (response.ok) {
          const data = await response.json();
          setStats({
            computationsPerSecond: data.computationsPerSecond || 0,
            activeNodes: data.activeNodes || 0,
            activeGPU: data.activeGPU || 0,
            activeCPU: data.activeCPU || 0,
            totalMemory: data.totalMemory || 0,
          });
        }
      } catch (error) {
        console.error('[useNetworkStats] Error fetching stats:', error);
      }
    };

    fetchStats();

    // Poll stats every 10 seconds
    const interval = setInterval(fetchStats, 10000);

    return () => clearInterval(interval);
  }, []);

  return stats;
};