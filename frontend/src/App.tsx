import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useSocketStore } from './store/socketStore';
import apiClient from './api/client';

import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { OfflineBanner } from './components/OfflineBanner';
import { CommandPalette } from './components/CommandPalette';
import { ToastContainer } from './components/ToastContainer';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Upload } from './pages/Upload';
import { Duplicates } from './pages/Duplicates';
import { Workbench } from './pages/Workbench';
import { Registry } from './pages/Registry';
import { Analytics } from './pages/Analytics';
import { AuditLog } from './pages/AuditLog';
import { Settings } from './pages/Settings';

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const { initSocket } = useSocketStore();
  const [isAiOnline, setIsAiOnline] = useState(true);

  const checkAiHealth = async () => {
    try {
      const res = await apiClient.get('/materials/status/ai');
      setIsAiOnline(res.data.online);
    } catch {
      setIsAiOnline(false);
    }
  };

  useEffect(() => {
    checkAuth();
    initSocket();
    checkAiHealth();
    const interval = setInterval(checkAiHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <OfflineBanner isOffline={!isAiOnline} onRetry={checkAiHealth} />
        <TopBar isAiOnline={isAiOnline} onRefreshAiStatus={checkAiHealth} />
        <main className="flex-1 overflow-y-auto relative">
          {children}
        </main>
      </div>
      <CommandPalette />
      <ToastContainer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedLayout>
              <Upload />
            </ProtectedLayout>
          }
        />
        <Route
          path="/duplicates"
          element={
            <ProtectedLayout>
              <Duplicates />
            </ProtectedLayout>
          }
        />
        <Route
          path="/workbench"
          element={
            <ProtectedLayout>
              <Workbench />
            </ProtectedLayout>
          }
        />
        <Route
          path="/registry"
          element={
            <ProtectedLayout>
              <Registry />
            </ProtectedLayout>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedLayout>
              <Analytics />
            </ProtectedLayout>
          }
        />
        <Route
          path="/audit"
          element={
            <ProtectedLayout>
              <AuditLog />
            </ProtectedLayout>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedLayout>
              <Settings />
            </ProtectedLayout>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
