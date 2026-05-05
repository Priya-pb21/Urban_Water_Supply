import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

const CountUp = ({ end, duration = 2 }) => {
  const elementRef = useRef(null);

  useEffect(() => {
    const parseEnd = parseInt(end) || 0;
    if (parseEnd === 0 || !elementRef.current) return;

    let startValue = 0;
    const increment = parseEnd / (duration * 60);
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / (duration * 1000);

      if (progress < 1) {
        startValue = parseEnd * progress;
        if (elementRef.current) {
          elementRef.current.textContent = Math.floor(startValue).toLocaleString();
        }
        requestAnimationFrame(animate);
      } else {
        if (elementRef.current) {
          elementRef.current.textContent = parseEnd.toLocaleString();
        }
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration]);

  return <span ref={elementRef}>0</span>;
};

export default function StatCard({ icon: Icon, label, value, helper, tone = 'cyan' }) {
  const tones = {
    cyan: {
      bg: 'bg-cyan-100 dark:bg-cyan-500/15',
      text: 'text-cyan-700 dark:text-cyan-200',
      glow: 'group-hover:shadow-cyan-500/20'
    },
    red: {
      bg: 'bg-red-100 dark:bg-red-500/15',
      text: 'text-red-700 dark:text-red-200',
      glow: 'group-hover:shadow-red-500/20'
    },
    green: {
      bg: 'bg-emerald-100 dark:bg-emerald-500/15',
      text: 'text-emerald-700 dark:text-emerald-200',
      glow: 'group-hover:shadow-emerald-500/20'
    },
    amber: {
      bg: 'bg-amber-100 dark:bg-amber-500/15',
      text: 'text-amber-700 dark:text-amber-200',
      glow: 'group-hover:shadow-amber-500/20'
    }
  };

  const extractNumber = (str) => {
    return typeof str === 'number' ? str : parseInt(str.match(/\d+/)?.[0] || 0);
  };

  const isLarge = extractNumber(value) > 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4 }}
      className="group glass-card relative overflow-hidden rounded-2xl p-5 transition-all duration-300"
    >
      {/* Animated gradient background on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
      />

      {/* Colored top border accent */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
          tone === 'cyan'
            ? 'from-cyan-400 to-teal-400'
            : tone === 'red'
            ? 'from-red-400 to-orange-400'
            : tone === 'green'
            ? 'from-emerald-400 to-green-400'
            : 'from-amber-400 to-orange-400'
        }`}
      />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex-1">
          <motion.p
            className="text-sm text-slate-500 dark:text-slate-400 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {label}
          </motion.p>

          {/* Animated counter value */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className={`mt-2 font-bold text-slate-900 dark:text-white transition-all duration-300 ${
              isLarge ? 'text-2xl' : 'text-3xl'
            }`}
          >
            {typeof value === 'string' && value.includes('KL') ? (
              <>
                <CountUp end={extractNumber(value)} duration={2} />
                <span className="ml-1 text-lg"> KL</span>
              </>
            ) : (
              <CountUp end={extractNumber(value)} duration={2} />
            )}
          </motion.div>

          {/* Helper text */}
          {helper && (
            <motion.p
              className="mt-1 text-xs text-slate-500 dark:text-slate-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {helper}
            </motion.p>
          )}
        </div>

        {/* Icon with rotating background */}
        {Icon && (
          <motion.div
            whileHover={{ rotate: 10, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className={`rounded-xl p-3 ${tones[tone].bg} ${tones[tone].text}`}
          >
            <Icon className="h-5 w-5" />
          </motion.div>
        )}
      </div>

      {/* Shimmer loading effect (optional) */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{ x: ['100%', '-100%'] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
      />
    </motion.div>
  );
}
