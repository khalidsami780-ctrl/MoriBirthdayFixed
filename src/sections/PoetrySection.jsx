import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const POEM = `يا مَريومتي، والقلبُ فيكِ مُوَكَّلٌ
يَرعى خُطاكِ، وبالهوى يَغارُ

أُحِبُّكِ حُبًّا لو يُقاسُ بحرفِهِ
لَعَجِزَتِ الأوصافُ والأشعارُ

وأَغارُ… نعم،
أغارُ حتى من نَسيمٍ عابرٍ
مَرَّ الهَواءُ بقُربِكِ المُختارُ

وأَغارُ من عَينِ النِّساءِ إذا رَمَتْ
نحو الجَمالِ وطالَها الإبصارُ

لكنَّ غيرتي عليكِ مَحبَّةٌ
فيها الأمانُ، ويهدأُ الإعصارُ

فامشي… وقلبِي بالدعاءِ مُرافِقٌ
واللهُ يحفَظُ خَطوَكِ السَّفّارُ

وسأبقى أسعى، لا أملُّ طريقَهُ
حتى يجيءَ الوصلُ والأقدارُ

ويكونُ يومٌ — يا مريومتي — لنا
فيه الحلالُ، ويجمعُ الأستارُ

هذا دعائي كلَّ ليلٍ خاشعًا:
ربّاهُ… احفَظْها، فأنتَ الجبّارُ 🤍`;

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.2 } }
}

const item = {
  hidden:  { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] } }
}

export default function PoetrySection({ sectionRef }) {
  const innerRef = useRef(null)
  const inView = useInView(innerRef, { once: true, amount: 0.25 })

  return (
    <section
      ref={sectionRef}
      id="poetry"
      className="section poetry-section"
    >
      {/* Gold accent orb */}
      <div className="orb orb-gold" style={{ width: 400, height: 400, top: '20%', right: '-15%', opacity: 0.07 }} aria-hidden="true" />
      <div className="orb orb-blue" style={{ width: 300, height: 300, bottom: '5%', left: '-12%', opacity: 0.08 }} aria-hidden="true" />

      <motion.div
        ref={innerRef}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        variants={container}
        style={{ width: '100%', maxWidth: 580, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <motion.span variants={item} className="poetry-label">
          قصيدة
        </motion.span>

        <motion.div variants={item} className="glass-card poetry-card">
          <p className="poetry-title">قصيدة لمريم</p>

          <div className="divider" />

          <p className="poetry-lines">
            {POEM}
          </p>
        </motion.div>
      </motion.div>
    </section>
  )
}
