import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useAnalytics } from '../hooks/useAnalytics'
import { useCandidates } from '../hooks/useCandidates'
import api from '../api/client'
import type { AnalyticsSummary, Candidate, RankStatus } from '../types/index'

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: string
  label: string
  value: string | number
  sub: ReactNode
  iconBg: string
  iconColor: string
  valueColor?: string
}

function StatCard({ icon, label, value, sub, iconBg, iconColor, valueColor = 'text-on-surface' }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-outline-variant p-5 shadow-sm flex gap-4 items-start">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <span className={`material-icons-outlined text-[22px] ${iconColor}`}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-widest text-outline">{label}</p>
        <p className={`text-2xl font-black mt-0.5 ${valueColor}`}>{value}</p>
        <p className="text-xs text-outline mt-0.5">{sub}</p>
      </div>
    </div>
  )
}

// ─── Score Distribution Chart ─────────────────────────────────────────────────

function ScoreChart({ data, loading }: { data: AnalyticsSummary['score_distribution']; loading: boolean }) {
  const max = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="bg-white rounded-xl border border-outline-variant p-6 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-bold text-on-surface">Score Distribution</h3>
        <span className="material-icons-outlined text-[18px] text-primary">bar_chart</span>
      </div>
      <p className="text-xs text-outline mb-5">Top 100 candidates by score range</p>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Bar area — flex-1 so bars fill available card height */}
          <div className="flex-1 min-h-0 flex items-end gap-1">
            {data.map((b) => {
              const h = Math.max((b.count / max) * 100, 4)
              return (
                <div key={b.range} className="flex-1 h-full relative group">
                  <div
                    className="absolute -top-6 left-1/2 -translate-x-1/2 bg-on-surface text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10"
                  >
                    {b.count}
                  </div>
                  <div
                    className="absolute bottom-0 w-full bg-primary rounded-t hover:bg-primary/70 transition-colors duration-150"
                    style={{ height: `${h}%` }}
                  />
                </div>
              )
            })}
          </div>
          {/* Labels row */}
          <div className="flex items-start gap-1 mt-2 border-t border-outline-variant/40 pt-2">
            {data.map((b) => (
              <span key={b.range} className="flex-1 text-center text-[9px] text-outline leading-tight">{b.range}</span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── AI Insights ──────────────────────────────────────────────────────────────

function AIInsights({
  analytics,
  topCandidate,
  loading,
}: {
  analytics: AnalyticsSummary | null
  topCandidate: Candidate | null
  loading: boolean
}) {
  if (loading || !analytics) {
    return (
      <div className="bg-white rounded-xl border border-outline-variant p-6 shadow-sm h-full flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-tertiary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const rows = [
    { icon: 'emoji_events', label: 'Top candidate score', value: topCandidate ? topCandidate.total_score.toFixed(0) : '—', cls: 'text-yellow-700 bg-yellow-50' },
    { icon: 'work', label: 'Most common title', value: analytics.title_breakdown?.[0]?.title ?? '—', cls: 'text-primary bg-primary-container' },
    { icon: 'domain', label: 'Top source company', value: analytics.top_companies?.[0]?.company ?? '—', cls: 'text-secondary bg-secondary-container' },
    { icon: 'schedule', label: 'Avg. experience', value: `${analytics.avg_experience?.toFixed(1) ?? '—'} yrs`, cls: 'text-tertiary bg-tertiary-container' },
    { icon: 'flag', label: 'Penalised in top 100', value: analytics.penalised_in_top_100.toString(), cls: 'text-orange-700 bg-orange-50' },
  ]

  return (
    <div className="bg-white rounded-xl border border-outline-variant p-6 shadow-sm h-full flex flex-col">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-tertiary-container flex items-center justify-center">
          <span className="material-icons-outlined text-tertiary text-[16px]">auto_awesome</span>
        </div>
        <div>
          <h3 className="text-sm font-bold text-on-surface">AI Insights</h3>
          <p className="text-[10px] text-outline">Derived from ranked results</p>
        </div>
      </div>

      <div className="flex-1 space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-low">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${r.cls}`}>
              <span className="material-icons-outlined text-[15px]">{r.icon}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-outline">{r.label}</p>
              <p className="text-xs font-bold text-on-surface truncate">{r.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-outline-variant flex items-center gap-1.5 text-[10px] text-outline">
        <span className="material-icons-outlined text-[13px] text-tertiary">verified</span>
        Evidence-based · no keyword bias
      </div>
    </div>
  )
}

// ─── Top Candidates Table ─────────────────────────────────────────────────────

function TopTable({
  candidates,
  loading,
  onViewCandidate,
}: {
  candidates: Candidate[]
  loading: boolean
  onViewCandidate?: (id: string) => void
}) {
  function scoreCls(s: number) {
    return s >= 300
      ? 'bg-secondary-container text-secondary'
      : s >= 260
      ? 'bg-primary-container text-primary'
      : 'bg-surface-container text-on-surface-variant'
  }

  return (
    <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
        <div>
          <h3 className="text-sm font-bold text-on-surface">Top Ranked Candidates</h3>
          <p className="text-xs text-outline mt-0.5">Highest scoring profiles from 100,000 candidates</p>
        </div>
        <button
          onClick={() => onViewCandidate?.('rankings')}
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
        >
          View all <span className="material-icons-outlined text-[13px]">arrow_forward</span>
        </button>
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-low text-[11px] font-bold text-outline uppercase tracking-wide">
              {['Rank', 'Candidate', 'Title', 'Experience', 'Top Company', 'Score', ''].map((h, i) => (
                <th key={i} className="px-5 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50">
            {candidates.map((c) => (
              <tr key={c.candidate_id} className="hover:bg-surface-low transition-colors group">
                <td className="px-5 py-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    c.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                    c.rank === 2 ? 'bg-slate-100 text-slate-600' :
                    c.rank === 3 ? 'bg-orange-100 text-orange-600' :
                    'bg-primary-container text-primary'
                  }`}>
                    {c.rank}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <p className="font-semibold text-on-surface text-xs">{c.candidate_id}</p>
                  {c.evidence_snippets?.[0] && (
                    <p className="text-[10px] text-outline truncate max-w-[160px] mt-0.5">{c.evidence_snippets[0]}</p>
                  )}
                </td>
                <td className="px-5 py-3 text-xs text-on-surface-variant">{c.title}</td>
                <td className="px-5 py-3 text-xs text-on-surface-variant">
                  {c.experience != null ? `${c.experience} yr${c.experience !== 1 ? 's' : ''}` : '—'}
                </td>
                <td className="px-5 py-3 text-xs text-on-surface-variant">{c.companies?.[0] ?? '—'}</td>
                <td className="px-5 py-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${scoreCls(c.total_score)}`}>
                    {c.total_score.toFixed(0)}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => onViewCandidate?.(c.candidate_id)}
                    className="text-[11px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5"
                  >
                    View <span className="material-icons-outlined text-[12px]">open_in_new</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ─── Progress Bar List ────────────────────────────────────────────────────────

function ProgressList({
  title, icon, items, loading, barColor,
}: {
  title: string
  icon: string
  items: { label: string; count: number }[]
  loading: boolean
  barColor: string
}) {
  const max = Math.max(...items.map((i) => i.count), 1)
  return (
    <div className="bg-white rounded-xl border border-outline-variant p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-icons-outlined text-on-surface-variant text-[18px]">{icon}</span>
        <h3 className="text-sm font-bold text-on-surface">{title}</h3>
      </div>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse space-y-1">
              <div className="h-2.5 bg-surface-container rounded w-3/4" />
              <div className="h-1.5 bg-surface-high rounded w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {items.slice(0, 7).map((item) => (
            <div key={item.label}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-on-surface truncate max-w-[70%]">{item.label}</span>
                <span className="text-[10px] text-outline ml-2 flex-shrink-0">{item.count}</span>
              </div>
              <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

interface DashboardProps {
  onViewCandidate?: (id: string) => void
  onNavigateToRankings?: () => void
}

export default function Dashboard({ onViewCandidate, onNavigateToRankings }: DashboardProps) {
  const { data: analytics, loading: analyticsLoading, refetch: refetchAnalytics } = useAnalytics()
  const { data: candidates, loading: candidatesLoading, refetch: refetchCandidates } = useCandidates(5)

  const [polling, setPolling] = useState(false)
  const [banner, setBanner] = useState<{ type: 'progress' | 'done'; msg: string } | null>(null)

  // Check status on mount
  useEffect(() => {
    api.get<RankStatus>('/rank/status')
      .then((res) => { if (res.data.in_progress) { setPolling(true); setBanner({ type: 'progress', msg: 'Ranking in progress…' }) } })
      .catch(() => {})
  }, [])

  // Poll while in progress
  useEffect(() => {
    if (!polling) return
    const id = setInterval(() => {
      api.get<RankStatus>('/rank/status')
        .then((res) => {
          if (!res.data.in_progress) {
            setPolling(false)
            clearInterval(id)
            if (res.data.last_run?.status === 'complete') {
              setBanner({ type: 'done', msg: `Ranked ${res.data.last_run.top_n} candidates in ${res.data.last_run.runtime_seconds}s` })
              refetchAnalytics()
              refetchCandidates()
              setTimeout(() => setBanner(null), 6000)
            }
          }
        })
        .catch(() => { setPolling(false); clearInterval(id) })
    }, 3000)
    return () => clearInterval(id)
  }, [polling, refetchAnalytics, refetchCandidates])

  // Stats from real API fields
  const totalProcessed = analytics?.total_processed ?? 100000
  const totalRanked    = analytics?.total_candidates_ranked ?? 0
  const disqualified   = analytics?.disqualified ?? 0
  const qualified      = totalProcessed - disqualified
  const avgScore       = analytics?.avg_score ?? 0

  return (
    <div className="bg-surface min-h-full pb-12">

      {/* Re-rank status banner */}
      {banner && (
        <div className={`border-b ${banner.type === 'progress' ? 'bg-tertiary-container border-tertiary/20' : 'bg-secondary-container border-secondary/20'}`}>
          <div className="max-w-[1440px] mx-auto px-6 py-2.5 flex items-center gap-2 text-sm">
            {banner.type === 'progress' ? (
              <>
                <div className="w-4 h-4 border-2 border-tertiary border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <span className="text-tertiary font-semibold">{banner.msg}</span>
                <span className="text-on-surface-variant text-xs ml-1">— polling every 3s</span>
              </>
            ) : (
              <>
                <span className="material-icons-outlined text-secondary text-[16px]">check_circle</span>
                <span className="text-secondary font-semibold">{banner.msg}</span>
              </>
            )}
          </div>
        </div>
      )}

      <div className="max-w-[1440px] mx-auto px-6 pt-8 space-y-6">

        {/* Page header */}
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-on-surface">Dashboard</h2>
            <p className="text-sm text-on-surface-variant mt-0.5">
              Evidence-based candidate rankings — {totalProcessed.toLocaleString()} profiles processed
            </p>
          </div>
          <button
            onClick={onNavigateToRankings}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-on-surface-variant bg-white border border-outline-variant rounded-lg hover:bg-surface-low transition-colors"
          >
            <span className="material-icons-outlined text-[18px]">group</span>
            Browse Rankings
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon="group"
            label="Total Processed"
            value={totalProcessed.toLocaleString()}
            sub="Synthetic candidate profiles"
            iconBg="bg-primary-container"
            iconColor="text-primary"
            valueColor="text-primary"
          />
          <StatCard
            icon="leaderboard"
            label="Candidates Ranked"
            value={totalRanked.toLocaleString()}
            sub={<>Top {totalRanked} from <span className="text-secondary font-bold">{qualified.toLocaleString()}</span> qualified</>}
            iconBg="bg-secondary-container"
            iconColor="text-secondary"
            valueColor="text-secondary"
          />
          <StatCard
            icon="block"
            label="Disqualified"
            value={disqualified.toLocaleString()}
            sub="Non-technical profiles"
            iconBg="bg-red-100"
            iconColor="text-red-600"
            valueColor="text-red-600"
          />
          <StatCard
            icon="grade"
            label="Avg Score (Top 100)"
            value={avgScore ? avgScore.toFixed(1) : '—'}
            sub="Across ranked candidates"
            iconBg="bg-tertiary-container"
            iconColor="text-tertiary"
            valueColor="text-tertiary"
          />
        </div>

        {/* Chart + AI Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
          <ScoreChart
            data={analytics?.score_distribution ?? []}
            loading={analyticsLoading}
          />
          <AIInsights
            analytics={analytics}
            topCandidate={candidates[0] ?? null}
            loading={analyticsLoading || candidatesLoading}
          />
        </div>

        {/* Top candidates table */}
        <TopTable
          candidates={candidates}
          loading={candidatesLoading}
          onViewCandidate={(id) => id === 'rankings' ? onNavigateToRankings?.() : onViewCandidate?.(id)}
        />

        {/* 3-column lists */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <ProgressList
            title="Top Source Companies"
            icon="domain"
            items={(analytics?.top_companies ?? []).map((c) => ({ label: c.company, count: c.count }))}
            loading={analyticsLoading}
            barColor="bg-primary"
          />
          <ProgressList
            title="Top Candidate Titles"
            icon="badge"
            items={(analytics?.title_breakdown ?? []).map((t) => ({ label: t.title, count: t.count }))}
            loading={analyticsLoading}
            barColor="bg-tertiary"
          />
          <ProgressList
            title="Experience Distribution"
            icon="schedule"
            items={(analytics?.exp_distribution ?? []).map((e) => ({ label: e.range, count: e.count }))}
            loading={analyticsLoading}
            barColor="bg-secondary"
          />
        </div>

      </div>
    </div>
  )
}
