const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  candidateName: String,
  department: String,
  category: String,
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  voteCount: Number,
  declaredAt: { type: Date, default: Date.now }
}, {
  timestamps: true // 👈 This adds `createdAt` and `updatedAt` fields automatically
});

module.exports = mongoose.model('Result', resultSchema);
