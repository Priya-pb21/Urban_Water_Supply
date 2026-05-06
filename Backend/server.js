import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import pool from './config/db.js';
import logger from './config/logger.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { initSocket } from './services/socketService.js';

import authRoutes from './routes/authRoutes.js';
import areaRoutes from './routes/areaRoutes.js';
import demandRoutes from './routes/demandRoutes.js';
import supplyRoutes from './routes/supplyRoutes.js';
import allocationRoutes from './routes/allocationRoutes.js';
import issueRoutes from './routes/issueRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import creditsRouter from './routes/credits.js';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    const isLocalDev = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || '');
    if (!origin || isLocalDev || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
};

const io = new Server(server, {
  cors: {
    origin(origin, callback) {
      const isLocalDev = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || '');
      if (!origin || isLocalDev || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
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
app.use('/api/credits', creditsRouter);

app.use(notFound);
app.use(errorHandler);

server.listen(PORT, () => {
  logger.info(`Urban Water Supply API listening on port ${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});