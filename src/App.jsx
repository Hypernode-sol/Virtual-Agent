import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import App from '@/pages/App';
import NetworkDashboard from '@/pages/NetworkDashboard';
import ValidationMetrics from '@/pages/ValidationMetrics';
import WalletContextProvider from '@/components/WalletProvider';

function AppWrapper() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <WalletContextProvider>
      <div className="min-h-screen bg-black text-gray-100">
        <Navbar />
        <Routes>
          <Route path="/" element={<Navigate to="/app" replace />} />
          <Route path="/app" element={<App />} />
          <Route path="/dashboard" element={<NetworkDashboard />} />
          <Route path="/metrics" element={<ValidationMetrics />} />
          <Route path="/validation" element={<ValidationMetrics />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
        <Footer />
      </div>
    </WalletContextProvider>
  );
}

export default AppWrapper;