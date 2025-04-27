const express = require('express');
const router = express.Router();
const Nomination = require('../models/Nomination');
const Candidate = require('../models/candidates');
const { verifyToken, adminAuth } = require('../middleware/auth');
const jwt = require("jsonwebtoken");


// Create Nomination
router.post('/', async (req, res) => {
  try {
    const nomination = new Nomination(req.body);
    await nomination.save();
    res.status(201).json(nomination);
  } catch (error) {
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Get All Nominations
router.get('/', async (req, res) => {
  try {
    const nominations = await Nomination.find()
      .sort({ createdAt: -1 })
      .populate('proposer seconder', 'name regNo department');
      
    res.json({ 
      success: true,
      count: nominations.length,
      data: nominations 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Approve Nomination
router.put('/:id/approve', verifyToken, adminAuth, async (req, res) => {
  try {
    const nomination = await Nomination.findById(req.params.id);
    
    if (!nomination) {
      return res.status(404).json({ 
        success: false,
        error: 'Nomination not found' 
      });
    }

    const candidateData = {
      ...nomination.candidate.toObject(),
      approvedBy: req.user.id,
      originalNomination: nomination._id
    };

    const newCandidate = await Candidate.create(candidateData);
    await Nomination.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Nomination approved successfully',
      data: newCandidate
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Reject Nomination
router.delete('/:id', verifyToken, adminAuth, async (req, res) => {
  try {
    const nomination = await Nomination.findByIdAndDelete(req.params.id);
    
    if (!nomination) {
      return res.status(404).json({ 
        success: false,
        error: 'Nomination not found' 
      });
    }

    res.json({
      success: true,
      message: 'Nomination rejected successfully'
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;