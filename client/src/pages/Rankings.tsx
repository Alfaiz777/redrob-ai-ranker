import { useState, useMemo } from 'react'
import { useAllCandidates } from '../hooks/useAllCandidates'
import type { Candidate } from '../types/index'
import { exportCandidatesReport } from '../utils/report'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RankingsProps {
  onViewCandidate: (id: string) => void
  shortlistedIds: Set<string>
  onToggleShortlist: (id: string) => void
}

interface Filters {
  search: string
  title: string
  company: string
  minScore: number
  maxExp: number
}

const DEFAULT_FILTERS: Filters = { search: '', title: '', company: '', minScore: 0, maxExp: 20 }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreBadgeCls(score: number) {
  if (score >= 300) return 'bg-secondary-container text-secondary'
  if (score >= 260) return 'bg-primary-container text-primary'
  if (score >= 220) return 'bg-orange-50 text-orange-700'
  return 'bg-surface-container text-on-surface-variant'
}


// ─── Rank Badge ───────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  const cls =
    rank === 1 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
    rank === 2 ? 'bg-slate-100 text-slate-600 border-slate-200' :
    rank === 3 ? 'bg-orange-100 text-orange-600 border-orange-200' :
    'bg-primary-container text-primary border-primary-container'
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${cls}`}>
      {rank}
    </div>
  )
}

// ─── Status Icons ─────────────────────────────────────────────────────────────

function StatusIcons({ candidate }: { candidate: Candidate }) {
  const highScore = (candidate.total_score ?? 0) >= 300
  const multiCo   = (candidate.companies?.length ?? 0) > 1
  const hasFlags  = (candidate.flags?.length ?? 0) > 0
  return (
    <div className="flex items-center gap-1">
      {highScore && <span className="material-icons-outlined text-secondary text-[15px]" title="Top scorer">bolt</span>}
      {multiCo   && <span className="material-icons-outlined text-primary text-[15px]" title="Multi-company">work_history</span>}
      {hasFlags  && <span className="material-icons-outlined text-orange-500 text-[15px]" title="Has risk flags">warning</span>}
    </div>
  )
}

// ─── Sidebar: AI Insights card ────────────────────────────────────────────────

function AISidebarCard({ all, filtered }: { all: Candidate[]; filtered: Candidate[] }) {
  const avgScore = filtered.length
    ? filtered.reduce((s, c) => s + (c.total_score ?? 0), 0) / filtered.length
    : 0

  const topCompany = (() => {
    const counts: Record<string, number> = {}
    filtered.forEach((c) => { if (c.companies?.[0]) counts[c.companies[0]] = (counts[c.companies[0]] ?? 0) + 1 })
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    return top ? top[0] : '—'
  })()

  const highScoreCount = filtered.filter((c) => (c.total_score ?? 0) >= 300).length

  const rows = [
    { icon: 'filter_list', label: 'Matching filter',   value: `${filtered.length} / ${all.length}` },
    { icon: 'grade',       label: 'Avg. score',         value: filtered.length ? avgScore.toFixed(1) : '—' },
    { icon: 'domain',      label: 'Top company',        value: topCompany },
    { icon: 'bolt',        label: 'Top scorers (≥300)', value: highScoreCount.toString() },
  ]

  return (
    <div className="bg-gradient-to-br from-tertiary to-primary rounded-xl p-5 text-white shadow-md">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-icons-outlined text-white/80 text-[18px]">auto_awesome</span>
        <div>
          <p className="text-xs font-bold">AI Insights</p>
          <p className="text-[10px] text-white/60">Live · from filtered view</p>
        </div>
      </div>
      <div className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-2.5 bg-white/10 rounded-lg p-2">
            <span className="material-icons-outlined text-white/70 text-[14px]">{r.icon}</span>
            <div className="min-w-0">
              <p className="text-[9px] text-white/60 uppercase tracking-wide">{r.label}</p>
              <p className="text-xs font-bold truncate">{r.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Sidebar: Shortlist panel ─────────────────────────────────────────────────

function ShortlistPanel({
  all,
  shortlistedIds,
  onToggle,
  onViewCandidate,
}: {
  all: Candidate[]
  shortlistedIds: Set<string>
  onToggle: (id: string) => void
  onViewCandidate: (id: string) => void
}) {
  const [search, setSearch] = useState('')

  const shortlisted = all
    .filter((c) => shortlistedIds.has(c.candidate_id))
    .filter((c) => !search || c.candidate_id.toLowerCase().includes(search.toLowerCase()) || (c.name ?? '').toLowerCase().includes(search.toLowerCase()))

  function handleExport() {
    const full = all.filter((c) => shortlistedIds.has(c.candidate_id))
    exportCandidatesReport(full, 'Candidate Shortlist')
  }

  return (
    <div className="bg-white rounded-xl border border-outline-variant shadow-sm flex flex-col overflow-hidden">
      <div className="px-4 py-3.5 border-b border-outline-variant flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-icons-outlined text-primary text-[16px]">bookmarks</span>
          <span className="text-sm font-bold text-on-surface">Shortlist</span>
          {shortlistedIds.size > 0 && (
            <span className="bg-primary text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
              {shortlistedIds.size}
            </span>
          )}
        </div>
        {shortlistedIds.size > 0 && (
          <button
            onClick={handleExport}
            className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
          >
            <span className="material-icons-outlined text-[12px]">download</span>
            Export
          </button>
        )}
      </div>

      {shortlistedIds.size > 3 && (
        <div className="px-3 pt-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search shortlist…"
            className="w-full text-xs px-3 py-1.5 bg-surface-low border border-outline-variant rounded-lg outline-none focus:ring-1 ring-primary"
          />
        </div>
      )}

      <div className="overflow-y-auto p-3 space-y-1.5 min-h-[80px] max-h-72">
        {shortlistedIds.size === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <span className="material-icons-outlined text-outline text-[28px]">bookmark_border</span>
            <p className="text-xs text-outline mt-1">Bookmark candidates to shortlist</p>
          </div>
        ) : shortlisted.length === 0 ? (
          <p className="text-xs text-outline text-center py-4">No matches</p>
        ) : (
          shortlisted.map((c) => (
            <div key={c.candidate_id} className="flex items-center gap-2 p-2 rounded-lg bg-surface-low hover:bg-surface-container transition group">
              <button onClick={() => onViewCandidate(c.candidate_id)} className="flex-1 min-w-0 text-left">
                <p className="text-xs font-semibold text-on-surface truncate">{c.name ?? c.candidate_id}</p>
                <p className="text-[10px] text-outline truncate">{c.name ? c.candidate_id : c.title}</p>
              </button>
              <span className="text-[10px] font-bold text-secondary flex-shrink-0">
                {(c.total_score ?? 0).toFixed(0)}
              </span>
              <button
                onClick={() => onToggle(c.candidate_id)}
                className="opacity-0 group-hover:opacity-100 transition text-outline hover:text-on-surface"
              >
                <span className="material-icons-outlined text-[14px]">close</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Rankings Page ────────────────────────────────────────────────────────────

export default function Rankings({ onViewCandidate, shortlistedIds, onToggleShortlist }: RankingsProps) {
  const { data, loading, error, refetch } = useAllCandidates()

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)

  const titles    = useMemo(() => [...new Set(data.map((c) => c.title).filter(Boolean))].sort(), [data])
  const companies = useMemo(() => [...new Set(data.flatMap((c) => c.companies ?? []).filter(Boolean))].sort(), [data])
  const maxExpInData = useMemo(() => Math.max(...data.map((c) => c.experience ?? 0), 15), [data])

  function setFilter<K extends keyof Filters>(key: K, val: Filters[K]) {
    setFilters((f) => ({ ...f, [key]: val }))
  }
  function clearFilters() { setFilters(DEFAULT_FILTERS) }

  const hasActiveFilters =
    filters.search !== '' || filters.title !== '' || filters.company !== '' ||
    filters.minScore > 0 || filters.maxExp < maxExpInData

  const filtered = useMemo(() => {
    let r = data
    if (filters.search) {
      const q = filters.search.toLowerCase()
      r = r.filter((c) =>
        c.candidate_id?.toLowerCase().includes(q) ||
        (c.name ?? '').toLowerCase().includes(q)
      )
    }
    if (filters.title)    r = r.filter((c) => c.title === filters.title)
    if (filters.company)  r = r.filter((c) => c.companies?.includes(filters.company))
    if (filters.minScore) r = r.filter((c) => (c.total_score ?? 0) >= filters.minScore)
    if (filters.maxExp < maxExpInData) r = r.filter((c) => (c.experience ?? 0) <= filters.maxExp)
    return r
  }, [data, filters, maxExpInData])

  const activeChips = [
    filters.search   && { label: `Search: ${filters.search}`,   clear: () => setFilter('search', '') },
    filters.title    && { label: `Title: ${filters.title}`,      clear: () => setFilter('title', '') },
    filters.company  && { label: `Company: ${filters.company}`,  clear: () => setFilter('company', '') },
    filters.minScore && { label: `Score ≥ ${filters.minScore}`,  clear: () => setFilter('minScore', 0) },
    filters.maxExp < maxExpInData && { label: `Exp ≤ ${filters.maxExp}y`, clear: () => setFilter('maxExp', maxExpInData) },
  ].filter(Boolean) as { label: string; clear: () => void }[]

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* Page header */}
      <div className="flex-shrink-0 bg-white border-b border-outline-variant px-6 py-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-on-surface">Candidate Rankings</h2>
          <p className="text-xs text-outline mt-0.5">
            {loading ? 'Loading…' : `${filtered.length} of ${data.length} candidates`}
            {shortlistedIds.size > 0 && ` · ${shortlistedIds.size} shortlisted`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refetch}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-on-surface-variant bg-white border border-outline-variant rounded-lg hover:bg-surface-low transition disabled:opacity-50"
          >
            <span className={`material-icons-outlined text-[15px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
            Refresh
          </button>
          <button
            onClick={() => exportCandidatesReport(data, 'Full Candidate Rankings')}
            disabled={loading || data.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary bg-primary-container border border-primary-container/60 rounded-lg hover:opacity-90 transition disabled:opacity-40"
          >
            <span className="material-icons-outlined text-[15px]">download</span>
            Export All
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex-shrink-0 bg-surface-low border-b border-outline-variant px-6 py-3 space-y-2">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <span className="material-icons-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[15px]">search</span>
            <input
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
              placeholder="Search by name or ID…"
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-outline-variant rounded-lg outline-none focus:ring-1 ring-primary w-36"
            />
          </div>

          <select
            value={filters.title}
            onChange={(e) => setFilter('title', e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-outline-variant rounded-lg outline-none focus:ring-1 ring-primary max-w-[160px] text-on-surface"
          >
            <option value="">All Titles</option>
            {titles.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>

          <select
            value={filters.company}
            onChange={(e) => setFilter('company', e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-outline-variant rounded-lg outline-none focus:ring-1 ring-primary max-w-[160px] text-on-surface"
          >
            <option value="">All Companies</option>
            {companies.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-outline whitespace-nowrap">Score ≥</span>
            <input
              type="range" min={0} max={400} step={10}
              value={filters.minScore}
              onChange={(e) => setFilter('minScore', Number(e.target.value))}
              className="w-20 accent-primary"
            />
            <span className="text-xs font-semibold text-on-surface w-7">{filters.minScore}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-outline whitespace-nowrap">Exp ≤</span>
            <input
              type="range" min={0} max={maxExpInData} step={1}
              value={filters.maxExp}
              onChange={(e) => setFilter('maxExp', Number(e.target.value))}
              className="w-20 accent-primary"
            />
            <span className="text-xs font-semibold text-on-surface w-8">{filters.maxExp}y</span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs font-semibold text-outline hover:text-on-surface transition"
            >
              <span className="material-icons-outlined text-[13px]">close</span>
              Clear
            </button>
          )}
        </div>

        {activeChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {activeChips.map((chip) => (
              <button
                key={chip.label}
                onClick={chip.clear}
                className="flex items-center gap-1 px-2 py-0.5 bg-primary-container text-primary text-[10px] font-semibold rounded-full hover:opacity-80 transition"
              >
                {chip.label}
                <span className="material-icons-outlined text-[10px]">close</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main: table + sidebar */}
      <div className="flex-1 flex overflow-hidden">

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {error && !loading && (
            <div className="m-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <span className="material-icons-outlined text-[18px] flex-shrink-0">error_outline</span>
              <div>
                <p className="font-semibold">Could not load candidates</p>
                <p className="text-xs mt-0.5 opacity-80">{error}</p>
                <button onClick={refetch} className="mt-2 text-xs font-semibold underline">Retry</button>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-outline">Loading candidates…</p>
            </div>
          )}

          {!loading && !error && (
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-surface-low border-b border-outline-variant text-[10px] font-bold text-outline uppercase tracking-widest">
                  <th className="px-4 py-3 w-10" />
                  <th className="px-4 py-3 text-center w-12">Rank</th>
                  <th className="px-4 py-3 text-left">Candidate</th>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Exp</th>
                  <th className="px-4 py-3 text-left">Top Company</th>
                  <th className="px-4 py-3 text-center">Score</th>
                  <th className="px-4 py-3 w-20" />
                  <th className="px-4 py-3 w-24" />
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-outline text-sm">
                      <span className="material-icons-outlined text-[32px] block mb-2">search_off</span>
                      No candidates match the current filters
                    </td>
                  </tr>
                )}
                {filtered.map((c) => (
                  <tr
                    key={c.candidate_id}
                    className={`group transition-colors hover:bg-surface-low ${
                      shortlistedIds.has(c.candidate_id) ? 'bg-primary-container/20' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => onToggleShortlist(c.candidate_id)}
                        title={shortlistedIds.has(c.candidate_id) ? 'Remove from shortlist' : 'Add to shortlist'}
                      >
                        <span className={`material-icons-outlined text-[18px] transition-colors ${
                          shortlistedIds.has(c.candidate_id)
                            ? 'text-primary'
                            : 'text-outline group-hover:text-on-surface-variant'
                        }`}>
                          {shortlistedIds.has(c.candidate_id) ? 'bookmark' : 'bookmark_border'}
                        </span>
                      </button>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-center"><RankBadge rank={c.rank} /></div>
                    </td>

                    <td className="px-4 py-3">
                      {c.name
                        ? <p className="font-semibold text-on-surface text-sm leading-tight">{c.name}</p>
                        : <p className="font-mono font-semibold text-on-surface text-xs">{c.candidate_id}</p>
                      }
                      {c.name && (
                        <p className="text-[10px] font-mono text-outline mt-0.5">{c.candidate_id}</p>
                      )}
                      {(c.flags?.length ?? 0) > 0 && (
                        <p className="text-[10px] text-orange-600 mt-0.5">{c.flags[0]}</p>
                      )}
                    </td>

                    <td className="px-4 py-3 text-xs text-on-surface-variant">{c.title ?? '—'}</td>

                    <td className="px-4 py-3 text-xs text-on-surface-variant">
                      {c.experience != null ? `${c.experience}y` : '—'}
                    </td>

                    <td className="px-4 py-3 text-xs text-on-surface-variant">{c.companies?.[0] ?? '—'}</td>

                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${scoreBadgeCls(c.total_score ?? 0)}`}>
                        {(c.total_score ?? 0).toFixed(0)}
                      </span>
                    </td>

                    <td className="px-4 py-3"><StatusIcons candidate={c} /></td>

                    <td className="px-4 py-3">
                      <button
                        onClick={() => onViewCandidate(c.candidate_id)}
                        className="flex items-center gap-0.5 text-[11px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition whitespace-nowrap"
                      >
                        View <span className="material-icons-outlined text-[12px]">arrow_forward</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Right sidebar */}
        <div className="w-72 flex-shrink-0 border-l border-outline-variant overflow-y-auto p-4 space-y-4 bg-surface-low">
          <AISidebarCard all={data} filtered={filtered} />
          <ShortlistPanel
            all={data}
            shortlistedIds={shortlistedIds}
            onToggle={onToggleShortlist}
            onViewCandidate={onViewCandidate}
          />
        </div>

      </div>
    </div>
  )
}
