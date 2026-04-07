const express = require('express');
const router = express.Router();
const prisma = require('../db');
const authMiddleware = require('../middleware/auth');

// Submit a review for a completed trade
router.post('/', authMiddleware, async (req, res) => {
  const { tradeId, rating, comment } = req.body;
  if (!tradeId || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'tradeId and rating (1-5) are required' });
  }

  try {
    const trade = await prisma.tradeRequest.findUnique({ where: { id: tradeId } });
    if (!trade) return res.status(404).json({ error: 'Trade not found' });
    if (trade.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Can only review completed trades' });
    }

    // Determine who is being reviewed
    const revieweeId = trade.requesterId === req.userId ? trade.receiverId : trade.requesterId;

    const review = await prisma.review.create({
      data: {
        rating: parseInt(rating),
        comment: comment || null,
        reviewerId: req.userId,
        revieweeId,
        tradeId,
      },
      include: {
        reviewer: { select: { id: true, name: true, avatar: true } },
        reviewee: { select: { id: true, name: true, avatar: true } },
      }
    });

    // Update reviewee's reputation points based on rating
    await prisma.user.update({
      where: { id: revieweeId },
      data: { reputationPoints: { increment: rating * 2 } }
    });

    res.status(201).json({ success: true, review });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'You have already reviewed this trade' });
    }
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// Get all reviews for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { revieweeId: req.params.userId },
      include: {
        reviewer: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' }
    });

    const avgRating = reviews.length
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

    res.json({ reviews, avgRating, count: reviews.length });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

module.exports = router;
