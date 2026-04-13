import { useMemo, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Stars from '../components/Stars.jsx'

const HEARTS = ['💙','🤍','💙','🤍','💙','💙','🤍','💙','💙','🤍','💙','💙']

function FloatingHearts() {
  const hearts = useMemo(() => HEARTS.map((h, i) => ({
    id: i, char: h,
    left:     `${5 + (i * 8) % 90}%`,
    size:     `${9 + (i % 4) * 4}px`,
    duration: `${10 + (i % 5) * 1.6}s`,
    delay:    `${(i * 1.1) % 8}s`,
    drift:    `${-22 + (i % 3) * 22}px`,
    rot:      `${-35 + (i % 5) * 18}deg`,
    blur:     i % 4 === 0 ? '0.5px' : '0px',
  })), [])

  return (
    <div className="hearts-container" aria-hidden="true">
      {hearts.map(h => (
        <span key={h.id} className="heart" style={{
          left: h.left, '--size': h.size, '--duration': h.duration,
          '--delay': h.delay, '--drift': h.drift, '--rot': h.rot, '--blur': h.blur,
        }}>
          {h.char}
        </span>
      ))}
    </div>
  )
}

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.2 } } }
const item = {
  hidden:  { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] } }
}

export default function BirthdaySection({ sectionRef }) {
  const innerRef = useRef(null)
  const inView   = useInView(innerRef, { once: true, amount: 0.28 })

  return (
    <section ref={sectionRef} id="birthday" className="section birthday-section">
      <Stars count={45} />
      <FloatingHearts />

      {/* Central breathing glow */}
      <motion.div
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: '70vmax', height: '70vmax',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(42,100,210,0.08) 0%, transparent 68%)',
          top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          pointerEvents: 'none',
        }}
        animate={{ scale: [1, 1.07, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        ref={innerRef}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        variants={container}
        style={{ textAlign: 'center', position: 'relative' }}
      >
        <motion.div variants={item}>
          <span style={{
            display: 'inline-block',
            padding: '0.3rem 1.2rem',
            border: '1px solid rgba(91,156,246,0.22)',
            borderRadius: 999,
            fontSize: 'clamp(0.65rem, 1.8vw, 0.75rem)',
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            color: 'var(--blue-300)',
            marginBottom: '2rem',
            backdropFilter: 'blur(10px)',
            background: 'rgba(91,156,246,0.06)',
            boxShadow: '0 0 20px rgba(91,156,246,0.07)',
          }}>
            My Love
          </span>
        </motion.div>

        <motion.h1 variants={item} className="t-display birthday-name">
          Happy Birthday,
          <br />
          Meriam 💙
        </motion.h1>

        <motion.div variants={item} className="divider" />

        <motion.p variants={item} style={{
          fontFamily: 'var(--font-body)',
          fontStyle: 'italic',
          fontSize: 'clamp(0.95rem, 2.8vw, 1.2rem)',
          color: 'var(--cream-mid)',
          maxWidth: 340, margin: '0 auto',
          opacity: 0.78, lineHeight: 1.9,
        }}>
          Patience today,
          <br />
          a blessed future tomorrow ya 7obi.
        </motion.p>
      </motion.div>

      <div className="scroll-hint" aria-hidden="true">
        <span className="scroll-hint__dot" />
        <span className="scroll-hint__dot" />
        <span className="scroll-hint__dot" />
      </div>
    </section>
  )
}
