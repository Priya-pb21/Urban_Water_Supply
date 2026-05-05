import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Droplets, Lock, Mail, ShieldCheck, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import BackgroundParticles from '../components/BackgroundParticles';

export default function Login() {
  const { login, register, isAuthenticated } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: 'admin@waterms.com', password: 'Admin@123', role: 'admin' });
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden p-4">
      <BackgroundParticles />
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-glow backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/78 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex flex-col justify-between bg-gradient-to-br from-cyan-700 via-cyan-600 to-slate-900 p-8 text-white">
          <div>
            <div className="mb-10 inline-flex items-center gap-3 rounded-2xl bg-white/12 px-4 py-3 backdrop-blur">
              <Droplets className="h-6 w-6" />
              <span className="font-bold">AquaResolve</span>
            </div>
            <h1 className="max-w-md text-4xl font-black leading-tight">Smart conflict resolution for every drop of urban water.</h1>
            <p className="mt-5 max-w-md text-cyan-50">Monitor supply, demand, shortages, maps, issues, and real-time alerts from one modern command center.</p>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-3 text-sm">
            {['Admin', 'Manager', 'User'].map((role) => (
              <div key={role} className="rounded-2xl border border-white/15 bg-white/10 p-4 text-center backdrop-blur">{role}</div>
            ))}
          </div>
        </section>

        <section className="p-6 sm:p-8">
          <div className="mb-7 flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-950">
            <button onClick={() => setMode('login')} className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition ${mode === 'login' ? 'bg-white text-cyan-700 shadow-sm dark:bg-slate-800 dark:text-cyan-200' : 'text-slate-500'}`}>Login</button>
            <button onClick={() => setMode('register')} className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition ${mode === 'register' ? 'bg-white text-cyan-700 shadow-sm dark:bg-slate-800 dark:text-cyan-200' : 'text-slate-500'}`}>Register</button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Name</span>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
              </label>
            )}
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200"><Mail className="h-4 w-4" /> Email</span>
              <input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="admin@waterms.com" />
            </label>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200"><Lock className="h-4 w-4" /> Password</span>
              <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Admin@123" />
            </label>
            {mode === 'register' && (
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200"><ShieldCheck className="h-4 w-4" /> Role</span>
                <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="admin">Admin</option>
                  <option value="area_manager">Area Manager</option>
                  <option value="user">User</option>
                </select>
              </label>
            )}
            <button className="btn-primary w-full" disabled={loading}>
              {mode === 'login' ? <Lock className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {loading ? 'Please wait...' : mode === 'login' ? 'Enter Dashboard' : 'Create Account'}
            </button>
          </form>
        </section>
      </motion.div>
    </main>
  );
}
