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
    // Tracks the last processed pulse to avoid duplicate triggers within the same session
    let lastProcessedId = null;

    const handleStorage = () => {
      const stored = localStorage.getItem('mori_pulse_signal')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.id === lastProcessedId) return; // Skip if we just processed it

        // Only trigger if it's a new pulse (within the last 30 seconds) and of a valid type
        const seenKey = `pulse_seen_${parsed.id}`
        if (!localStorage.getItem(seenKey) && Date.now() - parsed.timestamp < 30000 && ['pulse', 'heart', 'hug', 'withher', 'withyou'].includes(parsed.type)) {
           lastProcessedId = parsed.id;
           triggerPulse(parsed)
        }
      }
    }

    const triggerPulse = (signal) => {
        setActivePulse(signal)
        const seenKey = `pulse_seen_${signal.id}`
        
        if (!localStorage.getItem(seenKey)) {
             if (signal.type === 'withher' || signal.type === 'withyou') {
                 sendTelegramMessage(`👁️ موري حست بحضورك الخفي معاها دلوقتي! ✨`)
             } else {
                 try { if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]); } catch(e) {}
                 sendTelegramMessage(`💖 موري استلمت التأثير دلوقتي وشافتها على شاشتها! ✨`)
             }
             localStorage.setItem(seenKey, 'true')
        }

        const isCoPresence = signal.type === 'withher' || signal.type === 'withyou';
        const timer = setTimeout(() => {
            setActivePulse(null)
        }, isCoPresence ? 12000 : 6000) // 12 seconds for presence, 6 seconds for quick pulses

        return timer
    }

    let pulseTimer = null;

    const cleanup = pollTelegramReplies(
        () => {}, // onReply
        () => {}, // onNote
        (signal) => {
          if (['pulse', 'heart', 'hug', 'withher', 'withyou'].includes(signal.type)) {
            if (pulseTimer) clearTimeout(pulseTimer);
            pulseTimer = triggerPulse(signal)
          }
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
      {activePulse && (activePulse.type === 'withher' || activePulse.type === 'withyou') ? (
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           style={S.coPresenceOverlay}
           onClick={() => setActivePulse(null)}
        >
           <motion.div style={S.coPresenceGlowOuter} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 4, repeat: Infinity }} />
           
           <motion.div
             initial={{ y: 50, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             style={S.coPresenceToast}
           >
             <span style={{ fontSize: '1.2rem', filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.8))' }}>👁️</span>
             <p style={S.coPresenceText}>خالد يقرأ ويشعر معكِ بهذه الكلمات الآن بصمت...</p>
           </motion.div>
        </motion.div>
      ) : activePulse && (
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
            <span style={S.heart}>{activePulse.type === 'hug' ? '🫂' : '❤️'}</span>
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
            {activePulse.type === 'hug' ? 'روح خالد معاكي، بتطمنك وبتحتويكِ دلوقتي... 💙' : 'خالد بيبعتلك نبضة حب دلوقتي... 💙'}
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
  coPresenceOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000000,
    pointerEvents: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: '8vh'
  },
  coPresenceGlowOuter: {
    position: 'absolute',
    inset: 0,
    boxShadow: 'inset 0 0 100px rgba(91, 156, 246, 0.5), 0 0 40px rgba(91, 156, 246, 0.2)',
    border: '2px solid rgba(91, 156, 246, 0.3)',
    borderRadius: '12px',
    margin: '8px',
    pointerEvents: 'none'
  },
  coPresenceToast: {
    background: 'rgba(8, 20, 45, 0.85)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(91, 156, 246, 0.4)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(91, 156, 246, 0.3)',
    borderRadius: '100px',
    padding: '12px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    direction: 'rtl',
    pointerEvents: 'auto',
    cursor: 'pointer'
  },
  coPresenceText: {
    fontFamily: "'Scheherazade New', serif",
    fontSize: '1.25rem',
    color: '#a8c8f8',
    margin: 0
  },
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
