import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * UpdateNotification
 * ──────────────────
 * Listens for the PWA "updatefound" event from the Service Worker.
 * When a new version is available after a Vercel push, a floating
 * romantic bubble appears at the bottom of the screen offering Mori
 * a one-click refresh to load the latest content.
 */
export default function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false)
  const [registration, setRegistration] = useState(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    // Listen for a new SW waiting to activate
    navigator.serviceWorker.ready.then((reg) => {
      setRegistration(reg)

      // New SW found while page is open
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        if (!newWorker) return
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // There's an old SW + a new one waiting → show notification
            setShowUpdate(true)
          }
        })
      })
    })

    // Also detect if we're already waiting on page load
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg?.waiting && navigator.serviceWorker.controller) {
        setShowUpdate(true)
        setRegistration(reg)
      }
    })
  }, [])

  const handleUpdate = () => {
    if (registration?.waiting) {
      // Tell the waiting SW to take control immediately
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
    setShowUpdate(false)
    // Reload after a tiny delay so the new SW activates first
    setTimeout(() => window.location.reload(), 300)
  }

  return (
    <AnimatePresence>
      {showUpdate && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 340, damping: 28 }}
          style={{
            position: 'fixed',
            bottom: '5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            background: 'rgba(4, 10, 40, 0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(91,156,246,0.35)',
            borderRadius: '20px',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 24px rgba(91,156,246,0.12)',
            maxWidth: 'min(360px, 90vw)',
            width: 'max-content',
            direction: 'rtl',
          }}
        >
          {/* Icon */}
          <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>💙</span>

          {/* Text */}
          <div style={{ flex: 1 }}>
            <p style={{
              fontFamily: `'Scheherazade New', serif`,
              fontSize: '0.95rem',
              color: 'rgba(212, 232, 255, 0.92)',
              margin: 0,
              lineHeight: 1.5,
            }}>
              في تحديث جديد من خالد..
            </p>
            <p style={{
              fontFamily: `'Scheherazade New', serif`,
              fontSize: '0.82rem',
              color: 'rgba(168,200,248,0.55)',
              margin: '2px 0 0',
            }}>
              حمّلي التحديث عشان تشوفي كل حاجة جديدة 🌙
            </p>
          </div>

          {/* Update Button */}
          <motion.button
            onClick={handleUpdate}
            whileHover={{ scale: 1.05, boxShadow: '0 0 16px rgba(91,156,246,0.4)' }}
            whileTap={{ scale: 0.96 }}
            style={{
              background: 'linear-gradient(135deg, rgba(52,110,215,0.9), rgba(26,62,145,0.95))',
              border: '1px solid rgba(91,156,246,0.4)',
              borderRadius: '12px',
              color: '#d4e8ff',
              fontFamily: `'Scheherazade New', serif`,
              fontSize: '0.88rem',
              fontWeight: 600,
              padding: '7px 16px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            تحديث الآن 🔄
          </motion.button>

          {/* Dismiss */}
          <button
            onClick={() => setShowUpdate(false)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(168,200,248,0.4)', fontSize: '1rem',
              padding: '0 2px', flexShrink: 0, lineHeight: 1,
            }}
            aria-label="إغلاق"
          >
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
