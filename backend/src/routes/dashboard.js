const express = require('express');
const Alert = require('../models/Alert');
const Log = require('../models/Log');
const Incident = require('../models/Incident');
const { protect } = require('../middleware/auth');
const { getAllTactics, getTechniquesByTactic, MITRE_MAP } = require('../services/mitreMapping');
const { calculateAnomalyScore, detectAnomalies } = require('../services/aiAnalysis');

const router = express.Router();

// GET /api/dashboard/overview
router.get('/overview', protect, async (req, res) => {
  try {
    const [
      totalLogs,
      suspiciousLogs,
      totalAlerts,
      openIncidents,
      alertsBySeverity,
      recentAlerts,
      topAttackers,
      authFailures,
    ] = await Promise.all([
      Log.countDocuments(),
      Log.countDocuments({ isSuspicious: true }),
      Alert.countDocuments(),
      Incident.countDocuments({ status: { $nin: ['closed', 'recovered'] } }),
      Alert.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }]),
      Alert.find().sort({ createdAt: -1 }).limit(10),
      Alert.aggregate([
        { $match: { sourceIp: { $exists: true, $ne: null } } },
        { $group: { _id: '$sourceIp', count: { $sum: 1 }, maxSeverity: { $max: '$severity' } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      Log.aggregate([
        { $match: { 'parsed.action': { $in: ['failed_login', 'invalid_user'] } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d %H:00', date: '$timestamp' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 24 },
      ]),
    ]);

    const severityMap = { critical: 0, high: 0, medium: 0, low: 0 };
    alertsBySeverity.forEach((s) => {
      if (severityMap[s._id] !== undefined) severityMap[s._id] = s.count;
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalLogs,
          suspiciousLogs,
          totalAlerts,
          openIncidents,
          criticalAlerts: severityMap.critical,
          highAlerts: severityMap.high,
        },
        severityDistribution: severityMap,
        recentAlerts,
        topAttackers: topAttackers.map((a) => ({
          ip: a._id,
          count: a.count,
          severity: a.maxSeverity,
        })),
        authFailureTimeline: authFailures.map((a) => ({ time: a._id, count: a.count })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/dashboard/attack-timeline
router.get('/attack-timeline', protect, async (req, res) => {
  try {
    const timeline = await Alert.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          critical: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } },
          high: { $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]);

    res.json({
      success: true,
      data: timeline.map((t) => ({
        date: t._id,
        total: t.count,
        critical: t.critical,
        high: t.high,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/dashboard/traffic
router.get('/traffic', protect, async (req, res) => {
  try {
    const traffic = await Log.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%H:00', date: '$timestamp' } },
          requests: { $sum: 1 },
          suspicious: { $sum: { $cond: ['$isSuspicious', 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ success: true, data: traffic.map((t) => ({ hour: t._id, requests: t.requests, suspicious: t.suspicious })) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/dashboard/mitre
router.get('/mitre', protect, async (req, res) => {
  try {
    const mitreStats = await Alert.aggregate([
      { $match: { mitreTactic: { $exists: true } } },
      {
        $group: {
          _id: { tactic: '$mitreTactic', technique: '$mitreTechnique', id: '$mitreTechniqueId' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: {
        mapping: MITRE_MAP,
        detected: mitreStats.map((m) => ({
          tactic: m._id.tactic,
          technique: m._id.technique,
          techniqueId: m._id.id,
          count: m.count,
        })),
        tactics: getAllTactics(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/dashboard/ai-analysis
router.get('/ai-analysis', protect, async (req, res) => {
  try {
    const recentLogs = await Log.find().sort({ timestamp: -1 }).limit(200);
    const score = calculateAnomalyScore(recentLogs);
    const anomalies = detectAnomalies(recentLogs);

    res.json({
      success: true,
      data: { score, anomalies: anomalies.slice(0, 10) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/dashboard/geo-attacks (simulated geo data)
router.get('/geo-attacks', protect, async (req, res) => {
  try {
    const topIPs = await Alert.aggregate([
      { $match: { sourceIp: { $exists: true } } },
      { $group: { _id: '$sourceIp', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]);

    const geoLocations = [
      { country: 'Russia', lat: 55.7558, lng: 37.6173, code: 'RU' },
      { country: 'China', lat: 39.9042, lng: 116.4074, code: 'CN' },
      { country: 'USA', lat: 37.7749, lng: -122.4194, code: 'US' },
      { country: 'Brazil', lat: -23.5505, lng: -46.6333, code: 'BR' },
      { country: 'Germany', lat: 52.52, lng: 13.405, code: 'DE' },
      { country: 'India', lat: 28.6139, lng: 77.209, code: 'IN' },
      { country: 'Nigeria', lat: 6.5244, lng: 3.3792, code: 'NG' },
      { country: 'Iran', lat: 35.6892, lng: 51.389, code: 'IR' },
      { country: 'North Korea', lat: 39.0392, lng: 125.7625, code: 'KP' },
      { country: 'Ukraine', lat: 50.4501, lng: 30.5234, code: 'UA' },
    ];

    const geoData = topIPs.map((ip, i) => ({
      ip: ip._id,
      count: ip.count,
      ...geoLocations[i % geoLocations.length],
    }));

    res.json({ success: true, data: geoData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
