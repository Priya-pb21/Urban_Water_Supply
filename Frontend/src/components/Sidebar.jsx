import { BarChart3, Bell, Droplets, LayoutDashboard, Map, MessageCircle, ShieldAlert } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/map', label: 'Map', icon: Map },
  { to: '/issues', label: 'Issues', icon: ShieldAlert },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/chatbot', label: 'Chatbot', icon: MessageCircle },
  { to: '/notifications', label: 'Notifications', icon: Bell }
];

export default function Sidebar({ open, onClose }) {
  return (
    <aside className={`${open ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 w-72 border-r border-white/60 bg-white/90 p-4 backdrop-blur-xl transition lg:static lg:translate-x-0 dark:border-white/10 dark:bg-slate-950/86`}>
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="rounded-2xl bg-cyan-600 p-3 text-white shadow-glow">
          <Droplets className="h-6 w-6" />
        </div>
        <div>
          <p className="font-bold text-slate-950 dark:text-white">AquaResolve</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Urban water control</p>
        </div>
      </div>
      <nav className="space-y-2">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              isActive
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                : 'text-slate-600 hover:bg-cyan-50 hover:text-cyan-700 dark:text-slate-300 dark:hover:bg-white/5'
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
