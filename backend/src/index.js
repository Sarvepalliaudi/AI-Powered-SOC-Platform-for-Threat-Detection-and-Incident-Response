require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const User = require('./models/User');

const authRoutes = require('./routes/auth');
const logRoutes = require('./routes/logs');
const alertRoutes = require('./routes/alerts');
const incidentRoutes = require('./routes/incidents');
const reportRoutes = require('./routes/reports');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
});

app.set('io', io);

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'AI-Powered SOC Platform API is running',
    version: '1.0.0',
    team: 'NA-042026 – Group A',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`Client disconnected: ${socket.id}`));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

const demoUsers = [
  { name: 'SOC Admin', email: 'admin@soc.local', password: 'admin123', role: 'admin' },
  { name: 'Sarvepalli Audi Siva BhanuVardhan', email: 'bhanu@soc.local', password: 'soc123', role: 'lead_analyst' },
  { name: 'Rishabh Sankhla', email: 'rishabh@soc.local', password: 'soc123', role: 'analyst' },
  { name: 'Kommi Moulika Naidu', email: 'moulika@soc.local', password: 'soc123', role: 'analyst' },
];

const bootstrapDemoUsers = async () => {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      console.log('No users found. Creating demo accounts...');
      await User.create(demoUsers);
      console.log('Demo user accounts created. Use admin@soc.local / admin123 or bhanu@soc.local / soc123.');
    }
  } catch (error) {
    console.error('Failed to bootstrap demo users:', error.message);
  }
};

const startServer = async () => {
  await connectDB();
  await bootstrapDemoUsers();
  server.listen(PORT, () => {
    console.log(`SOC Platform API running on port ${PORT}`);
  });
};

startServer();

module.exports = app;
