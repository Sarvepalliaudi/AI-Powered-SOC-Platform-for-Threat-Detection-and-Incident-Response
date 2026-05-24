const mongoose = require('mongoose');

const timelineEntrySchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  action: { type: String, required: true },
  description: String,
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: {
    type: String,
    enum: ['detection', 'investigation', 'containment', 'recovery', 'comment', 'evidence'],
    default: 'comment',
  },
});

const incidentSchema = new mongoose.Schema(
  {
    incidentId: { type: String, unique: true, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'investigating', 'contained', 'eradicated', 'recovered', 'closed'],
      default: 'open',
    },
    priority: { type: Number, min: 1, max: 5, default: 3 },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    relatedAlerts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Alert' }],
    sourceIps: [String],
    affectedSystems: [String],
    timeline: [timelineEntrySchema],
    investigationNotes: String,
    containmentActions: [String],
    recoveryStatus: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started',
    },
    evidence: [
      {
        name: String,
        description: String,
        type: String,
        addedAt: { type: Date, default: Date.now },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    analystComments: [
      {
        comment: String,
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    aiSummary: String,
    mitreTactics: [String],
    mitreTechniques: [String],
    closedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Incident', incidentSchema);
