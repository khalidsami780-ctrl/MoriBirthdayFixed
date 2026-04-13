import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTelegramBot } from '../hooks/useTelegramBot'
import { createPortal } from 'react-dom'

/**
 * LiveNote Component
 * Displays a floating, interactive message from Khalid that updates in real-time.
 */
export default function LiveNote() {
  const [note, setNote] = useState(null)
  const [show, setShow] = useState(false)
  const [hasReacted, setHasReacted] = useState(false)
  const { pollTelegramReplies, sendNoteReaction } = useTelegramBot()

  useEffect(() => {
    // Initial load from storage to see if there's a recent note
    const stored = localStorage.getItem('mori_live_note')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setNote(parsed)
        setShow(true)
      } catch (e) {
        // Fallback for old simple string storage
        setNote({ text: stored, timestamp: Date.now() })
        setShow(true)
      }
    }

    // Start polling the bot for new messages from Khalid
    const cleanup = pollTelegramReplies(
      () => {}, // ignore standard button replies here
      (newNote) => {
        setNote(newNote)
        setShow(true)
        setHasReacted(false) // reset reaction status for the new message
      }
    )

    return cleanup
  }, [pollTelegramReplies])

  const handleHeart = () => {
    if (hasReacted || !note) return
    sendNoteReaction(note)
    setHasReacted(true)
  }

  const formatTime = (ts) => {
    if (!ts) return "وصلت الآن ⚡"
    try {
      const date = new Date(ts)
      return `أرسلت في ${date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true })} ⚡`
    } catch {
      return "وصلت الآن ⚡"
    }
  }

  return createPortal(
    <AnimatePresence>
      {show && note && (
        <motion.div
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0.2}
          initial={{ x: -100, opacity: 0, scale: 0.8 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: -100, opacity: 0, scale: 0.8 }}
          style={S.container}
        >
          <div style={S.card}>
            <div style={S.header}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={S.pulseDot} />
                <span style={S.title}>رسالة لكِ من قلب خالد 💌</span>
              </div>
              <button 
                onClick={() => setShow(false)} 
                style={S.close}
                title="إخفاء"
              >
                ✕
              </button>
            </div>
            
            <div style={S.content}>
               <p style={S.text}>{note.text || note}</p>
            </div>

            <div style={S.footer}>
              <div style={S.timestamp}>{formatTime(note.timestamp)}</div>
              <motion.button
                whileHover={{ scale: 1.3, color: '#ff4d4d' }}
                whileTap={{ scale: 0.9 }}
                onClick={handleHeart}
                style={{
                  ...S.heartBtn, 
                  color: hasReacted ? '#ff4d4d' : 'rgba(255,255,255,0.3)',
                  filter: hasReacted ? 'drop-shadow(0 0 8px rgba(255,77,77,0.4))' : 'none'
                }}
              >
                {hasReacted ? '❤️' : '🤍'}
              </motion.button>
            </div>
            
            <div style={S.dragHint}>اسحبي الرسالة لتحريكها</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

const S = {
  container: {
    position: 'fixed',
    bottom: '90px', // Above the music player
    left: '20px',
    zIndex: 99999,
    width: 'min(280px, 85vw)',
    pointerEvents: 'auto',
    cursor: 'grab'
  },
  card: {
    background: 'rgba(10, 25, 60, 0.85)',
    backdropFilter: 'blur(25px) saturate(160%)',
    WebkitBackdropFilter: 'blur(25px) saturate(160%)',
    border: '1px solid rgba(168, 200, 248, 0.35)',
    borderRadius: '24px',
    padding: '18px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.6), inset 0 0 20px rgba(91,156,246,0.1)',
    direction: 'rtl',
    fontFamily: "'Scheherazade New', serif",
    position: 'relative',
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    paddingBottom: '8px'
  },
  pulseDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#5b9cf6',
    boxShadow: '0 0 10px #5b9cf6'
  },
  title: {
    fontSize: '0.9rem',
    color: 'rgba(168, 200, 248, 0.7)',
    fontWeight: 'bold',
    letterSpacing: '0.3px'
  },
  close: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '0.7rem',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
  },
  content: {
    padding: '4px 0'
  },
  text: {
    fontSize: '1.35rem',
    color: '#f0e8dc',
    lineHeight: 1.5,
    margin: 0,
    textShadow: '0 2px 4px rgba(0,0,0,0.3)'
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '14px',
    paddingTop: '8px',
    borderTop: '1px solid rgba(255,255,255,0.05)'
  },
  timestamp: {
    fontSize: '0.75rem',
    color: 'rgba(168, 200, 248, 0.4)',
    fontStyle: 'italic'
  },
  heartBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.6rem',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  },
  dragHint: {
    position: 'absolute',
    bottom: '4px',
    left: '0',
    right: '0',
    textAlign: 'center',
    fontSize: '0.55rem',
    color: 'rgba(255,255,255,0.15)',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  }
}
