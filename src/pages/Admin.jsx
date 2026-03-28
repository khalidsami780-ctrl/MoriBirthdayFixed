import { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function Admin() {
  const [auth, setAuth] = useState(false)
  const [visitors, setVisitors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Basic password protection
    const pass = window.prompt("Enter Admin Password:")
    if (pass !== "khalid123") {
      setLoading(false)
      return
    }

    setAuth(true)

    if (!db) {
       console.error("Firestore not initialized")
       setLoading(false)
       return
    }

    // Initialize real-time listener
    const unsubscribe = onSnapshot(collection(db, "visitors"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      // Sort by timestamp descending (newest first)
      data.sort((a, b) => b.timestamp - a.timestamp)
      
      setVisitors(data)
      setLoading(false)
    }, (error) => {
      console.error("Error with real-time visitor sync: ", error)
      setLoading(false)
    })

    // Cleanup listener on unmount
    return () => unsubscribe()
  }, [])

  // --- Chart Data Transformation ---
  const deviceCounts = { Mobile: 0, Desktop: 0 }
  const browserCounts = {}

  visitors.forEach(v => {
    if (v.deviceType === 'Mobile') deviceCounts.Mobile++
    else if (v.deviceType === 'Desktop') deviceCounts.Desktop++
    else deviceCounts.Desktop++ // fallback just in case

    const b = v.browser || 'Unknown'
    browserCounts[b] = (browserCounts[b] || 0) + 1
  })

  // Format data for Recharts Pie
  const deviceData = [
    { name: 'Mobile', value: deviceCounts.Mobile },
    { name: 'Desktop', value: deviceCounts.Desktop }
  ]
  const COLORS = ['#5b9cf6', '#a8c8f8']

  // Format data for Recharts Bar
  const browserData = Object.keys(browserCounts).map(key => ({
    name: key,
    count: browserCounts[key]
  }))

  const S = {
    container: { minHeight: '100dvh', backgroundColor: 'var(--bg-deep, #03091a)', color: 'var(--cream, #f0e8dc)', padding: 'clamp(1rem, 4vw, 3rem)', fontFamily: 'system-ui, sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', borderBottom: '1px solid rgba(90, 150, 240, 0.2)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' },
    titleGroup: { display: 'flex', flexDirection: 'column', gap: '0.3rem' },
    title: { fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', color: 'var(--blue-200, #a8c8f8)', margin: 0 },
    statsCard: { backgroundColor: 'var(--bg-card, rgba(26, 74, 138, 0.25))', border: '1px solid rgba(90, 150, 240, 0.3)', borderRadius: '12px', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '160px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' },
    statsTitle: { fontSize: '0.85rem', color: 'var(--cream-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem 0' },
    statsValue: { fontSize: '3.5rem', fontWeight: 'bold', color: 'var(--cream)', margin: 0, lineHeight: 1 },
    refreshBtn: { marginTop: '1rem', padding: '0.6rem 1.2rem', backgroundColor: 'rgba(90, 150, 240, 0.15)', border: '1px solid rgba(90, 150, 240, 0.4)', borderRadius: '8px', color: 'var(--cream)', cursor: 'pointer', outline: 'none', transition: 'background 0.2s', fontSize: '0.9rem' },
    chartsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' },
    chartWrapper: { backgroundColor: 'var(--bg-card, rgba(8, 18, 48, 0.62))', borderRadius: '12px', border: '1px solid rgba(90, 150, 240, 0.15)', padding: '1rem', height: '300px', display: 'flex', flexDirection: 'column' },
    chartTitle: { fontSize: '1.1rem', color: 'var(--blue-300)', marginBottom: '1rem', textAlign: 'center' },
    error: { color: '#ff4a4a', textAlign: 'center', marginTop: '30vh', fontSize: '2rem', letterSpacing: '0.05em' },
    loading: { textAlign: 'center', marginTop: '30vh', fontSize: '1.2rem', color: 'var(--blue-300, #88b8f8)' },
    card: { overflowX: 'auto', backgroundColor: 'var(--bg-card, rgba(8, 18, 48, 0.62))', borderRadius: '12px', border: '1px solid rgba(90, 150, 240, 0.15)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' },
    table: { width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left' },
    th: { padding: '1.2rem 1rem', backgroundColor: 'rgba(26, 74, 138, 0.3)', borderBottom: '1px solid rgba(90, 150, 240, 0.25)', fontWeight: '600', color: 'var(--blue-300, #88b8f8)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' },
    td: { padding: '1rem', borderBottom: '1px solid rgba(90, 150, 240, 0.1)', fontSize: '0.95rem' },
    dateData: { color: 'var(--blue-200, #a8c8f8)', fontSize: '0.85rem' }
  }

  // Pre-auth loading screen
  if (loading && !auth) return <div style={S.container}><p style={S.loading}>Authenticating...</p></div>
  // Failed auth
  if (!auth) return <div style={S.container}><h1 style={S.error}>Access Denied</h1></div>

  return (
    <div style={S.container}>
      <header style={S.header}>
        <div style={S.titleGroup}>
          <h1 style={S.title}>Analytics Dashboard</h1>
          {loading ? (
             <span style={{color: 'var(--blue-300)', fontSize: '0.9rem', letterSpacing: '0.05em'}}>● Connecting...</span>
          ) : (
             <span style={{color: '#4ade80', fontSize: '0.9rem', letterSpacing: '0.05em'}}>● Live Updates Active</span>
          )}
        </div>
        
        <div style={S.statsCard}>
          <p style={S.statsTitle}>Live Visitors</p>
          <p style={S.statsValue}>{visitors.length}</p>
        </div>
      </header>

      {/* Chart Visualizations */}
      {visitors.length > 0 && (
        <div style={S.chartsGrid}>
          {/* Device Pie Chart */}
          <div style={S.chartWrapper}>
            <h3 style={S.chartTitle}>Device Types</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={deviceData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                  {deviceData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#040F24', border: '1px solid #5b9cf6', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Browser Bar Chart */}
          <div style={S.chartWrapper}>
            <h3 style={S.chartTitle}>Browsers Breakdown</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={browserData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#88b8f8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#88b8f8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'rgba(90, 150, 240, 0.1)' }} contentStyle={{ backgroundColor: '#040F24', border: '1px solid #5b9cf6', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="#5b9cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      
      {/* Tabular Visitor Log */}
      <h3 style={{ ...S.chartTitle, textAlign: 'left', marginTop: '2.5rem' }}>Raw Visitor Logs</h3>
      <div style={S.card}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Date & Time</th>
              <th style={S.th}>Device</th>
              <th style={S.th}>Browser</th>
              <th style={S.th}>OS</th>
              <th style={S.th}>Location</th>
            </tr>
          </thead>
          <tbody>
            {visitors.map(v => (
              <tr key={v.id}>
                <td style={S.td}>
                  {/* Nicer formatted localized timestamp */}
                  <span style={S.dateData}>
                    {new Date(v.timestamp).toLocaleString('en-US', {
                      month: 'short', day: '2-digit',
                      hour: 'numeric', minute: '2-digit', hour12: true
                    })}
                  </span>
                </td>
                <td style={S.td}>{v.deviceType}</td>
                <td style={S.td}>{v.browser}</td>
                <td style={S.td}>{v.OS || v.os}</td>
                <td style={S.td}>{v.city}, {v.country}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {visitors.length === 0 && !loading && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--cream-dim)' }}>
            No visitors recorded yet. Waiting for traffic...
          </div>
        )}
      </div>
    </div>
  )
}
