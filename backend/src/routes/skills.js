const express = require('express');
const router = express.Router();
const prisma = require('../db');
const authMiddleware = require('../middleware/auth');

// Get all skills with their offering user
router.get('/', async (req, res) => {
  try {
    const skills = await prisma.skill.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            location: true,
            avatar: true,
            reputationPoints: true
          }
        }
      }
    });
    res.json(skills);
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
});

// Create a new skill (Protected)
router.post('/', authMiddleware, async (req, res) => {
  const { title, description, category, proficiencyLevel } = req.body;
  if (!title || !description || !category || !proficiencyLevel) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const skill = await prisma.skill.create({
      data: {
        title,
        description,
        category,
        proficiencyLevel,
        userId: req.userId 
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            location: true
          }
        }
      }
    });
    res.status(201).json({ success: true, skill });
  } catch (error) {
    console.error('Error creating skill:', error);
    res.status(500).json({ error: 'Failed to create skill' });
  }
});

module.exports = router;
