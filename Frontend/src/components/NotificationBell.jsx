import { useEffect, useMemo, useState } from 'react';
import { Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { connectSocket, waterApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

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
      toast.success(notification.title);
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
      <button onClick={() => setOpen((v) => !v)} className="relative rounded-xl border border-slate-200 bg-white p-3 text-slate-700 transition hover:-translate-y-0.5 hover:border-cyan-200 dark:border-white/10 dark:bg-slate-950 dark:text-white">
        <Bell className="h-5 w-5" />
        {unread > 0 && <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-[11px] font-bold text-white">{unread}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute right-0 z-50 mt-3 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900"
          >
            <div className="border-b border-slate-100 p-4 dark:border-white/10">
              <p className="font-bold text-slate-900 dark:text-white">Notifications</p>
              <p className="text-xs text-slate-500">{unread} unread alerts</p>
            </div>
            <div className="max-h-96 overflow-auto">
              {notifications.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">No notifications yet.</p>
              ) : notifications.map((n) => (
                <button key={n.id} onClick={() => markRead(n)} className="block w-full border-b border-slate-100 p-4 text-left transition hover:bg-cyan-50 dark:border-white/10 dark:hover:bg-white/5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{n.title}</p>
                    {!n.is_read && <span className="mt-1 h-2 w-2 rounded-full bg-cyan-500" />}
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{n.message}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
