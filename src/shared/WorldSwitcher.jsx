import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'


const PEOPLE = [
  { name: 'Mori',  emoji: '💙', born: new Date(2009, 2,  1),  color: '#7ec8f0', glow: 'rgba(126,200,240,0.6)' },
  { name: 'Dodo',  emoji: '🤍', born: new Date(2004, 5, 21), color: '#e8c97e', glow: 'rgba(232,201,126,0.6)' },
]

/* ── Age ── */
function calcAge(born) {
  const now = new Date()
  let y  = now.getFullYear() - born.getFullYear()
  let mo = now.getMonth()    - born.getMonth()
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

/* ── Next birthday countdown ── */
function calcNextBirthday(born) {
  const now   = new Date()
  const year  = now.getFullYear()
  // Try this year's birthday
  let next = new Date(year, born.getMonth(), born.getDate())
  // If already passed today, use next year
  if (next <= now) next = new Date(year + 1, born.getMonth(), born.getDate())
  const diff = next - now
  const d    = Math.floor(diff / 86400000)
  const h    = Math.floor((diff % 86400000) / 3600000)
  const min  = Math.floor((diff % 3600000)  / 60000)
  const s    = Math.floor((diff % 60000)    / 1000)
  return { d, h, min, s, date: next }
}

function useStats() {
  const [stats, setStats] = useState(() =>
    PEOPLE.map(p => ({ age: calcAge(p.born), bday: calcNextBirthday(p.born) }))
  )
  useEffect(() => {
    const id = setInterval(() =>
      setStats(PEOPLE.map(p => ({ age: calcAge(p.born), bday: calcNextBirthday(p.born) }))), 1000)
    return () => clearInterval(id)
  }, [])
  return stats
}

const p2 = n => String(n).padStart(2, '0')

/* ═══════════════════════════════════════════════════════════════
   ANIMATED DIGIT — each character flips independently
═══════════════════════════════════════════════════════════════ */
function Digit({ value, color, size = '1rem' }) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', lineHeight: 1, height: `calc(${size} * 1.15)` }}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          style={{
            display: 'block', color,
            fontFamily: `'SF Mono','Fira Code','Courier New',monospace`,
            fontWeight: 700, fontSize: size,
          }}
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0,   opacity: 1 }}
          exit={{ y: 16,     opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

/* ── Numeric value split into animating digits ── */
function AnimNum({ value, color, size }) {
  return (
    <div style={{ display: 'flex', gap: 1 }}>
      {String(value).split('').map((ch, i) => (
        <Digit key={i} value={ch} color={color} size={size} />
      ))}
    </div>
  )
}

/* ── One unit cell: number + label ── */
function Cell({ value, label, color, numSize = 'clamp(1.05rem,3vw,1.4rem)' }) {
  return (
    <div style={CL.cell}>
      <div style={CL.numRow}>
        <AnimNum value={p2(value)} color={color} size={numSize} />
      </div>
      <div style={{ ...CL.lbl, color: `${color}70` }}>{label}</div>
    </div>
  )
}
const CL = {
  cell:   { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 0 },
  numRow: { display: 'flex' },
  lbl:    { fontFamily: 'system-ui,sans-serif', fontSize: 'clamp(0.46rem,1.2vw,0.58rem)', letterSpacing: '0.07em', textTransform: 'uppercase' },
}

/* ═══════════════════════════════════════════════════════════════
   PERSON CARD — age left / birthday right
═══════════════════════════════════════════════════════════════ */
function PersonCard({ person, stats }) {
  const { age, bday } = stats
  // Birthday month+day for display
  const bdayStr = bday.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

  return (
    <div style={{ ...PC.wrap }}>
      {/* ── Name bar ── */}
      <div style={PC.nameBar}>
        <span style={{ ...PC.name, color: person.color, textShadow: `0 0 14px ${person.glow}` }}>
          {person.emoji} {person.name}
        </span>
        <span style={{ ...PC.bdayHint, color: `${person.color}88` }}>
          🎂 {bdayStr}
        </span>
      </div>

      {/* ── Two panels side by side ── */}
      <div style={PC.panels}>

        {/* LEFT — Age */}
        <div style={{ ...PC.panel, borderColor: `${person.color}22` }}>
          <div style={{ ...PC.panelLabel, color: `${person.color}99` }}>Age</div>
          <div style={PC.units}>
            <Cell value={age.y}   label="yrs"  color={person.color} numSize="clamp(1.1rem,3.2vw,1.5rem)" />
            <div style={PC.vsep} />
            <Cell value={age.mo}  label="mo"   color={person.color} />
            <Cell value={age.d}   label="days" color={person.color} />
            <Cell value={age.h}   label="hrs"  color={person.color} />
            <Cell value={age.min} label="min"  color={person.color} />
            <Cell value={age.s}   label="sec"  color={person.color} />
          </div>
        </div>

        {/* RIGHT — Next Birthday */}
        <div style={{ ...PC.panel, borderColor: `${person.color}22`, background: `${person.color}07` }}>
          <div style={{ ...PC.panelLabel, color: `${person.color}99` }}>Next Birthday</div>
          <div style={PC.units}>
            <Cell value={bday.d}   label="days" color={person.color} numSize="clamp(1.1rem,3.2vw,1.5rem)" />
            <div style={PC.vsep} />
            <Cell value={bday.h}   label="hrs"  color={person.color} />
            <Cell value={bday.min} label="min"  color={person.color} />
            <Cell value={bday.s}   label="sec"  color={person.color} />
          </div>
        </div>
      </div>
    </div>
  )
}

const PC = {
  wrap: {
    padding: '14px 16px 12px',
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  nameBar: {
    display: 'flex', alignItems: 'baseline',
    justifyContent: 'space-between', gap: 8,
  },
  name: {
    fontFamily: `'Cormorant Garamond', Georgia, serif`,
    fontStyle: 'italic', fontWeight: 700,
    fontSize: 'clamp(0.95rem, 2.8vw, 1.15rem)',
    letterSpacing: '0.06em',
  },
  bdayHint: {
    fontFamily: `'Cormorant Garamond', Georgia, serif`,
    fontStyle: 'italic',
    fontSize: 'clamp(0.68rem, 1.8vw, 0.8rem)',
    letterSpacing: '0.04em',
    flexShrink: 0,
  },
  panels: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
  },
  panel: {
    display: 'flex', flexDirection: 'column', gap: 8,
    padding: '8px 10px',
    borderRadius: 12,
    border: '1px solid',
    background: 'rgba(255,255,255,0.02)',
  },
  panelLabel: {
    fontFamily: 'system-ui, sans-serif',
    fontSize: 'clamp(0.5rem, 1.4vw, 0.62rem)',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    opacity: 0.75,
  },
  units: {
    display: 'flex', alignItems: 'flex-end',
    gap: 'clamp(4px, 1.2vw, 8px)',
    flexWrap: 'nowrap',
  },
  vsep: {
    width: 1, height: 28,
    background: 'rgba(255,255,255,0.08)',
    flexShrink: 0, alignSelf: 'center',
  },
}

/* ═══════════════════════════════════════════════════════════════
   ORBIT RING
═══════════════════════════════════════════════════════════════ */
function OrbitRing({ active }) {
  if (active) return null
  const dots = [
    { startAngle: 0,   speed: 3.2 },
    { startAngle: 120, speed: 5.0 },
    { startAngle: 240, speed: 7.5 },
  ]
  return (
    <div style={OR.host} aria-hidden="true">
      <motion.div
        style={OR.ring}
        animate={{ opacity: [0.28, 0.62, 0.28], scale: [0.97, 1.05, 0.97] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      />
      {dots.map((dot, i) => (
        <motion.div
          key={i}
          style={OR.dotWrap}
          initial={{ rotate: dot.startAngle }}
          animate={{ rotate: dot.startAngle + 360 }}
          transition={{ duration: dot.speed, repeat: Infinity, ease: 'linear' }}
        >
          <div style={{ ...OR.dot, top: 0, left: '50%', transform: 'translateX(-50%)' }} />
        </motion.div>
      ))}
    </div>
  )
}

const OR = {
  host: {
    position: 'absolute', inset: -8,
    borderRadius: 999, pointerEvents: 'none', zIndex: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  ring: {
    position: 'absolute', inset: 0, borderRadius: 999,
    border: '1.5px dashed rgba(126,200,240,0.5)',
    boxShadow: '0 0 16px rgba(126,200,240,0.3)',
  },
  dotWrap: {
    position: 'absolute', inset: 0, borderRadius: '50%',
  },
  dot: {
    position: 'absolute',
    width: 5, height: 5, borderRadius: '50%',
    background: '#7ec8f0',
    boxShadow: '0 0 7px 2px rgba(126,200,240,0.85)',
  },
}

/* ═══════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════ */
const TABS = [
  { path: '/birthday', label: 'Mori Birthday', icon: '🎂' },
  { path: '/eid',      label: 'Eid with Mori',  icon: '💙' },
]

export default function WorldSwitcher() {
  const navigate     = useNavigate()
  const { pathname } = useLocation()
  const active       = pathname.startsWith('/eid') ? '/eid' : '/birthday'
  const stats        = useStats()
  const [ageOpen,   setAgeOpen]   = useState(false)
  const [showOrbit, setShowOrbit] = useState(true)
  const timerRef = useRef(null)

  useEffect(() => {
    timerRef.current = setTimeout(() => setShowOrbit(false), 8000)
    return () => clearTimeout(timerRef.current)
  }, [])
  useEffect(() => {
    if (active === '/eid') { clearTimeout(timerRef.current); setShowOrbit(false) }
  }, [active])

  return (
    <motion.div
      style={S.root}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
    >
      {/* ── TAB PILL ─────────────────────────────────────────── */}
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
              style={{ ...S.tab, color: isActive ? '#f0e8dc' : 'rgba(220,235,255,0.82)' }}
              onClick={() => navigate(tab.path)}
              whileTap={{ scale: 0.95 }}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {isEid ? (
                <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  {showOrbit && <OrbitRing active={isActive} />}
                  <motion.span
                    animate={{ scale: isActive ? 1.15 : 1 }}
                    transition={{ duration: 0.3 }}
                    style={{ lineHeight: 1, fontSize: 'clamp(0.9rem,2.5vw,1rem)', position: 'relative', zIndex: 1 }}
                  >
                    {tab.icon}
                  </motion.span>
                </span>
              ) : (
                <motion.span
                  animate={{ scale: isActive ? 1.12 : 0.95 }}
                  transition={{ duration: 0.3 }}
                  style={{ lineHeight: 1, fontSize: 'clamp(0.9rem,2.5vw,1rem)', flexShrink: 0 }}
                >
                  {tab.icon}
                </motion.span>
              )}

              <span style={S.tabLabel}>{tab.label}</span>

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

      {/* ── AGE TOGGLE — bigger, glowing ─────────────────────── */}
      <motion.button
        style={S.ageToggle}
        onClick={() => setAgeOpen(o => !o)}
        whileHover={{ scale: 1.06, boxShadow: '0 0 28px rgba(126,200,240,0.35)' }}
        whileTap={{ scale: 0.94 }}
        animate={ageOpen
          ? { borderColor: 'rgba(126,200,240,0.55)', boxShadow: '0 0 22px rgba(126,200,240,0.28)' }
          : { borderColor: 'rgba(90,150,240,0.3)',   boxShadow: '0 4px 20px rgba(0,0,0,0.45)' }
        }
      >
        {/* Subtle shimmer sweep */}
        <motion.div
          style={S.toggleShimmer}
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }}
        />

        <motion.span
          animate={{ rotate: ageOpen ? 180 : 0 }}
          transition={{ duration: 0.35 }}
          style={{ display: 'flex', fontSize: '1rem', lineHeight: 1, flexShrink: 0 }}
        >
          {ageOpen ? '✕' : '⏳'}
        </motion.span>

        <span style={S.toggleText}>
          {ageOpen ? 'Close' : 'Our Ages & Birthdays'}
        </span>

        {/* Live seconds pulse to show it's ticking */}
        {!ageOpen && (
          <motion.span
            style={S.liveDot}
            animate={{ scale: [1, 1.6, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </motion.button>

      {/* ── AGE PANEL ────────────────────────────────────────── */}
      <AnimatePresence>
        {ageOpen && (
          <motion.div
            style={S.agePanel}
            initial={{ opacity: 0, y: -14, scaleY: 0.75 }}
            animate={{ opacity: 1, y: 0,   scaleY: 1 }}
            exit={{ opacity: 0,    y: -10, scaleY: 0.8 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Panel header */}
            <div style={S.panelHeader}>
              <span style={S.panelTitle}>⏳ Ages & Upcoming Birthdays</span>
              <span style={S.panelSub}>Live — ticking every second</span>
            </div>

            <div style={S.panelDivider} />

            {PEOPLE.map((person, i) => (
              <div key={person.name}>
                {i > 0 && <div style={S.rowDivider} />}
                <PersonCard person={person} stats={stats[i]} />
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
    position: 'fixed',
    top: 'clamp(0.6rem, 2vw, 1rem)',
    left: 0, right: 0,
    marginLeft: 'auto', marginRight: 'auto',
    width: 'fit-content',
    maxWidth: 'calc(100vw - 1.5rem)',
    zIndex: 500,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '6px',
  },

  pill: {
    position: 'relative', display: 'flex', alignItems: 'center',
    background: 'rgba(3,7,26,0.93)',
    backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
    border: '1px solid rgba(100,165,255,0.4)',
    borderRadius: 999, padding: '3px',
    boxShadow: '0 0 0 1px rgba(0,0,0,0.6), 0 12px 40px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.09)',
    overflow: 'visible', width: '100%',
  },

  highlight: {
    position: 'absolute', top: 3, bottom: 3, left: 3,
    width: 'calc(50% - 3px)', borderRadius: 996,
    background: 'linear-gradient(135deg, rgba(52,110,215,0.82), rgba(26,62,145,0.92))',
    boxShadow: '0 0 24px rgba(52,110,215,0.5), inset 0 1px 0 rgba(255,255,255,0.13)',
    border: '1px solid rgba(100,165,255,0.3)', pointerEvents: 'none',
  },

  tab: {
    display: 'flex', alignItems: 'center', gap: 'clamp(4px,1.2vw,8px)',
    padding: 'clamp(8px,2.2vw,11px) clamp(12px,3.5vw,22px)',
    borderRadius: 996, border: 'none', background: 'transparent',
    cursor: 'pointer', fontFamily: `'Cormorant Garamond', Georgia, serif`,
    fontWeight: 600, letterSpacing: '0.04em', whiteSpace: 'nowrap',
    outline: 'none', WebkitTapHighlightColor: 'transparent',
    transition: 'color 0.28s', flex: 1, justifyContent: 'center', minWidth: 0,
    position: 'relative', zIndex: 1,
  },

  tabLabel: {
    fontSize: 'clamp(0.68rem,2vw,0.85rem)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },

  badge: {
    display: 'inline-flex', alignItems: 'center',
    padding: '2px 7px', borderRadius: 999,
    background: 'linear-gradient(135deg,#3a7bd5,#5b9cf6)',
    color: '#fff', fontSize: '0.52rem', fontWeight: 700,
    letterSpacing: '0.08em', fontFamily: 'system-ui,sans-serif',
    boxShadow: '0 0 10px rgba(91,156,246,0.65)', flexShrink: 0,
  },

  /* ── Toggle button — bigger and glowing ── */
  ageToggle: {
    position: 'relative', overflow: 'hidden',
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '8px 20px',
    borderRadius: 999,
    background: 'rgba(4,10,34,0.88)',
    backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)',
    border: '1px solid rgba(90,150,240,0.3)',
    cursor: 'pointer', outline: 'none',
    WebkitTapHighlightColor: 'transparent',
    color: 'rgba(200,228,255,0.88)',
    transition: 'border-color 0.3s, box-shadow 0.3s',
  },

  toggleShimmer: {
    position: 'absolute', top: 0, bottom: 0,
    width: '40%',
    background: 'linear-gradient(90deg, transparent, rgba(126,200,240,0.12), transparent)',
    pointerEvents: 'none',
  },

  toggleText: {
    fontFamily: `'Cormorant Garamond', Georgia, serif`,
    fontStyle: 'italic', fontWeight: 600,
    fontSize: 'clamp(0.8rem,2.2vw,0.96rem)',
    letterSpacing: '0.05em',
    position: 'relative', zIndex: 1,
  },

  liveDot: {
    width: 6, height: 6, borderRadius: '50%',
    background: '#7ec8f0',
    boxShadow: '0 0 8px rgba(126,200,240,0.8)',
    flexShrink: 0, position: 'relative', zIndex: 1,
  },

  /* ── Age panel ── */
  agePanel: {
    background: 'rgba(3,7,26,0.96)',
    backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
    border: '1px solid rgba(90,150,240,0.28)',
    borderRadius: 18,
    boxShadow: '0 16px 60px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.06)',
    width: 'clamp(300px,95vw,520px)',
    transformOrigin: 'top center',
    overflow: 'hidden',
  },

  panelHeader: {
    padding: '14px 16px 10px',
    display: 'flex', alignItems: 'baseline',
    justifyContent: 'space-between', gap: 8,
  },

  panelTitle: {
    fontFamily: `'Cormorant Garamond', Georgia, serif`,
    fontStyle: 'italic', fontWeight: 700,
    fontSize: 'clamp(0.88rem,2.5vw,1.05rem)',
    color: 'rgba(220,235,255,0.9)', letterSpacing: '0.04em',
  },

  panelSub: {
    fontFamily: 'system-ui, sans-serif',
    fontSize: '0.56rem', letterSpacing: '0.1em',
    textTransform: 'uppercase', color: 'rgba(126,200,240,0.42)',
    flexShrink: 0,
  },

  panelDivider: {
    height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(90,150,240,0.22), transparent)',
    margin: '0 16px',
  },

  rowDivider: {
    height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(90,150,240,0.14), transparent)',
    margin: '0 16px',
  },
}
