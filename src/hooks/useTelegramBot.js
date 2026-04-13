import { useEffect, useCallback } from 'react';

const TELEGRAM_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || "8511793687:AAGtCOV-QhKjgZxR4XqimtmjyKvtFpcuso8";
const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID || "1023544625";

const isMoriDevice = () => {
  const w = window.innerWidth
  const isTouch = navigator.maxTouchPoints > 0
  const isTabletSize = w >= 600 && w <= 1400
  const isNotPhone = Math.max(window.innerWidth, window.innerHeight) >= 700
  const ua = navigator.userAgent.toLowerCase()
  const isTabletUA = ua.includes('ipad') || 
    (ua.includes('macintosh') && navigator.maxTouchPoints > 1) ||
    (ua.includes('android') && !ua.includes('mobile'))
  return isTouch && isTabletSize && isNotPhone && (isTabletUA || w >= 768)
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

      if (isMoriDevice() && count >= 3 && localStorage.getItem('mori_silent_signal_sent') !== today) {
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
      const today = now.toLocaleDateString('en-CA');
      const isFriday = now.getDay() === 5;
      
      // Calculate this week's Monday as a unique identifier for the week
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      const monday = new Date(now.setDate(diff)).toLocaleDateString('en-CA');

      if (isMoriDevice() && isFriday && localStorage.getItem('mori_weekly_report_sent') !== monday) {
        const visits = localStorage.getItem('mori_weekly_visits') || '0';
        const reads = localStorage.getItem('mori_weekly_reads') || '0';
        const opens = localStorage.getItem('mori_weekly_safebox_opens') || '0';
        const lastVisit = localStorage.getItem('mori_last_visit_date') || 'N/A';

        const report = `📊 تقرير الأسبوع:\n• زيارات: [${visits}]\n• رسايل قرأتها: [${reads}]\n• فتحت SafeBox: [${opens}] مرات\n• آخر زيارة: [${lastVisit}]`;
        
        await sendTelegramMessage(report);
        localStorage.setItem('mori_weekly_report_sent', monday);
        
        // Reset weekly counters
        localStorage.setItem('mori_weekly_visits', '0');
        localStorage.setItem('mori_weekly_reads', '0');
        localStorage.setItem('mori_weekly_safebox_opens', '0');
      }
    } catch (e) {
      // Silent fail
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
        
        // Increment weekly visits
        let weeklyVisits = parseInt(localStorage.getItem('mori_weekly_visits') || '0', 10);
        localStorage.setItem('mori_weekly_visits', (weeklyVisits + 1).toString());
      }
    } catch (e) {
      // Silent fail
    }
  }, []);

  const pollTelegramReplies = useCallback((onReply) => {
    let intervalId = null;

    const poll = async () => {
      if (document.visibilityState !== 'visible') return;

      try {
        const lastUpdateId = parseInt(localStorage.getItem('mori_last_update_id') || '0', 10);
        const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates?offset=${lastUpdateId + 1}`);
        const data = await res.json();

        if (data.ok && data.result.length > 0) {
          for (const update of data.result) {
            if (update.callback_query) {
              const replyText = update.callback_query.data;
              let toastText = "";
              if (replyText === "reply_received") toastText = "💙 خالد: وصلتني";
              if (replyText === "reply_pray") toastText = "🤲 خالد: بدعيلك";
              if (replyText === "reply_ok") toastText = "✨ خالد: أنتِ بخير";
              
              if (toastText) onReply(toastText);
              
              // Acknowledge callback query to remove "loading" state on Telegram if possible
              // But we only have token/chatId, and answering callbacks requires callback_query_id
              await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ callback_query_id: update.callback_query.id })
              });
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

  return {
    trackSafeBoxOpen,
    checkWeeklyReport,
    checkFirstVisitToday,
    pollTelegramReplies,
    buildMessageWithMood,
    sendTelegramMessage
  };
}
