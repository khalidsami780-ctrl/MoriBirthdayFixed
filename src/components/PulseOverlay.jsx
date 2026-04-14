import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useTelegramBot } from '../hooks/useTelegramBot'

/**
 * PulseOverlay Component
 * Displays a glowing, animated heart pulse when Khalid sends a /pulse command.
 */
export default function PulseOverlay() {
  const [activePulse, setActivePulse] = useState(null)
  const { pollTelegramReplies, sendTelegramMessage } = useTelegramBot()

  useEffect(() => {
    // Check for pulse signal in localStorage
    const handleStorage = () => {
      const stored = localStorage.getItem('mori_pulse_signal')
      if (stored) {
        const parsed = JSON.parse(stored)
        // Only trigger if it's a new pulse (within the last 30 seconds)
        if (Date.now() - parsed.timestamp < 30000) {
           triggerPulse(parsed)
        }
      }
    }

    const triggerPulse = (signal) => {
        setActivePulse(signal)
        
        if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200])
        }

        const timer = setTimeout(() => {
            setActivePulse(null)
            const seenKey = `pulse_seen_${signal.id}`
            if (!localStorage.getItem(seenKey)) {
                sendTelegramMessage(`💖 موري استلمت "نبضة حبك" دلوقتي وشافتها على شاشتها! ✨`)
                localStorage.setItem(seenKey, 'true')
            }
        }, 6000) // 6 seconds auto-hide

        return timer
    }

    let pulseTimer = null;

    const cleanup = pollTelegramReplies(
        () => {}, // onReply
        () => {}, // onNote
        (signal) => {
          if (pulseTimer) clearTimeout(pulseTimer);
          pulseTimer = triggerPulse(signal)
        }
    )

    window.addEventListener('storage', handleStorage)
    handleStorage()

    return () => {
        cleanup()
        if (pulseTimer) clearTimeout(pulseTimer)
        window.removeEventListener('storage', handleStorage)
    }
  }, [pollTelegramReplies, sendTelegramMessage])

  return createPortal(
    <AnimatePresence>
      {activePulse && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={S.overlay}
          onClick={() => setActivePulse(null)}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ 
                scale: [0.8, 1.2, 1],
                opacity: [0.5, 1, 0.8],
                filter: [
                    'drop-shadow(0 0 20px rgba(255, 77, 77, 0.4))',
                    'drop-shadow(0 0 60px rgba(255, 77, 77, 0.8))',
                    'drop-shadow(0 0 30px rgba(255, 77, 77, 0.6))'
                ]
            }}
            transition={{ 
                duration: 2, 
                repeat: 2, 
                ease: "easeInOut" 
            }}
            style={S.heartContainer}
          >
            <span style={S.heart}>❤️</span>
            <motion.div 
               animate={{ scale: [1, 2], opacity: [0.5, 0] }}
               transition={{ duration: 1.5, repeat: Infinity }}
               style={S.ripple}
            />
          </motion.div>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            style={S.text}
          >
            خالد بيبعتلك نبضة حب دلوقتي... 💙
          </motion.p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: '10px' }}>
            اضغطي في أي مكان للإغلاق
          </p>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

const S = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000000,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(circle, rgba(255, 77, 77, 0.15) 0%, rgba(3, 9, 26, 0.85) 100%)',
    backdropFilter: 'blur(8px)',
    pointerEvents: 'auto',
    cursor: 'pointer',
    direction: 'rtl'
  },
  heartContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  heart: {
    fontSize: 'clamp(8rem, 25vw, 12rem)',
    filter: 'drop-shadow(0 0 30px rgba(255, 77, 77, 0.5))'
  },
  ripple: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    border: '4px solid rgba(255, 77, 77, 0.3)',
  },
  text: {
    fontFamily: "'Scheherazade New', serif",
    fontSize: '1.8rem',
    color: '#fff',
    marginTop: '40px',
    textShadow: '0 0 20px rgba(255,255,255,0.5)',
    textAlign: 'center'
  }
}
