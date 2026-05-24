import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FileSearch, Bell, ShieldAlert, FileText,
  Settings, Users, ChevronLeft, ChevronRight, Shield, BookOpen,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/logs', icon: FileSearch, label: 'Log Analysis' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/incidents', icon: ShieldAlert, label: 'Incidents' },
  { to: '/reports', icon: FileText, label: 'Reports' },
  { to: '/manual', icon: BookOpen, label: 'User Manual' },
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/about', icon: Users, label: 'Team / About' },
];

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside
      className={`fixed left-0 top-0 h-full z-40 flex flex-col theme-sidebar backdrop-blur-xl border-r transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'var(--card-border)' }}>
        <div className="p-2 rounded-lg bg-soc-accent/20 neon-border flex-shrink-0">
          <Shield className="text-soc-accent" size={22} />
        </div>
        {!collapsed && (
          <div>
            <h1 className="font-display font-bold text-sm neon-text leading-tight">AI SOC</h1>
            <p className="text-xs theme-muted">Threat Detection Platform</p>
          </div>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-soc-accent/15 text-soc-accent border border-soc-accent/30'
                  : 'nav-inactive border border-transparent'
              }`
            }
          >
            <Icon size={20} className="flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t" style={{ borderColor: 'var(--card-border)' }}>
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg theme-muted nav-inactive transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span className="text-sm">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
