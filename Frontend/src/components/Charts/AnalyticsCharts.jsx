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
  YAxis
} from 'recharts';

const COLORS = ['#06b6d4', '#f97316', '#ef4444', '#22c55e', '#6366f1', '#14b8a6'];

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
      <div className="panel xl:col-span-2">
        <h3 className="mb-4 font-bold text-slate-900 dark:text-white">Area Allocation</h3>
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={areaAllocation.length ? areaAllocation : [{ area: 'No data', allocated: 0, demanded: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
              <XAxis dataKey="area" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="demanded" fill="#94a3b8" radius={[8, 8, 0, 0]} />
              <Bar dataKey="allocated" fill="#06b6d4" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel">
        <h3 className="mb-4 font-bold text-slate-900 dark:text-white">Priority Mix</h3>
        <div className="h-72">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={priorityData.length ? priorityData : [{ name: 'No data', value: 1 }]} dataKey="value" nameKey="name" innerRadius={54} outerRadius={92} paddingAngle={4}>
                {(priorityData.length ? priorityData : [{ name: 'No data' }]).map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel xl:col-span-3">
        <h3 className="mb-4 font-bold text-slate-900 dark:text-white">Water Usage Trend</h3>
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="demanded" stroke="#f97316" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="allocated" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
