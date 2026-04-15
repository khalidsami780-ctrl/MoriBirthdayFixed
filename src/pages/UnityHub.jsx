import { useEffect } from 'react';
import { motion } from 'framer-motion';
import ReasonsJar from '../components/ReasonsJar.jsx';
import SoulGarden from '../components/SoulGarden.jsx';
import { useTelegram } from '../context/TelegramContextCore.jsx';

/**
 * UnityHub
 * The headquarters for all interactive "Unity" features (Garden, Jar).
 */
export default function UnityHub() {
  const { trackSectionEntrance } = useTelegram();

  useEffect(() => {
    trackSectionEntrance('الرابط');
  }, [trackSectionEntrance]);

  return (
    <div style={S.page}>
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={S.header}
      >
        <span style={S.eyebrow}>عالمنا المتصل بـ 6G Signal ♾️</span>
        <h1 style={S.title}>الرابط الروحي</h1>
        <p style={S.subtitle}>
          هنا حديقة حبنا بتكبر مع كل كلمة.. والبرطمان شايل كلماتنا اللي هي رزق ونعمة من ربنا لقلوبنا
        </p>
      </motion.div>

      <div style={S.contentGrid}>
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            style={S.card}
        >
          <SoulGarden />
        </motion.div>

        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            style={S.card}
        >
          <ReasonsJar />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        style={S.footer}
      >
        <p style={S.footerText}>كل تفاعل صغير بينا بيخلى المكان ده ينبض بالحياة.. ✨</p>
      </motion.div>
    </div>
  );
}

const S = {
  page: {
    minHeight: '100vh',
    padding: '100px 20px 120px', // Respect navbar at bottom
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'transparent',
    overflowX: 'hidden',
  },
  header: {
    textAlign: 'center',
    marginBottom: '50px',
    direction: 'rtl',
  },
  eyebrow: {
    display: 'block',
    fontFamily: "'Scheherazade New', serif",
    fontSize: '1rem',
    color: 'var(--blue-200)',
    letterSpacing: '2px',
    marginBottom: '10px',
    opacity: 0.8,
  },
  title: {
    fontFamily: "'Scheherazade New', serif",
    fontSize: 'clamp(2.5rem, 8vw, 3.5rem)',
    color: '#fff',
    margin: '0 0 15px 0',
    textShadow: '0 0 20px rgba(91, 156, 246, 0.4)',
  },
  subtitle: {
    fontFamily: "'Scheherazade New', serif",
    fontSize: '1.2rem',
    color: 'rgba(255, 255, 255, 0.6)',
    maxWidth: '600px',
    lineHeight: 1.6,
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '30px',
    width: '100%',
    maxWidth: '1000px',
  },
  card: {
    background: 'rgba(10, 25, 60, 0.4)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(168, 200, 248, 0.15)',
    borderRadius: '32px',
    padding: '30px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 12px 48px rgba(0,0,0,0.3)',
  },
  footer: {
    marginTop: '60px',
    textAlign: 'center',
  },
  footerText: {
    fontFamily: "'Scheherazade New', serif",
    fontSize: '1.2rem',
    color: 'rgba(168, 200, 248, 0.4)',
    fontStyle: 'italic',
  }
};
