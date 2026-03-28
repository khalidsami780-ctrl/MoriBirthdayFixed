import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { analytics, db } from './firebase.js'
import { logEvent } from 'firebase/analytics'
import { collection, addDoc } from 'firebase/firestore'

/* ── Code splitting: each page loads only when navigated to ── */
const BirthdayPage  = lazy(() => import('./pages/BirthdayPage.jsx'))
const EidPage       = lazy(() => import('./pages/EidPage.jsx'))
const MessagesPage  = lazy(() => import('./pages/MessagesPage.jsx'))

/* ── Full-screen loading fallback ─────────────────────────── */
function PageLoader() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9998,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-deep)',
    }}>
      <motion.div
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          fontFamily: `'Scheherazade New','Arial',serif`,
          fontSize: '1.5rem', color: 'rgba(168,200,248,0.6)',
          letterSpacing: '0.1em',
        }}
      >
        ✦
      </motion.div>
    </div>
  )
}

// Minimal User-Agent parser
function parseUserAgent(ua) {
  let os = 'Unknown', browser = 'Unknown'
  const device = /Mobile|Android|iP(ad|hone|od)/i.test(ua) ? 'Mobile' : 'Desktop'

  if (/Windows/i.test(ua)) os = 'Windows'
  else if (/Mac/i.test(ua)) os = 'MacOS'
  else if (/Linux/i.test(ua)) os = 'Linux'
  else if (/Android/i.test(ua)) os = 'Android'
  else if (/iP(ad|hone|od)/i.test(ua)) os = 'iOS'

  if (/Edg/i.test(ua)) browser = 'Edge'
  else if (/Chrome/i.test(ua)) browser = 'Chrome'
  else if (/Safari/i.test(ua)) browser = 'Safari'
  else if (/Firefox/i.test(ua)) browser = 'Firefox'

  return { device, os, browser }
}

export default function App() {
  const location = useLocation()

  useEffect(() => {
    // Abort if no analytics loaded OR if they have already visited
    if (!analytics || localStorage.getItem('hasVisited')) return

    const trackUniqueVisit = async () => {
      try {
        const { device, os, browser } = parseUserAgent(navigator.userAgent)
        let country = 'Unknown', city = 'Unknown'

        // Attempt location fetching silently
        try {
          const res = await fetch('https://ipapi.co/json/')
          if (res.ok) {
            const data = await res.json()
            country = data.country_name || 'Unknown'
            city = data.city || 'Unknown'
          }
        } catch (locErr) {
          // Ignored. E.g. adblocker blocked the API call.
        }

        const visitData = {
          deviceType: device,
          browser,
          OS: os,
          country,
          city,
          timestamp: Date.now()
        }

        // Send detailed Firebase Analytics event
        logEvent(analytics, 'unique_visit', visitData)

        // Save detailed record to Firestore Database
        if (db) {
          await addDoc(collection(db, "visitors"), visitData)
        }

        // Flag the browser so they aren't counted twice
        localStorage.setItem('hasVisited', 'true')
      } catch (e) {
        console.error('Tracking failed', e)
      }
    }

    trackUniqueVisit()
  }, [])

  return (
    <Suspense fallback={<PageLoader />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/"          element={<Navigate to="/birthday" replace />} />
          <Route path="/birthday"  element={<BirthdayPage />} />
          <Route path="/eid"       element={<EidPage />} />
          <Route path="/messages"  element={<MessagesPage />} />
          <Route path="*"          element={<Navigate to="/birthday" replace />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  )
}
