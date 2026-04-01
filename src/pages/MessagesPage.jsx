import { useState, useRef, useCallback, memo, useEffect } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import MediaPreview from '../components/MediaPreview.jsx'
import WorldSwitcher from '../shared/WorldSwitcher.jsx'
import { useLocation } from 'react-router-dom'
import Stars from '../components/Stars.jsx'
import { messages as messagePosts } from '../data/messages.js'
import { tips as advicePosts } from '../data/tips.js'

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
const MessageCard = memo(function MessageCard({ post, delay = 0 }) {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.06 })

  const validMedia = post.media || []

  return (
    <motion.article
      id={`message-${post.id}`}
      ref={ref}
      initial={{ opacity: 0, y: 28, scale: 0.97 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.78, delay, ease: [0.22, 1, 0.36, 1] }}
      style={MC.card}
      whileHover={{
        scale: 1.012,
        boxShadow: '0 0 32px rgba(91,156,246,0.18), 0 20px 55px rgba(0,0,0,0.55)',
        borderColor: 'rgba(91,156,246,0.3)',
      }}
    >
      <div style={MC.topLine} />

      <time style={MC.date}>
        {new Date(post.createdAt).toLocaleDateString('ar-EG', {
          year: 'numeric', month: 'long', day: 'numeric',
        })}
      </time>

      <h3 style={MC.title}>{post.title}</h3>
      <div style={MC.divider} />
      <div style={MC.quoteIcon}>❝</div>

      <p style={MC.content}>{post.text}</p>

      {/* ── Extracted Media Gallery Multi-Processor ── */}
      {validMedia.length > 0 && (
        <div style={{ width: '100%', flexShrink: 0, display: 'block' }}>
          <MediaPreview media={validMedia} />
        </div>
      )}

      <div style={MC.footerDivider} />
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
  footerDivider: {
    width: 80, height: 1,
    background: 'linear-gradient(90deg,transparent,rgba(91,156,246,0.3),transparent)',
    margin: '2rem auto 1.25rem',
  },
  note: {
    fontFamily: `'Scheherazade New','Arial',serif`,
    direction: 'rtl', textAlign: 'center',
    fontSize: 'clamp(0.88rem,2.4vw,1rem)', lineHeight: 1.9,
    color: 'rgba(168,200,248,0.38)',
    fontStyle: 'italic', whiteSpace: 'pre-line', margin: 0,
  },
}

/* ═══════════════════════════════════════════════════════════════
   ADVICE CARD
═══════════════════════════════════════════════════════════════ */
const AdviceCard = memo(function AdviceCard({ post, delay = 0 }) {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.08 })

  const validMedia = post.media || []

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

      {/* ── Extracted Media Gallery Multi-Processor ── */}
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
          <span style={{ position: 'relative', zIndex: 1 }}>{t.label}</span>
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
    marginBottom: 'clamp(2rem,5vw,3rem)',
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

/* ═══════════════════════════════════════════════════════════════
   SECTION WRAPPERS
═══════════════════════════════════════════════════════════════ */
function MessagesSection() {
  const [visibleCount, setVisibleCount] = useState(5)
  const sorted = [...messagePosts].sort((a, b) => b.createdAt - a.createdAt)
  const visible = sorted.slice(0, visibleCount)
  const hasMore = visibleCount < sorted.length

  return (
    <div style={{ width: '100%', maxWidth: 720, margin: '0 auto' }}>
      <SectionHeader eyebrow="كلمات من القلب" title="الرسائل" />
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

function AdviceSection() {
  const [visibleCount, setVisibleCount] = useState(5)
  const sorted = [...advicePosts].sort((a, b) => b.createdAt - a.createdAt)
  const visible = sorted.slice(0, visibleCount)
  const hasMore = visibleCount < sorted.length

  return (
    <div style={{ width: '100%', maxWidth: 680, margin: '0 auto' }}>
      <SectionHeader eyebrow="نصائح… ل موري" title="النصائح" />
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
  const handleTab = useCallback(t => setActiveTab(t), [])

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab)
    }
  }, [location.state?.tab])

  useEffect(() => {
    if (location.state?.scrollTarget) {
      // Small timeout to allow the tab to render and Framer Motion to paint the DOM geometry
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
        style={{ position:'fixed', width:500, height:500, top:'-5%', left:'-10%', opacity:0.07, zIndex:0 }}
        aria-hidden="true" />
      <div className="orb orb-blue"
        style={{ position:'fixed', width:380, height:380, bottom:'5%', right:'-8%', opacity:0.06, zIndex:0 }}
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
            style={{ display:'flex', justifyContent:'center' }}
          >
            <TabNav active={activeTab} onChange={handleTab} />
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-12 }}
              transition={{ duration:0.4, ease:[0.22,1,0.36,1] }}
            >
              {activeTab === 'messages' ? <MessagesSection /> : <AdviceSection />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

const MP = {
  scroll: {
    overflowY: 'auto', height: '100dvh',
    paddingTop: 'clamp(5.5rem,14vh,8rem)', paddingBottom: '4rem', scrollbarWidth: 'none',
  },
  inner: {
    width: '100%', maxWidth: 780, margin: '0 auto',
    padding: '0 clamp(1rem,4vw,2rem)', position: 'relative', zIndex: 1,
  },
  eyebrow: {
    fontFamily: `'Scheherazade New','Arial',serif`,
    direction: 'rtl', textAlign: 'center',
    fontSize: 'clamp(0.82rem,2.5vw,0.96rem)',
    color: 'rgba(168,200,248,0.48)', letterSpacing: '0.08em', marginBottom: '0.4rem',
  },
  pageTitle: {
    fontFamily: `'Scheherazade New','Arial',serif`,
    direction: 'rtl', textAlign: 'center',
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