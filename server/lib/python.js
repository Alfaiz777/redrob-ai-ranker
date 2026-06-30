const { spawn } = require("child_process");
const path = require("path");

const PYTHON_ROOT = path.join(__dirname, "..", "..");

function runRankingEngine({ topN = 100 } = {}) {
  return new Promise((resolve, reject) => {
    const args = [
      "-m",
      "src.rank",
      "--input",
      "data/candidates.jsonl",
      "--top",
      String(topN),
      "--output",
      "output/top_100.json",
      "--parallel",   // always use multiprocessing — ~25s vs 165s serial
    ];

    console.log(`[python] Spawning: python ${args.join(" ")}`);
    console.log(`[python] Working directory: ${PYTHON_ROOT}`);

    const python = spawn("python", args, {
      cwd: PYTHON_ROOT,
      env: process.env,
    });

    let stdout = "";
    let stderr = "";

    // Stream Python output to the server console so progress is visible
    python.stdout.on("data", (data) => {
      stdout += data.toString();
      process.stdout.write(`[python] ${data}`);
    });

    python.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    python.on("close", (code) => {
      if (code === 0) {
        console.log("[python] Ranking engine finished successfully.");
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Python engine exited with code ${code}.\n${stderr}`));
      }
    });

    python.on("error", (err) => {
      reject(new Error(`Failed to start Python process: ${err.message}`));
    });
  });
}

module.exports = { runRankingEngine };
