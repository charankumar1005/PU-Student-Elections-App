const mongoose = require('mongoose');
const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Admin ID or name
  createdAt: { type: Date, default: Date.now },
   
});

module.exports = mongoose.model("Notification", notificationSchema);
