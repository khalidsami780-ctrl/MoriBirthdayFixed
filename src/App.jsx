import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

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

export default function App() {
  const location = useLocation()

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
