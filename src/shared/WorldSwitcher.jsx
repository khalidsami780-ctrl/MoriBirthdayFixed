import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'


const PEOPLE = [
  { name: 'Mori 💙', born: new Date(2009, 2, 1),  color: '#7ec8f0', glow: 'rgba(126,200,240,0.55)' },
  { name: 'Dodo 🤍', born: new Date(2004, 5, 21), color: '#e8c97e', glow: 'rgba(232,201,126,0.55)' },
]

function calcAge(born) {
  const now  = new Date()
  let y = now.getFullYear() - born.getFullYear()
  let mo = now.getMonth() - born.getMonth()
  if (now.getDate() < born.getDate()) mo--
  if (mo < 0) { y--; mo += 12 }
  const anchor = new Date(born)
  anchor.setFullYear(anchor.getFullYear() + y)
  anchor.setMonth(anchor.getMonth() + mo)
  const rem = now - anchor
  const d   = Math.floor(rem / 86400000)
  const h   = Math.floor((rem % 86400000) / 3600000)
  const min = Math.floor((rem % 3600000)  / 60000)
  const s   = Math.floor((rem % 60000)    / 1000)
  return { y, mo, d, h, min, s }
}

function useAges() {
  const [ages, setAges] = useState(() => PEOPLE.map(p => calcAge(p.born)))
  useEffect(() => {
    const id = setInterval(() => setAges(PEOPLE.map(p => calcAge(p.born))), 1000)
    return () => clearInterval(id)
  }, [])
  return ages
}

const p2 = n => String(n).padStart(2, '0')

/* ── Animated digit ── */
function Digit({ value, color }) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', lineHeight: 1 }}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          style={{ display: 'block', color, fontFamily: `'SF Mono','Fira Code','Courier New',monospace`, fontWeight: 700 }}
          initial={{ y: -14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 14, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

/* ── One person's age row ── */
function AgeRow({ person, age }) {
  const units = [
    { val: String(age.y),      label: 'yrs' },
    { val: p2(age.mo),         label: 'mo'  },
    { val: p2(age.d),          label: 'days'},
    { val: p2(age.h),          label: 'hrs' },
    { val: p2(age.min),        label: 'min' },
    { val: p2(age.s),          label: 'sec' },
  ]
  return (
    <div style={AR.wrap}>
      {/* Name */}
      <div style={{ ...AR.name, color: person.color, textShadow: `0 0 12px ${person.glow}` }}>
        {person.name}
      </div>
      {/* Units */}
      <div style={AR.units}>
        {units.map(({ val, label }) => (
          <div key={label} style={AR.cell}>
            <div style={{ ...AR.num }}>
              {/* Split digits so each flips independently */}
              {val.split('').map((ch, i) => (
                <Digit key={i + ch} value={ch} color={person.color} />
              ))}
            </div>
            <div style={{ ...AR.label, color: `${person.color}88` }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const AR = {
  wrap: {
    display: 'flex', flexDirection: 'column', gap: 6,
    padding: '10px 16px',
  },
  name: {
    fontFamily: `'Cormorant Garamond', Georgia, serif`,
    fontStyle: 'italic', fontWeight: 600,
    fontSize: 'clamp(0.82rem, 2.2vw, 0.96rem)',
    letterSpacing: '0.06em',
  },
  units: {
    display: 'flex', alignItems: 'flex-end',
    gap: 'clamp(6px, 1.5vw, 12px)',
    flexWrap: 'nowrap',
  },
  cell: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    minWidth: 0,
  },
  num: {
    display: 'flex', gap: 1,
    fontSize: 'clamp(0.9rem, 2.5vw, 1.2rem)',
    lineHeight: 1,
    letterSpacing: '-0.02em',
  },
  label: {
    fontFamily: 'system-ui, sans-serif',
    fontSize: 'clamp(0.48rem, 1.2vw, 0.6rem)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
}

/* ═══════════════════════════════════════════════════════════════
   ORBIT RING — circles around Eid tab
═══════════════════════════════════════════════════════════════ */
function OrbitRing({ active }) {
  /* 3 small dots orbiting at different speeds/phases */
  const dots = [
    { r: 0,        speed: 3.5, size: 5, opacity: 0.9  },
    { r: 120,      speed: 5.5, size: 3.5, opacity: 0.6 },
    { r: 240,      speed: 7,   size: 3, opacity: 0.45  },
  ]
  if (active) return null   // stop showing if on Eid already
  return (
    <div style={OR.host} aria-hidden="true">
      {/* Static dashed ring */}
      <motion.div
        style={OR.ring}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: [0.25, 0.55, 0.25], scale: [0.98, 1.04, 0.98] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Orbiting dots */}
      {dots.map((dot, i) => (
        <motion.div
          key={i}
          style={{ ...OR.dotWrap }}
          animate={{ rotate: 360 }}
          transition={{ duration: dot.speed, repeat: Infinity, ease: 'linear' }}
        >
          <motion.div
            style={{
              ...OR.dot,
              width: dot.size, height: dot.size,
              opacity: dot.opacity,
              /* offset from center by orbit radius */
              transform: `rotate(${dot.r}deg) translateX(22px)`,
            }}
          />
        </motion.div>
      ))}
    </div>
  )
}

const OR = {
  host: {
    position: 'absolute',
    inset: -6,
    borderRadius: '50%',
    pointerEvents: 'none',
    zIndex: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    inset: 0,
    borderRadius: 999,
    border: '1.5px dashed rgba(126,200,240,0.45)',
    boxShadow: '0 0 12px rgba(126,200,240,0.25)',
  },
  dotWrap: {
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  dot: {
    borderRadius: '50%',
    background: '#7ec8f0',
    boxShadow: '0 0 6px 2px rgba(126,200,240,0.7)',
    position: 'absolute',
    transformOrigin: 'center',
  },
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
const TABS = [
  { path: '/birthday', label: 'Mori Birthday', icon: '🎂' },
  { path: '/eid',      label: 'Eid with Mori',  icon: '💙' },
]

export default function WorldSwitcher() {
  const navigate     = useNavigate()
  const { pathname } = useLocation()
  const active       = pathname.startsWith('/eid') ? '/eid' : '/birthday'
  const ages         = useAges()
  const [ageOpen,    setAgeOpen]    = useState(false)
  const [showOrbit,  setShowOrbit]  = useState(true)
  const timerRef = useRef(null)

  /* Hide orbit after 8 s or when Eid is visited */
  useEffect(() => {
    timerRef.current = setTimeout(() => setShowOrbit(false), 8000)
    return () => clearTimeout(timerRef.current)
  }, [])
  useEffect(() => {
    if (active === '/eid') { clearTimeout(timerRef.current); setShowOrbit(false) }
  }, [active])

  return (
    /* 
      KEY FIX: left:0 right:0 + margin:auto = true centering
      Never overflow the viewport on any screen size
    */
    <motion.div
      style={S.root}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
    >
      {/* ── TAB PILL ────────────────────────────────────────── */}
      <div style={S.pill}>
        <motion.div
          style={S.highlight}
          animate={{ x: active === '/birthday' ? 0 : '100%' }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        />

        {TABS.map(tab => {
          const isActive = active === tab.path
          const isEid    = tab.path === '/eid'
          return (
            <motion.button
              key={tab.path}
              style={{
                ...S.tab,
                color: isActive ? '#f0e8dc' : 'rgba(220,235,255,0.8)',
                position: 'relative', zIndex: 1,
              }}
              onClick={() => navigate(tab.path)}
              whileTap={{ scale: 0.95 }}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Orbit lives around the Eid tab's icon */}
              {isEid && (
                <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <OrbitRing active={isActive} show={showOrbit} />
                  <motion.span
                    animate={{ scale: isActive ? 1.15 : 1 }}
                    transition={{ duration: 0.3 }}
                    style={{ lineHeight: 1, fontSize: 'clamp(0.9rem,2.5vw,1rem)', position: 'relative', zIndex: 1 }}
                  >
                    {tab.icon}
                  </motion.span>
                </span>
              )}

              {!isEid && (
                <motion.span
                  animate={{ scale: isActive ? 1.12 : 0.95 }}
                  transition={{ duration: 0.3 }}
                  style={{ lineHeight: 1, fontSize: 'clamp(0.9rem,2.5vw,1rem)', flexShrink: 0 }}
                >
                  {tab.icon}
                </motion.span>
              )}

              <span style={S.tabLabel}>{tab.label}</span>

              {/* NEW chip */}
              <AnimatePresence>
                {isEid && showOrbit && !isActive && (
                  <motion.span
                    style={S.badge}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                  >
                    ✨ NEW
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          )
        })}
      </div>

      {/* ── AGE TOGGLE ──────────────────────────────────────── */}
      <motion.button
        style={S.ageToggle}
        onClick={() => setAgeOpen(o => !o)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.95 }}
      >
        <span style={{ fontSize: 'clamp(0.72rem, 2vw, 0.85rem)', letterSpacing: '0.06em' }}>
          {ageOpen ? '✕ close' : '⏳ our ages'}
        </span>
      </motion.button>

      {/* ── AGE PANEL ───────────────────────────────────────── */}
      <AnimatePresence>
        {ageOpen && (
          <motion.div
            style={S.agePanel}
            initial={{ opacity: 0, y: -10, scaleY: 0.8 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.85 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {PEOPLE.map((person, i) => (
              <div key={person.name}>
                {i > 0 && <div style={S.divider} />}
                <AgeRow person={person} age={ages[i]} />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════════════ */
const S = {
  root: {
    /* TRUE center — works on all screen widths */
    position: 'fixed',
    top: 'clamp(0.6rem, 2vw, 1rem)',
    left: 0, right: 0,
    marginLeft: 'auto', marginRight: 'auto',
    width: 'fit-content',
    maxWidth: 'calc(100vw - 2rem)',
    zIndex: 500,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '5px',
  },

  pill: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(3, 7, 26, 0.93)',
    backdropFilter: 'blur(32px)',
    WebkitBackdropFilter: 'blur(32px)',
    border: '1px solid rgba(100, 165, 255, 0.4)',
    borderRadius: 999,
    padding: '3px',
    boxShadow: `
      0 0 0 1px rgba(0,0,0,0.6),
      0 12px 40px rgba(0,0,0,0.75),
      0 2px 8px rgba(0,0,0,0.5),
      inset 0 1px 0 rgba(255,255,255,0.09)
    `,
    overflow: 'visible',
    width: '100%',
  },

  highlight: {
    position: 'absolute',
    top: 3, bottom: 3, left: 3,
    width: 'calc(50% - 3px)',
    borderRadius: 996,
    background: 'linear-gradient(135deg, rgba(52,110,215,0.82), rgba(26,62,145,0.92))',
    boxShadow: '0 0 24px rgba(52,110,215,0.5), inset 0 1px 0 rgba(255,255,255,0.13)',
    border: '1px solid rgba(100,165,255,0.3)',
    pointerEvents: 'none',
  },

  tab: {
    display: 'flex', alignItems: 'center',
    gap: 'clamp(4px, 1.2vw, 8px)',
    padding: 'clamp(8px,2.2vw,11px) clamp(12px,3.5vw,22px)',
    borderRadius: 996,
    border: 'none', background: 'transparent',
    cursor: 'pointer',
    fontFamily: `'Cormorant Garamond', Georgia, serif`,
    fontWeight: 600,
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap',
    outline: 'none',
    WebkitTapHighlightColor: 'transparent',
    transition: 'color 0.28s',
    flex: 1, justifyContent: 'center', minWidth: 0,
  },

  tabLabel: {
    fontSize: 'clamp(0.68rem, 2vw, 0.85rem)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },

  badge: {
    display: 'inline-flex', alignItems: 'center',
    padding: '2px 7px', borderRadius: 999,
    background: 'linear-gradient(135deg, #3a7bd5, #5b9cf6)',
    color: '#fff', fontSize: '0.52rem', fontWeight: 700,
    letterSpacing: '0.08em', fontFamily: 'system-ui, sans-serif',
    boxShadow: '0 0 10px rgba(91,156,246,0.65)',
    flexShrink: 0,
  },

  ageToggle: {
    display: 'flex', alignItems: 'center', gap: '5px',
    padding: '4px 14px',
    borderRadius: 999,
    background: 'rgba(3,7,26,0.82)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(90,150,240,0.22)',
    cursor: 'pointer', outline: 'none',
    WebkitTapHighlightColor: 'transparent',
    color: 'rgba(168,200,248,0.78)',
    fontFamily: `'Cormorant Garamond', Georgia, serif`,
    fontStyle: 'italic',
    boxShadow: '0 4px 20px rgba(0,0,0,0.45)',
  },

  agePanel: {
    background: 'rgba(3, 7, 26, 0.94)',
    backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
    border: '1px solid rgba(90,150,240,0.25)',
    borderRadius: 16,
    boxShadow: '0 12px 50px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)',
    width: 'clamp(280px, 90vw, 460px)',
    transformOrigin: 'top center',
    overflow: 'hidden',
  },

  divider: {
    height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(90,150,240,0.18), transparent)',
    margin: '0 16px',
  },
}
