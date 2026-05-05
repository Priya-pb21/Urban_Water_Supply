const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const pool = require('./config/db');
const logger = require('./config/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { initSocket } = require('./services/socketService');

const authRoutes = require('./routes/authRoutes');
const areaRoutes = require('./routes/areaRoutes');
const demandRoutes = require('./routes/demandRoutes');
const supplyRoutes = require('./routes/supplyRoutes');
const allocationRoutes = require('./routes/allocationRoutes');
const issueRoutes = require('./routes/issueRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174')
  .split(',')
  .map((origin) => origin.trim());

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
};

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

initSocket(io);

io.use((socket, next) => {
  const userId = socket.handshake.auth?.userId;
  socket.user = { id: userId || 'guest' };
  next();
});

io.on('connection', (socket) => {
  socket.join(`user:${socket.user.id}`);
  logger.info(`Socket connected for user ${socket.user.id}`);
});

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', async (req, res, next) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      success: true,
      message: 'Urban Water Supply API is running',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/demand', demandRoutes);
app.use('/api/supply', supplyRoutes);
app.use('/api/allocation', allocationRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(notFound);
app.use(errorHandler);

server.listen(PORT, () => {
  logger.info(`Urban Water Supply API listening on port ${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});
