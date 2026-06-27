const fs = require("fs");
const readline = require("readline");
const path = require("path");

const TOP_100_PATH = path.join(__dirname, "..", "..", "output", "top_100.json");
const CANDIDATES_JSONL_PATH = path.join(__dirname, "..", "..", "data", "candidates.jsonl");

let candidatesCache = [];
let lastRankedAt = null;
let metadata = {
  total_processed: 100000,
  disqualified: 40093,
};

// candidate_id → enriched profile data (built async after server starts)
let profileLookup = new Map();

function loadCache() {
  try {
    const raw = fs.readFileSync(TOP_100_PATH, "utf-8");
    candidatesCache = JSON.parse(raw);
    lastRankedAt = new Date().toISOString();
    console.log(`[cache] Loaded ${candidatesCache.length} candidates from top_100.json`);
  } catch (err) {
    console.warn("[cache] Could not load top_100.json — run the ranking engine first.");
    console.warn(`[cache] Expected file at: ${TOP_100_PATH}`);
    candidatesCache = [];
    lastRankedAt = null;
  }
}

// Streams candidates.jsonl to find profile data for the top-100.
// Runs in the background after server starts; non-blocking.
function buildProfileLookup(onComplete) {
  if (!fs.existsSync(CANDIDATES_JSONL_PATH) || candidatesCache.length === 0) {
    console.warn("[cache] Skipping profile enrichment — candidates.jsonl not found or cache empty");
    if (onComplete) onComplete();
    return;
  }

  const targetIds = new Set(candidatesCache.map((c) => c.candidate_id));
  let found = 0;
  const total = targetIds.size;

  console.log(`[cache] Enriching profiles for ${total} ranked candidates…`);

  const rl = readline.createInterface({
    input: fs.createReadStream(CANDIDATES_JSONL_PATH, { encoding: "utf-8" }),
    crlfDelay: Infinity,
  });

  rl.on("line", (line) => {
    if (found >= total) return;
    const trimmed = line.trim();
    if (!trimmed) return;

    // Cheap pre-check before full JSON.parse
    const idMatch = trimmed.match(/"candidate_id"\s*:\s*"([^"]+)"/);
    if (!idMatch || !targetIds.has(idMatch[1])) return;

    try {
      const c = JSON.parse(trimmed);
      profileLookup.set(c.candidate_id, {
        name:           c.profile?.anonymized_name ?? null,
        headline:       c.profile?.headline ?? null,
        summary:        c.profile?.summary ?? null,
        location:       c.profile?.location ?? null,
        country:        c.profile?.country ?? null,
        career_history: c.career_history ?? [],
        education:      c.education ?? [],
        skills:         (c.skills ?? []).slice(0, 25),
        certifications: c.certifications ?? [],
        languages:      c.languages ?? [],
        redrob_signals: c.redrob_signals ?? null,
      });
      found++;
      if (found >= total) rl.close();
    } catch (_) {
      // skip malformed lines
    }
  });

  rl.on("close", () => {
    console.log(`[cache] Profile enrichment done: ${found}/${total} candidates enriched`);
    if (onComplete) onComplete();
  });

  rl.on("error", (err) => {
    console.warn("[cache] Profile enrichment error:", err.message);
    if (onComplete) onComplete();
  });
}

function getCache() {
  return candidatesCache;
}

function getProfileLookup() {
  return profileLookup;
}

function getLastRankedAt() {
  return lastRankedAt;
}

function getMetadata() {
  return metadata;
}

function setMetadata(data) {
  metadata = { ...metadata, ...data };
}

module.exports = {
  loadCache,
  buildProfileLookup,
  getCache,
  getProfileLookup,
  getLastRankedAt,
  getMetadata,
  setMetadata,
};
