import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotifications } from '../hooks/useNotifications.js'
import { useNavigate } from 'react-router-dom'

export default function GlobalToast() {
  const { notifications } = useNotifications()
  const [toastQueue, setToastQueue] = useState([])
  const audioRef = useRef(null)
  
  useEffect(() => {
    if (notifications.length === 0) return

    let storedAlerted = []
    try { 
      storedAlerted = JSON.parse(localStorage.getItem('mori_alerted_notifs') || '[]') 
    } catch {}

    // Find notifications that have NEVER played a toast/sound on this device
    const unAlertedNotifs = notifications.filter(n => !storedAlerted.includes(n.id) && !n.isRead)

    if (unAlertedNotifs.length > 0) {
       // Mark them all alerted right now so they don't fire on refresh
       const newAlerted = [...storedAlerted, ...unAlertedNotifs.map(n => n.id)]
       localStorage.setItem('mori_alerted_notifs', JSON.stringify(newAlerted))
       
       // Queue them for visual display
       setToastQueue(prev => [...prev, ...unAlertedNotifs])

       // Chime!
       if (audioRef.current) {
         audioRef.current.volume = 0.4
         // Play wrapper in case strict browsers block DOM autoplay
         audioRef.current.play().catch(e => console.log("Autoplay handled natively", e))
       }
    }
  }, [notifications])

  return (
    <>
      {/* romantic bell tone */}
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />
      
      <div style={S.toastContainer}>
        <AnimatePresence>
          {toastQueue.map((toast, index) => (
            <ToastItem 
               key={toast.id + '-' + index} 
               toast={toast} 
               onDismiss={() => setToastQueue(q => q.filter(x => x.id !== toast.id))} 
            />
          ))}
        </AnimatePresence>
      </div>
    </>
  )
}

function ToastItem({ toast, onDismiss }) {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss()
    }, 4500) // Auto-dismiss after 4.5s
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      style={S.toastCard}
      onClick={() => {
        onDismiss()
        if (toast.route) {
          navigate(toast.route, { state: { scrollTarget: toast.targetId, tab: toast.tab } })
        }
      }}
      whileHover={{ scale: 1.02, boxShadow: '0 12px 30px rgba(168, 200, 248, 0.4)' }}
    >
      <div style={S.toastIcon}>✨</div>
      <div style={S.toastText}>{toast.text}</div>
    </motion.div>
  )
}

const S = {
  toastContainer: {
    position: 'fixed',
    top: '1.5rem',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    alignItems: 'center',
    pointerEvents: 'none', // Allow clicking through the container
    width: '100%',
    padding: '0 1rem'
  },
  toastCard: {
    pointerEvents: 'auto', // But allow clicking the toast itself
    cursor: 'pointer',
    background: 'linear-gradient(135deg, rgba(168, 200, 248, 0.15) 0%, rgba(244, 194, 215, 0.1) 100%)',
    backdropFilter: 'blur(25px)',
    WebkitBackdropFilter: 'blur(25px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.2)',
    borderRadius: '16px',
    padding: '14px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    maxWidth: '400px',
    width: 'fit-content'
  },
  toastIcon: {
    fontSize: '1.4rem',
    lineHeight: 1,
    filter: 'drop-shadow(0 2px 5px rgba(168, 200, 248, 0.8))'
  },
  toastText: {
    fontFamily: `'Scheherazade New', 'Arial', serif`,
    fontSize: '1.15rem',
    color: '#fff',
    fontWeight: 'bold',
    direction: 'rtl',
    textShadow: '0 1px 4px rgba(0,0,0,0.5)',
    margin: 0
  }
}
