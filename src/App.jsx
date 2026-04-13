import { lazy, Suspense, useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

/* ── Code splitting: each page loads only when navigated to ── */
const BirthdayPage  = lazy(() => import('./pages/BirthdayPage.jsx'))
const EidPage       = lazy(() => import('./pages/EidPage.jsx'))
const MessagesPage  = lazy(() => import('./pages/MessagesPage.jsx'))
const SafeBox       = lazy(() => import('./components/SafeBox.jsx'))
const GlobalToast   = lazy(() => import('./components/GlobalToast.jsx'))
const RandomLoveToast = lazy(() => import('./components/RandomLoveToast.jsx'))
const FloatingMusicPlayer = lazy(() => import('./components/FloatingMusicPlayer.jsx'))
const UpdateNotification = lazy(() => import('./components/UpdateNotification.jsx'))
const NotificationBell = lazy(() => import('./components/NotificationBell.jsx'))
const Navbar = lazy(() => import('./components/Navbar.jsx'))
const LiveNote = lazy(() => import('./components/LiveNote.jsx'))

import { useTelegramBot } from './hooks/useTelegramBot.js'
/* ── Full-screen loading fallback ─────────────────────────── */
function PageLoader() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
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

export default function App() {
  const location = useLocation()
  const [showEnhancements, setShowEnhancements] = useState(false)
  const { checkFirstVisitToday, checkWeeklyReport, trackDeepEngagement } = useTelegramBot()

  useEffect(() => {
    // Initial tracking on app mount
    checkFirstVisitToday()
    checkWeeklyReport()
  }, [checkFirstVisitToday, checkWeeklyReport])

  // Global Engagement Timer (tracks if she spends a long time in the site today)
  useEffect(() => {
    const milestones = [15, 30, 45, 60]; // minutes
    const timers = milestones.map(mins => {
      return setTimeout(() => {
        trackDeepEngagement(mins);
      }, mins * 60 * 1000);
    });

    return () => timers.forEach(clearTimeout);
  }, [trackDeepEngagement]);

  useEffect(() => {
    let cancelled = false
    let cleanup = () => {}

    const startDeferredWork = () => {
      if (cancelled) return
      setShowEnhancements(true)
    }

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(startDeferredWork, { timeout: 1500 })
      cleanup = () => window.cancelIdleCallback(idleId)
    } else {
      const timeoutId = window.setTimeout(startDeferredWork, 180)
      cleanup = () => window.clearTimeout(timeoutId)
    }

    return () => {
      cancelled = true
      cleanup()
    }
  }, [])

  return (
    <Suspense fallback={<PageLoader />}>
      {/* 2. Routes Layer - Safebox portal inside here will stack ON TOP of Navbar */}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/"          element={<Navigate to="/birthday" replace />} />
          <Route path="/birthday"  element={<BirthdayPage />} />
          <Route path="/eid"       element={<EidPage />} />
          <Route path="/messages"  element={<MessagesPage />} />
          <Route path="/safebox"   element={<SafeBox />} />
          <Route path="*"          element={<Navigate to="/birthday" replace />} />
        </Routes>
      </AnimatePresence>

      {/* 1. Base UI Layer (Portalled) */}
      <Navbar />

      {/* 3. Utility & Global Layer (rendered last = highest top) */}
      {showEnhancements && (
        <Suspense fallback={null}>
          <FloatingMusicPlayer />
          <RandomLoveToast />
          <UpdateNotification />
          <NotificationBell />
          <GlobalToast />
          <LiveNote />
        </Suspense>
      )}
    </Suspense>
  )
}
