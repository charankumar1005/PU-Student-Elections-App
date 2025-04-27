const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');  // Import UUID package

const nominationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference required']
  },
  document: {  // Added PDF path field
    type: String,
    required: [true, 'Document path is required'],
    validate: {
      validator: function(v) {
        return /\.pdf$/i.test(v);
      },
      message: props => `${props.value} is not a valid PDF file path!`
    }
  },
  candidateId: {  // Unique ID for the candidate
    type: String,
    required: true,
    default: uuidv4,  // Assign a new unique ID using UUID
    unique: true
  },
  candidate: {
    name: String,
    department: String,
    school: String,
    programName: String,
    age: Number,
    dob: Date,
    gender: String,
    admissionYear: Number,
    regNo: String,
    fullTimeStudent: Boolean,
    category: String,
    hasArrears: Boolean,
    attendance: Boolean,
    hasCriminalProceedings: Boolean,
    hasDisciplinaryActions: Boolean,
    manifesto: String,
    image: { type: String, required: true }
  },
  proposer: {
    name: String,
    department: String,
    school: String,
    programName: String,
    age: Number,
    dob: Date,
    gender: String,
    admissionYear: Number,
    regNo: String,
    fullTimeStudent: Boolean,
    category: String,
    hasArrears: Boolean,
    attendance: Boolean,
    hasCriminalProceedings: Boolean,
    hasDisciplinaryActions: Boolean,
    image: { type: String, required: true }
  },
  seconder: {
    name: String,
    department: String,
    school: String,
    programName: String,
    age: Number,
    dob: Date,
    gender: String,
    admissionYear: Number,
    regNo: String,
    fullTimeStudent: Boolean,
    category: String,
    hasArrears: Boolean,
    attendance: Boolean,
    hasCriminalProceedings: Boolean,
    hasDisciplinaryActions: Boolean,
    image: { type: String, required: true }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Nomination', nominationSchema);
