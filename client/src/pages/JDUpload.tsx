import { useState, useEffect, useRef } from "react";
import api from "../api/client";
import type { RankStatus } from "../types";

// ─── Scoring signals our engine actually computes ─────────────────────────────
const SIGNALS = [
  { label: "Feature Coherence", icon: "psychology" },
  { label: "Experience Depth", icon: "schedule" },
  { label: "Career Trajectory", icon: "trending_up" },
  { label: "Product Signal", icon: "inventory_2" },
  { label: "Evidence Density", icon: "fact_check" },
  { label: "Skill Credibility", icon: "verified" },
  { label: "Ranking Systems", icon: "leaderboard" },
  { label: "Industry Match", icon: "domain" },
  { label: "Location Signal", icon: "place" },
  { label: "Availability", icon: "event_available" },
];

const PIPELINE_STEPS = [
  {
    icon: "description",
    label: "Job Description",
    sub: "Define your requirements",
    color: "bg-white border-outline-variant text-primary",
  },
  {
    icon: "science",
    label: "Signal Extraction",
    sub: "10 scoring signals applied",
    color: "bg-tertiary-container/10 border-tertiary/20 text-tertiary",
  },
  {
    icon: "search",
    label: "Candidate Retrieval",
    sub: "Scan 100,000 profiles",
    color: "bg-white border-outline-variant text-primary",
  },
  {
    icon: "trending_up",
    label: "Ranking Engine",
    sub: "Score & rank top 100",
    color: "bg-white border-outline-variant text-primary",
  },
  {
    icon: "verified",
    label: "Trusted Shortlist",
    sub: "Explainable top candidates",
    color: "bg-secondary-container border-secondary/20 text-secondary",
  },
];

const TRUST_CARDS = [
  {
    icon: "analytics",
    color: "text-primary",
    bg: "bg-primary-container",
    title: "Evidence-Based Ranking",
    body: "We don't just find keywords. Our AI analyzes actual career evidence to verify skills and accomplishments across 10 independent scoring signals.",
  },
  {
    icon: "psychology_alt",
    color: "text-tertiary",
    bg: "bg-tertiary-container",
    title: "Explainable Decisions",
    body: "Understand exactly why a candidate is ranked #1. Every score comes with a human-readable rationale and per-signal breakdown you can audit.",
  },
  {
    icon: "assignment_turned_in",
    color: "text-secondary",
    bg: "bg-secondary-container",
    title: "Recruiter-Friendly",
    body: "Filter, bookmark, and export shortlists instantly. No data science degree required — the interface is designed for how recruiters actually work.",
  },
];

const ACCEPTED_TYPES = [".txt", ".docx", ".doc"];

// ─── Engine Status Display ────────────────────────────────────────────────────

function EngineStatus({
  status,
  loading,
}: {
  status: RankStatus | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-outline">
        <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        Checking engine…
      </div>
    );
  }

  if (status?.in_progress) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-tertiary animate-pulse" />
        <span className="text-xs font-semibold text-tertiary">
          Ranking in progress…
        </span>
      </div>
    );
  }

  if (status?.last_run?.status === "complete") {
    const d = new Date(status.last_run.ranked_at);
    const timeAgo = Math.round((Date.now() - d.getTime()) / 60000);
    const label =
      timeAgo < 2
        ? "just now"
        : timeAgo < 60
          ? `${timeAgo}m ago`
          : `${Math.round(timeAgo / 60)}h ago`;
    return (
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
        <span className="text-xs font-semibold text-secondary">
          Last run {label} · {status.last_run.top_n} ranked in{" "}
          {status.last_run.runtime_seconds}s
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-2.5 h-2.5 rounded-full bg-outline-variant" />
      <span className="text-xs text-outline">
        Not yet ranked — click Run to start
      </span>
    </div>
  );
}

// ─── JD Upload Page ───────────────────────────────────────────────────────────

interface JDUploadProps {
  onRankingComplete: () => void;
}

interface FileState {
  name: string;
  words: number;
  error: string | null;
}

export default function JDUpload({ onRankingComplete }: JDUploadProps) {
  const [jdText, setJdText] = useState("");
  const [activeTab, setActiveTab] = useState<"paste" | "upload">("paste");
  const [rankStatus, setRankStatus] = useState<RankStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [justDone, setJustDone] = useState(false);
  const [triggerError, setTriggerError] = useState<string | null>(null);
  const [fileState, setFileState] = useState<FileState | null>(null);
  const [fileParsing, setFileParsing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  // Sync guard to prevent double-trigger if both rank buttons are clicked
  // before the first await resolves (isRunning wouldn't be true yet)
  const rankingGuard = useRef(false);

  const wordCount = jdText.trim()
    ? jdText.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const isRunning = polling || !!rankStatus?.in_progress;

  // Check status on mount
  useEffect(() => {
    api
      .get<RankStatus>("/rank/status")
      .then((res) => {
        setRankStatus(res.data);
        if (res.data.in_progress) setPolling(true);
      })
      .catch(() => {})
      .finally(() => setStatusLoading(false));
  }, []);

  // Sync the latest onRankingComplete into a ref so the interval can call it
  // without it being in the polling effect's dep array
  const onRankingCompleteRef = useRef(onRankingComplete);
  useEffect(() => {
    onRankingCompleteRef.current = onRankingComplete;
  });

  // Poll while in progress
  useEffect(() => {
    if (!polling) return;
    const id = setInterval(() => {
      api
        .get<RankStatus>("/rank/status")
        .then((res) => {
          setRankStatus(res.data);
          if (!res.data.in_progress) {
            setPolling(false);
            clearInterval(id);
            if (res.data.last_run?.status === "complete") {
              setJustDone(true);
              setTimeout(() => onRankingCompleteRef.current(), 2000);
            }
          }
        })
        .catch(() => {
          setPolling(false);
          clearInterval(id);
        });
    }, 2000);
    return () => clearInterval(id);
  }, [polling]);

  async function parseFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["txt", "docx", "doc"].includes(ext)) {
      setFileState({
        name: file.name,
        words: 0,
        error: "Only .txt and .docx files are supported",
      });
      return;
    }

    setFileParsing(true);
    setFileState(null);

    try {
      let text = "";

      if (ext === "txt") {
        text = await file.text();
      } else {
        // .docx / .doc — use mammoth for browser-side extraction
        const mammoth = await import("mammoth");
        const buf = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: buf });
        text = result.value;
      }

      const words = text.trim().split(/\s+/).filter(Boolean).length;
      setJdText(text);
      setFileState({ name: file.name, words, error: null });
    } catch {
      setFileState({
        name: file.name,
        words: 0,
        error: "Could not read file — try copy-pasting the text instead",
      });
    } finally {
      setFileParsing(false);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
  }

  async function handleRunRanking() {
    if (isRunning || rankingGuard.current) return;
    rankingGuard.current = true;
    setTriggerError(null);
    try {
      await api.post("/rank", { background: true });
      setPolling(true);
      setRankStatus((prev) => ({
        ...(prev ?? { last_run: null }),
        in_progress: true,
      }));
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      setTriggerError(
        e.response?.data?.error ?? e.message ?? "Failed to start ranking",
      );
    } finally {
      rankingGuard.current = false;
    }
  }

  return (
    <div className="bg-surface min-h-full overflow-y-auto">
      {/* Hero */}
      <div className="max-w-[1440px] mx-auto px-6 pt-10 pb-6">
        {/* Centered hero section */}
        <div className="text-center mb-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 bg-primary/8 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-5 border border-primary/20">
            <span className="material-icons-outlined text-[13px]">auto_awesome</span>
            Evidence-Based Talent Intelligence · 100K Candidates
          </div>
          <h1 className="text-5xl font-black text-on-surface leading-[1.1] mb-4 font-display tracking-tight">
            Find Your Best
            <span className="text-primary"> Candidates</span>
            <br />
            <span className="text-on-surface-variant font-bold text-4xl">in Under a Minute</span>
          </h1>
          <p className="text-base text-on-surface-variant leading-relaxed max-w-2xl mx-auto">
            Paste or upload your job description. Our AI engine scores 100,000 profiles
            across <span className="font-semibold text-on-surface">10 independent signals</span> and
            surfaces the top 100 with full evidence breakdowns — no guesswork, no bias.
          </p>
          {/* Trust signals */}
          <div className="flex items-center justify-center gap-6 mt-6 text-xs text-on-surface-variant">
            {[
              { icon: 'bolt', text: '~1 min runtime' },
              { icon: 'verified', text: 'Evidence-based scores' },
              { icon: 'psychology', text: '10 scoring signals' },
              { icon: 'leaderboard', text: 'Top 100 ranked' },
            ].map((s) => (
              <div key={s.text} className="flex items-center gap-1.5">
                <span className="material-icons-outlined text-primary text-[15px]">{s.icon}</span>
                <span>{s.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main intake grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-12">
          {/* ── Left: JD Input ──────────────────────────────────────────── */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
            {/* Tab bar */}
            <div className="flex items-center justify-between px-6 pt-5 pb-0 border-b border-outline-variant">
              <div className="flex gap-6">
                <button
                  onClick={() => setActiveTab("paste")}
                  className={`pb-4 text-sm font-semibold border-b-2 transition-colors ${
                    activeTab === "paste"
                      ? "text-primary border-primary"
                      : "text-on-surface-variant border-transparent hover:text-on-surface"
                  }`}
                >
                  Paste JD
                </button>
                <button
                  onClick={() => setActiveTab("upload")}
                  className={`pb-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === "upload"
                      ? "text-primary border-primary"
                      : "text-on-surface-variant border-transparent hover:text-on-surface"
                  }`}
                >
                  Upload File
                  <span className="text-[9px] bg-secondary-container text-secondary font-bold px-1.5 py-0.5 rounded-full">
                    .docx .txt
                  </span>
                </button>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-outline bg-surface-low px-2 py-1 rounded-lg border border-outline-variant mb-4">
                <span className="material-icons-outlined text-[11px] text-secondary">
                  check_circle
                </span>
                Auto-save Enabled
              </span>
            </div>

            {/* Content area */}
            <div className="p-6 space-y-4">
              {activeTab === "paste" ? (
                <>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-widest">
                    Job Description Content
                  </label>
                  <textarea
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    rows={14}
                    placeholder={`Paste your job description here…\n\nExample:\n  Role: Senior ML Engineer\n  We are looking for…`}
                    className="w-full bg-surface-low border border-outline-variant rounded-xl px-5 py-4 text-sm text-on-surface placeholder-outline leading-relaxed resize-none outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </>
              ) : (
                /* Upload tab */
                <div className="space-y-4">
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-widest">
                    Upload Job Description File
                  </label>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_TYPES.join(",")}
                    className="hidden"
                    onChange={handleFileInput}
                  />

                  {/* Drop zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() =>
                      !fileParsing && fileInputRef.current?.click()
                    }
                    className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition-all select-none
                      ${
                        dragOver
                          ? "border-primary bg-primary-container/20 scale-[1.01]"
                          : fileState?.error
                            ? "border-red-300 bg-red-50"
                            : fileState && !fileState.error
                              ? "border-secondary bg-secondary-container/10"
                              : "border-outline-variant bg-surface-low hover:border-primary/40 hover:bg-primary-container/5"
                      }
                      ${fileParsing ? "pointer-events-none" : ""}
                    `}
                    style={{ minHeight: "220px" }}
                  >
                    {fileParsing ? (
                      /* Parsing state */
                      <div className="flex flex-col items-center gap-3 py-10">
                        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm font-semibold text-on-surface">
                          Extracting text…
                        </p>
                        <p className="text-xs text-outline">
                          Reading {fileState?.name ?? "file"}
                        </p>
                      </div>
                    ) : fileState && !fileState.error ? (
                      /* Success state */
                      <div className="flex flex-col items-center gap-3 py-8 px-6 text-center">
                        <div className="w-14 h-14 bg-secondary-container rounded-full flex items-center justify-center">
                          <span className="material-icons-outlined text-secondary text-[28px]">
                            description
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-on-surface">
                            {fileState.name}
                          </p>
                          <p className="text-xs text-secondary font-semibold mt-0.5">
                            {fileState.words.toLocaleString()} words extracted
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-secondary bg-secondary-container px-3 py-1 rounded-full font-semibold">
                          <span className="material-icons-outlined text-[14px]">
                            check_circle
                          </span>
                          Ready to rank
                        </div>
                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTab("paste");
                            }}
                            className="text-xs text-primary underline underline-offset-2 hover:text-primary-dark"
                          >
                            View / edit text
                          </button>
                          <span className="text-outline text-xs">·</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              fileInputRef.current?.click();
                            }}
                            className="text-xs text-outline hover:text-on-surface underline underline-offset-2"
                          >
                            Replace file
                          </button>
                        </div>
                      </div>
                    ) : fileState?.error ? (
                      /* Error state */
                      <div className="flex flex-col items-center gap-3 py-8 px-6 text-center">
                        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="material-icons-outlined text-red-500 text-[28px]">
                            error_outline
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-on-surface">
                            {fileState.name}
                          </p>
                          <p className="text-xs text-red-600 mt-0.5">
                            {fileState.error}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                          className="text-xs text-primary underline underline-offset-2 hover:text-primary-dark"
                        >
                          Try another file
                        </button>
                      </div>
                    ) : (
                      /* Idle state */
                      <div className="flex flex-col items-center gap-3 py-10 px-6 text-center">
                        <div className="w-16 h-16 bg-primary-container/40 rounded-2xl flex items-center justify-center">
                          <span className="material-icons-outlined text-primary text-[32px]">
                            upload_file
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-on-surface">
                            Drag & drop or{" "}
                            <span className="text-primary underline underline-offset-2">
                              browse
                            </span>
                          </p>
                          <p className="text-xs text-outline mt-1">
                            Supports .docx and .txt files
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {ACCEPTED_TYPES.map((t) => (
                            <span
                              key={t}
                              className="text-[10px] bg-surface-container text-on-surface-variant px-2 py-0.5 rounded border border-outline-variant font-mono"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* If text was extracted, show a compact preview */}
                  {fileState && !fileState.error && jdText && (
                    <div className="bg-surface-low border border-outline-variant rounded-xl px-4 py-3">
                      <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1.5">
                        Preview
                      </p>
                      <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3 font-mono">
                        {jdText.slice(0, 300)}
                        {jdText.length > 300 ? "…" : ""}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Foot row */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                  {wordCount > 0 ? (
                    <span className="flex items-center gap-1 text-secondary">
                      <span className="material-icons-outlined text-[14px]">
                        check_circle
                      </span>
                      {wordCount} words detected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-outline">
                      <span className="material-icons-outlined text-[14px]">
                        edit_note
                      </span>
                      {activeTab === "paste"
                        ? "Paste a JD to begin"
                        : "Upload a file to begin"}
                    </span>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1">
                  <button
                    onClick={handleRunRanking}
                    disabled={isRunning}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed group"
                  >
                    {isRunning ? (
                      <>
                        <span className="material-icons-outlined text-[17px] animate-spin">
                          sync
                        </span>
                        Ranking…
                      </>
                    ) : justDone ? (
                      <>
                        <span className="material-icons-outlined text-[17px]">
                          check_circle
                        </span>
                        Done! Opening Rankings…
                      </>
                    ) : (
                      <>
                        Run Ranking Engine
                        <span className="material-icons-outlined text-[17px] group-hover:translate-x-0.5 transition-transform">
                          bolt
                        </span>
                      </>
                    )}
                  </button>
                  {/* Time estimate — shown when idle */}
                  {!isRunning && !justDone && (
                    <span className="text-[10px] text-outline flex items-center gap-0.5">
                      <span className="material-icons-outlined text-[11px]">
                        timer
                      </span>
                      Takes ~1 min for 100K profiles
                    </span>
                  )}
                </div>
              </div>

              {triggerError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  <span className="material-icons-outlined text-[15px] flex-shrink-0">
                    error_outline
                  </span>
                  {triggerError}
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Ranking Engine ────────────────────────────────────── */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Engine Status card */}
            <div className="relative bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden flex-1 flex flex-col">
              {/* Gradient accent border top */}
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary via-tertiary to-primary" />

              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                    <span className="material-icons-outlined text-tertiary text-[20px]">
                      psychology
                    </span>
                    AI Ranking Engine
                  </h2>
                  <div className="text-[10px] font-semibold bg-tertiary-container text-white px-2.5 py-1 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/80 inline-block" />
                    {isRunning ? "Running" : "Ready"}
                  </div>
                </div>

                {/* Live engine status */}
                <div className="mb-5 p-3 bg-surface-low rounded-xl border border-outline-variant">
                  <EngineStatus status={rankStatus} loading={statusLoading} />
                  {isRunning && (
                    <div className="mt-2.5">
                      <div className="h-1 bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-tertiary rounded-full animate-pulse w-3/4" />
                      </div>
                      <p className="text-[10px] text-outline mt-1">
                        Scoring 100,000 profiles — typically completes in ~1 min. Results open automatically.
                      </p>
                    </div>
                  )}
                  {justDone && !isRunning && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-secondary">
                      <span className="material-icons-outlined text-[15px]">
                        check_circle
                      </span>
                      Ranking complete — opening results…
                    </div>
                  )}
                </div>

                {/* Signal chips */}
                <div className="mb-5">
                  <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-2.5">
                    Scoring Signals (10 active)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {SIGNALS.map((s) => (
                      <span
                        key={s.label}
                        className="flex items-center gap-1 bg-surface-low border border-outline-variant text-on-surface text-[10px] font-medium px-2 py-0.5 rounded-lg"
                      >
                        <span className="material-icons-outlined text-[11px] text-primary">
                          {s.icon}
                        </span>
                        {s.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* AI note */}
                <div className="p-3 bg-white border border-tertiary/20 border-l-4 border-l-tertiary rounded-lg">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="material-icons-outlined text-tertiary text-[14px]">
                      lightbulb
                    </span>
                    <p className="text-[10px] font-bold text-tertiary uppercase tracking-wide">
                      How It Works
                    </p>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    Scores are weighted by career evidence quality — not keyword
                    frequency. Each signal independently verifies a different
                    dimension of candidate fit.
                  </p>
                </div>
              </div>
            </div>

            {/* Dataset Info Card */}
            <div className="relative bg-primary rounded-2xl shadow-lg shadow-primary/25 overflow-hidden">
              <div className="absolute -right-6 -top-6 opacity-10">
                <span className="material-icons-outlined text-white" style={{ fontSize: 100 }}>
                  groups
                </span>
              </div>
              <div className="relative z-10 p-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-icons-outlined text-white/80 text-[18px]">groups</span>
                  <h3 className="text-base font-bold text-white">Dataset Loaded</h3>
                </div>
                <p className="text-white/70 text-xs mb-5 leading-relaxed">
                  100,000 candidate profiles ready. Paste or upload your JD on
                  the left, then click <strong className="text-white">Run Ranking Engine</strong> to
                  score and surface the top 100.
                </p>

                <div className="grid grid-cols-3 gap-2 mb-5">
                  {[
                    { val: "100K", label: "Profiles" },
                    { val: "10", label: "Signals" },
                    { val: "Top 100", label: "Output" },
                  ].map((s) => (
                    <div key={s.label} className="bg-white/10 rounded-xl p-2.5 text-center border border-white/10">
                      <p className="text-white font-black text-sm">{s.val}</p>
                      <p className="text-white/60 text-[10px]">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 p-3 bg-white/10 rounded-xl border border-white/10">
                  <span className="material-icons-outlined text-white/60 text-[18px]">timer</span>
                  <div>
                    <p className="text-white text-xs font-semibold">Estimated runtime: ~1 min</p>
                    <p className="text-white/50 text-[10px]">Results auto-open when complete</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Pipeline Steps ────────────────────────────────────────────────── */}
        <section className="py-10 border-t border-outline-variant">
          <h2 className="text-2xl font-black text-on-surface text-center mb-10">
            The EvidentHire Pipeline
          </h2>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-8 left-0 w-full h-px bg-outline-variant z-0" />

            {PIPELINE_STEPS.map((step, i) => (
              <div
                key={step.label}
                className="relative z-10 flex flex-col items-center text-center w-36"
              >
                <div
                  className={`w-16 h-16 rounded-full border-2 flex items-center justify-center mb-3 shadow-sm bg-white ${step.color.includes("secondary") ? "border-secondary bg-secondary-container/30" : step.color.includes("tertiary") ? "border-tertiary/40 bg-tertiary-container/10" : "border-outline-variant"}`}
                >
                  <span
                    className={`material-icons-outlined text-[28px] ${step.color.split(" ").find((c) => c.startsWith("text-"))}`}
                  >
                    {step.icon}
                  </span>
                </div>
                <p className="text-xs font-bold text-on-surface mb-0.5">
                  {step.label}
                </p>
                <p className="text-[10px] text-outline leading-snug">
                  {step.sub}
                </p>
                {i < PIPELINE_STEPS.length - 1 && (
                  <span className="material-icons-outlined text-outline text-[18px] mt-2 md:hidden">
                    arrow_downward
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Trust Cards ───────────────────────────────────────────────────── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 py-8 border-t border-outline-variant">
          {TRUST_CARDS.map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-2xl border border-outline-variant shadow-sm p-6 text-center"
            >
              <div
                className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center mx-auto mb-4`}
              >
                <span
                  className={`material-icons-outlined ${card.color} text-[22px]`}
                >
                  {card.icon}
                </span>
              </div>
              <h3 className="text-base font-bold text-on-surface mb-2">
                {card.title}
              </h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {card.body}
              </p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
