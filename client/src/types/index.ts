export interface ScoreBreakdown {
  feature_score: number
  coherence_score: number
  experience_score: number
  trajectory_score: number
  product_score: number
  ranking_sys_score: number
  skill_credibility_score: number
  evidence_density_score: number
  location_score: number
  industry_score: number
  base_score: number
  availability_mult: number
  penalties: number
  vector_similarity: number | null
}

export interface CareerEntry {
  company: string
  title: string
  start_date: string
  end_date: string | null
  duration_months: number
  is_current: boolean
  industry: string
  company_size: string
  description: string
}

export interface EducationEntry {
  institution: string
  degree: string
  field_of_study: string
  start_year: number
  end_year: number
  grade: string
  tier: string
}

export interface SkillEntry {
  name: string
  proficiency: 'beginner' | 'intermediate' | 'advanced'
  endorsements: number
  duration_months: number
}

export interface Certification {
  name: string
  issuer: string
  year: number
}

export interface Language {
  language: string
  proficiency: string
}

export interface RedrobSignals {
  profile_completeness_score: number
  open_to_work_flag: boolean
  notice_period_days: number
  expected_salary_range_inr_lpa: { min: number; max: number } | null
  preferred_work_mode: string
  willing_to_relocate: boolean
  github_activity_score: number
  linkedin_connected: boolean
}

export interface Candidate {
  rank: number
  candidate_id: string
  title: string
  experience: number
  companies: string[]
  total_score: number
  breakdown: ScoreBreakdown
  evidence_snippets: string[]
  flags: string[]
  explanation: string
  // Profile enrichment — present in detail endpoint, partial in list
  name?: string | null
  headline?: string | null
  summary?: string | null
  location?: string | null
  country?: string | null
  career_history?: CareerEntry[]
  education?: EducationEntry[]
  skills?: SkillEntry[]
  certifications?: Certification[]
  languages?: Language[]
  redrob_signals?: RedrobSignals | null
}

export interface ScoreBucket {
  range: string
  count: number
}

export interface CompanyStat {
  company: string
  count: number
}

export interface TitleStat {
  title: string
  count: number
}

export interface ExpBucket {
  range: string
  count: number
}

// Matches the actual /api/analytics/summary response exactly
export interface AnalyticsSummary {
  total_candidates_ranked: number
  total_processed: number
  disqualified: number
  avg_score: number
  avg_experience: number
  penalised_in_top_100: number
  score_distribution: ScoreBucket[]
  top_companies: CompanyStat[]
  title_breakdown: TitleStat[]
  exp_distribution: ExpBucket[]
}

export interface CandidatesResponse {
  candidates: Candidate[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export interface RankStatus {
  in_progress: boolean
  last_run: {
    status: string
    ranked_at: string
    runtime_seconds: number
    top_n: number
  } | null
}
