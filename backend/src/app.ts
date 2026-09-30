import express, { Express } from 'express';
import cors from 'cors';
import path from 'path';
import projectsRoutes from './routes/projects.routes';
import mediaRoutes from './routes/media.routes';
import searchRoutes from './routes/search.routes';
import comparisonsRoutes from './routes/comparisons.routes';
import reportsRoutes from './routes/reports.routes';
import verificationRoutes from './routes/verification.routes';
import storiesRoutes from './routes/stories.routes';
import dashboardRoutes from './routes/dashboard.routes';
import projectIntelligenceRoutes from './routes/project-intelligence.routes';
import { errorHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/logger.middleware';
import { dashboardController } from './controllers/dashboard.controller';
import { getPersistenceStatus } from './config/database';
import analyticsRoutes from './routes/analytics.routes';
import notificationsRoutes from './routes/notifications.routes';

const app: Express = express();

// 1. CORS Middleware (Must be FIRST to ensure all requests, preflights, and errors include CORS headers)
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server, curl, mobile apps, or local dev origins
    if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    const configuredOrigins = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map((val) => val.trim())
      : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://localhost:3001'];

    if (configuredOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Allow in dev mode
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// 2. Serve static sample images and assets
app.use('/static', express.static(path.join(__dirname, '../public')));

// 3. Body parsers and logger
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(requestLogger);

// 4. Rate Limiting (generous in development)
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const rateLimitWindowMs = 60_000;
const rateLimitMax = Number(process.env.RATE_LIMIT_PER_MINUTE || (process.env.NODE_ENV === 'production' ? 120 : 5000));

app.use((req, res, next) => {
  const now = Date.now();
  const key = req.ip || 'unknown';
  const current = requestCounts.get(key);
  const entry = !current || current.resetAt <= now
    ? { count: 1, resetAt: now + rateLimitWindowMs }
    : { count: current.count + 1, resetAt: current.resetAt };

  requestCounts.set(key, entry);
  if (entry.count > rateLimitMax) {
    return res.status(429).json({
      error: {
        message: 'Too many requests. Please try again shortly.',
        statusCode: 429,
        retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
      },
    });
  }
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ImpactLens Backend',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    persistence: getPersistenceStatus(),
  });
});

app.get('/api/system/status', (req, res) => {
  res.json({ persistence: getPersistenceStatus(), aiMode: process.env.GEMINI_API_KEY || process.env.AI_API_KEY ? 'live' : 'fallback' });
});

// API Routes
app.use('/api/projects', projectIntelligenceRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/comparisons', comparisonsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/verifications', verificationRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationsRoutes);

// Convenience aliases for frontend compatibility
app.get('/api/stats', (req, res, next) => dashboardController.getStats(req, res, next));

// Error Handler
app.use(errorHandler);

export default app;
