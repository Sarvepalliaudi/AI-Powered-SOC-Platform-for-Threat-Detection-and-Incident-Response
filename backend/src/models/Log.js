const mongoose = require('mongoose');

const logSchema = new mongoose.Schema(
  {
    logType: {
      type: String,
      enum: ['auth', 'apache', 'syslog', 'firewall', 'other'],
      required: true,
    },
    sourceFile: { type: String, required: true },
    timestamp: { type: Date, required: true, index: true },
    rawLine: { type: String, required: true },
    parsed: {
      ip: String,
      user: String,
      action: String,
      status: String,
      method: String,
      url: String,
      userAgent: String,
      port: Number,
      protocol: String,
    },
    severity: {
      type: String,
      enum: ['info', 'low', 'medium', 'high', 'critical'],
      default: 'info',
    },
    isSuspicious: { type: Boolean, default: false },
    tags: [String],
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    batchId: { type: String, index: true },
  },
  { timestamps: true }
);

logSchema.index({ 'parsed.ip': 1 });
logSchema.index({ isSuspicious: 1 });
logSchema.index({ severity: 1 });

module.exports = mongoose.model('Log', logSchema);
