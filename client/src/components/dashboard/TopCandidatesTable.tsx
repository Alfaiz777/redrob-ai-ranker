import type { Candidate } from '../../types'

interface Props {
  candidates: Candidate[]
  loading: boolean
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 300 ? 'bg-secondary-container text-secondary' :
    score >= 250 ? 'bg-primary-container text-primary' :
    'bg-surface-high text-on-surface-variant'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {score.toFixed(0)}
    </span>
  )
}

export default function TopCandidatesTable({ candidates, loading }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
        <div>
          <h3 className="text-sm font-semibold text-on-surface">Top Ranked Candidates</h3>
          <p className="text-xs text-outline mt-0.5">Highest scoring profiles from 100K candidates</p>
        </div>
        <a href="#" className="text-xs font-medium text-primary hover:underline flex items-center gap-0.5">
          View all
          <span className="material-icons-outlined text-[14px]">arrow_forward</span>
        </a>
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-low text-xs text-on-surface-variant uppercase tracking-wide">
              <th className="px-6 py-3 text-left w-12">Rank</th>
              <th className="px-6 py-3 text-left">Candidate</th>
              <th className="px-6 py-3 text-left">Title</th>
              <th className="px-6 py-3 text-left">Experience</th>
              <th className="px-6 py-3 text-left">Top Company</th>
              <th className="px-6 py-3 text-left">Score</th>
              <th className="px-6 py-3 text-left" />
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {candidates.map((c) => (
              <tr key={c.candidate_id} className="hover:bg-surface-low transition-colors group">
                <td className="px-6 py-4">
                  <div className="w-7 h-7 rounded-full bg-primary-container text-primary text-xs font-bold flex items-center justify-center">
                    {c.rank}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-on-surface">{c.candidate_id}</div>
                  {c.evidence_snippets?.[0] && (
                    <div className="text-[11px] text-outline truncate max-w-[180px]">
                      {c.evidence_snippets[0]}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-on-surface-variant">{c.title}</td>
                <td className="px-6 py-4 text-on-surface-variant">
                  {c.experience != null ? `${c.experience} yr${c.experience !== 1 ? 's' : ''}` : '—'}
                </td>
                <td className="px-6 py-4 text-on-surface-variant">
                  {c.companies?.[0] ?? '—'}
                </td>
                <td className="px-6 py-4">
                  <ScoreBadge score={c.total_score} />
                </td>
                <td className="px-6 py-4">
                  <button className="text-[11px] font-medium text-primary opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5">
                    View
                    <span className="material-icons-outlined text-[13px]">open_in_new</span>
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
