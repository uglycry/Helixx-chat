const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Connect to MongoDB (you need to have MongoDB installed locally or use a cloud service)
mongoose.connect('mongodb://localhost:27017/mychatapp', { useNewUrlParser: true, useUnifiedTopology: true });

// Define a simple schema for messages
const messageSchema = new mongoose.Schema({
  user: String,
  content: String,
  timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

io.on('connection', (socket) => {
  console.log('User connected');

  // Listen for messages
  socket.on('message', async (data) => {
    const { user, content } = data;
    const message = new Message({ user, content });
    await message.save();
    io.emit('message', message);
  });

  // Listen for disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Serve static files (e.g., HTML, CSS, client-side JS)
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
