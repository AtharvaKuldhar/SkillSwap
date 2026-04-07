const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const skillRoutes = require('./routes/skills');
const tradeRoutes = require('./routes/trades');
const reviewRoutes = require('./routes/reviews');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});


app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/reviews', reviewRoutes);

// Socket.io for Real-time Notification
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('request_trade', (data) => {
    // emit to receiver
    io.to(data.receiverId).emit('trade_notification', {
      type: 'NEW_REQUEST',
      message: `${data.senderName} wants to trade skills with you!`,
      ...data
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
