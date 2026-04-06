const express = require('express');
const router = express.Router();

// Mock Skills Data
const MOCK_SKILLS = [
  { id: 1, title: 'Advanced React', category: 'Tech', distance: 2.4, rating: 4.8 },
  { id: 2, title: 'Figma UI Design', category: 'Design', distance: 5.1, rating: 5.0 }
];

router.get('/', async (req, res) => {
  // In real app: Fetch from Prisma using geospatial queries
  res.json(MOCK_SKILLS);
});

router.post('/', async (req, res) => {
  const { title, description, category, proficiencyLevel } = req.body;
  // In real app: prisma.skill.create(...)
  res.json({ success: true, skill: { id: 3, title, description, category } });
});

module.exports = router;
