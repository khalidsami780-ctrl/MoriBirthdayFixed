import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Stars from '../components/Stars.jsx'


// ── Eid songs ─────────────────
const sElid_Elid = 'https://res.cloudinary.com/djdktudjh/video/upload/v1774620421/%D8%A7%D9%84%D8%B9%D9%8A%D8%AF_%D8%A7%D9%84%D8%B9%D9%8A%D8%AF_gxeohq.mp3'
const sElOyoun = 'https://res.cloudinary.com/djdktudjh/video/upload/v1774620432/el-oyoun-di_szfwoa.mp3'
const sKhalik = 'https://res.cloudinary.com/djdktudjh/video/upload/v1774620462/khalik-maaya_ngh3jm.m4a'
const sSiret = 'https://res.cloudinary.com/djdktudjh/video/upload/v1774620470/siret-el-hob_gv2bhs.m4a'
const sOloha = 'https://res.cloudinary.com/djdktudjh/video/upload/v1774620461/oloha-anni_cpfjqk.m4a'
const sfe_2alpy_fatat = 'https://res.cloudinary.com/djdktudjh/video/upload/v1774620447/%D8%B9%D8%A8%D8%AF%D8%A7%D9%84%D8%B1%D8%AD%D9%85%D9%86_%D9%85%D8%AD%D9%85%D8%AF_%D8%A8%D9%90%D8%B1%D9%88%D8%AD%D9%8A_%D9%81%D9%8E%D8%AA%D8%A7%D8%A9%D9%8C_%D9%85%D8%B9_%D8%A7%D9%84%D9%83%D9%84%D9%85%D8%A7%D8%AA_%D8%A8%D8%AF%D9%88%D9%86_%D9%85%D9%88%D8%B3%D9%8A%D9%82%D9%89_M4A_128K_h6lmnj.m4a'
const sBename3ad = 'https://res.cloudinary.com/djdktudjh/video/upload/v1774620454/%D9%88_%D8%A8%D9%8A%D9%86%D8%A7_%D9%85%D9%8A%D8%B9%D8%A7%D8%AF_%D8%B9%D9%85%D8%B1%D9%88_%D8%AF%D9%8A%D8%A7%D8%A8_%D8%A8%D8%AF%D9%88%D9%86_%D9%85%D9%88%D8%B3%D9%8A%D9%82%D9%89M4A_128K_emwkpg.m4a'
const sWalaqad_zakartoka_wel_rema7_nawahil_menny = 'https://res.cloudinary.com/djdktudjh/video/upload/v1774620427/%D9%88%D9%84%D9%82%D8%AF_%D8%B0%D9%83%D8%B1%D8%AA%D9%83_%D9%88%D8%A7%D9%84%D8%B1%D9%85%D8%A7%D8%AD_%D9%86%D9%88%D8%A7%D9%87%D9%84_%D9%85%D9%86%D9%8A_e2c9rq.mp3'
const sLa_7ad_ba3dak_yemla_3youny = 'https://res.cloudinary.com/djdktudjh/video/upload/v1774620421/%D9%84%D8%A7_%D8%AD%D8%AF_%D8%A8%D8%B9%D8%AF%D9%83_%D9%8A%D9%85%D9%84%D8%A6_%D8%B9%D9%8A%D9%88%D9%86%D9%8A_up7tq9.mp3'


const EID_PLAYLIST = [
  { id:1, title:'Elid_Elid',         artist:'عبدالحليم حافظ',             arabic:'العيد العيد',                    mood:'فرحة',   src:sElid_Elid,  color:'#5b9cf6' },
  { id:2, title:'El Oyoun Di',         artist:'عبدالحليم حافظ',             arabic:'العيون دي',                    mood:'حنين',   src:sElOyoun,  color:'#5b9cf6' },
  { id:3, title:'Khalik Maaya',        artist:'Amr Diab',      arabic:'خليك معايا',                   mood:'عشق',    src:sKhalik,   color:'#7ec8f0' },
  { id:4, title:"Siret El Hob",        artist:'Om Kalthoum',   arabic:'سيرة الحب',                    mood:'طرب',    src:sSiret,    color:'#a8c8f8' },
  { id:5, title:'Oloha Anni',          artist:'Mohamed Abdel Rahman', arabic:'قولوا لها أنني',         mood:'وجدان',  src:sOloha,    color:'#6aaee8' },
  { id:6, title:'fe Ro7y fatat 💙',          artist:'Mohamed Abdel Rahman', arabic:'فى روحي فتاة',         mood:'وجدان',  src:sfe_2alpy_fatat,    color:'#5761e8' },
  { id:7, title:'Bena me3ad',          artist:'Amr Diab', arabic:'وبينا ميعاد',         mood:'تفائل',  src:sBename3ad,    color:'#5c89e2' },
  { id:8, title:'Walaqad_zakartoka_wel_rema7_nawahil_menny',          artist:'الشيخ أحمد العربي (شعر عنترة بن شداد)', arabic:'ولقد ذكرتك والرماح نواهل مني',         mood:'عشق',  src:sWalaqad_zakartoka_wel_rema7_nawahil_menny,    color:'#5b89c2' },
  { id:9, title:'La_7ad_ba3dak_yemla_3youny',          artist:'ميادة الحناوي', arabic:'لا حد بعدك يملئ عيوني',         mood:'Loyal',  src:sLa_7ad_ba3dak_yemla_3youny,    color:'#0b4080' },
  
]

/* ─── Helpers ────────────────────────────────────────────────── */
function fmt(s) {
  if (!s || isNaN(s)) return '0:00'
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}
function hexRgb(h) {
  return `${parseInt(h.slice(1,3),16)},${parseInt(h.slice(3,5),16)},${parseInt(h.slice(5,7),16)}`
}

/* ─── Vinyl disc ─────────────────────────────────────────────── */
function Vinyl({ playing, color, onClick }) {
  return (
    <div style={VS.wrap} onClick={onClick}>
      <motion.div
        style={VS.glow}
        animate={{
          boxShadow: playing
            ? [`0 0 24px ${color}55,0 0 55px ${color}22`, `0 0 40px ${color}88,0 0 75px ${color}33`, `0 0 24px ${color}55,0 0 55px ${color}22`]
            : `0 0 10px ${color}18`,
        }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        style={VS.disc}
        animate={{ rotate: playing ? 360 : 0 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatType: 'loop' }}
      >
        {[70, 54, 38].map((sz, i) => (
          <div key={i} style={{
            position: 'absolute', width: `${sz}%`, height: `${sz}%`,
            borderRadius: '50%', border: `1px solid rgba(255,255,255,${0.04 + i * 0.025})`,
            top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          }} />
        ))}
        <div style={{ ...VS.label, background: `radial-gradient(circle,${color}44,rgba(4,13,26,0.92))` }}>
          <div style={VS.dot} />
        </div>
      </motion.div>
      <AnimatePresence mode="wait">
        <motion.div
          key={playing ? 'p' : 'pl'} style={VS.icon}
          initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.18 }}
        >
          {playing
            ? <svg width="19" height="19" viewBox="0 0 24 24" fill="rgba(255,255,255,0.82)"><rect x="6" y="4" width="4" height="16" rx="1.5"/><rect x="14" y="4" width="4" height="16" rx="1.5"/></svg>
            : <svg width="19" height="19" viewBox="0 0 24 24" fill="rgba(255,255,255,0.82)"><polygon points="6,3 20,12 6,21"/></svg>}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
const VS = {
  wrap:  { position: 'relative', width: 112, height: 112, flexShrink: 0, cursor: 'pointer', userSelect: 'none' },
  glow:  { position: 'absolute', inset: -6, borderRadius: '50%', pointerEvents: 'none' },
  disc:  { position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%,#1a2a4a,#040d1e)', border: '1px solid rgba(90,150,240,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.7)' },
  label: { position: 'absolute', width: '34%', height: '34%', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.07)' },
  dot:   { width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.25)' },
  icon:  { position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
}

/* ─── Progress bar ───────────────────────────────────────────── */
function Progress({ cur, dur, onSeek, color }) {
  const ref = useRef(null)
  const pct = dur ? Math.min(100, (cur / dur) * 100) : 0
  const seek = (cx) => {
    if (!ref.current || !dur) return
    const r = ref.current.getBoundingClientRect()
    onSeek(Math.max(0, Math.min(1, (cx - r.left) / r.width)) * dur)
  }
  return (
    <div ref={ref} style={PS.track} onClick={e => seek(e.clientX)} onTouchStart={e => seek(e.touches[0].clientX)}>
      <div style={{ ...PS.fill, width: `${pct}%`, background: `linear-gradient(90deg,${color}88,${color}cc)` }} />
      <div style={{ ...PS.thumb, left: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}88` }} />
    </div>
  )
}
const PS = {
  track: { flex: 1, height: 4, borderRadius: 4, background: 'rgba(90,150,240,0.12)', cursor: 'pointer', position: 'relative', overflow: 'visible', WebkitTapHighlightColor: 'transparent' },
  fill:  { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 4, pointerEvents: 'none', transition: 'width 0.1s linear' },
  thumb: { position: 'absolute', top: '50%', transform: 'translate(-50%,-50%)', width: 11, height: 11, borderRadius: '50%', pointerEvents: 'none', transition: 'left 0.1s linear' },
}

/* ─── Song row ───────────────────────────────────────────────── */
function Row({ song, index, active, playing, hasAudio, onSelect }) {
  return (
    <motion.button
      style={{
        ...RS.card,
        background: active
          ? `linear-gradient(135deg,rgba(${hexRgb(song.color)},0.15),rgba(${hexRgb(song.color)},0.05))`
          : 'rgba(10,22,52,0.42)',
        borderColor: active ? `${song.color}55` : 'rgba(90,150,240,0.1)',
        opacity: !hasAudio ? 0.55 : 1,
      }}
      onClick={() => hasAudio && onSelect(song)}
      whileHover={hasAudio ? { scale: 1.015 } : {}}
      whileTap={hasAudio ? { scale: 0.985 } : {}}
    >
      {/* Number / bars */}
      <div style={RS.num}>
        {active && playing ? (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 13 }}>
            {[0,1,2].map(i => (
              <motion.div key={i}
                style={{ width: 2.5, height: '100%', background: song.color, borderRadius: 2, transformOrigin: 'bottom' }}
                animate={{ scaleY: [0.3, 1, 0.4, 0.8, 0.3] }}
                transition={{ duration: 0.85, repeat: Infinity, delay: i * 0.16, ease: 'easeInOut' }}
              />
            ))}
          </div>
        ) : (
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', color: active ? song.color : 'rgba(168,200,248,0.28)', letterSpacing: '0.04em' }}>
            {String(index + 1).padStart(2, '0')}
          </span>
        )}
      </div>

      {/* Info */}
      <div style={RS.info}>
        <span style={{ fontFamily: 'var(--font-arabic)', direction: 'rtl', textAlign: 'left', fontSize: '0.73rem', lineHeight: 1.25, color: active ? song.color : 'rgba(168,200,248,0.45)' }}>
          {song.arabic}
        </span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(0.8rem,2.2vw,0.94rem)', letterSpacing: '0.02em', lineHeight: 1.3, color: active ? 'var(--cream)' : 'var(--cream-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {song.title}
        </span>
        {song.artist !== '—' && (
          <span style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: '0.7rem', color: 'var(--cream-dim)', opacity: 0.4 }}>
            {song.artist}
          </span>
        )}
      </div>

      {/* Mood / placeholder badge */}
      {!hasAudio ? (
        <span style={{ ...RS.pill, borderColor: 'rgba(90,150,240,0.2)', color: 'rgba(168,200,248,0.3)', fontSize: '0.6rem', letterSpacing: '0.08em' }}>
          coming soon
        </span>
      ) : (
        <span style={{ ...RS.pill, borderColor: `${song.color}44`, color: active ? song.color : 'rgba(168,200,248,0.3)' }}>
          {song.mood}
        </span>
      )}
    </motion.button>
  )
}
const RS = {
  card: { display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.7rem 0.9rem', borderRadius: 13, border: '1px solid', width: '100%', textAlign: 'left', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', cursor: 'pointer', outline: 'none', transition: 'background 0.3s,border-color 0.3s', WebkitTapHighlightColor: 'transparent' },
  num:  { width: 28, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 },
  pill: { padding: '2px 9px', borderRadius: 50, border: '1px solid', fontSize: '0.63rem', fontFamily: 'var(--font-arabic)', direction: 'rtl', whiteSpace: 'nowrap', flexShrink: 0 },
}

/* ═══════════════════════════════════════════════════════════════
   Main Component
══════════════════════════════════════════════════════════════════ */
export default function EidMusicSection({ sectionRef }) {
  const audioRef = useRef(null)
  const volRef   = useRef(null)
  const [idx,     setIdx]     = useState(0)
  const [playing, setPlaying] = useState(false)
  const [cur,     setCur]     = useState(0)
  const [dur,     setDur]     = useState(0)
  const [vol,     setVol]     = useState(0.8)
  const [muted,   setMuted]   = useState(false)

  const song    = EID_PLAYLIST[idx]
  const hasAudio = true

  useEffect(() => {
    const a = audioRef.current; if (!a) return
    const onTime  = () => setCur(a.currentTime)
    const onMeta  = () => setDur(a.duration)
    const onEnded = () => { if (idx < EID_PLAYLIST.length - 1) setIdx(i => i + 1); else { setPlaying(false); setCur(0) } }
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('loadedmetadata', onMeta)
    a.addEventListener('ended', onEnded)
    return () => { a.removeEventListener('timeupdate', onTime); a.removeEventListener('loadedmetadata', onMeta); a.removeEventListener('ended', onEnded) }
  }, [idx])

  useEffect(() => {
    const a = audioRef.current; if (!a || !song.src) return
    a.src = song.src; a.load(); setCur(0); setDur(0)
    if (playing) a.play().catch(() => {})
  }, [idx]) // eslint-disable-line

  useEffect(() => { if (audioRef.current) audioRef.current.volume = muted ? 0 : vol }, [vol, muted])

  const toggle = useCallback(async () => {
    if (!hasAudio) return
    const a = audioRef.current; if (!a) return
    if (playing) { a.pause(); setPlaying(false) }
    else { await a.play().catch(() => {}); setPlaying(true) }
  }, [playing, hasAudio])

  const seek     = useCallback((t) => { if (audioRef.current) audioRef.current.currentTime = t; setCur(t) }, [])
  const prev     = useCallback(() => { if (cur > 3) seek(0); else setIdx(i => Math.max(0, i - 1)) }, [cur, seek])
  const next     = useCallback(() => setIdx(i => Math.min(EID_PLAYLIST.length - 1, i + 1)), [])
  const handleVol = useCallback((e) => {
    if (!volRef.current) return
    const r = volRef.current.getBoundingClientRect()
    setVol(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)))
    setMuted(false)
  }, [])

  const selectSong = useCallback((s) => {
    const i = EID_PLAYLIST.findIndex(p => p.id === s.id)
    if (i === idx) toggle(); else { setIdx(i); setPlaying(true) }
  }, [idx, toggle])

  return (
    <section ref={sectionRef} id="eid-music" className="section eid-section eid-music-section">
      <audio ref={audioRef} src={song.src} preload="metadata" playsInline />
      <Stars count={45} />
      <div className="orb orb-blue" style={{ width: 380, height: 380, top: '-8%', right: '-8%', opacity: 0.09 }} aria-hidden="true" />
      <div className="orb orb-blue" style={{ width: 240, height: 240, bottom: '5%', left: '-5%', opacity: 0.07 }} aria-hidden="true" />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.85, ease: [0.4, 0, 0.2, 1] }}
        style={S.inner}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', width: '100%' }}>
          <p style={{ fontFamily: 'var(--font-arabic)', direction: 'rtl', fontSize: 'clamp(0.82rem,2.5vw,0.96rem)', color: 'var(--blue-pale)', opacity: 0.6, marginBottom: '0.5rem' }}>
            موسيقى العيد
          </p>
          <h2 className="t-display" style={{ fontSize: 'clamp(1.9rem,7vw,3rem)', background: 'linear-gradient(135deg,var(--cream) 0%,var(--blue-pale) 60%,rgba(168,200,248,0.8) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Eid Music
          </h2>
          <div className="divider" />
          <p className="t-italic" style={{ fontSize: 'clamp(0.78rem,2.2vw,0.9rem)', color: 'var(--cream-dim)', opacity: 0.5, marginTop: '0.25rem', letterSpacing: '0.04em' }}>
            Songs for a gentle Eid
          </p>
        </div>

        {/* Player card */}
        <div className="glass-card" style={S.player}>
                    {/* Vinyl + Song info row */}
          <div style={S.topRow}>
            <Vinyl playing={playing && hasAudio} color={song.color} onClick={toggle} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <AnimatePresence mode="wait">
                <motion.div key={song.id}
                  initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }}
                  transition={{ duration: 0.28 }}
                >
                  <p style={{ fontFamily: 'var(--font-arabic)', direction: 'rtl', fontSize: '0.78rem', lineHeight: 1.3, color: song.color, marginBottom: 3 }}>{song.arabic}</p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(0.95rem,3.2vw,1.2rem)', color: 'var(--cream)', letterSpacing: '0.02em', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</p>
                  {song.artist !== '—' && (
                    <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: '0.76rem', color: 'var(--cream-dim)', opacity: 0.45, marginTop: 2 }}>{song.artist}</p>
                  )}
                  <span style={{ display: 'inline-block', marginTop: 7, padding: '2px 11px', borderRadius: 50, border: `1px solid ${song.color}44`, fontSize: '0.66rem', fontFamily: 'var(--font-arabic)', direction: 'rtl', color: song.color }}>
                    {song.mood}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <span style={S.time}>{fmt(cur)}</span>
            <Progress cur={cur} dur={dur} onSeek={seek} color={song.color} />
            <span style={S.time}>{fmt(dur)}</span>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.1rem' }}>
            <motion.button style={{ ...S.ctrl, opacity: idx === 0 && cur < 1 ? 0.28 : 0.75 }} onClick={prev} whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="19,20 9,12 19,4"/><rect x="5" y="4" width="3" height="16" rx="1"/></svg>
            </motion.button>
            <motion.button
              style={{ ...S.playBtn, background: `radial-gradient(circle at 35% 35%,${song.color}44,${song.color}18)`, borderColor: `${song.color}77`, opacity: !hasAudio ? 0.4 : 1 }}
              onClick={toggle} whileHover={hasAudio ? { scale: 1.08, boxShadow: `0 0 28px ${song.color}55` } : {}} whileTap={hasAudio ? { scale: 0.93 } : {}}
            >
              <AnimatePresence mode="wait">
                <motion.span key={playing ? 'pa' : 'pl'}
                  initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.14 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {playing && hasAudio
                    ? <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1.5"/><rect x="14" y="4" width="4" height="16" rx="1.5"/></svg>
                    : <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor" style={{ paddingLeft: 2 }}><polygon points="6,3 20,12 6,21"/></svg>}
                </motion.span>
              </AnimatePresence>
            </motion.button>
            <motion.button style={{ ...S.ctrl, opacity: idx === EID_PLAYLIST.length - 1 ? 0.28 : 0.75 }} onClick={next} disabled={idx === EID_PLAYLIST.length - 1} whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,4 15,12 5,20"/><rect x="16" y="4" width="3" height="16" rx="1"/></svg>
            </motion.button>
          </div>

          {/* Volume */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button style={S.muteBtn} onClick={() => setMuted(m => !m)}>
              {muted || vol === 0
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/><path d="M15.54,8.46a5,5,0,0,1,0,7.07"/></svg>}
            </button>
            <div ref={volRef} style={PS.track} onClick={handleVol}>
              <div style={{ ...PS.fill, width: `${muted ? 0 : vol * 100}%`, background: 'rgba(90,150,240,0.48)' }} />
            </div>
          </div>
        </div>

        {/* Playlist */}
        <div style={{ width: '100%' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: '0.74rem', color: 'var(--blue-pale)', opacity: 0.38, letterSpacing: '0.07em', textAlign: 'center', marginBottom: '0.65rem' }}>
            ♪ &nbsp;Eid Playlist — {EID_PLAYLIST.length} songs
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {EID_PLAYLIST.map((s, i) => (
              <Row key={s.id} song={s} index={i} active={s.id === song.id} playing={playing && s.id === song.id} hasAudio={!!s.src} onSelect={selectSong} />
            ))}
          </div>
        </div>

        <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 'clamp(0.73rem,2vw,0.83rem)', color: 'var(--blue-pale)', opacity: 0.32, textAlign: 'center', letterSpacing: '0.06em' }}>
          💙 Songs for a calm, beautiful Eid
        </p>
      </motion.div>

      <div className="scroll-hint" aria-hidden="true">
        <span className="scroll-hint__dot"/><span className="scroll-hint__dot"/><span className="scroll-hint__dot"/>
      </div>
    </section>
  )
}

const S = {
  inner:   { position: 'relative', width: '100%', maxWidth: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.75rem' },
  player:  { width: '100%', padding: 'clamp(1.2rem,4vw,1.75rem)', display: 'flex', flexDirection: 'column', gap: '1.1rem' },
  topRow:  { display: 'flex', alignItems: 'center', gap: '1.1rem' },
  time:    { fontFamily: 'monospace', fontSize: '0.66rem', color: 'var(--blue-pale)', opacity: 0.38, minWidth: 27, textAlign: 'center' },
  ctrl:    { width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(90,150,240,0.14)', background: 'rgba(90,150,240,0.06)', color: 'var(--blue-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none', WebkitTapHighlightColor: 'transparent' },
  playBtn: { width: 56, height: 56, borderRadius: '50%', border: '1px solid', color: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none', WebkitTapHighlightColor: 'transparent', transition: 'box-shadow 0.3s' },
  muteBtn: { background: 'none', border: 'none', color: 'var(--blue-pale)', opacity: 0.42, cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', outline: 'none', flexShrink: 0, WebkitTapHighlightColor: 'transparent' },
  placeholderNotice: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: 12, background: 'rgba(90,150,240,0.06)', border: '1px dashed rgba(90,150,240,0.2)', marginBottom: '0.25rem' },
}
