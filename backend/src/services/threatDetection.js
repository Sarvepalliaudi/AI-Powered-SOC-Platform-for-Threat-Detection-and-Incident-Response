/**
 * Threat Detection Engine
 * Implements detection rules for SSH brute-force, port scans, malware indicators, etc.
 */

const { mapToMitre } = require('./mitreMapping');
const { detectAnomalies, scoreSuspiciousActivity } = require('./aiAnalysis');

const THRESHOLDS = {
  SSH_BRUTE_FORCE: 5,
  FAILED_LOGIN_WINDOW: 10,
  HIGH_FREQUENCY_REQUESTS: 100,
  PORT_SCAN_UNIQUE_PORTS: 10,
  REPEATED_IP_ALERT: 3,
};

function groupByIp(logs) {
  const groups = {};
  logs.forEach((log) => {
    const ip = log.parsed?.ip;
    if (!ip) return;
    if (!groups[ip]) groups[ip] = [];
    groups[ip].push(log);
  });
  return groups;
}

function detectFailedSSH(logs) {
  const alerts = [];
  const ipGroups = groupByIp(logs.filter((l) => l.parsed?.protocol === 'ssh'));

  Object.entries(ipGroups).forEach(([ip, events]) => {
    const failed = events.filter(
      (e) => e.parsed?.action === 'failed_login' || e.parsed?.action === 'invalid_user'
    );
    if (failed.length >= THRESHOLDS.SSH_BRUTE_FORCE) {
      const mitre = mapToMitre('failed_ssh_login');
      const scoring = scoreSuspiciousActivity(events);
      alerts.push({
        title: `SSH Brute Force Detected from ${ip}`,
        description: `${failed.length} failed SSH login attempts detected from IP ${ip} targeting multiple accounts.`,
        severity: failed.length >= 15 ? 'critical' : failed.length >= 10 ? 'high' : 'medium',
        detectionType: 'failed_ssh_login',
        sourceIp: ip,
        targetResource: 'SSH Server',
        eventCount: failed.length,
        confidence: scoring.confidence,
        aiScore: scoring.score,
        mitreTactic: mitre.tactic,
        mitreTechnique: mitre.technique,
        mitreTechniqueId: mitre.techniqueId,
        relatedLogIds: failed.map((e) => e._id),
      });
    }
  });

  return alerts;
}

function detectBruteForce(logs) {
  const alerts = [];
  const ipGroups = groupByIp(logs);

  Object.entries(ipGroups).forEach(([ip, events]) => {
    const failed = events.filter((e) => e.parsed?.status === 'failed');
    const uniqueUsers = new Set(failed.map((e) => e.parsed?.user).filter(Boolean));

    if (failed.length >= THRESHOLDS.FAILED_LOGIN_WINDOW && uniqueUsers.size >= 3) {
      const mitre = mapToMitre('brute_force');
      const scoring = scoreSuspiciousActivity(events);
      alerts.push({
        title: `Credential Brute Force Attack from ${ip}`,
        description: `IP ${ip} attempted ${failed.length} failed logins across ${uniqueUsers.size} different accounts.`,
        severity: 'high',
        detectionType: 'brute_force',
        sourceIp: ip,
        targetResource: 'Authentication System',
        eventCount: failed.length,
        confidence: scoring.confidence,
        aiScore: scoring.score,
        mitreTactic: mitre.tactic,
        mitreTechnique: mitre.technique,
        mitreTechniqueId: mitre.techniqueId,
        relatedLogIds: failed.map((e) => e._id),
      });
    }
  });

  return alerts;
}

function detectUnauthorizedAccess(logs) {
  const alerts = [];
  const suspicious = logs.filter(
    (l) =>
      l.parsed?.action === 'invalid_user' ||
      (l.parsed?.status === '403') ||
      (l.parsed?.status === '401')
  );

  const ipGroups = groupByIp(suspicious);
  Object.entries(ipGroups).forEach(([ip, events]) => {
    if (events.length >= THRESHOLDS.REPEATED_IP_ALERT) {
      const mitre = mapToMitre('unauthorized_access');
      alerts.push({
        title: `Unauthorized Access Attempts from ${ip}`,
        description: `${events.length} unauthorized access attempts detected from ${ip}.`,
        severity: events.length >= 10 ? 'high' : 'medium',
        detectionType: 'unauthorized_access',
        sourceIp: ip,
        targetResource: 'Web/Auth Services',
        eventCount: events.length,
        confidence: 75,
        aiScore: Math.min(events.length * 8, 85),
        mitreTactic: mitre.tactic,
        mitreTechnique: mitre.technique,
        mitreTechniqueId: mitre.techniqueId,
        relatedLogIds: events.map((e) => e._id),
      });
    }
  });

  return alerts;
}

function detectMalwareIndicators(logs) {
  const malwarePatterns = [
    /eval\s*\(/i,
    /base64_decode/i,
    /shell_exec/i,
    /\/etc\/passwd/i,
    /cmd\.exe/i,
    /powershell/i,
    /\.php\?/i,
    /union\s+select/i,
  ];

  const alerts = [];
  const matched = logs.filter((l) =>
    malwarePatterns.some((p) => p.test(l.rawLine) || p.test(l.parsed?.url || ''))
  );

  if (matched.length > 0) {
    const ipGroups = groupByIp(matched);
    Object.entries(ipGroups).forEach(([ip, events]) => {
      const mitre = mapToMitre('malware_indicator');
      alerts.push({
        title: `Malware/Exploit Indicator from ${ip}`,
        description: `Suspicious payload patterns detected in ${events.length} request(s) from ${ip}.`,
        severity: 'critical',
        detectionType: 'malware_indicator',
        sourceIp: ip,
        targetResource: 'Web Application',
        eventCount: events.length,
        confidence: 88,
        aiScore: 92,
        mitreTactic: mitre.tactic,
        mitreTechnique: mitre.technique,
        mitreTechniqueId: mitre.techniqueId,
        relatedLogIds: events.map((e) => e._id),
      });
    });
  }

  return alerts;
}

function detectPortScanning(logs) {
  const alerts = [];
  const ipPortMap = {};

  logs.forEach((log) => {
    const ip = log.parsed?.ip;
    const port = log.parsed?.port;
    if (!ip) return;
    if (!ipPortMap[ip]) ipPortMap[ip] = new Set();
    if (port) ipPortMap[ip].add(port);
    if (log.parsed?.url) {
      const portMatch = log.parsed.url.match(/:(\d+)/);
      if (portMatch) ipPortMap[ip].add(parseInt(portMatch[1], 10));
    }
  });

  Object.entries(ipPortMap).forEach(([ip, ports]) => {
    if (ports.size >= THRESHOLDS.PORT_SCAN_UNIQUE_PORTS) {
      const mitre = mapToMitre('port_scan');
      alerts.push({
        title: `Port Scan Activity from ${ip}`,
        description: `IP ${ip} probed ${ports.size} different ports/services indicating reconnaissance activity.`,
        severity: 'high',
        detectionType: 'port_scan',
        sourceIp: ip,
        targetResource: 'Network Infrastructure',
        eventCount: ports.size,
        confidence: 82,
        aiScore: 78,
        mitreTactic: mitre.tactic,
        mitreTechnique: mitre.technique,
        mitreTechniqueId: mitre.techniqueId,
        relatedLogIds: [],
      });
    }
  });

  return alerts;
}

function detectHighFrequency(logs) {
  const alerts = [];
  const ipGroups = groupByIp(logs);

  Object.entries(ipGroups).forEach(([ip, events]) => {
    if (events.length >= THRESHOLDS.HIGH_FREQUENCY_REQUESTS) {
      const mitre = mapToMitre('high_frequency');
      alerts.push({
        title: `High-Frequency Traffic from ${ip}`,
        description: `IP ${ip} generated ${events.length} requests exceeding normal baseline thresholds.`,
        severity: events.length >= 200 ? 'critical' : 'high',
        detectionType: 'high_frequency',
        sourceIp: ip,
        targetResource: 'Web Server',
        eventCount: events.length,
        confidence: 70,
        aiScore: Math.min(Math.floor(events.length / 5), 90),
        mitreTactic: mitre.tactic,
        mitreTechnique: mitre.technique,
        mitreTechniqueId: mitre.techniqueId,
        relatedLogIds: events.slice(0, 50).map((e) => e._id),
      });
    }
  });

  return alerts;
}

function detectAIAnomalies(logs) {
  const alerts = [];
  const anomalies = detectAnomalies(logs);

  anomalies.forEach((anomaly) => {
    if (anomaly.score >= 50 && !alerts.some((a) => a.sourceIp === anomaly.ip)) {
      const mitre = mapToMitre('ai_anomaly');
      alerts.push({
        title: `AI Anomaly Detected: Suspicious Activity from ${anomaly.ip}`,
        description: `AI engine detected anomalous behavior pattern (score: ${anomaly.score}/100) with ${anomaly.eventCount} correlated events.`,
        severity: anomaly.score >= 80 ? 'critical' : anomaly.score >= 60 ? 'high' : 'medium',
        detectionType: 'ai_anomaly',
        sourceIp: anomaly.ip,
        targetResource: 'Multiple Systems',
        eventCount: anomaly.eventCount,
        confidence: anomaly.confidence,
        aiScore: anomaly.score,
        mitreTactic: mitre.tactic,
        mitreTechnique: mitre.technique,
        mitreTechniqueId: mitre.techniqueId,
        relatedLogIds: [],
        metadata: anomaly.indicators,
      });
    }
  });

  return alerts;
}

function runDetectionEngine(logs) {
  const allAlerts = [
    ...detectFailedSSH(logs),
    ...detectBruteForce(logs),
    ...detectUnauthorizedAccess(logs),
    ...detectMalwareIndicators(logs),
    ...detectPortScanning(logs),
    ...detectHighFrequency(logs),
    ...detectAIAnomalies(logs),
  ];

  const seen = new Set();
  return allAlerts.filter((alert) => {
    const key = `${alert.detectionType}-${alert.sourceIp}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function classifySeverity(eventCount, type) {
  if (type === 'malware_indicator') return 'critical';
  if (eventCount >= 20) return 'critical';
  if (eventCount >= 10) return 'high';
  if (eventCount >= 5) return 'medium';
  return 'low';
}

module.exports = {
  runDetectionEngine,
  classifySeverity,
  THRESHOLDS,
  detectFailedSSH,
  detectBruteForce,
  detectUnauthorizedAccess,
  detectMalwareIndicators,
  detectPortScanning,
  detectHighFrequency,
  detectAIAnomalies,
};
