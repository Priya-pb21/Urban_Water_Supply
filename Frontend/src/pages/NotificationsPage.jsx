import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle, AlertCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { waterApi } from '../services/api';

const itemVariants = {
  hidden: { opacity: 0, x: -40 },
  visible: (index) => ({
    opacity: 1,
    x: 0,
    transition: { delay: index * 0.05, duration: 0.3 }
  }),
  exit: { opacity: 0, x: 40 }
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');

  const load = () => waterApi.notifications()
    .then(({ data }) => setNotifications(data.data || []))
    .catch(() => toast.error('Unable to load notifications'));

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await waterApi.markNotificationRead(id);
    load();
  };

  const markAllRead = async () => {
    await Promise.all(
      notifications.filter(n => !n.is_read).map(n => waterApi.markNotificationRead(n.id))
    );
    load();
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="rounded-xl bg-cyan-100 p-3 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400"
          >
            <Bell className="h-6 w-6" />
          </motion.div>
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Notifications</h2>
            <p className="text-slate-600 dark:text-slate-400">{unreadCount} unread</p>
          </div>
        </div>

        {unreadCount > 0 && (
          <motion.button
            onClick={markAllRead}
            className="btn-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <CheckCircle className="h-4 w-4" /> Mark All Read
          </motion.button>
        )}
      </motion.div>

      {/* Filter buttons */}
      <motion.div
        className="flex gap-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <motion.button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            filter === 'all'
              ? 'bg-cyan-600 text-white'
              : 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300'
          }`}
          whileHover={{ scale: 1.05 }}
        >
          All ({notifications.length})
        </motion.button>
        <motion.button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            filter === 'unread'
              ? 'bg-cyan-600 text-white'
              : 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300'
          }`}
          whileHover={{ scale: 1.05 }}
        >
          Unread ({unreadCount})
        </motion.button>
      </motion.div>

      {/* Notifications list */}
      <AnimatePresence mode="popLayout">
        <motion.div className="grid gap-3">
          {filteredNotifications.map((n, index) => (
            <motion.button
              key={n.id}
              custom={index}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => markRead(n.id)}
              className={`glass-card text-left rounded-xl p-4 transition-all hover:border-cyan-200 dark:hover:border-cyan-400 ${
                !n.is_read
                  ? 'border-cyan-200 bg-cyan-50 dark:border-cyan-500/30 dark:bg-cyan-500/5'
                  : 'border-slate-200 dark:border-white/10'
              }`}
              whileHover={{ x: 4 }}
            >
              <div className="flex items-start gap-4">
                <motion.div
                  className={`mt-1 ${!n.is_read ? 'text-cyan-500' : 'text-slate-400'}`}
                  animate={!n.is_read ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {n.title.includes('shortage') ? (
                    <AlertCircle className="h-5 w-5" />
                  ) : n.title.includes('resolved') ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Info className="h-5 w-5" />
                  )}
                </motion.div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white break-words">{n.title}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 break-words">{n.message}</p>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
                    {new Date(n.created_at).toLocaleDateString()} · {new Date(n.created_at).toLocaleTimeString()}
                  </p>
                </div>

                {!n.is_read && (
                  <motion.div
                    layoutId="unreadIndicator"
                    className="h-3 w-3 rounded-full bg-cyan-500 flex-shrink-0"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </div>
            </motion.button>
          ))}
        </motion.div>
      </AnimatePresence>

      {filteredNotifications.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-xl p-12 text-center"
        >
          <CheckCircle className="h-16 w-16 mx-auto text-emerald-500 mb-4" />
          <p className="text-lg font-bold text-slate-900 dark:text-white">
            {filter === 'unread' ? 'All caught up!' : 'No notifications'}
          </p>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {filter === 'unread' ? 'You have read all notifications.' : 'Come back later for updates.'}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
