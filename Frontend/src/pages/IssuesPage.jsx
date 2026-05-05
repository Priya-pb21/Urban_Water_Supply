import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { waterApi } from '../services/api';

const statusConfig = {
  open: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-500/15', label: 'Open', dotColor: 'bg-red-500' },
  in_progress: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-500/15', label: 'In Progress', dotColor: 'bg-amber-500' },
  resolved: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-500/15', label: 'Resolved', dotColor: 'bg-emerald-500' },
  closed: { icon: Zap, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-500/15', label: 'Closed', dotColor: 'bg-slate-500' }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.05, duration: 0.3 }
  }),
  exit: { opacity: 0, x: -100 }
};

export default function IssuesPage() {
  const [issues, setIssues] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState(null);

  const load = () => {
    waterApi.issues()
      .then(({ data }) => setIssues(data.data || []))
      .catch(() => toast.error('Unable to load issues'));
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    try {
      await waterApi.updateIssue(id, { status });
      toast.success('Issue updated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const filteredIssues = selectedStatus ? issues.filter(i => i.status === selectedStatus) : issues;
  const statusCounts = {
    open: issues.filter(i => i.status === 'open').length,
    in_progress: issues.filter(i => i.status === 'in_progress').length,
    resolved: issues.filter(i => i.status === 'resolved').length,
    closed: issues.filter(i => i.status === 'closed').length
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">Issue Management</h2>
        <p className="text-slate-600 dark:text-slate-400">Track and manage water supply issues across all areas</p>
      </motion.div>

      {/* Status filter tabs */}
      <motion.div
        className="flex gap-2 overflow-x-auto pb-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <motion.button
          onClick={() => setSelectedStatus(null)}
          className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
            selectedStatus === null
              ? 'bg-cyan-600 text-white'
              : 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          All Issues
        </motion.button>
        {Object.entries(statusCounts).map(([status, count]) => (
          <motion.button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
              selectedStatus === status
                ? statusConfig[status].bg + ' ' + statusConfig[status].color
                : 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {statusConfig[status].label} <span className="ml-1 font-bold">{count}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Issues list */}
      <AnimatePresence mode="popLayout">
        <motion.div
          className="grid gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {filteredIssues.map((issue, index) => {
            const config = statusConfig[issue.status];
            const Icon = config.icon;

            return (
              <motion.div
                key={issue.id}
                custom={index}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                whileHover={{ x: 4 }}
                className="glass-card group rounded-xl p-5 transition-all hover:shadow-lg"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 animate-pulse-ring ${config.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">
                          {issue.area_name} · {issue.issue_type?.replaceAll('_', ' ').toUpperCase()}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{issue.description}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            Severity: <span className="font-bold">{issue.severity.toUpperCase()}</span>
                          </span>
                          <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {new Date(issue.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status dropdown */}
                  <motion.select
                    value={issue.status}
                    onChange={(e) => updateStatus(issue.id, e.target.value)}
                    className={`input max-w-48 ${config.bg}`}
                    whileHover={{ scale: 1.02 }}
                  >
                    {Object.entries(statusConfig).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </motion.select>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Empty state */}
      {filteredIssues.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-xl p-12 text-center"
        >
          <CheckCircle className="h-16 w-16 mx-auto text-emerald-500 mb-4" />
          <p className="text-lg font-bold text-slate-900 dark:text-white">No issues found</p>
          <p className="text-slate-600 dark:text-slate-400 mt-1">All systems are running smoothly!</p>
        </motion.div>
      )}
    </motion.div>
  );
}
