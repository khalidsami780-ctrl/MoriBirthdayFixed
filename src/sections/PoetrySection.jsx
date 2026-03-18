import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const POEM = `يا مَريومتي، والقلبُ فيكِ مُوَكَّلٌ
يَرعى خُطاكِ، وبالهوى يَغارُ

أُحِبُّكِ حُبًّا لو يُقاسُ بحرفِهِ
لَعَجِزَتِ الأوصافُ والأشعارُ

وأَغارُ… نعم،
أغارُ حتى من نَسيمٍ عابرٍ
مَرَّ الهَواءُ بقُربِكِ المُختارُ

وأَغارُ من عَينِ النِّساءِ إذا رَمَتْ
نحو الجَمالِ وطالَها الإبصارُ

لكنَّ غيرتي عليكِ مَحبَّةٌ
فيها الأمانُ، ويهدأُ الإعصارُ

فامشي… وقلبِي بالدعاءِ مُرافِقٌ
واللهُ يحفَظُ خَطوَكِ السَّفّارُ

وسأبقى أسعى، لا أملُّ طريقَهُ
حتى يجيءَ الوصلُ والأقدارُ

ويكونُ يومٌ — يا مريومتي — لنا
فيه الحلالُ، ويجمعُ الأستارُ

هذا دعائي كلَّ ليلٍ خاشعًا:
ربّاهُ… احفَظْها، فأنتَ الجبّارُ 🤍`

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.18 } } }
const item = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] } }
}

export default function PoetrySection({ sectionRef }) {
  const innerRef = useRef(null)
  const inView   = useInView(innerRef, { once: true, amount: 0.22 })

  return (
    <section ref={sectionRef} id="poetry" className="section poetry-section">
      <div className="orb orb-gold" style={{ width: 420, height: 420, top: '18%', right: '-16%', opacity: 0.07 }} aria-hidden="true" />
      <div className="orb orb-blue" style={{ width: 320, height: 320, bottom: '4%', left: '-13%', opacity: 0.08 }} aria-hidden="true" />

      <motion.div
        ref={innerRef}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        variants={container}
        style={{ width: '100%', maxWidth: 580, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <motion.span variants={item} className="poetry-label">قصيدة</motion.span>

        <motion.div variants={item} className="glass-card poetry-card" style={{ marginTop: '0.75rem' }}>
          {/* Gold top shimmer */}
          <div style={{
            position: 'absolute', top: 0, left: '20%', right: '20%', height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.35), transparent)',
          }} />

          <p className="poetry-title">قصيدة لمريم</p>
          <div className="divider" />
          <p className="poetry-lines">{POEM}</p>
        </motion.div>
      </motion.div>
    </section>
  )
}
