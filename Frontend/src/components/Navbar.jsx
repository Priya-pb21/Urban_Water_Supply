import { LogOut, Menu, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const containerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 }
  }
};

export default function Navbar({ onMenu }) {
  const { user, logout, darkMode, setDarkMode } = useAuth();

  return (
    <motion.header
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="sticky top-0 z-30 border-b border-white/10 bg-white/70 px-4 py-3 backdrop-blur-xl transition-all duration-300 dark:bg-slate-950/70 lg:px-8"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <motion.button
            onClick={onMenu}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="glass-card rounded-xl border border-slate-200/50 p-3 text-slate-700 transition-all lg:hidden dark:border-white/10 dark:text-white"
          >
            <Menu className="h-5 w-5" />
          </motion.button>
          <div className="min-w-0">
            <motion.p
              className="text-sm text-slate-500 truncate dark:text-slate-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Welcome, {user?.name || 'Operator'}
            </motion.p>
            <motion.h1
              className="text-lg font-bold text-slate-900 truncate dark:text-white"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              Urban Water Supply
            </motion.h1>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <motion.button
            onClick={() => setDarkMode(!darkMode)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="glass-card rounded-xl border border-slate-200/50 p-3 text-slate-700 transition-all dark:border-white/10 dark:text-white"
          >
            <motion.div
              initial={false}
              animate={{ rotate: darkMode ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </motion.div>
          </motion.button>

          {/* Notifications */}
          <NotificationBell />

          {/* Logout button */}
          <motion.button
            onClick={logout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="glass-card hidden rounded-xl border border-slate-200/50 p-3 text-slate-700 transition-all sm:block dark:border-white/10 dark:text-white"
          >
            <LogOut className="h-5 w-5" />
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}
