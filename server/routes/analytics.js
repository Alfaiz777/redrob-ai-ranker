const express = require('express');
const router = express.Router();
const { getCache, getMetadata } = require('../lib/cache');

// GET /api/analytics/summary
router.get('/summary', (req, res) => {
  const candidates = getCache();
  const meta = getMetadata();

  if (candidates.length === 0) {
    return res.status(503).json({ error: 'No candidates loaded.' });
  }

  const scores = candidates.map((c) => c.total_score);
  const experiences = candidates.map((c) => c.experience || 0);

  const avgScore =
    Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;

  const avgExperience =
    Math.round((experiences.reduce((a, b) => a + b, 0) / experiences.length) * 10) / 10;

  // --- Score distribution (buckets of 10 points) ---
  const minBucket = Math.floor(Math.min(...scores) / 10) * 10;
  const maxBucket = Math.ceil(Math.max(...scores) / 10) * 10;
  const score_distribution = [];

  for (let bucket = minBucket; bucket < maxBucket; bucket += 10) {
    const count = candidates.filter(
      (c) => c.total_score >= bucket && c.total_score < bucket + 10
    ).length;
    score_distribution.push({ range: `${bucket}-${bucket + 10}`, count });
  }

  // --- Top companies by candidate count ---
  const companyCounts = {};
  candidates.forEach((c) => {
    (c.companies || []).forEach((company) => {
      if (company) {
        companyCounts[company] = (companyCounts[company] || 0) + 1;
      }
    });
  });

  const top_companies = Object.entries(companyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([company, count]) => ({ company, count }));

  // --- Title breakdown ---
  const titleCounts = {};
  candidates.forEach((c) => {
    if (c.title) {
      titleCounts[c.title] = (titleCounts[c.title] || 0) + 1;
    }
  });

  const title_breakdown = Object.entries(titleCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([title, count]) => ({ title, count }));

  // --- Experience distribution ---
  const exp_distribution = [
    { range: '0-4y', count: candidates.filter((c) => (c.experience || 0) < 4).length },
    { range: '4-6y', count: candidates.filter((c) => (c.experience || 0) >= 4 && (c.experience || 0) < 6).length },
    { range: '6-8y', count: candidates.filter((c) => (c.experience || 0) >= 6 && (c.experience || 0) < 8).length },
    { range: '8-10y', count: candidates.filter((c) => (c.experience || 0) >= 8 && (c.experience || 0) < 10).length },
    { range: '10y+', count: candidates.filter((c) => (c.experience || 0) >= 10).length },
  ];

  // --- Penalised candidates ---
  const penalised = candidates.filter((c) => c.flags && c.flags.length > 0).length;

  res.json({
    total_candidates_ranked: candidates.length,
    total_processed: meta.total_processed,
    disqualified: meta.disqualified,
    avg_score: avgScore,
    avg_experience: avgExperience,
    penalised_in_top_100: penalised,
    score_distribution,
    top_companies,
    title_breakdown,
    exp_distribution,
  });
});

module.exports = router;
