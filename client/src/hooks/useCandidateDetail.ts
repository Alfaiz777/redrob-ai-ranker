import { useState, useEffect } from 'react'
import api from '../api/client'
import type { Candidate } from '../types'

export function useCandidateDetail(candidateId: string | null) {
  const [result, setResult] = useState<{
    id: string | null
    data: Candidate | null
    error: string | null
  }>({ id: null, data: null, error: null })

  useEffect(() => {
    if (!candidateId) return
    let active = true
    api
      .get<Candidate>(`/candidates/${candidateId}`)
      .then((res) => { if (active) setResult({ id: candidateId, data: res.data, error: null }) })
      .catch((err) => { if (active) setResult({ id: candidateId, data: null, error: err.message }) })
    return () => { active = false }
  }, [candidateId])

  // loading is derived: true whenever candidateId is set but the result isn't for that id yet
  const loading = candidateId !== null && result.id !== candidateId

  return {
    data: loading ? null : result.data,
    loading,
    error: loading ? null : result.error,
  }
}
