import type { ScoreBucket } from '../../types'

interface Props {
  data: ScoreBucket[]
  loading: boolean
}

export default function ScoreDistributionChart({ data, loading }: Props) {
  const max = Math.max(...data.map((d) => d.count), 1)
  const BAR_H = 160

  return (
    <div className="bg-white rounded-2xl p-6 border border-outline-variant shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-on-surface">Score Distribution</h3>
          <p className="text-xs text-outline mt-0.5">Top 100 candidates by score range</p>
        </div>
        <span className="material-icons-outlined text-primary text-[20px]">bar_chart</span>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Bar area — bars grow from bottom, no labels here */}
          <div className="flex items-end gap-1" style={{ height: BAR_H }}>
            {data.map((bucket) => {
              const pct = Math.max((bucket.count / max) * 100, 3)
              const px  = Math.round((pct / 100) * BAR_H)
              const isHigh = pct > 60
              return (
                <div key={bucket.range} className="flex-1 group relative">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-on-surface text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none z-10">
                    {bucket.count}
                  </div>
                  <div
                    className={`w-full rounded-t-sm transition-all duration-200 ${isHigh ? 'bg-primary' : 'bg-primary-container'} hover:opacity-80`}
                    style={{ height: px }}
                  />
                </div>
              )
            })}
          </div>

          {/* Label row — separate, no rotation needed */}
          <div className="flex gap-1 mt-2 border-t border-outline-variant/40 pt-2">
            {data.map((bucket) => (
              <span
                key={bucket.range}
                className="flex-1 text-[9px] text-outline text-center truncate leading-tight"
              >
                {bucket.range}
              </span>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs text-outline">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-primary" />
              <span>Candidates per score range</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
