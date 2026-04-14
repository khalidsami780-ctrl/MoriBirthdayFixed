import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * GlobalAtmosphere
 * Renders visual effects (Rain, Snow, Sunny glow) based on the selected atmosphere.
 */
export default function GlobalAtmosphere() {
  const [atmosphere, setAtmosphere] = useState(() => localStorage.getItem('mori_atmosphere') || 'default');

  useEffect(() => {
    const syncAtmosphere = () => {
      setAtmosphere(localStorage.getItem('mori_atmosphere') || 'default');
    };

    window.addEventListener('storage', syncAtmosphere);
    return () => window.removeEventListener('storage', syncAtmosphere);
  }, []);

  // Helper to generate random particles for rain/snow
  const particles = useMemo(() => {
    return Array.from({ length: 120 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: Math.random() * 5,
      duration: 1 + Math.random() * 2,
      opacity: 0.3 + Math.random() * 0.5,
      size: 2 + Math.random() * 4,
    }));
  }, []);

  return (
    <div style={S.container}>
      <AnimatePresence>
        {atmosphere === 'rain' && (
          <motion.div
            key="rain"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={S.overlay}
          >
            {particles.map((p) => (
              <motion.div
                key={p.id}
                style={{
                  ...S.rainDrop,
                  left: p.left,
                  width: '2px', // Made thicker
                  height: '35px', // Made longer
                  opacity: p.opacity,
                }}
                animate={{ y: ['-10vh', '110vh'] }}
                transition={{
                  duration: p.duration * 0.6,
                  repeat: Infinity,
                  delay: p.delay,
                  ease: 'linear',
                }}
              />
            ))}
          </motion.div>
        )}

        {atmosphere === 'snow' && (
          <motion.div
            key="snow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={S.overlay}
          >
            {particles.map((p) => (
              <motion.div
                key={p.id}
                style={{
                  ...S.snowFlake,
                  left: p.left,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  opacity: p.opacity,
                }}
                animate={{ 
                  y: ['-10vh', '110vh'],
                  x: [0, (Math.random() - 0.5) * 50, 0]
                }}
                transition={{
                  duration: p.duration * 3,
                  repeat: Infinity,
                  delay: p.delay,
                  ease: 'linear',
                }}
              />
            ))}
          </motion.div>
        )}

        {atmosphere === 'sunny' && (
          <motion.div
            key="sunny"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }} // Increased from 0.4
            exit={{ opacity: 0 }}
            style={{
              ...S.overlay,
              background: 'radial-gradient(circle at 50% -20%, rgba(232, 201, 126, 0.5) 0%, transparent 80%)',
            }}
          />
        )}

        {atmosphere === 'starry' && (
          <motion.div
            key="starry"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              ...S.overlay,
              background: 'radial-gradient(circle at center, rgba(52, 110, 215, 0.25) 0%, transparent 90%)',
            }}
          >
            {/* Additional extra twinkles could go here if needed, but the base site already has stars */}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const S = {
  container: {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 4, // Behind most UI but above main bg
    overflow: 'hidden',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
  },
  rainDrop: {
    position: 'absolute',
    background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.6))',
  },
  snowFlake: {
    position: 'absolute',
    background: '#fff',
    borderRadius: '50%',
    filter: 'blur(1px)',
  }
};
