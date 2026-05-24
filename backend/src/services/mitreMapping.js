/**
 * MITRE ATT&CK Framework mapping for detected threats
 */
const MITRE_MAP = {
  failed_ssh_login: {
    tactic: 'Credential Access',
    technique: 'Brute Force',
    techniqueId: 'T1110',
  },
  brute_force: {
    tactic: 'Credential Access',
    technique: 'Brute Force',
    techniqueId: 'T1110.001',
  },
  unauthorized_access: {
    tactic: 'Initial Access',
    technique: 'Valid Accounts',
    techniqueId: 'T1078',
  },
  suspicious_ip: {
    tactic: 'Command and Control',
    technique: 'Non-Standard Port',
    techniqueId: 'T1571',
  },
  malware_indicator: {
    tactic: 'Execution',
    technique: 'User Execution',
    techniqueId: 'T1204',
  },
  port_scan: {
    tactic: 'Discovery',
    technique: 'Network Service Discovery',
    techniqueId: 'T1046',
  },
  high_frequency: {
    tactic: 'Impact',
    technique: 'Network Denial of Service',
    techniqueId: 'T1498',
  },
  ai_anomaly: {
    tactic: 'Defense Evasion',
    technique: 'Masquerading',
    techniqueId: 'T1036',
  },
};

function mapToMitre(detectionType) {
  return MITRE_MAP[detectionType] || {
    tactic: 'Unknown',
    technique: 'Unclassified',
    techniqueId: 'T0000',
  };
}

function getAllTactics() {
  const tactics = new Set();
  Object.values(MITRE_MAP).forEach((m) => tactics.add(m.tactic));
  return Array.from(tactics);
}

function getTechniquesByTactic(tactic) {
  return Object.entries(MITRE_MAP)
    .filter(([, v]) => v.tactic === tactic)
    .map(([key, v]) => ({ detectionType: key, ...v }));
}

module.exports = { MITRE_MAP, mapToMitre, getAllTactics, getTechniquesByTactic };
