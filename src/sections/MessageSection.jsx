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
I Love You, Mori 🤍`;

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.18 } }
}

const item = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.4, 0, 0.2, 1] } }
}

export default function MessageSection({ sectionRef }) {
  const innerRef = useRef(null)
  const inView = useInView(innerRef, { once: true, amount: 0.25 })

  return (
    <section
      ref={sectionRef}
      id="message"
      className="section message-section"
    >
      {/* Ambient orbs */}
      <div className="orb orb-blue" style={{ width: 350, height: 350, top: '10%', right: '-12%', opacity: 0.09 }} aria-hidden="true" />
      <div className="orb orb-gold" style={{ width: 250, height: 250, bottom: '10%', left: '-10%', opacity: 0.05 }} aria-hidden="true" />

      <motion.div
        ref={innerRef}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        variants={container}
        style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <motion.div variants={item}>
          <p className="t-italic" style={{
            textAlign: 'center',
            color: 'var(--blue-pale)',
            fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            opacity: 0.65,
            marginBottom: '1rem'
          }}>
            From the heart
          </p>
        </motion.div>

        <motion.div variants={item} className="divider-sm" />

        <motion.div variants={item} className="glass-card message-card" style={{ marginTop: '1.5rem' }}>
          <p className="message-poem">
            {POEM}
          </p>
          <div className="divider" style={{ marginTop: '2rem' }} />
          <p className="message-signature" style={{ textAlign: 'center' }}>
            DODO 🤍
          </p>
        </motion.div>
      </motion.div>
    </section>
  )
}
