import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

const TABS = [
  { path: '/birthday', label: 'Mori Birthday', icon: '🎂' },
  { path: '/eid',      label: 'Eid with Mori', icon: '💙' },
]

export default function WorldSwitcher() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const active = pathname.startsWith('/eid') ? '/eid' : '/birthday'

  return (
    <motion.div
      style={S.root}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
    >
      <div style={S.pill}>
        {/* Animated sliding highlight */}
        <motion.div
          style={S.highlight}
          animate={{ x: active === '/birthday' ? 0 : '100%' }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        />

        {TABS.map(tab => {
          const isActive = active === tab.path
          return (
            <motion.button
              key={tab.path}
              style={{
                ...S.tab,
                color: isActive ? 'rgba(240,232,220,0.95)' : 'rgba(168,200,248,0.4)',
              }}
              onClick={() => navigate(tab.path)}
              whileTap={{ scale: 0.96 }}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <motion.span
                animate={{ scale: isActive ? 1.12 : 0.92, opacity: isActive ? 1 : 0.5 }}
                transition={{ duration: 0.35, ease: [0.22,1,0.36,1] }}
                style={{ lineHeight: 1, fontSize: 'clamp(0.85rem, 2.4vw, 0.95rem)' }}
              >
                {tab.icon}
              </motion.span>
              <motion.span
                animate={{ opacity: isActive ? 1 : 0.45 }}
                transition={{ duration: 0.3 }}
                style={{ fontSize: 'clamp(0.68rem, 1.9vw, 0.8rem)', letterSpacing: '0.05em' }}
              >
                {tab.label}
              </motion.span>
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}

const S = {
  root: {
    position: 'fixed',
    top: 'clamp(0.7rem, 2vw, 1.1rem)',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 500,
  },
  pill: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(4, 10, 32, 0.82)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(90,150,240,0.16)',
    borderRadius: 999,
    padding: '3px',
    boxShadow: '0 8px 36px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: 3, bottom: 3, left: 3,
    width: 'calc(50% - 3px)',
    borderRadius: 996,
    background: 'linear-gradient(135deg, rgba(48,108,210,0.62) 0%, rgba(24,60,135,0.72) 100%)',
    boxShadow: '0 0 20px rgba(48,108,210,0.28), inset 0 1px 0 rgba(255,255,255,0.06)',
    border: '1px solid rgba(90,150,240,0.22)',
    pointerEvents: 'none',
  },
  tab: {
    position: 'relative', zIndex: 1,
    display: 'flex', alignItems: 'center', gap: '0.38rem',
    padding: 'clamp(7px,2vw,9px) clamp(16px,4vw,26px)',
    borderRadius: 996,
    border: 'none', background: 'transparent',
    cursor: 'pointer',
    fontFamily: `'Cormorant Garamond', Georgia, serif`,
    fontWeight: 500,
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap',
    outline: 'none',
    WebkitTapHighlightColor: 'transparent',
    transition: 'color 0.32s',
    minWidth: 'clamp(115px, 28vw, 152px)',
    justifyContent: 'center',
  },
}
