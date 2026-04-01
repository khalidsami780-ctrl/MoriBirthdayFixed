import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import FullscreenViewer from './FullscreenViewer.jsx'

/* ═══════════════════════════════════════════════════════════════
   Reusable Native Media Preview Component
   Matches Eid "Memories" Array Styles (Native <img> and <video>)
══════════════════════════════════════════════════════════════════ */

function PreviewThumbnail({ item }) {
  const videoRef = useRef(null)

  // Link/Audio Stubs
  if (item.type === 'link') {
    return (
     <div style={S.linkPreview}>
        <span style={S.icon}>🔗</span>
        <span style={S.linkText}>مرفق رابط</span>
     </div>
    )
  }
  if (item.type === 'audio') {
    return (
      <div style={S.audioPreview}>
        <span style={S.icon}>🎵</span>
        <span style={S.linkText}>مقطع صوتي</span>
      </div>
    )
  }

  // Native Image + Video logic (bypassing Cloudinary library bugs)
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {item.type === 'video' ? (
        <>
          <video
            ref={videoRef}
            src={item.url}
            style={S.mediaNative}
            muted={item.muted !== false} // preview always muted by default; respects explicit muted:false
            playsInline
            preload="metadata"
            onLoadedMetadata={e => { e.target.currentTime = 0.5 }}
          />
          {/* Permanent play overlay for videos */}
          <div style={S.videoPlayBtn}>
            <div style={S.playIconRing}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <polygon points="6,3 20,12 6,21"/>
              </svg>
            </div>
          </div>
        </>
      ) : (
        <img
          src={item.url}
          alt={item.title || "Memory"}
          style={S.mediaNative}
          loading="lazy"
          draggable={false}
        />
      )}

      {/* Hover Zoom Overlay (Matches Memories) */}
      <div style={S.hoverOverlay} className="memory-hover-overlay">
        <div style={S.zoomIcon}>
          {item.type === 'video' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="1.7" strokeLinecap="round">
              <circle cx="11" cy="11" r="7"/>
              <line x1="21" y1="21" x2="15.65" y2="15.65"/>
              <line x1="11" y1="8"  x2="11" y2="14"/>
              <line x1="8"  y1="11" x2="14" y2="11"/>
            </svg>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MediaPreview({ media = [] }) {
  const [viewerIndex, setViewerIndex] = useState(-1)

  if (!media || media.length === 0) return null

  const renderGrid = () => {
    // Single Item Focus
    if (media.length === 1) {
      return (
        <motion.div 
          style={S.singleWrap}
          onClick={() => setViewerIndex(0)}
          whileHover={{ scale: 1.02, zIndex: 2, boxShadow: '0 8px 30px rgba(0,0,0,0.6)' }}
          whileTap={{ scale: 0.97 }}
        >
          <PreviewThumbnail item={media[0]} />
        </motion.div>
      )
    }

    // Grid Layout (2 items specifically handles columns perfectly)
    return (
      <div style={S.gridWrap}>
        {media.slice(0, 2).map((item, index) => {
          const isLastVisible = index === 1
          const overflowCount = media.length - 2

          return (
            <motion.div
              key={index}
              style={S.gridItem}
              onClick={() => setViewerIndex(index)}
              whileHover={{ scale: 1.034, zIndex: 3 }}
              whileTap={{ scale: 0.97 }}
            >
              <PreviewThumbnail item={item} />
              
              {/* +X Overlay if more items exist */}
              {isLastVisible && overflowCount > 0 && (
                <div style={S.moreOverlay}>
                  <span style={S.moreText}>+{overflowCount}</span>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    )
  }

  return (
    <div style={S.container}>
      {renderGrid()}

      {/* KEEP POPUP VIEWER */}
      <AnimatePresence>
        {viewerIndex !== -1 && (
          <FullscreenViewer 
            mediaItems={media} 
            initialIndex={viewerIndex} 
            onClose={() => setViewerIndex(-1)} 
          />
        )}
      </AnimatePresence>
    </div>
  )
}

const S = {
  container: {
    marginTop: '0.85rem', width: '100%', display: 'block'
  },
  /* Unified Style matching MemCard */
  singleWrap: {
    cursor: 'pointer', borderRadius: '14px', overflow: 'hidden',
    background: 'rgba(8,18,50,0.55)',
    border: '1px solid rgba(90,150,240,0.1)',
    boxShadow: '0 6px 24px rgba(0,0,0,0.38)',
    height: '220px', width: '100%', maxWidth: '380px', margin: '0 auto',
    position: 'relative', display: 'block'
  },
  gridWrap: {
    display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '8px',
    width: '100%'
  },
  gridItem: {
    cursor: 'pointer', borderRadius: '14px', overflow: 'hidden',
    background: 'rgba(8,18,50,0.55)',
    border: '1px solid rgba(90,150,240,0.1)',
    boxShadow: '0 6px 24px rgba(0,0,0,0.38)',
    width: '100%', aspectRatio: '1', position: 'relative'
  },
  mediaNative: {
    width: '100%', height: '100%', objectFit: 'cover', display: 'block',
    background: '#040a1c'
  },
  /* Overlays */
  videoPlayBtn: {
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(4,10,28,0.35)',
    pointerEvents: 'none'
  },
  playIconRing: {
    width: 42, height: 42, borderRadius: '50%',
    background: 'rgba(10,30,90,0.78)',
    border: '1.5px solid rgba(90,150,240,0.4)',
    boxShadow: '0 0 18px rgba(58,123,213,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    paddingLeft: 3
  },
  hoverOverlay: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(to bottom, rgba(8,18,60,0.0) 35%, rgba(4,10,30,0.6) 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    opacity: 0, transition: 'opacity 0.3s',
    backdropFilter: 'blur(1px)', pointerEvents: 'none'
  },
  zoomIcon: {
    width: 44, height: 44, borderRadius: '50%',
    background: 'rgba(8,18,60,0.72)',
    border: '1px solid rgba(90,150,240,0.32)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    paddingLeft: 1
  },
  moreOverlay: {
    position: 'absolute', inset: 0, background: 'rgba(2, 6, 15, 0.75)',
    backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    pointerEvents: 'none', zIndex: 10
  },
  moreText: {
    color: '#fff', fontSize: '2rem', fontWeight: 'bold', fontFamily: 'system-ui, sans-serif'
  },
  linkPreview: {
    width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', background: 'rgba(26, 74, 138, 0.15)'
  },
  audioPreview: {
    width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', background: 'rgba(180, 100, 150, 0.15)'
  },
  icon: { fontSize: '2.5rem', marginBottom: '0.6rem' },
  linkText: { color: 'var(--blue-200)', fontSize: '0.9rem', fontWeight: 'bold', fontFamily:`'Scheherazade New', 'Arial', serif` }
}
