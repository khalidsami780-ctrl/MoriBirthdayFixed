import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Stars from '../components/Stars.jsx'

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.2 } }
}
const item = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } }
}

export default function WelcomeSection({ sectionRef }) {
  const innerRef = useRef(null)
  const inView   = useInView(innerRef, { once: true, amount: 0.2 })

  return (
    <section ref={sectionRef} id="welcome" className="section welcome-section">
      <Stars count={75} />

      {/* Orbs */}
      <div className="orb orb-blue" style={{ width: 460, height: 460, top: '-18%', left: '-12%', opacity: 0.1 }} aria-hidden="true" />
      <div className="orb orb-blue" style={{ width: 320, height: 320, bottom: '3%', right: '-10%', opacity: 0.08 }} aria-hidden="true" />

      {/* Subtle horizon line */}
      <div style={{
        position: 'absolute', bottom: '18%', left: 0, right: 0,
        height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(90,150,240,0.08), transparent)',
        pointerEvents: 'none',
      }} />

      <motion.div
        ref={innerRef}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        variants={container}
        style={{ textAlign: 'center', position: 'relative', maxWidth: 540, width: '100%' }}
      >
        <motion.p variants={item} className="welcome-eyebrow">
          A letter from the heart
        </motion.p>

        <motion.h1 variants={item} className="t-display welcome-title">
          Meriam Mori
        </motion.h1>

        <motion.div variants={item} className="divider" />

        {/* Scrollable letter in glass card */}
        <motion.div
          variants={item}
          className="glass-card"
          style={{
            padding: 'clamp(1.75rem, 5vw, 2.75rem) clamp(1.5rem, 5vw, 3rem)',
            textAlign: 'right',
            maxHeight: '45dvh',
            overflowY: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(90,150,240,0.2) transparent',
          }}
        >
          <p style={{
            fontFamily: 'var(--font-arabic)',
            direction: 'rtl',
            textAlign: 'right',
            fontSize: 'clamp(1.0rem, 3vw, 1.18rem)',
            lineHeight: 2.4,
            color: 'var(--cream)',
            whiteSpace: 'pre-line',
            fontWeight: 400,
          }}>
            {`إلى اختياري الأول والأخير

أقولها لك اليوم كما قلتها في أول لحظة جمعتنا :

نعم.

نعم اخترتك بكل يقين

اخترتك لأنك كنت الصح الذي لطالما بحثت عنه

قلتها مرة، وأقولها مراراً وتكراراً، وسأقولها إلى الأبد

نعم لك، ونعم لحبك، ونعم لقلبك، ونعم لحياة تجمعني بك.

لماذا ؟

لأنني وجدت فيك الأمن والأمان الذي يروي خوفي

والحب الذي يملأ فراغ أيامي، والصدق الذي يعيد الطمأنينة إلى قلبي.

معك أدركت أن الاختيار ليس مجرد قرار

بل شعور يهمس داخلي أنني مع الشخص الصحيح.

فشكراً لك

شكراً لأنك كنت الإجابة على كل تساؤلاتي وشكراً لأنك كنت الحلم الذي تحقق.

وسأبقى أقولها على الدوام

نعم لحبك، ونعم للحياة التي أراها بين يديك وبعينيك.`}
          </p>

          <div className="divider" style={{ margin: '1.75rem auto 1.25rem' }} />

          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
            color: 'var(--gold-light)',
            textAlign: 'center',
            letterSpacing: '0.07em',
          }}>
            Love U MORI ❤️
          </p>
        </motion.div>

        <motion.p variants={item} className="welcome-year">
          2026
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
