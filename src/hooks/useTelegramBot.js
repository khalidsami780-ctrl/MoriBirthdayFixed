import { useEffect, useCallback } from 'react';
import { moodDatabase } from '../data/moodMessages.js';
import { useTelegram } from '../context/TelegramContextCore.jsx';

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
  const { subscribe, TELEGRAM_TOKEN, TELEGRAM_CHAT_ID, getTelegramFileUrl } = useTelegram();

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

  const sendTelegramMedia = async (type, file, caption = "") => {
    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/send${type.charAt(0).toUpperCase() + type.slice(1)}`;
      const formData = new FormData();
      formData.append('chat_id', TELEGRAM_CHAT_ID);
      formData.append(type, file);
      if (caption) formData.append('caption', caption);

      await fetch(url, {
        method: 'POST',
        body: formData // Browser sets Content-Type boundary automatically
      });
    } catch (e) {
      console.error("Failed to send media", e);
    }
  };

  const trackSafeBoxOpen = useCallback(async () => {
    try {
      if (!isTabletSpecific()) return;

      const today = new Date().toLocaleDateString('en-CA');
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
    } catch (e) {}
  }, []);

  const checkWeeklyReport = useCallback(async () => {
    try {
      const now = new Date();
      if (!isMoriDevice() || now.getDay() !== 5) return;
      
      const mondayKey = new Date(now.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1))).toLocaleDateString('en-CA');
      if (localStorage.getItem('mori_weekly_report_sent') === mondayKey) return;

      const visits = localStorage.getItem('mori_weekly_visits') || '0';
      const reads = localStorage.getItem('mori_weekly_reads') || '0';
      const opens = localStorage.getItem('mori_weekly_safebox_opens') || '0';
      
      let moodStats = {}; try { moodStats = JSON.parse(localStorage.getItem('mori_weekly_mood_stats') || '{}'); } catch {}
      let reactStats = {}; try { reactStats = JSON.parse(localStorage.getItem('mori_weekly_reaction_stats') || '{}'); } catch {}

      let totalMoods = Object.values(moodStats).reduce((a, b) => a + b, 0);
      let moodReport = "";
      let topMood = "هادئة 🌸";
      let maxCount = 0;

      if (totalMoods > 0) {
        moodReport = "\n\n🧠 **بوصلة المشاعر (Mood Trends):**\n";
        Object.entries(moodStats).forEach(([key, count]) => {
          const label = moodDatabase[key]?.label.split(' ')[0] || key;
          const percent = Math.round((count / totalMoods) * 100);
          moodReport += `• ${label} ${"█".repeat(Math.ceil(percent/10)).padEnd(10, "░")} ${percent}%\n`;
          if (count > maxCount) { maxCount = count; topMood = label; }
        });
      }

      const topReact = Object.keys(reactStats).length > 0 ? Object.entries(reactStats).sort((a,b) => b[1] - a[1])[0][0] : "لا يوجد";

      const report = `🏮 **تقرير الأسبوع الإحترافي (مورا وأيامي)** 🏮\n\n📊 **النشاط العام:**\n• زيارات: [${visits}]\n• رسايل قرأتها: [${reads}]\n• فتحت SafeBox: [${opens}] مرات${moodReport}\n\n❤️ **التفاعل:**\n• الرمز الأكثر استخداماً: ${topReact}\n\n✨ **موجز الأسبوع:**\nمريومتي أغلب وقتها كانت في حالة [${topMood}].. أنت سكنها الحقيقي وملاذها الآمن دايماً 💙`;
      
      await sendTelegramMessage(report);
      localStorage.setItem('mori_weekly_report_sent', mondayKey);
      
      localStorage.setItem('mori_weekly_visits', '0');
      localStorage.setItem('mori_weekly_reads', '0');
      localStorage.setItem('mori_weekly_safebox_opens', '0');
      localStorage.setItem('mori_weekly_mood_stats', '{}');
      localStorage.setItem('mori_weekly_reaction_stats', '{}');
    } catch (e) { console.warn("Weekly report failed", e) }
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
        if (isTabletSpecific()) {
          let visits = parseInt(localStorage.getItem('mori_weekly_visits') || '0', 10);
          localStorage.setItem('mori_weekly_visits', (visits + 1).toString());
        }
      }
    } catch (e) {}
  }, []);

  const pollTelegramReplies = useCallback((onReply, onNote, onPulse) => {
    const unsubReply = subscribe('onReply', onReply);
    const unsubNote = onNote ? subscribe('onNote', onNote) : () => {};
    const unsubPulse = onPulse ? subscribe('onPulse', onPulse) : () => {};

    return () => {
      unsubReply();
      unsubNote();
      unsubPulse();
    };
  }, [subscribe]);

  const buildMessageWithMood = (mood, text) => {
    if (!mood) return text;
    let prefix = "";
    const moodMap = {
      study: "😟 [مضغوطة]",
      random_sadness: "😢 [حزينة]",
      missing_you: "🥺 [مفتقدة]",
      overthinking: "🧠 [تفكير]",
      anxious: "😨 [قلقانة]",
      stressed: "😟 [متوترة]",
      sad: "😢 [حزينة]",
      happy: "🌸 [بخير]"
    };
    prefix = (moodMap[mood] || "") + " — رسالة موري:\n";
    return prefix + text;
  };

  const sendPulse = useCallback(async (type) => {
    const lastPulse = localStorage.getItem(`pulse_${type}_time`);
    if (lastPulse && Date.now() - parseInt(lastPulse, 10) < 60 * 60 * 1000) return;

    let text = "";
    if (type === 'thought') text = "💭 موري: بفكر فيك دلوقتي... 💙";
    if (type === 'pray') text = "🤲 موري: لسه داعيالك في سجدتي... ✨";
    if (type === 'safe') text = "🛡️ موري: أنا بخير ومطمنة معاك... 🌸";
    if (type === 'missing') text = "❤️ موري: وحشتني جداً دلوقتي أوي... 💌";

    if (text) {
      if (isTabletSpecific()) await sendTelegramMessage(text);
      localStorage.setItem(`pulse_${type}_time`, Date.now().toString());
    }
  }, []);

  const sendEmergency = useCallback(async () => {
    const time = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    await sendTelegramMessage(`🚨🚨 نداء عاجل: موري محتاجاك دلوقتي حالاً! — ${time} ❤️‍🔥`);
  }, []);

  const sendReaction = useCallback(async (msgTitle, emoji) => {
    if (!isTabletSpecific()) return;
    const cooldownKey = `reaction_${msgTitle}_${emoji}_time`;
    if (localStorage.getItem(cooldownKey) && Date.now() - parseInt(localStorage.getItem(cooldownKey), 10) < 5 * 60 * 1000) return;
    await sendTelegramMessage(`[${emoji}] مورو عملت ريأكت على: "${msgTitle}"`);
    localStorage.setItem(cooldownKey, Date.now().toString());
  }, []);

  const trackMessageRead = (title) => {
    if (!isTabletSpecific()) return;
    localStorage.setItem('mori_weekly_reads', (parseInt(localStorage.getItem('mori_weekly_reads') || '0') + 1).toString());
  };

  const trackMood = (moodKey) => {
    if (!isTabletSpecific()) return;
    try {
      const stats = JSON.parse(localStorage.getItem('mori_weekly_mood_stats') || '{}');
      stats[moodKey] = (stats[moodKey] || 0) + 1;
      localStorage.setItem('mori_weekly_mood_stats', JSON.stringify(stats));
      localStorage.setItem('mori_garden_points', (parseFloat(localStorage.getItem('mori_garden_points') || '0') + 0.2).toString());
    } catch {}
  };

  const trackReaction = (emoji) => {
    if (!isTabletSpecific()) return;
    try {
      const stats = JSON.parse(localStorage.getItem('mori_weekly_reaction_stats') || '{}');
      stats[emoji] = (stats[emoji] || 0) + 1;
      localStorage.setItem('mori_weekly_reaction_stats', JSON.stringify(stats));
      localStorage.setItem('mori_garden_points', (parseFloat(localStorage.getItem('mori_garden_points') || '0') + 0.2).toString());
    } catch {}
  };

  const trackSectionEntrance = async (section) => {
    if (!isTabletSpecific()) return;
    const cooldownKey = `section_${section}_time`;
    if (localStorage.getItem(cooldownKey) && Date.now() - parseInt(localStorage.getItem(cooldownKey), 10) < 3 * 60 * 60 * 1000) return;
    await sendTelegramMessage(`🚪 موري دخلت قسم [${section}] دلوقتي 📖`);
    localStorage.setItem(cooldownKey, Date.now().toString());
  };

  const trackSongPlay = async (title, artist) => {
    if (!isTabletSpecific()) return;
    if (localStorage.getItem('song_play_time') && Date.now() - parseInt(localStorage.getItem('song_play_time'), 10) < 5 * 60 * 1000) return;
    await sendTelegramMessage(`🎵 موري بتسمع دلوقتي:\n"${title}" - ${artist} 🎶`);
    localStorage.setItem('song_play_time', Date.now().toString());
  };

  const trackFavorite = async (title, isAdded) => {
    if (isTabletSpecific() && isAdded) await sendTelegramMessage(`🌟 موري أضافت رسالة للمفضلة عندها:\n"${title}" 💙`);
  };

  const sendNoteReaction = async (noteObj) => {
    if (!isTabletSpecific()) return;
    await sendTelegramMessage(`❤️ موري حبت النوت اللي بعتها دلوقتي:\n"${noteObj?.text || ""}"`);
  };

  const trackDeepEngagement = async (minutes) => {
    if (!isTabletSpecific()) return;
    const today = new Date().toLocaleDateString('en-CA');
    if (localStorage.getItem(`engagement_${minutes}_time`) === today) return;
    await sendTelegramMessage(`⏱️ موري بقالها أكتر من ${minutes} دقيقة مركزة ومنطلقة في الموقع.. شكلها وحشتها جداً 💙`);
    localStorage.setItem(`engagement_${minutes}_time`, today);
  };

  const trackAtmosphereChange = async (label) => {
    if (!isTabletSpecific()) return;
    await sendTelegramMessage(`🎨 موري غيرت جو الموقع دلوقتي لـ: [${label}] ✨`);
  };

  const trackReasonOpened = async (text) => {
    if (!isTabletSpecific()) return;
    await sendTelegramMessage(`🏺 موري سحبت ورقة من "برطمان المشاعر" وقرأت:\n"${text}" ❤️`);
  };

  const trackReasonArchived = async (text) => {
    if (!isTabletSpecific()) return;
    await sendTelegramMessage(`📁 موري أرشفة ورقة في البرطمان:\n"${text}" ✅`);
  };

  return {
    trackSafeBoxOpen, checkWeeklyReport, checkFirstVisitToday, pollTelegramReplies,
    buildMessageWithMood, sendPulse, sendEmergency, sendReaction, trackMessageRead,
    trackMood, trackReaction, trackSectionEntrance, trackSongPlay, trackFavorite,
    sendNoteReaction, trackDeepEngagement, trackAtmosphereChange, trackReasonOpened,
    trackReasonArchived, sendTelegramMessage, sendTelegramMedia
  };
}
