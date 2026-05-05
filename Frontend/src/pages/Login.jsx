import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Lock, Mail, ShieldCheck, UserPlus, Eye, EyeOff, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import BackgroundParticles from '../components/BackgroundParticles';

export default function Login() {
  const { login, register, isAuthenticated } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: 'admin@waterms.com', password: 'Admin@123', role: 'admin' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  const roles = [
    { label: 'Admin', desc: 'Full access', icon: '⬡' },
    { label: 'Manager', desc: 'Area control', icon: '⬢' },
    { label: 'User', desc: 'View & report', icon: '⬟' },
  ];

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#060d1a] p-4">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-cyan-900/30 blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-slate-800/40 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[600px] rounded-full bg-cyan-950/20 blur-[80px]" />
      </div>

      <BackgroundParticles />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-5xl"
      >
        {/* Card */}
        <div className="overflow-hidden rounded-[2rem] border border-white/[0.07] bg-white/[0.03] shadow-2xl backdrop-blur-2xl lg:grid lg:grid-cols-[1.1fr_0.9fr]">
          
          {/* ── Left panel ── */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#0a2540] via-[#0c2d4a] to-[#060d1a] p-10 flex flex-col justify-between min-h-[420px]">
            {/* Decorative grid lines */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />
            {/* Decorative circle */}
            <div className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full border border-cyan-500/10" />
            <div className="pointer-events-none absolute -right-10 -bottom-10 h-40 w-40 rounded-full border border-cyan-500/10" />

            {/* Logo */}
            <div>
              <div className="mb-3 inline-flex items-center gap-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 px-4 py-2.5">
                <Droplets className="h-5 w-5 text-cyan-400" />
                <span className="text-sm font-bold tracking-wide text-cyan-300">AquaResolve</span>
              </div>

              <h1 className="mt-8 text-[2.1rem] font-black leading-[1.15] text-white tracking-tight">
                Smart conflict<br />
                <span className="text-cyan-400">resolution</span> for<br />
                every drop.
              </h1>
              <p className="mt-4 text-[0.9rem] leading-relaxed text-slate-400 max-w-xs">
                Monitor supply, demand, shortages, and real-time alerts from one unified command center.
              </p>
            </div>

            {/* Role cards */}
            <div className="mt-10 grid grid-cols-3 gap-3">
              {roles.map(({ label, desc, icon }) => (
                <div
                  key={label}
                  className="group rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5 transition-colors hover:bg-white/[0.06]"
                >
                  <span className="block text-lg text-cyan-500/70 mb-1">{icon}</span>
                  <p className="text-xs font-bold text-white/80">{label}</p>
                  <p className="text-[11px] text-white/40 mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right panel (form) ── */}
          <div className="bg-[#060d1a]/60 p-8 sm:p-10 flex flex-col justify-center">
            {/* Tab toggle */}
            <div className="mb-8 flex rounded-xl bg-white/[0.04] border border-white/[0.06] p-1">
              {['login', 'register'].map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`relative flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold capitalize transition-all duration-200 ${
                    mode === m
                      ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {m === 'login' ? 'Sign In' : 'Register'}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="space-y-4">
              <AnimatePresence initial={false}>
                {mode === 'register' && (
                  <motion.div
                    key="name"
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <label className="block mb-4">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">Full Name</span>
                      <input
                        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Your full name"
                      />
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email */}
              <label className="block">
                <span className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-slate-500">
                  <Mail className="h-3 w-3" /> Email
                </span>
                <input
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="admin@waterms.com"
                />
              </label>

              {/* Password */}
              <label className="block">
                <span className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-slate-500">
                  <Lock className="h-3 w-3" /> Password
                </span>
                <div className="relative">
                  <input
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.05] px-4 py-3 pr-11 text-sm text-white placeholder:text-slate-600 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              {/* Role selector (register only) */}
              <AnimatePresence initial={false}>
                {mode === 'register' && (
                  <motion.div
                    key="role"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <label className="block pt-0.5">
                      <span className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-slate-500">
                        <ShieldCheck className="h-3 w-3" /> Role
                      </span>
                      <select
                        className="w-full rounded-xl border border-white/[0.08] bg-[#0c1a2e] px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition appearance-none"
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                      >
                        <option value="admin">Admin</option>
                        <option value="area_manager">Area Manager</option>
                        <option value="user">User</option>
                      </select>
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="group mt-2 flex w-full items-center justify-center gap-2.5 rounded-xl bg-cyan-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:bg-cyan-400 hover:shadow-cyan-400/30 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                    </svg>
                    Please wait…
                  </span>
                ) : (
                  <>
                    {mode === 'login' ? <Lock className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    {mode === 'login' ? 'Enter Dashboard' : 'Create Account'}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            {/* Footer hint */}
            <p className="mt-6 text-center text-xs text-slate-600">
              {mode === 'login'
                ? "Don't have an account? "
                : 'Already have an account? '}
              <button
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="text-cyan-500 hover:text-cyan-400 font-semibold transition"
              >
                {mode === 'login' ? 'Register' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </main>
  );
}