import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * UpdateNotification
 * ──────────────────
 * This version uses a more aggressive polling strategy to check for updates
 * every 60 seconds once the page is loaded, ensuring Khalid's pushes are 
 * detected quickly by Mori's browser.
 */
export default function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false)
  const [registration, setRegistration] = useState(null)

  const checkUpdate = useCallback((reg) => {
    if (!reg) return
    // Force the browser to check for a new sw.js
    reg.update().catch(err => console.debug('Worker update failed', err))
  }, [])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    let intervalId

    navigator.serviceWorker.ready.then((reg) => {
      setRegistration(reg)

      // Function to play a soft chime when update is found
      const playNotificationSound = () => {
        const audio = new Audio('https://res.cloudinary.com/djdktudjh/video/upload/v1714652285/notification-chime_u2v0a5.mp3')
        audio.volume = 0.4
        audio.play().catch(e => console.debug('Audio play blocked by browser', e))
      }

      // 1. Initial check for waiting worker
      if (reg.waiting && navigator.serviceWorker.controller) {
        setShowUpdate(true)
        playNotificationSound()
      }

      // 2. Listen for transition to 'installed' state
      const onStateChange = (newWorker) => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          setShowUpdate(true)
          playNotificationSound()
        }
      }

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => onStateChange(newWorker))
        }
      })

      // 3. Poll for updates every 60 seconds (Khalid's updates are frequent)
      intervalId = setInterval(() => checkUpdate(reg), 60 * 1000)
    })

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [checkUpdate])

  const handleUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
    setShowUpdate(false)
    // Small delay to let SW activate
    setTimeout(() => {
      window.location.reload()
    }, 200)
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
            bottom: '5.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            background: 'rgba(5, 12, 45, 0.96)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(91,156,246,0.3)',
            borderRadius: '24px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 30px rgba(91,156,246,0.15)',
            maxWidth: 'min(380px, 92vw)',
            width: 'max-content',
            direction: 'rtl',
          }}
        >
          {/* Animated Heart/Icon */}
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ fontSize: '1.4rem', flexShrink: 0 }}
          >
            💙
          </motion.div>

          {/* Text Container */}
          <div style={{ flex: 1, paddingRight: '4px' }}>
            <p style={{
              fontFamily: `'Scheherazade New', serif`,
              fontSize: '0.92rem',
              fontWeight: 500,
              color: 'rgba(215, 235, 255, 1)',
              margin: 0,
              lineHeight: 1.4,
            }}>
              خالد ضاف لك حاجة جديدة..
            </p>
            <p style={{
              fontFamily: `'Scheherazade New', serif`,
              fontSize: '0.8rem',
              color: 'rgba(168,200,248,0.65)',
              margin: '2px 0 0',
            }}>
              دوسي تحديث عشان تشوفيها دلوقتي ✨
            </p>
          </div>

          {/* Action Button */}
          <motion.button
            onClick={handleUpdate}
            whileHover={{ scale: 1.05, background: 'rgba(91,156,246,0.2)' }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: 'rgba(91,156,246,0.12)',
              border: '1px solid rgba(91,156,246,0.3)',
              borderRadius: '14px',
              color: '#97c2ff',
              fontFamily: `'Scheherazade New', serif`,
              fontSize: '0.85rem',
              padding: '8px 14px',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.3s ease',
            }}
          >
            تحديث 🔄
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
