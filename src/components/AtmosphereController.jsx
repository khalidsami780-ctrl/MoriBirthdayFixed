import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelegramBot } from '../hooks/useTelegramBot.js';

/**
 * AtmosphereController
 * Provides Mori with manual controls to change the website's atmosphere.
 */
export default function AtmosphereController() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentAtmosphere, setCurrentAtmosphere] = useState(() => localStorage.getItem('mori_atmosphere') || 'default');
  const { trackAtmosphereChange } = useTelegramBot();

  const atmospheres = [
    { id: 'default', label: 'الوضع الأصلي', icon: '✨' },
    { id: 'rain', label: 'جو ممطر', icon: '🌧️' },
    { id: 'snow', label: 'جو مثلج', icon: '❄️' },
    { id: 'sunny', label: 'شروق ذهبي', icon: '🌅' },
    { id: 'starry', label: 'ليلة مرصعة بالنجوم', icon: '🌌' },
  ];

  const changeAtmosphere = (id) => {
    const atmo = atmospheres.find(a => a.id === id);
    setCurrentAtmosphere(id);
    localStorage.setItem('mori_atmosphere', id);
    // Dispatch a storage event so other components (WeatherCanvas) can react immediately
    window.dispatchEvent(new Event('storage'));

    trackAtmosphereChange(atmo?.label || id);
  };

  return (
    <div style={S.wrapper}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            style={S.menu}
          >
            {atmospheres.map((atmo) => (
              <motion.button
                key={atmo.id}
                onClick={() => changeAtmosphere(atmo.id)}
                style={{
                  ...S.btn,
                  background: currentAtmosphere === atmo.id ? 'rgba(91, 156, 246, 0.4)' : 'rgba(255, 255, 255, 0.05)',
                  borderColor: currentAtmosphere === atmo.id ? 'var(--blue-200)' : 'rgba(255, 255, 255, 0.1)',
                }}
                whileHover={{ scale: 1.05, background: 'rgba(255, 255, 255, 0.1)' }}
                whileTap={{ scale: 0.95 }}
              >
                <span style={S.btnIcon}>{atmo.icon}</span>
                <span style={S.btnLabel}>{atmo.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        style={S.toggle}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="تغيير الأجواء"
      >
        🎨
      </motion.button>
    </div>
  );
}

const S = {
  wrapper: {
    position: 'fixed',
    right: '20px',
    top: '100px', // Below the notification bell
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    pointerEvents: 'auto',
  },
  toggle: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    background: 'rgba(10, 25, 60, 0.6)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(168, 200, 248, 0.3)',
    color: '#fff',
    fontSize: '1.5rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  },
  menu: {
    marginBottom: '15px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    background: 'rgba(10, 25, 60, 0.8)',
    backdropFilter: 'blur(20px)',
    padding: '15px',
    borderRadius: '20px',
    border: '1px solid rgba(168, 200, 248, 0.2)',
    width: '200px',
    direction: 'rtl',
  },
  btn: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '12px',
    border: '1px solid',
    color: '#fff',
    cursor: 'pointer',
    fontFamily: "'Scheherazade New', serif",
    fontSize: '1rem',
    textAlign: 'right',
    transition: 'all 0.2s ease',
  },
  btnIcon: {
    fontSize: '1.2rem',
  },
  btnLabel: {
    whiteSpace: 'nowrap',
  }
};
