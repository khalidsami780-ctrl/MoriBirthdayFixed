import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

export default function NewMessageNotifier() {
  const [newItem, setNewItem] = useState(null)
  const audioRef = useRef(null)

  useEffect(() => {
    if (!db) return
    
    const checkForNewItems = async () => {
      try {
        // Sequentially check for the first newly deployed unread Message
        const msgsQ = query(collection(db, "messages"), where("isNew", "==", true))
        const msgsSnap = await getDocs(msgsQ)
        
        if (!msgsSnap.empty) {
          const docSnap = msgsSnap.docs[0]
          setNewItem({ id: docSnap.id, type: 'messages', ...docSnap.data() })
          return
        }

        // If no message, fallback and check for Tips
        const tipsQ = query(collection(db, "tips"), where("isNew", "==", true))
        const tipsSnap = await getDocs(tipsQ)

        if (!tipsSnap.empty) {
          const docSnap = tipsSnap.docs[0]
          setNewItem({ id: docSnap.id, type: 'tips', ...docSnap.data() })
        }
      } catch (e) {
        console.error("Error identifying unread items:", e)
      }
    }

    checkForNewItems()
  }, [])

  useEffect(() => {
    // Elegant bell sound auto-play sequence on mounting
    if (newItem && audioRef.current) {
      audioRef.current.volume = 0.4
      // Safe play wrapper incase browser blocks DOM autoplay
      audioRef.current.play().catch(e => console.log('Audio autoplay blocked by browser heuristics', e))
    }
  }, [newItem])

  const handleClose = async () => {
    if (!newItem) return

    const prevItem = newItem
    setNewItem(null)

    // Acknowledge read status to Database
    try {
      const docRef = doc(db, prevItem.type, prevItem.id)
      await updateDoc(docRef, { isNew: false })
    } catch (e) {
      console.error("Error syncing read receipt:", e)
    }
  }

  return (
    <AnimatePresence>
      {newItem && (
        <motion.div
          style={S.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* External Chime Asset */}
          <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />
          
          {/* Animated Magic Floating Core */}
          <FloatingDecor />

          {/* Centered Focus Dialog */}
          <motion.div
            style={S.card}
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 20, stiffness: 250 }}
          >
            <div style={S.iconBox}>💌</div>
            <h2 style={S.title}>💙 تم إضافة رسالة جديدة لموري</h2>
            
            <p style={S.preview}>
              {newItem.text ? `"${newItem.text.substring(0, 50)}${newItem.text.length > 50 ? '...' : ''}"` : 'توجد مفاجأة جديدة بانتظارك...'}
            </p>

            <motion.button 
              style={S.btn} 
              onClick={handleClose} 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
            >
              حسناً 💙
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function FloatingDecor() {
  const elements = [
    { id: 1, symbol: '🌸', left: '10%' },
    { id: 2, symbol: '💙', left: '85%' },
    { id: 3, symbol: '✨', left: '50%' },
    { id: 4, symbol: '🌸', left: '25%' },
    { id: 5, symbol: '💙', left: '75%' }
  ]

  return (
    <div style={S.decorContainer}>
      {elements.map((el, i) => (
        <motion.div
          key={el.id}
          style={{ ...S.floatingItem, left: el.left }}
          initial={{ y: '100vh', opacity: 0, rotate: 0 }}
          animate={{ y: '-10vh', opacity: [0, 0.9, 0], rotate: 360 }}
          transition={{
            duration: 8 + Math.random() * 5,
            repeat: Infinity,
            delay: i * 1.5,
            ease: "linear"
          }}
        >
          {el.symbol}
        </motion.div>
      ))}
    </div>
  )
}

const S = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 999999, // Max elevation
    background: 'rgba(2, 6, 15, 0.75)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
    overflow: 'hidden'
  },
  card: {
    position: 'relative',
    zIndex: 2,
    background: 'linear-gradient(145deg, rgba(85, 120, 180, 0.2), rgba(180, 100, 150, 0.12))',
    boxShadow: '0 25px 70px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.15)',
    border: '1px solid rgba(168, 200, 248, 0.35)',
    borderRadius: '24px',
    padding: '3rem 2rem',
    width: '100%',
    maxWidth: '430px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backdropFilter: 'blur(30px)'
  },
  iconBox: {
    fontSize: '3.5rem',
    lineHeight: 1,
    marginBottom: '1rem',
    filter: 'drop-shadow(0 4px 12px rgba(168, 200, 248, 0.4))'
  },
  title: {
    fontFamily: `'Scheherazade New', 'Arial', serif`,
    fontSize: 'clamp(1.5rem, 4vw, 1.8rem)',
    color: '#ffffff',
    margin: '0 0 1rem 0',
    lineHeight: 1.5,
    direction: 'rtl',
    textShadow: '0 2px 8px rgba(0,0,0,0.5)'
  },
  preview: {
    fontFamily: `'Scheherazade New', 'Arial', serif`,
    fontSize: 'clamp(1.1rem, 3vw, 1.3rem)',
    color: 'rgba(230, 240, 255, 0.85)',
    fontStyle: 'italic',
    margin: '0 0 2.5rem 0',
    direction: 'rtl',
    lineHeight: 1.7
  },
  btn: {
    background: 'linear-gradient(135deg, #a8c8f8 0%, #f4c2d7 100%)',
    border: 'none',
    borderRadius: '99px',
    padding: '0.9rem 2.8rem',
    color: '#03091a',
    fontSize: '1.3rem',
    fontWeight: 'bold',
    fontFamily: `'Scheherazade New', 'Arial', serif`,
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(168, 200, 248, 0.35)',
    outline: 'none'
  },
  decorContainer: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 1,
    overflow: 'hidden'
  },
  floatingItem: {
    position: 'absolute',
    fontSize: '2rem',
    bottom: '-3rem'
  }
}
