// const jwt = require("jsonwebtoken");

// const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_key";

// const authenticateToken = (req, res, next) => {
//   const token = req.headers.authorization?.split(" ")[1];
//   if (!token) return res.status(403).json({ message: "❌ Access denied. No token provided." });

//   try {
//     const decoded = jwt.verify(token, JWT_SECRET);
//     req.user = decoded;
//     next();
//   } catch (error) {
//     res.status(401).json({ message: "❌ Invalid token" });
//   }
// };

// module.exports = authenticateToken;

const jwt = require("jsonwebtoken");

// JWT Authentication Middleware
const verifyToken = (req, res, next) => {
  try {
    const token = req.header("Authorization");
    
    if (!token) {
      return res.status(403).json({ message: "❌ Access Denied! No token provided." });
    }
    
    const tokenParts = token.split(" ");
    const actualToken = tokenParts.length === 2 && tokenParts[0] === "Bearer" ? tokenParts[1] : token;
    
    const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(401).json({ message: "❌ Invalid or expired token!" });
  }
};

module.exports = { verifyToken };