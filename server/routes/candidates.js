const express = require('express');
const router = express.Router();
const { getCache, getProfileLookup } = require('../lib/cache');

// GET /api/candidates
// Query params: page, limit, sort_by, title, min_score, max_score
router.get('/', (req, res) => {
  const {
    page = '1',
    limit = '25',
    sort_by = 'rank',
    title = '',
    min_score,
    max_score,
  } = req.query;

  let candidates = getCache();

  if (candidates.length === 0) {
    return res.status(503).json({
      error: 'No candidates loaded. Run the ranking engine first.',
    });
  }

  // --- Filters ---

  if (title) {
    const q = title.toLowerCase();
    candidates = candidates.filter((c) =>
      (c.title || '').toLowerCase().includes(q)
    );
  }

  if (min_score !== undefined) {
    candidates = candidates.filter((c) => c.total_score >= Number(min_score));
  }

  if (max_score !== undefined) {
    candidates = candidates.filter((c) => c.total_score <= Number(max_score));
  }

  // --- Sort ---

  if (sort_by === 'score') {
    candidates = [...candidates].sort((a, b) => b.total_score - a.total_score);
  } else if (sort_by === 'experience') {
    candidates = [...candidates].sort((a, b) => (b.experience || 0) - (a.experience || 0));
  }
  // default: rank — already sorted in the JSON file

  // --- Pagination ---

  const total = candidates.length;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const start = (pageNum - 1) * limitNum;
  const sliced = candidates.slice(start, start + limitNum);

  // Return a lighter shape for the list view — full breakdown is on the detail endpoint
  const lookup = getProfileLookup();
  const rows = sliced.map((c) => ({
    rank: c.rank,
    candidate_id: c.candidate_id,
    name: lookup.get(c.candidate_id)?.name ?? null,
    title: c.title,
    experience: c.experience,
    companies: c.companies,
    total_score: c.total_score,
    breakdown: {
      base_score: c.breakdown?.base_score,
      availability_mult: c.breakdown?.availability_mult,
      penalties: c.breakdown?.penalties,
    },
    flags: c.flags,
    explanation: c.explanation,
  }));

  res.json({
    total,
    page: pageNum,
    limit: limitNum,
    total_pages: Math.ceil(total / limitNum),
    candidates: rows,
  });
});

// GET /api/candidates/:id
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const cache = getCache();

  const candidate = cache.find((c) => c.candidate_id === id);

  if (!candidate) {
    return res.status(404).json({ error: `Candidate ${id} not found.` });
  }

  // Merge profile enrichment if available (populated async after server starts)
  const profile = getProfileLookup().get(id);
  res.json({ ...candidate, ...(profile ?? {}) });
});

module.exports = router;
