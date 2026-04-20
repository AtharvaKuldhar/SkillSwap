const express = require('express');
const router  = express.Router();
const prisma  = require('../db');
const auth    = require('../middleware/auth');

const VALID_CATEGORIES   = ['Technology','Design','Marketing','Business','Language','Music','Arts','Fitness','Cooking','Other'];
const VALID_LEVELS       = ['Beginner','Intermediate','Advanced','Expert'];

// ── GET /api/skills ───────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const skills = await prisma.skill.findMany({
      include: {
        user: { select: { id: true, name: true, location: true, avatar: true, reputationPoints: true } },
      },
    });
    res.json(skills);
  } catch (err) {
    console.error('Fetch skills error:', err);
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
});

// ── POST /api/skills ──────────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  const { title, description, category, proficiencyLevel } = req.body;

  const errors = {};
  const t = (title || '').trim();
  const d = (description || '').trim();

  if (!t)            errors.title = 'Title is required';
  else if (t.length < 3)   errors.title = 'Title must be at least 3 characters';
  else if (t.length > 100) errors.title = 'Title must be under 100 characters';

  if (!d)                errors.description = 'Description is required';
  else if (d.length < 10)    errors.description = 'Description must be at least 10 characters';
  else if (d.length > 500)   errors.description = 'Description must be under 500 characters';

  if (!category)                           errors.category = 'Category is required';
  else if (!VALID_CATEGORIES.includes(category)) errors.category = 'Invalid category';

  if (!proficiencyLevel)                         errors.proficiencyLevel = 'Proficiency level is required';
  else if (!VALID_LEVELS.includes(proficiencyLevel)) errors.proficiencyLevel = 'Invalid proficiency level';

  if (Object.keys(errors).length) {
    return res.status(400).json({ error: 'Validation failed', errors });
  }

  try {
    const skill = await prisma.skill.create({
      data: { title: t, description: d, category, proficiencyLevel, userId: req.userId },
      include: { user: { select: { id: true, name: true, location: true } } },
    });
    res.status(201).json({ success: true, skill });
  } catch (err) {
    console.error('Create skill error:', err);
    res.status(500).json({ error: 'Failed to create skill' });
  }
});

// ── PATCH /api/skills/:id ─────────────────────────────────────────────────────
router.patch('/:id', auth, async (req, res) => {
  const { id } = req.params;

  try {
    const skill = await prisma.skill.findUnique({ where: { id } });
    if (!skill)                       return res.status(404).json({ error: 'Skill not found' });
    if (skill.userId !== req.userId)  return res.status(403).json({ error: 'Not your skill' });

    const { title, description, category, proficiencyLevel } = req.body;
    const data = {};

    if (title !== undefined) {
      const t = title.trim();
      if (t.length < 3)   return res.status(400).json({ error: 'Title must be at least 3 characters' });
      if (t.length > 100) return res.status(400).json({ error: 'Title must be under 100 characters' });
      data.title = t;
    }
    if (description !== undefined) {
      const d = description.trim();
      if (d.length < 10)  return res.status(400).json({ error: 'Description must be at least 10 characters' });
      if (d.length > 500) return res.status(400).json({ error: 'Description must be under 500 characters' });
      data.description = d;
    }
    if (category !== undefined) {
      if (!VALID_CATEGORIES.includes(category)) return res.status(400).json({ error: 'Invalid category' });
      data.category = category;
    }
    if (proficiencyLevel !== undefined) {
      if (!VALID_LEVELS.includes(proficiencyLevel)) return res.status(400).json({ error: 'Invalid proficiency level' });
      data.proficiencyLevel = proficiencyLevel;
    }

    if (!Object.keys(data).length) return res.status(400).json({ error: 'No valid fields provided' });

    const updated = await prisma.skill.update({ where: { id }, data });
    res.json({ success: true, skill: updated });
  } catch (err) {
    console.error('Update skill error:', err);
    res.status(500).json({ error: 'Failed to update skill' });
  }
});

// ── DELETE /api/skills/:id ────────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;

  try {
    const skill = await prisma.skill.findUnique({ where: { id } });
    if (!skill)                      return res.status(404).json({ error: 'Skill not found' });
    if (skill.userId !== req.userId) return res.status(403).json({ error: 'Not your skill' });

    await prisma.skill.delete({ where: { id } });
    res.json({ success: true, message: 'Skill deleted' });
  } catch (err) {
    if (err.code === 'P2003') {
      return res.status(400).json({ error: 'Cannot delete a skill involved in an active trade' });
    }
    console.error('Delete skill error:', err);
    res.status(500).json({ error: 'Failed to delete skill' });
  }
});

module.exports = router;
