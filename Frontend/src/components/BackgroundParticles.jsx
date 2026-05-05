export default function BackgroundParticles() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-cyan-50 via-white to-sky-100 dark:from-slate-950 dark:via-slate-950 dark:to-cyan-950">
      <div className="water-particles absolute inset-0 opacity-80" />
      <div className="absolute left-[-8%] top-[-12%] h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="absolute bottom-[-18%] right-[-10%] h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
    </div>
  );
}
