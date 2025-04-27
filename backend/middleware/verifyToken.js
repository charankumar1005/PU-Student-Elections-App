// const verifyToken = (req, res, next) => {
//   const token = req.header("Authorization");
//   if (!token) return res.status(403).json({ message: "❌ Access Denied! No token provided." });

//   try {
//     const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
//     req.user = decoded; // Attach user data to request
//     next();
//   } catch (error) {
//     return res.status(401).json({ message: "❌ Invalid or expired token!" });
//   }
// };
const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access Denied! No token provided." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Session expired. Please log in again." });
      }
      return res.status(403).json({ message: "Invalid token!" });
    }

    req.user = user;
    next();
  });
};
