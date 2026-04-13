import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import Stars from '../components/Stars.jsx'

// ── Cloudinary photo + video imports ───────────────────────────────────
const photo1 = 'https://res.cloudinary.com/djdktudjh/image/upload/v1774617703/photo1_if8iym.jpg'
const photo2 = 'https://res.cloudinary.com/djdktudjh/image/upload/v1774617703/photo2_qugg6j.jpg'
const photo3 = 'https://res.cloudinary.com/djdktudjh/image/upload/v1774617336/photo3_pixcje.jpg'
const photo4 = 'https://res.cloudinary.com/djdktudjh/image/upload/v1774617337/photo4_fl9v8o.jpg'
const photo6 = 'https://res.cloudinary.com/djdktudjh/image/upload/v1774617702/photo6_dd3k8p.jpg'
const Vid = 'https://res.cloudinary.com/djdktudjh/video/upload/v1774617353/Vid_yotk1v.mp4'
const MyPhoneWallpaper = 'https://res.cloudinary.com/djdktudjh/image/upload/v1774617703/MyPhoneWallpaper_iqju9j.jpg'

const MEMORIES = [
  { id: 1, type: 'image', src: photo1, caption: 'You felt like home' },
  { id: 2, type: 'image', src: photo2, caption: 'Every word I wrote had your name hidden between the lines.' },
  { id: 3, type: 'image', src: photo3, caption: 'Some pages don’t need to be perfect… just real, like us.' },
  { id: 4, type: 'image', src: photo4, caption: 'Even the trees listened… when I wrote about you_Always in my heart. 💙' },
  { id: 5, type: 'image', src: photo6, caption: 'This is how my heart looks… whenever you’re near' },
  { id: 6, type: 'video', src: Vid,    caption: 'If I could relive one feeling forever… it would be loving you_I Love U, Mori 💙' },
  { id: 7, type: 'image', src: MyPhoneWallpaper, caption: 'انتي موجودة فى كل لحظة في يومي'},
]

/* ═══════════════════════════════════════════════════════════════
   LIGHTBOX
══════════════════════════════════════════════════════════════════ */
function Lightbox({ item, idx, total, onClose, onPrev, onNext }) {
  const videoRef = useRef(null)

  // Keyboard nav + body scroll lock
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape')     onClose()
      if (e.key === 'ArrowLeft')  onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', h)
      document.body.style.overflow = ''
    }
  }, [onClose, onPrev, onNext])

  // Pause video when navigating away
  useEffect(() => {
    return () => {
      if (videoRef.current) videoRef.current.pause()
    }
  }, [item.id])

  return createPortal(
    <motion.div
      style={LB.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
      onClick={onClose}
    >
      {/* Prev arrow */}
      <motion.button
        style={{ ...LB.arrow, left: 'clamp(0.5rem, 3vw, 2rem)', opacity: idx > 0 ? 0.85 : 0.2 }}
        onClick={e => { e.stopPropagation(); onPrev() }}
        disabled={idx === 0}
        whileHover={{ scale: 1.08, x: -2 }}
        whileTap={{ scale: 0.92 }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="15,18 9,12 15,6"/>
        </svg>
      </motion.button>

      {/* Card */}
      <motion.div
        style={LB.card}
        initial={{ opacity: 0, scale: 0.87, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 16 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <motion.button
          style={LB.close}
          onClick={onClose}
          whileHover={{ scale: 1.12, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6"  x2="6"  y2="18"/>
            <line x1="6"  y1="6"  x2="18" y2="18"/>
          </svg>
        </motion.button>

        {/* Media — switches between image and video */}
        <AnimatePresence mode="wait">
          <motion.div
            key={item.id}
            style={LB.mediaWrap}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.26 }}
          >
            {item.type === 'video' ? (
              <video
                ref={videoRef}
                src={item.src}
                style={LB.media}
                controls
                playsInline
                autoPlay
                loop={false}
                preload="metadata"
              />
            ) : (
              <img
                src={item.src}
                alt={item.caption}
                style={LB.media}
                draggable={false}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div style={LB.footer}>
          {/* Video badge */}
          {item.type === 'video' && (
            <span style={LB.videoBadge}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
              Video
            </span>
          )}
          <p style={LB.caption}>{item.caption}</p>
          <p style={LB.counter}>{idx + 1} / {total}</p>
        </div>
      </motion.div>

      {/* Next arrow */}
      <motion.button
        style={{ ...LB.arrow, right: 'clamp(0.5rem, 3vw, 2rem)', opacity: idx < total - 1 ? 0.85 : 0.2 }}
        onClick={e => { e.stopPropagation(); onNext() }}
        disabled={idx === total - 1}
        whileHover={{ scale: 1.08, x: 2 }}
        whileTap={{ scale: 0.92 }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="9,18 15,12 9,6"/>
        </svg>
      </motion.button>
    </motion.div>,
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
    position: 'fixed', top: '50%', transform: 'translateY(-50%)',
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
  /* Wrapper keeps 16:9 for video, 4:3 for images */
  mediaWrap: {
    width: '100%',
    background: '#02060f',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  media: {
    width: '100%',
    maxHeight: '70vh',
    objectFit: 'contain',  /* contain so video controls are never clipped */
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
    fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase',
    color: 'rgba(168,200,248,0.7)', flexShrink: 0,
    fontFamily: `'Cormorant Garamond', Georgia, serif`,
  },
}

/* ═══════════════════════════════════════════════════════════════
   GALLERY CARD  — handles image AND video thumbnails
══════════════════════════════════════════════════════════════════ */
function MemCard({ item, index, onClick }) {
  const ref       = useRef(null)
  const videoRef  = useRef(null)
  const [vis, setVis] = useState(false)

  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVis(true); obs.disconnect() }
    }, { threshold: 0.08 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <motion.div
      ref={ref}
      style={GC.wrap}
      initial={{ opacity: 0, y: 22, scale: 0.97 }}
      animate={vis ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.55, delay: (index % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.034 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onClick(index)}
      className="memory-card-wrap"
    >
      <div style={GC.thumb}>
        {item.type === 'video' ? (
          /* ── Video thumbnail: native video element, no controls, first frame ── */
          <>
            <video
              ref={videoRef}
              src={item.src}
              style={GC.img}
              muted
              playsInline
              preload="metadata"
              className="memory-img"
              /* seek to 0.5s so the poster frame looks nice */
              onLoadedMetadata={e => { e.target.currentTime = 0.5 }}
            />
            {/* Play button overlay — always visible on video cards */}
            <div style={GC.videoOverlay}>
              <div style={GC.playBtn}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <polygon points="6,3 20,12 6,21"/>
                </svg>
              </div>
            </div>
          </>
        ) : (
          /* ── Regular image ── */
          <img
            src={item.src}
            alt={item.caption}
            style={GC.img}
            loading="lazy"
            className="memory-img"
            draggable={false}
          />
        )}

        {/* Hover overlay (works for both) */}
        <div style={GC.hoverOverlay} className="memory-hover-overlay">
          <div style={GC.zoomIcon}>
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

      {item.caption && <p style={GC.caption}>{item.caption}</p>}
    </motion.div>
  )
}

const GC = {
  wrap: {
    cursor: 'pointer', borderRadius: 14, overflow: 'hidden',
    background: 'rgba(8,18,50,0.55)',
    border: '1px solid rgba(90,150,240,0.1)',
    boxShadow: '0 6px 24px rgba(0,0,0,0.38)',
    transition: 'border-color 0.3s, box-shadow 0.3s',
  },
  thumb: { width: '100%', aspectRatio: '1', overflow: 'hidden', position: 'relative' },
  img: {
    width: '100%', height: '100%', objectFit: 'cover',
    display: 'block', transition: 'transform 0.55s cubic-bezier(0.22,1,0.36,1)',
  },
  /* Permanent play-button badge on video cards */
  videoOverlay: {
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(4,10,28,0.38)',
    pointerEvents: 'none',
  },
  playBtn: {
    width: 42, height: 42, borderRadius: '50%',
    background: 'rgba(10,30,90,0.78)',
    border: '1.5px solid rgba(90,150,240,0.4)',
    boxShadow: '0 0 18px rgba(58,123,213,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    paddingLeft: 2,
  },
  /* Hover overlay */
  hoverOverlay: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(to bottom, rgba(8,18,60,0.0) 35%, rgba(4,10,30,0.6) 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    opacity: 0, transition: 'opacity 0.3s',
    backdropFilter: 'blur(1px)',
  },
  zoomIcon: {
    width: 44, height: 44, borderRadius: '50%',
    background: 'rgba(8,18,60,0.72)',
    border: '1px solid rgba(90,150,240,0.32)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    paddingLeft: 1,
  },
  caption: {
    padding: '0.52rem 0.7rem',
    fontFamily: `'Cormorant Garamond', Georgia, serif`,
    fontStyle: 'italic',
    fontSize: 'clamp(0.68rem,1.8vw,0.78rem)',
    color: 'rgba(168,200,248,0.5)',
    letterSpacing: '0.03em', textAlign: 'center',
  },
}

/* ═══════════════════════════════════════════════════════════════
   PAGE SECTION
══════════════════════════════════════════════════════════════════ */
export default function EidMemories({ sectionRef }) {
  const [selected, setSelected] = useState(null)
  const open  = useCallback(i  => setSelected(i), [])
  const close = useCallback(()  => setSelected(null), [])
  const prev  = useCallback(()  => setSelected(i => Math.max(0, i - 1)), [])
  const next  = useCallback(()  => setSelected(i => Math.min(MEMORIES.length - 1, i + 1)), [])

  return (
    <section ref={sectionRef} id="eid-memories"
      className="section eid-section eid-memories-section">
      <Stars count={38} />
      <div className="orb orb-blue"
        style={{ width:340, height:340, top:'-5%', right:'-8%', opacity:0.08 }}
        aria-hidden="true" />
      <div className="orb orb-gold"
        style={{ width:240, height:240, bottom:'8%', left:'-5%', opacity:0.05 }}
        aria-hidden="true" />

      <motion.div
        initial={{ opacity:0, y:24 }}
        whileInView={{ opacity:1, y:0 }}
        viewport={{ once:true, amount:0.12 }}
        transition={{ duration:0.82, ease:[0.22,1,0.36,1] }}
        style={{ position: 'relative', width: '100%', maxWidth: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.75rem' }}
      >
        {/* Header */}
        <div style={{ textAlign:'center', width:'100%' }}>
          <p style={{
            fontFamily:'var(--font-arabic)', direction:'rtl',
            fontSize:'clamp(0.82rem,2.5vw,0.96rem)',
            color:'var(--blue-200)', opacity:0.58, marginBottom:'0.4rem',
          }}>
            ذكرياتنا
          </p>
          <h2 className="t-display" style={{
            fontSize:'clamp(2rem,7.5vw,3.2rem)',
            background:'linear-gradient(140deg, var(--cream) 0%, var(--blue-200) 55%, var(--gold-light) 100%)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
          }}>
            Our Memories
          </h2>
          <div className="divider-blue" />
          <p className="t-italic" style={{
            fontSize:'clamp(0.8rem,2.2vw,0.92rem)', color:'var(--cream-dim)', opacity:0.48,
          }}>
            Moments that live quietly in my heart
          </p>
        </div>

        {/* Grid */}
        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(3, 1fr)',
          gap:'0.55rem',
          width:'100%',
        }}>
          {MEMORIES.map((item, i) => (
            <MemCard key={item.id} item={item} index={i} onClick={open} />
          ))}
        </div>

        <p style={{
          fontFamily:'var(--font-body)', fontStyle:'italic',
          fontSize:'clamp(0.72rem,1.9vw,0.82rem)',
          color:'var(--blue-200)', opacity:0.28, textAlign:'center', letterSpacing:'0.06em',
        }}>
          Tap any photo or video to open
        </p>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {selected !== null && (
          <Lightbox
            key="lb"
            item={MEMORIES[selected]}
            idx={selected}
            total={MEMORIES.length}
            onClose={close}
            onPrev={prev}
            onNext={next}
          />
        )}
      </AnimatePresence>
    </section>
  )
}
