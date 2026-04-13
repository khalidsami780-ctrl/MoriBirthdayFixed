import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'

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
  const intervalRef = useRef(null)
  const registrationRef = useRef(null)
  const audioRef = useRef(null)

  const checkUpdate = useCallback((reg) => {
    if (!reg) return
    // Force the browser to check for a new sw.js
    reg.update().catch(err => console.debug('Worker update failed', err))
  }, [])

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const startPolling = useCallback((reg) => {
    stopPolling()
    if (!reg || document.visibilityState !== 'visible') return
    intervalRef.current = setInterval(() => checkUpdate(reg), 60 * 1000)
  }, [checkUpdate, stopPolling])

  const playNotificationSound = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('https://res.cloudinary.com/djdktudjh/video/upload/v1714652285/notification-chime_u2v0a5.mp3')
      audioRef.current.preload = 'auto'
    }

    audioRef.current.currentTime = 0
    audioRef.current.volume = 0.4
    audioRef.current.play().catch(error => console.debug('Audio play blocked by browser', error))
  }, [])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    let detachUpdateFound = null

    const handleVisibilityChange = () => {
      const reg = registrationRef.current
      if (!reg) return

      if (document.visibilityState === 'visible') {
        checkUpdate(reg)
        startPolling(reg)
      } else {
        stopPolling()
      }
    }

    const handleOnline = () => {
      const reg = registrationRef.current
      if (!reg) return
      checkUpdate(reg)
      startPolling(reg)
    }

    navigator.serviceWorker.ready.then((reg) => {
      registrationRef.current = reg
      setRegistration(reg)

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

      const handleUpdateFound = () => {
        const newWorker = reg.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => onStateChange(newWorker))
        }
      }

      reg.addEventListener('updatefound', handleUpdateFound)
      detachUpdateFound = () => reg.removeEventListener('updatefound', handleUpdateFound)

      // 3. Poll only while the tab is visible to avoid background wakeups.
      checkUpdate(reg)
      startPolling(reg)
    })

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('online', handleOnline)

    return () => {
      stopPolling()
      detachUpdateFound?.()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('online', handleOnline)
    }
  }, [checkUpdate, playNotificationSound, startPolling, stopPolling])

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

  return createPortal(
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
          
          <div style={{ flex: 1, paddingRight: '4px' }}>
            <p style={{ fontFamily: `'Scheherazade New', serif`, fontSize: '0.92rem', fontWeight: 500, color: 'rgba(215, 235, 255, 1)', margin: 0, lineHeight: 1.4 }}>خالد ضاف لك حاجة جديدة..</p>
            <p style={{ fontFamily: `'Scheherazade New', serif`, fontSize: '0.8rem', color: 'rgba(168,200,248,0.65)', margin: '2px 0 0' }}>دوسي تحديث عشان تشوفيها دلوقتي ✨</p>
          </div>

          <motion.button onClick={handleUpdate} whileHover={{ scale:1.05, background:'rgba(91,156,246,0.2)' }} whileTap={{ scale:0.95 }}
            style={{ background: 'rgba(91,156,246,0.12)', border: '1px solid rgba(91,156,246,0.3)', borderRadius: '14px', color: '#97c2ff', fontFamily: `'Scheherazade New', serif`, fontSize: '0.85rem', padding: '8px 14px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.3s ease' }}>تحديث 🔄</motion.button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
