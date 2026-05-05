import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, Droplet, Gauge, MapPinned, Waves } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { waterApi } from '../services/api';
import StatCard from '../components/StatCard';
import AnalyticsCharts from '../components/Charts/AnalyticsCharts';
import WaterMap from '../components/Map/WaterMap';
import AdminDashboard from './AdminDashboard';
import ManagerDashboard from './ManagerDashboard';
import UserDashboard from './UserDashboard';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({ areas: [], mapAreas: [], demands: [], allocations: [], issues: [], supply: [], dashboard: null });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [areas, map, demands, allocations, issues, supply, dashboard] = await Promise.allSettled([
        waterApi.areas(),
        waterApi.mapData(),
        waterApi.demand(),
        waterApi.allocations(),
        waterApi.issues(),
        waterApi.supply(),
        user?.role === 'admin' ? waterApi.dashboard() : Promise.resolve({ data: { data: null } })
      ]);
      setData({
        areas: areas.value?.data?.data || [],
        mapAreas: map.value?.data?.data || [],
        demands: demands.value?.data?.data || [],
        allocations: allocations.value?.data?.data || [],
        issues: issues.value?.data?.data || [],
        supply: supply.value?.data?.data || [],
        dashboard: dashboard.value?.data?.data || null
      });
    } catch {
      toast.error('Unable to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const today = data.dashboard?.today;
  const totalSupply = Number(today?.supply?.total_supply || data.supply[0]?.total_water || 0);
  const totalDemand = Number(today?.demand?.total_demand || data.demands.reduce((s, d) => s + Number(d.quantity || 0), 0));
  const shortage = Number(today?.allocation?.shortage_areas || data.allocations.filter((a) => a.status === 'shortage').length);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      
      {user?.role === 'admin' && <AdminDashboard data={data} reload={load} loading={loading} />}
      {user?.role === 'area_manager' && <ManagerDashboard data={data} reload={load} />}
      {user?.role === 'user' && <UserDashboard data={data} reload={load} />}

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="panel">
          <div className="mb-4 flex items-center gap-2">           <Activity className="h-5 w-5 text-cyan-600" />
            <h2 className="font-bold text-slate-900 dark:text-white">Live Operations</h2>
          </div>
          <AnalyticsCharts allocations={data.allocations} demands={data.demands} dashboard={data.dashboard} />
        </div>
        <div className="space-y-5">
          <div className="panel">
            <div className="mb-4 flex items-center gap-2">
              <MapPinned className="h-5 w-5 text-cyan-600" />
              <h2 className="font-bold text-slate-900 dark:text-white">Geospatial View</h2>
            </div>
            <WaterMap areas={data.mapAreas} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}