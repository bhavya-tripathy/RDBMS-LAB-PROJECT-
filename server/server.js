const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

const { checkConnection } = require('./config/db');

// Route handlers
const dashboardRouter = require('./routes/dashboard');
const studentsRouter = require('./routes/students');
const authorsRouter = require('./routes/authors');
const booksRouter = require('./routes/books');
const issuesRouter = require('./routes/issues');
const returnsRouter = require('./routes/returns');
const reportsRouter = require('./routes/reports');
const databaseRouter = require('./routes/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow frontend development server
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logger for academic demo transparency
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[API] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const dbStatus = await checkConnection();
  res.json({
    status: 'ONLINE',
    timestamp: new Date().toISOString(),
    database: dbStatus
  });
});

// API Routes
app.use('/api/dashboard', dashboardRouter);
app.use('/api/students', studentsRouter);
app.use('/api/authors', authorsRouter);
app.use('/api/books', booksRouter);
app.use('/api/issues', issuesRouter);
app.use('/api/returns', returnsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/database', databaseRouter);

// Serve static frontend build if present in production
const clientBuildPath = path.resolve(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

// 404 Handler for API
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found.`
  });
});

// Fallback for SPA routing in production
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send(`
        <h1>Library Management System API Server</h1>
        <p>The Express backend is running on port ${PORT}.</p>
        <p>Run the Vite frontend via <code>npm run client</code> or <code>npm run dev --prefix client</code>.</p>
      `);
    }
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(500).json({
    success: false,
    message: 'An internal server error occurred.',
    error: err.message
  });
});

// Start HTTP Server
if (require.main === module) {
  app.listen(PORT, async () => {
    console.log('========================================================');
    console.log(`  LIBRARY MANAGEMENT SYSTEM - BACKEND SERVER RUNNING   `);
    console.log('========================================================');
    console.log(`  Local URL:        http://localhost:${PORT}`);
    console.log(`  Health Check:     http://localhost:${PORT}/api/health`);
    console.log(`  API Base:         http://localhost:${PORT}/api`);
    console.log('--------------------------------------------------------');

    // Run connection test
    const status = await checkConnection();
    if (status.connected) {
      console.log(`  MySQL Status:     CONNECTED (${status.user}@${status.host}:${status.port})`);
      console.log(`  Database:         ${status.database}`);
      console.log(`  Schema Ready:     ${status.schemaReady ? 'YES (All 5 tables present)' : 'NO (Missing: ' + status.missingTables.join(', ') + ')'}`);
    } else {
      console.log(`  MySQL Status:     NOT CONNECTED (${status.error})`);
      console.log(`  Note: Run 'npm run db:init' once MySQL service is started.`);
    }
    console.log('========================================================\n');
  });
}

module.exports = app;
