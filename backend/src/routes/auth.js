const express  = require('express');
const router   = express.Router();
const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');
const prisma   = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

// ── Validation helpers ────────────────────────────────────────────────────────
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const validateSignup = ({ name, email, password, location }) => {
  const errors = {};

  const nm = (name || '').trim();
  if (!nm)              errors.name = 'Name is required';
  else if (nm.length < 2)  errors.name = 'Name must be at least 2 characters';
  else if (nm.length > 50) errors.name = 'Name must be under 50 characters';

  const em = (email || '').trim().toLowerCase();
  if (!em)                  errors.email = 'Email is required';
  else if (!isValidEmail(em)) errors.email = 'Enter a valid email address';

  const pw = password || '';
  if (!pw)               errors.password = 'Password is required';
  else if (pw.length < 8)    errors.password = 'Password must be at least 8 characters';
  else if (!/\d/.test(pw))   errors.password = 'Password must contain at least one number';

  const loc = (location || '').trim();
  if (!loc)             errors.location = 'Location is required';
  else if (loc.length < 2) errors.location = 'Enter a valid location';

  return errors;
};

const validateLogin = ({ email, password }) => {
  const errors = {};

  const em = (email || '').trim();
  if (!em)                  errors.email = 'Email is required';
  else if (!isValidEmail(em)) errors.email = 'Enter a valid email address';

  if (!password) errors.password = 'Password is required';

  return errors;
};

// ── POST /api/auth/signup ─────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  const errors = validateSignup(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ error: 'Validation failed', errors });
  }

  const name     = req.body.name.trim();
  const email    = req.body.email.trim().toLowerCase();
  const password = req.body.password;
  const location = req.body.location.trim();

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({
        error: 'Account already exists',
        errors: { email: 'An account with this email already exists' },
      });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user   = await prisma.user.create({
      data: { name, email, password: hashed, location },
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...safe } = user;
    res.status(201).json({ token, user: safe });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const errors = validateLogin(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ error: 'Validation failed', errors });
  }

  const email    = req.body.email.trim().toLowerCase();
  const password = req.body.password;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        errors: { email: 'No account found with this email' },
      });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        errors: { password: 'Incorrect password' },
      });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...safe } = user;
    res.json({ token, user: safe });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
