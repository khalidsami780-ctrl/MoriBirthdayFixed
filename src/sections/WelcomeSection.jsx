import { motion } from 'framer-motion'
import Stars from '../components/Stars'

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.22 } }
}

const item = {
  hidden:  { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.85, ease: [0.4, 0, 0.2, 1] } }
}

export default function WelcomeSection({ sectionRef }) {
  return (
    <section
      ref={sectionRef}
      id="welcome"
      className="section welcome-section"
    >
      <Stars count={70} />

      {/* Orbs */}
      <div className="orb orb-blue" style={{ width: 400, height: 400, top: '-15%', left: '-10%' }} aria-hidden="true" />
      <div className="orb orb-blue" style={{ width: 300, height: 300, bottom: '5%', right: '-8%' }} aria-hidden="true" />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={container}
        style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}
      >
        <motion.p variants={item} className="welcome-eyebrow">
          A letter from the heart
        </motion.p>

        <motion.h1 variants={item} className="t-display welcome-title">
          Meriam Mori 
        </motion.h1>

        <motion.div variants={item} className="divider" />

        <motion.p variants={item} className="t-italic welcome-subtitle">
          إلى اختياري الأول والأخير

أقولها لك اليوم كما قلتها في أول لحظة جمعتنا :

نعم.

نعم اخترتك بكل يقين

اخترتك لأنك كنت الصح الذي لطالما بحثت عنه

قلتها مرة، وأقولها مراراً وتكراراً، وسأقولها إلى الأبد

نعم لك، ونعم لحبك، ونعم لقلبك، ونعم لحياة تجمعني بك.
<br />
لماذا ؟
<br />
لأنني وجدت فيك الأمن والأمان الذي يروي خوفي

والحب الذي يملأ فراغ أيامي، والصدق الذي يعيد الطمأنينة إلى قلبي.

معك أدركت أن الاختيار ليس مجرد قرار

بل شعور يهمس داخلي أنني مع الشخص الصحيح.

فشكراً لك
<br />
شكراً لأنك كنت الإجابة على كل تساؤلاتي وشكراً لأنك كنت الحلم الذي تحقق.

وسأبقى أقولها على الدوام

نعم لحبك، ونعم للحياة التي أراها بين يديك وبعينيك.
          
          
          <br />
          Love U MORI❤️
        </motion.p>

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
