import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Stars from '../components/Stars'

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.2 } }
}

const item = {
  hidden:  { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] } }
}

export default function DuaSection({ sectionRef }) {
  const innerRef = useRef(null)
  const inView = useInView(innerRef, { once: true, amount: 0.2 })

  return (
    <section
      ref={sectionRef}
      id="dua"
      className="section dua-section"
    >
      <Stars count={50} />

      <div className="orb orb-gold" style={{ width: 350, height: 350, top: '-10%', right: '-10%', opacity: 0.06 }} aria-hidden="true" />
      <div className="orb orb-blue" style={{ width: 300, height: 300, bottom: '5%', left: '-10%', opacity: 0.08 }} aria-hidden="true" />

      <motion.div
        ref={innerRef}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        variants={container}
        style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <motion.p variants={item} className="t-italic" style={{
          textAlign: 'center',
          color: 'var(--blue-pale)',
          fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
          letterSpacing: '0.35em',
          textTransform: 'uppercase',
          opacity: 0.65,
          marginBottom: '1.5rem'
        }}>
          A closing prayer
        </motion.p>

        <motion.div variants={item} className="glass-card dua-card">
          <p className="dua-text">
  <span className="dua-special">متقلقيش عليّا…</span>
  {'\n'}أنا بخير طول ما انتي بخير يا مورو،{'\n'}
  يمكن الطريق طويل شوية،{'\n'}
  لكن طول ما الدعاء بينا…{'\n'}
  <span className="dua-special">القلوب بتوصل حتى لو المسافات بعدت.</span>
</p>

<div className="divider" style={{ margin: '2rem auto' }} />

<p className="dua-text">
  <span className="dua-special">اللهم احفظ مريم بعينك التي لا تنام،</span>
  {'\n'}واكتب لها راحةً في القلب،{'\n'}
  ونورًا في الطريق،{'\n'}
  وتوفيقًا يلازمها أينما كانت.
  {'\n\n'}
  اللهم اسعد قلبها كما أسعدت قلبي بوجودها،{'\n'}
  وحقق لها ما تتمنى وأجمل مما تتمنى.
</p>

<div className="divider-sm" style={{ margin: '2rem auto' }} />

<p className="dua-text">
  اللهم احفظ لها أهلها الطيبين،{'\n'}
  وبارك في والدها ووالدتها،{'\n'}
  واحفظ إخوتها،{'\n'}
  واجعل بيتهم عامرًا بالمودة والسكينة.
  {'\n\n'}
  واجعلني — يا رب — خيرًا لها،{'\n'}
  وخيرًا في طريقها،{'\n'}
  واكتب لنا ما فيه رضاك والخير لنا جميعًا.
</p>

<div className="divider-sm" style={{ margin: '2rem auto' }} />

<p className="dua-text">
  ويارب… كما كانت الدعوة الجميلة{'\n'}
  تُقال لها من القلب…{'\n'}
  <span className="dua-special">“ربنا يبارك لك يا مريم… وللمجهول”</span> 🤍
  {'\n\n'}
  فاكتب لهذا المجهول نصيبًا طيبًا،{'\n'}
  واجمع القلوب على خيرٍ يرضيك.
</p>

<div className="divider-sm" style={{ margin: '2rem auto' }} />

<p className="dua-signature">
  تقبّلي مني هذا الدعاء…{'\n'}
  دودو
</p>
        </motion.div>

        {/* Final closing mark */}
        <motion.div
          variants={item}
          style={{
            marginTop: '2.5rem',
            textAlign: 'center',
            color: 'var(--gold)',
            opacity: 0.5,
            fontSize: '1.4rem',
            letterSpacing: '0.5em',
          }}
        >
          ✦
        </motion.div>
      </motion.div>
    </section>
  )
}
