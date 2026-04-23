require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes   = require('./routes/auth');
const skillRoutes  = require('./routes/skills');
const tradeRoutes  = require('./routes/trades');
const reviewRoutes = require('./routes/reviews');
const userRoutes   = require('./routes/users');
const aiRoutes     = require('./routes/ai');

const app    = express();
const server = http.createServer(app);

const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

const io = new Server(server, {
  cors: { origin: FRONTEND_URL, methods: ['GET', 'POST'] }
});

app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

// Make io accessible inside route handlers via req.app.get('io')
app.set('io', io);

// ── Routes ──────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));
app.use('/api/auth',    authRoutes);
app.use('/api/skills',  skillRoutes);
app.use('/api/trades',  tradeRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users',   userRoutes);
app.use('/api/ai',      aiRoutes);

// ── Socket.io ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // Each user joins a room named after their userId so we can target them
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('request_trade', (data) => {
    io.to(data.receiverId).emit('trade_notification', {
      type: 'NEW_REQUEST',
      message: `${data.senderName} wants to trade skills with you!`,
      ...data,
    });
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// ── Global error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
