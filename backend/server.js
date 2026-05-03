const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const { validateEnv } = require('./config/validateEnv');
const { errorHandler } = require('./middleware/error');

const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const examRoutes = require('./routes/examRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

dotenv.config();
validateEnv();

const app = express();

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

const corsOptions =
  process.env.ALLOWED_ORIGINS && process.env.ALLOWED_ORIGINS.trim().length > 0
    ? {
        origin(origin, callback) {
          const allowed = process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean);
          if (!origin || allowed.includes('*') || allowed.includes(origin)) {
            callback(null, true);
          } else {
            callback(null, false);
          }
        },
        credentials: true,
      }
    : undefined;

// Security & Logging Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    hsts:
      process.env.NODE_ENV === 'production'
        ? { maxAge: 31536000, includeSubDomains: true }
        : false,
  })
);
app.use(process.env.NODE_ENV === 'production' ? morgan('combined') : morgan('dev'));
app.use(corsOptions ? cors(corsOptions) : cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Deep health — load balancers + Kubernetes probes use this (no Mongo = unhealthy)
const getDbState = () => {
  const s = mongoose.connection.readyState;
  const map = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  return map[s] || 'unknown';
};

// Liveness — process is accepting requests (use for platform “is the app up?”)
app.get('/api/health', (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    success: true,
    message: 'LMS Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: getDbState(),
    databaseReady: dbConnected,
    version: require('./package.json').version || 'unknown',
    uptimeSec: Math.floor(process.uptime()),
  });
});

app.get('/api/health/ready', (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ success: false, ready: false, database: getDbState() });
  }
  res.status(200).json({ success: true, ready: true, database: 'connected' });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);

// Handle 404 for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Centralized Error Handler (must be AFTER routes)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

let httpServer;

const shutdown = (signal) => {
  console.log(`${signal}: closing HTTP + Mongo connections…`);
  const finishDb = async () => {
    try {
      await mongoose.disconnect();
    } catch (e) {
      console.error(e);
    }
    process.exit(0);
  };

  const hardKill = () => setTimeout(() => process.exit(1), 12_000).unref();

  if (httpServer) {
    httpServer.close((err) => {
      if (err) console.error(err);
      hardKill();
      finishDb();
    });
  } else {
    hardKill();
    finishDb();
  }
};

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));

mongoose.set('strictQuery', true);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    httpServer = app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
