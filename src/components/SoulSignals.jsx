import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useCooldown, formatTime } from '../hooks/useCooldown.js'

const signals = [
  { type: 'thought', icon: '💭', label: 'فكرت فيك', color: '#a8c8f8' },
  { type: 'pray',    icon: '🤲', label: 'دعيتلك',   color: '#e8c97e' },
  { type: 'safe',    icon: '🛡️', label: 'بخير الحمدلله',     color: '#f4c2d7' },
  { type: 'missing', icon: '❤️', label: 'وحشتني',  color: '#ff4d4d' },
  { type: 'hug_request', icon: '🫂', label: 'محتاجة حضن', color: '#ff88cc' },
]

function SignalButton({ sig, onSendPulse }) {
  const { remainingTime, isActive } = useCooldown(`pulse_${sig.type}`, 60 * 60 * 1000);

  return (
    <motion.button
      style={{ 
        ...S.btn, 
        borderColor: `${sig.color}33`,
        opacity: isActive ? 0.7 : 1,
        filter: isActive ? 'grayscale(0.3)' : 'none'
      }}
      whileHover={!isActive ? { scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' } : {}}
      whileTap={!isActive ? { scale: 0.95 } : {}}
      onClick={() => !isActive && onSendPulse(sig.type)}
      disabled={isActive}
    >
      <span style={S.icon}>{sig.icon}</span>
      <span style={{...S.label, color: sig.color}}>{sig.label}</span>
      
      {isActive && (
        <div style={S.lockedOverlay}>
          <div style={S.overlayContent}>
            <span style={S.overlayMain}>وصله 💙</span>
            <span style={S.overlayTimer}>{formatTime(remainingTime)}</span>
          </div>
        </div>
      )}
    </motion.button>
  );
}

export default function SoulSignals({ onSendPulse }) {

  return (
    <div style={S.container}>
      <h3 style={S.title}>نبضات سريعة لقلب دودو 💙</h3>
      <p style={S.subtitle}>لو وحشتيني.. دوسي هنا وهيوصلي إحساسك فوراً ✨</p>
      <div style={S.grid}>
        {signals.map((sig) => (
          <SignalButton key={sig.type} sig={sig} onSendPulse={onSendPulse} />
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
