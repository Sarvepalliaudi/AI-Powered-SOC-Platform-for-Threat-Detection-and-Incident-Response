const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
    },
    status: {
      type: String,
      enum: ['new', 'investigating', 'contained', 'resolved', 'false_positive'],
      default: 'new',
    },
    detectionType: {
      type: String,
      enum: [
        'failed_ssh_login',
        'brute_force',
        'unauthorized_access',
        'suspicious_ip',
        'malware_indicator',
        'port_scan',
        'high_frequency',
        'ai_anomaly',
      ],
      required: true,
    },
    sourceIp: { type: String, index: true },
    targetResource: String,
    eventCount: { type: Number, default: 1 },
    confidence: { type: Number, min: 0, max: 100, default: 50 },
    aiScore: { type: Number, min: 0, max: 100 },
    mitreTactic: String,
    mitreTechnique: String,
    mitreTechniqueId: String,
    relatedLogs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Log' }],
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    acknowledgedAt: Date,
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

alertSchema.index({ createdAt: -1 });
alertSchema.index({ severity: 1, status: 1 });

module.exports = mongoose.model('Alert', alertSchema);
