import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import AnalyticsCharts from '../components/Charts/AnalyticsCharts';
import { waterApi } from '../services/api';

export default function AnalyticsPage() {
  const [data, setData] = useState({ allocations: [], demands: [], dashboard: null });

  useEffect(() => {
    Promise.allSettled([waterApi.allocations(), waterApi.demand(), waterApi.dashboard()])
      .then(([allocations, demands, dashboard]) => setData({
        allocations: allocations.value?.data?.data || [],
        demands: demands.value?.data?.data || [],
        dashboard: dashboard.value?.data?.data || null
      }));
  }, []);

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
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <TrendingUp className="h-8 w-8 text-cyan-600" />
          </motion.div>
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Water Analytics</h2>
            <p className="text-slate-600 dark:text-slate-400">Real-time insights and trends</p>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      {data.dashboard && (
        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1 }}
        >
          {[
            { label: 'Total Allocated', value: data.dashboard.today?.allocation?.total_allocated || 0, unit: 'KL' },
            { label: 'Total Demanded', value: data.dashboard.today?.demand?.total_demand || 0, unit: 'KL' },
            { label: 'Allocation Rate', value: ((data.dashboard.today?.allocation?.total_allocated / (data.dashboard.today?.demand?.total_demand || 1)) * 100).toFixed(1), unit: '%' },
            { label: 'Shortage Areas', value: data.allocations.filter(a => a.status === 'shortage').length, unit: 'areas' }
          ].map((kpi, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="glass-card rounded-xl p-6"
            >
              <p className="text-sm text-slate-600 dark:text-slate-400">{kpi.label}</p>
              <motion.p
                className="mt-2 text-2xl font-bold text-slate-900 dark:text-white"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.15, duration: 0.4 }}
              >
                {kpi.value} <span className="text-lg text-slate-500">{kpi.unit}</span>
              </motion.p>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <AnalyticsCharts {...data} />
      </motion.div>
    </motion.div>
  );
}
