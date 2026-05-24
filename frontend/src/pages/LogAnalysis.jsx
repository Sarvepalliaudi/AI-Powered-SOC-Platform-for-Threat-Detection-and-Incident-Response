import { useState, useEffect, useRef } from 'react';
import { Upload, Search, Filter, Trash2, FileText } from 'lucide-react';
import { logsAPI } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import SeverityBadge from '../components/common/SeverityBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatDate } from '../utils/helpers';

export default function LogAnalysis() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ logType: '', severity: '', isSuspicious: '' });
  const [stats, setStats] = useState(null);
  const fileRef = useRef();
  const { addNotification } = useNotifications();

  useEffect(() => { loadLogs(); loadStats(); }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (search) params.search = search;
      if (filters.logType) params.logType = filters.logType;
      if (filters.severity) params.severity = filters.severity;
      if (filters.isSuspicious) params.isSuspicious = filters.isSuspicious;
      const { data } = await logsAPI.getAll(params);
      setLogs(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data } = await logsAPI.stats();
      setStats(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await logsAPI.upload(file);
      addNotification({
        title: 'Log Analysis Complete',
        message: data.message,
        severity: data.data.alertsGenerated > 0 ? 'high' : 'low',
      });
      loadLogs();
      loadStats();
    } catch (err) {
      addNotification({ title: 'Upload Failed', message: err.response?.data?.message || 'Upload failed', severity: 'critical' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this log entry?')) return;
    await logsAPI.delete(id);
    loadLogs();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Log Analysis</h1>
          <p className="text-soc-muted text-sm mt-1">Upload and analyze auth.log & Apache access.log files</p>
        </div>
        <div>
          <input ref={fileRef} type="file" accept=".log,.txt" onChange={handleUpload} className="hidden" />
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-primary flex items-center gap-2">
            <Upload size={16} />
            {uploading ? 'Analyzing...' : 'Upload Log File'}
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Logs', value: stats.total },
            { label: 'Suspicious', value: stats.suspicious },
            { label: 'Auth Logs', value: stats.byType?.find((t) => t._id === 'auth')?.count || 0 },
            { label: 'Apache Logs', value: stats.byType?.find((t) => t._id === 'apache')?.count || 0 },
          ].map((s) => (
            <div key={s.label} className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-soc-accent">{s.value}</p>
              <p className="text-xs text-soc-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-soc-muted" size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search IP, user, content..." className="input-field pl-10 text-sm" />
          </div>
          <select value={filters.logType} onChange={(e) => setFilters({ ...filters, logType: e.target.value })} className="input-field w-auto text-sm">
            <option value="">All Types</option>
            <option value="auth">Auth Log</option>
            <option value="apache">Apache Log</option>
          </select>
          <select value={filters.severity} onChange={(e) => setFilters({ ...filters, severity: e.target.value })} className="input-field w-auto text-sm">
            <option value="">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select value={filters.isSuspicious} onChange={(e) => setFilters({ ...filters, isSuspicious: e.target.value })} className="input-field w-auto text-sm">
            <option value="">All Events</option>
            <option value="true">Suspicious Only</option>
          </select>
          <button onClick={loadLogs} className="btn-primary flex items-center gap-2 text-sm">
            <Filter size={14} /> Apply
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? <LoadingSpinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-soc-muted text-xs border-b border-white/10 bg-white/5">
                  <th className="text-left p-3">Timestamp</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">IP</th>
                  <th className="text-left p-3">User/Action</th>
                  <th className="text-left p-3">Severity</th>
                  <th className="text-left p-3">Suspicious</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-soc-muted">
                    <FileText className="mx-auto mb-2 opacity-50" size={32} />
                    No logs found. Upload auth.log or access.log to begin analysis.
                  </td></tr>
                ) : logs.map((log) => (
                  <tr key={log._id} className="border-b border-white/5 table-row-hover">
                    <td className="p-3 font-mono text-xs whitespace-nowrap">{formatDate(log.timestamp)}</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded bg-white/10 text-xs uppercase">{log.logType}</span></td>
                    <td className="p-3 font-mono text-soc-accent2">{log.parsed?.ip || '-'}</td>
                    <td className="p-3 max-w-xs truncate">{log.parsed?.user || log.parsed?.action || '-'}</td>
                    <td className="p-3"><SeverityBadge severity={log.severity} /></td>
                    <td className="p-3">{log.isSuspicious ? <span className="text-soc-danger text-xs font-bold">YES</span> : <span className="text-soc-muted text-xs">No</span>}</td>
                    <td className="p-3">
                      <button onClick={() => handleDelete(log._id)} className="text-soc-muted hover:text-soc-danger"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
