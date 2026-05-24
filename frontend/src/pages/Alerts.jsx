import { useState, useEffect } from 'react';
import { Bell, CheckCircle, Trash2, Filter } from 'lucide-react';
import { alertsAPI } from '../services/api';
import SeverityBadge from '../components/common/SeverityBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatDate, formatRelative, DETECTION_LABELS } from '../utils/helpers';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ severity: '', status: '', detectionType: '' });

  useEffect(() => { loadAlerts(); }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (filters.severity) params.severity = filters.severity;
      if (filters.status) params.status = filters.status;
      if (filters.detectionType) params.detectionType = filters.detectionType;
      const { data } = await alertsAPI.getAll(params);
      setAlerts(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    await alertsAPI.update(id, { status });
    loadAlerts();
    if (selected?._id === id) setSelected({ ...selected, status });
  };

  const deleteAlert = async (id) => {
    if (!confirm('Delete this alert?')) return;
    await alertsAPI.delete(id);
    setSelected(null);
    loadAlerts();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Bell className="text-soc-danger" /> Security Alerts
        </h1>
        <p className="text-soc-muted text-sm mt-1">Real-time threat detection alerts with MITRE ATT&CK mapping</p>
      </div>

      <div className="glass-card p-4 flex flex-wrap gap-3">
        <select value={filters.severity} onChange={(e) => setFilters({ ...filters, severity: e.target.value })} className="input-field w-auto text-sm">
          <option value="">All Severity</option>
          {['critical', 'high', 'medium', 'low'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="input-field w-auto text-sm">
          <option value="">All Status</option>
          {['new', 'investigating', 'contained', 'resolved', 'false_positive'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filters.detectionType} onChange={(e) => setFilters({ ...filters, detectionType: e.target.value })} className="input-field w-auto text-sm">
          <option value="">All Detection Types</option>
          {Object.entries(DETECTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button onClick={loadAlerts} className="btn-primary flex items-center gap-2 text-sm"><Filter size={14} /> Filter</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-2">
          {loading ? <LoadingSpinner /> : alerts.map((alert) => (
            <div
              key={alert._id}
              onClick={() => setSelected(alert)}
              className={`glass-card p-4 cursor-pointer transition-all ${selected?._id === alert._id ? 'border-soc-accent/50 bg-soc-accent/5' : 'hover:border-white/20'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-tight">{alert.title}</p>
                <SeverityBadge severity={alert.severity} />
              </div>
              <p className="text-xs text-soc-muted mt-2 font-mono">{alert.sourceIp} · {formatRelative(alert.createdAt)}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs px-2 py-0.5 rounded bg-white/10">{DETECTION_LABELS[alert.detectionType] || alert.detectionType}</span>
                <span className="text-xs text-soc-accent">AI: {alert.aiScore || alert.confidence}%</span>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-3">
          {selected ? (
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{selected.title}</h2>
                  <p className="text-soc-muted text-sm mt-1">{formatDate(selected.createdAt)}</p>
                </div>
                <SeverityBadge severity={selected.severity} size="md" />
              </div>

              <p className="text-sm text-gray-300">{selected.description}</p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Source IP', selected.sourceIp],
                  ['Detection', DETECTION_LABELS[selected.detectionType]],
                  ['Events', selected.eventCount],
                  ['AI Confidence', `${selected.confidence}%`],
                  ['MITRE Tactic', selected.mitreTactic],
                  ['MITRE Technique', `${selected.mitreTechniqueId} - ${selected.mitreTechnique}`],
                ].map(([label, value]) => (
                  <div key={label} className="p-3 bg-white/5 rounded-lg">
                    <p className="text-xs text-soc-muted">{label}</p>
                    <p className="text-sm font-mono mt-0.5">{value || 'N/A'}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                {['investigating', 'contained', 'resolved', 'false_positive'].map((status) => (
                  <button key={status} onClick={() => updateStatus(selected._id, status)} className="btn-primary text-xs capitalize">
                    Mark {status.replace('_', ' ')}
                  </button>
                ))}
                <button onClick={() => deleteAlert(selected._id)} className="btn-danger text-xs flex items-center gap-1 ml-auto">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-card p-12 text-center text-soc-muted">
              <CheckCircle size={40} className="mx-auto mb-3 opacity-30" />
              <p>Select an alert to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
