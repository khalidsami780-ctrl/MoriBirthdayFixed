import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { randomMessages } from '../data/randomMessages.js'
import { createPortal } from 'react-dom'

export default function RandomLoveToast() {
  const [currentMessage, setCurrentMessage] = useState(null)
  const timeoutRef = useRef(null)
  
  useEffect(() => {
    // 1. Show the first message right after load (2 seconds delay)
    const initialDelay = setTimeout(() => {
      showRandomMessage()
    }, 2000);
    
    // 2. Start the interval loop (Randomized between 1 to 3 minutes)
    let loopTimeoutId;
    const loop = () => {
       const nextInterval = 3 * 60 * 1000; // Exactly 3 minutes
       
       loopTimeoutId = setTimeout(() => {
          showRandomMessage();
          loop(); // Schedule the next one recursively
       }, nextInterval);
    };

    loop();

    return () => {
      clearTimeout(initialDelay);
      clearTimeout(loopTimeoutId);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const showRandomMessage = () => {
    // Clear any existing active dismiss-timeout so they don't visually glitch
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Pick a perfectly random message
    const randomIndex = Math.floor(Math.random() * randomMessages.length);
    setCurrentMessage(randomMessages[randomIndex]);
    
    // Auto dismiss after 15 seconds
    timeoutRef.current = setTimeout(() => {
       setCurrentMessage(null);
    }, 15000);
  }

  return createPortal(
    <div style={S.container}>
      <AnimatePresence>
        {currentMessage && (
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={S.card}
            onClick={() => setCurrentMessage(null)} // Dismiss early if she clicks it
            whileHover={{ scale: 1.03, boxShadow: '0 20px 50px rgba(0,0,0,0.7)' }}
          >
            <motion.div 
              style={S.icon}
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            >💌</motion.div>
            <div style={S.textContainer}>
              <div style={S.header}>رسالة لكِ</div>
              <div style={S.text}>{currentMessage}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  )
}

const S = {
  container: {
    position: 'fixed',
    bottom: '1.5rem',
    right: '1.5rem',
    pointerEvents: 'none',
  },
  card: {
    pointerEvents: 'auto',
    cursor: 'pointer',
    background: 'linear-gradient(135deg, rgba(8, 18, 52, 0.95), rgba(4, 10, 34, 0.98))',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(168, 200, 248, 0.3)',
    borderRight: '4px solid #f4c2d7', // Pinkish robust romantic border
    boxShadow: '0 15px 40px rgba(0,0,0,0.6), inset 0 0 15px rgba(244, 194, 215, 0.05)',
    borderRadius: '16px',
    padding: 'clamp(12px, 3vw, 16px) clamp(16px, 4vw, 20px)',
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(10px, 3vw, 14px)',
    maxWidth: 'clamp(240px, 75vw, 320px)',
    direction: 'rtl'
  },
  icon: {
    fontSize: 'clamp(1.5rem, 5vw, 2rem)',
    filter: 'drop-shadow(0 0 10px rgba(244, 194, 215, 0.6))'
  },
  textContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px'
  },
  header: {
    fontSize: 'clamp(0.6rem, 2vw, 0.7rem)',
    fontFamily: 'system-ui, sans-serif',
    color: 'rgba(168, 200, 248, 0.6)',
    letterSpacing: '0.05em',
    fontWeight: 'bold'
  },
  text: {
    fontFamily: `'Scheherazade New', 'Arial', serif`,
    fontSize: 'clamp(1rem, 3.5vw, 1.15rem)',
    color: '#f0e8dc',
    lineHeight: 1.4,
    margin: 0
  }
}
