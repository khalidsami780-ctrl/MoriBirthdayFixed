import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import bgTrack from '../music/your-song.mp3'

export default function MusicButton() {
  const audioRef = useRef(null)
  const fadeRef  = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [ready,   setReady]   = useState(false)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1400)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const a = audioRef.current; if (!a) return
    a.volume = 0; a.loop = true
  }, [])

  const fadeVolume = useCallback((target, duration = 800) => {
    const a = audioRef.current; if (!a) return
    if (fadeRef.current) clearInterval(fadeRef.current)
    const start = a.volume
    const diff  = target - start
    const steps = Math.ceil(duration / 30)
    let   step  = 0
    fadeRef.current = setInterval(() => {
      step++
      a.volume = Math.max(0, Math.min(1, start + diff * (step / steps)))
      if (step >= steps) {
        clearInterval(fadeRef.current)
        if (target === 0) a.pause()
      }
    }, 30)
  }, [])

  const toggle = useCallback(async () => {
    const a = audioRef.current; if (!a) return
    if (playing) {
      fadeVolume(0, 700)
      setPlaying(false)
    } else {
      a.volume = 0
      try {
        await a.play()
        setPlaying(true)
        fadeVolume(0.4, 900)
      } catch (_) {}
    }
  }, [playing, fadeVolume])

  return (
    <>
      <audio ref={audioRef} src={bgTrack} preload="auto" playsInline />
      <AnimatePresence>
        {ready && (
          <motion.div
            style={S.wrapper}
            initial={{ opacity: 0, scale: 0.6, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            {/* Tooltip */}
            <AnimatePresence>
              {hovered && (
                <motion.div
                  style={S.tooltip}
                  initial={{ opacity: 0, x: 8, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 8, scale: 0.95 }}
                  transition={{ duration: 0.18 }}
                >
                  {playing ? 'Pause' : 'Play music'}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pulsing ring while playing */}
            <AnimatePresence>
              {playing && (
                <motion.div
                  key="ring"
                  style={S.ring}
                  initial={{ scale: 0.8, opacity: 0.6 }}
                  animate={{ scale: [0.95, 1.45, 0.95], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
            </AnimatePresence>

            {/* Main button */}
            <motion.button
              style={{
                ...S.btn,
                background: playing
                  ? 'linear-gradient(145deg, rgba(42,95,210,0.38), rgba(22,60,140,0.48))'
                  : 'rgba(6, 14, 42, 0.78)',
                borderColor: playing ? 'rgba(80,145,240,0.52)' : 'rgba(90,150,240,0.18)',
                boxShadow: playing
                  ? '0 0 0 1px rgba(80,145,240,0.12), 0 4px 24px rgba(58,123,213,0.35), inset 0 1px 0 rgba(255,255,255,0.08)'
                  : '0 4px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
              onClick={toggle}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.91 }}
              aria-label={playing ? 'Pause background music' : 'Play background music'}
            >
              {/* Icon */}
              <AnimatePresence mode="wait">
                <motion.span
                  key={playing ? 'pause' : 'music'}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}
                  initial={{ opacity: 0, scale: 0.5, rotate: -12 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5, rotate: 12 }}
                  transition={{ duration: 0.22 }}
                >
                  {playing ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(168,200,248,0.92)">
                      <rect x="6" y="4" width="4" height="16" rx="1.5"/>
                      <rect x="14" y="4" width="4" height="16" rx="1.5"/>
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <path d="M9 18V5l12-2v13" stroke="rgba(168,200,248,0.75)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="6" cy="18" r="3" fill="rgba(168,200,248,0.75)"/>
                      <circle cx="18" cy="16" r="3" fill="rgba(168,200,248,0.75)"/>
                    </svg>
                  )}
                </motion.span>
              </AnimatePresence>

              {/* Equalizer when playing */}
              {playing && (
                <div style={S.eq}>
                  {[0,1,2].map(i => (
                    <motion.div
                      key={i}
                      style={S.eqBar}
                      animate={{ scaleY: [0.25, 1, 0.45, 0.85, 0.25] }}
                      transition={{ duration: 0.95, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
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
    bottom: 'clamp(1.1rem, 3.5vw, 1.75rem)',
    left:   'clamp(1.1rem, 3.5vw, 1.75rem)',
    zIndex: 200, display: 'flex', alignItems: 'center', gap: '0.55rem',
  },
  btn: {
    width: 46, height: 46, borderRadius: '50%',
    border: '1px solid',
    backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
    cursor: 'pointer', outline: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
    transition: 'border-color 0.4s, background 0.4s, box-shadow 0.4s',
    WebkitTapHighlightColor: 'transparent',
    position: 'relative', flexShrink: 0,
  },
  ring: {
    position: 'absolute', inset: -3,
    borderRadius: '50%',
    border: '1.5px solid rgba(80,140,240,0.4)',
    pointerEvents: 'none',
  },
  tooltip: {
    fontFamily: `'Cormorant Garamond', Georgia, serif`,
    fontStyle: 'italic',
    fontSize: '0.72rem', letterSpacing: '0.04em',
    color: 'rgba(168,200,248,0.75)',
    background: 'rgba(4,10,32,0.82)',
    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(90,150,240,0.16)',
    padding: '5px 11px', borderRadius: 8,
    pointerEvents: 'none', whiteSpace: 'nowrap',
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
  },
  eq:    { display: 'flex', alignItems: 'flex-end', gap: 2, height: 11, marginLeft: 2 },
  eqBar: { width: 2.5, height: '100%', background: 'rgba(168,200,248,0.72)', borderRadius: 2, transformOrigin: 'bottom' },
}
