import { useMemo, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Stars from '../components/Stars'

const HEARTS = ['💙', '🤍', '💙', '🤍', '💙', '💙', '🤍', '💙', '💙', '🤍', '💙', '💙']

function FloatingHearts() {
  const hearts = useMemo(() => HEARTS.map((h, i) => ({
    id: i,
    char: h,
    left:     `${5 + (i * 8) % 90}%`,
    size:     `${10 + (i % 4) * 4}px`,
    duration: `${9 + (i % 5) * 1.5}s`,
    delay:    `${(i * 1.1) % 8}s`,
    drift:    `${-20 + (i % 3) * 20}px`,
    rot:      `${-40 + (i % 5) * 20}deg`,
    blur:     i % 4 === 0 ? '0.5px' : '0px',
  })), [])

  return (
    <div className="hearts-container" aria-hidden="true">
      {hearts.map(h => (
        <span
          key={h.id}
          className="heart"
          style={{
            left: h.left,
            '--size': h.size,
            '--duration': h.duration,
            '--delay': h.delay,
            '--drift': h.drift,
            '--rot': h.rot,
            '--blur': h.blur,
          }}
        >
          {h.char}
        </span>
      ))}
    </div>
  )
}

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.2 } }
}

const item = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] } }
}

export default function BirthdaySection({ sectionRef }) {
  const innerRef = useRef(null)
  // ✅ FIX: innerRef was created but never attached to a DOM element — animation never triggered
  const inView = useInView(innerRef, { once: true, amount: 0.3 })

  return (
    <section
      ref={sectionRef}
      id="birthday"
      className="section birthday-section"
    >
      <Stars count={40} />
      <FloatingHearts />

      <motion.div
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: 600, height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(58,123,213,0.07) 0%, transparent 70%)',
          top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          pointerEvents: 'none',
        }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ✅ FIX: ref={innerRef} is now properly attached here */}
      <motion.div
        ref={innerRef}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        variants={container}
        style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}
      >
        <motion.div variants={item} className="birthday-tag">
          My Love
        </motion.div>

        <motion.h1 variants={item} className="t-display birthday-name">
          Happy Birthday,
          <br />
          Meriam 💙
        </motion.h1>

        <motion.div variants={item} className="divider" />

        <motion.p variants={item} className="birthday-verse t-italic">
          Patience today,<br />a blessed future tomorrow ya 7obi.
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
