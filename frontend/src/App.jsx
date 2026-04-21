import { useState, useEffect } from 'react'
import ThemeToggle from './components/ThemeToggle'
import SurplusGauge from './components/SurplusGauge'
import HistoryChart from './components/HistoryChart'

function App() {
  const [surplusData, setSurplusData] = useState({ currentSurplus: 8.4, history: [] })

  useEffect(() => {
    const fetchData = () => {
      // Fetch data from the FastAPI Backend (Proxied via Vite during Dev)
      fetch('/api/v1/surplus/daily')
        .then(res => res.json())
        .then(data => {
          setSurplusData(data)
        })
        .catch(err => {
          console.error("Backend fetch error:", err)
        })
    };

    fetchData(); // Initial load
    
    // Auto-refresh every 60 seconds
    const intervalId = setInterval(fetchData, 60000);
    return () => clearInterval(intervalId);
  }, [])

  return (
    <div>
      <nav className="navbar">
        <h2 style={{ margin: 0, fontWeight: 500 }}>PV Energie Hub</h2>
        <ThemeToggle />
      </nav>
      
      <div className="dashboard-container">
        <SurplusGauge currentSurplus={surplusData.currentSurplus} />
        <HistoryChart data={surplusData.history} />
      </div>
    </div>
  )
}

export default App
