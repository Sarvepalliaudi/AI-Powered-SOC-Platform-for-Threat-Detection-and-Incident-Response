const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ['incident', 'threat_analysis', 'log_summary'],
      required: true,
    },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    relatedIncident: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident' },
    dateRange: {
      start: Date,
      end: Date,
    },
    summary: String,
    content: { type: mongoose.Schema.Types.Mixed, default: {} },
    filePath: String,
    status: {
      type: String,
      enum: ['generating', 'completed', 'failed'],
      default: 'completed',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
