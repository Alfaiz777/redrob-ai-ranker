import { useState } from 'react'
import { useCandidateDetail } from '../hooks/useCandidateDetail'
import type { Candidate, ScoreBreakdown } from '../types/index'
import { exportSingleCandidateReport } from '../utils/report'

const SIGNAL_DEFS: { key: keyof ScoreBreakdown; label: string; max: number; color: string }[] = [
  { key: 'trajectory_score',        label: 'Career Trajectory',  max: 50,  color: 'bg-primary' },
  { key: 'feature_score',           label: 'Technical Breadth',  max: 120, color: 'bg-primary' },
  { key: 'experience_score',        label: 'Experience Depth',   max: 30,  color: 'bg-primary' },
  { key: 'product_score',           label: 'Product Impact',     max: 30,  color: 'bg-tertiary' },
  { key: 'evidence_density_score',  label: 'Evidence Density',   max: 30,  color: 'bg-tertiary' },
  { key: 'skill_credibility_score', label: 'Skill Credibility',  max: 30,  color: 'bg-secondary' },
  { key: 'ranking_sys_score',       label: 'Ranking Systems',    max: 30,  color: 'bg-secondary' },
  { key: 'industry_score',          label: 'Industry Match',     max: 10,  color: 'bg-primary' },
]

function pct(value: number, max: number) {
  return Math.min(100, Math.max(0, Math.round((value / max) * 100)))
}

function cleanSignal(s: string): string {
  const raw = s.includes(': ') ? s.split(': ')[0] : s
  return raw.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

function fmtDate(dateStr: string | null) {
  if (!dateStr) return 'Present'
  const [y, m] = dateStr.split('-')
  return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(m) - 1] + ' ' + y
}

function fmtDuration(months: number) {
  const y = Math.floor(months / 12)
  const m = months % 12
  if (y === 0) return `${m}m`
  if (m === 0) return `${y}y`
  return `${y}y ${m}m`
}

// ─── Score circle ─────────────────────────────────────────────────────────────

function ScoreCircle({ score, rank }: { score: number; rank: number }) {
  const normalised = Math.min(100, Math.round((score / 400) * 100))
  const r = 58
  const circ = 2 * Math.PI * r
  const offset = circ - (normalised / 100) * circ

  return (
    <div
      className="h-full rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-xl relative overflow-hidden"
      style={{ background: '#fff', border: '2px solid transparent', backgroundClip: 'padding-box' }}
    >
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          background: 'linear-gradient(#fff, #fff) padding-box, linear-gradient(135deg, #4f46e5, #8b5cf6) border-box',
          border: '2px solid transparent',
          borderRadius: 'inherit',
        }}
      />
      <div className="relative w-32 h-32 mb-4">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={r} fill="transparent" stroke="#e2e8f8" strokeWidth="8" />
          <circle
            cx="64" cy="64" r={r}
            fill="transparent"
            stroke="#3525cd"
            strokeWidth="8"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-on-surface">{score.toFixed(0)}</span>
          <span className="text-[10px] font-bold text-outline">SCORE</span>
        </div>
      </div>
      <div className="relative">
        <p className="font-bold text-lg text-on-surface">
          {rank <= 3 ? ['Elite Fit', 'Top Match', 'Strong Fit'][rank - 1] : 'Strong Fit'}
        </p>
        <p className="text-xs text-primary font-bold mt-0.5">Ranked #{rank} of 100,000+</p>
      </div>
    </div>
  )
}

// ─── Score Composition card ───────────────────────────────────────────────────

function ScoreCompositionCard({ c }: { c: Candidate }) {
  const base   = c.breakdown?.base_score ?? 0
  const mult   = c.breakdown?.availability_mult ?? 1
  const pen    = c.breakdown?.penalties ?? 0
  const penAbs = Math.abs(pen)
  const hasPenalty = pen < 0

  return (
    <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-4">Score Composition</p>
      <div className="flex items-end gap-1.5">
        <div className="flex-1 text-center">
          <p className="text-[9px] font-bold text-outline uppercase tracking-wider mb-1">Base</p>
          <p className="text-2xl font-black text-on-surface">{base.toFixed(0)}</p>
          <p className="text-[9px] text-on-surface-variant mt-0.5">signal sum</p>
        </div>
        <div className="text-sm font-black text-outline pb-4 flex-shrink-0">×</div>
        <div className="flex-1 text-center">
          <p className="text-[9px] font-bold text-outline uppercase tracking-wider mb-1">Mult</p>
          <p className={`text-2xl font-black ${mult > 1 ? 'text-secondary' : 'text-on-surface'}`}>
            {mult.toFixed(2)}
          </p>
          <p className="text-[9px] text-on-surface-variant mt-0.5">availability</p>
        </div>
        <div className="text-sm font-black text-outline pb-4 flex-shrink-0">−</div>
        <div className="flex-1 text-center">
          <p className="text-[9px] font-bold text-outline uppercase tracking-wider mb-1">Penalty</p>
          <p className={`text-2xl font-black ${hasPenalty ? 'text-error' : 'text-on-surface-variant'}`}>
            {penAbs.toFixed(0)}
          </p>
          <p className="text-[9px] text-on-surface-variant mt-0.5">deducted</p>
        </div>
        <div className="text-sm font-black text-outline pb-4 flex-shrink-0">=</div>
        <div className="flex-1 text-center bg-primary-container/40 rounded-xl p-2.5 border border-primary/15">
          <p className="text-[9px] font-bold text-primary uppercase tracking-wider mb-1">Final</p>
          <p className="text-2xl font-black text-primary">{c.total_score.toFixed(0)}</p>
          <p className="text-[9px] text-primary mt-0.5">rank #{c.rank}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Detected Signals card ────────────────────────────────────────────────────

function DetectedSignalsCard({ snippets }: { snippets: string[] }) {
  if (!snippets?.length) return null

  return (
    <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-3">
        Detected Evidence Signals
      </p>
      <div className="flex flex-wrap gap-1.5">
        {snippets.map((s, i) => (
          <span
            key={i}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
              i === 0
                ? 'bg-primary text-white'
                : 'bg-primary-container text-primary'
            }`}
          >
            {i === 0 && (
              <span className="material-icons-outlined text-[10px]">star</span>
            )}
            {cleanSignal(s)}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Left panel ───────────────────────────────────────────────────────────────

function LeftPanel({ c }: { c: Candidate }) {
  const rankLabel =
    c.rank === 1 ? 'Top 1%' : c.rank <= 5 ? 'Top 5%' : c.rank <= 10 ? 'Top 10%' : `#${c.rank}`

  const sig = c.redrob_signals

  return (
    <div className="flex flex-col gap-5 h-full">

      {/* Identity card */}
      <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-container flex items-center justify-center flex-shrink-0">
            <span className="material-icons-outlined text-primary text-[28px]">person</span>
          </div>
          <span className="bg-secondary-container text-secondary text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
            {rankLabel}
          </span>
        </div>

        {/* Name */}
        {c.name && (
          <h3 className="text-xl font-black text-on-surface mb-0.5">{c.name}</h3>
        )}
        {/* Headline */}
        {c.headline && (
          <p className="text-xs text-on-surface-variant mb-1 leading-snug">{c.headline}</p>
        )}
        <p className="text-[10px] font-mono text-outline mb-2">ID: {c.candidate_id}</p>

        {/* Location */}
        {(c.location || c.country) && (
          <div className="flex items-center gap-1 text-on-surface-variant text-xs mb-1">
            <span className="material-icons-outlined text-[14px]">location_on</span>
            <span>{[c.location, c.country].filter(Boolean).join(', ')}</span>
          </div>
        )}
        <div className="flex items-center gap-1 text-on-surface-variant text-xs">
          <span className="material-icons-outlined text-[14px]">work_outline</span>
          <span>
            {c.experience != null ? `${c.experience} yr${c.experience !== 1 ? 's' : ''}` : '—'} exp
            {c.companies?.[0] ? ` · ${c.companies[0]}` : ''}
          </span>
        </div>

        {/* Languages */}
        {(c.languages?.length ?? 0) > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {c.languages!.map((l) => (
              <span key={l.language} className="px-2 py-0.5 bg-surface-container rounded-full text-[10px] text-on-surface-variant font-medium capitalize">
                {l.language} <span className="text-outline">· {l.proficiency}</span>
              </span>
            ))}
          </div>
        )}

        {/* Companies */}
        {c.companies?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-outline-variant">
            <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-2">Companies</p>
            <div className="flex flex-wrap gap-1.5">
              {c.companies.map((co) => (
                <span key={co} className="px-2.5 py-1 bg-surface-container rounded-full text-xs font-medium text-on-surface">
                  {co}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Availability signals */}
        {sig && (
          <div className="mt-4 pt-4 border-t border-outline-variant">
            <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-2">Availability</p>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="bg-surface-low rounded-lg p-2.5">
                <p className="text-[9px] text-outline leading-none mb-0.5">Notice Period</p>
                <p className="text-xs font-bold text-on-surface">{sig.notice_period_days} days</p>
              </div>
              <div className="bg-surface-low rounded-lg p-2.5">
                <p className="text-[9px] text-outline leading-none mb-0.5">Work Mode</p>
                <p className="text-xs font-bold text-on-surface capitalize">{sig.preferred_work_mode}</p>
              </div>
              {sig.expected_salary_range_inr_lpa && (
                <div className="col-span-2 bg-surface-low rounded-lg p-2.5">
                  <p className="text-[9px] text-outline leading-none mb-0.5">Expected CTC</p>
                  <p className="text-xs font-bold text-on-surface">
                    ₹{sig.expected_salary_range_inr_lpa.min}–{sig.expected_salary_range_inr_lpa.max} LPA
                  </p>
                </div>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {sig.open_to_work_flag && (
                <span className="flex items-center gap-1 px-2 py-1 bg-primary-container/60 rounded-full text-[10px] font-semibold text-primary">
                  <span className="material-icons-outlined text-[11px]">work</span>
                  Open to Work
                </span>
              )}
              {sig.willing_to_relocate && (
                <span className="flex items-center gap-1 px-2 py-1 bg-secondary-container/60 rounded-full text-[10px] font-semibold text-secondary">
                  <span className="material-icons-outlined text-[11px]">place</span>
                  Willing to Relocate
                </span>
              )}
              {sig.linkedin_connected && (
                <span className="flex items-center gap-1 px-2 py-1 bg-surface-container rounded-full text-[10px] font-semibold text-on-surface-variant">
                  <span className="material-icons-outlined text-[11px]">verified</span>
                  LinkedIn
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Score Composition */}
      <ScoreCompositionCard c={c} />

      {/* Skills */}
      {(c.skills?.length ?? 0) > 0 && (
        <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-3">Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {c.skills!.slice(0, 16).map((sk) => (
              <span
                key={sk.name}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                  sk.proficiency === 'advanced'
                    ? 'bg-primary-container text-primary'
                    : sk.proficiency === 'intermediate'
                    ? 'bg-secondary-container text-secondary'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
                title={`${sk.proficiency} · ${sk.endorsements} endorsements`}
              >
                {sk.name}
              </span>
            ))}
          </div>
          <p className="text-[9px] text-outline mt-2">
            <span className="inline-block w-2 h-2 rounded-full bg-primary-container mr-1" />Advanced
            <span className="inline-block w-2 h-2 rounded-full bg-secondary-container ml-2 mr-1" />Intermediate
            <span className="inline-block w-2 h-2 rounded-full bg-surface-container ml-2 mr-1" />Beginner
          </p>
        </div>
      )}

      {/* Education + Certifications */}
      {((c.education?.length ?? 0) > 0 || (c.certifications?.length ?? 0) > 0) && (
        <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-3">Education & Credentials</p>
          <div className="space-y-3">
            {c.education?.map((edu, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center flex-shrink-0">
                  <span className="material-icons-outlined text-secondary text-[14px]">school</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-on-surface leading-tight">{edu.institution}</p>
                  <p className="text-[11px] text-on-surface-variant">{edu.degree} · {edu.field_of_study}</p>
                  <p className="text-[10px] text-outline">{edu.start_year}–{edu.end_year} · {edu.grade}</p>
                </div>
              </div>
            ))}
            {c.certifications?.map((cert, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center flex-shrink-0">
                  <span className="material-icons-outlined text-primary text-[14px]">workspace_premium</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-on-surface leading-tight">{cert.name}</p>
                  <p className="text-[11px] text-outline">{cert.issuer} · {cert.year}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detected Evidence Signals */}
      <DetectedSignalsCard snippets={c.evidence_snippets} />

      {/* Ranking Signals — last card, grows to fill remaining column height */}
      <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-sm flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-4">Ranking Signals</p>
        <div className="space-y-3.5">
          {SIGNAL_DEFS.map((sig) => {
            const val = (c.breakdown?.[sig.key] as number) ?? 0
            const p   = pct(val, sig.max)
            const textColor =
              p >= 75 ? 'text-primary font-black' :
              p >= 45 ? 'text-secondary font-bold' :
              'text-outline font-semibold'
            return (
              <div key={sig.key}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] text-on-surface-variant font-medium">{sig.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-outline">{val.toFixed(0)}/{sig.max}</span>
                    <span className={`text-[11px] ${textColor}`}>{p}%</span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${sig.color}`}
                    style={{ width: `${p}%`, boxShadow: p > 70 ? '0 0 6px rgba(53,37,205,0.3)' : undefined }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── AI Rationale body ────────────────────────────────────────────────────────

function RationaleBody({ c }: { c: Candidate }) {
  const bd = c.breakdown
  const rankLabel = c.rank === 1 ? 'Elite Fit' : c.rank <= 5 ? 'Top Match' : 'Strong Fit'

  const bullets: string[] = []
  if ((bd?.trajectory_score ?? 0) / 50 >= 0.6)
    bullets.push('Consistent career progression — trajectory signals indicate upward mobility into senior roles')
  if ((bd?.feature_score ?? 0) / 120 >= 0.6)
    bullets.push('Broad technical skill coverage across core AI/ML competencies required for this role')
  if ((bd?.ranking_sys_score ?? 0) / 30 >= 0.6)
    bullets.push('Hands-on experience with ranking, retrieval, and recommendation systems — directly relevant to JD')
  if ((bd?.product_score ?? 0) / 30 >= 0.6)
    bullets.push('Product-company background with demonstrable impact at scale')
  if ((bd?.skill_credibility_score ?? 0) / 30 >= 0.6)
    bullets.push('High skill credibility — endorsed skills are corroborated by role evidence and work history')
  if ((bd?.evidence_density_score ?? 0) / 30 >= 0.6)
    bullets.push('Above-average evidence density — quantified results and concrete claims well-supported')
  if (c.experience != null && c.experience >= 4 && c.experience <= 12)
    bullets.push(`${c.experience} years of experience — within the preferred range for this seniority level`)
  if ((c.companies?.length ?? 0) >= 2)
    bullets.push(`Multi-company background across ${c.companies.join(', ')} — diverse exposure`)

  if (bullets.length === 0)
    bullets.push(`Scored ${c.total_score.toFixed(0)} across all ranking dimensions — meets baseline threshold for consideration`)

  return (
    <div className="space-y-3">
      <p className="text-sm text-on-surface-variant leading-relaxed">
        Ranked <span className="font-bold text-primary">#{c.rank}</span> of 100,000+ candidates
        with a composite score of{' '}
        <span className="font-bold text-primary">{c.total_score.toFixed(0)}</span> —
        classified as <span className="font-semibold text-on-surface">{rankLabel}</span> for this role.
      </p>
      <ul className="space-y-2">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-on-surface-variant">
            <span className="material-icons-outlined text-[14px] mt-0.5 flex-shrink-0 text-secondary">check_circle</span>
            {b}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Career History card ──────────────────────────────────────────────────────

function CareerHistoryCard({ c }: { c: Candidate }) {
  if (!c.career_history?.length) return null

  return (
    <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <span className="material-icons-outlined text-primary text-[18px]">work_history</span>
        <h4 className="font-bold text-base text-on-surface">Career History</h4>
        <span className="ml-auto text-[10px] text-outline bg-surface-container px-2 py-0.5 rounded-full">
          {c.career_history.length} roles
        </span>
      </div>
      <div className="relative">
        {/* Timeline spine */}
        <div className="absolute left-[15px] top-3 bottom-3 w-px bg-outline-variant/50" />
        <div className="space-y-5 pl-10">
          {c.career_history.map((job, i) => (
            <div key={i} className="relative">
              {/* Dot */}
              <div
                className={`absolute top-1 w-3 h-3 rounded-full border-2 ${
                  job.is_current
                    ? 'bg-primary border-primary shadow-sm'
                    : 'bg-white border-outline-variant'
                }`}
                style={{ left: '-26px' }}
              />
              <div className="flex items-start justify-between gap-3 mb-1">
                <div className="min-w-0">
                  <p className="font-bold text-sm text-on-surface leading-tight">{job.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-xs text-on-surface-variant">{job.company}</p>
                    {job.company_size && (
                      <span className="text-[10px] text-outline bg-surface-container px-1.5 py-px rounded-full">
                        {job.company_size}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-on-surface-variant">
                    {fmtDate(job.start_date)} – {job.is_current ? 'Present' : fmtDate(job.end_date)}
                  </p>
                  <span className={`text-[10px] font-semibold ${
                    job.is_current ? 'text-primary' : 'text-outline'
                  }`}>
                    {fmtDuration(job.duration_months)}
                  </span>
                </div>
              </div>
              {job.description && (
                <p className="text-[11px] text-on-surface-variant leading-relaxed line-clamp-3">
                  {job.description}
                </p>
              )}
              {job.industry && (
                <span className="mt-1.5 inline-block text-[10px] text-outline bg-surface-low px-2 py-0.5 rounded-full">
                  {job.industry}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

interface Props {
  candidateId: string
  onBack: () => void
  onAddToShortlist?: (id: string) => void
  isShortlisted?: boolean
}

export default function CandidateDetail({ candidateId, onBack, onAddToShortlist, isShortlisted }: Props) {
  const { data: c, loading, error } = useCandidateDetail(candidateId)
  const [toast, setToast] = useState<string | null>(null)
  const [locallyShortlisted, setLocallyShortlisted] = useState(false)

  const shortlisted = (isShortlisted ?? false) || locallyShortlisted

  function handleAddToShortlist() {
    if (!c || shortlisted) return
    onAddToShortlist?.(c.candidate_id)
    setLocallyShortlisted(true)
    const displayName = c.name ?? c.candidate_id
    setToast(`${displayName} has been shortlisted — check the Rankings sidebar`)
    setTimeout(() => setToast(null), 4500)
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-on-surface-variant">Loading candidate profile…</p>
        </div>
      </div>
    )
  }

  if (error || !c) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <span className="material-icons-outlined text-[48px] text-outline">error_outline</span>
          <p className="text-sm font-medium text-error mt-2">{error ?? 'Candidate not found'}</p>
          <button onClick={onBack} className="mt-3 text-sm font-semibold text-primary hover:underline">
            Back to Rankings
          </button>
        </div>
      </div>
    )
  }

  const hasFlags    = (c.flags?.length ?? 0) > 0
  const hasPenalties = (c.breakdown?.penalties ?? 0) < 0

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Toast — fixed below the navbar */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 px-5 py-3.5 bg-gray-900 text-white rounded-2xl shadow-2xl text-sm font-semibold pointer-events-none whitespace-nowrap">
          <span className="material-icons-outlined text-[18px]" style={{ color: '#86efac' }}>bookmark_added</span>
          {toast}
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-[1440px] mx-auto px-6 pt-6">

          {/* Breadcrumb + header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
            <div>
              <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant mb-2">
                <button onClick={onBack} className="hover:text-primary transition-colors">
                  Candidate Rankings
                </button>
                <span className="material-icons-outlined text-[13px]">chevron_right</span>
                <span className="text-primary font-medium">Candidate Profile</span>
              </nav>
              <h2 className="text-2xl font-bold text-on-surface">
                {c.name ?? 'Candidate Review'}
              </h2>
              <p className="text-sm text-on-surface-variant mt-0.5">
                {c.name
                  ? `${c.title ?? ''}${c.title ? ' · ' : ''}${c.candidate_id}`
                  : 'Inspect candidate evidence, ranking rationale, and hiring signals.'}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => exportSingleCandidateReport(c)}
                className="flex items-center gap-1.5 px-4 py-2 border border-outline-variant rounded-xl text-sm font-semibold hover:bg-surface-low transition-all"
              >
                <span className="material-icons-outlined text-[16px]">picture_as_pdf</span>
                Export Report
              </button>
              <button
                onClick={handleAddToShortlist}
                disabled={shortlisted}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  shortlisted
                    ? 'bg-secondary-container text-secondary cursor-default'
                    : 'bg-primary text-white hover:shadow-lg hover:opacity-90'
                }`}
              >
                <span className="material-icons-outlined text-[16px]">
                  {shortlisted ? 'bookmark' : 'bookmark_border'}
                </span>
                {shortlisted ? 'Shortlisted' : 'Add to Shortlist'}
              </button>
            </div>
          </div>

          {/* Main two-column grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* Left: identity, score, skills, education, signals, ranking */}
            <aside className="lg:col-span-4">
              <LeftPanel c={c} />
            </aside>

            {/* Right: score ring + rationale, summary, career, evidence, risk */}
            <div className="lg:col-span-8 flex flex-col gap-5">

              {/* Row: score ring + AI rationale — equal height */}
              <div className="flex flex-col md:flex-row gap-5">
                <div className="md:w-[220px] flex-shrink-0 min-h-[260px]">
                  <ScoreCircle score={c.total_score} rank={c.rank} />
                </div>
                <div className="flex-1 bg-white border border-outline-variant rounded-xl p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-[0.04] pointer-events-none select-none">
                    <span className="material-icons-outlined text-[80px]">auto_awesome</span>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-icons-outlined text-tertiary">psychology</span>
                    <h4 className="font-bold text-base text-on-surface">AI Rationale</h4>
                  </div>
                  <RationaleBody c={c} />
                </div>
              </div>

              {/* Professional Summary */}
              {c.summary && (
                <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-icons-outlined text-secondary text-[18px]">article</span>
                    <h4 className="font-bold text-base text-on-surface">Professional Summary</h4>
                  </div>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{c.summary}</p>
                </div>
              )}

              {/* Career History */}
              <CareerHistoryCard c={c} />

              {/* Evidence Snippets */}
              {c.evidence_snippets?.length > 0 && (
                <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-outline mb-4">
                    Verifiable Evidence Snippets
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {c.evidence_snippets.map((snippet, i) => (
                      <div
                        key={i}
                        className={`p-3.5 rounded-r-lg border-l-4 ${
                          i === 0
                            ? 'bg-surface-low border-primary'
                            : 'bg-surface-low border-outline-variant'
                        }`}
                      >
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          i === 0
                            ? 'bg-primary text-white'
                            : 'bg-surface-container text-on-surface-variant'
                        }`}>
                          {i === 0 ? 'Primary Signal' : `Signal ${i + 1}`}
                        </span>
                        <p className="text-sm font-semibold text-on-surface mt-2">{cleanSignal(snippet)}</p>
                        {snippet.includes(': ') && (
                          <p className="text-[11px] text-on-surface-variant mt-0.5 italic">
                            {snippet.split(': ')[1]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risk & Penalty Signals */}
              <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-outline mb-4">
                  Risk & Penalty Signals
                </h4>
                {!hasFlags && !hasPenalties ? (
                  <div className="flex items-center gap-4 bg-secondary/10 p-4 rounded-xl border border-secondary/20">
                    <span
                      className="material-icons-outlined text-secondary text-[28px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                    <div>
                      <p className="text-sm font-bold text-secondary">No Risk Signals Detected</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Stability check, coherence validation, and skill credibility passed all thresholds.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {c.flags?.map((flag, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-error-container/30 border border-error/20 rounded-lg">
                        <span className="material-icons-outlined text-error text-[18px] flex-shrink-0 mt-0.5">warning</span>
                        <p className="text-sm text-on-surface leading-relaxed">{flag}</p>
                      </div>
                    ))}
                    {hasPenalties && (
                      <div className="flex items-center gap-3 p-3 bg-surface-low rounded-lg border border-outline-variant">
                        <span className="material-icons-outlined text-outline text-[18px]">remove_circle_outline</span>
                        <p className="text-sm text-on-surface-variant">
                          Score penalty applied:{' '}
                          <span className="font-bold text-error">{c.breakdown.penalties.toFixed(1)} pts</span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="flex-shrink-0 border-t border-outline-variant bg-white/80 backdrop-blur-md py-3 px-6">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center">
                <span className="material-icons-outlined text-primary text-[18px]">person</span>
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface leading-tight">{c.name ?? c.candidate_id}</p>
                {c.name && <p className="text-[10px] text-outline font-mono">{c.candidate_id}</p>}
                <p className="text-xs text-primary font-bold">Ranked #{c.rank} of 100,000+</p>
              </div>
            </div>
            <div className="hidden sm:block h-7 w-px bg-outline-variant" />
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-on-surface-variant text-sm font-semibold hover:text-primary transition-colors"
            >
              <span className="material-icons-outlined text-[18px]">arrow_back</span>
              Back to Rankings
            </button>
          </div>
          {shortlisted ? (
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-secondary-container text-secondary">
              <span className="material-icons-outlined text-[16px]">bookmark</span>
              Shortlisted
            </div>
          ) : (
            <button
              onClick={handleAddToShortlist}
              className="px-6 py-2 font-bold rounded-xl text-sm bg-primary text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
            >
              <span className="material-icons-outlined text-[16px]">bookmark_border</span>
              Add to Shortlist
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
