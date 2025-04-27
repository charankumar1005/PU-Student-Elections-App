
const verifyToken = (req, res, next) => {
  try {
    const token = req.header("Authorization");

    if (!token) {
      return res.status(403).json({ message: "Access Denied! No token provided." });
    }

    const tokenParts = token.split(" ");
    const actualToken = tokenParts.length === 2 && tokenParts[0] === "Bearer" ? tokenParts[1] : token;

    const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);
    req.user = decoded;

    // Check if the user is an admin for specific routes
    if (req.path === "/api/admin/users" && !req.user.isAdmin) {
      return res.status(403).json({ message: "Access denied. Only admins can view this page." });
    }

    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(401).json({ message: "Invalid or expired token!" });
  }
};
