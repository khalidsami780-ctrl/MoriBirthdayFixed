import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const slides = [
  {
    title: "مريومتي، الصندوق ده معمول عشانك.. ❤️",
    content: "يا روح قلب دودو، المكان ده هو مساحتك الخاصة.. تقدري تفتحي لي قلبك فيه في أي وقت، بكل الطرق اللي تحبيها. تعالي أقولك إزاي بنستخدمه..",
    icon: "🏠"
  },
  {
    title: "الرسائل المكتوبة 📝",
    content: "هنا تقدري تكتبي لي كل اللي واجع قلبك أو اللي مفرحك.. الرسالة دي غالية أوي، وعشان كدة الكتابة بتفتح لك كل ٦ أيام، وممكن تفتح قبل كدة وتفاجئك على حسب السيشنز وتفاعلك مع الصندوق.. عشان تفضل لحظة فضفضة مميزة.",
    icon: "✍️"
  },
  {
    title: "صوتك الدفا.. 🎤",
    content: "لو مش قادرة تكتبي وعايزة تطلّعي اللي جواكي بصوتك، دوسي على المايك وسجلي براحتك.. بصمتك الصوتية بتوصل لقلبي فوراً وبتريحني.",
    icon: "🎤"
  },
  {
    title: "صورنا وذكرياتنا.. 📎",
    content: "تقدري تبعتي لي صور، فيديوهات، أو حتى ملفات من زرار المشبك.. أي حاجة حابة تشاركيها معايا، المكان ده بيستوعبها.",
    icon: "📸"
  },
  {
    title: "كل حاجة ليها وقتها ⏳",
    content: "عشان نحافظ على هدوء الصندوق، كل وسيلة (صوت، كتابة، ميديا) ليها وقت استراحة خاص بيها.. لو وسيلة اتقفلت بقفل (🔒)، الباقي بيفضل شغال عادي ومفتوح لك.",
    icon: "🔓"
  },
  {
    title: "النداء العاجل ❤️‍🔥",
    content: "القلب اللي فيه نار ده.. ده 'خط أحمر' بينا.. لو محتاجة دودو ضروري جداً وفي حالة طارئة، دوسي عليه وهيتبعت لي تنبيه يخليني أجيلك في ثانية.",
    icon: "❤️‍🔥"
  },
  {
    title: "أنا معاكي دايماً.. ✨",
    content: "الصندوق ده هو عهد الطمأنينة بينا.. استخدميه وانتي واثقة إن كل حرف وصوت بيوصلي وبلمسه بقلبي. بحبك يا مريومتي.",
    icon: "🧿"
  }
];

export default function SafeBoxGuide({ onClose }) {
  const [current, setCurrent] = useState(0);

  const next = () => {
    if (current < slides.length - 1) setCurrent(c => c + 1);
    else onClose();
  };

  const prev = () => {
    if (current > 0) setCurrent(c => c - 1);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={S.overlay}
      onClick={onClose}
    >
      <motion.div 
        style={S.modal}
        onClick={e => e.stopPropagation()}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
      >
        <button style={S.closeBtn} onClick={onClose}>✕</button>

        <div style={S.content}>
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={S.slide}
            >
              <div style={S.iconBox}>{slides[current].icon}</div>
              <h2 style={S.title}>{slides[current].title}</h2>
              <p style={S.text}>{slides[current].content}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div style={S.footer}>
          <div style={S.dots}>
            {slides.map((_, i) => (
              <div 
                key={i} 
                style={{
                  ...S.dot, 
                  background: i === current ? 'var(--blue-400)' : 'rgba(255,255,255,0.2)',
                  width: i === current ? '24px' : '8px'
                }} 
              />
            ))}
          </div>
          
          <div style={S.navBtns}>
            {current > 0 && (
              <button style={S.navBtn} onClick={prev}>السابق</button>
            )}
            <button style={{...S.navBtn, background: 'var(--blue-500)', color: '#fff'}} onClick={next}>
              {current === slides.length - 1 ? "فهمت يا دودو ✨" : "التالي"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

const S = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(3, 9, 26, 0.92)',
    backdropFilter: 'blur(15px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '20px',
  },
  modal: {
    background: 'rgba(8, 20, 45, 0.85)',
    border: '1px solid rgba(168, 200, 248, 0.2)',
    borderRadius: '32px',
    width: 'min(95%, 500px)',
    maxHeight: 'min(90%, 650px)',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
    padding: '40px 30px',
    textAlign: 'center',
    direction: 'rtl',
  },
  closeBtn: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '1.2rem',
    cursor: 'pointer',
  },
  content: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
  },
  slide: {
    width: '100%',
  },
  iconBox: {
    fontSize: '4rem',
    marginBottom: '20px',
    filter: 'drop-shadow(0 0 15px rgba(168, 200, 248, 0.4))',
  },
  title: {
    fontFamily: "'Scheherazade New', serif",
    fontSize: '1.8rem',
    color: '#fff',
    marginBottom: '15px',
    lineHeight: '1.4',
  },
  text: {
    fontFamily: "'Scheherazade New', serif",
    fontSize: '1.2rem',
    color: 'rgba(255,255,255,0.8)',
    lineHeight: '1.7',
  },
  footer: {
    marginTop: '30px',
  },
  dots: {
    display: 'flex',
    justifyContent: 'center',
    gap: '6px',
    marginBottom: '20px',
  },
  dot: {
    height: '8px',
    borderRadius: '10px',
    transition: 'all 0.3s ease',
  },
  navBtns: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '15px',
  },
  navBtn: {
    flex: 1,
    padding: '12px',
    borderRadius: '15px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: '#fff',
    fontSize: '1.1rem',
    fontFamily: "'Scheherazade New', serif",
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  }
};
