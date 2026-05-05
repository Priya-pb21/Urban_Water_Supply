import { Droplets } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cyan-50 dark:bg-slate-950">
      <motion.div
        className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-glow dark:bg-slate-900"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Droplets className="h-7 w-7 animate-pulse text-cyan-500" />
        <span className="font-semibold text-slate-800 dark:text-white">Loading water intelligence...</span>
      </motion.div>
    </div>
  );
}
