const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || "manikanta");
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ success: false, message: "Invalid or expired token" });
    }
};

module.exports = authMiddleware;
