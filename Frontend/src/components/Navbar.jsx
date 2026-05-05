import { LogOut, Menu, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function Navbar({ onMenu }) {
  const { user, logout, darkMode, setDarkMode } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-white/60 bg-white/80 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={onMenu} className="rounded-xl border border-slate-200 bg-white p-3 lg:hidden dark:border-white/10 dark:bg-slate-950">
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Welcome, {user?.name || 'Operator'}</p>
            <h1 className="text-lg font-bold text-slate-950 dark:text-white">Urban Water Supply Conflict Resolver</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setDarkMode(!darkMode)} className="rounded-xl border border-slate-200 bg-white p-3 text-slate-700 transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-slate-950 dark:text-white">
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <NotificationBell />
          <button onClick={logout} className="hidden rounded-xl border border-slate-200 bg-white p-3 text-slate-700 transition hover:-translate-y-0.5 sm:block dark:border-white/10 dark:bg-slate-950 dark:text-white">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
