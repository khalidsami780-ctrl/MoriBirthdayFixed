import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTelegramBot } from '../hooks/useTelegramBot'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'

/**
 * LiveNote Component
 * Displays a floating, interactive message from Khalid that updates in real-time.
 */
export default function LiveNote() {
  const [note, setNote] = useState(null)
  const [show, setShow] = useState(false)
  const [hasReacted, setHasReacted] = useState(false)
  const { pollTelegramReplies, sendNoteReaction } = useTelegramBot()

  const isMedia = note && (note.type === 'image' || note.type === 'video' || note.type === 'video_note');

  useEffect(() => {
    const loadNote = async () => {
      try {
        // 1. Initial Load from Supabase (shared truth)
        const { data: cloudNoteArr, error } = await supabase
          .from('live_note')
          .select('data, timestamp')
          .eq('id', 1)
          .single();

        let currentNote = null;
        if (!error && cloudNoteArr?.data) {
          currentNote = cloudNoteArr.data;
        } else {
          // Fallback to local if cloud is empty or error
          const local = localStorage.getItem('mori_live_note');
          if (local) currentNote = JSON.parse(local);
        }

        if (currentNote) {
          const dismissed = localStorage.getItem('mori_live_note_dismissed');
          const reacted = localStorage.getItem(`mori_live_note_reacted_${currentNote.timestamp}`);
          
          if (dismissed !== String(currentNote.timestamp)) {
            setNote(currentNote);
            setShow(true);
            setHasReacted(reacted === 'true');
          } else {
            setNote(currentNote);
            setHasReacted(reacted === 'true');
          }
        }
      } catch (e) {
        console.warn("LiveNote mount fetch failed", e);
      }
    };

    loadNote();

    // 2. Real-time Subscription
    const channel = supabase
      .channel('live_note_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_note' }, (payload) => {
        if (payload.new && payload.new.data) {
          const newNote = payload.new.data;
          setNote(newNote);
          setShow(true);
          
          // New note arrived -> check if THIS device reacted to it (usually false for fresh note)
          const reacted = localStorage.getItem(`mori_live_note_reacted_${newNote.timestamp}`);
          setHasReacted(reacted === 'true');

          // Persist locally too
          localStorage.setItem('mori_live_note', JSON.stringify(newNote));
        }
      })
      .subscribe();

    // 3. Keep existing bot polling cleanup
    const botCleanup = pollTelegramReplies(
      () => {}, 
      (newNote) => {
        // We handle logic via Supabase real-time now for multi-device sync,
        // but keeping this hook ensures the active polling device updates instantly.
        setNote(newNote);
        setShow(true);
        const reacted = localStorage.getItem(`mori_live_note_reacted_${newNote.timestamp}`);
        setHasReacted(reacted === 'true');
      }
    );

    return () => {
      botCleanup();
      supabase.removeChannel(channel);
    };
  }, [pollTelegramReplies]);

  const handleHeart = () => {
    if (hasReacted || !note) return
    sendNoteReaction(note)
    setHasReacted(true)
    // Persist reaction locally to this device
    localStorage.setItem(`mori_live_note_reacted_${note.timestamp}`, 'true');
  }

  const formatTime = (ts) => {
    if (!ts) return "وصلت الآن ⚡"
    try {
      const date = new Date(ts)
      return `أرسلت في ${date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true })} ⚡`
    } catch {
      return "وصلت الآن ⚡"
    }
  }

  const handleDismiss = () => {
    setShow(false)
    if (note && note.timestamp) {
      localStorage.setItem('mori_live_note_dismissed', String(note.timestamp))
    }
  }

  return createPortal(
    <AnimatePresence>
      {show && note && (
        <motion.div
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0.2}
          initial={{ x: -100, opacity: 0, scale: 0.8 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: -100, opacity: 0, scale: 0.8 }}
          style={S.container}
        >
          <div style={S.card}>
            <div style={S.header}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={S.pulseDot} />
                <span style={S.title}>رسالة لكِ من قلب خالد 💌</span>
              </div>
              <button 
                onClick={handleDismiss} 
                style={S.close}
                title="إخفاء"
              >
                ✕
              </button>
            </div>
            
            <div style={S.content}>
               {note.type === 'image' && (
                 <div style={S.mediaWrapper}>
                    <motion.img 
                      src={note.url} 
                      alt="Live Photo" 
                      style={S.mediaImage}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                    />
                 </div>
               )}
               
               {note.type === 'video' && (
                 <div style={S.mediaWrapper}>
                   <motion.video
                     src={note.url}
                     controls
                     autoPlay
                     muted
                     loop
                     playsInline
                     style={S.mediaVideo}
                   />
                 </div>
               )}

               {note.type === 'video_note' && (
                 <div style={S.videoNoteContainer}>
                    <motion.video
                      src={note.url}
                      autoPlay
                      muted
                      loop
                      playsInline
                      style={S.mediaVideoNote}
                    />
                 </div>
               )}

               <p style={{...S.text, marginTop: isMedia ? '12px' : '0'}}>{note.text || (typeof note === 'string' ? note : "")}</p>
            </div>

            <div style={S.footer}>
              <div style={S.timestamp}>{formatTime(note.timestamp)}</div>
              <motion.button
                whileHover={{ scale: 1.3, color: '#ff4d4d' }}
                whileTap={{ scale: 0.9 }}
                onClick={handleHeart}
                style={{
                  ...S.heartBtn, 
                  color: hasReacted ? '#ff4d4d' : 'rgba(255,255,255,0.3)',
                  filter: hasReacted ? 'drop-shadow(0 0 8px rgba(255,77,77,0.4))' : 'none'
                }}
              >
                {hasReacted ? '❤️' : '🤍'}
              </motion.button>
            </div>
            
            <div style={S.dragHint}>اسحبي الرسالة لتحريكها</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

const S = {
  container: {
    position: 'fixed',
    bottom: '90px', // Above the music player
    left: '20px',
    zIndex: 99999,
    width: 'min(280px, 85vw)',
    pointerEvents: 'auto',
    cursor: 'grab'
  },
  card: {
    background: 'rgba(10, 25, 60, 0.85)',
    backdropFilter: 'blur(25px) saturate(160%)',
    WebkitBackdropFilter: 'blur(25px) saturate(160%)',
    border: '1px solid rgba(168, 200, 248, 0.35)',
    borderRadius: '24px',
    padding: '18px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.6), inset 0 0 20px rgba(91,156,246,0.1)',
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
  dragHint: {
    position: 'absolute',
    bottom: '4px',
    left: '0',
    right: '0',
    textAlign: 'center',
    fontSize: '0.55rem',
    color: 'rgba(255,255,255,0.15)',
    textTransform: 'uppercase',
    letterSpacing: '1px'
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
  }
}
