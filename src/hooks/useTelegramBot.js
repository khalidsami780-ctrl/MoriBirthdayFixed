import { useCallback, useEffect, useRef } from 'react';
import { moodDatabase } from '../data/moodMessages.js';
import { useTelegram } from '../context/TelegramContextCore.jsx';

let hasInitialized = false;

// ─────────────────────────────────────────────────────────────────────────────
// Device Detection
// ─────────────────────────────────────────────────────────────────────────────

export const isMoriDevice = () => {
  const isTouch = navigator.maxTouchPoints > 0;
  const ua = navigator.userAgent.toLowerCase();
  const isMobileOrTablet = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
  const isIPadOS = ua.includes('macintosh') && navigator.maxTouchPoints > 1;
  return isTouch || isMobileOrTablet || isIPadOS;
};

export const isTabletSpecific = () => {
  const ua = navigator.userAgent.toLowerCase();
  const isIPad         = /ipad/.test(ua) || (ua.includes('macintosh') && navigator.maxTouchPoints > 1);
  const isAndroidTablet = /android/.test(ua) && !/mobile/.test(ua);
  const isAndroidPhone  = /android/.test(ua) &&  /mobile/.test(ua);
  const isIPhone        = /iphone/.test(ua);
  const isWindows       = /windows/.test(ua);
  const isMacDesktop    = /macintosh/.test(ua) && navigator.maxTouchPoints <= 1;
  const isLinuxDesktop  = /linux/.test(ua) && !/android/.test(ua);
  const isLocalhost     = ['localhost', '127.0.0.1'].includes(window.location.hostname);

  if (isLocalhost) return true;
  return (isIPad || isAndroidTablet || isAndroidPhone || isIPhone)
    && !isWindows && !isMacDesktop && !isLinuxDesktop;
};

// ─────────────────────────────────────────────────────────────────────────────
// Cooldown Manager — single source of truth for all rate-limiting
// CD.pass(key, ms) → true if cooldown expired AND sets it automatically
// CD.check(key, ms) → true if expired, without setting
// ─────────────────────────────────────────────────────────────────────────────

const CD = {
  _key: (id) => `cd_${id}`,
  _get: (id) => {
    try { return parseInt(localStorage.getItem(CD._key(id)) || '0', 10); } catch { return 0; }
  },
  _set: (id) => {
    try { localStorage.setItem(CD._key(id), Date.now().toString()); } catch { /* ignore */ }
  },
  /** Check cooldown expiry. If expired, SET it and return true. Thread-safe for single-tab. */
  pass: (id, ms) => {
    const last = CD._get(id);
    if (!last || Date.now() - last >= ms) { CD._set(id); return true; }
    return false;
  },
  /** Check-only, does not set. */
  check: (id, ms) => {
    const last = CD._get(id);
    return !last || Date.now() - last >= ms;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Session-level deduplication — cleared on page refresh (in-memory Set)
// Prevents the same alert from firing twice during a single React session,
// even if cooldown passes due to StrictMode double-invocations.
// ─────────────────────────────────────────────────────────────────────────────

const _sessionSent = new Set();
const dedup = {
  isNew: (key) => !_sessionSent.has(key),
  markSent: (key) => _sessionSent.add(key),
  passOnce: (key) => {
    if (_sessionSent.has(key)) return false;
    _sessionSent.add(key);
    return true;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Typed localStorage helpers — eliminates scattered try/catch
// ─────────────────────────────────────────────────────────────────────────────

export const storage = {
  getInt:   (key, def = 0)  => { try { return parseInt(localStorage.getItem(key)  ?? String(def), 10); }  catch { return def; } },
  getFloat: (key, def = 0)  => { try { return parseFloat(localStorage.getItem(key) ?? String(def)); }      catch { return def; } },
  getStr:   (key, def = '') => { try { return localStorage.getItem(key) ?? def; }                           catch { return def; } },
  getJSON:  (key, def)      => { try { return JSON.parse(localStorage.getItem(key) ?? JSON.stringify(def)); } catch { return def; } },
  set:      (key, val)      => { try { localStorage.setItem(key, String(val)); }        catch { /* ignore */ } },
  setJSON:  (key, val)      => { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ } },
  remove:   (key)           => { try { localStorage.removeItem(key); }                  catch { /* ignore */ } },
  increment:(key, by = 1)   => { const v = storage.getInt(key) + by; storage.set(key, v); return v; },
};

// ─────────────────────────────────────────────────────────────────────────────
// Message Formatter — consistent, clean Telegram messages
// ─────────────────────────────────────────────────────────────────────────────

const fmt = {
  time: () => new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
  truncate: (text, max = 150) => {
    if (!text) return '';
    return text.length > max ? `${text.substring(0, max - 3)}...` : text;
  },
  moodEmoji: (moodKey) => {
    const map = {
      study: '😟', random_sadness: '😢', missing_you: '🥺',
      overthinking: '🧠', anxious: '😨', stressed: '😟',
      sad: '😢', happy: '🌸',
    };
    return map[moodKey] || '💙';
  },
  moodLabel: (moodKey) => moodDatabase[moodKey]?.label || moodKey,
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useTelegramBot(manualProps) {
  // Use manual props if provided (singleton initialization inside Provider), 
  // otherwise fallback to context (backward compatibility during refactor)
  let ctx = {};
  try {
    ctx = manualProps || useTelegram();
  } catch {
    // Falls back to empty object if used outside provider during transition
  }

  const { subscribe, TELEGRAM_TOKEN, TELEGRAM_CHAT_ID } = ctx;
  const hasLoggedRef = useRef(false);

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Internal Logic (Hoisted Function Declarations)
  // ─────────────────────────────────────────────────────────────────────────

  function trackAction(action) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mori_track_action', { detail: action }));
    }
  }

  function trackReaction(emoji) {
    if (!isTabletSpecific()) return;
    try {
      const stats = storage.getJSON('mori_weekly_reaction_stats', {});
      stats[emoji] = (stats[emoji] || 0) + 1;
      storage.setJSON('mori_weekly_reaction_stats', stats);
      storage.set('mori_garden_points', storage.getFloat('mori_garden_points') + 0.2);
    } catch { /* silent */ }
  }

  function trackMood(moodKey) {
    if (!isTabletSpecific()) return;
    try {
      const stats = storage.getJSON('mori_weekly_mood_stats', {});
      stats[moodKey] = (stats[moodKey] || 0) + 1;
      storage.setJSON('mori_weekly_mood_stats', stats);
      storage.set('mori_garden_points', storage.getFloat('mori_garden_points') + 0.2);
      trackAction({ type: 'mood', value: moodKey, label: fmt.moodLabel(moodKey) });
    } catch { /* silent */ }
  }

  async function sendTelegramMessage(text, extra = {}) {
    if (!text?.trim()) return;
    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text,
          parse_mode: 'Markdown',
          ...extra,
        }),
      });
    } catch { /* silent */ }
  }

  async function sendTelegramMedia(type, file, caption = '') {
    try {
      const endpoint =
        `https://api.telegram.org/bot${TELEGRAM_TOKEN}/send${type.charAt(0).toUpperCase() + type.slice(1)}`;
      const formData = new FormData();
      formData.append('chat_id', TELEGRAM_CHAT_ID);
      formData.append(type, file);
      if (caption) formData.append('caption', caption);
      await fetch(endpoint, { method: 'POST', body: formData });
    } catch (e) { console.error('sendTelegramMedia failed', e); }
  }

  async function trackMilestone(type) {
    if (!isTabletSpecific()) return;
    const total = storage.increment(`mori_total_${type}`);
    if ([50, 100, 200, 500].includes(total)) {
      const msgs = {
        reads:   `🎉 موري أتمت قراءة الرسالة رقم *${total}* في الموقع!`,
        safebox: `🛡️ موري فتحت صندوق الأمان *${total}* مرة إجمالي! أنت ملاذها الحقيقي.`,
      };
      if (msgs[type]) await sendTelegramMessage(msgs[type]);
    }
  }

  async function sendNoteReaction(payload) {
    console.log("Sending reaction:", payload);
    if (!isTabletSpecific() || !payload) return;

    const { type, text, id, emoji = '❤️', emotion, description } = payload;

    if (type === 'urgent') {
      const cdKey = 'urgent_call';
      if (!CD.pass(cdKey, 5 * 60 * 1000)) {
        console.log("⏳ Urgent cooldown active");
        return;
      }
      trackAction({ 
        type: 'urgent', value: 'call', priority: 'high', 
        source: text, emotion: emotion || 'distress' 
      });
      trackReaction('🚨');

      const msg = [
        `🚨 *URGENT SIGNAL* 🚨`,
        `Mori needs you right now`,
        `\n💔 Emotion: *${emotion || 'distress'}*`,
        description ? `📝 Details: _${description}_` : '',
        `📍 Source: ${text || 'SafeBox'}`,
        `🕒 Time: ${fmt.time()}`
      ].filter(Boolean).join('\n');

      await sendTelegramMessage(msg);
      return;
    }

    const cooldownKey = `react_${type}_${id || 'unknown'}_${emoji}`;
    if (!CD.pass(cooldownKey, 2 * 60 * 1000)) return;
    
    trackAction({ type: 'reaction', value: emoji, targetId: id, targetType: type });
    trackReaction(emoji);

    const msg = type === 'note'
      ? `❤️ موري حبت النوت:\n*"${fmt.truncate(text || '', 100)}"*`
      : `[${emoji}] مورو ريأكتت على: *"${fmt.truncate(text || '', 80)}"*`;

    await sendTelegramMessage(msg);
  }

  async function sendEmergency(source = 'SafeBox', emotion = 'distress', description = '') {
    return sendNoteReaction({ type: 'urgent', text: source, id: 'urgent_call', emotion, description });
  }

  async function sendPulse(type) {
    if (!CD.pass(`pulse_${type}`, 60 * 60 * 1000)) return;
    const messages = {
      thought:     '💭 موري: بفكر فيك دلوقتي... 💙',
      pray:        '🤲 موري: لسه داعيالك في سجدتي... ✨',
      safe:        '🛡️ موري: أنا بخير ومطمنة معاك... 🌸',
      missing:     '❤️ موري: وحشتني جداً دلوقتي... 💌',
      hug_request: '🫂 موري بتقولك: محتاجة حضنك دلوقتي... 💙',
    };
    const text = messages[type];
    if (text && isTabletSpecific()) await sendTelegramMessage(text);
  }

  async function trackMessageRead(title, content = '') {
    if (!isTabletSpecific()) return;
    storage.increment('mori_weekly_reads');
    await trackMilestone('reads');
    trackAction({ type: 'read', value: title });
    const truncated = fmt.truncate(content, 200);
    const msg = truncated
      ? `📖 موري تعمقت في قراءة:\n*"${title}"*\n\n${truncated}`
      : `📖 موري قرأت رسالة:\n*"${title}"*`;
    await sendTelegramMessage(msg);
  }

  async function trackMessageViewed(title, content = '') {
    if (!isTabletSpecific()) return;
    const cdKey = `viewed_msg_${title.replace(/\s+/g, '_').substring(0, 40)}`;
    if (!CD.pass(cdKey, 60 * 60 * 1000)) return;
    const truncated = fmt.truncate(content, 150);
    const msg = truncated
      ? `👀 موري بتقرأ دلوقتي:\n*"${title}"*\n\n${truncated}`
      : `👀 موري بتقرأ دلوقتي:\n*"${title}"*`;
    await sendTelegramMessage(msg);
  }

  async function trackAdviceViewed(title, content = '') {
    if (!isTabletSpecific()) return;
    const cdKey = `viewed_advice_${title.replace(/\s+/g, '_').substring(0, 40)}`;
    if (!CD.pass(cdKey, 60 * 60 * 1000)) return;
    const truncated = fmt.truncate(content, 150);
    await sendTelegramMessage(`💡 موري بتقرأ نصيحة:\n*"${title}"*` + (truncated ? `\n\n${truncated}` : ''));
  }

  async function trackSectionEntrance(section) {
    if (!isTabletSpecific()) return;
    if (!CD.pass(`section_${section}`, 3 * 60 * 60 * 1000)) return;
    await sendTelegramMessage(`🚪 موري دخلت قسم *[${section}]* — ${fmt.time()} 📖`);
  }

  async function trackSongPlay(title, artist) {
    if (!isTabletSpecific()) return;
    trackAction({ type: 'song', value: title });
    const cdKey = `song_${title.replace(/\s+/g, '_').substring(0, 40)}`;
    if (!CD.pass(cdKey, 20 * 60 * 1000)) return;
    const info = artist && artist !== '—' ? `*"${title}"* - ${artist}` : `*"${title}"*`;
    await sendTelegramMessage(`🎵 موري سمعت ${info} — ${fmt.time()} 🎶`);
  }

  async function trackFavorite(title, isAdded) {
    if (!isMoriDevice() || !isAdded) return;
    await sendTelegramMessage(`🌟 موري أضافت رسالة للمفضلة:\n*"${title}"* 💙`);
  }

  async function trackSafeBoxOpen() {
    if (!isTabletSpecific()) return;
    try {
      const today = new Date().toLocaleDateString('en-CA');
      if (storage.getStr('mori_safebox_date') !== today) {
        storage.set('mori_safebox_opens_today', 0);
        storage.set('mori_safebox_date', today);
      }
      const count = storage.increment('mori_safebox_opens_today');
      storage.increment('mori_weekly_safebox_opens');
      if (count >= 3 && CD.pass(`safebox_silent_${today}`, 24 * 60 * 60 * 1000)) {
        await sendTelegramMessage(`⚠️ موري فتحت صندوق الأمان *${count} مرات* النهارده بدون ما تبعت رسالة 💙`);
      }
    } catch { /* silent */ }
  }

  async function trackHesitation() {
    if (!isTabletSpecific()) return;
    if (!CD.pass('hesitation_alert', 60 * 60 * 1000)) return;
    await sendTelegramMessage(
      `👀 *تنبيه تردُّد:*\n` +
      `موري كانت بتكتب رسالة طويلة في صندوق الأمان وبعدين مسحتها ومبعتتش حاجة...\n` +
      `دي إشارة إنها محتاجة كلمة منك دلوقتي 💙`
    );
  }

  function pollTelegramReplies(onReply, onNote, onPulse) {
    const unsubReply = subscribe('onReply', onReply  || (() => {}));
    const unsubNote  = subscribe('onNote',  onNote   || (() => {}));
    const unsubPulse = subscribe('onPulse', onPulse  || (() => {}));
    return () => { unsubReply(); unsubNote(); unsubPulse(); };
  }

  function buildMessageWithMood(mood, text) {
    if (!mood) return text;
    const emoji = fmt.moodEmoji(mood);
    const label = fmt.moodLabel(mood);
    return `${emoji} [${label}] — رسالة موري:\n${text}`;
  }

  async function checkFirstVisitToday() {
    if (!isMoriDevice()) return;
    const today = new Date().toLocaleDateString('en-CA');
    if (storage.getStr('mori_last_visit_date') === today) return;
    await sendTelegramMessage(`🌅 موري بدأت يومها — ${fmt.time()} ☀️`);
    storage.set('mori_last_visit_date', today);
    if (isTabletSpecific()) storage.increment('mori_weekly_visits');
  }

  async function checkWeeklyReport() {
    try {
      if (!isTabletSpecific()) return;
      const now = new Date();
      if (now.getDay() !== 5) return;
      const dayOfWeek = now.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
      const mondayKey = monday.toLocaleDateString('en-CA');
      if (storage.getStr('mori_weekly_report_sent') === mondayKey) return;

      const visits    = storage.getInt('mori_weekly_visits');
      const reads     = storage.getInt('mori_weekly_reads');
      const opens     = storage.getInt('mori_weekly_safebox_opens');
      const moodStats = storage.getJSON('mori_weekly_mood_stats', {});
      const reactStats = storage.getJSON('mori_weekly_reaction_stats', {});

      const totalMoods = Object.values(moodStats).reduce((a, b) => a + b, 0);
      let moodReport = '';
      let topMood = 'هادئة 🌸';
      let maxCount = 0;

      if (totalMoods > 0) {
        moodReport = '\n\n🧠 *بوصلة المشاعر:*\n';
        Object.entries(moodStats).sort(([, a], [, b]) => b - a).forEach(([key, count]) => {
          const label = fmt.moodLabel(key).split(' ')[0];
          const percent = Math.round((count / totalMoods) * 100);
          const bar = '█'.repeat(Math.ceil(percent / 10)).padEnd(10, '░');
          moodReport += `• ${label} ${bar} ${percent}%\n`;
          if (count > maxCount) { maxCount = count; topMood = label; }
        });
      }

      const topReact = Object.keys(reactStats).length > 0
        ? Object.entries(reactStats).sort((a,b) => b[1]-a[1])[0][0] : 'لا يوجد';

      const report = [
        `🏮 *تقرير الأسبوع — مورا وأيامي* 🏮`,
        `\n📊 *النشاط:*`,
        `• زيارات: *${visits}* | رسايل مقروءة: *${reads}* | SafeBox: *${opens}* مرات`,
        moodReport,
        `\n❤️ *التفاعل:*`,
        `• الرمز الأكثر استخداماً: ${topReact}`,
        `\n✨ موري كانت أغلبها في حالة [${topMood}] هذا الأسبوع.. أنت سكنها الحقيقي 💙`,
      ].join('\n');

      await sendTelegramMessage(report);
      storage.set('mori_weekly_report_sent', mondayKey);
      ['mori_weekly_visits', 'mori_weekly_reads', 'mori_weekly_safebox_opens'].forEach(k => storage.set(k, 0));
      storage.setJSON('mori_weekly_mood_stats', {});
      storage.setJSON('mori_weekly_reaction_stats', {});
    } catch (e) { console.warn('Weekly report failed', e); }
  }

  async function trackAtmosphereChange(label) {
    if (!isTabletSpecific()) return;
    if (!CD.pass('atmosphere_change', 10 * 60 * 1000)) return;
    await sendTelegramMessage(`🎨 موري غيرت جو الموقع لـ: *[${label}]* ✨`);
  }

  async function trackReasonOpened(text) {
    if (!isTabletSpecific()) return;
    if (!CD.pass('reason_opened', 5 * 60 * 1000)) return;
    await sendTelegramMessage(`🏺 موري سحبت ورقة من "برطمان المشاعر":\n*"${fmt.truncate(text, 120)}"* ❤️`);
  }

  async function trackReasonArchived(text) {
    if (!isTabletSpecific()) return;
    await sendTelegramMessage(`📁 موري أرشفت ورقة:\n*"${fmt.truncate(text, 100)}"* ✅`);
  }

  async function trackDeepEngagement(minutes) {
    if (!isTabletSpecific()) return;
    const today = new Date().toLocaleDateString('en-CA');
    if (!CD.pass(`engagement_${minutes}_${today}`, 24 * 60 * 60 * 1000)) return;
    await sendTelegramMessage(`⏱️ موري قضت أكتر من *${minutes} دقيقة* في الموقع دلوقتي.. كلامك بيلمسها 💙`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Stable Exposed Handles (useCallback Wrappers)
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!hasInitialized) {
      console.log("Telegram hook initialized successfully");
      hasInitialized = true;
    }
  }, []);

  return {
    sendTelegramMessage:  useCallback(sendTelegramMessage, [TELEGRAM_TOKEN, TELEGRAM_CHAT_ID]),
    sendTelegramMedia:    useCallback(sendTelegramMedia, [TELEGRAM_TOKEN, TELEGRAM_CHAT_ID]),
    trackAction:          useCallback(trackAction, []),
    trackReaction:        useCallback(trackReaction, []),
    trackMood:            useCallback(trackMood, []),
    sendNoteReaction:     useCallback(sendNoteReaction, [TELEGRAM_TOKEN, TELEGRAM_CHAT_ID]),
    sendEmergency:        useCallback(sendEmergency, [TELEGRAM_TOKEN, TELEGRAM_CHAT_ID]),
    sendPulse:            useCallback(sendPulse, [TELEGRAM_TOKEN, TELEGRAM_CHAT_ID]),
    trackMessageRead:     useCallback(trackMessageRead, [TELEGRAM_TOKEN, TELEGRAM_CHAT_ID]),
    trackMessageViewed:   useCallback(trackMessageViewed, [TELEGRAM_TOKEN, TELEGRAM_CHAT_ID]),
    trackAdviceViewed:    useCallback(trackAdviceViewed, [TELEGRAM_TOKEN, TELEGRAM_CHAT_ID]),
    trackSectionEntrance: useCallback(trackSectionEntrance, [TELEGRAM_TOKEN, TELEGRAM_CHAT_ID]),
    trackSongPlay:        useCallback(trackSongPlay, [TELEGRAM_TOKEN, TELEGRAM_CHAT_ID]),
    trackFavorite:        useCallback(trackFavorite, [TELEGRAM_TOKEN, TELEGRAM_CHAT_ID]),
    trackSafeBoxOpen:     useCallback(trackSafeBoxOpen, [TELEGRAM_TOKEN, TELEGRAM_CHAT_ID]),
    trackHesitation:      useCallback(trackHesitation, [TELEGRAM_TOKEN, TELEGRAM_CHAT_ID]),
    pollTelegramReplies:  useCallback(pollTelegramReplies, [subscribe]),
    buildMessageWithMood: useCallback(buildMessageWithMood, []),
    checkFirstVisitToday: useCallback(checkFirstVisitToday, [TELEGRAM_TOKEN, TELEGRAM_CHAT_ID]),
    checkWeeklyReport:    useCallback(checkWeeklyReport, [TELEGRAM_TOKEN, TELEGRAM_CHAT_ID]),
    trackAtmosphereChange:useCallback(trackAtmosphereChange, [TELEGRAM_TOKEN, TELEGRAM_CHAT_ID]),
    trackReasonOpened:    useCallback(trackReasonOpened, [TELEGRAM_TOKEN, TELEGRAM_CHAT_ID]),
    trackReasonArchived:  useCallback(trackReasonArchived, [TELEGRAM_TOKEN, TELEGRAM_CHAT_ID]),
    trackDeepEngagement:  useCallback(trackDeepEngagement, [TELEGRAM_TOKEN, TELEGRAM_CHAT_ID]),
    trackMilestone:       useCallback(trackMilestone, [TELEGRAM_TOKEN, TELEGRAM_CHAT_ID]),
  };
}