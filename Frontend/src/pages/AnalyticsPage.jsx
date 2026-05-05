import { useEffect, useState } from 'react';
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
    <div className="space-y-5">
      <h2 className="text-2xl font-black text-slate-950 dark:text-white">Analytics</h2>
      <AnalyticsCharts {...data} />
    </div>
  );
}
