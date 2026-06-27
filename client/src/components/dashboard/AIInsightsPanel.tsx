import type { AnalyticsSummary, Candidate } from '../../types'

interface Props {
  analytics: AnalyticsSummary | null
  topCandidates: Candidate[]
  loading: boolean
}

interface InsightRow {
  icon: string
  label: string
  value: string
  color: string
}

export default function AIInsightsPanel({ analytics, topCandidates, loading }: Props) {
  if (loading || !analytics) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-outline-variant shadow-sm h-full flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-tertiary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const topScore = topCandidates[0]?.total_score ?? 0
  const topTitle = analytics.title_breakdown?.[0]?.title ?? '—'
  const topCompany = analytics.top_companies?.[0]?.company ?? '—'
  const avgExp = analytics.avg_experience?.toFixed(1) ?? '—'

  const insights: InsightRow[] = [
    { icon: 'emoji_events', label: 'Top candidate score', value: topScore.toFixed(1), color: 'text-yellow-600 bg-yellow-50' },
    { icon: 'work', label: 'Most common title', value: topTitle, color: 'text-primary bg-primary-container' },
    { icon: 'domain', label: 'Top source company', value: topCompany, color: 'text-secondary bg-secondary-container' },
    { icon: 'schedule', label: 'Avg. experience', value: `${avgExp} yrs`, color: 'text-tertiary bg-tertiary-container' },
  ]

  return (
    <div className="bg-white rounded-2xl p-6 border border-outline-variant shadow-sm h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-tertiary-container flex items-center justify-center">
          <span className="material-icons-outlined text-tertiary text-[18px]">auto_awesome</span>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-on-surface">AI Insights</h3>
          <p className="text-[11px] text-outline">Powered by EvidentHire AI</p>
        </div>
      </div>

      {/* Insight rows */}
      <div className="flex flex-col gap-3 flex-1">
        {insights.map((ins) => (
          <div key={ins.label} className="flex items-center gap-3 p-3 rounded-xl bg-surface-low">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${ins.color}`}>
              <span className="material-icons-outlined text-[16px]">{ins.icon}</span>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-outline truncate">{ins.label}</p>
              <p className="text-sm font-semibold text-on-surface truncate">{ins.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer badge */}
      <div className="mt-4 pt-4 border-t border-outline-variant">
        <div className="flex items-center gap-1.5 text-[11px] text-outline">
          <span className="material-icons-outlined text-[14px] text-tertiary">verified</span>
          Evidence-based scoring — no bias
        </div>
      </div>
    </div>
  )
}
