import { useState } from 'react';
import { Megaphone, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { waterApi } from '../services/api';

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
    <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      <form onSubmit={reportIssue} className="panel">
        <div className="mb-4 flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-cyan-600" />
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
          <button className="btn-primary w-full"><Send className="h-4 w-4" /> Send Report</button>
        </div>
      </form>

      <div className="panel">
        <h2 className="mb-4 font-bold text-slate-900 dark:text-white">Water Schedule</h2>
        <div className="space-y-3">
          {data.supply.slice(0, 6).map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-4 dark:border-white/10">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{item.time_slot}</p>
                <p className="text-sm text-slate-500">{new Date(item.date).toLocaleDateString()} · {item.source || 'Reservoir'}</p>
              </div>
              <p className="font-bold text-cyan-600">{item.available || item.total_water} KL</p>
            </div>
          ))}
          {data.supply.length === 0 && <p className="text-sm text-slate-500">No schedule published yet.</p>}
        </div>
      </div>
    </div>
  );
}
