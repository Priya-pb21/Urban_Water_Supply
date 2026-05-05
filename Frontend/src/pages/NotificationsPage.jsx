import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { waterApi } from '../services/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);

  const load = () => waterApi.notifications()
    .then(({ data }) => setNotifications(data.data || []))
    .catch(() => toast.error('Unable to load notifications'));

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await waterApi.markNotificationRead(id);
    load();
  };

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-black text-slate-950 dark:text-white">Notification Center</h2>
      <div className="grid gap-3">
        {notifications.map((n) => (
          <button key={n.id} onClick={() => markRead(n.id)} className="panel text-left transition hover:-translate-y-0.5 hover:border-cyan-200">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{n.title}</p>
                <p className="mt-1 text-sm text-slate-500">{n.message}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${n.is_read ? 'bg-slate-100 text-slate-500' : 'bg-cyan-100 text-cyan-700'}`}>{n.is_read ? 'Read' : 'New'}</span>
            </div>
          </button>
        ))}
        {notifications.length === 0 && <div className="panel text-slate-500">No notifications yet.</div>}
      </div>
    </div>
  );
}
