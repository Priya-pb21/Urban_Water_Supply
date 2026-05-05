import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import BackgroundParticles from './components/BackgroundParticles';
import LoadingScreen from './components/LoadingScreen';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MapPage from './pages/MapPage';
import IssuesPage from './pages/IssuesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import NotificationsPage from './pages/NotificationsPage';
import ChatbotPage from './pages/ChatbotPage';

function Protected({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function Shell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="relative min-h-screen text-slate-900 dark:text-white">
      <BackgroundParticles />
      <div className="flex min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        {sidebarOpen && <button aria-label="Close sidebar" className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
        <div className="min-w-0 flex-1">
          <Navbar onMenu={() => setSidebarOpen(true)} />
          <main className="p-4 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
              >
                <Routes location={location}>
                  <Route index element={<Dashboard />} />
                  <Route path="map" element={<MapPage />} />
                  <Route path="issues" element={<IssuesPage />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="chatbot" element={<ChatbotPage />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={<Protected><Shell /></Protected>} />
    </Routes>
  );
}
