import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

const TABS = [
  { path: '/birthday', label: 'Mori Birthday', icon: '🎂', isNew: false },
  { path: '/eid',      label: 'Eid with Mori', icon: '💙', isNew: true  },
]

export default function WorldSwitcher() {
  const navigate        = useNavigate()
  const { pathname }    = useLocation()
  const active          = pathname.startsWith('/eid') ? '/eid' : '/birthday'
  const [pulse, setPulse] = useState(true)

  // Stop pulsing after user has seen the Eid tab
  useEffect(() => {
    if (active === '/eid') setPulse(false)
  }, [active])

  return (
    <motion.div
      style={S.root}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
    >
      <div style={S.pill}>
        {/* Sliding active highlight */}
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
                color: isActive ? '#f0e8dc' : 'rgba(168,200,248,0.75)',
              }}
              onClick={() => { navigate(tab.path); if (tab.isNew) setPulse(false) }}
              whileTap={{ scale: 0.95 }}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Icon */}
              <motion.span
                animate={{ scale: isActive ? 1.15 : 0.95, opacity: isActive ? 1 : 0.7 }}
                transition={{ duration: 0.32 }}
                style={{ lineHeight: 1, fontSize: 'clamp(0.9rem, 2.5vw, 1rem)' }}
              >
                {tab.icon}
              </motion.span>

              {/* Label */}
              <motion.span
                animate={{ opacity: isActive ? 1 : 0.75 }}
                transition={{ duration: 0.28 }}
                style={{ fontSize: 'clamp(0.7rem, 2vw, 0.82rem)', letterSpacing: '0.04em' }}
              >
                {tab.label}
              </motion.span>

              {/* NEW badge — only on Eid tab, disappears once visited */}
              <AnimatePresence>
                {tab.isNew && pulse && !isActive && (
                  <motion.span
                    style={S.badge}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    NEW
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Ping ring — draws the eye */}
              <AnimatePresence>
                {tab.isNew && pulse && !isActive && (
                  <motion.span
                    key="ping"
                    style={S.ping}
                    initial={{ scale: 0.8, opacity: 0.8 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                  />
                )}
              </AnimatePresence>
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
    top: 'clamp(0.65rem, 2vw, 1rem)',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 500,
  },

  pill: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    /* Much stronger background so it's readable on any page color */
    background: 'rgba(3, 8, 28, 0.88)',
    backdropFilter: 'blur(28px)',
    WebkitBackdropFilter: 'blur(28px)',
    /* Brighter border for more contrast against dark pages */
    border: '1px solid rgba(100, 160, 255, 0.32)',
    borderRadius: 999,
    padding: '3px',
    gap: 0,
    boxShadow: `
      0 0 0 1px rgba(0, 0, 0, 0.4),
      0 8px 32px rgba(0, 0, 0, 0.65),
      0 2px 8px rgba(0, 0, 0, 0.5),
      inset 0 1px 0 rgba(255,255,255,0.07)
    `,
    overflow: 'visible',   /* allow ping ring to bleed outside */
  },

  highlight: {
    position: 'absolute',
    top: 3, bottom: 3, left: 3,
    width: 'calc(50% - 3px)',
    borderRadius: 996,
    background: 'linear-gradient(135deg, rgba(52,115,220,0.75) 0%, rgba(26,65,145,0.85) 100%)',
    boxShadow: '0 0 22px rgba(52,115,220,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
    border: '1px solid rgba(100,160,255,0.3)',
    pointerEvents: 'none',
  },

  tab: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: 'clamp(8px, 2.2vw, 11px) clamp(14px, 4vw, 24px)',
    borderRadius: 996,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontFamily: `'Cormorant Garamond', Georgia, serif`,
    fontWeight: 600,
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap',
    outline: 'none',
    WebkitTapHighlightColor: 'transparent',
    transition: 'color 0.28s',
    minWidth: 'clamp(118px, 29vw, 150px)',
    justifyContent: 'center',
  },

  /* "NEW" text chip */
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '1px 6px',
    borderRadius: 999,
    background: 'linear-gradient(135deg, #3a7bd5, #5b9cf6)',
    color: '#fff',
    fontSize: '0.52rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    lineHeight: 1,
    fontFamily: 'system-ui, sans-serif',
    boxShadow: '0 0 8px rgba(91,156,246,0.6)',
    flexShrink: 0,
  },

  /* Expanding ping ring */
  ping: {
    position: 'absolute',
    top: '50%', right: 'clamp(10px, 2.5vw, 16px)',
    transform: 'translateY(-50%)',
    width: 8, height: 8,
    borderRadius: '50%',
    background: 'rgba(91,156,246,0.55)',
    pointerEvents: 'none',
  },
}
