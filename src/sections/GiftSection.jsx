import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Stars from '../components/Stars.jsx'

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.2 } } }
const item = {
  hidden:  { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.88, ease: [0.22, 1, 0.36, 1] } }
}

const DONATION_TEXT = `كنتُ أتمنى أن تصلكِ هديةٌ تليق بقلبكِ الجميل،
لكنّكِ — بلطفكِ المعتاد — اكتفيتِ بالكلمة الطيبة.

ولأنني لا أنسى وعدًا،
فقد قررتُ — بنيّةٍ خالصة — أن يكون ثمن هديتكِ صدقةً جارية،
فتبرعتُ به لمؤسسة مجدي يعقوب للقلب.

لعلّها تكون فرحةً تُكتب لكِ،
وأجرًا يبقى في ميزانكِ،
وذكرى جميلة بيني وبينكِ. 🤍`

export default function GiftSection({ sectionRef }) {
  const innerRef = useRef(null)
  const inView   = useInView(innerRef, { once: true, amount: 0.18 })

  return (
    <section ref={sectionRef} id="gift" className="section gift-section">
      <Stars count={50} />
      <div className="orb orb-gold" style={{ width: 400, height: 400, top: '-8%', right: '-10%', opacity: 0.07 }} aria-hidden="true" />
      <div className="orb orb-blue" style={{ width: 310, height: 310, bottom: '4%', left: '-8%', opacity: 0.08 }} aria-hidden="true" />
      <div className="orb orb-gold" style={{ width: 200, height: 200, bottom: '22%', right: '4%', opacity: 0.05 }} aria-hidden="true" />

      <motion.div
        ref={innerRef}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        variants={container}
        style={{ width: '100%', maxWidth: 540, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        {/* Eyebrow */}
        <motion.p variants={item} style={{
          fontFamily: 'var(--font-arabic)', direction: 'rtl',
          textAlign: 'center',
          fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)',
          color: 'var(--gold-light)',
          letterSpacing: '0.1em', opacity: 0.72, marginBottom: '0.25rem',
        }}>
          هديةٌ من القلب
        </motion.p>

        <motion.div variants={item} className="divider-sm" style={{ marginBottom: '1.5rem' }} />

        {/* Card */}
        <motion.div variants={item} className="glass-card gift-card">
          {/* Gold top line */}
          <div style={{
            position: 'absolute', top: 0, left: '18%', right: '18%', height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.38), transparent)',
          }} />

          {/* Heart */}
          <motion.div
            style={{ fontSize: 'clamp(2rem, 6vw, 2.6rem)', textAlign: 'center', lineHeight: 1, marginBottom: '1.1rem', filter: 'drop-shadow(0 0 16px rgba(201,168,76,0.3))' }}
            animate={{ scale: [1, 1.1, 1], opacity: [0.75, 1, 0.75] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            🤍
          </motion.div>

          {/* Foundation badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            margin: '0 auto', padding: '6px 16px', borderRadius: 999,
            border: '1px solid rgba(201,168,76,0.22)',
            background: 'rgba(201,168,76,0.06)',
            fontFamily: 'var(--font-arabic)', direction: 'rtl',
            fontSize: 'clamp(0.73rem, 2.2vw, 0.86rem)',
            color: 'var(--gold-light)', letterSpacing: '0.04em', opacity: 0.78,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)', opacity: 0.7, flexShrink: 0 }} />
            مؤسسة مجدي يعقوب للقلب
          </div>

          <div className="divider" style={{ margin: '1.75rem auto' }} />

          {/* Donation text */}
          <p style={{
            fontFamily: 'var(--font-arabic)', direction: 'rtl', textAlign: 'center',
            fontSize: 'clamp(1.0rem, 3.2vw, 1.18rem)', lineHeight: 2.35,
            color: 'var(--cream)', whiteSpace: 'pre-line', fontWeight: 400,
          }}>
            {DONATION_TEXT}
          </p>

          <div className="divider-sm" style={{ margin: '2rem auto' }} />

          <p style={{
            fontFamily: 'var(--font-arabic)', direction: 'rtl', textAlign: 'center',
            fontSize: 'clamp(1rem, 3vw, 1.2rem)', color: 'var(--gold-light)',
            fontWeight: 500, letterSpacing: '0.06em',
          }}>
            دودو 🤍
          </p>
        </motion.div>

        {/* Closing ornament */}
        <motion.div
          variants={item}
          style={{ marginTop: '2.5rem', display: 'flex', gap: '0.7rem', alignItems: 'center', justifyContent: 'center' }}
        >
          {['✦', '✦', '✦'].map((ch, i) => (
            <motion.span
              key={i}
              style={{ color: 'var(--gold)', fontSize: '1.1rem', letterSpacing: '0.25em' }}
              animate={{ opacity: [0.25, 0.65, 0.25] }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.45, ease: 'easeInOut' }}
            >
              {ch}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
