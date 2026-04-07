const express = require('express');
const router = express.Router();
const prisma = require('../db');
const authMiddleware = require('../middleware/auth');

// Create a trade request (protected, costs 1 time credit)
router.post('/', authMiddleware, async (req, res) => {
  const { offeredSkillId, requestedSkillId } = req.body;
  if (!offeredSkillId || !requestedSkillId) {
    return res.status(400).json({ error: 'offeredSkillId and requestedSkillId are required' });
  }

  try {
    // Find the requested skill to get the receiver
    const requestedSkill = await prisma.skill.findUnique({
      where: { id: requestedSkillId },
      include: { user: true }
    });

    if (!requestedSkill) {
      return res.status(404).json({ error: 'Requested skill not found' });
    }

    if (requestedSkill.userId === req.userId) {
      return res.status(400).json({ error: 'You cannot trade with yourself' });
    }

    // Check requester has enough credits
    const requester = await prisma.user.findUnique({ where: { id: req.userId } });
    if (requester.timeCredits < 1) {
      return res.status(400).json({ error: 'Insufficient time credits to make a trade request' });
    }

    // Check for existing pending trade between these two for these skills
    const existing = await prisma.tradeRequest.findFirst({
      where: {
        requesterId: req.userId,
        requestedSkillId,
        offeredSkillId,
        status: 'PENDING'
      }
    });
    if (existing) {
      return res.status(400).json({ error: 'A pending trade request already exists for this skill pair' });
    }

    // Create trade and deduct credit atomically
    const [trade] = await prisma.$transaction([
      prisma.tradeRequest.create({
        data: {
          requesterId: req.userId,
          receiverId: requestedSkill.userId,
          offeredSkillId,
          requestedSkillId,
        },
        include: {
          requester: { select: { id: true, name: true, avatar: true } },
          receiver: { select: { id: true, name: true, avatar: true } },
          offeredSkill: true,
          requestedSkill: true,
        }
      }),
      prisma.user.update({
        where: { id: req.userId },
        data: { timeCredits: { decrement: 1 } }
      })
    ]);

    res.status(201).json({ success: true, trade });
  } catch (error) {
    console.error('Create trade error:', error);
    res.status(500).json({ error: 'Failed to create trade request' });
  }
});

// Get all trades for logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [sent, received] = await Promise.all([
      prisma.tradeRequest.findMany({
        where: { requesterId: req.userId },
        include: {
          receiver: { select: { id: true, name: true, avatar: true, location: true } },
          offeredSkill: true,
          requestedSkill: true,
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.tradeRequest.findMany({
        where: { receiverId: req.userId },
        include: {
          requester: { select: { id: true, name: true, avatar: true, location: true } },
          offeredSkill: true,
          requestedSkill: true,
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    res.json({ sent, received });
  } catch (error) {
    console.error('Get trades error:', error);
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
});

// Update trade status (accept / reject / complete)
router.patch('/:id/status', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowed = ['ACCEPTED', 'REJECTED', 'COMPLETED'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${allowed.join(', ')}` });
  }

  try {
    const trade = await prisma.tradeRequest.findUnique({ where: { id } });
    if (!trade) return res.status(404).json({ error: 'Trade not found' });

    // Only receiver can accept/reject; either party can mark completed
    if ((status === 'ACCEPTED' || status === 'REJECTED') && trade.receiverId !== req.userId) {
      return res.status(403).json({ error: 'Only the receiver can accept or reject a trade' });
    }

    const updateData = { status };

    // If completing a trade, award reputation points to both parties
    const updates = [
      prisma.tradeRequest.update({ where: { id }, data: updateData })
    ];

    if (status === 'COMPLETED') {
      updates.push(
        prisma.user.update({ where: { id: trade.requesterId }, data: { reputationPoints: { increment: 10 } } }),
        prisma.user.update({ where: { id: trade.receiverId }, data: { reputationPoints: { increment: 10 } } })
      );
    }

    const [updatedTrade] = await prisma.$transaction(updates);
    res.json({ success: true, trade: updatedTrade });
  } catch (error) {
    console.error('Update trade status error:', error);
    res.status(500).json({ error: 'Failed to update trade status' });
  }
});

module.exports = router;
