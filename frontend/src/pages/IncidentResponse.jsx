import { useState, useEffect } from 'react';
import { ShieldAlert, Plus, MessageSquare, Clock, FileWarning } from 'lucide-react';
import { incidentsAPI, alertsAPI } from '../services/api';
import SeverityBadge from '../components/common/SeverityBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatDate } from '../utils/helpers';

export default function IncidentResponse() {
  const [incidents, setIncidents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [comment, setComment] = useState('');
  const [form, setForm] = useState({ title: '', description: '', severity: 'medium', relatedAlerts: [] });

  useEffect(() => { loadIncidents(); loadAlerts(); }, []);

  const loadIncidents = async () => {
    setLoading(true);
    try {
      const { data } = await incidentsAPI.getAll({ limit: 50 });
      setIncidents(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const { data } = await alertsAPI.getAll({ limit: 20, status: 'new' });
      setAlerts(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const selectIncident = async (id) => {
    const { data } = await incidentsAPI.getById(id);
    setSelected(data.data);
  };

  const createIncident = async (e) => {
    e.preventDefault();
    await incidentsAPI.create(form);
    setShowCreate(false);
    setForm({ title: '', description: '', severity: 'medium', relatedAlerts: [] });
    loadIncidents();
  };

  const updateIncident = async (field, value) => {
    const { data } = await incidentsAPI.update(selected._id, { [field]: value });
    setSelected(data.data);
    loadIncidents();
  };

  const addComment = async () => {
    if (!comment.trim()) return;
    const { data } = await incidentsAPI.addComment(selected._id, comment);
    setSelected(data.data);
    setComment('');
  };

  const addTimeline = async (action, type) => {
    const { data } = await incidentsAPI.addTimeline(selected._id, { action, type });
    setSelected(data.data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <ShieldAlert className="text-soc-warning" /> Incident Response
          </h1>
          <p className="text-soc-muted text-sm mt-1">Manage security incidents, investigations & containment</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Create Incident
        </button>
      </div>

      {showCreate && (
        <div className="glass-card p-6">
          <h2 className="font-semibold mb-4">New Incident Report</h2>
          <form onSubmit={createIncident} className="space-y-4">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Incident Title" className="input-field" required />
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="input-field h-24 resize-none" required />
            <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} className="input-field w-auto">
              {['low', 'medium', 'high', 'critical'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <div>
              <p className="text-sm text-soc-muted mb-2">Link Alerts (optional)</p>
              <div className="flex flex-wrap gap-2">
                {alerts.map((a) => (
                  <label key={a._id} className="flex items-center gap-2 text-xs p-2 rounded bg-white/5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.relatedAlerts.includes(a._id)}
                      onChange={(e) => {
                        const ids = e.target.checked
                          ? [...form.relatedAlerts, a._id]
                          : form.relatedAlerts.filter((id) => id !== a._id);
                        setForm({ ...form, relatedAlerts: ids });
                      }}
                    />
                    {a.title.slice(0, 40)}...
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">Create Incident</button>
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-soc-muted hover:text-white">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          {loading ? <LoadingSpinner /> : incidents.map((inc) => (
            <div
              key={inc._id}
              onClick={() => selectIncident(inc._id)}
              className={`glass-card p-4 cursor-pointer ${selected?._id === inc._id ? 'border-soc-accent/50' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-soc-accent">{inc.incidentId}</span>
                <SeverityBadge severity={inc.severity} />
              </div>
              <p className="text-sm font-medium mt-1">{inc.title}</p>
              <p className="text-xs text-soc-muted mt-1 capitalize">{inc.status.replace('_', ' ')}</p>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <div className="space-y-4">
              <div className="glass-card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="font-mono text-soc-accent">{selected.incidentId}</span>
                    <h2 className="text-lg font-semibold mt-1">{selected.title}</h2>
                  </div>
                  <SeverityBadge severity={selected.severity} size="md" />
                </div>
                <p className="text-sm text-gray-300 mb-4">{selected.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {['open', 'investigating', 'contained', 'recovered', 'closed'].map((s) => (
                    <button key={s} onClick={() => updateIncident('status', s)} className={`text-xs px-3 py-1 rounded-full border capitalize ${selected.status === s ? 'bg-soc-accent/20 border-soc-accent/50 text-soc-accent' : 'border-white/20 text-soc-muted hover:text-white'}`}>
                      {s}
                    </button>
                  ))}
                </div>

                {selected.aiSummary && (
                  <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20 mb-4">
                    <p className="text-xs text-purple-400 font-semibold mb-2">AI-Generated Summary</p>
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans">{selected.aiSummary}</pre>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-soc-muted">Source IPs:</span> <span className="font-mono">{selected.sourceIps?.join(', ') || 'N/A'}</span></div>
                  <div><span className="text-soc-muted">Recovery:</span> <span className="capitalize">{selected.recoveryStatus?.replace('_', ' ')}</span></div>
                </div>
              </div>

              <div className="glass-card p-5">
                <h3 className="font-semibold flex items-center gap-2 mb-3"><Clock size={16} /> Timeline</h3>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {(selected.timeline || []).map((t, i) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-soc-accent mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{t.action}</p>
                        <p className="text-xs text-soc-muted">{t.description} · {formatDate(t.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => addTimeline('Containment action applied', 'containment')} className="btn-primary text-xs">Add Containment</button>
                  <button onClick={() => addTimeline('Recovery initiated', 'recovery')} className="btn-primary text-xs">Add Recovery</button>
                </div>
              </div>

              <div className="glass-card p-5">
                <h3 className="font-semibold flex items-center gap-2 mb-3"><MessageSquare size={16} /> Analyst Comments</h3>
                <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
                  {(selected.analystComments || []).map((c, i) => (
                    <div key={i} className="p-2 bg-white/5 rounded text-sm">
                      <p>{c.comment}</p>
                      <p className="text-xs text-soc-muted mt-1">{c.author?.name} · {formatDate(c.createdAt)}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add investigation note..." className="input-field text-sm flex-1" />
                  <button onClick={addComment} className="btn-primary text-sm">Post</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-12 text-center text-soc-muted">
              <FileWarning size={40} className="mx-auto mb-3 opacity-30" />
              <p>Select an incident to manage response workflow</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
