import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Stars from '../components/Stars'

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.22 } },
}
const item = {
  hidden:  { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.85, ease: [0.4, 0, 0.2, 1] } },
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
  const inView = useInView(innerRef, { once: true, amount: 0.2 })

  return (
    <section
      ref={sectionRef}
      id="gift"
      className="section gift-section"
    >
      <Stars count={55} />

      {/* Ambient orbs */}
      <div className="orb orb-gold"  style={{ width: 380, height: 380, top: '-8%', right: '-10%', opacity: 0.07 }} aria-hidden="true" />
      <div className="orb orb-blue"  style={{ width: 300, height: 300, bottom: '5%', left: '-8%',  opacity: 0.09 }} aria-hidden="true" />
      <div className="orb orb-gold"  style={{ width: 200, height: 200, bottom: '25%', right: '5%', opacity: 0.05 }} aria-hidden="true" />

      <motion.div
        ref={innerRef}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        variants={container}
        style={{ width: '100%', maxWidth: 540, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        {/* Eyebrow label */}
        <motion.p variants={item} style={S.eyebrow}>
          هديةٌ من القلب
        </motion.p>

        <motion.div variants={item} className="divider-sm" style={{ marginBottom: '1.5rem' }} />

        {/* Card */}
        <motion.div variants={item} className="glass-card gift-card">

          {/* Heart icon top */}
          <motion.div
            style={S.heartIcon}
            animate={{ scale: [1, 1.1, 1], opacity: [0.75, 1, 0.75] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            🤍
          </motion.div>

          {/* Foundation badge */}
          <motion.div style={S.badge}>
            <span style={S.badgeDot} />
            مؤسسة مجدي يعقوب للقلب
          </motion.div>

          <div className="divider" style={{ margin: '1.5rem auto' }} />

          {/* Main text */}
          <p style={S.donationText}>
            {DONATION_TEXT}
          </p>

          <div className="divider-sm" style={{ margin: '2rem auto' }} />

          {/* Signature */}
          <p style={S.signature}>
            دودو 🤍
          </p>
        </motion.div>

        {/* Closing ornament */}
        <motion.div
          variants={item}
          style={S.ornament}
        >
          <motion.span
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            ✦
          </motion.span>
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
          >
            ✦
          </motion.span>
          <motion.span
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
          >
            ✦
          </motion.span>
        </motion.div>
      </motion.div>
    </section>
  )
}

const S = {
  eyebrow: {
    fontFamily: 'var(--font-arabic)',
    direction: 'rtl',
    textAlign: 'center',
    fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)',
    color: 'var(--gold-light)',
    letterSpacing: '0.1em',
    opacity: 0.75,
    marginBottom: '0.25rem',
  },
  heartIcon: {
    fontSize: 'clamp(2rem, 6vw, 2.6rem)',
    textAlign: 'center',
    lineHeight: 1,
    marginBottom: '1rem',
    filter: 'drop-shadow(0 0 14px rgba(201,168,76,0.3))',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    margin: '0 auto',
    padding: '6px 16px',
    borderRadius: 50,
    border: '1px solid rgba(201,168,76,0.22)',
    background: 'rgba(201,168,76,0.06)',
    fontFamily: 'var(--font-arabic)',
    direction: 'rtl',
    fontSize: 'clamp(0.75rem, 2.2vw, 0.88rem)',
    color: 'var(--gold-light)',
    letterSpacing: '0.04em',
    opacity: 0.8,
  },
  badgeDot: {
    width: 5, height: 5,
    borderRadius: '50%',
    background: 'var(--gold)',
    opacity: 0.7,
    flexShrink: 0,
  },
  donationText: {
    fontFamily: 'var(--font-arabic)',
    direction: 'rtl',
    textAlign: 'center',
    fontSize: 'clamp(1.0rem, 3.2vw, 1.18rem)',
    lineHeight: 2.3,
    color: 'var(--cream)',
    whiteSpace: 'pre-line',
    fontWeight: 400,
  },
  signature: {
    fontFamily: 'var(--font-arabic)',
    direction: 'rtl',
    textAlign: 'center',
    fontSize: 'clamp(1rem, 3vw, 1.2rem)',
    color: 'var(--gold-light)',
    fontWeight: 500,
    letterSpacing: '0.06em',
  },
  ornament: {
    marginTop: '2.5rem',
    display: 'flex', gap: '0.8rem',
    alignItems: 'center',
    color: 'var(--gold)',
    fontSize: '1.1rem',
    letterSpacing: '0.3em',
  },
}
