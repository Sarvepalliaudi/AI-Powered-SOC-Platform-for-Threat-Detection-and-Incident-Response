import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Search, Bell, Sun, Moon, LogOut, User, X, AlertTriangle,
} from 'lucide-react';
import SeverityBadge from '../common/SeverityBadge';

export default function Header({ onSearch }) {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const { notifications, removeNotification, clearAll } = useNotifications();
  const [time, setTime] = useState(new Date());
  const [showNotifs, setShowNotifs] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch?.(search);
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 theme-header backdrop-blur-xl border-b">
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-soc-muted" size={16} />
          <input
            type="text"
            placeholder="Search alerts, IPs, incidents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 py-2 text-sm w-full"
          />
        </div>
      </form>

      <div className="flex items-center gap-4 ml-4">
        <div className="hidden md:block text-right">
          <p className="text-xs theme-muted font-mono">SOC TIME (UTC)</p>
          <p className="text-sm font-mono text-soc-accent">{time.toUTCString().slice(17, 25)}</p>
        </div>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-white/5 text-soc-muted hover:text-white transition-colors"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-lg hover:bg-white/5 text-soc-muted hover:text-white transition-colors"
          >
            <Bell size={18} />
            {notifications.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-soc-danger rounded-full text-xs flex items-center justify-center animate-pulse">
                {notifications.length > 9 ? '9+' : notifications.length}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-80 glass-card shadow-2xl z-50">
              <div className="flex items-center justify-between p-3 border-b border-white/10">
                <span className="text-sm font-medium">Notifications</span>
                <div className="flex gap-2">
                  <button onClick={clearAll} className="text-xs text-soc-muted hover:text-white">Clear</button>
                  <button onClick={() => setShowNotifs(false)}><X size={14} /></button>
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="p-4 text-sm text-soc-muted text-center">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="p-3 border-b border-white/5 hover:bg-white/5">
                      <div className="flex items-start gap-2">
                        <AlertTriangle size={14} className="text-soc-warning mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{n.title}</p>
                          <p className="text-xs text-soc-muted truncate">{n.message}</p>
                          {n.severity && <SeverityBadge severity={n.severity} />}
                        </div>
                        <button onClick={() => removeNotification(n.id)} className="text-soc-muted hover:text-white">
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pl-4 border-l border-white/10">
          <div className="w-8 h-8 rounded-full bg-soc-accent/20 border border-soc-accent/40 flex items-center justify-center">
            <User size={16} className="text-soc-accent" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-soc-muted capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
          <button onClick={logout} className="p-2 rounded-lg hover:bg-soc-danger/20 text-soc-muted hover:text-soc-danger transition-colors" title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
