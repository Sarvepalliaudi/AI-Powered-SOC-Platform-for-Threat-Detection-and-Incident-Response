/**
 * Log parser for auth.log and Apache access.log formats
 */

function parseAuthLogLine(line) {
  const sshFailed = line.match(
    /(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}).*Failed password for (?:invalid user )?(\S+) from (\d+\.\d+\.\d+\.\d+) port (\d+)/
  );
  if (sshFailed) {
    return {
      timestamp: parseSyslogTimestamp(sshFailed[1]),
      parsed: {
        ip: sshFailed[3],
        user: sshFailed[2],
        action: 'failed_login',
        status: 'failed',
        port: parseInt(sshFailed[4], 10),
        protocol: 'ssh',
      },
      severity: 'medium',
      isSuspicious: true,
      tags: ['ssh', 'failed_login'],
    };
  }

  const sshAccepted = line.match(
    /(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}).*Accepted (?:password|publickey) for (\S+) from (\d+\.\d+\.\d+\.\d+) port (\d+)/
  );
  if (sshAccepted) {
    return {
      timestamp: parseSyslogTimestamp(sshAccepted[1]),
      parsed: {
        ip: sshAccepted[3],
        user: sshAccepted[2],
        action: 'successful_login',
        status: 'success',
        port: parseInt(sshAccepted[4], 10),
        protocol: 'ssh',
      },
      severity: 'info',
      isSuspicious: false,
      tags: ['ssh', 'login'],
    };
  }

  const invalidUser = line.match(
    /(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}).*Invalid user (\S+) from (\d+\.\d+\.\d+\.\d+)/
  );
  if (invalidUser) {
    return {
      timestamp: parseSyslogTimestamp(invalidUser[1]),
      parsed: {
        ip: invalidUser[3],
        user: invalidUser[2],
        action: 'invalid_user',
        status: 'failed',
        protocol: 'ssh',
      },
      severity: 'medium',
      isSuspicious: true,
      tags: ['ssh', 'invalid_user'],
    };
  }

  const sudoFail = line.match(
    /(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}).*sudo:.*authentication failure/
  );
  if (sudoFail) {
    return {
      timestamp: parseSyslogTimestamp(sudoFail[1]),
      parsed: { action: 'sudo_failure', status: 'failed' },
      severity: 'high',
      isSuspicious: true,
      tags: ['sudo', 'privilege_escalation'],
    };
  }

  const timestampMatch = line.match(/^(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})/);
  return {
    timestamp: timestampMatch ? parseSyslogTimestamp(timestampMatch[1]) : new Date(),
    parsed: { action: 'unknown', status: 'info' },
    severity: 'info',
    isSuspicious: false,
    tags: [],
  };
}

function parseApacheLogLine(line) {
  const combined = line.match(
    /^(\S+) \S+ \S+ \[([^\]]+)\] "(\S+) (\S+) (\S+)" (\d+) (\S+) "([^"]*)" "([^"]*)"/
  );
  if (combined) {
    const statusCode = parseInt(combined[6], 10);
    const isSuspicious =
      statusCode === 401 ||
      statusCode === 403 ||
      combined[4].includes('..') ||
      combined[4].includes('wp/code') ||
      combined[4].includes('wp-admin') ||
      combined[4].includes('.php') ||
      combined[4].includes('eval');

    let severity = 'info';
    if (statusCode >= 500) severity = 'medium';
    if (statusCode === 401 || statusCode === 403) severity = 'medium';
    if (isSuspicious && (combined[4].includes('..') || combined[4].includes('cmd'))) {
      severity = 'high';
    }

    return {
      timestamp: parseApacheTimestamp(combined[2]),
      parsed: {
        ip: combined[1],
        method: combined[3],
        url: combined[4],
        action: combined[3],
        status: String(statusCode),
        userAgent: combined[8],
      },
      severity,
      isSuspicious,
      tags: isSuspicious ? ['web_attack', 'suspicious_request'] : ['web_access'],
    };
  }

  return {
    timestamp: new Date(),
    parsed: { action: 'unknown', status: 'info' },
    severity: 'info',
    isSuspicious: false,
    tags: [],
  };
}

function parseSyslogTimestamp(ts) {
  const year = new Date().getFullYear();
  const date = new Date(`${ts} ${year}`);
  if (date > new Date()) date.setFullYear(year - 1);
  return date;
}

function parseApacheTimestamp(ts) {
  const months = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  const match = ts.match(/(\d{2})\/(\w{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2})/);
  if (match) {
    return new Date(
      parseInt(match[3]),
      months[match[2]],
      parseInt(match[1]),
      parseInt(match[4]),
      parseInt(match[5]),
      parseInt(match[6])
    );
  }
  return new Date();
}

function detectLogType(filename, content) {
  const lower = filename.toLowerCase();
  if (lower.includes('auth')) return 'auth';
  if (lower.includes('access')) return 'apache';
  if (content.includes('Failed password') || content.includes('sshd')) return 'auth';
  if (content.match(/"GET |"POST |"PUT |"DELETE /)) return 'apache';
  return 'other';
}

function parseLogFile(content, filename) {
  const logType = detectLogType(filename, content);
  const lines = content.split('\n').filter((l) => l.trim());
  const parser = logType === 'auth' ? parseAuthLogLine : parseApacheLogLine;

  return lines.map((line) => ({
    logType,
    sourceFile: filename,
    rawLine: line,
    ...parser(line),
  }));
}

module.exports = {
  parseAuthLogLine,
  parseApacheLogLine,
  parseLogFile,
  detectLogType,
};
