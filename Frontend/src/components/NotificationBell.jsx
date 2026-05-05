import { useEffect, useMemo, useState } from 'react';
import { Bell, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { connectSocket, waterApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const dropdownVariants = {
  hidden: { opacity: 0, y: -10, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.2 }
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: { duration: 0.15 }
  }
};

const notificationVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (index) => ({
    opacity: 1,
    x: 0,
    transition: { delay: index * 0.05 }
  }),
  exit: { opacity: 0, x: 20 }
};

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const unread = useMemo(() => notifications.filter((n) => !n.is_read).length, [notifications]);

  const loadNotifications = async () => {
    const { data } = await waterApi.notifications();
    setNotifications(data.data || []);
  };

  useEffect(() => {
    if (!user?.id) return;
    loadNotifications().catch(() => {});
    const socket = connectSocket(user.id);
    socket.on('notification:new', (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      toast.success(notification.title, { icon: '🔔' });
    });
    return () => socket.disconnect();
  }, [user?.id]);

  const markRead = async (notification) => {
    if (notification.is_read) return;
    await waterApi.markNotificationRead(notification.id);
    setNotifications((prev) => prev.map((n) => n.id === notification.id ? { ...n, is_read: true } : n));
  };

  return (
    <div className="relative">
      {/* Bell button */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative glass-card rounded-xl border border-slate-200/50 p-3 text-slate-700 transition-all dark:border-white/10 dark:text-white"
      >
        <motion.div
          animate={unread > 0 ? { y: [0, -4, 0] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Bell className="h-5 w-5" />
        </motion.div>

        {/* Badge */}
        <AnimatePresence mode="popLayout">
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white"
            >
              {unread > 9 ? '9+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute right-0 z-50 mt-3 w-96 overflow-hidden rounded-2xl glass-card shadow-2xl border border-slate-200/50 dark:border-white/10"
          >
            {/* Header */}
            <div className="border-b border-slate-100 dark:border-white/10 p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Notifications</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {unread} {unread === 1 ? 'alert' : 'alerts'} new
                  </p>
                </div>
                <motion.button
                  onClick={() => setOpen(false)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </motion.button>
              </div>
            </div>

            {/* Notifications list */}
            <motion.div className="max-h-96 overflow-auto">
              <AnimatePresence mode="popLayout">
                {notifications.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 text-center text-sm text-slate-500"
                  >
                    No notifications yet
                  </motion.div>
                ) : (
                  notifications.map((n, index) => (
                    <motion.button
                      key={n.id}
                      custom={index}
                      variants={notificationVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      onClick={() => markRead(n)}
                      className={`block w-full border-b border-slate-100 dark:border-white/10 p-4 text-left transition-all hover:bg-cyan-50 dark:hover:bg-white/5 ${
                        !n.is_read
                          ? 'bg-cyan-50/50 dark:bg-cyan-500/5'
                          : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white break-words">{n.title}</p>
                          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400 break-words">{n.message}</p>
                        </div>
                        {!n.is_read && (
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-cyan-500"
                          />
                        )}
                      </div>
                    </motion.button>
                  ))
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
