import { useState } from 'react';
import { Megaphone, Send, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { waterApi } from '../services/api';

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.05, duration: 0.3 }
  })
};

export default function UserDashboard({ data, reload }) {
  const [issue, setIssue] = useState({ area_id: '', issue_type: 'no_supply', description: '', severity: 'medium' });

  const reportIssue = async (event) => {
    event.preventDefault();
    try {
      await waterApi.createIssue(issue);
      toast.success('Issue reported. Authorities notified.');
      setIssue({ area_id: '', issue_type: 'no_supply', description: '', severity: 'medium' });
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Issue report failed');
    }
  };

  return (
    <motion.div
      className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1 }}
    >
      <motion.form
        onSubmit={reportIssue}
        className="panel"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ boxShadow: '0 20px 40px rgba(8, 145, 178, 0.1)' }}
      >
        <div className="mb-4 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <h2 className="font-bold text-slate-900 dark:text-white">Report Issue</h2>
        </div>
        <div className="space-y-3">
          <select className="input" value={issue.area_id} onChange={(e) => setIssue({ ...issue, area_id: e.target.value })} required>
            <option value="">Select area</option>
            {data.areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
          </select>
          <select className="input" value={issue.issue_type} onChange={(e) => setIssue({ ...issue, issue_type: e.target.value })}>
            <option value="no_supply">No supply</option>
            <option value="leakage">Leakage</option>
            <option value="water_breakout">Water breakout</option>
            <option value="low_pressure">Low pressure</option>
            <option value="contamination">Contamination</option>
            <option value="other">Other</option>
          </select>
          <select className="input" value={issue.severity} onChange={(e) => setIssue({ ...issue, severity: e.target.value })}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <textarea className="input min-h-24" placeholder="Describe the issue" value={issue.description} onChange={(e) => setIssue({ ...issue, description: e.target.value })} required />
          <motion.button
            className="btn-primary w-full"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Send className="h-4 w-4" /> Send Report
          </motion.button>
        </div>
      </motion.form>

      <motion.div
        className="panel"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-cyan-600" />
          <h2 className="font-bold text-slate-900 dark:text-white">Water Schedule</h2>
        </div>
        <div className="space-y-3">
          {data.supply.slice(0, 6).map((item, index) => (
            <motion.div
              key={item.id}
              custom={index}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="flex items-center justify-between rounded-xl border border-slate-100 p-4 dark:border-white/10 hover:border-cyan-200 dark:hover:border-cyan-400 transition-all"
            >
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{item.time_slot}</p>
                <p className="text-sm text-slate-500">{new Date(item.date).toLocaleDateString()} · {item.source || 'Reservoir'}</p>
              </div>
              <motion.p
                className="font-bold text-cyan-600 dark:text-cyan-400"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {item.available || item.total_water} KL
              </motion.p>
            </motion.div>
          ))}
          {data.supply.length === 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-slate-500"
            >
              No schedule published yet.
            </motion.p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
