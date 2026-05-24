const express = require('express');
const Incident = require('../models/Incident');
const Alert = require('../models/Alert');
const Log = require('../models/Log');
const { protect } = require('../middleware/auth');
const { generateIncidentSummary } = require('../services/aiAnalysis');

const router = express.Router();

async function generateIncidentId() {
  const count = await Incident.countDocuments();
  const year = new Date().getFullYear();
  return `INC-${year}-${String(count + 1).padStart(4, '0')}`;
}

// GET /api/incidents
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, severity, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { incidentId: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [incidents, total] = await Promise.all([
      Incident.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email'),
      Incident.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: incidents,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/incidents
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, severity, relatedAlerts, sourceIps, affectedSystems } = req.body;
    const incidentId = await generateIncidentId();

    let alerts = [];
    if (relatedAlerts?.length) {
      alerts = await Alert.find({ _id: { $in: relatedAlerts } });
    }

    const logs = alerts.length
      ? await Log.find({ _id: { $in: alerts.flatMap((a) => a.relatedLogs) } })
      : [];

    const incidentData = {
      incidentId,
      title,
      description,
      severity: severity || 'medium',
      createdBy: req.user._id,
      relatedAlerts: relatedAlerts || [],
      sourceIps: sourceIps || [...new Set(alerts.map((a) => a.sourceIp).filter(Boolean))],
      affectedSystems: affectedSystems || [],
      mitreTactics: [...new Set(alerts.map((a) => a.mitreTactic).filter(Boolean))],
      mitreTechniques: [...new Set(alerts.map((a) => a.mitreTechnique).filter(Boolean))],
      timeline: [
        {
          action: 'Incident Created',
          description: `Incident ${incidentId} opened by ${req.user.name}`,
          performedBy: req.user._id,
          type: 'detection',
        },
      ],
    };

    incidentData.aiSummary = generateIncidentSummary(incidentData, alerts, logs);

    const incident = await Incident.create(incidentData);
    res.status(201).json({ success: true, data: incident });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/incidents/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('relatedAlerts')
      .populate('timeline.performedBy', 'name')
      .populate('analystComments.author', 'name');
    if (!incident) return res.status(404).json({ success: false, message: 'Incident not found' });
    res.json({ success: true, data: incident });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/incidents/:id
router.patch('/:id', protect, async (req, res) => {
  try {
    const allowed = [
      'title', 'description', 'severity', 'status', 'priority',
      'assignedTo', 'investigationNotes', 'containmentActions',
      'recoveryStatus', 'affectedSystems',
    ];
    const update = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    });

    if (req.body.status === 'closed') update.closedAt = new Date();

    const incident = await Incident.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!incident) return res.status(404).json({ success: false, message: 'Incident not found' });
    res.json({ success: true, data: incident });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/incidents/:id/timeline
router.post('/:id/timeline', protect, async (req, res) => {
  try {
    const { action, description, type } = req.body;
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          timeline: {
            action,
            description,
            type: type || 'comment',
            performedBy: req.user._id,
          },
        },
      },
      { new: true }
    );
    if (!incident) return res.status(404).json({ success: false, message: 'Incident not found' });
    res.json({ success: true, data: incident });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/incidents/:id/comments
router.post('/:id/comments', protect, async (req, res) => {
  try {
    const { comment } = req.body;
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      { $push: { analystComments: { comment, author: req.user._id } } },
      { new: true }
    ).populate('analystComments.author', 'name');
    if (!incident) return res.status(404).json({ success: false, message: 'Incident not found' });
    res.json({ success: true, data: incident });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/incidents/:id/evidence
router.post('/:id/evidence', protect, async (req, res) => {
  try {
    const { name, description, type } = req.body;
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      { $push: { evidence: { name, description, type, addedBy: req.user._id } } },
      { new: true }
    );
    if (!incident) return res.status(404).json({ success: false, message: 'Incident not found' });
    res.json({ success: true, data: incident });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
