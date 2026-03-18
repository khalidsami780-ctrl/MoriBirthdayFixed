import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STARS = Array.from({ length: 90 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  r: 0.4 + Math.random() * 1.6,
  opacity: 0.15 + Math.random() * 0.6,
  blink: 2.5 + Math.random() * 4.5,
}))

const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  x: Math.random() * 100, y: Math.random() * 100,
  size: 1.5 + Math.random() * 2.5,
  duration: 7 + Math.random() * 9,
  delay: Math.random() * 6,
  opacity: 0.1 + Math.random() * 0.28,
}))

const RAIN = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: 4 + (i / 19) * 92 + (Math.random() - 0.5) * 5,
  delay: Math.random() * 0.9,
  size: 12 + Math.random() * 20,
  drift: (Math.random() - 0.5) * 50,
  duration: 1.5 + Math.random() * 1,
}))

export default function IntroGate({ onEnterComplete }) {
  const [phase, setPhase]       = useState('idle')
  const [heartsDone, setDone]   = useState(false)
  const triggered               = useRef(false)

  useEffect(() => {
    if (!heartsDone) return
    const t = setTimeout(() => setPhase('fade'), 180)
    return () => clearTimeout(t)
  }, [heartsDone])

  useEffect(() => {
    if (phase !== 'fade') return
    const t = setTimeout(() => onEnterComplete(), 850)
    return () => clearTimeout(t)
  }, [phase, onEnterComplete])

  const handleTap = useCallback(() => {
    if (triggered.current) return
    triggered.current = true
    setPhase('hearts')
    setTimeout(() => setDone(true), 2100)
  }, [])

  return (
    <AnimatePresence>
      {phase !== 'fade' && (
        <motion.div
          key="intro-gate"
          style={S.root}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.85, ease: 'easeInOut' }}
          onPointerDown={handleTap}
        >
          {/* Deep space gradient */}
          <div style={S.bg} />

          {/* Radial center glow */}
          <motion.div
            style={S.centerGlow}
            animate={{ opacity: [0.3, 0.55, 0.3], scale: [1, 1.06, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Stars */}
          <svg style={S.starSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
            {STARS.map(s => (
              <motion.circle
                key={s.id}
                cx={s.x} cy={s.y} r={s.r}
                fill="white"
                initial={{ opacity: s.opacity }}
                animate={{ opacity: [s.opacity, s.opacity * 0.15, s.opacity] }}
                transition={{ duration: s.blink, repeat: Infinity, ease: 'easeInOut', delay: Math.random() * 4 }}
              />
            ))}
          </svg>

          {/* Floating orbs */}
          {PARTICLES.map(p => (
            <motion.div
              key={p.id}
              style={{
                ...S.particle,
                left: `${p.x}%`, top: `${p.y}%`,
                width: p.size, height: p.size, opacity: p.opacity,
              }}
              animate={{ y: [0, -20, 0], opacity: [p.opacity, p.opacity * 1.8, p.opacity] }}
              transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}

          {/* Heart rain */}
          <AnimatePresence>
            {phase === 'hearts' && RAIN.map(h => (
              <motion.div
                key={h.id}
                style={{ ...S.rainHeart, left: `${h.x}%`, fontSize: h.size }}
                initial={{ opacity: 0.85, y: -30, x: 0, scale: 0.35 }}
                animate={{
                  opacity: 0,
                  y: typeof window !== 'undefined' ? window.innerHeight + 80 : 900,
                  x: h.drift,
                  scale: [0.35, 1.05, 0.9],
                }}
                transition={{ duration: h.duration, delay: h.delay, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                💙
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Card */}
          <motion.div
            style={S.cardOuter}
            initial={{ opacity: 0, y: 28, scale: 0.95 }}
            animate={
              phase === 'hearts'
                ? { opacity: 1, y: 0, scale: 1.025 }
                : { opacity: 1, y: 0, scale: 1 }
            }
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Animated shimmer border */}
            <motion.div
              style={S.shimmer}
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'linear' }}
            />

            <div style={S.cardInner}>
              {/* Moon */}
              <motion.div
                style={S.moon}
                animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                🌙
              </motion.div>

              {/* Arabic phrase */}
              <motion.p
                style={S.arabicPhrase}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 1.1 }}
              >
                <motion.span
                  animate={{
                    textShadow: [
                      '0 0 20px rgba(79,163,224,0.45)',
                      '0 0 38px rgba(126,200,240,0.7)',
                      '0 0 20px rgba(79,163,224,0.45)',
                    ]
                  }}
                  transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
                >
                  بِحُبِّكِ يا مَرْيَم
                </motion.span>
              </motion.p>

              {/* Thin divider */}
              <motion.div
                style={S.thinDivider}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.65, duration: 0.9 }}
              />

              {/* Title */}
              <motion.h1
                style={S.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75, duration: 0.9 }}
              >
                Happy Birthday, Meriam
                <motion.span
                  style={{ display: 'inline-block', marginLeft: '0.2em' }}
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                >
                  💙
                </motion.span>
              </motion.h1>

              {/* Divider */}
              <motion.div
                style={S.divider}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1.05, duration: 0.9 }}
              />

              {/* Subtitle */}
              <motion.p
                style={S.subtitle}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.25, duration: 0.9 }}
              >
                A little moment… before the magic begins
              </motion.p>

              {/* CTA */}
              <motion.button
                style={S.btn}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.55, duration: 0.8 }}
                whileHover={{ scale: 1.06, boxShadow: '0 0 32px rgba(79,163,224,0.5)' }}
                whileTap={{ scale: 0.96 }}
                onPointerDown={e => { e.stopPropagation(); handleTap() }}
              >
                <motion.span
                  animate={{ opacity: [1, 0.65, 1] }}
                  transition={{ duration: 2.8, repeat: Infinity }}
                >
                  Tap to Begin 💙
                </motion.span>
              </motion.button>
            </div>
          </motion.div>

          {/* Vignette */}
          <div style={S.vignette} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const S = {
  root: {
    position: 'fixed', inset: 0, zIndex: 9999,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', cursor: 'pointer',
    userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation',
  },
  bg: {
    position: 'absolute', inset: 0,
    background: `
      radial-gradient(ellipse 80% 55% at 30% 22%, #0c1f4a 0%, transparent 70%),
      radial-gradient(ellipse 70% 50% at 72% 78%, #09162e 0%, transparent 62%),
      linear-gradient(160deg, #06101e 0%, #0b1830 38%, #061120 78%, #040c1c 100%)
    `,
  },
  centerGlow: {
    position: 'absolute',
    width: '60vmax', height: '60vmax',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(30,70,180,0.14) 0%, transparent 70%)',
    top: '50%', left: '50%',
    transform: 'translate(-50%,-50%)',
    pointerEvents: 'none',
  },
  starSvg: { position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' },
  particle: {
    position: 'absolute', borderRadius: '50%',
    background: 'radial-gradient(circle, #7ec8e8 0%, #4a95d0 55%, transparent 100%)',
    pointerEvents: 'none', filter: 'blur(1px)',
  },
  rainHeart: {
    position: 'fixed', top: 0, pointerEvents: 'none', zIndex: 10000,
    lineHeight: 1, filter: 'drop-shadow(0 0 7px rgba(79,163,224,0.7))',
  },
  cardOuter: {
    position: 'relative', width: 'min(90vw, 410px)',
    borderRadius: 26, padding: 2.5,
    background: 'transparent', zIndex: 10,
  },
  shimmer: {
    position: 'absolute', inset: 0, borderRadius: 26, padding: 1.5,
    background: 'linear-gradient(135deg, #4fa3e0 0%, #1a3a6b 28%, #7ec8f0 58%, #1a3a6b 78%, #4fa3e0 100%)',
    backgroundSize: '200% 200%',
    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'destination-out', maskComposite: 'exclude',
    pointerEvents: 'none',
  },
  cardInner: {
    background: 'rgba(6, 16, 46, 0.82)',
    backdropFilter: 'blur(26px)', WebkitBackdropFilter: 'blur(26px)',
    borderRadius: 23.5,
    padding: 'clamp(28px, 7vw, 46px) clamp(24px, 7vw, 38px)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  moon: { fontSize: 34, marginBottom: 18, lineHeight: 1, filter: 'drop-shadow(0 0 14px rgba(79,163,224,0.5))' },
  arabicPhrase: {
    margin: 0,
    fontFamily: `'Scheherazade New', 'Arial', serif`,
    direction: 'rtl',
    fontSize: 'clamp(1.5rem, 5.5vw, 1.95rem)',
    fontWeight: 600,
    color: '#b4d8f5',
    textAlign: 'center',
    letterSpacing: '0.03em',
    lineHeight: 1.4,
    marginBottom: 6,
  },
  thinDivider: {
    width: 38, height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(79,163,224,0.55), transparent)',
    margin: '13px 0 15px', transformOrigin: 'center',
  },
  title: {
    margin: 0,
    fontSize: 'clamp(1.05rem, 4vw, 1.45rem)',
    fontWeight: 600, color: '#d5eaff',
    textAlign: 'center', letterSpacing: '0.02em', lineHeight: 1.3,
    fontFamily: `'Cormorant Garamond', Georgia, serif`,
    textShadow: '0 0 28px rgba(79,163,224,0.35)',
  },
  divider: {
    width: 50, height: 1.5,
    background: 'linear-gradient(90deg, transparent, rgba(79,163,224,0.75), transparent)',
    borderRadius: 2, margin: '15px 0 12px', transformOrigin: 'center',
  },
  subtitle: {
    margin: 0,
    fontSize: 'clamp(0.73rem, 2.3vw, 0.87rem)',
    color: '#7aa8c8', textAlign: 'center', letterSpacing: '0.07em',
    fontStyle: 'italic', lineHeight: 1.65,
    fontFamily: `'Cormorant Garamond', Georgia, serif`,
    maxWidth: 250,
  },
  btn: {
    marginTop: 26, padding: 'clamp(11px,3vw,14px) clamp(28px,6vw,36px)',
    borderRadius: 999,
    border: '1.5px solid rgba(79,163,224,0.45)',
    background: 'linear-gradient(135deg, rgba(79,163,224,0.16) 0%, rgba(28,72,145,0.24) 100%)',
    color: '#c4e0f8',
    fontSize: 'clamp(0.82rem,2.5vw,0.92rem)',
    fontWeight: 600, letterSpacing: '0.08em',
    cursor: 'pointer',
    backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
    fontFamily: `'Cormorant Garamond', Georgia, serif`,
    WebkitTapHighlightColor: 'transparent',
    transition: 'border-color 0.3s',
  },
  vignette: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse 88% 88% at 50% 50%, transparent 38%, rgba(2,6,18,0.68) 100%)',
    pointerEvents: 'none',
  },
}
