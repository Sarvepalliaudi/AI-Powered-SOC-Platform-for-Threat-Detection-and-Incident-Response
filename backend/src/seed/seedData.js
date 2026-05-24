require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Log = require('../models/Log');
const Alert = require('../models/Alert');
const Incident = require('../models/Incident');
const { parseLogFile } = require('../services/logParser');
const { runDetectionEngine } = require('../services/threatDetection');
const { generateIncidentSummary } = require('../services/aiAnalysis');
const fs = require('fs');
const path = require('path');

async function seed() {
  await connectDB();

  console.log('Clearing existing data...');
  await Promise.all([User.deleteMany({}), Log.deleteMany({}), Alert.deleteMany({}), Incident.deleteMany({})]);

  console.log('Creating users...');
  const users = await User.create([
    {
      name: 'Sarvepalli Audi Siva BhanuVardhan',
      email: 'bhanu@soc.local',
      password: 'soc123',
      role: 'lead_analyst',
    },
    {
      name: 'Rishabh Sankhla',
      email: 'rishabh@soc.local',
      password: 'soc123',
      role: 'analyst',
    },
    {
      name: 'Kommi Moulika Naidu',
      email: 'moulika@soc.local',
      password: 'soc123',
      role: 'analyst',
    },
    {
      name: 'SOC Admin',
      email: 'admin@soc.local',
      password: 'admin123',
      role: 'admin',
    },
  ]);

  console.log('Loading sample logs...');
  const sampleDir = path.join(__dirname, '../../sample-logs');
  let allLogs = [];

  if (fs.existsSync(sampleDir)) {
    const files = fs.readdirSync(sampleDir).filter((f) => f.endsWith('.log') || f.endsWith('.txt'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(sampleDir, file), 'utf-8');
      const parsed = parseLogFile(content, file);
      allLogs.push(
        ...parsed.map((log) => ({
          ...log,
          uploadedBy: users[0]._id,
          batchId: 'seed-batch-001',
        }))
      );
    }
  }

  if (allLogs.length === 0) {
    console.log('No sample log files found, generating inline sample data...');
    const authContent = fs.readFileSync(path.join(__dirname, 'sampleData/auth.log'), 'utf-8');
    const apacheContent = fs.readFileSync(path.join(__dirname, 'sampleData/access.log'), 'utf-8');
    allLogs = [
      ...parseLogFile(authContent, 'auth.log').map((l) => ({ ...l, uploadedBy: users[0]._id, batchId: 'seed-001' })),
      ...parseLogFile(apacheContent, 'access.log').map((l) => ({ ...l, uploadedBy: users[0]._id, batchId: 'seed-002' })),
    ];
  }

  const savedLogs = await Log.insertMany(allLogs);
  console.log(`Inserted ${savedLogs.length} logs`);

  console.log('Running threat detection...');
  const alertData = runDetectionEngine(savedLogs);
  const savedAlerts = await Alert.insertMany(
    alertData.map((a) => ({
      ...a,
      relatedLogs: a.relatedLogIds || [],
    }))
  );
  console.log(`Created ${savedAlerts.length} alerts`);

  console.log('Creating sample incidents...');
  if (savedAlerts.length > 0) {
    const incident1Alerts = savedAlerts.slice(0, Math.min(3, savedAlerts.length));
    const incidentData = {
      incidentId: 'INC-2026-0001',
      title: 'SSH Brute Force Campaign Detected',
      description: 'Multiple coordinated SSH brute force attempts detected from external IP addresses targeting production servers.',
      severity: 'high',
      status: 'investigating',
      createdBy: users[0]._id,
      assignedTo: users[0]._id,
      relatedAlerts: incident1Alerts.map((a) => a._id),
      sourceIps: [...new Set(incident1Alerts.map((a) => a.sourceIp).filter(Boolean))],
      affectedSystems: ['prod-web-01', 'prod-ssh-gateway'],
      mitreTactics: [...new Set(incident1Alerts.map((a) => a.mitreTactic).filter(Boolean))],
      mitreTechniques: [...new Set(incident1Alerts.map((a) => a.mitreTechnique).filter(Boolean))],
      timeline: [
        {
          action: 'Incident Created',
          description: 'Automated detection triggered incident creation',
          performedBy: users[0]._id,
          type: 'detection',
        },
        {
          action: 'Investigation Started',
          description: 'Lead analyst assigned and investigation initiated',
          performedBy: users[0]._id,
          type: 'investigation',
        },
      ],
      containmentActions: ['Block source IPs at firewall', 'Enable fail2ban on SSH gateway'],
      recoveryStatus: 'in_progress',
      analystComments: [
        { comment: 'Confirmed brute force pattern. Escalating to network team.', author: users[0]._id },
      ],
    };
    incidentData.aiSummary = generateIncidentSummary(incidentData, incident1Alerts, savedLogs.slice(0, 50));
    await Incident.create(incidentData);
  }

  console.log('\n=== Seed Complete ===');
  console.log('Demo Accounts:');
  console.log('  Lead Analyst: bhanu@soc.local / soc123');
  console.log('  Analyst:      rishabh@soc.local / soc123');
  console.log('  Analyst:      moulika@soc.local / soc123');
  console.log('  Admin:        admin@soc.local / admin123');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
