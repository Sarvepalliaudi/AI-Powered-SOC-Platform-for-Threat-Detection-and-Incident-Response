import { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Activity, AlertTriangle, FileText, Shield, Brain, Globe } from 'lucide-react';
import { dashboardAPI } from '../services/api';
import { connectSocket } from '../services/socket';
import { useNotifications } from '../context/NotificationContext';
import StatCard from '../components/common/StatCard';
import SeverityBadge from '../components/common/SeverityBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatRelative } from '../utils/helpers';

const SEVERITY_COLORS = ['#ff3366', '#ffaa00', '#00d4ff', '#64748b'];
const CHART_TOOLTIP = { backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '8px' };

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [traffic, setTraffic] = useState([]);
  const [aiData, setAiData] = useState(null);
  const [geoData, setGeoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotifications();

  useEffect(() => {
    loadDashboard();
    const socket = connectSocket();
    socket.on('new-alert', (alert) => {
      addNotification({ title: 'New Alert', message: alert.title, severity: alert.severity });
      loadDashboard();
    });
    return () => socket.off('new-alert');
  }, []);

  const loadDashboard = async () => {
    try {
      const [overview, attackTimeline, trafficData, ai, geo] = await Promise.all([
        dashboardAPI.overview(),
        dashboardAPI.attackTimeline(),
        dashboardAPI.traffic(),
        dashboardAPI.aiAnalysis(),
        dashboardAPI.geoAttacks(),
      ]);
      setData(overview.data.data);
      setTimeline(attackTimeline.data.data);
      setTraffic(trafficData.data.data);
      setAiData(ai.data.data);
      setGeoData(geo.data.data);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const stats = data?.stats || {};
  const severityData = Object.entries(data?.severityDistribution || {}).map(([name, value]) => ({ name, value }));
  const pieData = severityData.filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">SOC Command Center</h1>
          <p className="text-soc-muted text-sm mt-1">Real-time security monitoring & threat intelligence</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-soc-accent/10 border border-soc-accent/30">
          <span className="w-2 h-2 bg-soc-accent rounded-full animate-pulse" />
          <span className="text-xs text-soc-accent font-mono">LIVE MONITORING</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Logs" value={stats.totalLogs?.toLocaleString() || 0} icon={FileText} color="info" />
        <StatCard title="Active Alerts" value={stats.totalAlerts || 0} icon={AlertTriangle} color="danger" trend={`${stats.criticalAlerts || 0} critical`} />
        <StatCard title="Suspicious Events" value={stats.suspiciousLogs || 0} icon={Activity} color="warning" />
        <StatCard title="Open Incidents" value={stats.openIncidents || 0} icon={Shield} color="accent" />
      </div>

      {aiData && (
        <div className="glass-card p-5 border border-purple-500/20">
          <div className="flex items-center gap-3 mb-3">
            <Brain className="text-purple-400" size={20} />
            <h2 className="font-display font-semibold">AI Threat Analysis</h2>
            <span className="ml-auto text-sm font-mono text-purple-400">Score: {aiData.score?.score}/100</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-white/5 rounded-lg">
              <p className="text-2xl font-bold text-purple-400">{aiData.score?.confidence}%</p>
              <p className="text-xs text-soc-muted">AI Confidence</p>
            </div>
            <div className="text-center p-3 bg-white/5 rounded-lg">
              <p className="text-2xl font-bold text-soc-warning capitalize">{aiData.score?.riskLevel}</p>
              <p className="text-xs text-soc-muted">Risk Level</p>
            </div>
            <div className="text-center p-3 bg-white/5 rounded-lg">
              <p className="text-2xl font-bold text-soc-accent">{aiData.anomalies?.length || 0}</p>
              <p className="text-xs text-soc-muted">Anomalies Detected</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-5">
          <h2 className="font-semibold mb-4">Alert Severity Distribution</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {pieData.map((_, i) => <Cell key={i} fill={SEVERITY_COLORS[i % SEVERITY_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={CHART_TOOLTIP} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5 lg:col-span-2">
          <h2 className="font-semibold mb-4">Attack Timeline</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={CHART_TOOLTIP} />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#00ff88" strokeWidth={2} dot={false} name="Total" />
              <Line type="monotone" dataKey="critical" stroke="#ff3366" strokeWidth={2} dot={false} name="Critical" />
              <Line type="monotone" dataKey="high" stroke="#ffaa00" strokeWidth={2} dot={false} name="High" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5">
          <h2 className="font-semibold mb-4">Network Traffic</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={traffic}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={CHART_TOOLTIP} />
              <Bar dataKey="requests" fill="#00d4ff" name="Requests" radius={[4, 4, 0, 0]} />
              <Bar dataKey="suspicious" fill="#ff3366" name="Suspicious" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="text-soc-accent2" size={18} />
            <h2 className="font-semibold">Geo Attack Map</h2>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {geoData.map((g, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{g.code === 'RU' ? '🇷🇺' : g.code === 'CN' ? '🇨🇳' : g.code === 'US' ? '🇺🇸' : '🌍'}</span>
                  <div>
                    <p className="text-sm font-medium">{g.country}</p>
                    <p className="text-xs text-soc-muted font-mono">{g.ip}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-soc-danger">{g.count} attacks</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5">
          <h2 className="font-semibold mb-4">Recent Alerts</h2>
          <div className="space-y-2">
            {(data?.recentAlerts || []).map((alert) => (
              <div key={alert._id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 table-row-hover">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{alert.title}</p>
                  <p className="text-xs text-soc-muted font-mono">{alert.sourceIp} · {formatRelative(alert.createdAt)}</p>
                </div>
                <SeverityBadge severity={alert.severity} />
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <h2 className="font-semibold mb-4">Top Attackers</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-soc-muted text-xs border-b border-white/10">
                <th className="text-left pb-2">IP Address</th>
                <th className="text-right pb-2">Events</th>
                <th className="text-right pb-2">Severity</th>
              </tr>
            </thead>
            <tbody>
              {(data?.topAttackers || []).map((a, i) => (
                <tr key={i} className="border-b border-white/5 table-row-hover">
                  <td className="py-2.5 font-mono text-soc-accent2">{a.ip}</td>
                  <td className="py-2.5 text-right font-bold">{a.count}</td>
                  <td className="py-2.5 text-right"><SeverityBadge severity={a.severity || 'medium'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
