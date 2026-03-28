import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cloudinary } from '@cloudinary/url-gen'
import { AdvancedImage, AdvancedVideo, placeholder } from '@cloudinary/react'
import { format, quality } from '@cloudinary/url-gen/actions/delivery'

const cld = new Cloudinary({ cloud: { cloudName: 'djdktudjh' } })

// Parse securely and handle Arabic URL encoded characters
const extractCloudinaryId = (url) => {
  const match = url?.match(/\/upload\/(?:v\d+\/)?([^.]+)/)
  if (!match) return ''
  try {
    return decodeURIComponent(match[1])
  } catch (e) {
    return match[1]
  }
}

export default function FullscreenViewer({ mediaItems = [], initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  const goToNext = useCallback((e) => {
    e?.stopPropagation()
    if (currentIndex < mediaItems.length - 1) setCurrentIndex(c => c + 1)
  }, [currentIndex, mediaItems.length])

  const goToPrev = useCallback((e) => {
    e?.stopPropagation()
    if (currentIndex > 0) setCurrentIndex(c => c - 1)
  }, [currentIndex])

  // Map keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') goToNext(e)
      else if (e.key === 'ArrowLeft') goToPrev(e)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, goToNext, goToPrev])

  const item = mediaItems[currentIndex]
  if (!item) return null

  // Render Engine Strategy
  const renderInteractiveMedia = () => {
    if (item.type === 'link') {
      return (
        <motion.div style={S.linkCard} initial={{scale: 0.9, opacity:0}} animate={{scale:1, opacity:1}}>
          <div style={S.linkIcon}>🔗</div>
          <h3 style={S.linkTitle}>External Link Payload</h3>
          <p style={S.linkUrl}>{item.url}</p>
          <a href={item.url} target="_blank" rel="noopener noreferrer" style={S.linkBtn} onClick={e => e.stopPropagation()}>
            Open Link <span style={{marginLeft: 6}}>↗</span>
          </a>
        </motion.div>
      )
    }

    if (item.type === 'audio') {
      return (
        <motion.div style={S.audioCard} initial={{scale: 0.9, opacity:0}} animate={{scale:1, opacity:1}}>
          <div style={S.audioIcon}>🎵</div>
          <audio src={item.url} controls style={S.audioPlayer} autoPlay onClick={e => e.stopPropagation()} />
        </motion.div>
      )
    }

    const publicId = extractCloudinaryId(item.url)
    if (!publicId) return <div style={{color: 'white'}}>Media Unavailable</div>

    const mediaAsset = item.type === 'video' ? cld.video(publicId) : cld.image(publicId)
    mediaAsset.delivery(format('auto')).delivery(quality('auto'))

    return (
      <div style={S.visualMediaContainer} onClick={e => e.stopPropagation()}>
        {item.type === 'video' ? (
          <AdvancedVideo cldVid={mediaAsset} controls autoPlay playsInline style={S.visualMedia} />
        ) : (
          <AdvancedImage cldImg={mediaAsset} plugins={[placeholder({ mode: 'blur' })]} style={S.visualMedia} />
        )}
      </div>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        style={S.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        onClick={onClose}
      >
        <div style={S.header}>
          <div style={S.counter}>{currentIndex + 1} / {mediaItems.length}</div>
          <motion.button 
            style={S.closeBtn} 
            onClick={onClose} 
            title="Close (ESC)"
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.15)' }}
            whileTap={{ scale: 0.9 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </motion.button>
        </div>

        {currentIndex > 0 && (
          <motion.button 
            style={{...S.navBtn, left: '2%'}} 
            onClick={goToPrev}
            whileHover={{scale: 1.1, backgroundColor: 'rgba(255,255,255,0.2)'}}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </motion.button>
        )}

        {currentIndex < mediaItems.length - 1 && (
          <motion.button 
            style={{...S.navBtn, right: '2%'}} 
            onClick={goToNext}
            whileHover={{scale: 1.1, backgroundColor: 'rgba(255,255,255,0.2)'}}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </motion.button>
        )}

        {/* Content Engine Container */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.97 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            style={S.centerStage}
          >
            {renderInteractiveMedia()}
          </motion.div>
        </AnimatePresence>

      </motion.div>
    </AnimatePresence>
  )
}

const S = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 999999,
    background: 'rgba(2, 6, 15, 0.95)',
    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
    display: 'flex', flexDirection: 'column',
  },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '1.5rem 2rem', zIndex: 10
  },
  counter: {
    color: 'rgba(255,255,255,0.8)', fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: '2px',
    background: 'rgba(0,0,0,0.4)', padding: '0.4rem 1rem', borderRadius: '50px', backdropFilter: 'blur(10px)'
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
    backdropFilter: 'blur(8px)', color: '#fff', width: '44px', height: '44px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none'
  },
  navBtn: {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
    backdropFilter: 'blur(10px)', color: '#fff', width: '56px', height: '56px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none', zIndex: 10,
    boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
  },
  centerStage: {
    flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center',
    padding: '4rem 6rem', width: '100%', height: '100%'
  },
  visualMediaContainer: {
    position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center',
    borderRadius: '16px', overflow: 'hidden',
    boxShadow: '0 0 100px rgba(91,156,246,0.15), 0 0 50px rgba(180,100,150,0.12), 0 25px 60px rgba(0,0,0,0.9)',
    transform: 'translateZ(0)', background: '#040d1e', width: '100%', maxWidth: '1100px', height: '100%', maxHeight: '85vh'
  },
  visualMedia: {
    width: '100%', height: '100%', objectFit: 'contain', display: 'block', outline: 'none', border: 'none'
  },
  linkCard: {
    background: 'linear-gradient(145deg, rgba(85, 120, 180, 0.15), rgba(180, 100, 150, 0.1))',
    border: '1px solid rgba(168, 200, 248, 0.3)', borderRadius: '24px', padding: '3.5rem 3rem',
    textAlign: 'center', maxWidth: '500px', width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)'
  },
  linkIcon: { fontSize: '4rem', marginBottom: '1.5rem', filter: 'drop-shadow(0 4px 12px rgba(168, 200, 248, 0.4))' },
  linkTitle: { color: '#fff', fontSize: '1.6rem', marginBottom: '0.5rem', fontFamily: `'Scheherazade New', serif` },
  linkUrl: { color: 'rgba(168,200,248,0.7)', fontSize: '0.9rem', marginBottom: '2.5rem', wordBreak: 'break-all' },
  linkBtn: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #a8c8f8 0%, #f4c2d7 100%)', color: '#03091a',
    padding: '0.9rem 2.5rem', borderRadius: '50px', fontSize: '1.1rem', fontWeight: 'bold',
    textDecoration: 'none', boxShadow: '0 8px 24px rgba(168, 200, 248, 0.35)', transition: 'transform 0.2s'
  },
  audioCard: {
    background: 'rgba(8, 18, 48, 0.7)', border: '1px solid rgba(91,156,246,0.3)',
    borderRadius: '24px', padding: '3rem', textAlign: 'center', maxWidth: '400px', width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)'
  },
  audioIcon: { fontSize: '4rem', marginBottom: '2rem', animation: 'float 4s ease-in-out infinite' },
  audioPlayer: { width: '100%', outline: 'none' }
}
