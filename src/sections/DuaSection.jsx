import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Stars from '../components/Stars.jsx'

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.18 } } }
const item = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.82, ease: [0.22, 1, 0.36, 1] } }
}

const DUA_BLOCKS = [
  {
    key: 'a',
    special: 'متقلقيش عليّا…',
    body: '\nأنا بخير طول ما انتي بخير يا مورو،\nيمكن الطريق طويل شوية،\nلكن طول ما الدعاء بينا…',
    special2: 'القلوب بتوصل حتى لو المسافات بعدت.',
  },
  {
    key: 'b',
    special: 'اللهم احفظ مريم بعينك التي لا تنام،',
    body: '\nواكتب لها راحةً في القلب،\nونورًا في الطريق،\nوتوفيقًا يلازمها أينما كانت.\n\nاللهم اسعد قلبها كما أسعدت قلبي بوجودها،\nوحقق لها ما تتمنى وأجمل مما تتمنى.',
  },
  {
    key: 'c',
    body: 'اللهم احفظ لها أهلها الطيبين،\nوبارك في والدها ووالدتها،\nواحفظ إخوتها،\nواجعل بيتهم عامرًا بالمودة والسكينة.\n\nواجعلني — يا رب — خيرًا لها،\nوخيرًا في طريقها،\nواكتب لنا ما فيه رضاك والخير لنا جميعًا.',
  },
  {
    key: 'd',
    body: 'ويارب… كما كانت الدعوة الجميلة\nتُقال لها من القلب…',
    special: '"ربنا يبارك لك يا مريم… وللمجهول" 🤍',
    body2: '\nفاكتب لهذا المجهول نصيبًا طيبًا،\nواجمع القلوب على خيرٍ يرضيك.',
  },
]

export default function DuaSection({ sectionRef }) {
  const innerRef = useRef(null)
  const inView   = useInView(innerRef, { once: true, amount: 0.18 })

  return (
    <section ref={sectionRef} id="dua" className="section dua-section">
      <Stars count={52} />
      <div className="orb orb-gold" style={{ width: 360, height: 360, top: '-10%', right: '-10%', opacity: 0.06 }} aria-hidden="true" />
      <div className="orb orb-blue" style={{ width: 310, height: 310, bottom: '4%', left: '-10%', opacity: 0.08 }} aria-hidden="true" />

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
          opacity: 0.6, marginBottom: '1.5rem',
        }}>
          A closing prayer
        </motion.p>

        <motion.div variants={item} className="glass-card dua-card">
          <div style={{ position: 'absolute', top: 0, left: '18%', right: '18%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(90,150,240,0.28), transparent)' }} />

          {/* Block A */}
          <p className="dua-text">
            <span className="dua-special">متقلقيش عليّا…</span>
            {'\nأنا بخير طول ما انتي بخير يا مورو،\nيمكن الطريق طويل شوية،\nلكن طول ما الدعاء بينا…\n'}
            <span className="dua-special">القلوب بتوصل حتى لو المسافات بعدت.</span>
          </p>

          <div className="divider" style={{ margin: '2rem auto' }} />

          {/* Block B */}
          <p className="dua-text">
            <span className="dua-special">اللهم احفظ مريم بعينك التي لا تنام،</span>
            {'\nواكتب لها راحةً في القلب،\nونورًا في الطريق،\nوتوفيقًا يلازمها أينما كانت.\n\nاللهم اسعد قلبها كما أسعدت قلبي بوجودها،\nوحقق لها ما تتمنى وأجمل مما تتمنى.'}
          </p>

          <div className="divider-sm" style={{ margin: '2rem auto' }} />

          {/* Block C */}
          <p className="dua-text">
            {'اللهم احفظ لها أهلها الطيبين،\nوبارك في والدها ووالدتها،\nواحفظ إخوتها،\nواجعل بيتهم عامرًا بالمودة والسكينة.\n\nواجعلني — يا رب — خيرًا لها،\nوخيرًا في طريقها،\nواكتب لنا ما فيه رضاك والخير لنا جميعًا.'}
          </p>

          <div className="divider-sm" style={{ margin: '2rem auto' }} />

          {/* Block D */}
          <p className="dua-text">
            {'ويارب… كما كانت الدعوة الجميلة\nتُقال لها من القلب…\n'}
            <span className="dua-special">"ربنا يبارك لك يا مريم… وللمجهول" 🤍</span>
            {'\n\nفاكتب لهذا المجهول نصيبًا طيبًا،\nواجمع القلوب على خيرٍ يرضيك.'}
          </p>

          <div className="divider-sm" style={{ margin: '2rem auto' }} />

          <p className="dua-signature">
            تقبّلي مني هذا الدعاء…{'\n'}دودو
          </p>
        </motion.div>

        {/* Closing ornament */}
        <motion.div
          variants={item}
          style={{ marginTop: '2.5rem', textAlign: 'center', display: 'flex', gap: '0.6rem', justifyContent: 'center' }}
        >
          {['✦', '✦', '✦'].map((ch, i) => (
            <motion.span
              key={i}
              style={{ color: 'var(--gold)', opacity: 0.45, fontSize: '1.2rem', letterSpacing: '0.3em' }}
              animate={{ opacity: [0.3, 0.65, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.4 }}
            >
              {ch}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
