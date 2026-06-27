import { useState, useEffect, useCallback } from 'react'
import api from '../api/client'
import type { Candidate } from '../types'

export function useCandidates(limit = 5) {
  const [data, setData] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trigger, setTrigger] = useState(0)

  useEffect(() => {
    let active = true
    api
      .get<{ candidates: Candidate[] }>('/candidates', { params: { limit } })
      .then((res) => {
        if (active) {
          setData(res.data.candidates ?? [])
          setError(null)
        }
      })
      .catch((err) => { if (active) setError(err.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [limit, trigger])

  const refetch = useCallback(() => {
    setLoading(true)
    setTrigger((t) => t + 1)
  }, [])

  return { data, loading, error, refetch }
}
