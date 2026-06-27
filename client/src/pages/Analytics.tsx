import type { ReactNode } from 'react'
import { useAnalytics } from '../hooks/useAnalytics'
import type { AnalyticsSummary } from '../types/index'
import { exportAnalyticsReport } from '../utils/report'

function companyInitial(name: string) {
  return name.trim()[0]?.toUpperCase() ?? '?'
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({
  icon, label, value, sub, iconBg, iconColor, valueColor = 'text-on-surface',
}: {
  icon: string; label: string; value: string; sub: ReactNode
  iconBg: string; iconColor: string; valueColor?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <span className={`material-icons-outlined text-[22px] ${iconColor}`}>{icon}</span>
        </div>
      </div>
      <p className="text-xs text-on-surface-variant mb-1">{label}</p>
      <p className={`text-3xl font-black ${valueColor}`}>{value}</p>
      <p className="text-[10px] text-outline mt-1">{sub}</p>
    </div>
  )
}

// ─── Score Distribution Histogram ─────────────────────────────────────────────

function ScoreHistogram({ data, loading }: { data: AnalyticsSummary['score_distribution']; loading: boolean }) {
  const max = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-base font-bold text-on-surface">Candidate Score Distribution</h4>
        <span className="material-icons-outlined text-primary text-[18px]">bar_chart</span>
      </div>
      <p className="text-xs text-outline mb-6">Score range of top-ranked candidates</p>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Bar area — flex-1 so bars fill available card height */}
          <div className="flex-1 min-h-0 flex items-end gap-1.5">
            {data.map((b) => {
              const pct = Math.max((b.count / max) * 100, 3)
              const isHigh = pct > 50
              return (
                <div key={b.range} className="flex-1 h-full relative group">
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-on-surface text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10">
                    {b.count}
                  </div>
                  <div
                    className={`absolute bottom-0 w-full rounded-t transition-colors ${isHigh ? 'bg-primary' : 'bg-primary-container'}`}
                    style={{ height: `${pct}%` }}
                  />
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-3 text-[9px] text-outline border-t border-outline-variant/40 pt-2">
            {data.map((b) => (
              <span key={b.range} className="flex-1 text-center truncate">{b.range}</span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Pool Summary (replaces Industry Breakdown — no industry data in system) ──

function PoolSummary({ analytics, loading }: { analytics: AnalyticsSummary | null; loading: boolean }) {
  if (loading || !analytics) {
    return (
      <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-6 flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-tertiary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const penalisedPct = analytics.total_candidates_ranked > 0
    ? ((analytics.penalised_in_top_100 / analytics.total_candidates_ranked) * 100).toFixed(0)
    : '0'

  const rows = [
    {
      icon: 'schedule',
      label: 'Avg. experience',
      value: `${analytics.avg_experience?.toFixed(1) ?? '—'} yrs`,
      color: 'text-primary bg-primary-container',
    },
    {
      icon: 'badge',
      label: 'Most common title',
      value: analytics.title_breakdown?.[0]?.title ?? '—',
      color: 'text-tertiary bg-tertiary-container',
    },
    {
      icon: 'domain',
      label: 'Top source company',
      value: analytics.top_companies?.[0]?.company ?? '—',
      color: 'text-secondary bg-secondary-container',
    },
    {
      icon: 'warning',
      label: 'Penalised in top 100',
      value: `${analytics.penalised_in_top_100} (${penalisedPct}%)`,
      color: 'text-orange-700 bg-orange-50',
    },
    {
      icon: 'leaderboard',
      label: 'Ranked candidates',
      value: analytics.total_candidates_ranked.toString(),
      color: 'text-primary bg-primary-container',
    },
  ]

  return (
    <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-6 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-5">
        <span className="material-icons-outlined text-tertiary text-[18px]">insights</span>
        <h4 className="text-base font-bold text-on-surface">Pool Summary</h4>
      </div>
      <div className="space-y-3 flex-1">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3 p-3 rounded-xl bg-surface-low">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${r.color}`}>
              <span className="material-icons-outlined text-[15px]">{r.icon}</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-outline">{r.label}</p>
              <p className="text-xs font-bold text-on-surface truncate">{r.value}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 pt-4 border-t border-outline-variant text-[10px] text-outline flex items-center gap-1">
        <span className="material-icons-outlined text-[12px] text-secondary">verified</span>
        All metrics derived from ranked dataset · no estimations
      </p>
    </div>
  )
}

// ─── Titles List ──────────────────────────────────────────────────────────────

function TitlesList({ data, loading }: { data: AnalyticsSummary['title_breakdown']; loading: boolean }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-5">
        <span className="material-icons-outlined text-primary text-[18px]">badge</span>
        <h4 className="text-base font-bold text-on-surface">Top Candidate Titles</h4>
      </div>
      {loading ? (
        <div className="space-y-4">
          {[1,2,3,4].map((i) => (
            <div key={i} className="animate-pulse space-y-1.5">
              <div className="h-3 bg-surface-container rounded w-3/4" />
              <div className="h-2 bg-surface-high rounded w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col justify-between flex-1">
          {data.slice(0, 7).map((t) => (
            <div key={t.title}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-medium text-on-surface truncate max-w-[75%]">{t.title}</span>
                <span className="text-[10px] font-bold text-outline ml-2">{t.count}</span>
              </div>
              <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${(t.count / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Companies List ───────────────────────────────────────────────────────────

function CompaniesList({ data, loading }: { data: AnalyticsSummary['top_companies']; loading: boolean }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-5">
        <span className="material-icons-outlined text-secondary text-[18px]">domain</span>
        <h4 className="text-base font-bold text-on-surface">Top Source Companies</h4>
      </div>
      {loading ? (
        <div className="space-y-4">
          {[1,2,3,4].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-surface-container rounded w-1/2" />
                <div className="h-2 bg-surface-high rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col justify-between flex-1">
          {data.slice(0, 7).map((c) => (
            <div key={c.company} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center font-bold text-on-surface-variant flex-shrink-0 text-sm">
                {companyInitial(c.company)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-medium text-on-surface truncate">{c.company}</span>
                  <span className="text-[10px] font-bold text-outline ml-2">{c.count}</span>
                </div>
                <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary rounded-full transition-all duration-500"
                    style={{ width: `${(c.count / max) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Experience Spread (area chart from discrete buckets) ─────────────────────

function ExpSpread({ data, loading }: { data: AnalyticsSummary['exp_distribution']; loading: boolean }) {
  if (loading || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-6">
        <h4 className="text-base font-bold text-on-surface mb-5">Experience Spread</h4>
        <div className="h-40 flex items-center justify-center">
          {loading
            ? <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            : <p className="text-xs text-outline">No data</p>}
        </div>
      </div>
    )
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1)
  const W = 400
  const H = 140
  const PAD = 20

  // Build SVG path points — one x position per bucket
  const pts = data.map((d, i) => ({
    x: PAD + (i / (data.length - 1)) * (W - PAD * 2),
    y: H - PAD - ((d.count / maxCount) * (H - PAD * 2)),
    count: d.count,
    range: d.range,
  }))

  // Smooth curve via cubic bezier
  function smoothPath(points: { x: number; y: number }[]) {
    if (points.length < 2) return ''
    let d = `M ${points[0].x},${points[0].y}`
    for (let i = 1; i < points.length; i++) {
      const cpx = (points[i - 1].x + points[i].x) / 2
      d += ` C ${cpx},${points[i - 1].y} ${cpx},${points[i].y} ${points[i].x},${points[i].y}`
    }
    return d
  }

  const linePath = smoothPath(pts)
  const areaPath = `${linePath} L ${pts[pts.length - 1].x},${H - PAD} L ${pts[0].x},${H - PAD} Z`

  return (
    <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-6">
      <div className="flex items-center gap-2 mb-1">
        <span className="material-icons-outlined text-primary text-[18px]">timeline</span>
        <h4 className="text-base font-bold text-on-surface">Experience Spread</h4>
      </div>
      <p className="text-xs text-outline mb-5">Distribution of experience years across top 100 ranked candidates</p>

      <div className="w-full overflow-hidden" style={{ height: H + 32 }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
          <defs>
            <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3525cd" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#3525cd" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Horizontal grid lines */}
          {[0.25, 0.5, 0.75, 1].map((p) => (
            <line
              key={p}
              x1={PAD} x2={W - PAD}
              y1={H - PAD - p * (H - PAD * 2)}
              y2={H - PAD - p * (H - PAD * 2)}
              stroke="#c7c4d8" strokeWidth="0.5" strokeDasharray="4 4"
            />
          ))}
          {/* Area fill */}
          <path d={areaPath} fill="url(#expGrad)" />
          {/* Line */}
          <path d={linePath} fill="none" stroke="#3525cd" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Data points */}
          {pts.map((p) => (
            <g key={p.range}>
              <circle cx={p.x} cy={p.y} r="4" fill="white" stroke="#3525cd" strokeWidth="2" />
              <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="9" fill="#777587">{p.count}</text>
            </g>
          ))}
        </svg>
        {/* X-axis labels */}
        <div className="flex justify-between px-1 mt-1">
          {data.map((d) => (
            <span key={d.range} className="text-[10px] text-outline text-center flex-1">{d.range}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Analytics Page ───────────────────────────────────────────────────────────

export default function Analytics() {
  const { data: analytics, loading, error, refetch } = useAnalytics()

  return (
    <div className="h-full overflow-y-auto bg-surface">
      <div className="max-w-[1440px] mx-auto px-6 pb-12 pt-6">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-on-surface">Talent Intelligence Analytics</h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Quality, composition and distribution of your ranked candidate pool
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refetch}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-on-surface-variant bg-white border border-outline-variant rounded-lg hover:bg-surface-low transition disabled:opacity-50"
            >
              <span className={`material-icons-outlined text-[16px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
              Refresh
            </button>
            {analytics && (
              <button
                onClick={() => exportAnalyticsReport(analytics)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-primary rounded-lg hover:opacity-90 transition shadow-sm"
              >
                <span className="material-icons-outlined text-[16px]">picture_as_pdf</span>
                Export Report
              </button>
            )}
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <span className="material-icons-outlined text-[18px] flex-shrink-0">error_outline</span>
            <div>
              <p className="font-semibold">Could not load analytics</p>
              <p className="text-xs mt-0.5 opacity-80">{error}</p>
              <button onClick={refetch} className="mt-2 text-xs font-semibold underline">Retry</button>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        {(() => {
          const totalProcessed = analytics?.total_processed ?? 100000
          const disqualified   = analytics?.disqualified ?? 0
          const qualified      = totalProcessed - disqualified
          const totalRanked    = analytics?.total_candidates_ranked ?? 0
          return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
              <KPICard
                icon="group"
                label="Total Candidates"
                value={totalProcessed.toLocaleString()}
                sub="Synthetic profiles processed"
                iconBg="bg-primary-container"
                iconColor="text-primary"
                valueColor="text-primary"
              />
              <KPICard
                icon="leaderboard"
                label="Candidates Ranked"
                value={totalRanked.toLocaleString()}
                sub={<>Top {totalRanked} from <span className="text-secondary font-bold">{qualified.toLocaleString()}</span> qualified profiles</>}
                iconBg="bg-tertiary-container"
                iconColor="text-white"
                valueColor="text-tertiary"
              />
              <KPICard
                icon="block"
                label="Disqualified"
                value={disqualified.toLocaleString()}
                sub="Non-technical or low-signal"
                iconBg="bg-red-100"
                iconColor="text-red-600"
                valueColor="text-red-600"
              />
              <KPICard
                icon="grade"
                label="Avg Ranking Score"
                value={analytics ? analytics.avg_score.toFixed(1) : '—'}
                sub="Across top-ranked candidates"
                iconBg="bg-secondary-container"
                iconColor="text-secondary"
                valueColor="text-secondary"
              />
            </div>
          )
        })()}

        {/* Bento row 1: Score Distribution + Pool Summary */}
        <div className="grid grid-cols-12 gap-5 mb-5">
          <div className="col-span-12 lg:col-span-8">
            <ScoreHistogram
              data={analytics?.score_distribution ?? []}
              loading={loading}
            />
          </div>
          <div className="col-span-12 lg:col-span-4">
            <PoolSummary analytics={analytics} loading={loading} />
          </div>
        </div>

        {/* Bento row 2: Titles + Companies */}
        <div className="grid grid-cols-12 gap-5 mb-5">
          <div className="col-span-12 lg:col-span-6">
            <TitlesList
              data={analytics?.title_breakdown ?? []}
              loading={loading}
            />
          </div>
          <div className="col-span-12 lg:col-span-6">
            <CompaniesList
              data={analytics?.top_companies ?? []}
              loading={loading}
            />
          </div>
        </div>

        {/* Experience Spread — full width */}
        <ExpSpread
          data={analytics?.exp_distribution ?? []}
          loading={loading}
        />

      </div>
    </div>
  )
}
