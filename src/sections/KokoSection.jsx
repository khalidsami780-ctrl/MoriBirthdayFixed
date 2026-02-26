import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

// ✅ FIX: Use proper Vite static import instead of new URL()
// The file is koko.png (lowercase) — new URL('../assets/koko.PNG') fails on Linux (case-sensitive)
import kokoImg from '../assets/koko.png'

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.22 } }
}

const item = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.4, 0, 0.2, 1] } }
}

const floatAnim = {
  animate: {
    y: [0, -8, 0],
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
  }
}

export default function KokoSection({ sectionRef }) {
  const innerRef = useRef(null)
  const inView = useInView(innerRef, { once: true, amount: 0.3 })
  const [imgError, setImgError] = useState(false)

  return (
    <section
      ref={sectionRef}
      id="koko"
      className="section koko-section"
    >
      <div
        className="orb orb-blue"
        style={{ width: 450, height: 450, top: '20%', left: '50%', transform: 'translateX(-50%)', opacity: 0.07 }}
        aria-hidden="true"
      />

      <motion.div
        ref={innerRef}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        variants={container}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <motion.div variants={item} style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <p className="t-italic" style={{
            color: 'var(--blue-pale)',
            fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            opacity: 0.65,
          }}>
            A special message
          </p>
        </motion.div>

        <motion.div variants={item} className="glass-card koko-card">
          {/* Floating cat image */}
          <motion.div
            variants={floatAnim}
            animate="animate"
            className="koko-image-wrapper"
          >
            {imgError ? (
              <div className="koko-image-placeholder">🐱</div>
            ) : (
              <img
                src={kokoImg}
                alt="KOKO the cat"
                onError={() => setImgError(true)}
              />
            )}
          </motion.div>

          <div>
            <p className="koko-says">KOKO says:</p>
            <p className="koko-text">Happy Birthday,<br />Meriam 💙</p>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
