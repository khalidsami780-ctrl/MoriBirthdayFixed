import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Stars from '../components/Stars.jsx'
import { useTelegramBot } from '../hooks/useTelegramBot'

const sYourSong = 'https://res.cloudinary.com/djdktudjh/video/upload/v1774620429/your-song_nwu6ga.mp3'
const sAntaElHob = 'https://res.cloudinary.com/djdktudjh/video/upload/v1774620429/anta-el-hob_pa2zwf.mp3'
const sElliShawatoh = 'https://res.cloudinary.com/djdktudjh/video/upload/v1774620428/elli-shawatoh_uuixf5.mp3'
const sHabibEinia = 'https://res.cloudinary.com/djdktudjh/video/upload/v1774620418/habib-einia_t0x9rm.mp3'
const sAmaAnKan = 'https://res.cloudinary.com/djdktudjh/video/upload/v1774620424/ama-an-kan_a3lim3.mp3'
const sOyouni = 'https://res.cloudinary.com/djdktudjh/video/upload/v1774620429/oyouni-teshtahi_aofvfd.mp3'
const sWintaAlbi = 'https://res.cloudinary.com/djdktudjh/video/upload/v1774620419/winta-albi_nzqvj3.mp3'
const sBoshrak = 'https://res.cloudinary.com/djdktudjh/video/upload/v1774620431/boshrak-elyoum_j55uq1.mp3'
const sEveryTime = 'https://res.cloudinary.com/djdktudjh/video/upload/v1774620440/Every_time_I_come_to_you_hi4pom.mp3'
const sHimAndI = 'https://res.cloudinary.com/djdktudjh/video/upload/v1774620417/Him_and_I_fpfbwf.mp3'
const sAmerMounib = 'https://res.cloudinary.com/djdktudjh/video/upload/v1774620424/Amer_Mounib_m9rgye.mp3'

const PLAYLIST = [
  { id:1,  title:'Your Song',                artist:'Our Melody',  arabic:'أغنيتنا',                mood:'حنين',    src:sYourSong,     color:'#5b9cf6' },
  { id:2,  title:'Anta El Hob',              artist:'—',           arabic:'انت الحب',               mood:'عشق',     src:sAntaElHob,    color:'#7ec8f0' },
  { id:3,  title:'Elli Shawatoh',            artist:'—',           arabic:'اللي شوفته',             mood:'شوق',     src:sElliShawatoh, color:'#4a90d9' },
  { id:4,  title:'Habib Einia',              artist:'—',           arabic:'حبيب عنيا حبيب أحلامي', mood:'حب',      src:sHabibEinia,   color:'#6aaee8' },
  { id:5,  title:'Ama An Kan',               artist:'—',           arabic:'اما ان كان عن حبي انا',  mood:'وجدان',   src:sAmaAnKan,     color:'#5b9cf6' },
  { id:6,  title:'Oyouni Teshtahi',          artist:'—',           arabic:'عيوني تشتهي تشوفك',      mood:'اشتياق',  src:sOyouni,       color:'#7eb8e8' },
  { id:7,  title:'Winta Albi',               artist:'—',           arabic:'وانت قايلي ان غيبت',     mood:'دوام',    src:sWintaAlbi,    color:'#4fa3e0' },
  { id:8,  title:'Boshrak Elyoum',           artist:'—',           arabic:'بشراك اليوم يا عمري',    mood:'فرحة',    src:sBoshrak,      color:'#c9a84c' },
  { id:9,  title:'Every Time I Come to You', artist:'—',           arabic:'كل مرة',                 mood:'romance', src:sEveryTime,    color:'#a8c8f8' },
  { id:10, title:'Him and I',                artist:'—',           arabic:'هو وانا',                mood:'love',    src:sHimAndI,      color:'#7ec8f0' },
  { id:11, title:'Amer Mounib',              artist:'Amer Mounib', arabic:'عامر منيب',              mood:'طرب',     src:sAmerMounib,   color:'#e8c97e' },
]

function fmt(s) {
  if (!s || isNaN(s)) return '0:00'
  return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`
}
function hexRgb(h) {
  return `${parseInt(h.slice(1,3),16)},${parseInt(h.slice(3,5),16)},${parseInt(h.slice(5,7),16)}`
}

/* ── Vinyl ─────────────────────────────────────────────────── */
function Vinyl({ playing, color, onClick }) {
  return (
    <div style={VS.wrap} onClick={onClick}>
      <motion.div style={VS.glow}
        animate={{ boxShadow: playing
          ? [`0 0 22px ${color}55,0 0 50px ${color}22`,`0 0 38px ${color}88,0 0 70px ${color}33`,`0 0 22px ${color}55,0 0 50px ${color}22`]
          : `0 0 10px ${color}18` }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div style={VS.disc}
        animate={{ rotate: playing ? 360 : 0 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatType:'loop' }}
      >
        {[70,54,38].map((sz,i) => (
          <div key={i} style={{ position:'absolute', width:`${sz}%`, height:`${sz}%`, borderRadius:'50%', border:`1px solid rgba(255,255,255,${0.04+i*0.025})`, top:'50%', left:'50%', transform:'translate(-50%,-50%)' }} />
        ))}
        <div style={{ ...VS.label, background:`radial-gradient(circle,${color}44,rgba(4,13,26,0.92))` }}>
          <div style={VS.dot} />
        </div>
      </motion.div>
      <AnimatePresence mode="wait">
        <motion.div key={playing?'p':'pl'} style={VS.icon}
          initial={{opacity:0,scale:0.6}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.6}}
          transition={{duration:0.18}}
        >
          {playing
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(255,255,255,0.85)"><rect x="6" y="4" width="4" height="16" rx="1.5"/><rect x="14" y="4" width="4" height="16" rx="1.5"/></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(255,255,255,0.85)"><polygon points="6,3 20,12 6,21"/></svg>}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
const VS = {
  wrap:  { position:'relative', width:108, height:108, flexShrink:0, cursor:'pointer', userSelect:'none' },
  glow:  { position:'absolute', inset:-6, borderRadius:'50%', pointerEvents:'none' },
  disc:  { position:'absolute', inset:0, borderRadius:'50%', background:'radial-gradient(circle at 30% 30%,#1a2a4a,#040d1e)', border:'1px solid rgba(90,150,240,0.16)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 30px rgba(0,0,0,0.7)' },
  label: { position:'absolute', width:'34%', height:'34%', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(255,255,255,0.07)' },
  dot:   { width:5, height:5, borderRadius:'50%', background:'rgba(255,255,255,0.25)' },
  icon:  { position:'absolute', inset:0, borderRadius:'50%', background:'rgba(0,0,0,0.2)', display:'flex', alignItems:'center', justifyContent:'center' },
}

/* ── Progress bar ──────────────────────────────────────────── */
function Progress({ cur, dur, onSeek, color }) {
  const ref = useRef(null)
  const pct = dur ? Math.min(100,(cur/dur)*100) : 0
  const seek = (cx) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    onSeek(Math.max(0,Math.min(1,(cx-r.left)/r.width)) * dur)
  }
  return (
    <div ref={ref} style={PS.track} onClick={e=>seek(e.clientX)} onTouchStart={e=>seek(e.touches[0].clientX)}>
      <div style={{...PS.fill, width:`${pct}%`, background:`linear-gradient(90deg,${color}88,${color}cc)`}} />
      <div style={{...PS.thumb, left:`${pct}%`, background:color, boxShadow:`0 0 8px ${color}88`}} />
    </div>
  )
}
const PS = {
  track:{ flex:1, height:3.5, borderRadius:4, background:'rgba(90,150,240,0.1)', cursor:'pointer', position:'relative', overflow:'visible', WebkitTapHighlightColor:'transparent' },
  fill: { position:'absolute', left:0, top:0, bottom:0, borderRadius:4, pointerEvents:'none', transition:'width 0.1s linear' },
  thumb:{ position:'absolute', top:'50%', transform:'translate(-50%,-50%)', width:11, height:11, borderRadius:'50%', pointerEvents:'none', transition:'left 0.1s linear' },
}

/* ── Song row ──────────────────────────────────────────────── */
function Row({ song, idx, active, playing, onSelect }) {
  return (
    <motion.button
      style={{
        ...RS.card,
        background: active ? `linear-gradient(135deg,rgba(${hexRgb(song.color)},0.15),rgba(${hexRgb(song.color)},0.05))` : 'rgba(8,18,50,0.42)',
        borderColor: active ? `${song.color}50` : 'rgba(90,150,240,0.09)',
        boxShadow: active ? `0 0 18px ${song.color}1a` : 'none',
      }}
      onClick={() => onSelect(song)}
      whileHover={{ scale: 1.016, borderColor: `${song.color}40` }}
      whileTap={{ scale: 0.985 }}
    >
      <div style={RS.num}>
        {active && playing ? (
          <div style={{ display:'flex', alignItems:'flex-end', gap:2, height:12 }}>
            {[0,1,2].map(i => (
              <motion.div key={i}
                style={{ width:2.5, height:'100%', background:song.color, borderRadius:2, transformOrigin:'bottom' }}
                animate={{ scaleY:[0.3,1,0.4,0.85,0.3] }}
                transition={{ duration:0.88, repeat:Infinity, delay:i*0.15, ease:'easeInOut' }}
              />
            ))}
          </div>
        ) : (
          <span style={{ fontFamily:'var(--font-display)', fontSize:'0.68rem', color:active?song.color:'rgba(168,200,248,0.25)', letterSpacing:'0.04em' }}>
            {String(idx+1).padStart(2,'0')}
          </span>
        )}
      </div>
      <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:1 }}>
        <span style={{ fontFamily:'var(--font-arabic)', direction:'rtl', textAlign:'left', fontSize:'0.72rem', lineHeight:1.25, color:active?song.color:'rgba(168,200,248,0.42)' }}>
          {song.arabic}
        </span>
        <span style={{ fontFamily:'var(--font-display)', fontSize:'clamp(0.8rem,2.2vw,0.93rem)', letterSpacing:'0.02em', lineHeight:1.3, color:active?'var(--cream)':'var(--cream-dim)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {song.title}
        </span>
      </div>
      <span style={{ padding:'2px 8px', borderRadius:50, border:'1px solid', fontSize:'0.61rem', fontFamily:'var(--font-arabic)', direction:'rtl', whiteSpace:'nowrap', flexShrink:0, borderColor:`${song.color}42`, color:active?song.color:'rgba(168,200,248,0.28)', transition:'color 0.3s' }}>
        {song.mood}
      </span>
    </motion.button>
  )
}
const RS = {
  card:{ display:'flex', alignItems:'center', gap:'0.65rem', padding:'0.72rem 0.9rem', borderRadius:13, border:'1px solid', width:'100%', textAlign:'left', backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)', cursor:'pointer', outline:'none', transition:'background 0.3s,border-color 0.3s,box-shadow 0.3s', WebkitTapHighlightColor:'transparent' },
  num: { width:26, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' },
}

/* ══════════════════════════════════════════════════════════════ */
export default function MusicSection({ sectionRef }) {
  const audioRef = useRef(null)
  const volRef   = useRef(null)
  const [idx,     setIdx]     = useState(0)
  const [playing, setPlaying] = useState(false)
  const [cur,     setCur]     = useState(0)
  const [dur,     setDur]     = useState(0)
  const [vol,     setVol]     = useState(0.8)
  const [muted,   setMuted]   = useState(false)
  const { trackSongPlay } = useTelegramBot()

  const song = PLAYLIST[idx]

  // Tracking logic: Notify Khalid if song plays for more than 10 seconds
  useEffect(() => {
    let trackTimer;
    if (playing && song) {
      trackTimer = setTimeout(() => {
        trackSongPlay(song.title, song.artist);
      }, 10000); // 10 seconds threshold
    }
    return () => { if (trackTimer) clearTimeout(trackTimer); };
  }, [playing, idx, song, trackSongPlay]);

  useEffect(() => {
    const a = audioRef.current; if (!a) return
    const onTime  = () => setCur(a.currentTime)
    const onMeta  = () => setDur(a.duration)
    const onEnded = () => { if (idx < PLAYLIST.length-1) setIdx(i=>i+1); else { setPlaying(false); setCur(0) } }
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('loadedmetadata', onMeta)
    a.addEventListener('ended', onEnded)
    return () => { a.removeEventListener('timeupdate',onTime); a.removeEventListener('loadedmetadata',onMeta); a.removeEventListener('ended',onEnded) }
  }, [idx])

  useEffect(() => {
    const a = audioRef.current; if (!a) return
    a.src = song.src; a.load(); setCur(0); setDur(0)
    if (playing) a.play().catch(()=>{})
  }, [idx]) // eslint-disable-line

  useEffect(() => { if (audioRef.current) audioRef.current.volume = muted?0:vol }, [vol,muted])

  const toggle = useCallback(async () => {
    const a = audioRef.current; if (!a) return
    if (playing) { a.pause(); setPlaying(false) }
    else { await a.play().catch(()=>{}); setPlaying(true) }
  }, [playing])

  const seek = useCallback(t => { if (audioRef.current) audioRef.current.currentTime=t; setCur(t) }, [])
  const prev = useCallback(() => { if (cur>3) seek(0); else setIdx(i=>Math.max(0,i-1)) }, [cur,seek])
  const next = useCallback(() => setIdx(i=>Math.min(PLAYLIST.length-1,i+1)), [])

  const selectSong = useCallback(s => {
    const i = PLAYLIST.findIndex(p=>p.id===s.id)
    if (i===idx) toggle(); else { setIdx(i); setPlaying(true) }
  }, [idx,toggle])

  const handleVol = useCallback(e => {
    if (!volRef.current) return
    const r = volRef.current.getBoundingClientRect()
    setVol(Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)))
    setMuted(false)
  }, [])

  const ctrlBtn = {
    width:40, height:40, borderRadius:'50%',
    border:'1px solid rgba(90,150,240,0.13)',
    background:'rgba(90,150,240,0.06)',
    color:'var(--blue-200)',
    display:'flex', alignItems:'center', justifyContent:'center',
    cursor:'pointer', outline:'none', WebkitTapHighlightColor:'transparent',
  }

  return (
    <section ref={sectionRef} id="music" className="section music-section">
      <audio ref={audioRef} src={song.src} preload="metadata" playsInline />
      <Stars count={48} />
      <div className="orb orb-blue" style={{ width:380, height:380, top:'-8%', right:'-8%', opacity:0.09 }} aria-hidden="true" />
      <div className="orb orb-blue" style={{ width:250, height:250, bottom:'3%', left:'-6%', opacity:0.07 }} aria-hidden="true" />

      <motion.div
        initial={{ opacity:0, y:28 }}
        whileInView={{ opacity:1, y:0 }}
        viewport={{ once:true, amount:0.12 }}
        transition={{ duration:0.88, ease:[0.22,1,0.36,1] }}
        style={{ position:'relative', width:'100%', maxWidth:500, display:'flex', flexDirection:'column', alignItems:'center', gap:'1.75rem' }}
      >
        {/* Header */}
        <div style={{ textAlign:'center', width:'100%' }}>
          <p style={{ fontFamily:'var(--font-arabic)', direction:'rtl', fontSize:'clamp(0.82rem,2.5vw,0.96rem)', color:'var(--blue-200)', opacity:0.55, marginBottom:'0.4rem' }}>أغانينا المفضلة</p>
          <h2 className="t-display" style={{ fontSize:'clamp(1.9rem,7vw,3rem)', background:'linear-gradient(135deg,var(--cream) 0%,var(--blue-200) 60%,var(--gold-light) 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
            Our Music
          </h2>
          <div className="divider-blue" />
          <p className="t-italic" style={{ fontSize:'clamp(0.78rem,2.2vw,0.9rem)', color:'var(--cream-dim)', opacity:0.45, letterSpacing:'0.04em' }}>
            The songs that hold our memories
          </p>
        </div>

        {/* Player card */}
        <div className="glass-card" style={{ width:'100%', padding:'clamp(1.2rem,4vw,1.75rem)', display:'flex', flexDirection:'column', gap:'1.1rem' }}>
          {/* Top row: vinyl + info */}
          <div style={{ display:'flex', alignItems:'center', gap:'1.1rem' }}>
            <Vinyl playing={playing} color={song.color} onClick={toggle} />
            <div style={{ flex:1, minWidth:0 }}>
              <AnimatePresence mode="wait">
                <motion.div key={song.id}
                  initial={{opacity:0,x:12}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-12}}
                  transition={{duration:0.28}}
                >
                  <p style={{ fontFamily:'var(--font-arabic)', direction:'rtl', fontSize:'0.78rem', lineHeight:1.3, color:song.color, marginBottom:3, transition:'color 0.4s' }}>{song.arabic}</p>
                  <p style={{ fontFamily:'var(--font-display)', fontSize:'clamp(0.95rem,3.2vw,1.2rem)', color:'var(--cream)', letterSpacing:'0.02em', lineHeight:1.2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{song.title}</p>
                  {song.artist!=='—' && <p style={{ fontFamily:'var(--font-body)', fontStyle:'italic', fontSize:'0.76rem', color:'var(--cream-dim)', opacity:0.4, marginTop:2 }}>{song.artist}</p>}
                  <span style={{ display:'inline-block', marginTop:7, padding:'2px 11px', borderRadius:50, border:`1px solid ${song.color}42`, fontSize:'0.64rem', fontFamily:'var(--font-arabic)', direction:'rtl', color:song.color }}>
                    {song.mood}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Progress */}
          <div style={{ display:'flex', alignItems:'center', gap:'0.55rem' }}>
            <span style={{ fontFamily:'monospace', fontSize:'0.64rem', color:'var(--blue-200)', opacity:0.35, minWidth:26, textAlign:'center' }}>{fmt(cur)}</span>
            <Progress cur={cur} dur={dur} onSeek={seek} color={song.color} />
            <span style={{ fontFamily:'monospace', fontSize:'0.64rem', color:'var(--blue-200)', opacity:0.35, minWidth:26, textAlign:'center' }}>{fmt(dur)}</span>
          </div>

          {/* Controls */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'1.1rem' }}>
            <motion.button style={{ ...ctrlBtn, opacity:idx===0&&cur<1?0.25:0.72 }} onClick={prev} whileHover={{scale:1.12}} whileTap={{scale:0.9}}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><polygon points="19,20 9,12 19,4"/><rect x="5" y="4" width="3" height="16" rx="1"/></svg>
            </motion.button>
            <motion.button
              style={{ width:56, height:56, borderRadius:'50%', border:`1px solid ${song.color}77`, background:`radial-gradient(circle at 35% 35%,${song.color}44,${song.color}18)`, color:'var(--cream)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', outline:'none', WebkitTapHighlightColor:'transparent', transition:'box-shadow 0.3s', padding:0 }}
              onClick={toggle} whileHover={{scale:1.08, boxShadow:`0 0 28px ${song.color}55`}} whileTap={{scale:0.93}}
            >
              <AnimatePresence mode="wait">
                <motion.span key={playing?'pa':'pl'} initial={{opacity:0,scale:0.5}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.5}} transition={{duration:0.14}} style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {playing
                    ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1.5"/><rect x="14" y="4" width="4" height="16" rx="1.5"/></svg>
                    : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{paddingLeft:2}}><polygon points="6,3 20,12 6,21"/></svg>}
                </motion.span>
              </AnimatePresence>
            </motion.button>
            <motion.button style={{ ...ctrlBtn, opacity:idx===PLAYLIST.length-1?0.25:0.72 }} onClick={next} disabled={idx===PLAYLIST.length-1} whileHover={{scale:1.12}} whileTap={{scale:0.9}}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,4 15,12 5,20"/><rect x="16" y="4" width="3" height="16" rx="1"/></svg>
            </motion.button>
          </div>

          {/* Volume */}
          <div style={{ display:'flex', alignItems:'center', gap:'0.65rem' }}>
            <button style={{ background:'none', border:'none', color:'var(--blue-200)', opacity:0.4, cursor:'pointer', padding:4, display:'flex', alignItems:'center', outline:'none', flexShrink:0, WebkitTapHighlightColor:'transparent' }} onClick={()=>setMuted(m=>!m)}>
              {muted||vol===0
                ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/><path d="M15.54,8.46a5,5,0,0,1,0,7.07"/><path d="M19.07,4.93a10,10,0,0,1,0,14.14"/></svg>}
            </button>
            <div ref={volRef} style={PS.track} onClick={handleVol}>
              <div style={{...PS.fill, width:`${muted?0:vol*100}%`, background:'rgba(90,150,240,0.45)'}} />
            </div>
          </div>
        </div>

        {/* Playlist */}
        <div style={{ width:'100%' }}>
          <p style={{ fontFamily:'var(--font-body)', fontStyle:'italic', fontSize:'0.73rem', color:'var(--blue-200)', opacity:0.35, letterSpacing:'0.07em', textAlign:'center', marginBottom:'0.6rem' }}>
            ♪  Playlist — {PLAYLIST.length} songs
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.38rem' }}>
            {PLAYLIST.map((s,i) => <Row key={s.id} song={s} idx={i} active={s.id===song.id} playing={playing&&s.id===song.id} onSelect={selectSong} />)}
          </div>
        </div>

        <p style={{ fontFamily:'var(--font-body)', fontStyle:'italic', fontSize:'clamp(0.72rem,2vw,0.82rem)', color:'var(--blue-200)', opacity:0.28, textAlign:'center', letterSpacing:'0.06em' }}>
          💙 Every melody tells a part of our story
        </p>
      </motion.div>

      <div className="scroll-hint" aria-hidden="true">
        <span className="scroll-hint__dot"/><span className="scroll-hint__dot"/><span className="scroll-hint__dot"/>
      </div>
    </section>
  )
}
