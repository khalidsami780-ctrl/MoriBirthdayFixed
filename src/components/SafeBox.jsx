import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { moodDatabase } from '../data/moodMessages.js'
import { useTelegram } from '../context/TelegramContextCore.jsx'
import { useNotifications } from '../hooks/useNotifications.js'
import { useCooldown, formatTime } from '../hooks/useCooldown.js'
import SoulSignals from './SoulSignals.jsx'
import SafeBoxInput from './SafeBoxInput.jsx'
import SafeBoxGuide from './SafeBoxGuide.jsx'
import { createPortal } from 'react-dom'

const DISPLAY_COOLDOWN_MS = 6 * 24 * 60 * 60 * 1000
const ACTUAL_COOLDOWN_MS  = 3 * 24 * 60 * 60 * 1000

function checkLock(type) {
  try {
    const lastVent = Number(localStorage.getItem(`last_vent_${type}`));
    if (!lastVent) return false;
    return (Date.now() - lastVent) < ACTUAL_COOLDOWN_MS;
  } catch {
    return false;
  }
}

function formatRemainingTime(lastVent) {
  const diff = DISPLAY_COOLDOWN_MS - (Date.now() - lastVent);
  if (diff <= 0) return null;
  const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours   = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  if (days > 0)  return `${days} يوم و ${hours} ساعة`;
  if (hours > 0) return `${hours} ساعة و ${minutes} دقيقة`;
  return `${minutes} دقيقة`;
}

// ─── Hesitation threshold — draft must exceed this to count ──────────────────
const HESITATION_THRESHOLD = 50;

export default function SafeBox() {
  const navigate = useNavigate()
  const [stage, setStage]               = useState('mood_selection')
  const [activeMessage, setActiveMessage] = useState('')
  const [ventMessage, setVentMessage]   = useState(() => localStorage.getItem('mori_safebox_draft') || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showGuide, setShowGuide]       = useState(false)
  const [locks, setLocks] = useState({
    text:  checkLock('text'),
    voice: checkLock('voice'),
    media: checkLock('media'),
  })
  const [selectedMood, setSelectedMood]   = useState(null)
  const [shouldPoll, setShouldPoll]       = useState(false)
  const comfortTimeoutRef                 = useRef(null)

  // ── Hesitation Tracking Refs ──────────────────────────────────────────────
  // maxDraftLength: the peak character count reached while in venting stage
  // hesitationFired: prevents double-firing if already sent this stage visit
  const maxDraftLengthRef  = useRef(0)
  const hesitationFiredRef = useRef(false)

  const {
    trackSafeBoxOpen, buildMessageWithMood, pollTelegramReplies,
    sendPulse, sendEmergency, sendTelegramMessage, sendTelegramMedia,
    trackMood, trackSectionEntrance, trackMessageViewed,
    trackHesitation,
  } = useTelegram()

  const { remainingTime: urgentRemaining, isActive: urgentActive } = useCooldown('urgent_call', 5 * 60 * 1000);

  const { pushNotification } = useNotifications()

  // ── Lifecycle: track entrance, open count ─────────────────────────────────

  useEffect(() => {
    trackSafeBoxOpen()
    trackSectionEntrance('صندوق الأمان (SafeBox)')
  }, [trackSafeBoxOpen, trackSectionEntrance])

  // ── Polling: only active after a message send ─────────────────────────────

  useEffect(() => {
    if (!shouldPoll) return
    const cleanup = pollTelegramReplies((toastText) => {
      pushNotification(toastText)
    })
    return cleanup
  }, [shouldPoll, pollTelegramReplies, pushNotification])

  // ── Draft auto-save (skip during submission to avoid race) ───────────────

  useEffect(() => {
    if (!isSubmitting) {
      localStorage.setItem('mori_safebox_draft', ventMessage)
    }
  }, [ventMessage, isSubmitting])

  // ── Hesitation: track peak draft length while typing ─────────────────────

  useEffect(() => {
    if (stage !== 'venting') return
    if (ventMessage.length > maxDraftLengthRef.current) {
      maxDraftLengthRef.current = ventMessage.length
      // If they start typing again after we were about to fire, reset the gate
      hesitationFiredRef.current = false
    }
  }, [ventMessage, stage])

  // ── Hesitation: fire when leaving venting stage without sending ───────────
  // Triggers when:
  //   1. Stage changes AWAY from 'venting'
  //   2. Peak draft was meaningful (> threshold)
  //   3. Not mid-submission
  //   4. Not already fired this venting visit

  useEffect(() => {
    if (stage === 'venting') {
      // Reset gate on each fresh venting entry
      hesitationFiredRef.current = false
      return
    }

    if (
      maxDraftLengthRef.current > HESITATION_THRESHOLD &&
      !isSubmitting &&
      !hesitationFiredRef.current
    ) {
      hesitationFiredRef.current = true
      maxDraftLengthRef.current  = 0
      trackHesitation()
    }
  }, [stage, isSubmitting, trackHesitation])

  // ── Hesitation: fire on unmount (navigate away with long unsent draft) ────

  useEffect(() => {
    return () => {
      const draftLength = localStorage.getItem('mori_safebox_draft')?.length || 0
      if (
        draftLength > HESITATION_THRESHOLD &&
        !hesitationFiredRef.current
      ) {
        hesitationFiredRef.current = true
        trackHesitation()
      }
    }
  }, [trackHesitation])

  // ── Comfort callback ──────────────────────────────────────────────────────

  const handleComfortedClick = () => {
    if (selectedMood && activeMessage) {
      const moodLabel = moodDatabase[selectedMood]?.label || selectedMood
      sendTelegramMessage(
        `📩 موري قرأت رسالة طمأنينة!\n• الحالة: [${moodLabel}]\n• الرسالة:\n"${activeMessage}" 💙`
      )
    }
    setStage('smile')
    if (comfortTimeoutRef.current) clearTimeout(comfortTimeoutRef.current)
    comfortTimeoutRef.current = setTimeout(() => navigate('/messages'), 2800)
  }

  // ── Mood Selection ────────────────────────────────────────────────────────

  const handleMoodSelect = (moodKey) => {
    setSelectedMood(moodKey)
    const messages  = moodDatabase[moodKey].messages
    const randomIdx = Math.floor(Math.random() * messages.length)
    setActiveMessage(messages[randomIdx])

    trackMood(moodKey)
    localStorage.setItem('mori_active_mood', moodKey)
    localStorage.setItem('mori_mood_set_time', Date.now().toString())

    const moodLabel = moodDatabase[moodKey]?.label || moodKey
    trackMessageViewed(`رسالة طمأنينة لحالة [${moodLabel}]`, messages[randomIdx])

    setStage('comfort_view')
  }

  // ── Cleanup on unmount ────────────────────────────────────────────────────

  useEffect(() => () => {
    if (comfortTimeoutRef.current) clearTimeout(comfortTimeoutRef.current)
  }, [])

  // ── Lock refresh ──────────────────────────────────────────────────────────

  const refreshLocks = () => setLocks({
    text:  checkLock('text'),
    voice: checkLock('voice'),
    media: checkLock('media'),
  })

  // ── Submit Handlers ───────────────────────────────────────────────────────

  const handleTextSubmit = async (text) => {
    if (locks.text || !text.trim()) return
    setIsSubmitting(true)

    // Clear hesitation — user DID send something
    hesitationFiredRef.current = true
    maxDraftLengthRef.current  = 0

    const timestampDate = new Date().toLocaleString('ar-EG')
    const baseText = (
      `🚨 خطاب من صندوق الطمأنينة (SafeBox)\n🕚 الوقت: ${timestampDate}\n\nرسالة مريومتي:\n" ${text.trim()} "`
    )
    const finalMsg = buildMessageWithMood(selectedMood, baseText)

    try {
      await sendTelegramMessage(finalMsg, {
        reply_markup: {
          inline_keyboard: [[
            { text: '💙 وصلتني',  callback_data: 'reply_received' },
            { text: '🤲 بدعيلك', callback_data: 'reply_pray'     },
            { text: '✨ أنتِ بخير', callback_data: 'reply_ok'   },
          ]],
        },
      })
      localStorage.removeItem('mori_safebox_draft')
      localStorage.setItem('last_vent_text', Date.now().toString())
      refreshLocks()
      setShouldPoll(true)
      setVentMessage('')
      handleComfortedClick()
    } catch (e) {
      console.error(e)
      handleComfortedClick()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVoiceSubmit = async (audioBlob) => {
    if (locks.voice) return
    setIsSubmitting(true)
    hesitationFiredRef.current = true // voice = intentional send
    const timestampDate = new Date().toLocaleString('ar-EG')
    const caption = `🎤 بصمة صوتية من مريومتي في صندوق الأمان 💙\n🕚 الوقت: ${timestampDate}`
    try {
      await sendTelegramMedia('voice', audioBlob, caption)
      localStorage.setItem('last_vent_voice', Date.now().toString())
      refreshLocks()
      handleComfortedClick()
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMediaSubmit = async (type, file) => {
    if (locks.media) return
    setIsSubmitting(true)
    hesitationFiredRef.current = true
    const timestampDate = new Date().toLocaleString('ar-EG')
    const caption = `📎 ميديا من مريومتي (${type}) 💙\n🕚 الوقت: ${timestampDate}`
    try {
      await sendTelegramMedia(type, file, caption)
      localStorage.setItem('last_vent_media', Date.now().toString())
      refreshLocks()
      handleComfortedClick()
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderMessageText = (text) => {
    if (!text) return null
    return text.split('\n').map((line, idx) => (
      <p key={idx} style={S.para}>{line}</p>
    ))
  }

  // ─────────────────────────────────────────────────────────────────────────

  return createPortal(
    <div style={S.portalRoot}>
      <AnimatePresence>
        <motion.div
          style={S.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          onClick={() => { if (stage !== 'smile') navigate('/messages') }}
        >
          <motion.div
            style={S.modalContent}
            className="safebox-scroll"
            onClick={e => e.stopPropagation()}
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ duration: 0.5, type: 'spring', damping: 25 }}
          >
            {stage !== 'smile' && (
              <motion.button
                style={S.absClose}
                onClick={() => navigate('/messages')}
                whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.9 }}
              >
                ✕
              </motion.button>
            )}

            <AnimatePresence mode="wait">

              {/* STAGE 1: Mood Selection */}
              {stage === 'mood_selection' && (
                <motion.div
                  key="moods"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={S.inner}
                >
                  <div style={S.emergencyRow}>
                    <motion.button
                      style={{
                        ...S.emergencyHeart,
                        opacity: urgentActive ? 0.6 : 1,
                        cursor: urgentActive ? 'default' : 'pointer'
                      }}
                      animate={{ 
                        scale: urgentActive ? [1, 1.05, 1] : [1, 1.25, 1], 
                        boxShadow: urgentActive 
                          ? ['0 0 5px rgba(255,0,0,0.1)', '0 0 10px rgba(255,0,0,0.2)', '0 0 5px rgba(255,0,0,0.1)']
                          : ['0 0 15px rgba(255,0,0,0.3)', '0 0 45px rgba(255,0,0,0.7)', '0 0 15px rgba(255,0,0,0.3)']
                      }}
                      transition={{ repeat: Infinity, duration: urgentActive ? 3 : 1.5 }}
                      whileTap={{ scale: urgentActive ? 1 : 0.9 }}
                      disabled={urgentActive}
                      onClick={() => {
                        if (urgentActive) return;
                        if (window.confirm('هل تريدين إرسال نداء عاجل لدودو دلوقتي؟ ❤️‍🔥 .. هيوصله فوراً إن مريومتي محتاجاه ضروري جداً')) {
                          sendEmergency('SafeBox', moodDatabase[selectedMood]?.label || 'distress')
                          alert('تم إرسال النداء لقلبه.. هو معاكي دايماً 💙')
                        }
                      }}
                    >
                      {urgentActive ? '⏳' : '❤️‍🔥'}
                    </motion.button>
                    <div style={{...S.emergencyText, color: urgentActive ? 'rgba(255,255,255,0.4)' : '#ff4d4d'}}>
                      {urgentActive ? formatTime(urgentRemaining) : 'نداء عاجل'}
                    </div>
                    <div style={S.emergencyHint}>
                      {urgentActive 
                        ? 'تم إرسال النداء بنجاح.. تقدري تبعتي نداء تاني كمان شوية لو لسه محتاجاه'
                        : 'زر النداء العاجل استخدميه بس لو فعلاً محتاجاني ضروري دلوقتي.. هيتبعتلي تنبيه فوري 💌'}
                    </div>
                  </div>

                  <h2 style={S.title}>حاسة بإيه دلوقتي يا مريومتي؟</h2>
                  <div style={S.moodGrid}>
                    {Object.keys(moodDatabase).map(key => (
                      <motion.button
                        key={key}
                        style={S.moodButton}
                        whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(168,200,248,0.4)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleMoodSelect(key)}
                      >
                        <span style={S.moodLabel}>{moodDatabase[key].label}</span>
                      </motion.button>
                    ))}

                    <motion.button
                      key="venting"
                      style={S.ventButton}
                      whileHover={{ scale: 1.02, background: 'linear-gradient(90deg, rgba(232,201,126,0.15), rgba(232,201,126,0.05))' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStage('venting')}
                    >
                      عايزة أفضفضلك بجد 📝
                    </motion.button>

                    <motion.button
                      key="guide"
                      style={{ ...S.ventButton, background: 'rgba(168,200,248,0.1)', borderColor: 'rgba(168,200,248,0.2)', marginTop: '10px' }}
                      whileHover={{ scale: 1.02, background: 'rgba(168,200,248,0.15)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowGuide(true)}
                    >
                      📖 دليل الاستخدام السريع
                    </motion.button>
                  </div>

                  <SoulSignals onSendPulse={sendPulse} />
                </motion.div>
              )}

              {/* STAGE 2: Comfort View */}
              {stage === 'comfort_view' && (
                <motion.div
                  key="comfort"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  style={S.inner}
                >
                  <p style={{ ...S.para, fontSize: '1rem', opacity: 0.7, marginBottom: '10px' }}>تنفسي بهدوء...</p>
                  <div style={S.breatheContainer}>
                    <motion.div
                      style={S.breatheCircle}
                      animate={{ scale: [1, 1.6, 1] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <div style={S.breatheCore} />
                  </div>

                  <motion.h3
                    style={S.bism}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
                  </motion.h3>

                  <div style={S.messageBox}>
                    {renderMessageText(activeMessage)}
                  </div>

                  <motion.button
                    style={S.ctaButton}
                    onClick={handleComfortedClick}
                    whileHover={{ scale: 1.05, background: 'var(--blue-400)', color: '#fff' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    اطمأنيت 💙
                  </motion.button>
                </motion.div>
              )}

              {/* STAGE 3: Smile */}
              {stage === 'smile' && (
                <motion.div
                  key="smile"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={S.inner}
                >
                  <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>😊</div>
                  <h2 style={{ ...S.title, color: 'var(--gold-light)' }}>Smile My LOML</h2>
                </motion.div>
              )}

              {/* STAGE 4: Venting */}
              {stage === 'venting' && (
                <motion.div
                  key="venting"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={S.inner}
                >
                  <h2 style={{ ...S.title, fontSize: '1.4rem' }}>صندوق الطمأنينة 🕊️</h2>
                  <p style={{ ...S.para, fontSize: '1rem', opacity: 0.7, marginBottom: '2rem' }}>
                    كلماتك وصوتك رزق لقلبي.. شاركيني اللي في بالك بكل حرية 💙
                  </p>

                  <SafeBoxInput
                    onSend={handleTextSubmit}
                    onVoiceSend={handleVoiceSubmit}
                    onMediaSend={handleMediaSubmit}
                    locks={locks}
                    placeholder="اكتبي حاجة لخالد من قلبك..."
                    value={ventMessage}
                    onChange={setVentMessage}
                  />

                  <motion.button
                    style={{ ...S.ctaButton, width: 'auto', padding: '10px 30px', background: 'transparent', borderColor: 'rgba(255,255,255,0.1)', marginTop: '20px' }}
                    onClick={() => setStage('mood_selection')}
                  >
                    رجوع
                  </motion.button>
                </motion.div>
              )}

            </AnimatePresence>

            <AnimatePresence>
              {showGuide && <SafeBoxGuide onClose={() => setShowGuide(false)} />}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles — unchanged from original to avoid visual regressions
// ─────────────────────────────────────────────────────────────────────────────

const S = {
  portalRoot: {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none',
  },
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(3, 9, 26, 0.88)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', pointerEvents: 'auto',
  },
  modalContent: {
    background: 'rgba(8, 20, 45, 0.7)', border: '1px solid rgba(168, 200, 248, 0.25)',
    borderRadius: '32px', width: 'min(95%, 750px)', maxHeight: 'min(95%, 900px)',
    overflowY: 'auto', padding: 'clamp(25px, 6vh, 50px) clamp(20px, 5vw, 40px)',
    position: 'relative', boxShadow: '0 25px 80px rgba(0,0,0,0.6)', textAlign: 'center',
    direction: 'rtl', scrollbarWidth: 'thin', scrollbarColor: 'rgba(168, 200, 248, 0.3) transparent',
  },
  absClose: {
    position: 'absolute', top: '12px', right: '12px', width: '40px', height: '40px',
    borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
    color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.4rem', transition: 'all 0.2s ease',
  },
  inner: { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  emergencyRow: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '20px' },
  emergencyHeart: {
    width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,0,0,0.1)',
    border: '1px solid rgba(255,0,0,0.4)', fontSize: '2rem', display: 'flex',
    alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ff4d4d',
    textShadow: '0 0 10px rgba(255,0,0,0.5)',
  },
  emergencyText: {
    fontFamily: `'Scheherazade New', serif`, fontSize: '0.9rem', color: 'rgba(255,77,77,0.8)',
    fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px',
  },
  emergencyHint: {
    color: 'rgba(255,77,77,0.5)', fontFamily: "'Scheherazade New', serif", fontSize: '0.85rem',
    marginTop: '2px', maxWidth: '200px', lineHeight: '1.4', textAlign: 'center',
  },
  title: {
    fontFamily: `'Scheherazade New', serif`, fontSize: '1.8rem', color: 'var(--blue-200)',
    marginBottom: '25px', textShadow: '0 2px 10px rgba(168,200,248,0.2)',
  },
  moodGrid: { width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' },
  moodButton: {
    width: '100%', padding: '16px 20px', textAlign: 'right', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(168,200,248,0.15)', borderRadius: '16px', cursor: 'pointer',
    transition: 'all 0.3s ease', outline: 'none',
  },
  moodLabel: { fontFamily: `'Scheherazade New', serif`, fontSize: '1.3rem', color: 'var(--cream)' },
  ventButton: {
    width: '100%', padding: '16px 20px', background: 'rgba(232,201,126,0.08)',
    border: '1px solid rgba(232,201,126,0.3)', borderRadius: '16px', cursor: 'pointer',
    color: 'var(--gold-light)', fontFamily: `'Scheherazade New', serif`, fontSize: '1.3rem', marginTop: '8px',
  },
  breatheContainer: {
    width: '80px', height: '80px', position: 'relative', display: 'flex',
    alignItems: 'center', justifyContent: 'center', marginBottom: '20px',
  },
  breatheCircle: {
    width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(91,156,246,0.25)',
    border: '1px solid rgba(91,156,246,0.45)', boxShadow: '0 0 30px rgba(91,156,246,0.3)',
  },
  breatheCore: { position: 'absolute', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--blue-400)', boxShadow: '0 0 15px var(--blue-400)' },
  bism: {
    fontFamily: `'Scheherazade New', serif`, fontSize: '2rem', color: 'var(--gold-light)',
    marginBottom: '20px', opacity: 0.9, textShadow: '0 2px 15px rgba(232,201,126,0.3)',
  },
  messageBox: { width: '100%', marginBottom: '30px' },
  para: { fontFamily: `'Scheherazade New', serif`, fontSize: '1.4rem', lineHeight: 1.6, color: 'var(--cream)', margin: '0 0 10px 0' },
  ctaButton: {
    background: 'rgba(91,156,246,0.18)', border: '1px solid rgba(91,156,246,0.5)',
    color: 'var(--blue-200)', padding: '12px 40px', borderRadius: '30px',
    fontFamily: `'Scheherazade New', serif`, fontSize: '1.3rem', fontWeight: '600',
    cursor: 'pointer', transition: 'all 0.3s ease', marginTop: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
  },
}