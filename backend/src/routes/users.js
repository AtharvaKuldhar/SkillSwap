const express = require('express');
const router  = express.Router();
const prisma  = require('../db');
const auth    = require('../middleware/auth');

// ── GET /api/users/me ─────────────────────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        skillsOffered: true,
        reviewsReceived: {
          include: { reviewer: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
        },
        tradeRequestsSent:     { where: { status: 'COMPLETED' }, select: { id: true } },
        tradeRequestsReceived: { where: { status: 'COMPLETED' }, select: { id: true } },
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const totalTrades = user.tradeRequestsSent.length + user.tradeRequestsReceived.length;
    const avgRating = user.reviewsReceived.length
      ? (user.reviewsReceived.reduce((s, r) => s + r.rating, 0) / user.reviewsReceived.length).toFixed(1)
      : null;

    const { password, tradeRequestsSent, tradeRequestsReceived, ...rest } = user;

    res.json({
      ...rest,
      stats: {
        totalTrades,
        avgRating,
        skillCount:   user.skillsOffered.length,
        reviewCount:  user.reviewsReceived.length,
      },
    });
  } catch (err) {
    console.error('GET /users/me error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ── PATCH /api/users/me ───────────────────────────────────────────────────────
router.patch('/me', auth, async (req, res) => {
  const { name, location, avatar } = req.body;
  const data = {};

  if (name !== undefined) {
    const nm = name.trim();
    if (nm.length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters' });
    if (nm.length > 50) return res.status(400).json({ error: 'Name must be under 50 characters' });
    data.name = nm;
  }

  if (location !== undefined) {
    const loc = location.trim();
    if (!loc) return res.status(400).json({ error: 'Location cannot be empty' });
    data.location = loc;
  }

  if (avatar !== undefined) {
    data.avatar = avatar || null;
  }

  if (!Object.keys(data).length) {
    return res.status(400).json({ error: 'No valid fields provided' });
  }

  try {
    const user = await prisma.user.update({ where: { id: req.userId }, data });
    const { password: _, ...safe } = user;
    res.json(safe);
  } catch (err) {
    console.error('PATCH /users/me error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
