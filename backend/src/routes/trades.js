const express = require('express');
const router  = express.Router();
const prisma  = require('../db');
const auth    = require('../middleware/auth');

// Valid status transitions to prevent illegal state changes
const TRANSITIONS = {
  ACCEPTED:  ['PENDING'],
  REJECTED:  ['PENDING'],
  COMPLETED: ['ACCEPTED'],
};

// ── POST /api/trades ──────────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  const { offeredSkillId, requestedSkillId } = req.body;
  if (!offeredSkillId || !requestedSkillId) {
    return res.status(400).json({ error: 'offeredSkillId and requestedSkillId are required' });
  }
  if (offeredSkillId === requestedSkillId) {
    return res.status(400).json({ error: 'Cannot trade a skill for itself' });
  }

  try {
    // Validate offered skill belongs to requester
    const offeredSkill = await prisma.skill.findUnique({ where: { id: offeredSkillId } });
    if (!offeredSkill) return res.status(404).json({ error: 'Offered skill not found' });
    if (offeredSkill.userId !== req.userId) {
      return res.status(403).json({ error: 'You can only offer your own skills' });
    }

    // Validate requested skill
    const requestedSkill = await prisma.skill.findUnique({
      where: { id: requestedSkillId },
      include: { user: true },
    });
    if (!requestedSkill) return res.status(404).json({ error: 'Requested skill not found' });
    if (requestedSkill.userId === req.userId) {
      return res.status(400).json({ error: 'You cannot trade with yourself' });
    }

    // Time credit check
    const requester = await prisma.user.findUnique({ where: { id: req.userId } });
    if (requester.timeCredits < 1) {
      return res.status(400).json({ error: 'Insufficient time credits to make a trade request' });
    }

    // Duplicate guard
    const existing = await prisma.tradeRequest.findFirst({
      where: { requesterId: req.userId, offeredSkillId, requestedSkillId, status: 'PENDING' },
    });
    if (existing) {
      return res.status(400).json({ error: 'A pending trade for this skill pair already exists' });
    }

    // Atomic: create trade + deduct credit
    const [trade] = await prisma.$transaction([
      prisma.tradeRequest.create({
        data: {
          requesterId:      req.userId,
          receiverId:       requestedSkill.userId,
          offeredSkillId,
          requestedSkillId,
        },
        include: {
          requester:     { select: { id: true, name: true, avatar: true } },
          receiver:      { select: { id: true, name: true, avatar: true } },
          offeredSkill:  true,
          requestedSkill: true,
        },
      }),
      prisma.user.update({
        where: { id: req.userId },
        data:  { timeCredits: { decrement: 1 } },
      }),
    ]);

    res.status(201).json({ success: true, trade });
  } catch (err) {
    console.error('Create trade error:', err);
    res.status(500).json({ error: 'Failed to create trade request' });
  }
});

// ── GET /api/trades ───────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const [sent, received] = await Promise.all([
      prisma.tradeRequest.findMany({
        where:   { requesterId: req.userId },
        include: {
          receiver:      { select: { id: true, name: true, avatar: true, location: true } },
          offeredSkill:  true,
          requestedSkill: true,
          review:        true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.tradeRequest.findMany({
        where:   { receiverId: req.userId },
        include: {
          requester:     { select: { id: true, name: true, avatar: true, location: true } },
          offeredSkill:  true,
          requestedSkill: true,
          review:        true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({ sent, received });
  } catch (err) {
    console.error('Get trades error:', err);
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
});

// ── PATCH /api/trades/:id/status ──────────────────────────────────────────────
router.patch('/:id/status', auth, async (req, res) => {
  const { id }     = req.params;
  const { status } = req.body;

  const ALLOWED = ['ACCEPTED', 'REJECTED', 'COMPLETED'];
  if (!ALLOWED.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${ALLOWED.join(', ')}` });
  }

  try {
    const trade = await prisma.tradeRequest.findUnique({ where: { id } });
    if (!trade) return res.status(404).json({ error: 'Trade not found' });

    // Authorization
    const isRequester = trade.requesterId === req.userId;
    const isReceiver  = trade.receiverId  === req.userId;
    if (!isRequester && !isReceiver) {
      return res.status(403).json({ error: 'You are not a party of this trade' });
    }
    if ((status === 'ACCEPTED' || status === 'REJECTED') && !isReceiver) {
      return res.status(403).json({ error: 'Only the receiver can accept or reject a trade' });
    }

    // Status flow guard
    if (!TRANSITIONS[status].includes(trade.status)) {
      return res.status(400).json({
        error: `Cannot move to ${status} from ${trade.status}`,
      });
    }

    const updates = [
      prisma.tradeRequest.update({ where: { id }, data: { status } }),
    ];

    if (status === 'COMPLETED') {
      updates.push(
        prisma.user.update({ where: { id: trade.requesterId }, data: { reputationPoints: { increment: 10 } } }),
        prisma.user.update({ where: { id: trade.receiverId  }, data: { reputationPoints: { increment: 10 } } }),
      );
    }

    const [updatedTrade] = await prisma.$transaction(updates);

    // Notify the other party via socket if io is available
    const io = req.app.get('io');
    if (io) {
      const notifyId = isReceiver ? trade.requesterId : trade.receiverId;
      io.to(notifyId).emit('trade_update', { tradeId: id, status });
    }

    res.json({ success: true, trade: updatedTrade });
  } catch (err) {
    console.error('Update trade status error:', err);
    res.status(500).json({ error: 'Failed to update trade status' });
  }
});

module.exports = router;
