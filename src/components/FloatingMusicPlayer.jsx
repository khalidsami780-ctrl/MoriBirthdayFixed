import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { playlist } from '../data/playlist'
import { createPortal } from 'react-dom'
import { useTelegramBot } from '../hooks/useTelegramBot'

export default function FloatingMusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Custom event to notify other components about overlap prevention
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('musicPlayerStateChange', { detail: { isExpanded } }));
  }, [isExpanded]);

  const [showPlaylist, setShowPlaylist] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.5)
  const [isMuted, setIsMuted] = useState(false)
  const [showNotice, setShowNotice] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 500)
  
  const audioRef = useRef(null)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 500)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  const { trackSongPlay } = useTelegramBot()
  const currentTrack = playlist[currentTrackIndex]

  // Handle Romantic Notice
  useEffect(() => {
    const timer = setTimeout(() => setShowNotice(true), 2500)
    const hideTimer = setTimeout(() => setShowNotice(false), 2500 + 4500) // Auto-hide after 4.5 seconds
    return () => { clearTimeout(timer); clearTimeout(hideTimer); }
  }, [])

  const dismissNotice = () => {
    setShowNotice(false)
  }

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  // 1. Handle track loading (only when index changes)
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.load();
    // If it was already playing, modern browsers should continue playing the new src
    if (isPlaying) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [currentTrackIndex]); 

  // 2. Handle play/pause toggle (only when isPlaying changes)
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error("Playback failed:", error);
          setIsPlaying(false);
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // 3. Tracking logic: Only notify Khalid if song plays for more than 5 seconds
  useEffect(() => {
    let trackTimer;
    
    if (isPlaying && currentTrack) {
      trackTimer = setTimeout(() => {
        trackSongPlay(currentTrack.title, currentTrack.artist);
      }, 10000); // 10 seconds threshold
    }

    return () => {
      if (trackTimer) clearTimeout(trackTimer);
    };
  }, [isPlaying, currentTrackIndex, currentTrack, trackSongPlay]);

  const togglePlay = (e) => {
    if (e) e.stopPropagation()
    setIsPlaying(!isPlaying)
  }

  const handleNext = useCallback((e) => {
    if (e) e.stopPropagation()
    setCurrentTrackIndex((prev) => (prev + 1) % playlist.length)
    setIsPlaying(true)
  }, [])

  const handlePrev = (e) => {
    if (e) e.stopPropagation()
    setCurrentTrackIndex((prev) => (prev - 1 + playlist.length) % playlist.length)
    setIsPlaying(true)
  }

  const handleDownloadTrack = (e, track) => {
    e.stopPropagation();
    let downloadUrl = track.url;
    // Inject fl_attachment to force download rather than browser-playback for Cloudinary assets
    if (downloadUrl.includes("upload/")) {
      const parts = downloadUrl.split("upload/");
      downloadUrl = `${parts[0]}upload/fl_attachment/${parts[1]}`;
    }

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${track.title} - ${track.artist}`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSeek = (e) => {
    const seekTime = (e.target.value / 100) * audioRef.current.duration
    audioRef.current.currentTime = seekTime
    setProgress(e.target.value)
  }

  const onTimeUpdate = () => {
    const curr = audioRef.current?.currentTime
    const dur = audioRef.current?.duration
    if (dur) {
      setDuration(dur)
      setProgress((curr / dur) * 100)
    }
  }

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00"
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  return createPortal(
    <div style={S.container}>
      <audio
        ref={audioRef}
        src={currentTrack.url}
        onTimeUpdate={onTimeUpdate}
        onEnded={() => handleNext()}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onPlay={() => { setIsPlaying(true); setIsLoading(false); }}
        onPause={(e) => { 
          if (e.target.currentTime >= e.target.duration - 0.5) return;
          setIsPlaying(false)
        }}
        onError={(e) => {
          console.error("Audio Load Error:", e);
          setIsLoading(false);
          setIsPlaying(false);
        }}
        preload="auto"
      />

      {/* Romantic Notice Bubble */}
      <AnimatePresence>
        {showNotice && !isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            whileHover={{ scale: 1.05 }}
            style={S.noticeBubble}
            onClick={dismissNotice}
          >
            <span style={S.noticeHeart}>💙</span>
            <span style={S.noticeText}>موري، كل أغانينا بقت هنا في مكان واحد.. وبدون موسيقى طبعا 💞 I Love U Mori </span>
            <div style={S.noticeArrow} />
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {!isExpanded ? (
          <motion.div
            key="mini"
            initial={{ scale: 0, opacity: 0, rotate: -180 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0, rotate: 180 }}
            whileHover={{ scale: 1.1, boxShadow: '0 0 25px rgba(91,156,246,0.5)' }}
            onClick={() => { setIsExpanded(true); dismissNotice(); }}
            style={S.miniPlayer}
          >
            <motion.div animate={isPlaying ? { rotate: 360 } : {}} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}>
              <MusicIcon size={24} />
            </motion.div>
            {isPlaying && (
              <motion.div 
                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={S.miniPulse}
              />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={{ y: 30, opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ y: 30, opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
            transition={{ 
              type: 'spring', damping: 20, stiffness: 150,
              filter: { type: 'tween', duration: 0.3, ease: 'easeOut' } // Prevent negative blur overshoot
            }}
            style={S.expandedPlayer}
          >
            {/* Header */}
            <div style={S.header}>
              <button onClick={() => setShowPlaylist(!showPlaylist)} style={S.iconBtn} title="قائمة التشغيل">
                <ListIcon size={18} active={showPlaylist} />
              </button>
              <span style={S.headerLabel}>مشغّل الذكريات</span>
              <button onClick={() => setIsExpanded(false)} style={S.iconBtn}>
                <CloseIcon size={18} />
              </button>
            </div>

            {/* Content Area */}
            <div style={S.contentStack}>
              <AnimatePresence mode="wait">
                {showPlaylist ? (
                  <motion.div
                    key="playlist"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    style={S.playlistArea}
                  >
                    {playlist.map((track, idx) => (
                      <motion.div 
                        key={track.id} 
                        whileHover={{ background: 'rgba(255,255,255,0.06)' }}
                        onClick={() => { setCurrentTrackIndex(idx); setIsPlaying(true); }}
                        style={{ ...S.playlistItem, borderRight: currentTrackIndex === idx ? '3px solid #5b9cf6' : '3px solid transparent' }}
                      >
                        <span style={{ ...S.itemTitle, color: currentTrackIndex === idx ? '#5b9cf6' : '#f0e8dc' }}>
                          {track.title}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {currentTrackIndex === idx && isPlaying && <EqualizerSmall />}
                          <motion.button 
                            onClick={(e) => handleDownloadTrack(e, track)} 
                            whileHover={{ scale: 1.15, color: '#5b9cf6' }}
                            whileTap={{ scale: 0.9 }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', WebkitTapHighlightColor: 'transparent', color: 'rgba(168,200,248,0.5)' }}
                            title="تنزيل الأغنية"
                          >
                            <DownloadIcon size={16} />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="player"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    style={S.playerArea}
                  >
                    <div style={S.trackInfo}>
                      <motion.div 
                        key={currentTrackIndex}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={S.trackTitle}
                      >
                        {currentTrack.title}
                      </motion.div>
                      <div style={S.trackArtist}>{currentTrack.artist}</div>
                    </div>

                    {/* Seeking */}
                    <div style={S.seekContainer}>
                      <span style={S.timeLabel}>{formatTime(audioRef.current?.currentTime)}</span>
                      <input 
                        type="range" 
                        value={progress} 
                        onChange={handleSeek} 
                        style={S.slider}
                      />
                      <span style={S.timeLabel}>{formatTime(duration)}</span>
                    </div>

                    {/* Main Controls */}
                    <div style={S.controls}>
                      <button onClick={handlePrev} style={S.controlBtn}><PrevIcon /></button>
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={togglePlay} 
                        style={{ ...S.playBtn, position: 'relative' }}
                      >
                        {isLoading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            style={S.loader}
                          />
                        ) : isPlaying ? <PauseIcon /> : <PlayIcon />}
                      </motion.button>
                      <button onClick={handleNext} style={S.controlBtn}><NextIcon /></button>
                    </div>

                    {/* Volume */}
                    <div style={S.volumeContainer}>
                      <button onClick={() => setIsMuted(!isMuted)} style={S.volIconBtn}>
                        {isMuted || volume === 0 ? <MuteIcon /> : <VolIcon />}
                      </button>
                      <input 
                        type="range" 
                        min="0" max="1" step="0.01" 
                        value={volume} 
                        onChange={(e) => setVolume(parseFloat(e.target.value))} 
                        style={S.volSlider}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  )
}

// --- Icons ---
const MusicIcon = ({ size }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>);
const ListIcon = ({ size, active }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={active ? "#5b9cf6" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>);
const CloseIcon = ({ size }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);
const PlayIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>);
const PauseIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>);
const PrevIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2"></line></svg>);
const NextIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2"></line></svg>);
const VolIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2V15H6L11 19V5Z"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>);
const MuteIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2V15H6L11 19V5Z"></path><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>);
const DownloadIcon = ({ size }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>);

const EqualizerSmall = () => (
  <div style={{ display:'flex', gap:2, alignItems:'flex-end', height:10, marginLeft: 8 }}>
    {[0.4, 0.8, 0.5].map((h, i) => (
      <motion.div
        key={i}
        animate={{ scaleY: [0.3, 1, 0.4, 0.9, 0.3] }}
        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
        style={{ width:2, height:'100%', background:'#5b9cf6', borderRadius:1, transformOrigin:'bottom' }}
      />
    ))}
  </div>
)

// --- Styles ---
const S = {
  container: { position: 'fixed', bottom: '1.5rem', left: '1.5rem' },
  miniPlayer: {
    width: 58, height: 58, borderRadius: '50%', background: 'rgba(8,18,52,0.75)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(91,156,246,0.3)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', cursor: 'pointer', color: '#a8c8f8', boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
    position: 'relative'
  },
  miniPulse: { position: 'absolute', inset: -4, borderRadius: '50%', border: '2px solid rgba(91,156,246,0.4)', pointerEvents: 'none' },
  noticeBubble: {
    position: 'absolute', bottom: '100%', left: '0', translate: '4px -20px', width: 'min(240px, 80vw)',
    background: 'rgba(12, 31, 74, 0.85)', backdropFilter: 'blur(12px)',
    padding: '10px 14px', borderRadius: '20px', border: '1px solid rgba(91,156,246,0.4)',
    color: '#f0e8dc', fontSize: 'clamp(0.8rem, 3.2vw, 0.88rem)', lineHeight: 1.4, direction: 'rtl',
    textAlign: 'center', boxShadow: '0 15px 45px rgba(0,0,0,0.5), inset 0 0 15px rgba(91,156,246,0.1)',
    cursor: 'pointer', pointerEvents: 'auto', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '6px', fontFamily: '"Scheherazade New", serif'
  },
  noticeHeart: { fontSize: '1.4rem', filter: 'drop-shadow(0 0 8px #5b9cf6)' },
  noticeText: { fontWeight: 500 },
  noticeArrow: {
    position: 'absolute', top: '100%', left: '26px', width: 0, height: 0,
    borderLeft: '12px solid transparent', borderRight: '12px solid transparent',
    borderTop: '12px solid rgba(91,156,246,0.4)'
  },
  expandedPlayer: {
    width: 'min(300px, 88vw)', minHeight: 180, borderRadius: 28, background: 'rgba(4,10,34,0.88)',
    backdropFilter: 'blur(30px) saturate(150%)', WebkitBackdropFilter: 'blur(30px) saturate(150%)',
    border: '1px solid rgba(91,156,246,0.35)', boxShadow: '0 30px 80px rgba(0,0,0,0.7)',
    padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflow: 'hidden'
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerLabel: { fontSize: '0.6rem', letterSpacing: '0.2em', color: 'rgba(168,200,248,0.3)', textTransform: 'uppercase', fontFamily: 'system-ui' },
  iconBtn: { background: 'none', border: 'none', color: 'rgba(168,200,248,0.5)', cursor: 'pointer', padding: 6, display: 'flex' },
  contentStack: { flex: 1, position: 'relative', minHeight: 160 },
  playerArea: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  playlistArea: { 
    display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto',
    paddingRight: 6, scrollbarWidth: 'thin', scrollbarColor: 'rgba(91,156,246,0.3) transparent'
  },
  playlistItem: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 14,
    background: 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.2s',
    fontSize: '0.95rem', fontFamily: '"Scheherazade New", serif', direction: 'rtl'
  },
  itemTitle: { flex: 1, textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  trackInfo: { textAlign: 'center', direction: 'rtl', minHeight: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  trackTitle: { color: '#f0e8dc', fontSize: '1.3rem', fontWeight: 600, fontFamily: '"Scheherazade New", serif', lineHeight: 1.4 },
  trackArtist: { color: 'rgba(168,200,248,0.4)', fontSize: '0.85rem', marginTop: 2 },
  seekContainer: { display: 'flex', alignItems: 'center', gap: 10, padding: '0 4px' },
  timeLabel: { fontSize: '0.65rem', color: 'rgba(168,200,248,0.35)', minWidth: 30, fontFamily: 'monospace' },
  slider: { flex: 1, accentColor: '#5b9cf6', cursor: 'pointer', height: 4 },
  controls: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem' },
  controlBtn: { background: 'none', border: 'none', color: '#a8c8f8', cursor: 'pointer', opacity: 0.65, display: 'flex' },
  playBtn: { 
    width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(135deg, #3a7bd5, #0c1f4a)',
    border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    boxShadow: '0 10px 25px rgba(58,123,213,0.35)'
  },
  volumeContainer: { display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' },
  volIconBtn: { background: 'none', border: 'none', color: 'rgba(168,200,248,0.35)', cursor: 'pointer', display: 'flex' },
  volSlider: { width: 80, accentColor: 'rgba(168,200,248,0.5)', cursor: 'pointer', height: 3 },
  loader: {
    width: 24, height: 24, borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.1)',
    borderTop: '2px solid #fff',
  }
}
