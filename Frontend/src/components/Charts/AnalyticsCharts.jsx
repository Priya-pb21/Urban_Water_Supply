import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend
} from 'recharts';
import { motion } from 'framer-motion';

const COLORS = ['#0891b2', '#06b6d4', '#10b981', '#f59e0b', '#6366f1', '#14b8a6'];

const chartVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4 }
  })
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-lg px-3 py-2 shadow-lg"
      >
        <p className="text-xs font-semibold text-slate-900 dark:text-white">
          {payload[0].value}
        </p>
      </motion.div>
    );
  }
  return null;
};

export default function AnalyticsCharts({ allocations = [], demands = [], dashboard }) {
  const areaAllocation = allocations.slice(0, 8).map((a) => ({
    area: a.area_name || 'Area',
    allocated: Number(a.allocated_water || 0),
    demanded: Number(a.demanded_water || 0)
  }));

  const priorityMap = demands.reduce((acc, d) => {
    const label = Number(d.priority) >= 8 ? 'High' : Number(d.priority) >= 5 ? 'Medium' : 'Low';
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
  const priorityData = Object.entries(priorityMap).map(([name, value]) => ({ name, value }));

  const trend = dashboard?.trend_7days?.length
    ? dashboard.trend_7days.map((item) => ({
      date: new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      allocated: Number(item.allocated || 0),
      demanded: Number(item.demanded || 0)
    }))
    : [
      { date: 'Mon', allocated: 420, demanded: 510 },
      { date: 'Tue', allocated: 480, demanded: 530 },
      { date: 'Wed', allocated: 390, demanded: 610 },
      { date: 'Thu', allocated: 560, demanded: 590 },
      { date: 'Fri', allocated: 610, demanded: 680 }
    ];

  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <motion.div
        custom={0}
        variants={chartVariants}
        initial="hidden"
        animate="visible"
        className="glass-card rounded-2xl p-6 xl:col-span-2"
      >
        <h3 className="mb-4 font-bold text-slate-900 dark:text-white">Area Allocation</h3>
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={areaAllocation.length ? areaAllocation : [{ area: 'No data', allocated: 0, demanded: 0 }]}>
              <CartesianGrid stroke="rgba(148,163,184,0.1)" />
              <XAxis dataKey="area" tick={{ fill: 'rgb(148,163,184)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'rgb(148,163,184)', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
              <Bar dataKey="demanded" fill="#f59e0b" radius={[8, 8, 0, 0]} name="Demanded (KL)" animationDuration={800} />
              <Bar dataKey="allocated" fill="#06b6d4" radius={[8, 8, 0, 0]} name="Allocated (KL)" animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div
        custom={1}
        variants={chartVariants}
        initial="hidden"
        animate="visible"
        className="glass-card rounded-2xl p-6"
      >
        <h3 className="mb-4 font-bold text-slate-900 dark:text-white">Priority Mix</h3>
        <div className="h-72">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={priorityData.length ? priorityData : [{ name: 'No data', value: 1 }]}
                dataKey="value"
                nameKey="name"
                innerRadius={54}
                outerRadius={92}
                paddingAngle={4}
                animationDuration={800}
              >
                {(priorityData.length ? priorityData : [{ name: 'No data' }]).map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ payload }) => (
                  payload && payload.length ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="glass-card rounded-lg px-3 py-2 shadow-lg"
                    >
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">
                        {payload[0].name}: {payload[0].value}
                      </p>
                    </motion.div>
                  ) : null
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div
        custom={2}
        variants={chartVariants}
        initial="hidden"
        animate="visible"
        className="glass-card rounded-2xl p-6 xl:col-span-3"
      >
        <h3 className="mb-4 font-bold text-slate-900 dark:text-white">Water Usage Trend</h3>
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={trend}>
              <CartesianGrid stroke="rgba(148,163,184,0.1)" />
              <XAxis dataKey="date" tick={{ fill: 'rgb(148,163,184)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'rgb(148,163,184)', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
              <Line
                type="monotone"
                dataKey="demanded"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={false}
                name="Demanded (KL)"
                animationDuration={1000}
              />
              <Line
                type="monotone"
                dataKey="allocated"
                stroke="#06b6d4"
                strokeWidth={3}
                dot={{ r: 4 }}
                name="Allocated (KL)"
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
