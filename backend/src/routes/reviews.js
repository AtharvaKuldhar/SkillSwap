const express = require('express');
const router  = express.Router();
const prisma  = require('../db');
const auth    = require('../middleware/auth');

// ── POST /api/reviews ─────────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  const { tradeId, rating, comment } = req.body;

  // Validate
  if (!tradeId) return res.status(400).json({ error: 'tradeId is required' });
  const r = parseInt(rating, 10);
  if (!rating || isNaN(r) || r < 1 || r > 5) {
    return res.status(400).json({ error: 'rating must be an integer between 1 and 5' });
  }
  if (comment && comment.length > 1000) {
    return res.status(400).json({ error: 'Comment must be under 1000 characters' });
  }

  try {
    const trade = await prisma.tradeRequest.findUnique({ where: { id: tradeId } });
    if (!trade)                       return res.status(404).json({ error: 'Trade not found' });
    if (trade.status !== 'COMPLETED') return res.status(400).json({ error: 'Can only review completed trades' });

    // Reviewer must be a party of the trade
    if (trade.requesterId !== req.userId && trade.receiverId !== req.userId) {
      return res.status(403).json({ error: 'You are not a party of this trade' });
    }

    const revieweeId = trade.requesterId === req.userId ? trade.receiverId : trade.requesterId;

    const review = await prisma.review.create({
      data: {
        rating:     r,
        comment:    comment?.trim() || null,
        reviewerId: req.userId,
        revieweeId,
        tradeId,
      },
      include: {
        reviewer: { select: { id: true, name: true, avatar: true } },
        reviewee: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Award reputation points (rating × 2)
    await prisma.user.update({
      where: { id: revieweeId },
      data:  { reputationPoints: { increment: r * 2 } },
    });

    res.status(201).json({ success: true, review });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'You have already reviewed this trade' });
    }
    console.error('Create review error:', err);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// ── GET /api/reviews/user/:userId ─────────────────────────────────────────────
router.get('/user/:userId', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where:   { revieweeId: req.params.userId },
      include: { reviewer: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const avgRating = reviews.length
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

    res.json({ reviews, avgRating, count: reviews.length });
  } catch (err) {
    console.error('Get reviews error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

module.exports = router;
