import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const signals = [
  { type: 'thought', icon: '💭', label: 'فكرت فيك', color: '#a8c8f8' },
  { type: 'pray',    icon: '🤲', label: 'دعيتلك',   color: '#e8c97e' },
  { type: 'safe',    icon: '🛡️', label: 'بخير الحمدلله',     color: '#f4c2d7' },
  { type: 'missing', icon: '❤️', label: 'وحشتني',  color: '#ff4d4d' },
]

export default function SoulSignals({ onSendPulse }) {
  const getCooldownStatus = () => {
    const oneHour = 60 * 60 * 1000
    const now = Date.now()
    const status = {}
    
    signals.forEach(sig => {
      const last = localStorage.getItem(`pulse_${sig.type}_time`)
      if (last) {
        const remaining = Math.max(0, oneHour - (now - parseInt(last, 10)))
        if (remaining > 0) {
          status[sig.type] = remaining
        }
      }
    })
    return status
  }

  const [pulseCooldowns, setPulseCooldowns] = useState(getCooldownStatus)

  useEffect(() => {
    const timer = setInterval(() => {
      setPulseCooldowns(getCooldownStatus())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handlePulse = (type) => {
    if (pulseCooldowns[type]) return
    onSendPulse(type)
    setPulseCooldowns(prev => ({ ...prev, [type]: 3600000 }))
  }

  const formatTime = (ms) => {
    const totalSeconds = Math.ceil(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div style={S.container}>
      <h3 style={S.title}>نبضات سريعة لقلب دودو 💙</h3>
      <p style={S.subtitle}>لو وحشتيني.. دوسي هنا وهيوصلي إحساسك فوراً ✨</p>
      <div style={S.grid}>
        {signals.map((sig) => (
          <motion.button
            key={sig.type}
            style={{ 
              ...S.btn, 
              borderColor: `${sig.color}33`,
              opacity: pulseCooldowns[sig.type] ? 0.7 : 1,
              filter: pulseCooldowns[sig.type] ? 'grayscale(0.3)' : 'none'
            }}
            whileHover={!pulseCooldowns[sig.type] ? { scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' } : {}}
            whileTap={!pulseCooldowns[sig.type] ? { scale: 0.95 } : {}}
            onClick={() => handlePulse(sig.type)}
            disabled={pulseCooldowns[sig.type] > 0}
          >
            <span style={S.icon}>{sig.icon}</span>
            <span style={{...S.label, color: sig.color}}>{sig.label}</span>
            
            {pulseCooldowns[sig.type] > 0 && (
              <div style={S.lockedOverlay}>
                <div style={S.overlayContent}>
                  <span style={S.overlayMain}>وصله 💙</span>
                  <span style={S.overlayTimer}>{formatTime(pulseCooldowns[sig.type])}</span>
                </div>
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

const S = {
  container: {
    width: '100%',
    padding: '25px 0 10px',
    marginTop: '20px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    direction: 'rtl'
  },
  title: {
    fontFamily: `'Scheherazade New', serif`,
    fontSize: '1.2rem',
    color: 'rgba(244, 194, 215, 0.7)',
    marginBottom: '8px',
    textAlign: 'center'
  },
  subtitle: {
    fontFamily: `'Scheherazade New', serif`,
    fontSize: '0.95rem',
    color: 'rgba(168, 200, 248, 0.5)',
    marginBottom: '20px',
    textAlign: 'center',
    fontStyle: 'italic'
  },
  grid: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  btn: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 18px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    cursor: 'pointer',
    minWidth: '100px',
    overflow: 'hidden'
  },
  icon: {
    fontSize: '1.5rem'
  },
  label: {
    fontFamily: `'Scheherazade New', serif`,
    fontSize: '1.1rem',
    fontWeight: 'bold'
  },
  lockedOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(8, 20, 45, 0.7)',
    backdropFilter: 'blur(2px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#a8c8f8',
    fontFamily: `'Scheherazade New', serif`,
    borderRadius: '16px'
  },
  overlayContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px'
  },
  overlayMain: {
    fontSize: '0.8rem',
    fontWeight: 'bold'
  },
  overlayTimer: {
    fontSize: '0.7rem',
    opacity: 0.8,
    fontFamily: 'monospace'
  }
}
