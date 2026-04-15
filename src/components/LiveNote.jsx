import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTelegramBot } from '../hooks/useTelegramBot'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'

/**
 * LiveNote Component - WhatsApp Status Style
 * Displays a glowing ring floating button that opens a drawer of live notes (Stories).
 * Notes are auto-deleted 24 hours *after* they are first viewed.
 */
export default function LiveNote() {
  const [notes, setNotes] = useState([])
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [activeNote, setActiveNote] = useState(null)
  const [isMusicExpanded, setIsMusicExpanded] = useState(false)
  const { pollTelegramReplies, sendNoteReaction } = useTelegramBot()

  useEffect(() => {
    const handleMusicState = (e) => setIsMusicExpanded(e.detail.isExpanded);
    window.addEventListener('musicPlayerStateChange', handleMusicState);
    return () => window.removeEventListener('musicPlayerStateChange', handleMusicState);
  }, []);

  const EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 Hours

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const { data, error } = await supabase.from('live_note').select('*').order('timestamp', { ascending: false });
        if (!error && data) {
          const validNotes = data.map(n => n.data).filter(n => {
             const viewTime = localStorage.getItem(`mori_story_viewed_${n.id}`);
             if (!viewTime) return true; // Unviewed
             return (Date.now() - parseInt(viewTime, 10)) < EXPIRY_MS; // Viewed but not expired
          });
          setNotes(validNotes);
          localStorage.setItem('mori_live_notes_stack', JSON.stringify(validNotes));
        } else {
          // Fallback to local
          const local = JSON.parse(localStorage.getItem('mori_live_notes_stack') || '[]');
          setNotes(local.filter(n => {
            const viewTime = localStorage.getItem(`mori_story_viewed_${n.id}`);
            return !viewTime || (Date.now() - parseInt(viewTime, 10)) < EXPIRY_MS;
          }));
        }
      } catch (e) {
        console.warn("LiveNote mount fetch failed", e);
      }
    };

    fetchNotes();

    const channel = supabase.channel('live_note_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_note' }, fetchNotes)
      .subscribe();

    const botCleanup = pollTelegramReplies(
      () => {}, 
      (newNote) => {
         fetchNotes();
      }
    );

    return () => {
      botCleanup();
      supabase.removeChannel(channel);
    };
  }, [pollTelegramReplies]);

  const unviewedCount = notes.filter(n => !localStorage.getItem(`mori_story_viewed_${n.id}`)).length;

  const handleOpenNote = (note) => {
    if (!localStorage.getItem(`mori_story_viewed_${note.id}`)) {
       localStorage.setItem(`mori_story_viewed_${note.id}`, Date.now().toString());
    }
    setActiveNote(note);
    setIsDrawerOpen(false);
  }

  const handleHeart = () => {
    if (!activeNote) return;
    const reactKey = `mori_story_reacted_${activeNote.id}`;
    if (!localStorage.getItem(reactKey)) {
        sendNoteReaction(activeNote);
        localStorage.setItem(reactKey, 'true');
        // Force re-render to update heart locally
        setActiveNote({...activeNote, reacted: true});
    }
  }

  const formatTime = (ts) => {
    if (!ts) return "منذ لحظات"
    try {
      const diff = Math.floor((Date.now() - ts) / 60000);
      if (diff < 60) return `منذ ${diff} دقيقة`;
      const hrs = Math.floor(diff / 60);
      return `منذ ${hrs} ساعة`;
    } catch {
      return "اليوم"
    }
  }

  const isMedia = activeNote && (activeNote.type === 'image' || activeNote.type === 'video' || activeNote.type === 'video_note' || activeNote.type === 'voice');

  return createPortal(
    <>
      {/* Floating Status Ring Button */}
      <AnimatePresence>
        {notes.length > 0 && !activeNote && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            style={{
              ...S.ringContainer,
              bottom: isMusicExpanded ? '340px' : '90px'
            }}
          >
            <button 
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              style={{
                ...S.ringButton,
                borderColor: unviewedCount > 0 ? '#3b82f6' : 'rgba(255,255,255,0.2)',
                boxShadow: unviewedCount > 0 ? '0 0 15px rgba(59, 130, 246, 0.6)' : 'none'
              }}
            >
              <div style={S.ringInner}>
                 <span style={{ fontSize: '1.5rem' }}>✨</span>
              </div>
            </button>
            {unviewedCount > 0 && (
              <div style={S.badge}>{unviewedCount}</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drawer List (Like Notification Box) */}
      <AnimatePresence>
        {isDrawerOpen && (
           <motion.div
             initial={{ opacity: 0, y: 20, scale: 0.95 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, y: 20, scale: 0.95 }}
             style={{
               ...S.drawer,
               bottom: isMusicExpanded ? '410px' : '160px'
             }}
           >
             <div style={S.drawerHeader}>
               <span style={S.drawerTitle}>حالات خالد المباشرة 💙</span>
               <button onClick={() => setIsDrawerOpen(false)} style={S.drawerClose}>✕</button>
             </div>
             
             <div style={S.drawerList}>
               {notes.map(note => {
                 const viewed = !!localStorage.getItem(`mori_story_viewed_${note.id}`);
                 return (
                   <motion.div 
                     key={note.id}
                     whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                     whileTap={{ scale: 0.98 }}
                     onClick={() => handleOpenNote(note)}
                     style={{
                        ...S.drawerItem,
                        borderRight: viewed ? '3px solid transparent' : '3px solid #3b82f6'
                     }}
                   >
                     <div style={{
                       ...S.storyAvatar,
                       borderColor: viewed ? 'rgba(255,255,255,0.1)' : '#3b82f6',
                       color: viewed ? 'rgba(255,255,255,0.4)' : '#3b82f6'
                     }}>
                        {note.type === 'text' ? '📝' : (note.type === 'image' ? '📸' : (note.type === 'voice' ? '🎤' : '🎬'))}
                     </div>
                     <div style={S.storyInfo}>
                        <div style={S.storyTitle}>مكاتيب وحالات عابرة</div>
                        <div style={S.storyTime}>{formatTime(note.timestamp)}</div>
                     </div>
                   </motion.div>
                 )
               })}
             </div>
           </motion.div>
        )}
      </AnimatePresence>

      {/* Active Note Viewer Component */}
      <AnimatePresence>
        {activeNote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={S.viewerBackdrop}
            onClick={() => setActiveNote(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={S.viewerCard}
            >
              <div style={S.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={S.pulseDot} />
                  <span style={S.title}>رسالة لكِ من قلب خالد 💌</span>
                </div>
                <button 
                  onClick={() => setActiveNote(null)} 
                  style={S.close}
                  title="إغفاء"
                >
                  ✕
                </button>
              </div>
              
              <div style={S.content}>
                 {activeNote.type === 'image' && (
                   <div style={S.mediaWrapper}>
                      <motion.img 
                        src={activeNote.url} 
                        alt="Live Photo" 
                        style={S.mediaImage}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                      />
                   </div>
                 )}
                 
                 {activeNote.type === 'video' && (
                   <div style={S.mediaWrapper}>
                     <motion.video
                       src={activeNote.url}
                       controls
                       autoPlay
                       muted
                       loop
                       playsInline
                       style={S.mediaVideo}
                     />
                   </div>
                 )}

                 {activeNote.type === 'video_note' && (
                   <div style={S.videoNoteContainer}>
                      <motion.video
                        src={activeNote.url}
                        autoPlay
                        muted
                        loop
                        playsInline
                        style={S.mediaVideoNote}
                      />
                   </div>
                 )}

                 {activeNote.type === 'voice' && (
                   <div style={S.voiceContainer}>
                      <div style={S.voiceIcon}>🎤</div>
                      <audio 
                        src={activeNote.url} 
                        controls 
                        autoPlay 
                        style={S.voiceAudio}
                      />
                      <div style={S.voiceWave}>فوضى حنين... صوت خالد 💙</div>
                   </div>
                 )}

                 <p style={{...S.text, marginTop: isMedia ? '12px' : '0'}}>{activeNote.text || (typeof activeNote.text === 'string' && activeNote.text) || ""}</p>
              </div>

              <div style={S.footer}>
                <div style={S.timestamp}>{formatTime(activeNote.timestamp)}</div>
                <motion.button
                  whileHover={{ scale: 1.3, color: '#ff4d4d' }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleHeart}
                  style={{
                    ...S.heartBtn, 
                    color: (activeNote.reacted || localStorage.getItem(`mori_story_reacted_${activeNote.id}`)) ? '#ff4d4d' : 'rgba(255,255,255,0.3)',
                    filter: (activeNote.reacted || localStorage.getItem(`mori_story_reacted_${activeNote.id}`)) ? 'drop-shadow(0 0 8px rgba(255,77,77,0.4))' : 'none'
                  }}
                >
                  {(activeNote.reacted || localStorage.getItem(`mori_story_reacted_${activeNote.id}`)) ? '❤️' : '🤍'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body
  )
}

const S = {
  ringContainer: {
    position: 'fixed',
    bottom: '90px',
    left: '20px',
    zIndex: 99998,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringButton: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'rgba(10, 25, 60, 0.9)',
    border: '3px solid',
    backdropFilter: 'blur(15px)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    transition: 'all 0.3s ease',
  },
  ringInner: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    background: 'rgba(91, 156, 246, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: '-5px',
    right: '-5px',
    background: '#ec4899',
    color: '#fff',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
    fontFamily: 'monospace'
  },
  drawer: {
    position: 'fixed',
    bottom: '160px',
    left: '20px',
    width: 'min(300px, 85vw)',
    background: 'rgba(10, 25, 60, 0.95)',
    backdropFilter: 'blur(25px)',
    border: '1px solid rgba(168, 200, 248, 0.25)',
    borderRadius: '24px',
    zIndex: 99999,
    boxShadow: '0 15px 45px rgba(0,0,0,0.7)',
    overflow: 'hidden',
    direction: 'rtl'
  },
  drawerHeader: {
    padding: '15px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drawerTitle: {
    fontFamily: "'Scheherazade New', serif",
    color: '#a8c8f8',
    fontSize: '1.2rem',
    fontWeight: 'bold',
  },
  drawerClose: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.4)',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  drawerList: {
    background: 'transparent',
    maxHeight: '350px',
    overflowY: 'auto'
  },
  drawerItem: {
    padding: '12px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    cursor: 'pointer',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
    transition: 'background 0.2s ease',
  },
  storyAvatar: {
    width: '45px',
    height: '45px',
    borderRadius: '50%',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.2rem',
    background: 'rgba(0,0,0,0.2)',
  },
  storyInfo: {
    flex: 1,
  },
  storyTitle: {
    fontFamily: "'Scheherazade New', serif",
    fontSize: '1.1rem',
    color: '#fff',
    marginBottom: '2px',
  },
  storyTime: {
    fontSize: '0.8rem',
    color: 'rgba(255,255,255,0.4)',
  },
  viewerBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
    background: 'rgba(5, 15, 40, 0.75)', // Deep space dark translucent
    backdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  viewerCard: {
    background: 'rgba(12, 28, 65, 0.95)',
    backdropFilter: 'blur(30px) saturate(160%)',
    WebkitBackdropFilter: 'blur(30px) saturate(160%)',
    border: '1px solid rgba(168, 200, 248, 0.3)',
    borderRadius: '32px',
    padding: '25px',
    width: 'min(420px, 95vw)',
    boxShadow: '0 30px 70px rgba(0,0,0,0.8), inset 0 0 30px rgba(91,156,246,0.1)',
    direction: 'rtl',
    fontFamily: "'Scheherazade New', serif",
    position: 'relative',
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    paddingBottom: '8px'
  },
  pulseDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#5b9cf6',
    boxShadow: '0 0 10px #5b9cf6'
  },
  title: {
    fontSize: '0.9rem',
    color: 'rgba(168, 200, 248, 0.7)',
    fontWeight: 'bold',
    letterSpacing: '0.3px'
  },
  close: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '0.7rem',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
  },
  content: {
    padding: '4px 0'
  },
  text: {
    fontSize: '1.35rem',
    color: '#f0e8dc',
    lineHeight: 1.5,
    margin: 0,
    textShadow: '0 2px 4px rgba(0,0,0,0.3)'
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '14px',
    paddingTop: '8px',
    borderTop: '1px solid rgba(255,255,255,0.05)'
  },
  timestamp: {
    fontSize: '0.75rem',
    color: 'rgba(168, 200, 248, 0.4)',
    fontStyle: 'italic'
  },
  heartBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.6rem',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  },
  mediaWrapper: {
    width: '100%',
    borderRadius: '16px',
    overflow: 'hidden',
    position: 'relative',
    boxShadow: '0 15px 35px rgba(0,0,0,0.4)',
    border: '1px solid rgba(168, 200, 248, 0.2)',
    marginBottom: '8px'
  },
  mediaImage: {
    width: '100%',
    height: 'auto',
    maxHeight: '280px',
    minHeight: '160px',
    display: 'block',
    objectFit: 'cover',
    transition: 'transform 0.5s ease'
  },
  mediaVideo: {
    width: '100%',
    maxHeight: '280px',
    minHeight: '160px',
    display: 'block',
    objectFit: 'cover'
  },
  videoNoteContainer: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    padding: '10px 0'
  },
  mediaVideoNote: {
    width: '180px',
    height: '180px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid rgba(168, 200, 248, 0.4)',
    boxShadow: '0 0 20px rgba(168, 200, 248, 0.3)'
  },
  voiceContainer: {
    width: '100%',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '16px',
    padding: '20px 15px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px',
    border: '1px solid rgba(168, 200, 248, 0.2)',
    marginBottom: '10px'
  },
  voiceIcon: {
    fontSize: '2.5rem',
    filter: 'drop-shadow(0 0 10px rgba(91, 156, 246, 0.5))'
  },
  voiceAudio: {
    width: '100%',
    height: '40px',
    filter: 'invert(100%) hue-rotate(180deg) brightness(1.5)' // Make native player match dark theme better
  },
  voiceWave: {
    fontSize: '0.9rem',
    color: 'rgba(168, 200, 248, 0.6)',
    fontStyle: 'italic',
    letterSpacing: '0.5px'
  }
}

