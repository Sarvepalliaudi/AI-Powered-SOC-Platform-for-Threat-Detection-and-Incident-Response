export const SEVERITY_COLORS = {
  critical: 'severity-critical',
  high: 'severity-high',
  medium: 'severity-medium',
  low: 'severity-low',
  info: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString();
}

export function formatRelative(date) {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export const DETECTION_LABELS = {
  failed_ssh_login: 'SSH Brute Force',
  brute_force: 'Credential Brute Force',
  unauthorized_access: 'Unauthorized Access',
  suspicious_ip: 'Suspicious IP',
  malware_indicator: 'Malware Indicator',
  port_scan: 'Port Scan',
  high_frequency: 'High Frequency',
  ai_anomaly: 'AI Anomaly',
};
