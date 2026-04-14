import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import WorldSwitcher from '../shared/WorldSwitcher.jsx';

const NAV_ITEMS = [
  { path: '/birthday', label: 'HOME', icon: '🏠' },
  { path: '/messages', label: 'MESSAGES', icon: '💌' },
  { path: '/unity', label: 'الرابط', icon: '♾️' },
  { path: '/safebox', label: 'SAFEBOX', icon: '🛡️' },
  { path: '/eid', label: 'EID', icon: '🌙' },
];

export default function Navbar() {
  const location = useLocation();
  const [isAgeOpen, setIsAgeOpen] = useState(false);

  return (
    <nav style={S.nav} className="navbar-glass-pill text-rtl">
      {/* Birthday Age Modal - Rendered via Portal for zero clipping */}
      {createPortal(
        <AnimatePresence>
          {isAgeOpen && (
            <div style={S.modalOverlay}>
              {/* Backing Backdrop (Fade) */}
              <motion.div 
                style={S.backdrop}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAgeOpen(false)} // Close on click outside
              />
              
              {/* Centered Modal Card (Fade + Scale) */}
              <motion.div 
                style={S.modalWrapper}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                  {/* Explicit Close Button (X) - Moved outside the box boundary */}
                  <button 
                    style={S.absClose} 
                    className="modal-abs-close"
                    onClick={() => setIsAgeOpen(false)}
                    aria-label="إغلاق"
                  >
                    ✕
                  </button>

                  <div style={S.modalCard}>
                    <WorldSwitcher isOpen={isAgeOpen} />
                  </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <div style={S.container} className="navbar-pill-inner">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
              <motion.div
                style={{
                  ...S.item,
                  color: isActive ? 'var(--blue-200)' : 'rgba(255, 255, 255, 0.6)',
                }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setIsAgeOpen(false);
                  if (item.path === '/birthday') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
              >
                <div style={{
                  ...S.icon,
                  fontSize: isActive ? '1.5rem' : '1.3rem',
                  filter: isActive ? 'drop-shadow(0 0 8px rgba(168, 200, 248, 0.6))' : 'none',
                  transition: 'all 0.3s ease'
                }}>
                  {item.icon}
                </div>
                <span style={{
                  ...S.label,
                  fontWeight: isActive ? '700' : '400',
                  opacity: isActive ? 1 : 0.8
                }}>
                  {item.label}
                </span>
                
                {isActive && (
                  <motion.div
                    layoutId="nav-underline"
                    style={S.underline}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                {isActive && (
                  <motion.div
                    layoutId="nav-glow"
                    style={S.mobileGlow}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}

        {/* 5th Item: Birthday Ages Pill */}
        <motion.div
          style={{
            ...S.item,
            color: isAgeOpen ? 'var(--blue-200)' : 'rgba(255, 255, 255, 0.6)',
          }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsAgeOpen(!isAgeOpen)}
        >
          <div style={{
            ...S.icon,
            fontSize: isAgeOpen ? '1.5rem' : '1.3rem',
            filter: isAgeOpen ? 'drop-shadow(0 0 8px rgba(168, 200, 248, 0.6))' : 'none',
            transition: 'all 0.3s ease'
          }}>
            🎂
          </div>
          <span style={{
            ...S.label,
            fontWeight: isAgeOpen ? '700' : '400',
            opacity: isAgeOpen ? 1 : 0.8
          }}>
            أعمارنا
          </span>
          {isAgeOpen && (
            <motion.div
              layoutId="nav-glow"
              style={S.mobileGlow}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
        </motion.div>
      </div>
    </nav>
  );
}

const S = {
  nav: {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    top: 'auto',
    width: '100%',
    height: '64px',
    background: 'rgba(8, 18, 52, 0.4)',
    backdropFilter: 'blur(16px) saturate(180%)',
    WebkitBackdropFilter: 'blur(16px) saturate(180%)',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    direction: 'rtl',
  },
  container: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    maxWidth: '600px',
    height: '100%',
    padding: '0 1rem',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
  },
  modalWrapper: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  modalCard: {
    width: 'clamp(320px, 95vw, 755px)', // Refined for small mobiles + spacious desktop
    background: 'rgba(8, 18, 52, 0.88)',
    backdropFilter: 'blur(32px) saturate(180%)',
    WebkitBackdropFilter: 'blur(32px) saturate(180%)',
    border: '1px solid rgba(168, 200, 248, 0.35)',
    borderRadius: '32px',
    boxShadow: '0 40px 120px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.1)',
    padding: '30px 24px', 
    overflow: 'hidden',
    position: 'relative',
  },
  absClose: {
    position: 'fixed',
    top: '30px',
    right: '30px', // Extreme right as requested
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
  },
  item: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    cursor: 'pointer',
    position: 'relative',
    padding: '8px 12px',
    minWidth: '64px',
    minHeight: '44px',
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: '0.75rem',
    fontFamily: `'Scheherazade New', serif`,
  },
  underline: {
    position: 'absolute',
    bottom: '-12px', // Specific for desktop top bar
    left: '15%',
    right: '15%',
    height: '3px',
    background: 'var(--blue-200)',
    borderRadius: '999px',
    boxShadow: '0 0 10px var(--blue-200)',
    display: 'none', // Shown via media query
  },
  mobileGlow: {
    position: 'absolute',
    inset: '0',
    background: 'radial-gradient(circle, rgba(168, 200, 248, 0.15) 0%, transparent 70%)',
  }
};

// Add responsive styles directly or via a style tag if needed, but the user asked for fixed BOTTOM on mobile and fixed TOP on desktop
// I'll use a CSS-in-JS injection or just rely on Step 6's index.css changes if I want to be cleaner.
// But I'll put basic media query logic here if I can, or just keep it simple and handle it in Step 6.
// Let's add a small script to handle it or just use window.matchMedia

// Actually, I'll use index.css for the media queries to stay consistent.

// Add responsive styles directly or via a style tag if needed, but the user asked for fixed BOTTOM on mobile and fixed TOP on desktop
// I'll use a CSS-in-JS injection or just rely on Step 6's index.css changes if I want to be cleaner.
// But I'll put basic media query logic here if I can, or just keep it simple and handle it in Step 6.
// Let's add a small script to handle it or just use window.matchMedia

// Actually, I'll use index.css for the media queries to stay consistent.
