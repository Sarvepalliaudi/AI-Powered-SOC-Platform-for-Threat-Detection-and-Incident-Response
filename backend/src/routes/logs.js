const express = require('express');
const Log = require('../models/Log');
const Alert = require('../models/Alert');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { parseLogFile } = require('../services/logParser');
const { runDetectionEngine } = require('../services/threatDetection');

const router = express.Router();

function generateBatchId() {
  return `batch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// POST /api/logs/upload
router.post('/upload', protect, upload.single('logFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const content = req.file.buffer.toString('utf-8');
    const filename = req.file.originalname;
    const batchId = generateBatchId();
    const parsedLogs = parseLogFile(content, filename);

    const logDocs = parsedLogs.map((log) => ({
      ...log,
      uploadedBy: req.user._id,
      batchId,
    }));

    const savedLogs = await Log.insertMany(logDocs);

    const detectionAlerts = runDetectionEngine(savedLogs);
    const createdAlerts = [];

    for (const alertData of detectionAlerts) {
      const alert = await Alert.create({
        ...alertData,
        relatedLogs: alertData.relatedLogIds || [],
      });
      createdAlerts.push(alert);

      if (req.app.get('io')) {
        req.app.get('io').emit('new-alert', alert);
      }
    }

    res.status(201).json({
      success: true,
      message: `Processed ${savedLogs.length} log entries, generated ${createdAlerts.length} alerts`,
      data: {
        batchId,
        logsProcessed: savedLogs.length,
        alertsGenerated: createdAlerts.length,
        alerts: createdAlerts,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/logs
router.get('/', protect, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search,
      logType,
      severity,
      isSuspicious,
      startDate,
      endDate,
      ip,
    } = req.query;

    const filter = {};
    if (logType) filter.logType = logType;
    if (severity) filter.severity = severity;
    if (isSuspicious === 'true') filter.isSuspicious = true;
    if (ip) filter['parsed.ip'] = ip;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    if (search) {
      filter.$or = [
        { rawLine: { $regex: search, $options: 'i' } },
        { 'parsed.ip': { $regex: search, $options: 'i' } },
        { 'parsed.user': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      Log.find(filter).sort({ timestamp: -1 }).skip(skip).limit(parseInt(limit)),
      Log.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/logs/stats
router.get('/stats', protect, async (req, res) => {
  try {
    const [total, suspicious, byType, bySeverity] = await Promise.all([
      Log.countDocuments(),
      Log.countDocuments({ isSuspicious: true }),
      Log.aggregate([{ $group: { _id: '$logType', count: { $sum: 1 } } }]),
      Log.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }]),
    ]);

    res.json({
      success: true,
      data: { total, suspicious, byType, bySeverity },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/logs/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    await Log.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Log deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
