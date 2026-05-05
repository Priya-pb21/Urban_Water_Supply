import { useState } from 'react';
import { AlertTriangle, Play, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { waterApi } from '../services/api';

export default function AdminDashboard({ data, reload }) {
  const [supply, setSupply] = useState({ total_water: '', time_slot: 'morning', source: 'Main reservoir' });
  const [allocating, setAllocating] = useState(false);

  const createSupply = async (event) => {
    event.preventDefault();
    try {
      await waterApi.createSupply({ ...supply, total_water: Number(supply.total_water) });
      toast.success('Supply recorded');
      setSupply({ ...supply, total_water: '' });
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to create supply');
    }
  };

  const runAllocation = async () => {
    const latestSupply = data.supply[0];
    if (!latestSupply) {
      toast.error('Create supply first');
      return;
    }
    setAllocating(true);
    try {
      await waterApi.runAllocation({ supply_id: latestSupply.id });
      toast.success('Allocation engine completed');
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Allocation failed');
    } finally {
      setAllocating(false);
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      <form onSubmit={createSupply} className="panel">
        <h2 className="mb-4 font-bold text-slate-900 dark:text-white">Admin Controls</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <input className="input" type="number" placeholder="Total water KL" value={supply.total_water} onChange={(e) => setSupply({ ...supply, total_water: e.target.value })} required />
          <select className="input" value={supply.time_slot} onChange={(e) => setSupply({ ...supply, time_slot: e.target.value })}>
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
            <option value="night">Night</option>
            <option value="all_day">All day</option>
          </select>
          <input className="input" placeholder="Source" value={supply.source} onChange={(e) => setSupply({ ...supply, source: e.target.value })} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button className="btn-primary"><Plus className="h-4 w-4" /> Add Supply</button>
          <button type="button" onClick={runAllocation} className="btn-secondary" disabled={allocating}><Play className="h-4 w-4" /> Run Allocation</button>
        </div>
      </form>

      <div className="panel">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <h2 className="font-bold text-slate-900 dark:text-white">Shortage Alerts</h2>
        </div>
        <div className="space-y-3">
          {data.allocations.filter((a) => a.status === 'shortage').slice(0, 5).map((item) => (
            <div key={item.id} className="rounded-xl border border-red-100 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">
              <p className="font-semibold text-red-700 dark:text-red-200">{item.area_name}</p>
              <p className="text-sm text-red-600/80 dark:text-red-100/80">Shortage: {item.shortage} KL · Allocated {item.allocated_water} KL</p>
            </div>
          ))}
          {data.allocations.filter((a) => a.status === 'shortage').length === 0 && (
            <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">No shortage alerts right now.</p>
          )}
        </div>
      </div>
    </div>
  );
}
