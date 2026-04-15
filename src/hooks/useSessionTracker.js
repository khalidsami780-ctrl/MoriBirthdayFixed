import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { isTabletSpecific } from './useTelegramBot';

// ─────────────────────────────────────────────────────────────────────────────
// Session Importance Score (0–100)
//
// Only sessions with score >= MIN_SCORE_TO_REPORT trigger a Telegram summary.
// This prevents spammy reports for 20-second visits or accidental opens.
//
// Scoring breakdown:
//   Duration          → up to 20 pts  (1pt per 3 min, max 20)
//   Mood selections   → up to 30 pts  (15pt each, max 2)
//   Message reads     → up to 25 pts  (8pt each, max ~3)
//   Music engagement  → 5 pts         (any song played)
//   Multi-section nav → 5 pts         (visited 3+ unique pages)
//   Negative mood     → +10 pts       (warrants more attention)
//   SafeBox opened    → +5 pts
// ─────────────────────────────────────────────────────────────────────────────

const MIN_SCORE_TO_REPORT = 20;

const NEGATIVE_MOODS = new Set([
  'random_sadness', 'anxious', 'overthinking', 'missing_you', 'stressed', 'sad',
]);

function calculateImportance(actions, durationMinutes) {
  let score = 0;

  const moods     = actions.filter(a => a.type === 'mood');
  const reads     = actions.filter(a => a.type === 'read');
  const songs     = actions.filter(a => a.type === 'song');
  const pages     = actions.filter(a => a.type === 'page');
  const reactions = actions.filter(a => a.type === 'reaction');

  score += Math.min(20, Math.floor(durationMinutes / 3));
  score += Math.min(30, moods.length * 15);
  score += Math.min(25, reads.length * 8);
  score += Math.min(20, reactions.length * 10); // Reactions are highly relevant
  if (songs.length > 0) score += 5;
  if (new Set(pages.map(p => p.value)).size >= 3) score += 5;
  if (moods.some(m => NEGATIVE_MOODS.has(m.value))) score += 10;
  if (actions.some(a => a.type === 'safebox')) score += 5;

  return Math.min(100, score);
}

// ─────────────────────────────────────────────────────────────────────────────
// Night Visit Detector
// Sends a special alert if Mori is active between 11 PM – 3 AM
// (once per night, not per session)
// ─────────────────────────────────────────────────────────────────────────────

function checkNightVisit(sendTelegramMessage) {
  const hour = new Date().getHours();
  if (hour < 23 && hour >= 3) return; // Only night hours
  const nightKey = `night_alert_${new Date().toLocaleDateString('en-CA')}`;
  if (sessionStorage.getItem(nightKey)) return;
  sessionStorage.setItem(nightKey, 'true');
  sendTelegramMessage(
    `🌙 موري صاحية متأخر الليل (${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })})...\n` +
    `تأكد إنها بخير، ممكن تكون محتاجة كلمة منك 💙`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Behavioral Pattern Recognition
//
// Each pattern checks the last N actions for a meaningful sequence.
// sessionStorage gates ensure each pattern fires once per session only.
// ─────────────────────────────────────────────────────────────────────────────

const PATTERNS = [
  {
    id: 'reassurance_seeking',
    check: (actions) => {
      const recent = actions.slice(-5);
      const hasNegMood = recent.some(a => a.type === 'mood' && NEGATIVE_MOODS.has(a.value));
      const readCount  = recent.filter(a => a.type === 'read').length;
      return hasNegMood && readCount >= 2;
    },
    message: (actions) => {
      const mood = actions.slice().reverse().find(a => a.type === 'mood' && NEGATIVE_MOODS.has(a.value));
      const label = mood?.label || 'حزينة/قلقانة';
      return (
        `🚨 *استنتاج ذكي — بحث عن الأمان:*\n` +
        `موري اختارت حالة [${label}] وبعدها قرأت أكتر من رسالة متتالية...\n` +
        `هي بتدور على الأمان في كلامك دلوقتي، يفضل تكلمها حالاً 📞`
      );
    },
  },
  {
    id: 'missing_deep_read',
    check: (actions) => {
      const recent = actions.slice(-6);
      const hasMissing = recent.some(a => a.type === 'mood' && a.value === 'missing_you');
      const readCount  = recent.filter(a => a.type === 'read').length;
      return hasMissing && readCount >= 1;
    },
    message: () =>
      `💌 *موري في حالة اشتياق:*\n` +
      `اختارت [بافتقدك] وبعدين راحت قرأت رسائل الحب...\n` +
      `قلبها عندك جداً دلوقتي، ابعتلها رسالة صغيرة 🥺`,
  },
  {
    id: 'safebox_hesitation_loop',
    check: (actions) => {
      const recent = actions.slice(-6);
      const safeboxActions = recent.filter(a => a.type === 'safebox').length;
      return safeboxActions >= 2;
    },
    message: () =>
      `⚠️ *موري تفتح صندوق الأمان أكتر من مرة:*\n` +
      `فتحته أكثر من مرة في الجلسة دي بدون ما تبعت حاجة...\n` +
      `في حاجة بتحتاج تقولهالك بس مترددة 💙`,
  },
  {
    id: 'overthinking_music_escape',
    check: (actions) => {
      const recent = actions.slice(-5);
      const hasOverthinking = recent.some(a => a.type === 'mood' && a.value === 'overthinking');
      const songCount = recent.filter(a => a.type === 'song').length;
      return hasOverthinking && songCount >= 2;
    },
    message: () =>
      `🎵 *موري بتهرب في الموسيقى:*\n` +
      `اختارت [أفكار كتير] وبعدها غيرت أكتر من أغنية...\n` +
      `مخها مشغول، يمكن محتاجة تتكلم 🧠`,
  },
  {
    id: 'happy_engagement_peak',
    check: (actions) => {
      const recent = actions.slice(-6);
      const isHappy = recent.some(a => a.type === 'mood' && a.value === 'happy');
      const readCount = recent.filter(a => a.type === 'read').length;
      const songCount = recent.filter(a => a.type === 'song').length;
      return isHappy && (readCount + songCount) >= 3;
    },
    message: () =>
      `🌸 *موري في أفضل حالاتها:*\n` +
      `اختارت [بخير] وبعدها قرأت وسمعت موسيقى...\n` +
      `روحها مبسوطة دلوقتي، اغتنم اللحظة ✨`,
  },
];

function evaluatePatterns(actions, sendTelegramMessage) {
  if (actions.length < 3) return;
  for (const pattern of PATTERNS) {
    const sessionKey = `pattern_${pattern.id}`;
    if (sessionStorage.getItem(sessionKey)) continue;
    if (pattern.check(actions)) {
      sessionStorage.setItem(sessionKey, 'true');
      sendTelegramMessage(pattern.message(actions));
      break; // Fire only one pattern per evaluation cycle
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Smart Session Summary Builder
// ─────────────────────────────────────────────────────────────────────────────

function buildSessionSummary(actions, durationMinutes, score) {
  const pages  = actions.filter(a => a.type === 'page');
  const moods  = actions.filter(a => a.type === 'mood');
  const reads  = actions.filter(a => a.type === 'read');
  const songs  = actions.filter(a => a.type === 'song');

  const parts = [
    `📖 *ملخص جلسة موري* (${durationMinutes} دقيقة | أهمية: ${score}/100)\n`,
  ];

  // Pages visited with time
  if (pages.some(p => p.durationSeconds > 15)) {
    parts.push(`📍 *الصفحات:*`);
    pages
      .filter(p => p.durationSeconds > 15)
      .forEach(p => {
        const mins = (p.durationSeconds / 60).toFixed(1);
        parts.push(`• ${p.value} (${mins} دقيقة)`);
      });
  }

  // Mood journey
  if (moods.length > 0) {
    const moodJourney = moods.map(m => m.label).join(' → ');
    parts.push(`\n▫️ رحلة المزاج: ${moodJourney}`);
  }

  // Reads
  if (reads.length > 0) {
    parts.push(`▫️ قرأت *${reads.length}* رسالة 💌`);
  }

  // Music
  if (songs.length === 1) {
    parts.push(`▫️ سمعت: *${songs[0].value}* 🎶`);
  } else if (songs.length > 1) {
    parts.push(`▫️ سمعت *${songs.length}* أغاني 🎶`);
  }

  // Emotional closing line based on last mood
  const lastNegMood = [...moods].reverse().find(m => NEGATIVE_MOODS.has(m.value));
  if (lastNegMood) {
    parts.push(`\n💙 انتهت جلستها وهي لسه في حالة [${lastNegMood.label}]`);
  } else if (moods.some(m => m.value === 'happy')) {
    parts.push(`\n🌸 انتهت جلستها بمزاج إيجابي`);
  }

  return parts.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// GlobalSessionTracker Component
// Silent component — renders nothing, just wires up event listeners.
// ─────────────────────────────────────────────────────────────────────────────

export function GlobalSessionTracker({ sendTelegramMessage }) {
  const sessionActions  = useRef([]);
  const sessionStart    = useRef(Date.now());
  const inactivityTimer = useRef(null);
  const pageEnterTime   = useRef(Date.now());
  const currentPage     = useRef('/');
  const nightCheckDone  = useRef(false);

  const location = useLocation();

  // ── Flush Session (send summary) ───────────────────────────────────────────

  const flushSession = useCallback(() => {
    if (!isTabletSpecific() || sessionActions.current.length === 0) return;

    const durationMinutes = Math.round((Date.now() - sessionStart.current) / 60000);
    const actions = [...sessionActions.current];
    const score = calculateImportance(actions, durationMinutes);

    // Ensure reactions or mood changes always force a report regardless of total score
    const hasCriticalAction = actions.some(a => a.type === 'reaction' || a.type === 'mood');

    // Don't report trivial sessions unless they contain critical actions
    if (score < MIN_SCORE_TO_REPORT && !hasCriticalAction) {
      sessionActions.current = [];
      return;
    }

    const summary = buildSessionSummary(actions, durationMinutes, score);
    sendTelegramMessage(summary);

    // Reset
    sessionActions.current = [];
    sessionStart.current = Date.now();

    // Clear pattern session keys so next session can re-trigger them
    PATTERNS.forEach(p => sessionStorage.removeItem(`pattern_${p.id}`));
  }, [sendTelegramMessage]);

  // ── Inactivity Reset ───────────────────────────────────────────────────────

  const resetInactivity = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(flushSession, 15 * 60 * 1000); // 15 min
  }, [flushSession]);

  // ── Track Custom Actions ───────────────────────────────────────────────────

  useEffect(() => {
    const handleTrack = (e) => {
      if (!isTabletSpecific() || !e.detail) return;
      sessionActions.current.push({ ...e.detail, time: Date.now() });
      resetInactivity();
      evaluatePatterns(sessionActions.current, sendTelegramMessage);
    };

    window.addEventListener('mori_track_action', handleTrack);
    return () => window.removeEventListener('mori_track_action', handleTrack);
  }, [resetInactivity, sendTelegramMessage]);

  // ── Track Page Changes ────────────────────────────────────────────────────

  useEffect(() => {
    if (!isTabletSpecific()) return;

    const timeSpent = Math.round((Date.now() - pageEnterTime.current) / 1000);
    if (timeSpent > 5) {
      sessionActions.current.push({
        type: 'page',
        value: currentPage.current,
        durationSeconds: timeSpent,
        time: Date.now(),
      });
    }

    currentPage.current = location.pathname;
    pageEnterTime.current = Date.now();
    resetInactivity();
  }, [location.pathname, resetInactivity]);

  // ── Night Visit Check ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!isTabletSpecific() || nightCheckDone.current) return;
    nightCheckDone.current = true;
    checkNightVisit(sendTelegramMessage);
  }, [sendTelegramMessage]);

  // ── UI Activity Listeners + Unload ────────────────────────────────────────

  useEffect(() => {
    const handleUnload = () => {
      if (!isTabletSpecific()) return;
      const timeSpent = Math.round((Date.now() - pageEnterTime.current) / 1000);
      if (timeSpent > 5) {
        sessionActions.current.push({
          type: 'page',
          value: currentPage.current,
          durationSeconds: timeSpent,
          time: Date.now(),
        });
      }
      flushSession();
    };

    const handleActivity = () => resetInactivity();

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity, { passive: true });
    window.addEventListener('touchstart', handleActivity, { passive: true });

    resetInactivity();

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [flushSession, resetInactivity]);

  return null;
}