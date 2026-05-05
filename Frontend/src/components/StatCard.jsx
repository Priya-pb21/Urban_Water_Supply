import { motion } from 'framer-motion';

export default function StatCard({ icon: Icon, label, value, helper, tone = 'cyan' }) {
  const tones = {
    cyan: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-200',
    red: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200',
    green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200'
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="glass-card rounded-2xl p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
          {helper && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helper}</p>}
        </div>
        {Icon && (
          <div className={`rounded-xl p-3 ${tones[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
