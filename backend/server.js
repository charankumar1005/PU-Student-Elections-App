const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
const sendOTP = require("./mailer");
const app = express(); 
const server = require("http").createServer(app);
const router = express.Router();
const bodyParser = require('body-parser');
// const cron = require('cron');
const cron = require('node-cron');

const rateLimit = require('express-rate-limit');
const Ticket = require('./models/Ticket'); // adjust path as needed
const Nomination = require('./models/Nomination');
const Notification = require('./models/Notification');
const Image = require('./models/Image');
const User = require('./models/user');
const Vote = require('./models/Vote');
const Result = require('./models/Result');
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

dotenv.config();


// ✅ Improved CORS Configuration - Add your frontend URL here
const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:8081",
    "exp://localhost:8081", // Add Expo development URL
    "http://localhost:8081", // Add your actual frontend URL
    "http://localhost:19000", // Common Expo port
];

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
// 
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log(`Origin ${origin} not allowed by CORS`);
            callback(null, true); // For development, allow all origins but log for debugging
        }
    },
    methods: "GET,POST,PUT,DELETE,PATCH",
    allowedHeaders: "Content-Type,Authorization",
    credentials: true, // Allow cookies if needed
};
// app.use('/api/images', imageRoutes); // This is crucial
app.use(cors(corsOptions));
// new helpdesk
app.use(bodyParser.json());
// app.use("/api", imageRoutes);
// ✅ Middleware
// new image routes
app.use(express.json({ limit: '50mb' }));
// app.use('/api/images', imageRoutes);

app.use(express.json());
app.use("/uploads", express.static("uploads")); // Serve uploaded images
// app.set("io", io);
app.set("socketio", io);


// ✅ Handle Preflight Requests for CORS
app.options("*", cors(corsOptions));

// ✅ MongoDB Connection with improved error handling
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ✅ Ensure uploads directory exists
const fs = require("fs");
const dir = "./uploads";
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/nominations/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `nomination-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/images/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `image-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});
// 

const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024,
    fields: 3 // candidate, proposer, seconder
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});
const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profiles/'); // Separate directory for profile images
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `profile-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const profileupload = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});
const nominationStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'document') {
      cb(null, 'uploads/nominations/');
    } else {
      cb(null, 'uploads/images/');
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const prefix = file.fieldname === 'document' ? 'nomination' : file.fieldname;
    cb(null, `${prefix}-${uniqueSuffix}${ext}`);
  }
});

const nominationUpload = multer({
  storage: nominationStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB total
    files: 4 // document + 3 images
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'document') {
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Only PDF files are allowed for documents'), false);
      }
    } else {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for profile pictures'), false);
      }
    }
  }
}).fields([
  { name: 'document', maxCount: 1 },
  { name: 'candidateImage', maxCount: 1 },
  { name: 'proposerImage', maxCount: 1 },
  { name: 'seconderImage', maxCount: 1 }
]);
// Socket.io Integration

io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);

  // ✅ Admin registers to receive ticket updates
  socket.on("register-admin", () => {
    console.log("✅ Admin registered for ticket updates:", socket.id);
    socket.join("admins"); // Join admin-specific room
  });

  // ✅ Listen for new notifications (existing feature)
  socket.on("new-notification", (notification) => {
    io.emit("notification", notification); // Broadcast to all clients
  });

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});

const candidateSchema = new mongoose.Schema({
  name: String,
  department: String,
  programName: String,
  regNo: String,
  manifesto: String,
  nominationDate: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

module.exports = mongoose.model("Candidate", candidateSchema);
// 



// ✅ Function to create the default admin user
const createDefaultAdmin = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@gmail.com" });
    if (existingAdmin) {
      console.log("✅ Default admin user already exists.");
      return;
    }

    // Create new admin user
    const newAdmin = new User({
      fullName: "Admin",
      email: "admin@gmail.com",
      studentId: "Admin123",
      department: "Admin",
      phone: "1234567890",
      password: "Admin@123", // Set password as plain text
      isAdmin: true, // Set isAdmin to true
    });

    // Save the admin user
    await newAdmin.save();

    console.log("✅ Default admin user created successfully!");
  } catch (error) {
    console.error("❌ Error creating default admin user:", error);
  }
};


// ✅ Improved Register New User endpoint with better error handling
app.post("/api/register", async (req, res) => {
    console.log("Registration attempt received");

    try {
        const { fullName, email, studentId, department, phone, password } =
            req.body;

        // Get base64 image from request body if present
        // const base64Image = req.body.image;

        // Validate required fields
        if (
            !fullName ||
            !email ||
            !studentId ||
            !department ||
            !phone ||
            !password
        ) {
            return res.status(400).json({
                message: "❌ All fields are required",
            });
        }

        // Email format validation
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "❌ Invalid email format" });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "❌ Email already exists!" });
        }

        

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({
            fullName,
            email,
            studentId,
            department,
            phone,
            password: hashedPassword,
            // profileImage,
        });

        // Save user to database
        await newUser.save();

        // Return success
        res.status(201).json({
            message: "✅ User registered successfully!",
            user: {
                id: newUser._id,
                email: newUser.email,
                fullName: newUser.fullName,
                // profileImage: newUser.profileImage,
            }
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({
            message: "❌ Server error",
            error: error.message,
           
        });
    }
});

// ✅ Improved JWT Authentication Middleware
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return res.status(401).json({ message: "Access Denied! No token provided." });
    }

    const tokenParts = authHeader.split(" ");
    if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
      return res.status(400).json({ message: "Invalid token format. Use 'Bearer <token>'." });
    }

    const token = tokenParts[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        console.error("Token verification error:", err);
        return res.status(403).json({ message: "Invalid token!" });
      }

      req.user = user;
      next();
    });
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(500).json({ message: "❌ Server error", error: error.message });
  }
};
// ✅ Improved User Login with JWT
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "❌ Email and password are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "❌ Invalid email or password" });
    }

    // Check if user is an admin
    if (user.isAdmin) {
      // For admins, compare plain-text passwords
      if (user.password !== password) {
        return res.status(400).json({ message: "❌ Invalid email or password" });
      }
    } else {
      // For non-admins, compare hashed passwords
      if (!(await bcrypt.compare(password, user.password))) {
  return res.status(400).json({ message: "❌ Invalid email or password" });
}

    }

    const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: "24h" });

    res.status(200).json({
      message: "✅ Login successful!",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        studentId: user.studentId,
        department: user.department,
        phone: user.phone,
        profileImage: user.profileImage,
        isAdmin: user.isAdmin, // Include isAdmin in the response
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "❌ Server error", error: error.message });
  }
});
//
app.post("/api/profile/change-password", verifyToken, async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = user.isAdmin
      ? user.password === currentPassword
      : await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });

    const hashedPassword = user.isAdmin
      ? newPassword
      : await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

app.post("/api/vote", verifyToken, async (req, res) => {
  try {
    const { candidateId } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(candidateId)) {
      return res.status(400).json({ success: false, message: "Invalid candidate ID" });
    }

    const candidate = await Nomination.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }

    const alreadyVoted = await Vote.findOne({ voter: userId });
    if (alreadyVoted) {
      return res.status(400).json({ success: false, message: "You have already voted" });
    }

    const vote = new Vote({ voter: userId, candidate: candidateId });
    await vote.save();

    res.json({ success: true, message: "Vote submitted successfully" });
  } catch (err) {
    console.error("Vote error:", err);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
});

// In the GET /votes route handler
app.get('/api/votes', verifyToken, async (req, res) => {
  try {
    // Check if the user is an admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    // Optional filter: specific candidateId from query param
    const candidateFilter = req.query.candidateId ? { candidate: req.query.candidateId } : {};

    // Aggregation pipeline to group votes and join candidate details
    const aggregationPipeline = [
      { $match: candidateFilter },
      {
        $group: {
          _id: "$candidate", // Group votes by candidate ID
          voteCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "nominations", // Join with Nomination model
          localField: "_id",
          foreignField: "_id",
          as: "candidateDetails"
        }
      },
      { $unwind: "$candidateDetails" },
      {
        $project: {
          _id: 0,
          candidateId: "$_id",
          voteCount: 1,
          candidate: {
            name: "$candidateDetails.candidate.name",
            image: "$candidateDetails.candidate.image",
            category: "$candidateDetails.candidate.category",
            gender: "$candidateDetails.candidate.gender",
            age: "$candidateDetails.candidate.age",
            programName: "$candidateDetails.candidate.programName"
          },
          department: "$candidateDetails.candidate.department",
          school: "$candidateDetails.candidate.school"
        }
      },
      { $sort: { voteCount: -1 } }
    ];

    const votes = await Vote.aggregate(aggregationPipeline).exec();

    res.json({
      success: true,
      data: votes
    });

  } catch (error) {
    console.error("📂 Vote Fetch Error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: error.message
      });
    }
  }
});

app.post('/api/results', async (req, res) => {
  try {
    await Result.deleteMany(); // Optional: clear previous results

    const votes = await Vote.aggregate([
      {
        $lookup: {
          from: 'nominations',
          localField: 'candidate',
          foreignField: '_id',
          as: 'nomination'
        }
      },
      { $unwind: '$nomination' },
      {
         $group: {
          _id: {
            department: '$nomination.candidate.department',
            category: '$nomination.candidate.category',
            candidateUserId: '$nomination.user',
            candidateName: '$nomination.candidate.name' ,// <-- Extract name
            candidateImage: '$nomination.candidate.image' // ✅ also extract image
          },
          voteCount: { $sum: 1 }
        }
      },
      {
        $sort: { voteCount: -1 }
      },
      {
        $group: {
          _id: {
            department: '$_id.department',
            category: '$_id.category'
          },
          winner: { $first: '$$ROOT' }
        }
      }
    ]);
const alreadyPosted = await Result.findOne({
  createdAt: {
    $gte: new Date(new Date().setHours(0, 0, 0, 0)), // today 00:00:00
    $lt: new Date(new Date().setHours(23, 59, 59, 999)) // today 23:59:59
  }
});

if (alreadyPosted) {
  return res.status(400).json({
    success: false,
    message: 'Results have already been posted today.'
  });
}

    for (const r of votes) {
      await Result.create({
        department: r._id.department,
        category: r._id.category,
        candidate: r.winner._id.candidateUserId,  // ✅ store correct User ObjectId
         candidateName: r.winner._id.candidateName, 
           candidateImage: r.winner._id.candidateImage, 
        voteCount: r.winner.voteCount
      });
    }

    return res.status(200).json({ success: true, message: 'Results stored successfully!' });
  } catch (err) {
    console.error('Error declaring results:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
  }
});

// GET /api/results
// backend: routes/results.js
// backend: routes/results.js or similar
app.get('/api/results', async (req, res) => {
  try {
    const results = await Result.find()
      // .populate('candidate', 'fullName email department image') // Uncomment if needed in future
      .sort({ declaredAt: -1 });

    const latestDeclared = results.length > 0 ? results[0].declaredAt : null;

    res.json({
      success: true,
      postedAt: latestDeclared,
      data: results.map(r => ({
        id: r._id,
        candidateName: r.candidateName,
        candidateImage: r.candidateImage ? `http://192.168.151.139:5000/${r.candidateImage}` : null,
        department: r.department,
        category: r.category,
        voteCount: r.voteCount,
        declaredAt: r.declaredAt,
      })),
    });
  } catch (err) {
    console.error('Error fetching results:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});



// Ensure proper error handling in your upload route
app.post(
  '/api/images/upload',
  verifyToken,
  imageUpload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image provided",
        });
      }

      // Check for existing image by this user
      const existingImage = await Image.findOne({ userId: req.user.id });

      if (existingImage) {
        // Remove the old image file
        const oldImagePath = path.join(__dirname, existingImage.path);
        fs.unlink(oldImagePath, (err) => {
          if (err) {
            console.error("Failed to delete previous image file:", err);
          } else {
            console.log("Old image file deleted successfully");
          }
        });

        // Remove from database
        await Image.deleteOne({ _id: existingImage._id });
      }

      // Save the new image
      const newImage = new Image({
        filename: req.file.filename,
        path: req.file.path,
        userId: req.user.id,
      });

      await newImage.save();

      res.status(201).json({
        success: true,
        message: "Image uploaded successfully",
        imageUrl: `http://192.168.151.139:5000/uploads/images/${req.file.filename}`,
      });
    } catch (error) {
      console.error("Server Upload Error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Image processing failed",
      });
    }
  }
);

// 4. Add Image Fetch Route
app.get('/api/images/my-images', verifyToken, async (req, res) => {
  try {
    const images = await Image.find({ userId: req.user.id })
      .sort({ uploadedAt: -1 })
      .lean(); // Convert to plain JS objects

    const formattedImages = images.map(img => ({
      _id: img._id,
      filename: img.filename,
      url: `http://192.168.151.139:5000/${img.path}`, // Full accessible URL
      uploadedAt: img.uploadedAt
    }));

    res.json(formattedImages);
  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch images",
      error: error.message
    });
  }
});
// New route to fetch image by userId (no need for token here)
app.get('/api/images/user/:userId', async (req, res) => {
  try {
    const image = await Image.findOne({ userId: req.params.userId }).sort({ uploadedAt: -1 });
    if (!image) {
      return res.status(404).json({ success: false, message: "Image not found" });
    }

    res.json({
      success: true,
      url: `http://192.168.151.139:5000/${image.path}`,
    });
  } catch (error) {
    console.error("Error fetching image by userId:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// 3. Add DELETE endpoint
app.delete('/api/images/:id', verifyToken, async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    
    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found"
      });
    }

    // Delete file from filesystem
    fs.unlink(path.join(__dirname, image.path), async (err) => {
      if (err) {
        console.error("File deletion error:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to delete image file"
        });
      }

      // Delete from database
      await Image.deleteOne({ _id: req.params.id });
      
      res.json({
        success: true,
        message: "Image deleted successfully"
      });
    });
    
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete image"
    });
  }
});



// new
app.get('/download-nomination-form', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', 'Nomination_Form.pdf');
  res.download(filePath, 'Nomination_Form.pdf', (err) => {
    if (err) {
      res.status(500).send('Error downloading file');
    }
  });
});
// ✅ Admin Authorization Middleware
const adminAuth = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};


// Updated POST /nominations route
app.post('/nominations', 
  apiLimiter,
  verifyToken,
  (req, res, next) => {
    nominationUpload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          error: "FILE_UPLOAD_ERROR",
          message: err.message
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: err.message
        });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      // Check existing submission
      const existingNomination = await Nomination.findOne({ 
        user: req.user.id,
        status: { $ne: 'rejected' }
      });

      if (existingNomination) {
        // Cleanup uploaded files
        Object.values(req.files).forEach(files => {
          files.forEach(file => fs.unlinkSync(file.path));
        });
        return res.status(409).json({
          success: false,
          error: "SUBMISSION_LIMIT",
          message: "You already have an active nomination"
        });
      }

      // Parse form data
      const parseObject = (field) => {
        try {
          return JSON.parse(req.body[field]);
        } catch (error) {
          throw new Error(`Invalid ${field} data format`);
        }
      };

      // File paths
      const files = {
        document: req.files.document[0].path,
        candidateImage: req.files.candidateImage[0].path,
        proposerImage: req.files.proposerImage[0].path,
        seconderImage: req.files.seconderImage[0].path
      };

      // Create nomination
      const nomination = new Nomination({
        user: req.user.id,
        candidate: { ...parseObject('candidate'), image: files.candidateImage },
        proposer: { ...parseObject('proposer'), image: files.proposerImage },
        seconder: { ...parseObject('seconder'), image: files.seconderImage },
        document: req.files.document[0].path,
        status: 'pending'
      });

      // Validate against schema
      await nomination.validate();

      // Save to database
      await nomination.save();

      res.status(201).json({
        success: true,
        data: {
          _id: nomination._id,
          status: nomination.status,
          document: nomination.document,
          images: {
            candidate: nomination.candidate.image,
            proposer: nomination.proposer.image,
            seconder: nomination.seconder.image
          },
          createdAt: nomination.createdAt
        }
      });

    } catch (error) {
      console.error("🔥 Nomination Submission Error:", error);
       if (req.files) {
        Object.values(req.files).forEach(files => {
          files.forEach(file => fs.unlinkSync(file.path));
        });
      }
      // Handle validation errors
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(e => e.message);
        return res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "Validation failed",
          details: errors
        });
      }

      // Handle file upload errors
      if (error instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          error: "FILE_UPLOAD_ERROR",
          message: error.message
        });
      }

      // Handle custom errors
      if (error.message.includes('Invalid')) {
        return res.status(400).json({
          success: false,
          error: "INVALID_DATA",
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "Failed to process nomination"
      });
    }
  }
);
const API_URL = process.env.API_URL || "http://192.168.151.139:5000";

// In the GET /nominations route handler
app.get('/api/nominations', verifyToken, async (req, res) => {
  try {
    const groupByDepartment = req.query.groupBy === 'department';
    const statusFilter = req.query.status || 'pending';

    // For Admin: Group by department
    if (req.user.isAdmin && groupByDepartment) {
      const aggregationPipeline = [
        {
          $match: {
            status: statusFilter,
            'candidate.department': { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: "$candidate.department",
            nominations: {
              $push: {
                _id: "$_id",
                candidate: "$candidate",
                proposer: "$proposer",
                seconder: "$seconder",
                status: "$status",
                createdAt: "$createdAt",
                document: "$document",
              }
            },
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            department: "$_id",
            nominations: 1,
            count: 1
          }
        },
        { $sort: { department: 1 } }
      ];

      const nominations = await Nomination.aggregate(aggregationPipeline).exec();

      // Populate nested candidate.user details for each nomination inside grouped results
      for (const section of nominations) {
        for (const nomination of section.nominations) {
          await Nomination.populate(nomination, {
            path: 'candidate.user',
            select: 'fullName email'
          });
        }
      }

      return res.json({
        success: true,
        data: nominations
      });
    }

    // For non-admins or no groupBy requested
    const query = req.user.isAdmin
      ? { status: statusFilter } // Apply status filter
      : { user: req.user.id };

    const nominations = await Nomination.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'fullName email') // 👈 this should come before .lean()
      .lean()
      .exec();

    const enhancedNominations = nominations.map(nom => ({
      ...nom,
      document: `${API_URL}/${nom.document}`,
      candidate: {
        ...nom.candidate,
        image: `${API_URL}/${nom.candidate.image}`
      },
      proposer: {
        ...nom.proposer,
        image: `${API_URL}/${nom.proposer.image}`
      },
      seconder: {
        ...nom.seconder,
        image: `${API_URL}/${nom.seconder.image}`
      }
    }));

    return res.json({
      success: true,
      data: enhancedNominations
    });

  } catch (error) {
    console.error("📂 Nomination Fetch Error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: error.message
      });
    }
  }
});

// Approve Nomination
app.put('/nominations/:id/approve', verifyToken, adminAuth, async (req, res) => {
  try {
    const nomination = await Nomination.findById(req.params.id)
      .populate('user');

    if (!nomination) {
      return res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "Nomination not found"
      });
    }

    if (nomination.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: "INVALID_STATUS",
        message: "Nomination is not in pending state"
      });
    }

    // Create candidate logic here
    nomination.status = 'approved';
    await nomination.save();

    res.json({
      success: true,
      message: "Nomination approved successfully",
      data: nomination
    });

  } catch (error) {
    console.error("✅ Approval Error:", error);
    res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to approve nomination"
    });
  }
});
// ✅ Get Approved Candidates (filtered by user's department if not admin)
app.get('/api/approved-candidates', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || !user.department) {
      return res.status(400).json({ success: false, message: "User department not found" });
    }

    const nominations = await Nomination.find({
      status: "approved"
    })
      .populate("candidate")
      .populate("user");

    // Filter nominations by department
    const departmentWise = nominations.filter(
      (n) => n.candidate?.department === user.department
    );

    res.json({
      success: true,
      data: departmentWise,
    });

  } catch (error) {
    console.error("Error fetching approved nominations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch approved nominations",
    });
  }
});

// Approve Nomination
app.put('/nominations/:id/approve', verifyToken, adminAuth, async (req, res) => {
  try {
    const nomination = await Nomination.findById(req.params.id)
      .populate('user');

    if (!nomination) {
      return res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "Nomination not found"
      });
    }

    if (nomination.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: "INVALID_STATUS",
        message: "Nomination is not in pending state"
      });
    }

    // ✅ Approve the nomination
    nomination.status = 'approved';
    await nomination.save();

    // ✅ Optional: Send notification (create one in DB or emit via Socket.IO)
    // You can also emit a real-time update to the frontend if Socket.IO is set up
    // Example:
    io.to(nomination.user._id.toString()).emit("nominationStatusUpdate", {
      status: "approved",
      nominationId: nomination._id
    });

    res.json({
      success: true,
      message: "Nomination approved successfully",
      data: {
        _id: nomination._id,
        status: nomination.status,
        user: nomination.user.fullName,
        updatedAt: nomination.updatedAt
      }
    });

  } catch (error) {
    console.error("✅ Approval Error:", error);
    res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to approve nomination"
    });
  }
});

// Reject Nomination
app.delete('/nominations/:id', verifyToken, adminAuth, async (req, res) => {
  try {
    const nomination = await Nomination.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );

    if (!nomination) {
      return res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "Nomination not found"
      });
    }

    res.json({
      success: true,
      message: "Nomination rejected successfully",
      data: nomination
    });

  } catch (error) {
    console.error("🗑️ Rejection Error:", error);
    res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to reject nomination"
    });
  }
});
// 

// Post Notification Endpoint
app.post("/api/notifications", verifyToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const newNotification = new Notification({
      title,
      content,
      postedBy: req.user.id,

      createdAt: new Date() // Add creation timestamp
    });

    await newNotification.save();

    // Emit notification to all connected clients
    io.emit("notification", newNotification);

    res.status(201).json(newNotification);
  } catch (error) {
    console.error("Error posting notification:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Fetch Notifications Endpoint with Auto-Expiry
app.get("/api/notifications", async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const notifications = await Notification.find({
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add automatic cleanup job (run daily)
const cleanupNotifications = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    await Notification.deleteMany({
      createdAt: { $lt: thirtyDaysAgo }
    });
    console.log("Cleaned up expired notifications");
  } catch (error) {
    console.error("Error cleaning up notifications:", error);
  }
};

// Schedule daily cleanup at 3 AM
cron.schedule('0 3 * * *', cleanupNotifications, {
  scheduled: true,
  timezone: "UTC"
});

// helpdesk
app.post('/api/helpdesk/submit-ticket', verifyToken, async (req, res) => {
  const requiredFields = ['name', 'email', 'studentType', 'department', 'course', 'description'];
  const missingFields = requiredFields.filter(field => !req.body[field]);

  if (missingFields.length > 0) {
    return res.status(400).json({
      error: `Missing fields: ${missingFields.join(', ')}`
    });
  }

  const emailRegex = /\S+@\S+\.\S+/;
  if (!emailRegex.test(req.body.email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    const ticket = new Ticket({
      userId: req.user.id,
      ...req.body,
      createdAt: new Date() // Optional: timestamp
    });

    await ticket.save();
    const populatedTicket = await ticket.populate('userId', 'email name');

    console.log('✅ Ticket Saved to DB:', populatedTicket);

    // 🔥 Emit to admins
    // const io = req.app.get("io");
    const io = req.app.get("socketio");

    io.to("admins").emit("new-ticket", populatedTicket);

    res.status(201).json(populatedTicket);
  } catch (err) {
    console.error('❌ DB Save Error:', err);
    res.status(500).json({ error: 'Failed to save ticket' });
  }
});


// app.get('/api/helpdesk/tickets', verifyToken, async (req, res) => {
//   try {
//     const { status, department, groupBy } = req.query;
//     const isAdmin = req.user.role === 'admin';
//     const statusFilter = status || 'pending';

//     if (isAdmin && groupBy === 'department') {
//       const aggregationPipeline = [
//         {
//           $match: {
//             status: statusFilter,
//             department: { $exists: true, $ne: null }
//           }
//         },
//         {
//           $group: {
//             _id: "$department",
//             tickets: {
//               $push: {
//                 _id: "$_id",
//                 subject: "$subject",
//                 description: "$description",
//                 status: "$status",
//                 userId: "$userId",
//                 createdAt: "$createdAt"
//               }
//             },
//             count: { $sum: 1 }
//           }
//         },
//         {
//           $project: {
//             _id: 0,
//             department: "$_id",
//             tickets: 1,
//             count: 1
//           }
//         },
//         { $sort: { department: 1 } }
//       ];

//       const groupedTickets = await Ticket.aggregate(aggregationPipeline);
//       // Populate userId in each ticket
//       for (const group of groupedTickets) {
//         for (const ticket of group.tickets) {
//           await Ticket.populate(ticket, {
//             path: 'userId',
//             select: 'name email'
//           });
//         }
//       }

//       return res.json({
//         success: true,
//         grouped: true,
//         data: groupedTickets
//       });
//     }

//     // Non-admin or no grouping requested
//     const query = isAdmin
//       ? (status ? { status } : {})
//       : { userId: req.user.id, ...(status && { status }) };

//     if (department && isAdmin) query.department = department;

//     const tickets = await Ticket.find(query)
//       .sort({ createdAt: -1 })
//       .populate('userId', 'name email')
//       .lean();

//     const formattedTickets = tickets.map(ticket => ({
//       ...ticket,
//       createdAt: new Date(ticket.createdAt).toLocaleString(),
//     }));

//     return res.json({
//       success: true,
//       grouped: false,
//       data: formattedTickets
//     });

//   } catch (error) {
//     console.error("📂 Ticket Fetch Error:", error);
//     if (!res.headersSent) {
//       res.status(500).json({
//         success: false,
//         error: "SERVER_ERROR",
//         message: error.message
//       });
//     }
//   }
// });
app.get("/api/tickets", verifyToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }

    const tickets = await Ticket.find().populate('userId', 'name email department');

    res.status(200).json({ tickets });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({ error: "Server error" });
  }
});


app.patch('/api/helpdesk/tickets/:id/seen', verifyToken, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    // Only the ticket owner should be allowed to mark it seen
    if (ticket.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    ticket.seenByUser = true;
    await ticket.save();

    res.json({ message: 'Ticket marked as seen', ticket });
  } catch (err) {
    console.error('❌ Seen Error:', err);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});
// PATCH: Mark ticket as seen by admin
app.patch('/api/helpdesk/tickets/:id/admin-seen', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const ticket = await Ticket.findByIdAndUpdate(req.params.id, { seenByAdmin: true }, { new: true });
    res.json(ticket);
  } catch (err) {
    console.error('Error marking seen:', err);
    res.status(500).json({ error: 'Failed to mark as seen' });
  }
});


// ✅ Fetch User Profile by ID (Protected Route)
app.get("/api/profile", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) return res.status(404).json({ message: "❌ User not found!" });

        // Add full image URL
        const userWithImageUrl = {
            ...user._doc,
            profileImage: user.profileImage 
                ? `http://192.168.1.106:5000/${user.profileImage}`
                : null
        };

        res.status(200).json(userWithImageUrl);
    } catch (error) {
        console.error("Profile fetch error:", error);
        res.status(500).json({ message: "❌ Server error", error: error.message });
    }
});


// ✅ Fetch All Non-Admin Users with Department Grouping (Admin-Only)
app.get("/api/users", verifyToken, async (req, res) => {
  try {
    // Authorization check
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "🔒 Access denied. Admins only." });
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Main query for non-admin users
    const users = await User.find({ isAdmin: false })
      .select("-password -__v")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Total user count
    const totalUsers = await User.countDocuments({ isAdmin: false });

    // Department aggregation
    const departmentStats = await User.aggregate([
      { $match: { isAdmin: false } },
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 },
          users: { $push: "$$ROOT" }
        }
      },
      { $project: { 
        department: "$_id", 
        count: 1,
        _id: 0,
        users: { $slice: ["$users", 5] } // Top 5 users per department
      }},
      { $sort: { department: 1 } }
    ]);

    // Real-time update setup
    const io = req.app.get('socketio');
    io.emit('users-updated', { 
      total: totalUsers,
      departments: departmentStats 
    });

    res.status(200).json({
      success: true,
      users,
      count: totalUsers,
      departments: departmentStats,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        itemsPerPage: limit,
        totalItems: totalUsers
      }
    });

  } catch (error) {
    console.error("🚨 User fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});
// Add this endpoint for grouped user data
app.get("/api/users/grouped", verifyToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    const departmentStats = await User.aggregate([
      { $match: { isAdmin: false } },
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 },
          users: { $push: "$$ROOT" }
        }
      },
      { 
        $project: { 
          _id: 0,
          title: "$_id",
          data: "$users"
        }
      }
    ]);

    res.status(200).json(departmentStats);
  } catch (error) {
    console.error("Grouped users error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Add this to your backend routes
app.delete("/api/users/:id", verifyToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "🔒 Access denied. Admins only." });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "❌ User not found" });
    }

    // Replace remove() with findByIdAndDelete
    await User.findByIdAndDelete(req.params.id);

    // Notify all clients about the user deletion
    const io = req.app.get('socketio');
    io.emit('user-deleted', { userId: req.params.id });

    res.status(200).json({ 
      success: true, 
      message: "✅ User deleted successfully" 
    });
  } catch (error) {
    console.error("🚨 Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});


// ✅ Update User Profile with Improved Error Handling
app.put(
    "/api/profile/update",
    verifyToken,
    upload.single("profileImage"), // Match frontend's form field name
    async (req, res) => {
        try {
            const updateObj = req.body;

            // Handle file upload
            if (req.file) {
                updateObj.profileImage = req.file.path;
            }

            const updatedUser = await User.findByIdAndUpdate(
                req.user.id,
                updateObj,
                { new: true, runValidators: true }
            ).select("-password");

            // Add full URL to the response
            const responseUser = {
                ...updatedUser._doc,
                profileImage: updatedUser.profileImage 
                    ? `http://192.168.1.106:5000/${updatedUser.profileImage}`
                    : null
            };

            res.json({
                message: "✅ Profile updated successfully!",
                user: responseUser
            });
        } catch (error) {
            console.error("🔥 Profile update error:", error);
            res.status(500).json({ message: "❌ Server error", error: error.message });
        }
    }
);

// ✅ Improved OTP handling with expiration and better error messages
let otpStore = {};
const cleanupExpiredOTPs = () => {
    const now = Date.now();
    for (let email in otpStore) {
        if (otpStore[email].expiresAt <= now) {
            delete otpStore[email];
        }
    }
};
// Send OTP endpoint with proper validation and error handling
app.post("/send-otp", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        // Email format validation
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Invalid email format" });
        }

        // Clean up expired OTPs before generating a new one
        cleanupExpiredOTPs();

        // Check if OTP already exists and is still valid
        if (otpStore[email] && otpStore[email].expiresAt > Date.now()) {
            return res.status(400).json({
                error: "OTP already sent, please wait before requesting a new one",
            });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000);

        // Store OTP with creation timestamp and expiration (5 minutes)
        otpStore[email] = {
            code: otp,
            createdAt: Date.now(),
            expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
        };

        console.log(`OTP for ${email}: ${otp}`); // For development only, remove in production

        // Send OTP email
        const result = await sendOTP(email, otp);

        if (result.success) {
            res.json({
                message: "OTP sent successfully",
                expiresIn: "5 minutes",
            });
        } else {
            res.status(500).json({ error: result.message || "Failed to send OTP" });
        }
    } catch (error) {
        console.error("Send OTP error:", error);
        res.status(500).json({ error: "Server error" });
    }
});


// Verify OTP endpoint with proper validation and expiration check
app.post("/verify-otp", (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: "Email and OTP are required" });
        }

        const otpData = otpStore[email];

        if (!otpData) {
            return res
                .status(400)
                .json({
                    error: "No OTP was sent to this email or it has expired",
                });
        }

        // Check if OTP has expired
        if (Date.now() > otpData.expiresAt) {
            delete otpStore[email];
            return res
                .status(400)
                .json({ error: "OTP has expired, please request a new one" });
        }

        // Check if OTP matches
        if (otpData.code.toString() !== otp.toString()) {
            return res.status(400).json({ error: "Invalid OTP" });
        }

        // OTP is valid, remove it from store
        delete otpStore[email];

        return res.json({ message: "Email verified successfully!" });
    } catch (error) {
        console.error("Verify OTP error:", error);
        res.status(500).json({ error: "Server error" });
    }
});




// ✅ Fetch Users Grouped by Department (Admin-Only Route)
app.get("/api/users/grouped", verifyToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res
        .status(403)
        .json({ message: "Access denied. Admins only." });
    }

    const groupedUsers = await User.aggregate([
      {
        $group: {
          _id: "$department",
          title: { $first: "$department" },
          data: { $push: { _id: "$_id", fullName: "$fullName", email: "$email", studentId: "$studentId", department: "$department" } },
        },
      },
      { $sort: { title: 1 } },
    ]);

    res.status(200).json(groupedUsers);
  } catch (error) {
    console.error("Error fetching grouped users:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


// ✅ Health check endpoint
app.get("/health", (req, res) => {
    res
        .status(200)
        .json({ status: "ok", serverTime: new Date().toISOString() });
});

// ✅ Error handling middleware
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    if (err instanceof multer.MulterError) {
        console.error("Multer error:", err.message);
        if (err.code === "LIMIT_FILE_SIZE") {
            return res
                .status(400)
                .json({ message: "❌ File is too large. Maximum size is 5MB." });
        }
        return res
            .status(400)
            .json({ message: `❌ Multer error: ${err.message}` });
    }
    console.error("Server error:", err.message);
    res
        .status(500)
        .json({ message: "❌ Server error", error: err.message });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
createDefaultAdmin(); 
console.log("enter");


