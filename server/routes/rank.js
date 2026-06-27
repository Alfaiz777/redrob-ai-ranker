const express = require('express');
const router = express.Router();
const { runRankingEngine } = require('../lib/python');
const { loadCache, setMetadata } = require('../lib/cache');

let rankingInProgress = false;
let lastRunMeta = null;

// POST /api/rank
// Body: { top_n?: number, background?: boolean }
//
// background: true  → responds in <1s, Python runs in background (~33s with --parallel)
//                     Poll GET /api/rank/status every 3s for completion.
// background: false → waits for Python to finish before responding.
//                     Only use this in Postman for direct testing.
//
// NOTE: "async" was renamed to "background" because "async" is a reserved
//       keyword in JavaScript and causes silent parsing failures in Express.
router.post('/', async (req, res) => {
  if (rankingInProgress) {
    return res.status(409).json({
      error: 'A ranking run is already in progress. Please wait.',
      tip: 'Poll GET /api/rank/status to check progress.',
    });
  }

  const top_n = req.body.top_n || 100;
  const background = req.body.background === true;

  rankingInProgress = true;
  const startTime = Date.now();

  async function execute() {
    await runRankingEngine({ topN: top_n });
    loadCache();
    const runtimeSeconds = Math.round(((Date.now() - startTime) / 1000) * 10) / 10;
    lastRunMeta = {
      status: 'complete',
      ranked_at: new Date().toISOString(),
      runtime_seconds: runtimeSeconds,
      top_n,
    };
    setMetadata({ last_runtime_seconds: runtimeSeconds });
    return lastRunMeta;
  }

  // Background mode — for the React UI
  // Responds instantly. React polls /api/rank/status every 3s.
  // When in_progress flips to false, the UI re-fetches /api/candidates.
  if (background) {
    res.json({
      status: 'started',
      message: 'Ranking started in background (~60s with threaded parallel mode).',
      tip: 'Poll GET /api/rank/status. When in_progress=false, call GET /api/candidates for fresh results.',
    });

    execute()
      .catch((err) => {
        console.error('[rank] Background engine failed:', err.message);
        lastRunMeta = { status: 'failed', error: err.message };
      })
      .finally(() => {
        rankingInProgress = false;
      });

    return;
  }

  // Sync mode — waits for completion (Postman testing only)
  try {
    const meta = await execute();
    res.json(meta);
  } catch (err) {
    console.error('[rank] Engine failed:', err.message);
    res.status(500).json({
      error: 'Ranking engine failed.',
      detail: err.message,
    });
  } finally {
    rankingInProgress = false;
  }
});

// GET /api/rank/status
// React UI polls this every 3s after triggering a re-rank.
router.get('/status', (req, res) => {
  res.json({
    in_progress: rankingInProgress,
    last_run: lastRunMeta,
  });
});

module.exports = router;
