import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import bgTrack from '../music/your-song.mp3'

/*
  Floating music control button — fixed position, always visible.
  Handles its own audio element so it's completely self-contained.
  Music is NEVER started automatically — only on user tap.
*/
export default function MusicButton() {
  const audioRef  = useRef(null)
  const [playing, setPlaying]  = useState(false)
  const [ready,   setReady]    = useState(false)   // shown after short delay
  const [tooltip, setTooltip]  = useState(false)

  // Fade in after 1.2s so it doesn't compete with the page entrance
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1200)
    return () => clearTimeout(t)
  }, [])

  // Setup audio
  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    a.volume = 0
    a.loop   = true
    const onEnded = () => setPlaying(false)
    a.addEventListener('ended', onEnded)
    return () => a.removeEventListener('ended', onEnded)
  }, [])

  const toggleMusic = useCallback(async () => {
    const a = audioRef.current
    if (!a) return

    if (playing) {
      // Fade out then pause
      let vol = a.volume
      const fade = setInterval(() => {
        vol = Math.max(0, vol - 0.05)
        a.volume = vol
        if (vol <= 0) { clearInterval(fade); a.pause() }
      }, 40)
      setPlaying(false)
    } else {
      // Play with fade-in
      a.volume = 0
      try {
        await a.play()
        setPlaying(true)
        let vol = 0
        const fade = setInterval(() => {
          vol = Math.min(0.4, vol + 0.02)
          a.volume = vol
          if (vol >= 0.4) clearInterval(fade)
        }, 40)
      } catch (_) {}
    }
  }, [playing])

  return (
    <>
      <audio ref={audioRef} src={bgTrack} preload="auto" playsInline />

      <AnimatePresence>
        {ready && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
            style={S.wrapper}
            onMouseEnter={() => setTooltip(true)}
            onMouseLeave={() => setTooltip(false)}
          >
            {/* Tooltip */}
            <AnimatePresence>
              {tooltip && (
                <motion.span
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  transition={{ duration: 0.2 }}
                  style={S.tooltip}
                >
                  {playing ? 'Pause music' : 'Play music'}
                </motion.span>
              )}
            </AnimatePresence>

            {/* Glow ring while playing */}
            {playing && (
              <motion.div
                style={S.glow}
                animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}

            {/* Button */}
            <motion.button
              style={{
                ...S.btn,
                background: playing
                  ? 'linear-gradient(135deg, rgba(79,163,224,0.28), rgba(30,80,150,0.38))'
                  : 'rgba(8, 20, 50, 0.72)',
                borderColor: playing ? 'rgba(79,163,224,0.55)' : 'rgba(90,150,240,0.22)',
                boxShadow: playing
                  ? '0 4px 24px rgba(79,163,224,0.35), inset 0 1px 0 rgba(255,255,255,0.08)'
                  : '0 4px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
              onClick={toggleMusic}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.93 }}
              aria-label={playing ? 'Pause background music' : 'Play background music'}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={playing ? 'pause' : 'play'}
                  initial={{ opacity: 0, scale: 0.6, rotate: -15 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.6, rotate: 15 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {playing ? (
                    /* Pause icon */
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(168,200,248,0.9)">
                      <rect x="6" y="4" width="4" height="16" rx="1.5"/>
                      <rect x="14" y="4" width="4" height="16" rx="1.5"/>
                    </svg>
                  ) : (
                    /* Music note icon */
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(168,200,248,0.7)">
                      <path d="M9 18V5l12-2v13" strokeWidth="0"/>
                      <path d="M9 18V5l12-2v13" fill="none" stroke="rgba(168,200,248,0.7)" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="6" cy="18" r="3" fill="rgba(168,200,248,0.7)"/>
                      <circle cx="18" cy="16" r="3" fill="rgba(168,200,248,0.7)"/>
                    </svg>
                  )}
                </motion.span>
              </AnimatePresence>

              {/* Equalizer bars when playing */}
              {playing && (
                <div style={S.eqBars}>
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      style={{ ...S.eqBar }}
                      animate={{ scaleY: [0.3, 1, 0.5, 0.8, 0.3] }}
                      transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
                    />
                  ))}
                </div>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

const S = {
  wrapper: {
    position: 'fixed',
    bottom: 'clamp(1.25rem, 4vw, 2rem)',
    left:   'clamp(1.25rem, 4vw, 2rem)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  },
  btn: {
    width: 46, height: 46,
    borderRadius: '50%',
    border: '1px solid',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    cursor: 'pointer',
    outline: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 4,
    transition: 'border-color 0.4s, background 0.4s, box-shadow 0.4s',
    WebkitTapHighlightColor: 'transparent',
    position: 'relative',
    flexShrink: 0,
  },
  glow: {
    position: 'absolute',
    width: 46, height: 46,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(79,163,224,0.5) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  tooltip: {
    fontFamily: `'Georgia', serif`,
    fontStyle: 'italic',
    fontSize: '0.72rem',
    color: 'rgba(168,200,248,0.7)',
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap',
    background: 'rgba(8,20,50,0.75)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(90,150,240,0.18)',
    padding: '5px 10px',
    borderRadius: 8,
    pointerEvents: 'none',
  },
  eqBars: {
    display: 'flex', alignItems: 'flex-end',
    gap: 2, height: 12, marginLeft: 2,
  },
  eqBar: {
    width: 2.5, height: '100%',
    background: 'rgba(168,200,248,0.7)',
    borderRadius: 2, transformOrigin: 'bottom',
  },
}
