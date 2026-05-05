import { useEffect, useState } from 'react';
import { BarChart3, Bell, Droplets, LayoutDashboard, Map, MessageCircle, ShieldAlert, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const items = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/map', label: 'Map', icon: Map },
  { to: '/issues', label: 'Issues', icon: ShieldAlert },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/chatbot', label: 'Chatbot', icon: MessageCircle },
  { to: '/notifications', label: 'Notifications', icon: Bell }
];

const containerVariants = {
  hidden: { x: -100, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  exit: {
    x: -100,
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

const itemVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: (index) => ({
    x: 0,
    opacity: 1,
    transition: {
      delay: index * 0.05,
      duration: 0.3
    }
  })
};

export default function Sidebar({ open, onClose }) {
  const [isLargeScreen, setIsLargeScreen] = useState(() => window.matchMedia('(min-width: 1024px)').matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleChange = (event) => setIsLargeScreen(event.matches);

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const visible = open || isLargeScreen;

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        variants={containerVariants}
        initial="hidden"
        animate={visible ? 'visible' : 'hidden'}
        className={`${
          visible ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-40 w-72 bg-gradient-to-br from-cyan-600/95 to-teal-600/95 p-4 backdrop-blur-xl transition-transform duration-300 lg:static lg:translate-x-0 lg:bg-gradient-to-br lg:from-cyan-600/80 lg:to-teal-600/80`}
      >
        {/* Logo section */}
        <motion.div
          className="mb-8 flex items-center justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3">
            <motion.div
              className="animate-pulse-ring rounded-2xl bg-white/20 p-3 text-white shadow-lg backdrop-blur"
              whileHover={{ scale: 1.05 }}
            >
              <Droplets className="h-6 w-6" />
            </motion.div>
            <div className="hidden sm:block">
              <p className="font-bold text-white">AquaResolve</p>
              <p className="text-xs text-white/80">Water Control</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-white transition-all hover:bg-white/20 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </motion.div>

        {/* Navigation */}
        <nav className="space-y-2">
          {items.map(({ to, label, icon: Icon }, index) => (
            <motion.div
              key={to}
              custom={index}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              <NavLink
                to={to}
                onClick={onClose}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? 'bg-white/25 text-white shadow-lg backdrop-blur'
                      : 'text-white/80 hover:bg-white/15 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <motion.div
                      animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Icon className="h-5 w-5" />
                    </motion.div>
                    <span className="transition-all duration-300">{label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute -right-2 h-2 w-2 rounded-full bg-white"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            </motion.div>
          ))}
        </nav>

        {/* Footer info */}
        <motion.div
          className="absolute bottom-4 left-4 right-4 rounded-xl bg-white/10 p-3 backdrop-blur"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-xs font-semibold text-white">Version 1.0</p>
          <p className="text-xs text-white/70">Urban Water Management</p>
        </motion.div>
      </motion.aside>
    </>
  );
}
