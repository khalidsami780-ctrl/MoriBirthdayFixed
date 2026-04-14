import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelegramBot } from '../hooks/useTelegramBot.js';

/**
 * ReasonsJar
 * A magical glass jar containing small notes ("Reasons why I love you") from Khalid.
 * Notes are archived (moved to a list) once read.
 */
export default function ReasonsJar() {
  const [reasons, setReasons] = useState([]);
  const [selectedReason, setSelectedReason] = useState(null);
  const [showArchive, setShowArchive] = useState(false);
  const { trackReasonOpened, trackReasonArchived } = useTelegramBot();

  useEffect(() => {
    const loadJar = () => {
      try {
        let jar = JSON.parse(localStorage.getItem('mori_reasons_jar') || '[]');
        
        // --- Cleanup Logic: Remove existing duplicates (same text + same day) ---
        const seen = new Set();
        const uniqueJar = jar.filter(item => {
          const identifier = `${item.text}_${new Date(item.timestamp).toDateString()}`;
          if (seen.has(identifier)) return false;
          seen.add(identifier);
          return true;
        });

        if (uniqueJar.length !== jar.length) {
            localStorage.setItem('mori_reasons_jar', JSON.stringify(uniqueJar));
            jar = uniqueJar;
        }
        // -----------------------------------------------------------------------

        setReasons(jar);
      } catch (e) {
        console.error("Failed to load jar", e);
      }
    };

    loadJar();
    window.addEventListener('storage', loadJar);
    return () => window.removeEventListener('storage', loadJar);
  }, []);

  // Filter notes for the jar (only unarchived)
  const activeNotes = useMemo(() => {
    return reasons
      .filter(r => !r.archived)
      .map((r, i) => ({
        ...r,
        left: `${15 + Math.random() * 70}%`,
        bottom: `${10 + Math.random() * 60}%`,
        rotation: Math.random() * 360,
        color: i % 2 === 0 ? '#d4e8ff' : '#ffe4e1', // Alternating Blue and Pink
      }));
  }, [reasons]);

  // Filter archived notes
  const archivedNotes = useMemo(() => {
    return reasons
      .filter(r => r.archived)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [reasons]);

  const handleArchive = (reason) => {
    const updatedReasons = reasons.map(r => 
      r.id === reason.id ? { ...r, archived: true } : r
    );
    setReasons(updatedReasons);
    localStorage.setItem('mori_reasons_jar', JSON.stringify(updatedReasons));
    trackReasonArchived(reason.text);
    setSelectedReason(null);
  };

  return (
    <div style={S.container}>
      <div style={S.topSection}>
        {/* The Jar Visual */}
        <div style={S.jarBody}>
          <div style={S.jarNeck} />
          <div style={S.jarLid} />
          
          <AnimatePresence>
            {activeNotes.map((note) => (
              <motion.div
                key={note.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: 0.8,
                  y: [0, -10, 0],
                  rotate: [note.rotation, note.rotation + 10, note.rotation]
                }}
                whileHover={{ scale: 1.2, opacity: 1, zIndex: 10 }}
                onClick={() => {
                  setSelectedReason(note);
                  trackReasonOpened(note.text);
                }}
                transition={{
                  y: { duration: 3 + Math.random() * 2, repeat: Infinity, ease: 'easeInOut' },
                  rotate: { duration: 4 + Math.random() * 2, repeat: Infinity, ease: 'easeInOut' },
                }}
                style={{
                  ...S.note,
                  left: note.left,
                  bottom: note.bottom,
                  backgroundColor: note.color,
                  transform: `rotate(${note.rotation}deg)`,
                }}
              />
            ))}
          </AnimatePresence>
        </div>
        <p style={S.label}>برطمان رزق الله لنا ✨</p>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowArchive(true)}
          style={S.archiveToggle}
        >
          📜 سجل الكلمات الطيبات
        </motion.button>
      </div>

      {/* Archive Modal Overlay */}
      <AnimatePresence>
        {showArchive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={S.overlay}
            onClick={() => setShowArchive(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={S.archiveModal}
              onClick={(e) => e.stopPropagation()}
            >
              <button style={S.close} onClick={() => setShowArchive(false)}>✕</button>
              
              <div style={S.archiveHeader}>
                <h3 style={S.archiveTitle}>سجل الكلمات الطيبات 📁</h3>
                <span style={S.archiveCount}>{archivedNotes.length} رسالة مؤرشفة</span>
              </div>
              
              <div style={S.archiveGrid}>
                {archivedNotes.map((note, idx) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.02, x: -5 }}
                    onClick={() => {
                        setSelectedReason(note);
                        // Optional: close archive when viewing detail? 
                        // Let's keep it open for easy browsing, parchment will stack on top.
                    }}
                    style={{
                        ...S.archiveCard,
                        borderRight: `4px solid ${idx % 2 === 0 ? '#5b9cf6' : '#ffc0cb'}`
                    }}
                  >
                    <p style={S.archiveCardText}>{note.text}</p>
                    <span style={S.archiveCardDate}>
                      {new Date(note.timestamp).toLocaleDateString('ar-EG', {
                          day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </span>
                  </motion.div>
                ))}
                {archivedNotes.length === 0 && (
                  <p style={S.emptyArchive}>الأرشيف لسه مستني أول رسايل تتقرأ... ☕</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail View / Parchment */}
      <AnimatePresence>
        {selectedReason && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={S.overlay}
            onClick={() => setSelectedReason(null)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              style={S.parchment}
              onClick={(e) => e.stopPropagation()}
            >
              <button style={S.close} onClick={() => setSelectedReason(null)}>✕</button>
              <div style={S.parchmentContent}>
                <p style={S.parchmentText}>{selectedReason.text}</p>
                <time style={S.parchmentDate}>
                    {new Date(selectedReason.timestamp).toLocaleDateString('ar-EG', {
                        day: 'numeric', month: 'long', year: 'numeric'
                    })}
                </time>

                {!selectedReason.archived && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleArchive(selectedReason)}
                    style={S.archiveBtn}
                  >
                    نقل للأرشيف ✅
                  </motion.button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const S = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '40px',
    padding: '20px',
    width: '100%',
  },
  topSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px'
  },
  jarBody: {
    position: 'relative',
    width: '200px',
    height: '260px',
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(8px)',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '40% 40% 30% 30% / 15% 15% 10% 10%',
    boxShadow: 'inset 0 0 40px rgba(255,255,255,0.1), 0 20px 50px rgba(0,0,0,0.3)',
    overflow: 'hidden',
  },
  jarNeck: {
    position: 'absolute',
    top: '-5px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '110px',
    height: '20px',
    background: 'rgba(255, 255, 255, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '5px',
    zIndex: 2,
  },
  jarLid: {
    position: 'absolute',
    top: '-15px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '120px',
    height: '15px',
    background: 'linear-gradient(to right, #2c3e50, #000, #2c3e50)',
    borderRadius: '10px 10px 2px 2px',
    zIndex: 3,
  },
  note: {
    position: 'absolute',
    width: '24px',
    height: '32px',
    borderRadius: '3px',
    cursor: 'pointer',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    border: '1px solid rgba(0,0,0,0.05)',
  },
  label: {
    fontFamily: "'Scheherazade New', serif",
    fontSize: '1.6rem',
    color: 'var(--blue-200)',
    textShadow: '0 0 10px rgba(168, 200, 248, 0.5)',
    margin: 0,
  },
  archiveToggle: {
    marginTop: '15px',
    background: 'rgba(168, 200, 248, 0.1)',
    border: '1px solid rgba(168, 200, 248, 0.2)',
    color: 'var(--blue-200)',
    padding: '8px 20px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontFamily: "'Scheherazade New', serif",
    fontSize: '1.1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  archiveModal: {
    position: 'relative',
    width: 'min(95%, 500px)',
    maxHeight: '85vh',
    background: 'rgba(13, 25, 48, 0.85)',
    backdropFilter: 'blur(30px) saturate(180%)',
    WebkitBackdropFilter: 'blur(30px) saturate(180%)',
    padding: '40px 20px 20px',
    borderRadius: '35px',
    border: '1px solid rgba(168, 200, 248, 0.15)',
    boxShadow: '0 25px 80px rgba(0,0,0,0.6), inset 0 0 20px rgba(168, 200, 248, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    direction: 'rtl',
    overflow: 'hidden',
  },
  archiveHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '20px',
    padding: '0 10px 10px',
    borderBottom: '1px solid rgba(168, 200, 248, 0.1)',
  },
  archiveTitle: {
    fontFamily: "'Scheherazade New', serif",
    fontSize: '1.6rem',
    color: 'var(--blue-200)',
    margin: 0,
    textShadow: '0 0 15px rgba(168, 200, 248, 0.3)',
  },
  archiveCount: {
    fontSize: '0.8rem',
    color: 'rgba(168, 200, 248, 0.4)',
    fontWeight: '300',
  },
  archiveGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    maxHeight: '100%',
    overflowY: 'auto',
    overflowX: 'hidden', // Strictly prevent horizontal scroll
    padding: '0 10px 15px',
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(168, 200, 248, 0.2) transparent',
    // Custom scrollbar for Webkit
    WebkitOverflowScrolling: 'touch',
    '&::-webkit-scrollbar': {
      width: '4px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'rgba(168, 200, 248, 0.2)',
      borderRadius: '10px',
    },
  },
  archiveCard: {
    background: 'rgba(255, 255, 255, 0.03)',
    padding: '18px 20px',
    borderRadius: '20px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    border: '1px solid rgba(255, 255, 255, 0.02)',
    boxSizing: 'border-box',
    width: '100%',
  },
  archiveCardText: {
    fontSize: '1.2rem',
    lineHeight: 1.5,
    color: 'rgba(255, 255, 255, 0.95)',
    margin: 0,
    fontFamily: "'Scheherazade New', serif",
    textAlign: 'right',
  },
  archiveCardDate: {
    fontSize: '0.75rem',
    color: 'rgba(168, 200, 248, 0.4)',
    textAlign: 'left',
    fontStyle: 'italic',
  },
  emptyArchive: {
    textAlign: 'center',
    color: 'rgba(168, 200, 248, 0.2)',
    fontFamily: "'Scheherazade New', serif",
    fontSize: '1.2rem',
    padding: '40px 0',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(2, 8, 20, 0.8)',
    backdropFilter: 'blur(12px)',
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '15px',
  },
  parchment: {
    position: 'relative',
    width: 'min(90%, 450px)',
    background: '#f8f2e3',
    padding: '50px 30px 40px',
    borderRadius: '10px',
    boxShadow: '0 30px 90px rgba(0,0,0,0.7)',
    backgroundImage: 'linear-gradient(rgba(0,0,0,0.04) 2px, transparent 2px)',
    backgroundSize: '100% 30px',
    color: '#3e2723',
    textAlign: 'center',
    direction: 'rtl',
  },
  parchmentContent: {
    border: '3px double rgba(93, 64, 55, 0.15)',
    padding: '25px',
    minHeight: '220px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  parchmentText: {
    fontFamily: "'Scheherazade New', serif",
    fontSize: '2.1rem',
    lineHeight: 1.5,
    margin: 0,
    color: '#4e342e',
    textAlign: 'center',
  },
  parchmentDate: {
    marginTop: '30px',
    fontSize: '0.9rem',
    opacity: 0.6,
    fontStyle: 'italic',
  },
  archiveBtn: {
    marginTop: '35px',
    background: '#5d4037',
    color: '#fff',
    border: 'none',
    padding: '12px 30px',
    borderRadius: '30px',
    cursor: 'pointer',
    fontSize: '1.1rem',
    fontFamily: "'Scheherazade New', serif",
    boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
    transition: 'all 0.3s ease',
  },
  close: {
    position: 'absolute',
    top: '18px',
    left: '20px', // Proper placement for Arabic/RTL context (Top-Left often better if list is RTL)
    background: 'rgba(255,255,255,0.05)',
    border: 'none',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.2rem',
    cursor: 'pointer',
    color: 'rgba(255,255,255,0.6)',
    transition: 'all 0.3s ease',
    zIndex: 10,
  }
};

