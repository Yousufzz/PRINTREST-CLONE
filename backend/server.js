const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── In-Memory Cache ────────────────────────────────────────────
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
  // Prevent memory leak — cap at 100 entries
  if (cache.size > 100) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
}

// Export cache helpers for routes
app.locals.getCached = getCached;
app.locals.setCache = setCache;

// ─── Middleware ──────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ─── API Routes ─────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/photos', require('./routes/photos'));
app.use('/api/search', require('./routes/search'));
app.use('/api/topics', require('./routes/topics'));


// ─── Health Check ───────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', cache_size: cache.size });
});

// ─── Clean Page Shortcuts ───────────────────────────────────────
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'about.html')));
app.get('/settings', (req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'settings.html')));
app.get('/auth', (req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'auth.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'auth.html')));
app.get('/search', (req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'search.html')));
app.get('/saved', (req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'saved.html')));

// ─── Catch-all: Serve index.html for SPA-like navigation ───────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});


// ─── Global Error Handler ───────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ─── Start Server ───────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║                                           ║
  ║   🎯 PinAI Server Running                 ║
  ║   📡 http://localhost:${PORT}               ║
  ║   🔑 API Key: ${process.env.UNSPLASH_KEY ? '✅ Loaded' : '❌ MISSING'}              ║
  ║                                           ║
  ╚═══════════════════════════════════════════╝
  `);

  if (!process.env.UNSPLASH_KEY || process.env.UNSPLASH_KEY === 'YOUR_ACCESS_KEY_HERE') {
    console.warn('⚠️  WARNING: Set your Unsplash API key in .env file!');
    console.warn('   Get one at: https://unsplash.com/developers\n');
  }
});
