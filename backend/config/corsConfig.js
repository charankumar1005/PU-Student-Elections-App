// CORS Configuration
const allowedOrigins = [
  "http://localhost:3000", 
  "http://localhost:8081",
  "exp://10.58.13.13:8081",  // Add Expo development URL
  "http://10.58.13.13:8081",  // Add your actual frontend URL
  "http://10.58.13.13:19000" // Common Expo port
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`Origin ${origin} not allowed by CORS`);
      callback(null, true); // For development, allow all origins but log for debugging
    }
  },
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true // Allow cookies if needed
};

module.exports = corsOptions;