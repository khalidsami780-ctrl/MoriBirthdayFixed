import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { moodDatabase } from '../data/moodMessages.js'

export default function SafeBox() {
  const [isOpen, setIsOpen] = useState(false)
  const [stage, setStage] = useState('mood_selection') // 'mood_selection' | 'message' | 'smile'
  const [activeMessage, setActiveMessage] = useState('')

  const handleOpen = () => {
    setStage('mood_selection')
    setIsOpen(true)
  }

  const handleMoodSelect = (moodKey) => {
    const messages = moodDatabase[moodKey].messages
    const randomIdx = Math.floor(Math.random() * messages.length)
    setActiveMessage(messages[randomIdx])
    setStage('message')
  }

  const handleComfortedClick = () => {
    setStage('smile')
    setTimeout(() => {
      setIsOpen(false)
    }, 2800) // Show smile for approx 2.8 seconds then close modal
  }

  const renderMessageText = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => (
      <div key={idx}>
        <p style={S.para}>{line}</p>
        {idx < text.split('\n').length - 1 && <br/>}
      </div>
    ))
  }

  return (
    <>
      {/* Floating Button - Safely at TOP-LEFT */}
      <motion.button 
        style={S.fab} 
        onClick={handleOpen}
        whileHover={{ scale: 1.1, boxShadow: '0 8px 25px rgba(244, 194, 215, 0.6)' }}
        whileTap={{ scale: 0.9 }}
        title="صندوق الطمأنينة"
      >
        <span style={S.fabIcon}>❤️‍🩹</span>
      </motion.button>

      {/* Relaxing Full-Screen Modal */}
      <AnimatePresence>
        {isOpen && (
           <motion.div 
             style={S.overlay}
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
             transition={{ duration: 0.8 }}
             onClick={() => { if(stage !== 'smile') setIsOpen(false) }}
           >
              <motion.div 
                style={S.modalContent}
                onClick={e => e.stopPropagation()} // Prevent close on modal click
                initial={{ scale: 0.9, y: 50, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 50, opacity: 0 }}
                transition={{ duration: 0.6, type: 'spring', damping: 20 }}
              >
                  <AnimatePresence mode="wait">
                    
                    {/* STAGE 1: Mood Selection */}
                    {stage === 'mood_selection' && (
                      <motion.div
                        key="mood-board"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.4 }}
                        style={S.moodContainer}
                      >
                         <h2 style={{...S.title, fontSize: '1.5rem', marginBottom: '30px'}}>حاسة بإيه دلوقتي يا مريومتي؟</h2>
                         <div style={S.moodGrid}>
                           {Object.keys(moodDatabase).map(key => (
                             <motion.button
                               key={key}
                               style={S.moodButton}
                               whileHover={{ scale: 1.05, backgroundColor: 'rgba(91, 156, 246, 0.25)' }}
                               whileTap={{ scale: 0.95 }}
                               onClick={() => handleMoodSelect(key)}
                             >
                               {moodDatabase[key].label}
                             </motion.button>
                           ))}
                         </div>
                      </motion.div>
                    )}

                    {/* STAGE 2: Deep Comfort Message */}
                    {stage === 'message' && (
                      <motion.div
                        key="comfort-message"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.5 }}
                        style={S.messageContainer}
                      >
                         {/* Breathing Guide Animation */}
                         <div style={S.breatheContainer}>
                           <motion.div 
                             style={S.breatheCircle}
                             animate={{ scale: [1, 2.5, 1], opacity: [0.3, 0.1, 0.3] }}
                             transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
                           />
                           <div style={S.breatheText}>تنفسي بهدوء</div>
                         </div>

                         <motion.h2 
                           style={S.title}
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ delay: 0.2 }}
                         >
                           بسم الله الرحمن الرحيم
                         </motion.h2>
                         
                         <motion.div 
                           style={S.messageBox}
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           transition={{ delay: 0.6, duration: 1 }}
                         >
                            {renderMessageText(activeMessage)}
                         </motion.div>

                         <motion.button 
                           style={S.closeButton} 
                           onClick={handleComfortedClick}
                           whileHover={{ scale: 1.05, backgroundColor: 'rgba(91, 156, 246, 0.9)', color: '#fff' }}
                           whileTap={{ scale: 0.95 }}
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           transition={{ delay: 1.5 }}
                         >
                           اطمأنيت 💙
                         </motion.button>
                      </motion.div>
                    )}

                    {/* STAGE 3: Final Smile Animation */}
                    {stage === 'smile' && (
                      <motion.div
                        key="smile"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{ type: 'spring', bounce: 0.6, duration: 0.8 }}
                        style={S.smileContainer}
                      >
                         <motion.div 
                            style={S.emoji}
                            animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                            transition={{ duration: 1, delay: 0.5 }}
                         >
                           😊
                         </motion.div>
                         <motion.div 
                           style={S.smileText}
                           initial={{ opacity: 0, y: 20 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ delay: 0.8 }}
                         >
                           Smile My LOML
                         </motion.div>
                      </motion.div>
                    )}

                  </AnimatePresence>
              </motion.div>
           </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

const S = {
  fab: {
    position: 'fixed',
    top: '1.5rem',
    left: '1.5rem',
    zIndex: 99990,
    width: '55px',
    height: '55px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(8, 18, 52, 0.8), rgba(244, 194, 215, 0.15))',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(244, 194, 215, 0.3)',
    boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    outline: 'none',
    padding: 0
  },
  fabIcon: {
    fontSize: '24px',
    lineHeight: 1,
    filter: 'drop-shadow(0 0 5px rgba(244, 194, 215, 0.8))'
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100vh',
    background: 'rgba(2, 6, 23, 0.85)',
    backdropFilter: 'blur(15px)',
    WebkitBackdropFilter: 'blur(15px)',
    zIndex: 999999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '1rem',
    overflowY: 'auto'
  },
  modalContent: {
    background: 'linear-gradient(180deg, rgba(16, 28, 68, 0.9), rgba(6, 12, 34, 0.95))',
    border: '1px solid rgba(91, 156, 246, 0.3)',
    borderRadius: '24px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.8), inset 0 1px 10px rgba(244,194,215,0.1)',
    width: '100%',
    maxWidth: '480px',
    minHeight: '300px', // Prevents modal from collapsing too small between transitions
    padding: '40px 30px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    direction: 'rtl',
    position: 'relative',
    overflow: 'hidden'
  },
  moodContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%'
  },
  moodGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%'
  },
  moodButton: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(244, 194, 215, 0.2)',
    padding: '16px 20px',
    borderRadius: '16px',
    color: '#f0e8dc',
    fontFamily: `'Scheherazade New', serif`,
    fontSize: '1.4rem',
    cursor: 'pointer',
    transition: 'border-color 0.3s',
    outline: 'none',
    display: 'flex',
    justifyContent: 'flex-start', // Align text to the right given rtl
    alignItems: 'center'
  },
  messageContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%'
  },
  breatheContainer: {
    position: 'relative',
    width: '80px',
    height: '80px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '20px'
  },
  breatheCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#a8c8f8',
    position: 'absolute',
    filter: 'blur(8px)',
  },
  breatheText: {
    position: 'relative',
    color: '#a8c8f8',
    fontSize: '0.85rem',
    fontFamily: `system-ui, -apple-system, sans-serif`,
    fontWeight: 'bold',
    zIndex: 2,
    letterSpacing: '0.5px'
  },
  title: {
    fontFamily: `'Scheherazade New', serif`,
    color: '#f4c2d7',
    fontSize: '1.6rem',
    marginBottom: '20px',
    textShadow: '0 2px 10px rgba(244, 194, 215, 0.4)'
  },
  messageBox: {
    display: 'flex',
    flexDirection: 'column'
  },
  para: {
    fontFamily: `'Scheherazade New', serif`,
    fontSize: '1.35rem',
    color: '#f0e8dc',
    lineHeight: 1.6,
    margin: 0,
    textShadow: '0 1px 5px rgba(0,0,0,0.5)'
  },
  closeButton: {
    marginTop: '35px',
    padding: '10px 35px',
    borderRadius: '30px',
    background: 'rgba(91, 156, 246, 0.15)',
    border: '1px solid rgba(91, 156, 246, 0.5)',
    color: '#a8c8f8',
    fontFamily: `'Scheherazade New', serif`,
    fontSize: '1.3rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    outline: 'none',
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
  },
  smileContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '250px', // Maintain modal size
    width: '100%'
  },
  emoji: {
    fontSize: '6rem',
    filter: 'drop-shadow(0 0 20px rgba(255,215,0,0.5))',
    marginBottom: '20px'
  },
  smileText: {
    fontFamily: `'Outfit', sans-serif`,
    fontSize: '1.8rem',
    fontWeight: '700',
    color: '#f4c2d7',
    textShadow: '0 0 15px rgba(244, 194, 215, 0.8)',
    letterSpacing: '1px'
  }
}
