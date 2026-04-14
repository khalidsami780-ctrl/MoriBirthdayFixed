import { useState, useRef, useCallback, memo, useEffect, useMemo } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import MediaPreview from '../components/MediaPreview.jsx'
import WorldSwitcher from '../shared/WorldSwitcher.jsx'
import { useLocation } from 'react-router-dom'
import Stars from '../components/Stars.jsx'
import { messages as messagePosts } from '../data/messages.js'
import { tips as advicePosts } from '../data/tips.js'
import { milestones } from '../data/timeCapsule.js'
import { PINNED_MESSAGE_IDS } from '../data/pinnedConfig.js'
import { useTelegramBot } from '../hooks/useTelegramBot.js'
import { useNotifications } from '../hooks/useNotifications.js'

/* ═══════════════════════════════════════════════════════════════
   SHARED ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════════════ */
const fadeUp = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.82, ease: [0.22, 1, 0.36, 1] } },
}
const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.13 } },
}

/* ═══════════════════════════════════════════════════════════════
   SECTION HEADER
   ═══════════════════════════════════════════════════════════════ */
function SectionHeader({ eyebrow, title }) {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={stagger}
      style={{ textAlign: 'center', marginBottom: 'clamp(2rem,5vw,3rem)' }}
    >
      <motion.p variants={fadeUp} style={SH.eyebrow}>{eyebrow}</motion.p>
      <motion.h2 variants={fadeUp} style={SH.title}>{title}</motion.h2>
      <motion.div
        variants={{
          hidden:  { scaleX: 0 },
          visible: { scaleX: 1, transition: { duration: 0.9, ease: [0.22,1,0.36,1] } },
        }}
        style={SH.divider}
      />
    </motion.div>
  )
}
const SH = {
  eyebrow: {
    fontFamily: `'Scheherazade New','Arial',serif`,
    direction: 'rtl', textAlign: 'center',
    fontSize: 'clamp(0.85rem,2.5vw,1rem)',
    color: 'rgba(168,200,248,0.52)', letterSpacing: '0.1em', marginBottom: '0.5rem',
  },
  title: {
    fontFamily: `'Scheherazade New','Arial',serif`,
    direction: 'rtl', textAlign: 'center',
    fontSize: 'clamp(1.6rem,5.5vw,2.5rem)', fontWeight: 700,
    background: 'linear-gradient(135deg,#d4e8ff 0%,#7ec8f0 45%,#e8c97e 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    margin: '0 0 0.25rem', lineHeight: 1.4,
  },
  divider: {
    width: 64, height: 1,
    background: 'linear-gradient(90deg,transparent,rgba(91,156,246,0.65),transparent)',
    margin: '0.75rem auto 0', transformOrigin: 'center',
  },
}

/* ═══════════════════════════════════════════════════════════════
   MESSAGE CARD
   ═══════════════════════════════════════════════════════════════ */
const MessageCard = memo(function MessageCard({ post, delay = 0, pinned = false }) {
  const ref = useRef(null)
  const textRef = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.06 })
  const [isExpanded, setIsExpanded] = useState(false)
  const [needsReadMore, setNeedsReadMore] = useState(false)
  const [hasNotifiedRead, setHasNotifiedRead] = useState(false)
  const { sendReaction, trackMessageRead, trackReaction, trackFavorite } = useTelegramBot()
  const { pushNotification } = useNotifications()

  // Load interaction states from localStorage
  const [isFavorite, setIsFavorite] = useState(() => {
    try {
      const favs = JSON.parse(localStorage.getItem('mori_favorites') || '[]')
      return favs.includes(post.id)
    } catch { return false }
  })

  const validMedia = post.media || []

  // Load reaction from localStorage if it exists
  const [activeEmoji, setActiveEmoji] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('mori_reactions') || '{}')
      return stored[post.id] || null
    } catch { return null }
  })

  const handleReact = (emoji) => {
    setActiveEmoji(emoji)
    try {
      const stored = JSON.parse(localStorage.getItem('mori_reactions') || '{}')
      stored[post.id] = emoji
      localStorage.setItem('mori_reactions', JSON.stringify(stored))

      // Track weekly reaction stats for the professional report (Tablet-only)
      trackReaction(emoji);
    } catch (e) { console.error(e) }

    sendReaction(post.title || "بدون عنوان", emoji)
    pushNotification("تم إرسال الريأكت بنجاح 💙")
  }

  const toggleFavorite = () => {
    const nextState = !isFavorite;
    setIsFavorite(nextState);
    try {
      let favs = JSON.parse(localStorage.getItem('mori_favorites') || '[]')
      if (nextState) {
        if (!favs.includes(post.id)) favs.push(post.id);
      } else {
        favs = favs.filter(id => id !== post.id);
      }
      localStorage.setItem('mori_favorites', JSON.stringify(favs));
      trackFavorite(post.title || "بدون عنوان", nextState);
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    if (!textRef.current) return;
    const observer = new ResizeObserver(() => {
      if (textRef.current) {
        setNeedsReadMore(textRef.current.scrollHeight > 280);
      }
    });
    observer.observe(textRef.current);
    return () => observer.disconnect();
  }, [post.text]);

  return (
    <motion.article
      id={`message-${post.id}`}
      ref={ref}
      initial={{ opacity: 0, y: 28, scale: 0.97 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.78, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{
        ...MC.card,
        ...(pinned ? {
          borderColor: 'rgba(201,168,76,0.45)',
          boxShadow: '0 0 28px rgba(201,168,76,0.12), 0 20px 55px rgba(0,0,0,0.55)',
          borderLeft: '3px solid rgba(201,168,76,0.7)',
        } : {})
      }}
      whileHover={{
        scale: 1.012,
        boxShadow: pinned
          ? '0 0 36px rgba(201,168,76,0.25), 0 20px 55px rgba(0,0,0,0.55)'
          : '0 0 32px rgba(91,156,246,0.18), 0 20px 55px rgba(0,0,0,0.55)',
        borderColor: pinned ? 'rgba(201,168,76,0.65)' : 'rgba(91,156,246,0.3)',
      }}
    >
      {pinned && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          background: 'linear-gradient(135deg, rgba(201,168,76,0.18), rgba(201,168,76,0.08))',
          border: '1px solid rgba(201,168,76,0.35)',
          borderRadius: '999px', padding: '3px 12px',
          marginBottom: '10px',
          fontSize: '0.8rem', color: '#e8c97e',
          fontFamily: `'Scheherazade New', serif`,
          direction: 'rtl',
        }}>
          📌 مثبّتة
        </div>
      )}
      <div style={{ ...MC.topLine, background: pinned ? 'linear-gradient(90deg,transparent,rgba(201,168,76,0.7),transparent)' : undefined }} />

      <time style={MC.date}>
        {new Date(post.createdAt).toLocaleDateString('ar-EG', {
          year: 'numeric', month: 'long', day: 'numeric',
        })}
      </time>

      <h3 style={MC.title}>{post.title}</h3>
      <div style={MC.divider} />
      <div style={MC.quoteIcon}>❝</div>

      <div style={{ position: 'relative' }}>
        <p 
          ref={textRef}
          style={{ 
            ...MC.content, 
            maxHeight: isExpanded ? `${textRef.current?.scrollHeight || 1000}px` : '220px',
            overflow: 'hidden',
            transition: 'max-height 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            maskImage: !isExpanded && needsReadMore 
              ? 'linear-gradient(to bottom, black 60%, transparent 100%)' 
              : 'none',
            WebkitMaskImage: !isExpanded && needsReadMore 
              ? 'linear-gradient(to bottom, black 60%, transparent 100%)' 
              : 'none'
          }}
        >
          {post.text}
        </p>
        
        {needsReadMore && (
          <button 
            onClick={() => {
              setIsExpanded(!isExpanded);
              if (!isExpanded && !hasNotifiedRead) {
                trackMessageRead(post.title);
                setHasNotifiedRead(true);
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#5b9cf6',
              cursor: 'pointer',
              fontFamily: 'inherit',
              padding: '10px 0',
              fontSize: '0.95rem',
              fontWeight: 600,
              display: 'block',
              marginTop: isExpanded ? '10px' : '-20px',
              position: 'relative',
              direction: 'rtl',
              textAlign: 'right',
              width: '100%',
              textDecoration: 'underline'
            }}
          >
            {isExpanded ? 'إخفاء العرض ⌃' : 'إقرأ المزيد …'}
          </button>
        )}
      </div>

      {validMedia.length > 0 && (
        <div style={{ width: '100%', flexShrink: 0, display: 'block', marginTop: '1.5rem' }}>
          <MediaPreview media={validMedia} />
        </div>
      )}

      {post.link && (
        <a href={post.link} target="_blank" rel="noopener noreferrer" style={MC.link}>
          <span>{post.linkLabel || 'رابط مرفق'}</span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      )}

      <div style={MC.footerDivider} />
      <div style={MC.interactionContainer}>
        <div style={MC.reactionRow}>
          {['❤️', '🌹', '🤲', '👎'].map(emoji => (
            <motion.button
              key={emoji}
              whileHover={{ scale: 1.25 }}
              whileTap={{ scale: 0.9 }}
              style={{
                ...MC.emojiBtn,
                ...(activeEmoji === emoji ? MC.activeEmojiBtn : {})
              }}
              onClick={() => handleReact(emoji)}
            >
              {emoji}
            </motion.button>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.05, background: 'rgba(201,168,76,0.08)', borderColor: 'rgba(201,168,76,0.4)' }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleFavorite}
          style={{
            ...MC.favBtn,
            color: isFavorite ? '#e8c97e' : 'rgba(168,200,248,0.5)',
            borderColor: isFavorite ? 'rgba(201,168,76,0.5)' : 'rgba(168,200,248,0.2)',
          }}
        >
          <span>{isFavorite ? '🌟' : '⭐'}</span>
          <span>{isFavorite ? 'In Favorites' : 'Add to favorite'}</span>
        </motion.button>
      </div>
      <p style={MC.note}>
        {`سيظل هذا المكان موجودًا…\nلمن أراد أن يعود يومًا ويقرأ بهدوء`}
      </p>
    </motion.article>
  )
})

const MC = {
  card: {
    position: 'relative',
    background: 'rgba(6,14,46,0.65)',
    backdropFilter: 'blur(26px)', WebkitBackdropFilter: 'blur(26px)',
    border: '1px solid rgba(91,156,246,0.16)',
    borderRadius: 20,
    padding: 'clamp(1.75rem,5vw,3rem) clamp(1.5rem,5vw,2.75rem)',
    boxShadow: '0 12px 44px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
    overflow: 'hidden',
    transition: 'box-shadow 0.35s, border-color 0.35s',
  },
  topLine: {
    position: 'absolute', top: 0, left: '10%', right: '10%', height: 1,
    background: 'linear-gradient(90deg,transparent,rgba(91,156,246,0.42),transparent)',
  },
  date: {
    fontFamily: 'system-ui,sans-serif',
    fontSize: 'clamp(0.56rem,1.4vw,0.64rem)',
    color: 'rgba(168,200,248,0.32)', letterSpacing: '0.08em',
    display: 'block', marginBottom: '0.6rem',
    direction: 'rtl', textAlign: 'right',
  },
  title: {
    fontFamily: `'Scheherazade New','Arial',serif`,
    direction: 'rtl', textAlign: 'right',
    fontSize: 'clamp(1.15rem,3.5vw,1.45rem)', fontWeight: 700,
    color: 'rgba(200,228,255,0.9)', lineHeight: 1.5, margin: '0 0 0.5rem',
  },
  divider: {
    width: 44, height: 1,
    background: 'linear-gradient(90deg,rgba(91,156,246,0.5),transparent)',
    marginLeft: 'auto', marginBottom: '1.1rem',
  },
  quoteIcon: {
    fontFamily: 'Georgia,serif',
    fontSize: 'clamp(2.5rem,7vw,4rem)',
    color: 'rgba(91,156,246,0.15)',
    lineHeight: 1, textAlign: 'right', direction: 'rtl',
    marginBottom: '0.25rem',
  },
  content: {
    fontFamily: `'Scheherazade New','Arial',serif`,
    direction: 'rtl', textAlign: 'right',
    fontSize: 'clamp(1.05rem,3vw,1.2rem)', lineHeight: 2.1,
    color: 'rgba(230,242,255,0.82)',
    whiteSpace: 'pre-line', margin: 0,
  },
  reactionRow: {
    display: 'flex',
    gap: 'clamp(1rem,4vw,1.5rem)',
    justifyContent: 'center',
    marginBottom: '1rem',
    padding: '0.2rem 0'
  },
  emojiBtn: {
    background: 'none',
    border: 'none',
    fontSize: 'clamp(1.4rem,4.5vw,1.8rem)',
    cursor: 'pointer',
    padding: '0.5rem',
    transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), background 0.3s',
    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))',
    borderRadius: '12px',
  },
  activeEmojiBtn: {
    background: 'rgba(91,156,246,0.18)',
    boxShadow: '0 0 15px rgba(91,156,246,0.25)',
    transform: 'scale(1.15)',
  },
  footerDivider: {
    width: 80, height: 1,
    background: 'linear-gradient(90deg,transparent,rgba(91,156,246,0.3),transparent)',
    margin: '2rem auto 1.25rem',
  },
  interactionContainer: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px'
  },
  favBtn: {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px', borderRadius: '16px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(168,200,248,0.2)',
    color: 'rgba(168,200,248,0.6)', fontFamily: "'Scheherazade New', serif", fontSize: '0.92rem',
    cursor: 'pointer', transition: 'all 0.3s ease'
  },
  note: {
    fontFamily: `'Scheherazade New','Arial',serif`,
    direction: 'rtl', textAlign: 'center',
    fontSize: 'clamp(0.88rem,2.4vw,1rem)', lineHeight: 1.9,
    color: 'rgba(168,200,248,0.38)',
    fontStyle: 'italic', whiteSpace: 'pre-line', margin: 0,
  },
  link: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    marginTop: '1rem', padding: '6px 16px', borderRadius: 999,
    border: '1px solid rgba(91,156,246,0.3)', background: 'rgba(91,156,246,0.08)',
    color: 'rgba(168,200,248,0.8)',
    fontFamily: `'Scheherazade New','Arial',serif`, direction: 'rtl',
    fontSize: 'clamp(0.8rem,2vw,0.9rem)', textDecoration: 'none',
    transition: 'background 0.25s, border-color 0.25s, color 0.25s',
  },
}

/* ═══════════════════════════════════════════════════════════════
   ADVICE CARD
   ═══════════════════════════════════════════════════════════════ */
const AdviceCard = memo(function AdviceCard({ post, delay = 0 }) {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.08 })
  const validMedia = post.media || []
  const { sendReaction, trackReaction, trackFavorite } = useTelegramBot()
  const { pushNotification } = useNotifications()

  const [isFavorite, setIsFavorite] = useState(() => {
    try {
      const favs = JSON.parse(localStorage.getItem('mori_favorites') || '[]')
      return favs.includes(post.id)
    } catch { return false }
  })

  // Load reaction from localStorage if it exists
  const [activeEmoji, setActiveEmoji] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('mori_reactions') || '{}')
      return stored[post.id] || null
    } catch { return null }
  })

  const handleReact = (emoji) => {
    setActiveEmoji(emoji)
    try {
      const stored = JSON.parse(localStorage.getItem('mori_reactions') || '{}')
      stored[post.id] = emoji
      localStorage.setItem('mori_reactions', JSON.stringify(stored))

      // Track weekly reaction stats for the professional report (Tablet-only)
      trackReaction(emoji);
    } catch (e) { console.error(e) }

    sendReaction(post.title || "بدون عنوان", emoji)
    pushNotification("تم إرسال الريأكت بنجاح 💙")
  }

  const toggleFavorite = () => {
    const nextState = !isFavorite;
    setIsFavorite(nextState);
    try {
      let favs = JSON.parse(localStorage.getItem('mori_favorites') || '[]')
      if (nextState) {
        if (!favs.includes(post.id)) favs.push(post.id);
      } else {
        favs = favs.filter(id => id !== post.id);
      }
      localStorage.setItem('mori_favorites', JSON.stringify(favs));
      trackFavorite(post.title || "بدون عنوان", nextState);
    } catch (e) { console.error(e) }
  }

  return (
    <motion.article
      id={`tip-${post.id}`}
      ref={ref}
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.72, delay, ease: [0.22, 1, 0.36, 1] }}
      style={AC.card}
      whileHover={{
        scale: 1.018,
        boxShadow: '0 0 32px rgba(91,156,246,0.22), 0 20px 50px rgba(0,0,0,0.55)',
        borderColor: 'rgba(91,156,246,0.3)',
      }}
    >
      <div style={AC.topLine} />
      <time style={AC.date}>
        {new Date(post.createdAt).toLocaleDateString('ar-EG', {
          year: 'numeric', month: 'long', day: 'numeric',
        })}
      </time>
      <h3 style={AC.title}>{post.title}</h3>
      <div style={AC.divider} />
      <p style={AC.content}>{post.text}</p>
      {validMedia.length > 0 && (
        <div style={{ width: '100%', flexShrink: 0, display: 'block' }}>
          <MediaPreview media={validMedia} />
        </div>
      )}
      {post.link && (
        <a href={post.link} target="_blank" rel="noopener noreferrer" style={AC.link}>
          <span>{post.linkLabel || 'اقرأ أكثر'}</span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      )}

      <div style={MC.footerDivider} />
      <div style={MC.interactionContainer}>
        <div style={MC.reactionRow}>
          {['❤️', '🌹', '🤲', '👎'].map(emoji => (
            <motion.button
              key={emoji}
              whileHover={{ scale: 1.25 }}
              whileTap={{ scale: 0.9 }}
              style={{
                ...MC.emojiBtn,
                ...(activeEmoji === emoji ? MC.activeEmojiBtn : {})
              }}
              onClick={() => handleReact(emoji)}
            >
              {emoji}
            </motion.button>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.05, background: 'rgba(201,168,76,0.08)', borderColor: 'rgba(201,168,76,0.4)' }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleFavorite}
          style={{
            ...MC.favBtn,
            color: isFavorite ? '#e8c97e' : 'rgba(168,200,248,0.5)',
            borderColor: isFavorite ? 'rgba(201,168,76,0.5)' : 'rgba(168,200,248,0.2)',
          }}
        >
          <span>{isFavorite ? '🌟' : '⭐'}</span>
          <span>{isFavorite ? 'In Favorites' : 'Add to favorite'}</span>
        </motion.button>
      </div>
    </motion.article>
  )
})

const AC = {
  card: {
    position: 'relative',
    background: 'rgba(6,14,46,0.62)',
    backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)',
    border: '1px solid rgba(91,156,246,0.16)',
    borderRadius: 18,
    padding: 'clamp(1.25rem,4vw,2rem)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
    transition: 'box-shadow 0.35s, border-color 0.35s',
    overflow: 'hidden',
  },
  topLine: {
    position: 'absolute', top: 0, left: '12%', right: '12%', height: 1,
    background: 'linear-gradient(90deg,transparent,rgba(91,156,246,0.4),transparent)',
  },
  date: {
    fontFamily: 'system-ui,sans-serif',
    fontSize: 'clamp(0.56rem,1.4vw,0.64rem)',
    color: 'rgba(168,200,248,0.32)', letterSpacing: '0.08em',
    display: 'block', marginBottom: '0.5rem',
    direction: 'rtl', textAlign: 'right',
  },
  title: {
    fontFamily: `'Scheherazade New','Arial',serif`,
    direction: 'rtl', textAlign: 'right',
    fontSize: 'clamp(1.05rem,3vw,1.3rem)', fontWeight: 600,
    color: 'rgba(200,228,255,0.92)', lineHeight: 1.5, margin: '0 0 0.5rem',
  },
  divider: {
    width: 40, height: 1,
    background: 'linear-gradient(90deg,rgba(91,156,246,0.5),transparent)',
    marginLeft: 'auto', marginBottom: '0.9rem',
  },
  content: {
    fontFamily: `'Scheherazade New','Arial',serif`,
    direction: 'rtl', textAlign: 'right',
    fontSize: 'clamp(1rem,2.8vw,1.15rem)', lineHeight: 2.0,
    color: 'rgba(220,235,255,0.75)', whiteSpace: 'pre-line', margin: 0,
  },
  link: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    marginTop: '1rem', padding: '6px 16px', borderRadius: 999,
    border: '1px solid rgba(91,156,246,0.3)', background: 'rgba(91,156,246,0.08)',
    color: 'rgba(168,200,248,0.8)',
    fontFamily: `'Scheherazade New','Arial',serif`, direction: 'rtl',
    fontSize: 'clamp(0.8rem,2vw,0.9rem)', textDecoration: 'none',
    transition: 'background 0.25s, border-color 0.25s, color 0.25s',
  },
}

/* ═══════════════════════════════════════════════════════════════
   TAB NAV
   ═══════════════════════════════════════════════════════════════ */
function TabNav({ active, onChange }) {
  const tabs = [
    { id: 'messages', label: 'الرسائل' },
    { id: 'advice',   label: 'النصائح' },
    { id: 'covenants', label: 'مواثيقنا' },
  ]
  return (
    <div style={TN.wrap}>
      {tabs.map(t => (
        <button key={t.id}
          style={{ ...TN.tab, color: active === t.id ? '#f0e8dc' : 'rgba(168,200,248,0.55)' }}
          onClick={() => onChange(t.id)}
        >
          {active === t.id && (
            <motion.div layoutId="tab-bg" style={TN.bg}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
          )}
          <span style={{ position: 'relative' }}>{t.label}</span>
        </button>
      ))}
    </div>
  )
}
const TN = {
  wrap: {
    display: 'flex', background: 'rgba(4,10,34,0.82)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(91,156,246,0.22)',
    borderRadius: 999, padding: 3,
    boxShadow: '0 6px 24px rgba(0,0,0,0.5)',
    marginBottom: 'clamp(1.5rem,5vw,2.5rem)',
    flexWrap: 'wrap',
  },
  tab: {
    position: 'relative', flex: 1,
    padding: 'clamp(9px,2.5vw,12px) clamp(22px,5.5vw,40px)',
    borderRadius: 996, border: 'none', background: 'transparent',
    cursor: 'pointer', outline: 'none', WebkitTapHighlightColor: 'transparent',
    fontFamily: `'Scheherazade New','Arial',serif`,
    fontWeight: 600, fontSize: 'clamp(0.95rem,2.5vw,1.15rem)',
    letterSpacing: '0.04em', direction: 'rtl', transition: 'color 0.3s',
  },
  bg: {
    position: 'absolute', inset: 0, borderRadius: 996,
    background: 'linear-gradient(135deg,rgba(52,110,215,0.78),rgba(26,62,145,0.88))',
    boxShadow: '0 0 20px rgba(52,110,215,0.4)',
  },
}

/* ── Pinned Messages (read from pinnedConfig.js) ── */
function MessagesSection({ searchTerm, dateFilter }) {
  const [visibleCount, setVisibleCount] = useState(5)
  const normalizedSearchTerm = searchTerm.trim().toLowerCase()
  const pinnedPosts = useMemo(() => (
    PINNED_MESSAGE_IDS
      .map(id => messagePosts.find(post => post.id === id))
      .filter(Boolean)
  ), [])
  const pinnedIds = useMemo(() => new Set(PINNED_MESSAGE_IDS), [])

  const filtered = useMemo(() => messagePosts.filter(post => {
    if (pinnedIds.has(post.id)) return false
    const matchesSearch = normalizedSearchTerm === '' ||
                         post.title.toLowerCase().includes(normalizedSearchTerm) ||
                         post.text.toLowerCase().includes(normalizedSearchTerm)
    const date = new Date(post.createdAt)
    const matchesYear = dateFilter.year === 'all' || date.getFullYear().toString() === dateFilter.year
    const matchesMonth = dateFilter.month === 'all' || date.getMonth().toString() === dateFilter.month
    return matchesSearch && matchesYear && matchesMonth
  }), [dateFilter.month, dateFilter.year, normalizedSearchTerm, pinnedIds])

  const sorted = useMemo(() => [...filtered].sort((a, b) => b.createdAt - a.createdAt), [filtered])
  const visible = sorted.slice(0, visibleCount)
  const hasMore = visibleCount < sorted.length

  const visiblePinned = useMemo(() => pinnedPosts.filter(post =>
    normalizedSearchTerm === '' ||
    post.title.toLowerCase().includes(normalizedSearchTerm) ||
    post.text.toLowerCase().includes(normalizedSearchTerm)
  ), [normalizedSearchTerm, pinnedPosts])

  return (
    <div style={{ width: '100%', maxWidth: 720, margin: '0 auto' }}>
      <SectionHeader eyebrow="كلمات من القلب" title="الرسائل" />
      {visiblePinned.length > 0 && (
        <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {visiblePinned.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <MessageCard post={post} pinned={true} />
            </motion.div>
          ))}
        </div>
      )}
      {filtered.length === 0 && visiblePinned.length === 0 ? (
        <p style={{ ...SEC.hint, marginTop: '2rem' }}>مفيش رسايل بالاسم ده يا موري.. جربي تبحثي بحاجة تانية 💙</p>
      ) : (
        <>
          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }}
            transition={{ delay:0.35, duration:0.8 }} style={SEC.hint}>
            ستُضاف رسائل جديدة من حين لآخر…
          </motion.p>
          <div style={SEC.list}>
            <AnimatePresence initial={false}>
              {visible.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: i >= visibleCount - 5 ? (i - (visibleCount - 5)) * 0.07 : 0, ease: [0.22,1,0.36,1] }}
                >
                  <MessageCard post={post} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
      {hasMore && (
        <motion.div style={{ textAlign: 'center', marginTop: '1.75rem' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <motion.button
            onClick={() => setVisibleCount(c => c + 5)}
            style={SEC.loadMoreBtn}
            whileHover={{ boxShadow: '0 0 20px rgba(91,156,246,0.3)', borderColor: 'rgba(91,156,246,0.5)', color: 'rgba(200,228,255,0.9)' }}
            whileTap={{ scale: 0.97 }}
          >
            عرض المزيد …
          </motion.button>
        </motion.div>
      )}
    </div>
  )
}

function AdviceSection({ searchTerm, dateFilter }) {
  const [visibleCount, setVisibleCount] = useState(5)
  const normalizedSearchTerm = searchTerm.trim().toLowerCase()
  const filtered = useMemo(() => advicePosts.filter(post => {
    const matchesSearch = normalizedSearchTerm === '' ||
                         post.title.toLowerCase().includes(normalizedSearchTerm) ||
                         post.text.toLowerCase().includes(normalizedSearchTerm)
    const date = new Date(post.createdAt)
    const matchesYear = dateFilter.year === 'all' || date.getFullYear().toString() === dateFilter.year
    const matchesMonth = dateFilter.month === 'all' || date.getMonth().toString() === dateFilter.month
    return matchesSearch && matchesYear && matchesMonth
  }), [dateFilter.month, dateFilter.year, normalizedSearchTerm])

  const sorted = useMemo(() => [...filtered].sort((a, b) => b.createdAt - a.createdAt), [filtered])
  const visible = sorted.slice(0, visibleCount)
  const hasMore = visibleCount < sorted.length

  return (
    <div style={{ width: '100%', maxWidth: 680, margin: '0 auto' }}>
      <SectionHeader eyebrow="نصائح… ل موري" title="النصائح" />
      {filtered.length === 0 ? (
        <p style={{ ...SEC.hint, marginTop: '2rem' }}>مفيش نصائح بالاسم ده يا موري.. جربي تبحثي بحاجة تانية 💙</p>
      ) : (
        <>
          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }}
            transition={{ delay:0.35, duration:0.8 }} style={SEC.hint}>
            ستُضاف كلمات جديدة من حين لآخر… لمن يهمه أن يقرأ
          </motion.p>
          <div style={SEC.list}>
            <AnimatePresence initial={false}>
              {visible.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: i >= visibleCount - 5 ? (i - (visibleCount - 5)) * 0.07 : 0, ease: [0.22,1,0.36,1] }}
                >
                  <AdviceCard post={post} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
      {hasMore && (
        <motion.div style={{ textAlign: 'center', marginTop: '1.75rem' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <motion.button
            onClick={() => setVisibleCount(c => c + 5)}
            style={SEC.loadMoreBtn}
            whileHover={{ boxShadow: '0 0 20px rgba(91,156,246,0.3)', borderColor: 'rgba(91,156,246,0.5)', color: 'rgba(200,228,255,0.9)' }}
            whileTap={{ scale: 0.97 }}
          >
            عرض المزيد …
          </motion.button>
        </motion.div>
      )}
    </div>
  )
}

function CovenantsSection() {
  const currentYear = new Date().getFullYear()
  const allYears = Array.from({ length: 8 }, (_, i) => 2026 + i)
  const archiveYears = allYears.filter(y => y < currentYear).sort((a, b) => b - a)

  return (
    <div style={{ width: '100%', maxWidth: 720, margin: '0 auto' }}>
      <SectionHeader eyebrow="مواثيق باقية" title="مواثيقنا الغالية" />
      <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }}
        transition={{ delay:0.35, duration:0.8 }} style={SEC.hint}>
        تواريخ محفورة بالقلب.. تفتح في موعدها كل عام 💙
      </motion.p>
      <h4 style={{ color: 'rgba(168,200,248,0.6)', fontSize: '0.9rem', marginBottom: '20px', textAlign: 'center', borderBottom: '1px solid rgba(168,200,248,0.1)', paddingBottom: '10px' }}>
        مواثيق عام {currentYear}
      </h4>
      <div style={SEC.list}>
        {milestones.map((milestone, idx) => (
          <CovenantCard key={milestone.id} milestone={milestone} delay={idx * 0.1} />
        ))}
      </div>
      {archiveYears.length > 0 && (
        <div style={{ marginTop: '60px' }}>
          <h4 style={{ 
            color: '#e8c97e', fontSize: '1.4rem', marginBottom: '30px', textAlign: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px'
          }}>
            <span style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, rgba(232,201,126,0.3))' }}></span>
            أرشيف السنين الغالية
            <span style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, rgba(232,201,126,0.3))' }}></span>
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {archiveYears.map((year, idx) => (
              <ArchiveYearBox key={year} year={year} delay={idx * 0.15} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CovenantCard({ milestone, delay }) {
  const [timeLeft, setTimeLeft] = useState('')
  const currentYear = new Date().getFullYear()
  const [isUnlocked, setIsUnlocked] = useState(false)

  useEffect(() => {
    const update = () => {
      const now = new Date()
      const eventDate = new Date(currentYear, milestone.date.month - 1, milestone.date.day)
      const unlocked = now.getTime() >= eventDate.getTime()
      setIsUnlocked(unlocked)
      if (!unlocked) {
        const diff = eventDate - now
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
        setTimeLeft(`${days} يوم و ${hours} ساعة`)
      }
    }
    update()
    const timer = setInterval(update, 60000)
    return () => clearInterval(timer)
  }, [milestone, currentYear])

  const messageData = milestone.yearlyMessages[currentYear]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      style={{
        ...MC.card,
        borderLeft: isUnlocked ? '3px solid #5b9cf6' : '3px solid rgba(168,200,248,0.2)',
        background: isUnlocked ? 'rgba(6,14,46,0.75)' : 'rgba(6,14,46,0.45)',
        padding: '25px',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px', direction: 'rtl' }}>
        <span style={{ fontSize: '2.8rem', opacity: isUnlocked ? 1 : 0.4 }}>{milestone.icon}</span>
        <div style={{ flex: 1 }}>
          <h3 style={{ ...MC.title, color: isUnlocked ? '#f0e8dc' : 'rgba(168,200,248,0.5)', marginBottom: '15px' }}>
            {milestone.title}
          </h3>
          <div style={{ 
            ...MC.content, color: isUnlocked ? 'rgba(230,242,255,0.9)' : 'rgba(168,200,248,0.4)', 
            fontStyle: isUnlocked ? 'normal' : 'italic', lineHeight: '1.8'
          }}>
            {isUnlocked ? (
              <>
                <div style={{ marginBottom: '15px', whiteSpace: 'pre-wrap' }}>{messageData.text}</div>
                {messageData.poem && (
                  <div style={{ 
                    background: 'rgba(232,201,126,0.05)', padding: '20px', borderRadius: '12px', 
                    borderRight: '3px solid #e8c97e', fontFamily: `'Scheherazade New', serif`,
                    fontSize: '1.3rem', color: '#e8c97e', textAlign: 'center',
                    whiteSpace: 'pre-wrap', lineHeight: '2.4', marginTop: '20px'
                  }}>
                    {messageData.poem}
                  </div>
                )}
              </>
            ) : (
              `هذا السر لعام ${currentYear} سوف يفتح ليكي في موعده.. كوني في الانتظار 💙`
            )}
          </div>
          {!isUnlocked && (
            <div style={{ marginTop: '15px', fontSize: '0.85rem', color: '#e8c97e', background: 'rgba(232,201,126,0.1)', padding: '8px 15px', borderRadius: '10px', display: 'inline-block' }}>
              🔒 يفتح بعد: {timeLeft}
            </div>
          )}
          {isUnlocked && (
            <div style={{ marginTop: '15px', fontSize: '0.8rem', color: 'rgba(91,156,246,0.6)', textAlign: 'left', opacity: 0.8 }}>
              — ميثاق المحبة لعام {currentYear} ✨
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function ArchiveYearBox({ year, delay }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5 }}
      style={{
        background: 'rgba(10, 20, 50, 0.4)', borderRadius: '15px',
        border: '1px solid rgba(232, 201, 126, 0.2)', overflow: 'hidden',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
      }}
    >
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '20px 25px', cursor: 'pointer', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center',
          background: isOpen ? 'rgba(232, 201, 126, 0.1)' : 'transparent',
          transition: 'all 0.3s', direction: 'rtl'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '1.8rem' }}>📁</span>
          <div>
            <h3 style={{ margin: 0, color: '#f0e8dc', fontSize: '1.1rem' }}>أرشيف مكاتيب عام {year}</h3>
            <span style={{ fontSize: '0.75rem', color: 'rgba(168,200,248,0.5)' }}>يحتوي على ٤ مواثيق غالية محفورة في الذاكرة</span>
          </div>
        </div>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          style={{ color: '#5b9cf6', fontSize: '1.2rem' }}
        >
          ▼
        </motion.span>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 25px 25px', display: 'flex', flexDirection: 'column', gap: '15px', direction: 'rtl' }}>
              {milestones.map((milestone) => {
                const data = milestone.yearlyMessages[year]
                return (
                  <div key={milestone.id} style={{ 
                    background: 'rgba(232, 201, 126, 0.05)', padding: '20px', 
                    borderRadius: '12px', border: '1px solid rgba(232, 201, 126, 0.1)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', color: '#e8c97e' }}>
                      <span style={{ fontSize: '1.2rem' }}>{milestone.icon}</span>
                      <strong style={{ fontSize: '1rem' }}>{milestone.title}</strong>
                    </div>
                    <div style={{ color: 'rgba(230,242,255,0.85)', fontSize: '0.95rem', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                      {data.text}
                    </div>
                    {data.poem && (
                      <div style={{ 
                        marginTop: '15px', padding: '15px', background: 'rgba(232,201,126,0.03)', 
                        borderRadius: '8px', fontFamily: `'Scheherazade New', serif`,
                        fontSize: '1.1rem', color: '#e8c97e', textAlign: 'center',
                        lineHeight: '2.2', borderRight: '2px solid #e8c97e'
                      }}>
                        {data.poem}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const SEC = {
  hint: {
    fontFamily: `'Scheherazade New','Arial',serif`,
    direction: 'rtl', textAlign: 'center',
    fontSize: 'clamp(0.88rem,2.4vw,1rem)',
    color: 'rgba(168,200,248,0.38)', fontStyle: 'italic',
    letterSpacing: '0.04em', marginBottom: 'clamp(1.5rem,4vw,2.5rem)',
  },
  list: { display: 'flex', flexDirection: 'column', gap: 'clamp(0.85rem,2.5vw,1.35rem)' },
  loadMoreBtn: {
    padding: '0.7rem 2.2rem', borderRadius: 999,
    border: '1px solid rgba(91,156,246,0.28)',
    background: 'rgba(91,156,246,0.06)',
    color: 'rgba(168,200,248,0.7)',
    fontFamily: `'Scheherazade New','Arial',serif`,
    fontSize: 'clamp(0.9rem,2.5vw,1.05rem)',
    direction: 'rtl', cursor: 'pointer', outline: 'none',
    WebkitTapHighlightColor: 'transparent',
    transition: 'box-shadow 0.25s, border-color 0.25s, color 0.25s',
    letterSpacing: '0.04em',
  },
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function MessagesPage() {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'messages')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState({ year: 'all', month: 'all' })
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)
  const handleTab = useCallback(t => setActiveTab(t), [])

  const { trackSectionEntrance } = useTelegramBot()

  useEffect(() => {
    trackSectionEntrance("الرسائل والخواطر 📖")
  }, [trackSectionEntrance])

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab)
    }
  }, [location.state?.tab])

  useEffect(() => {
    if (location.state?.scrollTarget) {
      const timer = setTimeout(() => {
        const el = document.getElementById(location.state.scrollTarget)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          el.classList.add('highlight-glow')
          setTimeout(() => el.classList.remove('highlight-glow'), 2600)
        }
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [location.state?.scrollTarget, activeTab])

  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      transition={{ duration:0.5 }}
      style={{ width:'100%', minHeight:'100dvh', position:'relative', background:'var(--bg-deep)' }}
    >
      <div className="noise-overlay" aria-hidden="true" />
      <Stars count={50} />
      <div className="orb orb-blue"
        style={{ position:'fixed', width:500, height:500, top:'-5%', left:'-10%', opacity:0.07 }}
        aria-hidden="true" />
      <div className="orb orb-blue"
        style={{ position:'fixed', width:380, height:380, bottom:'5%', right:'-8%', opacity:0.06 }}
        aria-hidden="true" />

      <WorldSwitcher />

      <div style={MP.scroll}>
        <div style={MP.inner}>
          <motion.div
            initial={{ opacity:0, y:22 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.8, ease:[0.22,1,0.36,1] }}
            style={{ textAlign:'center', marginBottom:'clamp(1.5rem,4vw,2.5rem)' }}
          >
            <p style={MP.eyebrow}>لمن يهمه الأمر</p>
            <h1 style={MP.pageTitle}>رسائل ونصائح</h1>
            <div style={MP.pageDivider} />
          </motion.div>

          <motion.div
            initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
            transition={{ delay:0.15, duration:0.65 }}
            style={{ 
              display:'flex', flexDirection: 'column', alignItems: 'center', justifyContent:'center',
              gap: '1.5rem', marginBottom: '3rem'
            }}
          >
            <div style={{ 
              ...TN.wrap, 
              flexDirection: isMobile ? 'column' : 'row', 
              borderRadius: isMobile ? '20px' : '999px',
              marginBottom: 0, width: '100%', maxWidth: '600px',
            }}>
              {['messages', 'advice', 'covenants'].map(id => {
                const label = id === 'messages' ? 'الرسائل' : id === 'advice' ? 'النصائح' : 'مواثيقنا'
                return (
                  <button key={id}
                    style={{ 
                      ...TN.tab, 
                      color: activeTab === id ? '#f0e8dc' : 'rgba(168,200,248,0.55)',
                      padding: isMobile ? '14px' : TN.tab.padding
                    }}
                    onClick={() => handleTab(id)}
                  >
                    {activeTab === id && (
                      <motion.div layoutId="tab-bg" style={TN.bg}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
                    )}
                    <span style={{ position: 'relative' }}>{label}</span>
                  </button>
                )
              })}
            </div>

            {activeTab !== 'covenants' && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                style={{ ...F.searchContainer, maxWidth: '600px', margin: 0 }}
              >
                <div style={F.searchBox}>
                  <span style={F.searchIcon}>🔍</span>
                  <input
                     type="text" placeholder="ابحث في الرسائل..." value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     onFocus={(e) => e.target.parentElement.style.boxShadow = '0 0 15px rgba(91,156,246,0.3), inset 0 0 10px rgba(91,156,246,0.1)'}
                     onBlur={(e) => e.target.parentElement.style.boxShadow = 'none'}
                     style={F.searchInput}
                   />
                </div>
                <div style={F.filterRow}>
                  <select 
                    value={dateFilter.year} 
                    onChange={(e) => setDateFilter(prev => ({ ...prev, year: e.target.value }))}
                    style={F.filterSelect}
                  >
                    <option value="all">كل السنين</option>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                  </select>
                  <select 
                    value={dateFilter.month} 
                    onChange={(e) => setDateFilter(prev => ({ ...prev, month: e.target.value }))}
                    style={F.filterSelect}
                  >
                    <option value="all">كل الشهور</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i} value={i}>{new Intl.DateTimeFormat('ar-EG', { month: 'long' }).format(new Date(2024, i))}</option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-12 }}
              transition={{ duration:0.4, ease:[0.22,1,0.36,1] }}
            >
              {activeTab === 'messages' && <MessagesSection searchTerm={searchTerm} dateFilter={dateFilter} />}
              {activeTab === 'advice' && <AdviceSection searchTerm={searchTerm} dateFilter={dateFilter} />}
              {activeTab === 'covenants' && <CovenantsSection />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

const F = {
  searchContainer: {
    display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center',
    marginBottom: '2.5rem', width: '100%', maxWidth: '500px', margin: '0 auto 2.5rem'
  },
  searchBox: {
    position: 'relative', width: '100%', display: 'flex', alignItems: 'center',
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(168,200,248,0.22)',
    borderRadius: '14px', padding: '12px 18px', transition: 'all 0.3s ease-in-out',
    backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
  },
  searchIcon: { marginRight: '12px', opacity: 0.5, fontSize: '1.2rem' },
  searchInput: {
    background: 'transparent', border: 'none', color: '#f0e8dc', outline: 'none',
    width: '100%', fontFamily: `'Scheherazade New', serif`, fontSize: '1.15rem', direction: 'rtl'
  },
  filterRow: {
    display: 'flex', gap: '12px', width: '100%', justifyContent: 'center'
  },
  filterSelect: {
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(168,200,248,0.15)',
    borderRadius: '12px', color: 'rgba(168,200,248,0.85)', padding: '8px 16px',
    fontFamily: `'Scheherazade New', serif`, fontSize: '1rem', outline: 'none', cursor: 'pointer',
    transition: 'all 0.25s ease', flex: 1, minWidth: 0, appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='rgba(168,200,248,0.5)' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'left 12px center',
  }
}

const MP = {
  scroll: {
    overflowY: 'auto', height: '100dvh',
    paddingTop: 'clamp(5.5rem,14vh,8rem)', paddingBottom: '4rem', scrollbarWidth: 'none',
  },
  inner: { width: '100%', maxWidth: 780, margin: '0 auto', padding: '0 clamp(1rem,4vw,2rem)', position: 'relative' },
  eyebrow: {
    fontFamily: `'Scheherazade New','Arial',serif`, direction: 'rtl', textAlign: 'center',
    fontSize: 'clamp(0.82rem,2.5vw,0.96rem)', color: 'rgba(168,200,248,0.48)', letterSpacing: '0.08em', marginBottom: '0.4rem',
  },
  pageTitle: {
    fontFamily: `'Scheherazade New','Arial',serif`, direction: 'rtl', textAlign: 'center',
    fontSize: 'clamp(1.9rem,6.5vw,3rem)', fontWeight: 700,
    background: 'linear-gradient(135deg,#d4e8ff 0%,#7ec8f0 40%,#e8c97e 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    margin: '0 0 0.2rem', lineHeight: 1.3,
  },
  pageDivider: {
    width: 64, height: 1,
    background: 'linear-gradient(90deg,transparent,rgba(91,156,246,0.6),transparent)',
    margin: '0.75rem auto 0',
  },
}
