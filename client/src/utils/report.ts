import type { AnalyticsSummary, Candidate, ScoreBreakdown } from '../types/index'

const BRAND = '#3525cd'

const BASE_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a2e; background: #fff; }
  h1 { font-size: 22px; font-weight: 800; color: ${BRAND}; margin-bottom: 2px; }
  h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
       color: #555; margin: 28px 0 10px; border-bottom: 1.5px solid #e5e3f3; padding-bottom: 6px; }
  .meta { font-size: 11px; color: #888; margin-bottom: 24px; }
  .header-row { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
  .kpi-box { border: 1px solid #e5e3f3; border-radius: 10px; padding: 16px; background: #f7f6fd; }
  .kpi-label { font-size: 9px; color: #888; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
  .kpi-value { font-size: 24px; font-weight: 900; color: ${BRAND}; line-height: 1; }
  .kpi-value.green { color: #16a34a; }
  .kpi-value.red   { color: #dc2626; }
  .kpi-sub { font-size: 10px; color: #aaa; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 8px; }
  thead { background: #f0eefd; }
  th { padding: 8px 12px; text-align: left; font-size: 10px; text-transform: uppercase;
       letter-spacing: 0.05em; color: #555; font-weight: 700; }
  td { padding: 7px 12px; border-bottom: 1px solid #f0eefd; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  .badge { display: inline-flex; align-items: center; justify-content: center;
           padding: 2px 9px; border-radius: 20px; font-size: 11px; font-weight: 700;
           background: #e0deff; color: ${BRAND}; }
  .rank-badge { display: inline-flex; align-items: center; justify-content: center;
                width: 24px; height: 24px; border-radius: 50%; font-size: 11px; font-weight: 700;
                background: #e0deff; color: ${BRAND}; }
  .bar-row { display: flex; align-items: center; gap: 8px; }
  .bar-bg { flex: 1; background: #f0eefd; border-radius: 4px; height: 10px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 4px; background: ${BRAND}; }
  .print-btn { background: ${BRAND}; color: white; border: none; padding: 9px 18px;
               border-radius: 7px; cursor: pointer; font-size: 12px; font-weight: 600;
               flex-shrink: 0; margin-top: 4px; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e3f3;
            font-size: 10px; color: #bbb; text-align: center; }
  .flag-row { background: #fef2f2; border-left: 3px solid #ef4444; padding: 9px 13px;
              border-radius: 0 6px 6px 0; margin: 5px 0; font-size: 12px; color: #991b1b; }
  .signal-chip { display: inline-flex; align-items: center; background: #e0deff; color: ${BRAND};
                 padding: 4px 11px; border-radius: 20px; font-size: 11px; font-weight: 600; margin: 3px; }
  .signal-chip.primary { background: ${BRAND}; color: #fff; }
  .formula-row { display: flex; align-items: flex-end; gap: 10px; margin: 16px 0; }
  .formula-cell { flex: 1; text-align: center; background: #f7f6fd; border-radius: 10px;
                  padding: 16px 8px; border: 1px solid #e5e3f3; }
  .formula-cell.highlight { background: #e0deff; border-color: ${BRAND}; }
  .formula-op { font-size: 20px; font-weight: 800; color: #aaa; padding-bottom: 18px; flex-shrink: 0; }
  .formula-val { font-size: 22px; font-weight: 900; color: ${BRAND}; line-height: 1; }
  .formula-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em;
                   color: #888; margin-top: 5px; }
  .career-item { padding: 14px 14px 14px 20px; border-left: 3px solid #e5e3f3; margin: 10px 0;
                 background: #f7f6fd; border-radius: 0 8px 8px 0; }
  .career-item.current { border-color: ${BRAND}; background: #f0eefd; }
  .career-title { font-size: 13px; font-weight: 700; color: #1a1a2e; margin-bottom: 2px; }
  .career-meta { font-size: 11px; color: #888; margin-bottom: 6px; }
  .career-desc { font-size: 12px; color: #555; line-height: 1.6; }
  .skill-chip { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px;
               font-weight: 600; margin: 2px; }
  .skill-advanced { background: #e0deff; color: ${BRAND}; }
  .skill-intermediate { background: #ede9fe; color: #7c3aed; }
  .skill-beginner { background: #f1f5f9; color: #64748b; }
  .avail-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 12px 0; }
  .avail-box { background: #f7f6fd; border: 1px solid #e5e3f3; border-radius: 8px; padding: 12px; }
  .avail-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 4px; }
  .avail-value { font-size: 14px; font-weight: 700; color: #1a1a2e; }
  @media print {
    .no-print { display: none !important; }
    body { padding: 20px; }
    h2 { page-break-after: avoid; }
    table { page-break-inside: avoid; }
  }
`

function h(s: string | number): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function openReport(bodyHtml: string, title: string) {
  const win = window.open('', '_blank')
  if (!win) { alert('Allow pop-ups to generate the report.'); return }
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${h(title)}</title><style>${BASE_CSS}</style></head><body>${bodyHtml}<div class="footer">Generated by EvidentHire AI · ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div><script>window.onload=function(){window.print()}<\/script></body></html>`)
  win.document.close()
}

export function exportAnalyticsReport(analytics: AnalyticsSummary) {
  const qualified = analytics.total_processed - (analytics.disqualified ?? 0)
  const maxBucket = Math.max(...analytics.score_distribution.map(d => d.count), 1)

  const scoreDist = analytics.score_distribution.map(d => {
    const pct = analytics.total_candidates_ranked > 0
      ? ((d.count / analytics.total_candidates_ranked) * 100).toFixed(0)
      : '0'
    const barW = Math.round((d.count / maxBucket) * 100)
    return `<tr>
      <td>${h(d.range)}</td>
      <td>${d.count}</td>
      <td>${pct}%</td>
      <td><div class="bar-row"><div class="bar-bg"><div class="bar-fill" style="width:${barW}%"></div></div></div></td>
    </tr>`
  }).join('')

  const titles = analytics.title_breakdown.slice(0, 10).map(t =>
    `<tr><td>${h(t.title)}</td><td>${t.count}</td></tr>`).join('')

  const companies = analytics.top_companies.slice(0, 10).map(c =>
    `<tr><td>${h(c.company)}</td><td>${c.count}</td></tr>`).join('')

  const expDist = analytics.exp_distribution.map(e =>
    `<tr><td>${h(e.range)}</td><td>${e.count}</td></tr>`).join('')

  const html = `
    <div class="header-row">
      <div>
        <h1>Talent Intelligence Report</h1>
        <p class="meta">EvidentHire AI · Evidence-based candidate ranking</p>
      </div>
      <button class="print-btn no-print" onclick="window.print()">Print / Save as PDF</button>
    </div>

    <h2>Pool Overview</h2>
    <div class="kpi-grid">
      <div class="kpi-box">
        <div class="kpi-label">Total Scanned</div>
        <div class="kpi-value">${analytics.total_processed.toLocaleString()}</div>
        <div class="kpi-sub">Candidate profiles processed</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Qualified</div>
        <div class="kpi-value green">${qualified.toLocaleString()}</div>
        <div class="kpi-sub">Passed technical filter</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Disqualified</div>
        <div class="kpi-value red">${(analytics.disqualified ?? 0).toLocaleString()}</div>
        <div class="kpi-sub">Non-technical / low-signal</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Top Ranked</div>
        <div class="kpi-value">${analytics.total_candidates_ranked}</div>
        <div class="kpi-sub">Avg score: ${analytics.avg_score.toFixed(1)}</div>
      </div>
    </div>

    <h2>Score Distribution (Top ${analytics.total_candidates_ranked})</h2>
    <table>
      <thead><tr><th>Score Range</th><th>Count</th><th>Share</th><th>Distribution</th></tr></thead>
      <tbody>${scoreDist}</tbody>
    </table>

    <h2>Top Candidate Titles</h2>
    <table>
      <thead><tr><th>Job Title</th><th>Count in Top ${analytics.total_candidates_ranked}</th></tr></thead>
      <tbody>${titles}</tbody>
    </table>

    <h2>Top Source Companies</h2>
    <table>
      <thead><tr><th>Company</th><th>Count in Top ${analytics.total_candidates_ranked}</th></tr></thead>
      <tbody>${companies}</tbody>
    </table>

    <h2>Experience Distribution</h2>
    <table>
      <thead><tr><th>Experience Range</th><th>Count</th></tr></thead>
      <tbody>${expDist}</tbody>
    </table>

    <h2>Key Metrics</h2>
    <table>
      <tbody>
        <tr><td>Average experience</td><td><strong>${analytics.avg_experience?.toFixed(1) ?? '—'} years</strong></td></tr>
        <tr><td>Average ranking score</td><td><strong>${analytics.avg_score.toFixed(1)}</strong></td></tr>
        <tr><td>Candidates with risk flags</td><td><strong>${analytics.penalised_in_top_100}</strong></td></tr>
        <tr><td>Most common title</td><td><strong>${h(analytics.title_breakdown?.[0]?.title ?? '—')}</strong></td></tr>
        <tr><td>Top source company</td><td><strong>${h(analytics.top_companies?.[0]?.company ?? '—')}</strong></td></tr>
      </tbody>
    </table>
  `

  openReport(html, 'Talent Intelligence Report')
}

export function exportSingleCandidateReport(c: Candidate) {
  const displayName = c.name ?? c.candidate_id
  const reportTitle = `Candidate Profile — ${displayName}`

  const SIGNALS: { label: string; key: keyof ScoreBreakdown; max: number }[] = [
    { label: 'Career Trajectory', key: 'trajectory_score',        max: 50 },
    { label: 'Technical Breadth', key: 'feature_score',           max: 120 },
    { label: 'Experience Depth',  key: 'experience_score',        max: 30 },
    { label: 'Product Impact',    key: 'product_score',           max: 30 },
    { label: 'Evidence Density',  key: 'evidence_density_score',  max: 30 },
    { label: 'Skill Credibility', key: 'skill_credibility_score', max: 30 },
    { label: 'Ranking Systems',   key: 'ranking_sys_score',       max: 30 },
    { label: 'Industry Match',    key: 'industry_score',          max: 10 },
  ]

  const base     = c.breakdown?.base_score ?? 0
  const mult     = c.breakdown?.availability_mult ?? 1
  const pen      = c.breakdown?.penalties ?? 0
  const penAbs   = Math.abs(pen)
  const rankLabel = c.rank === 1 ? 'Elite Fit' : c.rank <= 3 ? 'Top Match' : 'Strong Fit'
  const sig       = c.redrob_signals

  const signalRows = SIGNALS.map(s => {
    const val = (c.breakdown?.[s.key] as number) ?? 0
    const p   = Math.min(100, Math.round((val / s.max) * 100))
    const col = p >= 75 ? BRAND : p >= 45 ? '#7c3aed' : '#94a3b8'
    return `<tr>
      <td>${h(s.label)}</td>
      <td style="font-weight:700;color:${BRAND}">${val.toFixed(0)}</td>
      <td style="color:#aaa">${s.max}</td>
      <td style="font-weight:600;color:${col}">${p}%</td>
      <td><div class="bar-row"><div class="bar-bg"><div class="bar-fill" style="width:${p}%;background:${col}"></div></div></div></td>
    </tr>`
  }).join('')

  const chips = (c.evidence_snippets ?? []).map((ev, i) => {
    const raw   = ev.includes(': ') ? ev.split(': ')[0] : ev
    const label = raw.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, ch => ch.toUpperCase())
    return `<span class="signal-chip${i === 0 ? ' primary' : ''}">${h(label)}</span>`
  }).join('')

  const flagsHtml = (c.flags?.length ?? 0) > 0
    ? c.flags.map(f => `<div class="flag-row">⚠ ${h(f)}</div>`).join('')
    : `<div style="padding:12px 16px;background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;">
         <span style="color:#16a34a;font-weight:700;">✓ No Risk Signals Detected</span>
         <p style="font-size:12px;color:#555;margin-top:4px;">Stability check, coherence validation, and skill credibility passed all thresholds.</p>
       </div>`

  // AI rationale bullets — generated from score signals (same logic as RationaleBody component)
  const bullets: string[] = []
  const bd = c.breakdown
  if ((bd?.trajectory_score ?? 0) / 50 >= 0.6)
    bullets.push('Consistent career progression — trajectory signals indicate upward mobility into senior roles.')
  if ((bd?.feature_score ?? 0) / 120 >= 0.6)
    bullets.push('Broad technical skill coverage across core AI/ML competencies required for this role.')
  if ((bd?.ranking_sys_score ?? 0) / 30 >= 0.6)
    bullets.push('Hands-on experience with ranking, retrieval, and recommendation systems — directly relevant to JD.')
  if ((bd?.product_score ?? 0) / 30 >= 0.6)
    bullets.push('Product-company background with demonstrable impact at scale.')
  if ((bd?.skill_credibility_score ?? 0) / 30 >= 0.6)
    bullets.push('High skill credibility — endorsed skills are corroborated by role evidence and work history.')
  if ((bd?.evidence_density_score ?? 0) / 30 >= 0.6)
    bullets.push('Above-average evidence density — quantified results and concrete claims well-supported.')
  if (c.experience != null && c.experience >= 4 && c.experience <= 12)
    bullets.push(`${c.experience} years of experience — within the preferred range for this seniority level.`)
  if ((c.companies?.length ?? 0) >= 2)
    bullets.push(`Multi-company background across ${h(c.companies.join(', '))} — diverse exposure.`)
  if (bullets.length === 0)
    bullets.push(`Scored ${c.total_score.toFixed(0)} across all ranking dimensions — meets baseline threshold for consideration.`)

  const rationaleHtml = `
    <p style="font-size:13px;color:#555;margin-bottom:12px;">
      Ranked <strong style="color:${BRAND}">#${c.rank}</strong> of 100,000+ candidates with a composite score of
      <strong style="color:${BRAND}">${c.total_score.toFixed(0)}</strong> —
      classified as <strong>${h(rankLabel)}</strong> for this role.
    </p>
    <ul style="margin:0;padding-left:18px;font-size:12px;color:#555;line-height:2;">
      ${bullets.map(b => `<li>${h(b)}</li>`).join('')}
    </ul>`

  // Career history
  const careerHtml = (c.career_history ?? []).map(job => {
    const end  = job.end_date ? new Date(job.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Present'
    const start = new Date(job.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    const dur  = job.duration_months >= 12
      ? `${Math.floor(job.duration_months / 12)}y ${job.duration_months % 12}m`
      : `${job.duration_months}m`
    return `<div class="career-item${job.is_current ? ' current' : ''}">
      <div class="career-title">${h(job.title)} — ${h(job.company)}</div>
      <div class="career-meta">${start} – ${end} · ${dur}${job.industry ? ` · ${h(job.industry)}` : ''}</div>
      ${job.description ? `<div class="career-desc">${h(job.description)}</div>` : ''}
    </div>`
  }).join('')

  // Skills
  const advSkills  = (c.skills ?? []).filter(s => s.proficiency === 'advanced')
  const midSkills  = (c.skills ?? []).filter(s => s.proficiency === 'intermediate')
  const junSkills  = (c.skills ?? []).filter(s => s.proficiency === 'beginner')
  const skillsHtml = (c.skills?.length ?? 0) > 0 ? `
    ${advSkills.length  ? `<p style="font-size:10px;font-weight:700;color:#888;text-transform:uppercase;margin:8px 0 4px;">Advanced</p>${advSkills.map(s => `<span class="skill-chip skill-advanced">${h(s.name)}</span>`).join('')}` : ''}
    ${midSkills.length  ? `<p style="font-size:10px;font-weight:700;color:#888;text-transform:uppercase;margin:8px 0 4px;">Intermediate</p>${midSkills.map(s => `<span class="skill-chip skill-intermediate">${h(s.name)}</span>`).join('')}` : ''}
    ${junSkills.length  ? `<p style="font-size:10px;font-weight:700;color:#888;text-transform:uppercase;margin:8px 0 4px;">Beginner</p>${junSkills.map(s => `<span class="skill-chip skill-beginner">${h(s.name)}</span>`).join('')}` : ''}
  ` : '<p style="font-size:12px;color:#aaa;">No skills data available.</p>'

  // Education & certifications
  const eduRows = (c.education ?? []).map(e =>
    `<tr>
       <td style="font-weight:600">${h(e.institution)}</td>
       <td>${h(e.degree)} · ${h(e.field_of_study)}</td>
       <td>${e.start_year}–${e.end_year}</td>
       <td>${h(e.grade)}</td>
     </tr>`).join('')
  const certRows = (c.certifications ?? []).map(cert =>
    `<tr>
       <td style="font-weight:600">${h(cert.name)}</td>
       <td>${h(cert.issuer)}</td>
       <td>${cert.year}</td>
       <td>—</td>
     </tr>`).join('')

  // Availability
  const availHtml = sig ? `
    <div class="avail-grid">
      <div class="avail-box">
        <div class="avail-label">Notice Period</div>
        <div class="avail-value">${sig.notice_period_days} days</div>
      </div>
      <div class="avail-box">
        <div class="avail-label">Work Mode</div>
        <div class="avail-value" style="text-transform:capitalize">${h(sig.preferred_work_mode)}</div>
      </div>
      <div class="avail-box">
        <div class="avail-label">Open to Work</div>
        <div class="avail-value" style="color:${sig.open_to_work_flag ? '#16a34a' : '#dc2626'}">${sig.open_to_work_flag ? 'Yes' : 'No'}</div>
      </div>
      <div class="avail-box">
        <div class="avail-label">Willing to Relocate</div>
        <div class="avail-value">${sig.willing_to_relocate ? 'Yes' : 'No'}</div>
      </div>
      ${sig.expected_salary_range_inr_lpa ? `<div class="avail-box" style="grid-column:span 2">
        <div class="avail-label">Expected CTC</div>
        <div class="avail-value">₹${sig.expected_salary_range_inr_lpa.min}–${sig.expected_salary_range_inr_lpa.max} LPA</div>
      </div>` : ''}
    </div>` : ''

  const locationLine = [c.location, c.country].filter(Boolean).join(', ')

  const html = `
    <div class="header-row">
      <div>
        <h1>${h(displayName)}</h1>
        <p class="meta">
          ${c.headline ? `${h(c.headline)} · ` : ''}${h(c.title ?? '—')}
          ${locationLine ? ` · ${h(locationLine)}` : ''}
          · Rank #${c.rank} of 100,000+ · EvidentHire AI
        </p>
        ${c.languages?.length ? `<p style="font-size:11px;color:#aaa;margin-top:4px;">Languages: ${c.languages.map(l => `${h(l.language)} (${h(l.proficiency)})`).join(', ')}</p>` : ''}
      </div>
      <button class="print-btn no-print" onclick="window.print()">Print / Save as PDF</button>
    </div>

    <div class="kpi-grid">
      <div class="kpi-box">
        <div class="kpi-label">Final Score</div>
        <div class="kpi-value">${c.total_score.toFixed(0)}</div>
        <div class="kpi-sub">${h(rankLabel)}</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Overall Rank</div>
        <div class="kpi-value">#${c.rank}</div>
        <div class="kpi-sub">of 100,000+ candidates</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Experience</div>
        <div class="kpi-value">${c.experience != null ? `${c.experience}y` : '—'}</div>
        <div class="kpi-sub">${h(c.companies?.[0] ?? '—')}</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Risk Flags</div>
        <div class="kpi-value ${(c.flags?.length ?? 0) > 0 ? 'red' : 'green'}">${c.flags?.length ?? 0}</div>
        <div class="kpi-sub">${(c.flags?.length ?? 0) > 0 ? 'signals detected' : 'clean profile'}</div>
      </div>
    </div>

    ${c.summary ? `
    <h2>Professional Summary</h2>
    <div style="padding:14px 16px;background:#f7f6fd;border-radius:10px;font-size:13px;line-height:1.75;color:#333;border:1px solid #e5e3f3;">
      ${h(c.summary)}
    </div>` : ''}

    ${availHtml ? `<h2>Availability & Preferences</h2>${availHtml}` : ''}

    <h2>AI Ranking Rationale</h2>
    <div style="padding:14px 16px;background:#f7f6fd;border-radius:10px;border:1px solid #e5e3f3;">
      ${rationaleHtml}
    </div>

    <h2>Score Composition</h2>
    <div class="formula-row">
      <div class="formula-cell">
        <div class="formula-val">${base.toFixed(0)}</div>
        <div class="formula-label">Base Score</div>
      </div>
      <div class="formula-op">×</div>
      <div class="formula-cell">
        <div class="formula-val" style="color:${mult > 1 ? '#7c3aed' : '#1a1a2e'}">${mult.toFixed(2)}</div>
        <div class="formula-label">Availability Mult.</div>
      </div>
      <div class="formula-op">−</div>
      <div class="formula-cell">
        <div class="formula-val" style="color:${pen < 0 ? '#dc2626' : '#16a34a'}">${penAbs.toFixed(0)}</div>
        <div class="formula-label">Penalty</div>
      </div>
      <div class="formula-op">=</div>
      <div class="formula-cell highlight">
        <div class="formula-val">${c.total_score.toFixed(0)}</div>
        <div class="formula-label">Final Score</div>
      </div>
    </div>

    <h2>Ranking Signal Breakdown</h2>
    <table>
      <thead><tr><th>Signal</th><th>Score</th><th>Max</th><th>%</th><th>Distribution</th></tr></thead>
      <tbody>${signalRows}</tbody>
    </table>

    ${chips ? `<h2>Detected Evidence Signals</h2><div style="padding:10px 0">${chips}</div>` : ''}

    ${careerHtml ? `<h2>Career History</h2>${careerHtml}` : ''}

    ${(c.skills?.length ?? 0) > 0 ? `<h2>Skills</h2><div style="padding:6px 0">${skillsHtml}</div>` : ''}

    ${(eduRows || certRows) ? `
    <h2>Education & Certifications</h2>
    <table>
      <thead><tr><th>Institution / Certification</th><th>Degree / Issuer</th><th>Year(s)</th><th>Grade</th></tr></thead>
      <tbody>${eduRows}${certRows}</tbody>
    </table>` : ''}

    <h2>Risk & Penalty Signals</h2>
    ${flagsHtml}
  `

  openReport(html, reportTitle)
}

export function exportCandidatesReport(candidates: Candidate[], reportTitle: string) {
  const rows = candidates.map(c => `
    <tr>
      <td><span class="rank-badge">${c.rank}</span></td>
      <td>
        ${c.name ? `<strong>${h(c.name)}</strong><br>` : ''}
        <span style="font-family:monospace;font-size:10px;color:#888">${h(c.candidate_id)}</span>
      </td>
      <td>${h(c.title ?? '—')}</td>
      <td>${c.experience != null ? `${c.experience} yrs` : '—'}</td>
      <td>${h(c.companies?.[0] ?? '—')}</td>
      <td><span class="badge">${(c.total_score ?? 0).toFixed(0)}</span></td>
      <td>${(c.flags?.length ?? 0) > 0 ? '⚠ ' + h(c.flags[0]) : '—'}</td>
    </tr>
  `).join('')

  const html = `
    <div class="header-row">
      <div>
        <h1>${h(reportTitle)}</h1>
        <p class="meta">${candidates.length} candidates · EvidentHire AI</p>
      </div>
      <button class="print-btn no-print" onclick="window.print()">Print / Save as PDF</button>
    </div>
    <table>
      <thead>
        <tr>
          <th>Rank</th><th>Candidate</th><th>Title</th>
          <th>Experience</th><th>Top Company</th><th>Score</th><th>Flags</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `

  openReport(html, reportTitle)
}
