const express = require('express');
const Alert = require('../models/Alert');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/alerts
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, severity, status, detectionType, search } = req.query;
    const filter = {};
    if (severity) filter.severity = severity;
    if (status) filter.status = status;
    if (detectionType) filter.detectionType = detectionType;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { sourceIp: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [alerts, total] = await Promise.all([
      Alert.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('assignedTo', 'name email')
        .populate('acknowledgedBy', 'name'),
      Alert.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: alerts,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/alerts/stats
router.get('/stats', protect, async (req, res) => {
  try {
    const [total, bySeverity, byStatus, byType, recent] = await Promise.all([
      Alert.countDocuments(),
      Alert.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }]),
      Alert.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Alert.aggregate([{ $group: { _id: '$detectionType', count: { $sum: 1 } } }]),
      Alert.find().sort({ createdAt: -1 }).limit(5),
    ]);

    res.json({
      success: true,
      data: { total, bySeverity, byStatus, byType, recent },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/alerts/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate('relatedLogs')
      .populate('assignedTo', 'name email')
      .populate('acknowledgedBy', 'name');
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    res.json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/alerts/:id
router.patch('/:id', protect, async (req, res) => {
  try {
    const { status, assignedTo, severity } = req.body;
    const update = {};
    if (status) update.status = status;
    if (assignedTo) update.assignedTo = assignedTo;
    if (severity) update.severity = severity;
    if (status === 'investigating') {
      update.acknowledgedBy = req.user._id;
      update.acknowledgedAt = new Date();
    }

    const alert = await Alert.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });

    if (req.app.get('io')) {
      req.app.get('io').emit('alert-updated', alert);
    }

    res.json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/alerts/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Alert deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
