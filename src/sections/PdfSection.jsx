import { useRef, useMemo } from 'react'
import { motion, useInView } from 'framer-motion'
import Stars from '../components/Stars.jsx'

/* ── Sparkle particle data — computed once ─────────────────────── */
const SPARKLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  /* distribute around the card edges */
  angle:    (i / 22) * 360,
  radius:   120 + Math.random() * 70,
  size:     1.5 + Math.random() * 2.5,
  duration: 2.8 + Math.random() * 3.5,
  delay:    Math.random() * 4,
  opacity:  0.2 + Math.random() * 0.45,
}))

/* ── Convert polar → x/y relative to card center ─────────────── */
function polarToXY(angleDeg, radius) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: Math.cos(rad) * radius, y: Math.sin(rad) * radius }
}

/* ── Single sparkle dot ───────────────────────────────────────── */
function Sparkle({ sp }) {
  const { x, y } = polarToXY(sp.angle, sp.radius)
  return (
    <motion.div
      style={{
        position: 'absolute',
        left: '50%', top: '50%',
        width: sp.size, height: sp.size,
        borderRadius: '50%',
        background: 'radial-gradient(circle, #a8d8ff 0%, #5b9cf6 55%, transparent 100%)',
        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
        pointerEvents: 'none',
      }}
      animate={{
        opacity: [0, sp.opacity, 0],
        scale:   [0.4, 1.4, 0.4],
      }}
      transition={{
        duration:   sp.duration,
        delay:      sp.delay,
        repeat:     Infinity,
        ease:       'easeInOut',
      }}
    />
  )
}

/* ═══════════════════════════════════════════════════════════════ */
export default function PdfSection({ sectionRef }) {
  const innerRef = useRef(null)
  const inView   = useInView(innerRef, { once: true, amount: 0.25 })

  const pdfHref = encodeURI('/assets/pdf/ما كُتب لنا… لم ينتهِ بعد.pdf')

  const container = {
    hidden:   {},
    visible:  { transition: { staggerChildren: 0.18 } },
  }
  const item = {
    hidden:   { opacity: 0, y: 28 },
    visible:  { opacity: 1, y: 0, transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] } },
  }

  return (
    <section
      ref={sectionRef}
      id="pdf-gift"
      className="section pdf-section"
    >
      <Stars count={50} />

      {/* Ambient orbs */}
      <div className="orb orb-blue"
        style={{ width: 420, height: 420, top: '-8%', left: '-14%', opacity: 0.08 }}
        aria-hidden="true" />
      <div className="orb orb-blue"
        style={{ width: 340, height: 340, bottom: '4%', right: '-10%', opacity: 0.07 }}
        aria-hidden="true" />
      <div className="orb orb-gold"
        style={{ width: 240, height: 240, bottom: '18%', left: '10%', opacity: 0.04 }}
        aria-hidden="true" />

      <motion.div
        ref={innerRef}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        variants={container}
        style={S.wrapper}
      >
        {/* ── Card ────────────────────────────────────────────── */}
        <motion.div variants={item} style={S.cardOuter}>
          {/* Breathing border glow */}
          <motion.div
            style={S.breathGlow}
            animate={{
              boxShadow: [
                '0 0 18px 4px rgba(91,156,246,0.18), inset 0 0 22px rgba(91,156,246,0.06)',
                '0 0 38px 10px rgba(91,156,246,0.35), inset 0 0 38px rgba(91,156,246,0.14)',
                '0 0 18px 4px rgba(91,156,246,0.18), inset 0 0 22px rgba(91,156,246,0.06)',
              ],
            }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Moving edge sweep */}
          <motion.div
            style={S.edgeSweep}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />

          {/* Sparkle particles */}
          <div style={S.sparkleHost} aria-hidden="true">
            {SPARKLES.map(sp => <Sparkle key={sp.id} sp={sp} />)}
          </div>

          {/* Card inner */}
          <div style={S.cardInner}>
            {/* Top ornament */}
            <motion.div
              style={S.ornamentTop}
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              ✦ &nbsp;&nbsp; ✦ &nbsp;&nbsp; ✦
            </motion.div>

            {/* Arabic title */}

            <motion.h2 variants={item} style={S.title}>
              اولا : نصيحة تابعي دورات الشيخ علاء حامد باليوتيوب 
            </motion.h2>
            <motion.h2 variants={item} style={S.title}>
              شيء أخفيته لكِ… حتى الآن
            </motion.h2>

            
            
            {/* Gold divider */}
            <motion.div
              style={S.divider}
              variants={{
                hidden:  { scaleX: 0 },
                visible: { scaleX: 1, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
              }}
            />

            {/* Description */}
            <motion.p variants={item} style={S.desc}>
              {'هذه ليست مجرد كلمات…\nبل شيء كُتب من قلبي،\nليُقرأ حين تكونين مستعدة…'}
            </motion.p>

            {/* Sub-line */}
            <motion.p variants={item} style={S.subLine}>
              قد تجدينني بين السطور…
            </motion.p>

            {/* Download button */}
            <motion.div variants={item} style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
              <motion.a
                href={pdfHref}
                download
                style={S.btn}
                whileHover={{
                  scale: 1.07,
                  boxShadow: '0 0 38px rgba(91,156,246,0.7), 0 8px 28px rgba(0,0,0,0.5)',
                  background: 'linear-gradient(135deg, #3a7bd5 0%, #5b9cf6 50%, #3a7bd5 100%)',
                }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Button shimmer on hover */}
                <motion.span
                  style={S.btnShimmer}
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }}
                />
                <span style={S.btnText}>تحميل الرواية 💙</span>
              </motion.a>
            </motion.div>

            {/* Bottom ornament */}
            <motion.div
              style={S.ornamentBottom}
              animate={{ opacity: [0.3, 0.65, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, delay: 1 }}
            >
              ☽ &nbsp; ✦ &nbsp; ☾
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════════════ */
const S = {
  wrapper: {
    position: 'relative', zIndex: 1,
    width: '100%', maxWidth: 500,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },

  /* Outer shell holds glow + sparkles but doesn't clip them */
  cardOuter: {
    position: 'relative',
    width: '100%',
    /* extra space so sparkles + glow aren't clipped */
    padding: '6px',
  },

  /* Pulsing glow layer — sits behind the glass card */
  breathGlow: {
    position: 'absolute', inset: -2,
    borderRadius: 26,
    pointerEvents: 'none',
    zIndex: 0,
  },

  /* Rotating conic gradient — sweeps around the border */
  edgeSweep: {
    position: 'absolute', inset: -1,
    borderRadius: 26,
    background: 'conic-gradient(from 0deg, transparent 60%, rgba(91,156,246,0.35) 80%, transparent 100%)',
    pointerEvents: 'none', zIndex: 0,
  },

  sparkleHost: {
    position: 'absolute', inset: 0,
    pointerEvents: 'none', zIndex: 2,
    overflow: 'visible',
  },

  /* The actual glass card */
  cardInner: {
    position: 'relative', zIndex: 3,
    background: 'rgba(6, 14, 46, 0.72)',
    backdropFilter: 'blur(28px) saturate(160%)',
    WebkitBackdropFilter: 'blur(28px) saturate(160%)',
    border: '1px solid rgba(91,156,246,0.28)',
    borderRadius: 22,
    padding: 'clamp(2rem, 6vw, 3rem) clamp(1.5rem, 5vw, 2.75rem)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
    boxShadow: '0 20px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
  },

  ornamentTop: {
    fontFamily: `'Cormorant Garamond', Georgia, serif`,
    fontSize: 'clamp(0.7rem, 2vw, 0.82rem)',
    color: 'rgba(91,156,246,0.55)',
    letterSpacing: '0.5em',
    marginBottom: '0.25rem',
  },

  title: {
    fontFamily: `'Scheherazade New', 'Arial', serif`,
    direction: 'rtl', textAlign: 'center',
    fontSize: 'clamp(1.3rem, 4.5vw, 1.75rem)',
    fontWeight: 600,
    background: 'linear-gradient(135deg, #d4e8ff 0%, #7ec8f0 45%, #e8c97e 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    lineHeight: 1.5, margin: '0.25rem 0',
    textShadow: 'none',
    filter: 'drop-shadow(0 0 18px rgba(91,156,246,0.35))',
  },

  divider: {
    width: 60, height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(91,156,246,0.7), transparent)',
    margin: '0.25rem auto',
    transformOrigin: 'center',
  },

  desc: {
    fontFamily: `'Scheherazade New', 'Arial', serif`,
    direction: 'rtl', textAlign: 'center',
    fontSize: 'clamp(1rem, 3.2vw, 1.2rem)',
    lineHeight: 2.3,
    color: 'rgba(220,235,255,0.82)',
    whiteSpace: 'pre-line',
    fontWeight: 400,
  },

  subLine: {
    fontFamily: `'Scheherazade New', 'Arial', serif`,
    direction: 'rtl', textAlign: 'center',
    fontSize: 'clamp(0.85rem, 2.5vw, 1rem)',
    fontStyle: 'italic',
    color: 'rgba(126,200,240,0.55)',
    letterSpacing: '0.04em',
    marginTop: '-0.25rem',
  },

  btn: {
    position: 'relative', overflow: 'hidden',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    padding: 'clamp(12px,3vw,16px) clamp(28px,6vw,48px)',
    borderRadius: 999,
    background: 'linear-gradient(135deg, #2a6bc8 0%, #4a90d9 50%, #2a6bc8 100%)',
    backgroundSize: '200% 100%',
    border: '1px solid rgba(91,156,246,0.45)',
    boxShadow: '0 0 22px rgba(91,156,246,0.38), 0 6px 22px rgba(0,0,0,0.45)',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'box-shadow 0.35s, background 0.35s',
    WebkitTapHighlightColor: 'transparent',
  },

  btnShimmer: {
    position: 'absolute', top: 0, bottom: 0,
    width: '35%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
    pointerEvents: 'none',
  },

  btnText: {
    fontFamily: `'Scheherazade New', 'Arial', serif`,
    direction: 'rtl',
    fontSize: 'clamp(1rem, 3vw, 1.15rem)',
    fontWeight: 600,
    color: '#e8f4ff',
    letterSpacing: '0.04em',
    position: 'relative', zIndex: 1,
  },

  ornamentBottom: {
    fontFamily: `'Cormorant Garamond', Georgia, serif`,
    fontSize: 'clamp(0.75rem, 2vw, 0.9rem)',
    color: 'rgba(91,156,246,0.4)',
    letterSpacing: '0.35em',
    marginTop: '0.5rem',
  },
}
