import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useTelegram } from '../context/TelegramContextCore'

export default function FullscreenViewer({ mediaItems = [], initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const videoRef = useRef(null)
  const { trackSongPlay } = useTelegram()

  // Tracking logic for audio/video media within FullscreenViewer
  useEffect(() => {
    let trackTimer;
    const item = mediaItems[currentIndex];
    
    // Track if it's audio or video
    if (item && (item.type === 'audio' || item.type === 'video')) {
      trackTimer = setTimeout(() => {
          const typeLabel = item.type === 'audio' ? 'ملف صوتي' : 'فيديو';
          const title = item.caption || item.title || typeLabel;
          trackSongPlay(title, typeLabel === 'فيديو' ? 'مقطع فيديو' : 'صوت');
      }, 10000); // 10 seconds threshold
    }
    
    return () => { if (trackTimer) clearTimeout(trackTimer); };
  }, [currentIndex, mediaItems, trackSongPlay]);

  const goToNext = useCallback((e) => {
    e?.stopPropagation()
    if (currentIndex < mediaItems.length - 1) setCurrentIndex(c => c + 1)
  }, [currentIndex, mediaItems.length])

  const goToPrev = useCallback((e) => {
    e?.stopPropagation()
    if (currentIndex > 0) setCurrentIndex(c => c - 1)
  }, [currentIndex])

  // Keyboard navigation & body lock
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') goToNext(e)
      else if (e.key === 'ArrowLeft') goToPrev(e)
    }
    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden' // Lock background scrolling
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose, goToNext, goToPrev])

  // Pause video if navigating away
  useEffect(() => {
    return () => {
      if (videoRef.current) videoRef.current.pause()
    }
  }, [currentIndex])

  const item = mediaItems[currentIndex]
  if (!item) return null

  // Native UI Renderer mapped cleanly into Lightbox
  const renderMediaContent = () => {
    if (item.type === 'link') {
      return (
        <div style={{ ...LB.mediaWrap, padding: '4rem 2rem', flexDirection: 'column', background: 'rgba(8, 18, 48, 0.7)' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🔗</div>
          <h3 style={{ color: '#fff', fontSize: '1.4rem', fontFamily: `'Scheherazade New', serif` }}>رابط مرفق هنا</h3>
          <p style={{ color: 'rgba(168,200,248,0.7)', fontSize: '0.8rem', wordBreak: 'break-all', marginBottom: '1.5rem', textAlign: 'center' }}>{item.url}</p>
          <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ padding: '0.6rem 2rem', background: '#a8c8f8', color: '#03091a', borderRadius: '50px', textDecoration: 'none', fontWeight: 'bold' }}>
            فتح الرابط
          </a>
        </div>
      )
    }

    if (item.type === 'audio') {
      return (
        <div style={{ ...LB.mediaWrap, padding: '4rem 2rem', flexDirection: 'column', background: 'rgba(8, 18, 48, 0.7)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '2rem' }}>🎵</div>
          <audio src={item.url} controls autoPlay style={{ width: '85%', maxWidth: '300px' }} />
        </div>
      )
    }

    if (item.type === 'video') {
      return (
        <div style={LB.mediaWrap}>
           <video
              ref={videoRef}
              src={item.url}
              style={LB.media}
              controls
              playsInline
              autoPlay
              muted={!!item.muted}
              loop={false}
              preload="metadata"
            />
        </div>
      )
    }

    return (
      <div style={LB.mediaWrap}>
        <img
          src={item.url}
          alt={item.title || "صورة مرفقة"}
          style={LB.media}
          draggable={false}
        />
      </div>
    )
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        style={LB.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
      onClick={onClose}
    >
      {/* Prev Arrow */}
      <motion.button
        style={{ ...LB.arrow, left: 'clamp(0.5rem, 3vw, 2rem)', opacity: currentIndex > 0 ? 0.85 : 0.2 }}
        onClick={goToPrev}
        disabled={currentIndex === 0}
        whileHover={{ scale: 1.08, x: -2 }}
        whileTap={{ scale: 0.92 }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="15,18 9,12 15,6"/></svg>
      </motion.button>

      {/* Main Lightbox Card (Exactly cloning EidMemories Lightbox) */}
      <motion.div
        style={LB.card}
        initial={{ opacity: 0, scale: 0.87, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 16 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()} // Prevent closing when tapping the card itself
      >
        {/* Card Close Button */}
        <motion.button
          style={LB.close}
          onClick={onClose}
          whileHover={{ scale: 1.12, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6"  x2="6"  y2="18"/>
            <line x1="6"  y1="6"  x2="18" y2="18"/>
          </svg>
        </motion.button>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.26 }}
          >
            {renderMediaContent()}
          </motion.div>
        </AnimatePresence>

        {/* Card Footer Caption Box */}
        <div style={LB.footer}>
          {item.type === 'video' && (
            <span style={LB.videoBadge}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
              مقطع فيديو
            </span>
          )}
          {item.type === 'link' && <span style={LB.videoBadge}>🔗 خارجي</span>}
          {item.type === 'audio' && <span style={LB.videoBadge}>🎵 صوت</span>}
          
          <p style={LB.caption}>{item.caption || item.title || "مُرفق مع الرسالة 💙"}</p>
          <p style={LB.counter}>{currentIndex + 1} / {mediaItems.length}</p>
        </div>
      </motion.div>

      {/* Next Arrow */}
      <motion.button
        style={{ ...LB.arrow, right: 'clamp(0.5rem, 3vw, 2rem)', opacity: currentIndex < mediaItems.length - 1 ? 0.85 : 0.2 }}
        onClick={goToNext}
        disabled={currentIndex === mediaItems.length - 1}
        whileHover={{ scale: 1.08, x: 2 }}
        whileTap={{ scale: 0.92 }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="9,18 15,12 9,6"/></svg>
      </motion.button>
    </motion.div>
    </AnimatePresence>,
    document.body
  )
}

const LB = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(2, 6, 18, 0.95)',
    backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  arrow: {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    width: 44, height: 44, borderRadius: '50%',
    background: 'rgba(8,18,52,0.75)', border: '1px solid rgba(90,150,240,0.18)',
    color: 'rgba(168,200,248,0.9)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', outline: 'none', WebkitTapHighlightColor: 'transparent',
    transition: 'opacity 0.25s',
  },
  card: {
    position: 'relative', width: '100%',
    maxWidth: 600,
    margin: '0 clamp(3.5rem, 11vw, 5.5rem)',
    background: 'rgba(6, 14, 44, 0.92)',
    border: '1px solid rgba(90,150,240,0.18)',
    borderRadius: 20, overflow: 'hidden',
    boxShadow: '0 30px 90px rgba(0,0,0,0.75), 0 0 0 0.5px rgba(90,150,240,0.07)',
  },
  close: {
    position: 'absolute', top: 12, right: 12,
    width: 34, height: 34, borderRadius: '50%',
    background: 'rgba(6,14,44,0.85)',
    border: '1px solid rgba(90,150,240,0.2)',
    color: 'rgba(168,200,248,0.78)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', outline: 'none', WebkitTapHighlightColor: 'transparent',
  },
  mediaWrap: {
    width: '100%',
    background: '#02060f',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  media: {
    width: '100%',
    maxHeight: '70vh',
    objectFit: 'contain',
    display: 'block',
    background: '#000',
  },
  footer: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0.85rem 1.4rem', gap: '0.5rem',
  },
  caption: {
    flex: 1,
    fontFamily: `'Cormorant Garamond', Georgia, serif`,
    fontStyle: 'italic', fontSize: 'clamp(0.85rem, 2.4vw, 0.98rem)',
    color: 'rgba(168,200,248,0.78)', letterSpacing: '0.04em',
    textAlign: 'center'
  },
  counter: {
    fontFamily: `'Cormorant Garamond', Georgia, serif`,
    fontSize: '0.7rem', letterSpacing: '0.12em',
    color: 'rgba(168,200,248,0.3)', flexShrink: 0,
  },
  videoBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '3px 10px', borderRadius: 999,
    background: 'rgba(58,123,213,0.18)',
    border: '1px solid rgba(90,150,240,0.25)',
    fontSize: '0.65rem', letterSpacing: '0.1em',
    color: 'rgba(168,200,248,0.7)', flexShrink: 0,
    fontFamily: `'Cormorant Garamond', Georgia, serif`, direction: 'rtl'
  },
}
