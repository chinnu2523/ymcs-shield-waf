const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { User } = require("./db");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("CRITICAL ERROR: JWT_SECRET environment variable is not set.");
  process.exit(1);
}
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "visaka";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "visaka"; // default password

async function seedAdminUser() {
  try {
    const mongoose = require("mongoose");
    if (mongoose.connection.readyState !== 1) {
      console.warn("⚠️  Skipping Admin Seeding: Database not connected. (Using In-Memory Fallback)");
      return;
    }
    const existingAdmin = await User.findOne({ username: ADMIN_USERNAME });
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await User.create({ username: ADMIN_USERNAME, passwordHash, role: "superadmin" });
      console.log("🔐 Superadmin user seeded successfully");
    }
  } catch (error) {
    console.error("Error seeding admin user:", error.message);
  }
}

async function login(username, password) {
  const mongoose = require("mongoose");
  if (mongoose.connection.readyState !== 1) {
    throw new Error("SECURE_DATABASE_OFFLINE");
  }
  const user = await User.findOne({ username });
  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, JWT_SECRET, {
    expiresIn: "1h",
  });

  return { token, user: { username: user.username, role: user.role } };
}

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized access. Valid token required." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

module.exports = { seedAdminUser, login, verifyToken };
