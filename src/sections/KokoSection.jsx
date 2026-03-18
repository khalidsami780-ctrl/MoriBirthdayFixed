import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import kokoImg from '../assets/koko.png'

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.22 } } }
const item = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.78, ease: [0.22, 1, 0.36, 1] } }
}

export default function KokoSection({ sectionRef }) {
  const innerRef = useRef(null)
  const inView   = useInView(innerRef, { once: true, amount: 0.28 })
  const [imgError, setImgError] = useState(false)

  return (
    <section ref={sectionRef} id="koko" className="section koko-section">
      {/* Dual orbs for depth */}
      <div className="orb orb-blue" style={{ width: 480, height: 480, top: '18%', left: '50%', transform: 'translateX(-50%)', opacity: 0.07 }} aria-hidden="true" />

      <motion.div
        ref={innerRef}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        variants={container}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <motion.p variants={item} style={{
          fontFamily: 'var(--font-body)', fontStyle: 'italic',
          fontSize: 'clamp(0.68rem, 2vw, 0.8rem)',
          color: 'var(--blue-200)',
          letterSpacing: '0.35em', textTransform: 'uppercase',
          opacity: 0.58, marginBottom: '0.75rem', textAlign: 'center',
        }}>
          A special message
        </motion.p>

        <motion.div variants={item} className="glass-card koko-card">
          {/* Floating image with ring glow */}
          <motion.div
            className="koko-image-wrapper"
            animate={{ y: [0, -9, 0] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {imgError ? (
              <div className="koko-image-placeholder">🐱</div>
            ) : (
              <img src={kokoImg} alt="KOKO the cat" onError={() => setImgError(true)} />
            )}
          </motion.div>

          <div>
            <p className="koko-says">KOKO says:</p>
            <motion.p
              className="koko-text"
              animate={{ opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              Happy Birthday,
              <br />Meriam 💙
            </motion.p>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
