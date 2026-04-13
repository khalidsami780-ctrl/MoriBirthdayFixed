import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { moodDatabase } from '../data/moodMessages.js'
import { useTelegramBot } from '../hooks/useTelegramBot.js'
import { useNotifications } from '../hooks/useNotifications.js'
import SoulSignals from './SoulSignals.jsx'
import { createPortal } from 'react-dom'

const SIX_DAYS_MS = 6 * 24 * 60 * 60 * 1000

function getCanVentFromStorage() {
  try {
    const lastVentStr = localStorage.getItem('last_safebox_vent')
    if (!lastVentStr) return true
    const lastVent = Number(lastVentStr)
    if (Number.isNaN(lastVent)) return true
    return Date.now() - lastVent >= SIX_DAYS_MS
  } catch {
    return true
  }
}

function formatRemainingTime(lastVent) {
  const diff = SIX_DAYS_MS - (Date.now() - lastVent);
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  if (days > 0) return `${days} يوم و ${hours} ساعة`;
  if (hours > 0) return `${hours} ساعة و ${minutes} دقيقة`;
  return `${minutes} دقيقة`;
}

export default function SafeBox() {
  const navigate = useNavigate()
  const [stage, setStage] = useState('mood_selection') // 'mood_selection' | 'comfort_view' | 'smile' | 'venting'
  const [activeMessage, setActiveMessage] = useState('')
  const [ventMessage, setVentMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [canVent, setCanVent] = useState(getCanVentFromStorage)
  const [selectedMood, setSelectedMood] = useState(null)
  const [shouldPoll, setShouldPoll] = useState(false)
  const comfortTimeoutRef = useRef(null)
  
  const { trackSafeBoxOpen, buildMessageWithMood, pollTelegramReplies, sendPulse, sendEmergency, sendTelegramMessage } = useTelegramBot()
  const { pushNotification } = useNotifications()

  useEffect(() => {
    trackSafeBoxOpen();
  }, [trackSafeBoxOpen])

  useEffect(() => {
    if (shouldPoll) {
      const cleanup = pollTelegramReplies((toastText) => {
        pushNotification(toastText);
      });
      return cleanup;
    }
  }, [shouldPoll, pollTelegramReplies, pushNotification])

  const handleComfortedClick = () => {
    // Notify Khalid that she felt reassured
    if (selectedMood && activeMessage) {
      const moodLabel = moodDatabase[selectedMood]?.label || selectedMood;
      sendTelegramMessage(`📩 موري قرأت رسالة طمأنينة!\n• الحالة: [${moodLabel}]\n• الرسالة:\n"${activeMessage}" 💙`);
    }

    setStage('smile')
    if (comfortTimeoutRef.current) clearTimeout(comfortTimeoutRef.current)
    comfortTimeoutRef.current = setTimeout(() => {
      navigate('/messages')
    }, 2800)
  }

  const handleMoodSelect = (moodKey) => {
    setSelectedMood(moodKey)
    const messages = moodDatabase[moodKey].messages
    const randomIdx = Math.floor(Math.random() * messages.length)
    setActiveMessage(messages[randomIdx])
    setStage('comfort_view')
  }

  useEffect(() => () => {
    if (comfortTimeoutRef.current) clearTimeout(comfortTimeoutRef.current)
  }, [])

  const handleVentingSubmit = async () => {
    if(!ventMessage.trim()) return;
    setIsSubmitting(true);
    const token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || "8511793687:AAGtCOV-QhKjgZxR4XqimtmjyKvtFpcuso8";
    const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID || "1023544625";
    const timestampDate = new Date().toLocaleString('ar-EG');
    const baseText = `🚨 خطاب من صندوق الطمأنينة (SafeBox)\n🕚 الوقت: ${timestampDate}\n\nرسالة مريومتي:\n" ${ventMessage.trim()} "`;
    const text = buildMessageWithMood(selectedMood, baseText);
    
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chat_id: chatId, 
          text: text,
          reply_markup: {
            inline_keyboard: [[
              { text: "💙 وصلتني", callback_data: "reply_received" },
              { text: "🤲 بدعيلك", callback_data: "reply_pray" },
              { text: "✨ أنتِ بخير", callback_data: "reply_ok" }
            ]]
          }
        })
      });
      if (!res.ok) throw new Error("API error");
      localStorage.setItem('last_safebox_vent', Date.now().toString());
      setCanVent(false)
      setShouldPoll(true)
      handleComfortedClick(); 
    } catch (e) {
      console.error(e)
      handleComfortedClick();
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderMessageText = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => (
      <p key={idx} style={S.para}>{line}</p>
    ))
  }

  return createPortal(
    <div style={S.portalRoot}>
      <AnimatePresence>
         <motion.div 
           style={S.overlay}
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           transition={{ duration: 0.6 }}
           onClick={() => { if(stage !== 'smile') navigate('/messages') }}
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
                {/* Close Button - BACK INSIDE SafeBox as requested */}
                {stage !== 'smile' && (
                  <motion.button
                    style={S.absClose}
                    onClick={() => navigate('/messages')}
                    whileHover={{ scale: 1.1, background: 'rgba(255, 255, 255, 0.1)' }}
                    whileTap={{ scale: 0.9 }}
                  >
                    ✕
                  </motion.button>
                )}

                <AnimatePresence mode="wait">
                  
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
                           style={S.emergencyHeart}
                           animate={{ scale: [1, 1.15, 1], boxShadow: ['0 0 10px rgba(255,0,0,0.2)', '0 0 25px rgba(255,0,0,0.5)', '0 0 10px rgba(255,0,0,0.2)'] }}
                           transition={{ repeat: Infinity, duration: 1.5 }}
                           whileTap={{ scale: 0.9 }}
                           onClick={() => {
                             if(window.confirm('هل تريدين إرسال نداء عاجل لدودو دلوقتي؟ ❤️‍🔥 .. هيوصله فوراً إن مريومتي محتاجاه ضروري جداً')) {
                               sendEmergency()
                               alert('تم إرسال النداء لقلبه.. هو معاكي دايماً 💙')
                             }
                           }}
                         >
                           ❤️‍🔥
                         </motion.button>
                         <div style={S.emergencyText}>نداء عاجل</div>
                         <div style={S.emergencyHint}>  زر النداء العاجل استخدميه بس لو فعلاً محتاجاني ضروري دلوقتي.. هيتبعتلي تنبيه فوري  💌</div>
                       </div>

                       <h2 style={S.title}>حاسة بإيه دلوقتي يا مريومتي؟</h2>
                       <div style={S.moodGrid}>
                         {Object.keys(moodDatabase).map(key => (
                           <motion.button
                             key={key}
                             style={S.moodButton}
                             whileHover={{ scale: 1.02, background: 'rgba(255, 255, 255, 0.08)', borderColor: 'rgba(168, 200, 248, 0.4)' }}
                             whileTap={{ scale: 0.98 }}
                             onClick={() => handleMoodSelect(key)}
                           >
                              <span style={S.moodLabel}>{moodDatabase[key].label}</span>
                           </motion.button>
                         ))}
                         
                         <motion.button
                           key="venting"
                           style={S.ventButton}
                           whileHover={{ scale: 1.02, background: 'linear-gradient(90deg, rgba(232, 201, 126, 0.15), rgba(232, 201, 126, 0.05))' }}
                           whileTap={{ scale: 0.98 }}
                           onClick={() => setStage('venting')}
                         >
                            عايزة أفضفضلك بجد 📝
                         </motion.button>
                       </div>

                       <SoulSignals onSendPulse={sendPulse} />
                    </motion.div>
                  )}

                  {/* STAGE 2: Comfort View (Breathing + Message) */}
                  {stage === 'comfort_view' && (
                    <motion.div
                      key="comfort"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      style={S.inner}
                    >
                       <p style={{...S.para, fontSize: '1rem', opacity: 0.7, marginBottom: '10px'}}>تنفسي بهدوء...</p>
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
                       <div style={{fontSize: '5rem', marginBottom: '1rem'}}>😊</div>
                       <h2 style={{...S.title, color: 'var(--gold-light)'}}>Smile My LOML</h2>
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
                       {canVent ? (
                         <>
                           <h2 style={{...S.title, fontSize: '1.4rem'}}>أحكي لدودو... 📝</h2>
                           <p style={{...S.para, fontSize: '1rem', opacity: 0.7, marginBottom: '1.5rem'}}>
                             رسالة واحدة كل أسبوع لضمان إنها تفضل غالية ومميزة..
                           </p>
                           <textarea 
                             style={S.textArea} 
                             placeholder="اكتبي اللي واجع قلبك هنا..."
                             value={ventMessage}
                             onChange={e => setVentMessage(e.target.value)}
                             disabled={isSubmitting}
                           />
                           <div style={{ display: 'flex', gap: '12px', marginTop: '20px', width: '100%' }}>
                              <motion.button 
                                style={{...S.ctaButton, flex: 2, marginTop: 0}} 
                                onClick={handleVentingSubmit}
                                disabled={!ventMessage.trim() || isSubmitting}
                              >
                                {isSubmitting ? 'جاري الإرسال...' : 'إرسال لقلب دودو 💌'}
                              </motion.button>
                              <motion.button 
                                style={{...S.ctaButton, flex: 1, marginTop: 0, background: 'transparent', borderColor: 'rgba(255,255,255,0.1)'}} 
                                onClick={() => setStage('mood_selection')}
                              >
                                إلغاء
                              </motion.button>
                           </div>
                         </>
                       ) : (
                         <div style={{textAlign: 'center'}}>
                            <div style={{fontSize: '3rem', marginBottom: '1rem'}}>⏳</div>
                            <h2 style={S.title}>بطاقتك في حفظ قلبي 💌</h2>
                            <p style={S.para}>هستنى رسالتك الجديدة بعد {formatRemainingTime(Number(localStorage.getItem('last_safebox_vent')))} 💙</p>
                            <motion.button style={S.ctaButton} onClick={() => setStage('mood_selection')}>فهمت</motion.button>
                         </div>
                       )}
                    </motion.div>
                  )}

                </AnimatePresence>
            </motion.div>
         </motion.div>
      </AnimatePresence>
    </div>,
    document.body
  );
}

const S = {
  portalRoot: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none'
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(3, 9, 26, 0.88)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    pointerEvents: 'auto'
  },
  modalContent: {
    background: 'rgba(8, 20, 45, 0.7)',
    border: '1px solid rgba(168, 200, 248, 0.25)',
    borderRadius: '32px',
    width: 'min(92%, 480px)',
    maxHeight: 'min(90%, 850px)',
    overflowY: 'auto',
    padding: 'clamp(25px, 6vh, 40px) clamp(20px, 5vw, 30px)',
    position: 'relative',
    boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
    textAlign: 'center',
    direction: 'rtl',
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(168, 200, 248, 0.3) transparent'
  },
  absClose: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.4rem',
    transition: 'all 0.2s ease',
  },
  inner: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  emergencyRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '20px'
  },
  emergencyHeart: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'rgba(255, 0, 0, 0.1)',
    border: '1px solid rgba(255, 0, 0, 0.4)',
    fontSize: '2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#ff4d4d',
    textShadow: '0 0 10px rgba(255, 0, 0, 0.5)'
  },
  emergencyText: {
    fontFamily: `'Scheherazade New', serif`,
    fontSize: '0.9rem',
    color: 'rgba(255, 77, 77, 0.8)',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  emergencyHint: {
    color: 'rgba(255, 77, 77, 0.5)',
    fontFamily: "'Scheherazade New', serif",
    fontSize: '0.85rem',
    marginTop: '2px',
    maxWidth: '200px',
    lineHeight: '1.4',
    textAlign: 'center'
  },
  title: {
    fontFamily: `'Scheherazade New', serif`,
    fontSize: '1.8rem',
    color: 'var(--blue-200)',
    marginBottom: '25px',
    textShadow: '0 2px 10px rgba(168, 200, 248, 0.2)'
  },
  moodGrid: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  moodButton: {
    width: '100%',
    padding: '16px 20px',
    textAlign: 'right',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(168, 200, 248, 0.15)',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    outline: 'none'
  },
  moodLabel: {
    fontFamily: `'Scheherazade New', serif`,
    fontSize: '1.3rem',
    color: 'var(--cream)'
  },
  ventButton: {
    width: '100%',
    padding: '16px 20px',
    background: 'rgba(232, 201, 126, 0.08)',
    border: '1px solid rgba(232, 201, 126, 0.3)',
    borderRadius: '16px',
    cursor: 'pointer',
    color: 'var(--gold-light)',
    fontFamily: `'Scheherazade New', serif`,
    fontSize: '1.3rem',
    marginTop: '8px'
  },
  breatheContainer: {
    width: '80px',
    height: '80px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px'
  },
  breatheCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'rgba(91, 156, 246, 0.25)',
    border: '1px solid rgba(91, 156, 246, 0.45)',
    boxShadow: '0 0 30px rgba(91, 156, 246, 0.3)'
  },
  breatheCore: {
    position: 'absolute',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    background: 'var(--blue-400)',
    boxShadow: '0 0 15px var(--blue-400)'
  },
  bism: {
    fontFamily: `'Scheherazade New', serif`,
    fontSize: '2rem',
    color: 'var(--gold-light)',
    marginBottom: '20px',
    opacity: 0.9,
    textShadow: '0 2px 15px rgba(232, 201, 126, 0.3)'
  },
  messageBox: {
    width: '100%',
    marginBottom: '30px'
  },
  para: {
    fontFamily: `'Scheherazade New', serif`,
    fontSize: '1.4rem',
    lineHeight: 1.6,
    color: 'var(--cream)',
    margin: '0 0 10px 0'
  },
  ctaButton: {
    background: 'rgba(91, 156, 246, 0.18)',
    border: '1px solid rgba(91, 156, 246, 0.5)',
    color: 'var(--blue-200)',
    padding: '12px 40px',
    borderRadius: '30px',
    fontFamily: `'Scheherazade New', serif`,
    fontSize: '1.3rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: '20px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
  },
  textArea: {
    width: '100%',
    minHeight: '150px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(168, 200, 248, 0.25)',
    borderRadius: '16px',
    padding: '15px',
    color: 'var(--cream)',
    fontFamily: `'Scheherazade New', serif`,
    fontSize: '1.3rem',
    outline: 'none',
    resize: 'none',
    direction: 'rtl',
    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3)'
  }
}
