const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

// Mock Auth logic for demo purposes
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  // In real app, verify with Prisma user
  
  if(email && password) {
    const token = jwt.sign({ userId: 'demo-user-id' }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { name: 'Atharva', email } });
  } else {
    res.status(400).json({ error: 'Invalid credentials' });
  }
});

router.post('/signup', async (req, res) => {
  const { name, email, password, location } = req.body;
  // In real app, create user in Prisma DB

  const token = jwt.sign({ userId: 'new-user-id' }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ token, user: { name, email, location } });
});

module.exports = router;
