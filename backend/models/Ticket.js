const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: { type: String, required: true },
  email: { type: String, required: true },
  studentType: { type: String, required: true },
  department: { type: String, required: true },
  course: { type: String, required: true },
  description: { type: String, required: true },
   status: { type: String, default: 'Pending' }, // e.g., Pending, In Progress, Resolved
  seenByUser: { type: Boolean, default: false }, // 👈 NEW FIELD
  seenByAdmin: { type: Boolean, default: false }, // Optional: Admin tracking
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ticket', ticketSchema);
