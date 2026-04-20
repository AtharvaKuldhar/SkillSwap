const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Generic proxy helper — fails gracefully so the app still works if AI is down
const proxyAI = async (path, method = 'GET', body = null) => {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  return fetch(`${AI_URL}${path}`, opts);
};

// ── POST /api/ai/recommend ────────────────────────────────────────────────────
// Returns skills ranked by hybrid match score for the logged-in user
router.post('/recommend', auth, async (req, res) => {
  try {
    const aiRes = await proxyAI('/recommend', 'POST', { user_id: req.userId });
    const data  = await aiRes.json();
    if (!aiRes.ok) return res.status(aiRes.status).json(data);
    res.json(data);
  } catch (err) {
    console.warn('AI service unavailable (recommend):', err.message);
    // Graceful degradation — frontend will fall back to unscored list
    res.json({ recommendations: [], ai_available: false });
  }
});

// ── GET /api/ai/match/:targetUserId ──────────────────────────────────────────
// Bidirectional compatibility score between logged-in user and another
router.get('/match/:targetUserId', auth, async (req, res) => {
  try {
    const aiRes = await proxyAI(`/match-score/${req.userId}/${req.params.targetUserId}`);
    const data  = await aiRes.json();
    if (!aiRes.ok) return res.status(aiRes.status).json(data);
    res.json(data);
  } catch (err) {
    console.warn('AI service unavailable (match-score):', err.message);
    res.json({ score: null, reason: 'AI service unavailable' });
  }
});

// ── GET /api/ai/insights ──────────────────────────────────────────────────────
// Skill gap analysis and trending categories for the logged-in user
router.get('/insights', auth, async (req, res) => {
  try {
    const aiRes = await proxyAI(`/skill-insights/${req.userId}`);
    const data  = await aiRes.json();
    if (!aiRes.ok) return res.status(aiRes.status).json(data);
    res.json(data);
  } catch (err) {
    console.warn('AI service unavailable (insights):', err.message);
    res.json({ trending_categories: [], skill_gap_suggestions: [], your_unique_skills: [], demand_areas: [] });
  }
});

// ── POST /api/ai/retrain ──────────────────────────────────────────────────────
// Trigger model retraining after significant data changes
router.post('/retrain', auth, async (req, res) => {
  try {
    const aiRes = await proxyAI('/retrain', 'POST');
    const data  = await aiRes.json();
    res.json(data);
  } catch (err) {
    console.warn('AI retrain unavailable:', err.message);
    res.json({ message: 'AI service unavailable' });
  }
});

// ── GET /api/ai/health ────────────────────────────────────────────────────────
router.get('/health', async (req, res) => {
  try {
    const aiRes = await proxyAI('/health');
    const data  = await aiRes.json();
    res.json(data);
  } catch {
    res.json({ status: 'unavailable' });
  }
});

module.exports = router;
