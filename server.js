const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const passportLocalMongoose = require('passport-local-mongoose');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(session({ secret: 'secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/mychatapp', { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', userSchema);

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.request.user);

  socket.on('message', async (data) => {
    const { user, content } = data;
    const message = new Message({ user, content });
    await message.save();
    io.emit('message', message);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.request.user);
  });
});

// Add authentication routes and middleware
app.post('/login', passport.authenticate('local'), (req, res) => {
  res.sendStatus(200);
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.register(new User({ username }), password);
    passport.authenticate('local')(req, res, () => {
      res.sendStatus(200);
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get('/logout', (req, res) => {
  req.logout();
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
