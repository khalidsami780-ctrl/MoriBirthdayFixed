import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const POEM = `بصّي يا مريومتي…

مهما حاولت أرتّب كلامي،
عمري ما هوفّي حقك ولا أوصف قد إيه مكانك كبير في قلبي 💙

كل سنة وانتي طيبة يا روحي،
كل سنة وانتي بصحة وسلامة،
كل سنة وانتي أقرب لقلبي ودعائي.

صدقيني… وجودك في حياتي مفرق معايا أكتر ما تتخيلي،
وكل يوم بدعي ربنا يحفظك ويطمن قلبك ويسعدك.

وأتمنى من قلبي ييجي اليوم
اللي أكون واقف فيه قدام أهلك بكل فخر،
وأقولهم إن مريم اختارت صح… إن شاء الله 🤍

بحبك يا موري…
I Love You, Mori 🤍`

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.16 } } }
const item = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
}

export default function MessageSection({ sectionRef }) {
  const innerRef = useRef(null)
  const inView   = useInView(innerRef, { once: true, amount: 0.22 })

  return (
    <section ref={sectionRef} id="message" className="section message-section">
      <div className="orb orb-blue" style={{ width: 370, height: 370, top: '8%', right: '-13%', opacity: 0.09 }} aria-hidden="true" />
      <div className="orb orb-gold" style={{ width: 260, height: 260, bottom: '8%', left: '-11%', opacity: 0.05 }} aria-hidden="true" />

      <motion.div
        ref={innerRef}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        variants={container}
        style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <motion.p variants={item} style={{
          fontFamily: 'var(--font-body)', fontStyle: 'italic',
          textAlign: 'center',
          fontSize: 'clamp(0.68rem, 2vw, 0.8rem)',
          color: 'var(--blue-200)',
          letterSpacing: '0.35em', textTransform: 'uppercase',
          opacity: 0.6, marginBottom: '0.85rem',
        }}>
          From the heart
        </motion.p>

        <motion.div variants={item} className="divider-sm" style={{ marginBottom: '1.75rem' }} />

        <motion.div variants={item} className="glass-card message-card">
          {/* Top highlight rule */}
          <div style={{
            position: 'absolute', top: 0, left: '20%', right: '20%', height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(90,150,240,0.3), transparent)',
          }} />

          <p className="message-poem">{POEM}</p>

          <div className="divider" style={{ marginTop: '2.25rem' }} />

          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.2rem, 3.5vw, 1.65rem)',
            color: 'var(--gold-light)',
            textAlign: 'center',
            letterSpacing: '0.08em',
          }}>
            DODO 🤍
          </p>
        </motion.div>
      </motion.div>
    </section>
  )
}
