require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { loadCache, buildProfileLookup } = require('./lib/cache');

const healthRoute = require('./routes/health');
const candidatesRoute = require('./routes/candidates');
const analyticsRoute = require('./routes/analytics');
const rankRoute = require('./routes/rank');

const app = express();
const PORT = process.env.PORT || 8000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// --- Middleware ---

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(morgan('dev'));
app.use(express.json());

// --- Routes ---

app.use('/api/health', healthRoute);
app.use('/api/candidates', candidatesRoute);
app.use('/api/analytics', analyticsRoute);
app.use('/api/rank', rankRoute);

// --- 404 fallback ---

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// --- Load ranking results, then start server, then enrich profiles ---

loadCache();

app.listen(PORT, () => {
  console.log(`\nRedrob API running at http://localhost:${PORT}`);
  console.log(`Accepting requests from: ${CLIENT_ORIGIN}\n`);
  // Stream candidates.jsonl in background to enrich top-100 with profile data
  buildProfileLookup();
});
