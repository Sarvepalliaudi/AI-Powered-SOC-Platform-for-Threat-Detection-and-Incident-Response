const express = require('express');
const path = require('path');
const fs = require('fs');
const Report = require('../models/Report');
const Incident = require('../models/Incident');
const Alert = require('../models/Alert');
const Log = require('../models/Log');
const { protect } = require('../middleware/auth');
const {
  generateIncidentReport,
  generateThreatReport,
  generateLogSummaryReport,
} = require('../services/reportGenerator');

const router = express.Router();

// GET /api/reports
router.get('/', protect, async (req, res) => {
  try {
    const reports = await Report.find()
      .sort({ createdAt: -1 })
      .populate('generatedBy', 'name email')
      .limit(50);
    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/reports/incident/:incidentId
router.post('/incident/:incidentId', protect, async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.incidentId).populate('relatedAlerts');
    if (!incident) return res.status(404).json({ success: false, message: 'Incident not found' });

    const alerts = await Alert.find({ _id: { $in: incident.relatedAlerts } });
    const { filename, filePath, reportData } = await generateIncidentReport(incident, alerts, req.user);

    const report = await Report.create({
      title: reportData.title,
      type: 'incident',
      generatedBy: req.user._id,
      relatedIncident: incident._id,
      summary: reportData.summary,
      content: reportData.content,
      filePath: filename,
      status: 'completed',
    });

    res.status(201).json({ success: true, data: report, downloadUrl: `/api/reports/download/${filename}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/reports/threat-analysis
router.post('/threat-analysis', protect, async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 }).limit(100);
    const stats = {
      total: alerts.length,
      critical: alerts.filter((a) => a.severity === 'critical').length,
      high: alerts.filter((a) => a.severity === 'high').length,
      medium: alerts.filter((a) => a.severity === 'medium').length,
      low: alerts.filter((a) => a.severity === 'low').length,
      dateRange: {
        start: alerts[alerts.length - 1]?.createdAt?.toISOString().split('T')[0] || 'N/A',
        end: alerts[0]?.createdAt?.toISOString().split('T')[0] || 'N/A',
      },
    };

    const { filename, filePath, reportData } = await generateThreatReport(
      alerts.map((a) => ({ title: a.title, severity: a.severity, sourceIp: a.sourceIp, mitreTechniqueId: a.mitreTechniqueId, mitreTactic: a.mitreTactic, mitreTechnique: a.mitreTechnique })),
      stats,
      req.user
    );

    const report = await Report.create({
      title: reportData.title,
      type: 'threat_analysis',
      generatedBy: req.user._id,
      summary: reportData.summary,
      content: reportData.content,
      filePath: filename,
      status: 'completed',
    });

    res.status(201).json({ success: true, data: report, downloadUrl: `/api/reports/download/${filename}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/reports/log-summary
router.post('/log-summary', protect, async (req, res) => {
  try {
    const logs = await Log.find().sort({ timestamp: -1 }).limit(500);
    const { filename, reportData } = await generateLogSummaryReport(logs, req.user);

    const report = await Report.create({
      title: reportData.title,
      type: 'log_summary',
      generatedBy: req.user._id,
      summary: reportData.summary,
      content: reportData.content,
      filePath: filename,
      status: 'completed',
    });

    res.status(201).json({ success: true, data: report, downloadUrl: `/api/reports/download/${filename}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/reports/download/:filename
router.get('/download/:filename', protect, (req, res) => {
  const filePath = path.join(__dirname, '../../reports', req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'Report file not found' });
  }
  res.download(filePath);
});

module.exports = router;
