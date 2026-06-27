import { useState, useEffect, useCallback } from 'react'
import api from '../api/client'
import type { AnalyticsSummary } from '../types'

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trigger, setTrigger] = useState(0)

  useEffect(() => {
    let active = true
    api
      .get<AnalyticsSummary>('/analytics/summary')
      .then((res) => { if (active) { setData(res.data); setError(null) } })
      .catch((err) => { if (active) setError(err.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [trigger])

  const refetch = useCallback(() => {
    setLoading(true)
    setTrigger((t) => t + 1)
  }, [])

  return { data, loading, error, refetch }
}
