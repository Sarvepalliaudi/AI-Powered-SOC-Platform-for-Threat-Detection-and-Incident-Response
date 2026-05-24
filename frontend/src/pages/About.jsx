import { Shield, Users, Target, Brain, Database, Server, Linkedin, ExternalLink, Mail } from 'lucide-react';

const team = [
  {
    name: 'Sarvepalli Audi Siva BhanuVardhan',
    role: 'SOC Lead Analyst & Detection Engineer',
    email: 'bhanu@soc.local',
    linkedin: 'https://www.linkedin.com/in/audi-siva-bhanuvardhan-sarvepalli-4598a8289/',
    initials: 'SB',
  },
  {
    name: 'Rishabh Sankhla',
    role: 'Backend & Log Processing Engineer',
    email: 'rishabh@soc.local',
    linkedin: 'https://www.linkedin.com/in/rishabhsankhla771401/',
    initials: 'RS',
  },
  {
    name: 'Kommi Moulika Naidu',
    role: 'UI/UX Designer & Documentation Analyst',
    email: 'moulika@soc.local',
    linkedin: 'https://www.linkedin.com/in/moulika-naidu-8b395a311/',
    initials: 'MN',
  },
];

const features = [
  { icon: Shield, title: 'Threat Detection', desc: 'SSH brute-force, port scans, malware indicators' },
  { icon: Brain, title: 'AI Analysis', desc: 'Anomaly scoring, confidence levels, incident summaries' },
  { icon: Target, title: 'MITRE ATT&CK', desc: 'Attack tactic & technique mapping' },
  { icon: Database, title: 'Log Management', desc: 'auth.log & Apache access.log parsing' },
  { icon: Server, title: 'Real-time Monitoring', desc: 'WebSocket alerts & live dashboard' },
];

export default function About() {
  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <div className="inline-flex p-4 rounded-2xl bg-soc-accent/10 border border-soc-accent/30 mb-4">
          <Shield className="text-soc-accent" size={48} />
        </div>
        <h1 className="text-3xl font-display font-bold neon-text">AI-Powered SOC Platform</h1>
        <p className="theme-muted mt-2">Threat Detection and Incident Response</p>
        <p className="text-sm font-mono text-soc-accent2 mt-3">NA-042026 – Group A</p>
        <p className="text-xs theme-muted mt-2 max-w-xl mx-auto">
          Enterprise-grade Security Operations Center simulation for cybersecurity internship evaluation and portfolio demonstration.
        </p>
      </div>

      <div className="glass-card p-6">
        <h2 className="font-display font-semibold flex items-center gap-2 mb-6">
          <Users size={20} className="text-soc-accent" /> Our Team
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {team.map((member) => (
            <div key={member.email} className="glass-card-hover p-5 flex flex-col">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-soc-accent/20 border border-soc-accent/40 flex items-center justify-center flex-shrink-0">
                  <span className="font-display text-soc-accent font-bold text-lg">{member.initials}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-tight">{member.name}</p>
                  <p className="text-xs text-soc-accent mt-1">{member.role}</p>
                </div>
              </div>
              <div className="mt-auto space-y-2 pt-3 border-t" style={{ borderColor: 'var(--card-border)' }}>
                <a href={`mailto:${member.email}`} className="flex items-center gap-2 text-xs theme-muted hover:text-soc-accent transition-colors">
                  <Mail size={13} /> {member.email}
                </a>
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-medium text-[#0A66C2] hover:underline"
                >
                  <Linkedin size={14} /> View LinkedIn Profile <ExternalLink size={11} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="font-display font-semibold mb-4">Platform Capabilities</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-4 rounded-lg theme-hover" style={{ background: 'var(--hover-bg)' }}>
              <Icon className="text-soc-accent2 mb-2" size={22} />
              <p className="font-medium text-sm">{title}</p>
              <p className="text-xs theme-muted mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-6 text-center text-sm theme-muted">
        <p className="font-medium">Tech Stack</p>
        <p className="mt-2">React.js · Tailwind CSS · Recharts · Node.js · Express.js · MongoDB Atlas · JWT · Socket.io</p>
        <p className="mt-3 text-xs">Cybersecurity Internship Major Project · 2026</p>
      </div>
    </div>
  );
}
