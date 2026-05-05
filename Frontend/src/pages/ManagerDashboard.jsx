import { useEffect, useState } from 'react';
import { ClipboardList, ClipboardPlus, Send, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { waterApi } from '../services/api';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.05, duration: 0.3 }
  })
};

export default function ManagerDashboard({ data, reload }) {
  const [demand, setDemand] = useState({ area_id: '', quantity: '', priority: 5, notes: '' });

  useEffect(() => {
    if (!demand.area_id && data.areas.length > 0) {
      setDemand((current) => ({ ...current, area_id: data.areas[0].id }));
    }
  }, [data.areas, demand.area_id]);

  const submitDemand = async (event) => {
    event.preventDefault();
    try {
      await waterApi.createDemand({
        ...demand,
        quantity: Number(demand.quantity),
        priority: Number(demand.priority),
      });
      toast.success('Demand saved in database');
      setDemand((current) => ({ area_id: current.area_id, quantity: '', priority: 5, notes: '' }));
      await reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Demand submission failed');
    }
  };

  return (
    <motion.div
      className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1 }}
    >
      <div className="space-y-5">
        <motion.form
          onSubmit={submitDemand}
          className="panel"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ boxShadow: '0 20px 40px rgba(8, 145, 178, 0.1)' }}
        >
          <div className="mb-4 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
            <h2 className="font-bold text-slate-900 dark:text-white">Submit Demand</h2>
          </div>
          <div className="space-y-3">
            <select className="input" value={demand.area_id} onChange={(e) => setDemand({ ...demand, area_id: e.target.value })} required>
              <option value="">Select area</option>
              {data.areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
            </select>
            <input className="input" type="number" placeholder="Quantity in KL" value={demand.quantity} onChange={(e) => setDemand({ ...demand, quantity: e.target.value })} required />
            <input className="input" type="number" min="1" max="10" placeholder="Priority 1-10" value={demand.priority} onChange={(e) => setDemand({ ...demand, priority: e.target.value })} required />
            <textarea className="input min-h-24" placeholder="Notes" value={demand.notes} onChange={(e) => setDemand({ ...demand, notes: e.target.value })} />
            <motion.button
              className="btn-primary w-full"
              disabled={!data.areas.length}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Send className="h-4 w-4" /> Submit Demand
            </motion.button>
            {!data.areas.length && <p className="text-sm text-red-500">No active areas found. Create an area first from admin dashboard or API.</p>}
          </div>
        </motion.form>

        <motion.div
          className="panel"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-cyan-600" />
            <h2 className="font-bold text-slate-900 dark:text-white">Submitted Demands</h2>
          </div>
          <div className="space-y-3">
            {data.demands.slice(0, 6).map((item, index) => (
              <motion.div
                key={item.id}
                custom={index}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="rounded-xl border border-slate-100 p-4 dark:border-white/10 hover:border-cyan-200 dark:hover:border-cyan-400 transition-all"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900 dark:text-white">{item.area_name}</p>
                  <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-200">{item.status}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{item.quantity} KL requested, priority {item.priority}</p>
              </motion.div>
            ))}
            {data.demands.length === 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-slate-500"
              >
                No demands submitted yet.
              </motion.p>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div
        className="panel"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-cyan-600" />
          <h2 className="font-bold text-slate-900 dark:text-white">Allocation Results</h2>
        </div>
        <div className="space-y-3">
          {data.allocations.slice(0, 6).map((item, index) => (
            <motion.div
              key={item.id}
              custom={index}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="rounded-xl border border-slate-100 p-4 dark:border-white/10 hover:border-cyan-200 dark:hover:border-cyan-400 transition-all"
            >
              <div className="flex justify-between gap-3">
                <p className="font-semibold text-slate-900 dark:text-white">{item.area_name}</p>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${item.status === 'shortage' ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200'}`}>{item.status}</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">Allocated {item.allocated_water} KL · Shortage {item.shortage} KL</p>
            </motion.div>
          ))}
          {data.allocations.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl bg-cyan-50 p-4 text-sm text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-200"
            >
              Allocation results appear here after an admin creates supply and runs the allocation engine.
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
