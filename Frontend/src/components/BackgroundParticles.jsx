import { motion } from 'framer-motion';

export default function BackgroundParticles() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-white to-sky-100 dark:from-slate-950 dark:via-slate-950 dark:to-cyan-950" />

      {/* Animated particles */}
      <div className="water-particles absolute inset-0 opacity-80" />

      {/* Floating blobs */}
      <motion.div
        className="absolute left-[-8%] top-[-12%] h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl"
        animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute bottom-[-18%] right-[-10%] h-96 w-96 rounded-full bg-sky-500/10 blur-3xl"
        animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      <motion.div
        className="absolute top-1/3 right-1/4 h-64 w-64 rounded-full bg-teal-300/5 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,145,178,0.03)_1px,transparent_1px),linear-gradient(rgba(8,145,178,0.03)_1px,transparent_1px)] bg-[size:50px_50px] dark:bg-[linear-gradient(90deg,rgba(8,145,178,0.05)_1px,transparent_1px),linear-gradient(rgba(8,145,178,0.05)_1px,transparent_1px)] opacity-20" />
    </div>
  );
}
