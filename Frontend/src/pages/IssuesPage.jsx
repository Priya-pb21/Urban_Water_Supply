import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { waterApi } from '../services/api';

export default function IssuesPage() {
  const [issues, setIssues] = useState([]);

  const load = () => {
    waterApi.issues()
      .then(({ data }) => setIssues(data.data || []))
      .catch(() => toast.error('Unable to load issues'));
  };

  useEffect(load, []);

  const updateStatus = async (id, status) => {
    try {
      await waterApi.updateIssue(id, { status });
      toast.success('Issue updated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-black text-slate-950 dark:text-white">Issue Management</h2>
      <div className="grid gap-4">
        {issues.map((issue) => (
          <div key={issue.id} className="panel">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{issue.area_name} · {issue.issue_type?.replaceAll('_', ' ')}</p>
                <p className="mt-1 text-sm text-slate-500">{issue.description}</p>
                <p className="mt-2 text-xs text-slate-400">Severity: {issue.severity} · Status: {issue.status}</p>
              </div>
              <select className="input max-w-48" value={issue.status} onChange={(e) => updateStatus(issue.id, e.target.value)}>
                <option value="open">Open</option>
                <option value="in_progress">In progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        ))}
        {issues.length === 0 && <div className="panel text-slate-500">No issues found.</div>}
      </div>
    </div>
  );
}
