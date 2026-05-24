import { BookOpen, LogIn, Upload, Bell, ShieldAlert, FileText, Settings, Moon, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

const sections = [
  {
    icon: LogIn,
    title: '1. Login & Authentication',
    content: [
      'Open the platform URL and enter your analyst credentials.',
      'Demo accounts: bhanu@soc.local / soc123 (Lead Analyst), admin@soc.local / admin123 (Admin).',
      'JWT tokens are stored securely in browser localStorage for session management.',
      'Use the logout button in the top-right header to end your session.',
    ],
  },
  {
    icon: Upload,
    title: '2. Log Analysis',
    content: [
      'Navigate to Log Analysis from the sidebar.',
      'Click "Upload Log File" and select auth.log or Apache access.log files.',
      'The system automatically parses logs, detects threats, and generates alerts.',
      'Use search and filters (type, severity, suspicious) to investigate events.',
    ],
  },
  {
    icon: Bell,
    title: '3. Security Alerts',
    content: [
      'View real-time alerts with severity levels: Critical, High, Medium, Low.',
      'Each alert includes MITRE ATT&CK tactic/technique mapping and AI confidence score.',
      'Click an alert to view details, then update status: Investigating, Contained, Resolved.',
      'Live alerts appear via WebSocket when new threats are detected.',
    ],
  },
  {
    icon: ShieldAlert,
    title: '4. Incident Response',
    content: [
      'Create incidents from the Incidents page and link related alerts.',
      'Track investigation timeline, containment actions, and recovery status.',
      'Add analyst comments and evidence during investigation.',
      'AI-generated incident summaries are created automatically.',
    ],
  },
  {
    icon: FileText,
    title: '5. Reports',
    content: [
      'Generate PDF reports: Threat Analysis, Log Summary, or Incident Reports.',
      'Download reports from the Report History table.',
      'Reports include statistics, alert summaries, and MITRE mappings.',
    ],
  },
  {
    icon: Moon,
    title: '6. Theme & Settings',
    content: [
      'Toggle Dark/Light mode using the sun/moon icon in the header.',
      'Theme preference is saved automatically in your browser.',
      'Settings page shows your role, detection thresholds, and preferences.',
    ],
  },
  {
    icon: Database,
    title: '7. What MongoDB Does',
    content: [
      'MongoDB Atlas stores all platform data: users, logs, alerts, incidents, and reports.',
      'When you upload logs, they are saved and analyzed by the threat detection engine.',
      'Alerts and incidents persist across sessions so analysts can continue investigations.',
      'The database runs on MongoDB Atlas (cloud) — no local database install required for production.',
    ],
  },
];

export default function UserManual() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <BookOpen className="text-soc-accent" /> User Manual
        </h1>
        <p className="theme-muted text-sm mt-1">
          Complete guide for SOC analysts using the AI-Powered Threat Detection Platform
        </p>
      </div>

      <div className="glass-card p-5 border-l-4 border-soc-accent">
        <p className="text-sm">
          <strong>NA-042026 – Group A</strong> · AI-Powered SOC Platform for Threat Detection and Incident Response.
          This manual covers daily analyst workflows from log ingestion to incident closure.
        </p>
      </div>

      <div className="space-y-4">
        {sections.map(({ icon: Icon, title, content }) => (
          <div key={title} className="glass-card p-5">
            <h2 className="font-semibold flex items-center gap-2 mb-3">
              <Icon size={18} className="text-soc-accent2" /> {title}
            </h2>
            <ul className="space-y-2">
              {content.map((item, i) => (
                <li key={i} className="text-sm theme-muted flex gap-2">
                  <span className="text-soc-accent font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="glass-card p-5">
        <h2 className="font-semibold flex items-center gap-2 mb-3">
          <Settings size={18} /> Quick Reference
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {[
            ['Dashboard', '/dashboard', 'Real-time SOC overview'],
            ['Log Analysis', '/logs', 'Upload & search logs'],
            ['Alerts', '/alerts', 'Manage security alerts'],
            ['Incidents', '/incidents', 'Incident response workflow'],
            ['Reports', '/reports', 'Generate PDF reports'],
            ['Team', '/about', 'Team profiles & LinkedIn'],
          ].map(([name, path, desc]) => (
            <Link key={path} to={path} className="p-3 rounded-lg theme-hover block border" style={{ borderColor: 'var(--card-border)' }}>
              <p className="font-medium text-soc-accent">{name}</p>
              <p className="text-xs theme-muted mt-0.5">{desc}</p>
            </Link>
          ))}
        </div>
      </div>

      <p className="text-xs theme-muted text-center pb-4">
        For deployment and hosting instructions, see USER_MANUAL.md in the project root.
      </p>
    </div>
  );
}
