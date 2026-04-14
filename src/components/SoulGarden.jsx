import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * SoulGarden
 * Renders a magical Blue/Pink Lily that grows based on interaction points.
 */
export default function SoulGarden() {
  const [points, setPoints] = useState(() => parseFloat(localStorage.getItem('mori_garden_points') || '0'));

  useEffect(() => {
    const syncPoints = () => {
      setPoints(parseFloat(localStorage.getItem('mori_garden_points') || '0'));
    };
    window.addEventListener('storage', syncPoints);
    return () => window.removeEventListener('storage', syncPoints);
  }, []);

  // Determine stage
  let stage = 'seed';
  if (points >= 10) stage = 'sprout';
  if (points >= 30) stage = 'bud';
  if (points >= 60) stage = 'bloom';
  if (points >= 100) stage = 'radiance';

  return (
    <div style={S.container}>
      <div style={S.soil}>
        <motion.div 
            style={S.plantWrapper}
            animate={{ rotate: [-1, 1, -1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          {stage === 'seed' && <Seedling />}
          {stage === 'sprout' && <Sprout />}
          {stage === 'bud' && <Bud />}
          {(stage === 'bloom' || stage === 'radiance') && <FullBloom isRadiant={stage === 'radiance'} />}
        </motion.div>
      </div>
      <div style={S.label}>
        <h3 style={S.title}>زهرة الروح 🌸💙</h3>
        <p style={S.subtitle}>{getStageLabel(stage)}</p>
      </div>
    </div>
  );
}

function Seedling() {
  return (
    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={S.seed}>
      🌱
    </motion.div>
  );
}

function Sprout() {
  return (
    <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} style={S.sprout}>
      <div style={S.stem} />
      <div style={{ ...S.leaf, left: '-10px', rotate: '-45deg' }} />
    </motion.div>
  );
}

function Bud() {
  return (
    <motion.div style={S.sprout}>
      <div style={{ ...S.stem, height: '60px' }} />
      <div style={{ ...S.leaf, left: '-12px', top: '30px', rotate: '-45deg' }} />
      <div style={{ ...S.leaf, right: '-12px', top: '20px', rotate: '45deg' }} />
      <motion.div 
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={S.budHead} 
      />
    </motion.div>
  );
}

function FullBloom({ isRadiant }) {
  return (
    <motion.div style={S.sprout}>
      <div style={{ ...S.stem, height: '90px' }} />
      <div style={{ ...S.leaf, left: '-15px', top: '50px', rotate: '-45deg', width: '25px' }} />
      <div style={{ ...S.leaf, right: '-15px', top: '40px', rotate: '45deg', width: '25px' }} />
      
      <motion.div 
        style={S.flowerHead}
        animate={isRadiant ? { filter: ['drop-shadow(0 0 10px #5b9cf6)', 'drop-shadow(0 0 25px #5b9cf6)', 'drop-shadow(0 0 10px #5b9cf6)'] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {/* Petals */}
        {[0, 60, 120, 180, 240, 300].map(deg => (
          <div key={deg} style={{ ...S.petal, transform: `rotate(${deg}deg) translateY(-15px)` }} />
        ))}
        <div style={S.flowerCenter} />
      </motion.div>
    </motion.div>
  );
}

function getStageLabel(stage) {
  switch(stage) {
    case 'seed': return 'بداية نبتة صغيرة...';
    case 'sprout': return 'بدأت تظهر للحياة...';
    case 'bud': return 'تتحضر لتزهر بجمال...';
    case 'bloom': return 'أزهرت حباً ووفاءً...';
    case 'radiance': return 'تشع نوراً وحباً أبدياً...';
    default: return '';
  }
}

const S = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    padding: '40px 20px',
  },
  soil: {
    width: '120px',
    height: '40px',
    background: '#3e2723',
    borderRadius: '50%',
    position: 'relative',
    boxShadow: '0 10px 20px rgba(0,0,0,0.4)',
  },
  plantWrapper: {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  seed: {
    fontSize: '2rem',
  },
  sprout: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  stem: {
    width: '4px',
    height: '40px',
    background: '#4caf50',
    borderRadius: '2px',
  },
  leaf: {
    position: 'absolute',
    width: '18px',
    height: '10px',
    background: '#66bb6a',
    borderRadius: '0 10px 0 10px',
  },
  budHead: {
    position: 'absolute',
    top: '-15px',
    width: '20px',
    height: '25px',
    background: 'linear-gradient(to top, #1e3c72, #5b9cf6)',
    borderRadius: '50% 50% 10% 10%',
    border: '1px solid rgba(255,255,255,0.2)',
  },
  flowerHead: {
    position: 'absolute',
    top: '-20px',
    width: '10px',
    height: '10px',
  },
  petal: {
    position: 'absolute',
    width: '25px',
    height: '45px',
    background: 'linear-gradient(to top, #1e3c72, #5b9cf6, #ffc0cb)',
    borderRadius: '50% 50% 10% 10%',
    border: '1px solid rgba(255,255,255,0.1)',
    transformOrigin: 'bottom center',
    opacity: 0.9,
  },
  flowerCenter: {
    position: 'absolute',
    top: '-5px',
    left: '-5px',
    width: '10px',
    height: '10px',
    background: '#ffd700',
    borderRadius: '50%',
    boxShadow: '0 0 10px #ffd700',
  },
  label: {
    textAlign: 'center',
    direction: 'rtl',
  },
  title: {
    fontFamily: "'Scheherazade New', serif",
    fontSize: '1.8rem',
    color: 'var(--blue-200)',
    margin: 0,
  },
  subtitle: {
    fontFamily: "'Scheherazade New', serif",
    fontSize: '1.1rem',
    color: 'rgba(255,255,255,0.6)',
    margin: '5px 0 0 0',
  }
};
