import { useEffect, useCallback } from 'react';
import { moodDatabase } from '../data/moodMessages.js';

const TELEGRAM_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || "8511793687:AAGtCOV-QhKjgZxR4XqimtmjyKvtFpcuso8";
const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID || "1023544625";

const isMoriDevice = () => {
  const isTouch = navigator.maxTouchPoints > 0
  const ua = navigator.userAgent.toLowerCase()
  const isMobileOrTablet = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)
  const isIPadOS = (ua.includes('macintosh') && navigator.maxTouchPoints > 1)
  return isTouch || isMobileOrTablet || isIPadOS
}

const isTabletSpecific = () => {
  const ua = navigator.userAgent.toLowerCase();
  const isIPad = /ipad/.test(ua) || (ua.includes('macintosh') && navigator.maxTouchPoints > 1);
  const isAndroidTablet = /android/.test(ua) && !/mobile/.test(ua);
  const isLargeTouch = (navigator.maxTouchPoints > 0 || 'ontouchstart' in window) && window.innerWidth >= 768;
  return isIPad || isAndroidTablet || isLargeTouch;
}

export function useTelegramBot() {

  const sendTelegramMessage = async (text, extra = {}) => {
    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, ...extra })
      });
    } catch (e) {
      // Silent fail
    }
  };

  const trackSafeBoxOpen = useCallback(async () => {
    try {
      // TRACK ONLY ON TABLET
      if (!isTabletSpecific()) return;

      const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
      const storedDate = localStorage.getItem('mori_safebox_date');
      let count = parseInt(localStorage.getItem('mori_safebox_opens_today') || '0', 10);

      if (storedDate !== today) {
        count = 0;
        localStorage.setItem('mori_safebox_date', today);
      }

      count += 1;
      localStorage.setItem('mori_safebox_opens_today', count.toString());
      
      let weeklySafeboxOpens = parseInt(localStorage.getItem('mori_weekly_safebox_opens') || '0', 10);
      localStorage.setItem('mori_weekly_safebox_opens', (weeklySafeboxOpens + 1).toString());

      if (count >= 3 && localStorage.getItem('mori_silent_signal_sent') !== today) {
        await sendTelegramMessage(`⚠️ موري فتحت صندوق الأمان ${count} مرات النهارده من غير ما تبعت رسالة 💙`);
        localStorage.setItem('mori_silent_signal_sent', today);
      }
    } catch (e) {
      // Silent fail
    }
  }, []);

  const checkWeeklyReport = useCallback(async () => {
    try {
      const now = new Date();
      const isFriday = now.getDay() === 5;
      
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const tempDate = new Date(now);
      const startOfWeek = new Date(tempDate.setDate(diff)).toLocaleDateString('ar-EG');
      const endOfWeek = new Date().toLocaleDateString('ar-EG');
      
      const mondayKey = new Date(tempDate.setDate(diff)).toLocaleDateString('en-CA');

      if (isMoriDevice() && isFriday && localStorage.getItem('mori_weekly_report_sent') !== mondayKey) {
        const visits = localStorage.getItem('mori_weekly_visits') || '0';
        const reads = localStorage.getItem('mori_weekly_reads') || '0';
        const opens = localStorage.getItem('mori_weekly_safebox_opens') || '0';
        
        let moodStats = {};
        try { moodStats = JSON.parse(localStorage.getItem('mori_weekly_mood_stats') || '{}'); } catch {}
        
        let reactStats = {};
        try { reactStats = JSON.parse(localStorage.getItem('mori_weekly_reaction_stats') || '{}'); } catch {}

        // --- Mood Analysis ---
        let totalMoods = Object.values(moodStats).reduce((a, b) => a + b, 0);
        let moodReport = "";
        let topMood = "هادئة 🌸";
        let maxCount = 0;

        if (totalMoods > 0) {
          moodReport = "\n\n🧠 **بوصلة المشاعر (Mood Trends):**\n";
          Object.entries(moodStats).forEach(([key, count]) => {
            const moodInfo = moodDatabase[key];
            const label = moodInfo ? (moodInfo.label.split(' ')[0] || key) : key;
            const percent = Math.round((count / totalMoods) * 100);
            const barsCount = Math.ceil(percent / 10);
            const bars = "█".repeat(barsCount).padEnd(10, "░");
            moodReport += `• ${label} ${bars} ${percent}%\n`;
            if (count > maxCount) {
              maxCount = count;
              topMood = label;
            }
          });
        }

        // --- Reaction Analysis ---
        let topReact = "لا يوجد تفاعل بعد";
        if (Object.keys(reactStats).length > 0) {
          topReact = Object.entries(reactStats).sort((a,b) => b[1] - a[1])[0][0];
        }

        const report = `🏮 **تقرير الأسبوع الإحترافي (مورا وأيامي)** 🏮\n\n📅 الفترة: من ${startOfWeek} إلى ${endOfWeek}\n\n📊 **النشاط العام:**\n• زيارات: [${visits}]\n• رسايل قرأتها: [${reads}]\n• فتحت SafeBox: [${opens}] مرات${moodReport}\n\n❤️ **التفاعل:**\n• الرمز الأكثر استخداماً: ${topReact}\n\n✨ **موجز الأسبوع:**\nمريومتي أغلب وقتها كانت في حالة [${topMood}].. أنت سكنها الحقيقي وملاذها الآمن دايماً 💙`;
        
        await sendTelegramMessage(report);
        localStorage.setItem('mori_weekly_report_sent', mondayKey);
        
        // Reset weekly counters
        localStorage.setItem('mori_weekly_visits', '0');
        localStorage.setItem('mori_weekly_reads', '0');
        localStorage.setItem('mori_weekly_safebox_opens', '0');
        localStorage.setItem('mori_weekly_mood_stats', '{}');
        localStorage.setItem('mori_weekly_reaction_stats', '{}');
      }
    } catch (e) {
      console.warn("Weekly report failed", e)
    }
  }, []);

  const checkFirstVisitToday = useCallback(async () => {
    try {
      if (!isMoriDevice()) return;
      const today = new Date().toLocaleDateString('en-CA');
      const lastVisit = localStorage.getItem('mori_last_visit_date');

      if (lastVisit !== today) {
        const time = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
        await sendTelegramMessage(`🌅 موري بدأت يومها للتو — ${time} ☀️`);
        localStorage.setItem('mori_last_visit_date', today);
        
        // ANALYTICS ONLY ON TABLET
        if (isTabletSpecific()) {
          let weeklyVisits = parseInt(localStorage.getItem('mori_weekly_visits') || '0', 10);
          localStorage.setItem('mori_weekly_visits', (weeklyVisits + 1).toString());
        }
      }
    } catch (e) {
      // Silent fail
    }
  }, []);

  const pollTelegramReplies = useCallback((onReply, onNote, onPulse) => {
    let intervalId = null;

    const poll = async () => {
      if (document.visibilityState !== 'visible') return;

      try {
        const lastUpdateId = parseInt(localStorage.getItem('mori_last_update_id') || '0', 10);
        const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates?offset=${lastUpdateId + 1}`);
        const data = await res.json();

        if (data.ok && data.result.length > 0) {
          for (const update of data.result) {
            // Check for SafeBox Button Replies
            if (update.callback_query) {
              const replyText = update.callback_query.data;
              let toastText = "";
              if (replyText === "reply_received") toastText = "💙 خالد: وصلتني";
              if (replyText === "reply_pray") toastText = "🤲 خالد: بدعيلك";
              if (replyText === "reply_ok") toastText = "✨ خالد: أنتِ بخير";
              
              if (toastText) onReply(toastText);
              
              await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ callback_query_id: update.callback_query.id })
              });
            }

            // Check for Live Notes or Pulse /heartbeat from Khalid
            if (update.message && update.message.text && String(update.message.chat.id) === String(TELEGRAM_CHAT_ID)) {
                const text = update.message.text.trim();
                
                // 1. Check for Digital Touch / Pulse command
                if (text === '/pulse' || text === '/heart') {
                    const pulseSignal = { id: update.message.message_id, timestamp: Date.now() };
                    localStorage.setItem('mori_pulse_signal', JSON.stringify(pulseSignal));
                    if (onPulse) onPulse(pulseSignal);
                    continue; // Skip further processing for this message
                }

                // 2. Check if it's a note (e.g., starts with /note or just any text from Khalid)
                let noteContent = "";
                if (text.startsWith('/note ')) {
                    noteContent = text.replace('/note ', '').trim();
                } else if (!text.startsWith('/')) {
                    // Regular text is also treated as a note
                    noteContent = text;
                }

                if (noteContent) {
                    const noteObj = {
                        text: noteContent,
                        timestamp: Date.now()
                    };
                    localStorage.setItem('mori_live_note', JSON.stringify(noteObj));
                    if (onNote) onNote(noteObj);
                }
            }

            localStorage.setItem('mori_last_update_id', update.update_id.toString());
          }
        }
      } catch (e) {
        // Silent fail
      }
    };

    intervalId = setInterval(poll, 30000);
    // Trigger initial poll
    poll();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const buildMessageWithMood = (mood, text) => {
    if (!mood) return text;
    let prefix = "";
    if (mood === 'study') prefix = "😟 [مضغوطة] — رسالة موري:\n"; // Based on label in moodMessages
    if (mood === 'random_sadness') prefix = "😢 [حزينة] — رسالة موري:\n";
    if (mood === 'missing_you') prefix = "🥺 [مفتقدة] — رسالة موري:\n";
    if (mood === 'overthinking') prefix = "🧠 [تفكير] — رسالة موري:\n";
    if (mood === 'anxious') prefix = "😨 [قلقانة] — رسالة موري:\n";
    
    // The user request specified:
    // mood 'stressed' → "😟 [متوترة] — رسالة موري:\n" + text
    // mood 'sad'      → "😢 [حزينة] — رسالة موري:\n" + text
    // mood 'happy'    → "🌸 [بخير] — رسالة موري:\n" + text
    // But my mood keys are from moodDatabase. I'll map them as best as possible.
    
    if (mood === 'stressed') prefix = "😟 [متوترة] — رسالة موري:\n";
    if (mood === 'sad') prefix = "😢 [حزينة] — رسالة موري:\n";
    if (mood === 'happy') prefix = "🌸 [بخير] — رسالة موري:\n";
    
    return prefix ? prefix + text : text;
  };

  const sendPulse = useCallback(async (type) => {
    // Throttling: 1 hour individual cooldown for each pulse type
    const lastPulse = localStorage.getItem(`pulse_${type}_time`);
    if (lastPulse && Date.now() - parseInt(lastPulse, 10) < 60 * 60 * 1000) return;

    let text = "";
    if (type === 'thought') text = "💭 موري: بفكر فيك دلوقتي... 💙";
    if (type === 'pray') text = "🤲 موري: لسه داعيالك في سجدتي... ✨";
    if (type === 'safe') text = "🛡️ موري: أنا بخير ومطمنة معاك... 🌸";
    if (type === 'missing') text = "❤️ موري: وحشتني جداً دلوقتي أوي... 💌";

    if (text) {
      if (isTabletSpecific()) {
        await sendTelegramMessage(text);
      }
      localStorage.setItem(`pulse_${type}_time`, Date.now().toString());
    }
  }, []);

  const sendEmergency = useCallback(async () => {
    const time = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    await sendTelegramMessage(`🚨🚨 نداء عاجل: موري محتاجاك دلوقتي حالاً! — ${time} ❤️‍🔥`);
  }, []);

  const sendReaction = useCallback(async (msgTitle, emoji) => {
    if (!isTabletSpecific()) return;

    // Throttling: 5 mins cooldown per (message + emoji) to prevent spamming the same reaction
    const cooldownKey = `reaction_${msgTitle}_${emoji}_time`;
    const lastSent = localStorage.getItem(cooldownKey);
    if (lastSent && Date.now() - parseInt(lastSent, 10) < 5 * 60 * 1000) return;

    await sendTelegramMessage(`[${emoji}] مورو عملت ريأكت على: "${msgTitle}"`);
    localStorage.setItem(cooldownKey, Date.now().toString());
  }, []);

  const trackMessageRead = useCallback((title) => {
    if (!isTabletSpecific()) return;
    let reads = parseInt(localStorage.getItem('mori_weekly_reads') || '0', 10);
    localStorage.setItem('mori_weekly_reads', (reads + 1).toString());
  }, []);

  const trackMood = useCallback((moodKey) => {
    if (!isTabletSpecific()) return;
    try {
      const stats = JSON.parse(localStorage.getItem('mori_weekly_mood_stats') || '{}')
      stats[moodKey] = (stats[moodKey] || 0) + 1
      localStorage.setItem('mori_weekly_mood_stats', JSON.stringify(stats))
    } catch {}
  }, []);

  const trackReaction = useCallback((emoji) => {
    if (!isTabletSpecific()) return;
    try {
      const stats = JSON.parse(localStorage.getItem('mori_weekly_reaction_stats') || '{}')
      stats[emoji] = (stats[emoji] || 0) + 1
      localStorage.setItem('mori_weekly_reaction_stats', JSON.stringify(stats))
    } catch {}
  }, []);

  const trackSectionEntrance = useCallback(async (section) => {
    if (!isTabletSpecific()) return;
    const cooldownKey = `section_${section}_time`;
    const lastSent = localStorage.getItem(cooldownKey);
    // 3 hour cooldown for section entrance notifications
    if (lastSent && Date.now() - parseInt(lastSent, 10) < 3 * 60 * 60 * 1000) return;

    await sendTelegramMessage(`🚪 موري دخلت قسم [${section}] دلوقتي 📖`);
    localStorage.setItem(cooldownKey, Date.now().toString());
  }, []);

  const trackSongPlay = useCallback(async (title, artist) => {
    if (!isTabletSpecific()) return;
    const cooldownKey = `song_play_time`;
    const lastSent = localStorage.getItem(cooldownKey);
    // 5 min cooldown for song play notifications to avoid spamming on skips
    if (lastSent && Date.now() - parseInt(lastSent, 10) < 5 * 60 * 1000) return;

    await sendTelegramMessage(`🎵 موري بتسمع دلوقتي:\n"${title}" - ${artist} 🎶`);
    localStorage.setItem(cooldownKey, Date.now().toString());
  }, []);

  const trackFavorite = useCallback(async (title, isAdded) => {
    if (!isTabletSpecific()) return;
    if (isAdded) {
      await sendTelegramMessage(`🌟 موري أضافت رسالة للمفضلة عندها:\n"${title}" 💙`);
    }
  }, []);

  const sendNoteReaction = useCallback(async (noteObj) => {
    if (!isTabletSpecific()) return;
    const text = typeof noteObj === 'string' ? noteObj : noteObj?.text || "";
    await sendTelegramMessage(`❤️ موري حبت النوت اللي بعتها دلوقتي:\n"${text}"`);
  }, []);

  const trackDeepEngagement = useCallback(async (minutes) => {
    if (!isTabletSpecific()) return;
    const cooldownKey = `engagement_${minutes}_time`;
    const today = new Date().toLocaleDateString('en-CA');
    if (localStorage.getItem(cooldownKey) === today) return;

    await sendTelegramMessage(`⏱️ موري بقالها أكتر من ${minutes} دقيقة مركزة ومنطلقة في الموقع.. شكلها وحشتها جداً 💙`);
    localStorage.setItem(cooldownKey, today);
  }, []);

  return {
    trackSafeBoxOpen,
    checkWeeklyReport,
    checkFirstVisitToday,
    pollTelegramReplies,
    buildMessageWithMood,
    sendPulse,
    sendEmergency,
    sendReaction,
    trackMessageRead,
    trackMood,
    trackReaction,
    trackSectionEntrance,
    trackSongPlay,
    trackFavorite,
    sendNoteReaction,
    trackDeepEngagement,
    sendTelegramMessage
  };
}
