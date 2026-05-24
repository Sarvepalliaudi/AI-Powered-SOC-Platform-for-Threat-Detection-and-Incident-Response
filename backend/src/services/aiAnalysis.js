/**
 * AI-powered threat analysis simulation engine
 * Provides anomaly scoring, confidence levels, and incident summaries
 */

function calculateAnomalyScore(events) {
  if (!events || events.length === 0) return { score: 0, confidence: 0, factors: [] };

  const factors = [];
  let score = 0;

  const failedLogins = events.filter((e) => e.parsed?.action === 'failed_login').length;
  if (failedLogins > 0) {
    const factor = Math.min(failedLogins * 8, 40);
    score += factor;
    factors.push({ name: 'Failed login attempts', weight: factor, count: failedLogins });
  }

  const uniqueIPs = new Set(events.map((e) => e.parsed?.ip).filter(Boolean)).size;
  if (uniqueIPs > 5) {
    const factor = Math.min(uniqueIPs * 3, 25);
    score += factor;
    factors.push({ name: 'Multiple source IPs', weight: factor, count: uniqueIPs });
  }

  const highSeverity = events.filter((e) => ['high', 'critical'].includes(e.severity)).length;
  if (highSeverity > 0) {
    const factor = Math.min(highSeverity * 10, 30);
    score += factor;
    factors.push({ name: 'High severity events', weight: factor, count: highSeverity });
  }

  const portScans = events.filter((e) => e.tags?.includes('port_scan')).length;
  if (portScans > 0) {
    score += 20;
    factors.push({ name: 'Port scan indicators', weight: 20, count: portScans });
  }

  const malwareIndicators = events.filter((e) => e.tags?.includes('malware')).length;
  if (malwareIndicators > 0) {
    score += 25;
    factors.push({ name: 'Malware indicators', weight: 25, count: malwareIndicators });
  }

  score = Math.min(score, 100);
  const confidence = Math.min(50 + factors.length * 10 + (events.length > 10 ? 15 : 0), 98);

  return { score, confidence, factors, riskLevel: getRiskLevel(score) };
}

function getRiskLevel(score) {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  if (score >= 20) return 'low';
  return 'info';
}

function generateIncidentSummary(incident, alerts, logs) {
  const alertCount = alerts?.length || 0;
  const logCount = logs?.length || 0;
  const ips = [...new Set(alerts?.map((a) => a.sourceIp).filter(Boolean))];
  const techniques = [...new Set(alerts?.map((a) => a.mitreTechnique).filter(Boolean))];

  return (
    `AI Analysis Summary for Incident ${incident.incidentId}:\n\n` +
    `Severity: ${incident.severity.toUpperCase()} | Status: ${incident.status}\n\n` +
    `This incident "${incident.title}" involves ${alertCount} correlated security alert(s) ` +
    `and ${logCount} related log entries. ` +
    (ips.length > 0
      ? `Primary threat actors identified from IP address(es): ${ips.slice(0, 5).join(', ')}${ips.length > 5 ? ` and ${ips.length - 5} more` : ''}. `
      : '') +
    (techniques.length > 0
      ? `MITRE ATT&CK techniques observed: ${techniques.join(', ')}. `
      : '') +
    `\n\nRecommended Actions:\n` +
    `1. Block suspicious source IP addresses at the firewall level\n` +
    `2. Review authentication logs for compromised accounts\n` +
    `3. Implement rate limiting on SSH and web services\n` +
    `4. Escalate to senior analyst if containment is not achieved within SLA\n` +
    `5. Document all findings in the incident timeline for compliance\n\n` +
    `AI Confidence: ${calculateAnomalyScore(logs || []).confidence}% | ` +
    `Threat Score: ${calculateAnomalyScore(logs || []).score}/100`
  );
}

function scoreSuspiciousActivity(ipEvents) {
  const hourlyRate = ipEvents.length;
  const failedRate =
    ipEvents.filter((e) => e.parsed?.status === 'failed').length / Math.max(ipEvents.length, 1);
  const uniqueUsers = new Set(ipEvents.map((e) => e.parsed?.user).filter(Boolean)).size;

  let score = 0;
  if (hourlyRate > 50) score += 30;
  else if (hourlyRate > 20) score += 20;
  else if (hourlyRate > 10) score += 10;

  if (failedRate > 0.8) score += 35;
  else if (failedRate > 0.5) score += 20;

  if (uniqueUsers > 5) score += 25;

  return {
    score: Math.min(score, 100),
    confidence: Math.min(60 + Math.floor(failedRate * 30), 95),
    indicators: {
      requestRate: hourlyRate,
      failureRate: Math.round(failedRate * 100),
      targetedUsers: uniqueUsers,
    },
  };
}

function detectAnomalies(logs) {
  const anomalies = [];
  const ipGroups = {};

  logs.forEach((log) => {
    const ip = log.parsed?.ip;
    if (!ip) return;
    if (!ipGroups[ip]) ipGroups[ip] = [];
    ipGroups[ip].push(log);
  });

  Object.entries(ipGroups).forEach(([ip, events]) => {
    const scoring = scoreSuspiciousActivity(events);
    if (scoring.score >= 40) {
      anomalies.push({
        ip,
        score: scoring.score,
        confidence: scoring.confidence,
        eventCount: events.length,
        indicators: scoring.indicators,
        type: scoring.score >= 70 ? 'brute_force' : 'suspicious_ip',
      });
    }
  });

  return anomalies.sort((a, b) => b.score - a.score);
}

module.exports = {
  calculateAnomalyScore,
  getRiskLevel,
  generateIncidentSummary,
  scoreSuspiciousActivity,
  detectAnomalies,
};
