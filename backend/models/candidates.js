const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  department: { type: String, required: true },
  programName: { type: String, required: true },
  regNo: { type: String, required: true, unique: true },
  manifesto: { type: String, required: true },
  nominationDate: { type: Date, default: Date.now },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalNomination: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Nomination'
  }
}, { timestamps: true });

module.exports = mongoose.model('Candidate', candidateSchema);