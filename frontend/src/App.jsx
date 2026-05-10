import { useState, useEffect, useCallback, useRef } from 'react'
import ThemeToggle from './components/ThemeToggle'
import SurplusGauge from './components/SurplusGauge'
import HistoryChart from './components/HistoryChart'

function App() {
  const [surplusData, setSurplusData] = useState({
    currentSurplus: 0,
    history: [],
    meta: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const chartDateRef = useRef(null)

  const fetchData = useCallback(async (override, { silent = false } = {}) => {
    if (!silent) setLoading(true)
    setError(null)
    let url = '/api/v1/surplus/daily'
    if (override === null) {
      chartDateRef.current = null
    } else if (typeof override === 'string') {
      url += `?date=${override}`
    } else if (chartDateRef.current) {
      url += `?date=${chartDateRef.current}`
    }
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setSurplusData({
        currentSurplus: data.currentSurplus,
        history: data.history || [],
        meta: data.meta || null,
      })
      if (data.meta?.requestedDate) {
        chartDateRef.current = data.meta.requestedDate
      }
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Backend fetch error:', err)
      setError(err.message || 'Unbekannter Fehler')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  /** Daten neu laden (heute, Chart: letzte 3 h) */
  const handleRefresh = useCallback(() => {
    void fetchData(null, { silent: false })
  }, [fetchData])

  useEffect(() => {
    void fetchData(undefined, { silent: false })
    const intervalId = setInterval(() => {
      void fetchData(undefined, { silent: true })
    }, 60000)
    return () => clearInterval(intervalId)
  }, [fetchData])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void fetchData(undefined, { silent: true })
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [fetchData])

  return (
    <div>
      <nav className="navbar">
        <h1 className="navbar-title">vZEV Bährenackerweg West</h1>
        <ThemeToggle />
      </nav>

      {error ? (
        <div className="banner banner-error" role="alert">
          Daten konnten nicht geladen werden ({error}).
        </div>
      ) : null}
      {loading && surplusData.history.length === 0 && !error ? (
        <div className="banner banner-info">Lade Daten …</div>
      ) : null}

      <div className="dashboard-container">
        <SurplusGauge
          currentSurplus={surplusData.currentSurplus}
          lastUpdated={lastUpdated}
        />
        <HistoryChart
          data={surplusData.history}
          meta={surplusData.meta}
          onRefresh={handleRefresh}
          loading={loading}
        />
      </div>
    </div>
  )
}

export default App
