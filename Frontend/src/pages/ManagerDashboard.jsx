import { useEffect, useState } from 'react';
import { ClipboardList, ClipboardPlus, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { waterApi } from '../services/api';

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
    <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      <div className="space-y-5">
        <form onSubmit={submitDemand} className="panel">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardPlus className="h-5 w-5 text-cyan-600" />
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
            <button className="btn-primary w-full" disabled={!data.areas.length}>
              <Send className="h-4 w-4" /> Submit Demand
            </button>
            {!data.areas.length && <p className="text-sm text-red-500">No active areas found. Create an area first from admin dashboard or API.</p>}
          </div>
        </form>

        <div className="panel">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-cyan-600" />
            <h2 className="font-bold text-slate-900 dark:text-white">Submitted Demands</h2>
          </div>
          <div className="space-y-3">
            {data.demands.slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-100 p-4 dark:border-white/10">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900 dark:text-white">{item.area_name}</p>
                  <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-700">{item.status}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{item.quantity} KL requested, priority {item.priority}</p>
              </div>
            ))}
            {data.demands.length === 0 && <p className="text-sm text-slate-500">No demands submitted yet.</p>}
          </div>
        </div>
      </div>

      <div className="panel">
        <h2 className="mb-4 font-bold text-slate-900 dark:text-white">Allocation Results</h2>
        <div className="space-y-3">
          {data.allocations.slice(0, 6).map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-100 p-4 dark:border-white/10">
              <div className="flex justify-between gap-3">
                <p className="font-semibold text-slate-900 dark:text-white">{item.area_name}</p>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${item.status === 'shortage' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{item.status}</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">Allocated {item.allocated_water} KL · Shortage {item.shortage} KL</p>
            </div>
          ))}
          {data.allocations.length === 0 && (
            <p className="rounded-xl bg-cyan-50 p-4 text-sm text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-200">
              Allocation results appear here after an admin creates supply and runs the allocation engine.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
