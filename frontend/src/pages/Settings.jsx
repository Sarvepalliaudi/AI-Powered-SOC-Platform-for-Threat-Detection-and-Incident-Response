import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Settings as SettingsIcon, User, Shield, Bell } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <SettingsIcon className="text-soc-muted" /> Settings
        </h1>
        <p className="text-soc-muted text-sm mt-1">Platform preferences and account configuration</p>
      </div>

      <div className="glass-card p-6 space-y-6">
        <div className="flex items-center gap-4 pb-4 border-b border-white/10">
          <div className="p-3 rounded-full bg-soc-accent/20 border border-soc-accent/40">
            <User className="text-soc-accent" size={24} />
          </div>
          <div>
            <p className="font-semibold">{user?.name}</p>
            <p className="text-sm text-soc-muted">{user?.email}</p>
            <p className="text-xs text-soc-accent capitalize mt-1">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield size={18} className="text-soc-muted" />
            <div>
              <p className="text-sm font-medium">Dark Mode</p>
              <p className="text-xs text-soc-muted">SOC dark theme interface</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={`w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-soc-accent/40' : 'bg-gray-600'} relative`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell size={18} className="text-soc-muted" />
            <div>
              <p className="text-sm font-medium">Real-time Alerts</p>
              <p className="text-xs text-soc-muted">WebSocket notification stream</p>
            </div>
          </div>
          <span className="text-xs text-soc-accent px-2 py-1 rounded bg-soc-accent/10 border border-soc-accent/30">Enabled</span>
        </div>

        <div className="pt-4 border-t border-white/10">
          <h3 className="text-sm font-medium mb-3">Detection Thresholds</h3>
          <div className="space-y-2 text-sm text-soc-muted">
            <p>SSH Brute Force: 5 failed attempts</p>
            <p>Credential Brute Force: 10 failures / 3 users</p>
            <p>High Frequency: 100 requests per IP</p>
            <p>Port Scan: 10 unique ports</p>
          </div>
        </div>
      </div>
    </div>
  );
}
