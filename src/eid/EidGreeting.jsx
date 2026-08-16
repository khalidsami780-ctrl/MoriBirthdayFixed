import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Stars from '../components/Stars.jsx'

const EID_CONTENT = {
  tagline:   'عيد مبارك يا مريم',
  title:     'Eid with Mori',
  icon:      '💙',
  intro: `I wanted to be the first one to tell you Eid Mubarak…
Even if you see this before Eid,
just know… my heart reached you earlier.`,
  arabic: `مريم…
  ربما أنا لا استطيع أن أعايدك في الحقيقة،
ولا أن أضمك بين ذراعي ،لكني أرجو أن تعانقك كلماتي ،و تصل إليك محملة بكل ما في قلبي لك.
كل عام وأنت بخير،
يا كل كلي،
أتمنى لك عيدًا سعيدًا مباركًا محبوبتي.
كلُّ عامٍ وأنتِ بخير، يا أجمل ما مرَّ بحياتي

يأتي العيد، ويزدحم بالفرح حول الناس،
لكنَّ فرحي الحقيقي… كان وما زال وجودك

كنتُ أتمنّى أن أكون أوّل من يهنّئك،
لا لأنّي أسبق غيري،
بل لأنّ قلبي يسبقني إليك دائمًا

وأصدقك القول…
إنّي أفتقدك أكثر ممّا تُجيده الكلمات
فقد اكتشفتُ أنّ في حضورك سكينةً
كانت تُهوِّن عليَّ كلَّ شيء

وربما لم نعد كما كنّا،
لكنّك ما زلتِ قريبةً من قلبي…
قُربًا لا تُبدِّده المسافات، ولا تُضعفه الأيّام

أسأل الله أن يكون عيدك هادئًا جميلًا،
مليئًا بالطمأنينة والرضا،
وأن أكون سببًا في ابتسامةٍ مرّت بخاطرك ولو للحظة

وإن باعدت بيننا الظروف،
فأنا ما زلت هنا…
أدعو لك، وأحمل لك في قلبي ما لا يتغيّر

كلُّ عامٍ وأنتِ بخير يا مريم
وكلُّ عامٍ وأنتِ في قلبي ❤️
`,
  signature: 'Dodo 🤍',
}

const MOONS = Array.from({ length: 9 }, (_, i) => ({
  id: i, left: `${6 + i * 10}%`,
  size: `${11 + (i % 3) * 5}px`,
  duration: `${10 + (i % 4) * 2.2}s`,
  delay: `${i * 1.2}s`, drift: `${-18 + (i % 3) * 18}px`,
}))

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.16 } } }
const item = {
  hidden:  { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.82, ease: [0.22, 1, 0.36, 1] } },
}

export default function EidGreeting({ sectionRef }) {
  const ref   = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.18 })

  return (
    <section ref={sectionRef} id="eid-greeting" className="section eid-section eid-greeting-section">
      <Stars count={65} />

      {/* Floating crescents */}
      <div className="hearts-container" aria-hidden="true">
        {MOONS.map(m => (
          <span key={m.id} className="heart" style={{
            left: m.left, '--size': m.size,
            '--duration': m.duration, '--delay': m.delay,
            '--drift': m.drift, '--rot': '25deg', '--blur': '0px',
            color: 'rgba(168,200,248,0.3)',
          }}>
            ☽
          </span>
        ))}
      </div>

      <div className="orb orb-blue" style={{ width: 520, height: 520, top: '-12%', left: '-15%', opacity: 0.07 }} aria-hidden="true" />
      <div className="orb orb-blue" style={{ width: 380, height: 380, bottom: '0%', right: '-10%', opacity: 0.06 }} aria-hidden="true" />

      <motion.div
        ref={ref}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        variants={container}
        style={{ textAlign: 'center', position: 'relative', zIndex: 1, maxWidth: 560, width: '100%' }}
      >
        {/* Arabic eyebrow */}
        <motion.p variants={item} style={S.tagline}>{EID_CONTENT.tagline}</motion.p>

        {/* Title */}
        <motion.h1 variants={item} className="t-display" style={S.title}>
          {EID_CONTENT.title}
          <motion.span
            style={{ display: 'inline-block', marginLeft: '0.25em' }}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {EID_CONTENT.icon}
          </motion.span>
        </motion.h1>

        <motion.div variants={item} className="divider-blue" />

        {/* Romantic intro */}
        <motion.p variants={item} style={S.intro}>{EID_CONTENT.intro}</motion.p>

        {/* Glass card */}
        <motion.div variants={item} className="glass-card" style={S.card}>
          {/* Inner top glow */}
          <div style={S.cardTopGlow} />

          <p style={S.arabicText}>{EID_CONTENT.arabic}</p>

          <div className="divider-sm" style={{ margin: '1.5rem auto' }} />

          <p style={S.sig}>{EID_CONTENT.signature}</p>
        </motion.div>

        {/* Closing ornament */}
        <motion.div variants={item} style={S.ornament}>
          {['☽', '✦', '☾'].map((ch, i) => (
            <motion.span
              key={i}
              animate={{ opacity: [0.3, 0.75, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
            >
              {ch}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>

      <div className="scroll-hint" aria-hidden="true">
        <span className="scroll-hint__dot"/><span className="scroll-hint__dot"/><span className="scroll-hint__dot"/>
      </div>
    </section>
  )
}

const S = {
  tagline: {
    fontFamily: 'var(--font-arabic)', direction: 'rtl',
    fontSize: 'clamp(0.88rem, 2.8vw, 1.05rem)',
    color: 'var(--blue-200)', letterSpacing: '0.08em', opacity: 0.65, marginBottom: '0.55rem',
  },
  title: {
    fontSize: 'clamp(2.1rem, 7.5vw, 3.6rem)',
    background: 'linear-gradient(140deg, var(--cream) 0%, var(--blue-200) 55%, rgba(168,200,248,0.65) 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    marginBottom: '0.15rem',
  },
  intro: {
    fontFamily: 'var(--font-body)', fontStyle: 'italic',
    fontSize: 'clamp(0.92rem, 2.7vw, 1.1rem)',
    color: 'var(--cream-mid)', lineHeight: 1.95,
    whiteSpace: 'pre-line', opacity: 0.78,
    margin: '0 auto 1.75rem', maxWidth: 400,
  },
  card: { padding: 'clamp(1.75rem,5vw,2.75rem) clamp(1.5rem,5vw,3rem)', textAlign: 'center', overflow: 'hidden' },
  cardTopGlow: {
    position: 'absolute', top: 0, left: '15%', right: '15%', height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(90,150,240,0.35), transparent)',
  },
  arabicText: {
    fontFamily: 'var(--font-arabic)', direction: 'rtl', textAlign: 'center',
    fontSize: 'clamp(1.0rem, 3.2vw, 1.18rem)', lineHeight: 2.4,
    color: 'var(--cream)', whiteSpace: 'pre-line',
  },
  sig: {
    fontFamily: 'var(--font-display)', fontSize: 'clamp(1rem, 3vw, 1.2rem)',
    color: 'var(--blue-200)', letterSpacing: '0.07em', textAlign: 'center',
  },
  ornament: {
    marginTop: '2.2rem', display: 'flex', gap: '0.8rem',
    alignItems: 'center', justifyContent: 'center',
    color: 'var(--blue-300)', fontSize: '1.15rem', opacity: 0.5,
  },
}
