const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Register route
router.post('/register', async (req, res) => {
  try {
    const { name, department, registerNumber, yearOfStudy, email, password } = req.body;

    // Validate fields
    if (!name || !department || !registerNumber || !yearOfStudy || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user or email exists
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email exists' });
    if (await User.findOne({ registerNumber })) return res.status(400).json({ message: 'Register number exists' });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      department,
      registerNumber,
      yearOfStudy,
      email,
      passwordHash
    });

    // Generate token
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET);

    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET);

    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout route (client-side token clearance; server just acknowledges)
router.post('/logout', (req, res) => {
  // No server-side action needed for JWT; client will clear token
  res.json({ message: 'Logged out successfully' });
});

// Auth middleware (moved here for completeness)
function authMiddleware(req, res, next) {
  const token = req.headers['authorization']?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = decoded; // { id, email }
    next();
  });
}

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;