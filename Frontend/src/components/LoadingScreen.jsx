import { Droplets } from 'lucide-react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      type: 'spring',
      stiffness: 100
    }
  }
};

export default function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-sky-100 dark:from-slate-950 dark:via-slate-950 dark:to-cyan-950">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center gap-4 rounded-3xl glass-card px-8 py-6 shadow-2xl"
      >
        {/* Animated water drops */}
        <div className="flex gap-3">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              animate={{ y: [0, -20, 0], opacity: [0.5, 1, 0.5] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.2
              }}
            >
              <Droplets className="h-7 w-7 text-cyan-500" />
            </motion.div>
          ))}
        </div>

        {/* Loading text */}
        <motion.div
          className="text-center"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="font-semibold text-slate-800 dark:text-white">
            Loading water intelligence
          </span>
          <motion.span
            animate={{ opacity: [0, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="font-semibold text-cyan-500"
          >
            ...
          </motion.span>
        </motion.div>

        {/* Progress bar */}
        <motion.div className="w-48 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 to-teal-500"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
