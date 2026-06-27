const express = require('express');
const router = express.Router();
const { getCache, getLastRankedAt } = require('../lib/cache');

// GET /api/health
router.get('/', (req, res) => {
  const cache = getCache();

  res.json({
    status: 'ok',
    candidates_loaded: cache.length,
    last_ranked_at: getLastRankedAt(),
    engine_version: 'career-evidence-v2',
  });
});

module.exports = router;
