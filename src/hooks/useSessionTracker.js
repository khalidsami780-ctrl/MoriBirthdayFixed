import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { isTabletSpecific } from './useTelegramBot';

export function GlobalSessionTracker({ sendTelegramMessage }) {
  const sessionActions = useRef([]);
  const sessionStartTime = useRef(Date.now());
  const lastActiveTime = useRef(Date.now());
  const inactivityTimeout = useRef(null);
  
  const location = useLocation();
  const pageEnterTime = useRef(Date.now());
  const currentPage = useRef(location.pathname);

  const evaluateBehavioralPatterns = useCallback(() => {
    const actions = sessionActions.current;
    if (actions.length < 3) return;

    // Pattern 1: Seeking Reassurance
    const recent = actions.slice(-4);
    const hasSadMood = recent.some(a => a.type === 'mood' && ['sad', 'anxious', 'missing_you', 'random_sadness'].includes(a.value));
    const reads = recent.filter(a => a.type === 'read').length;
    
    if (hasSadMood && reads >= 3) {
      if (!sessionStorage.getItem('pattern_reassurance_triggered')) {
        sendTelegramMessage(`🚨 **استنتاج ذكي:** موري اختارت مود [حزينة/قلقة]، وبعدها فوراً قرأت أكتر من رسالة. هي بتدور على الأمان في كلامك جداً دلوقتي، يفضل تكلمها حالاً 📞`);
        sessionStorage.setItem('pattern_reassurance_triggered', 'true');
      }
    }
  }, [sendTelegramMessage]);

  const flushSession = useCallback(() => {
    if (!isTabletSpecific() || sessionActions.current.length === 0) return;

    const durationMinutes = Math.round((Date.now() - sessionStartTime.current) / 60000);
    const actions = sessionActions.current;
    
    let report = `📖 **ملخص جلسة موري (استغرقت ${durationMinutes} دقيقة):**\n\n`;
    
    const pages = actions.filter(a => a.type === 'page');
    if (pages.length > 0) {
        report += `📍 **الصفحات اللي زارتها:**\n`;
        pages.forEach(p => {
            const timeInMin = (p.durationSeconds / 60).toFixed(1);
            report += `• ${p.value} (${timeInMin} دقيقة)\n`;
        });
        report += `\n`;
    }

    const moods = actions.filter(a => a.type === 'mood').map(a => a.label);
    const reads = actions.filter(a => a.type === 'read').length;
    const songs = actions.filter(a => a.type === 'song').map(a => a.value);

    // Only send if there's significant activity
    if (pages.length === 0 && moods.length === 0 && reads === 0 && songs.length === 0) {
        sessionActions.current = [];
        return;
    }

    if (moods.length > 0) report += `▫️ دخلت في حالة: [${moods[0]}]\n`;
    if (songs.length > 1) report += `▫️ سمعت ${songs.length} أغاني 🎶\n`;
    else if (songs.length === 1) report += `▫️ سمعت أغنية: ${songs[0]} 🎶\n`;
    if (reads > 0) report += `▫️ قرأت ${reads} رسائل 💌\n`;
    
    const latestMood = moods[moods.length - 1];
    if (latestMood && moods.length > 1) report += `▫️ وانتهت جلستها بمزاج: [${latestMood}] 🌸\n`;

    // Only send the report if tracking actually got data worth sending (more than just a 2sec hop)
    if (durationMinutes > 0 || pages.some(p => p.durationSeconds > 10) || moods.length > 0 || reads > 0) {
        sendTelegramMessage(report);
    }

    // Reset session
    sessionActions.current = [];
    sessionStartTime.current = Date.now();
    sessionStorage.removeItem('pattern_reassurance_triggered');
  }, [sendTelegramMessage]);

  const resetInactivity = useCallback(() => {
    lastActiveTime.current = Date.now();
    if (inactivityTimeout.current) clearTimeout(inactivityTimeout.current);
    
    inactivityTimeout.current = setTimeout(() => {
      flushSession();
    }, 15 * 60 * 1000); // 15 minutes
  }, [flushSession]);

  useEffect(() => {
    const handleTrack = (e) => {
       if (!isTabletSpecific() || !e.detail) return;
       sessionActions.current.push({ ...e.detail, time: Date.now() });
       resetInactivity();
       evaluateBehavioralPatterns();
    };
    window.addEventListener('mori_track_action', handleTrack);

    return () => window.removeEventListener('mori_track_action', handleTrack);
  }, [resetInactivity, evaluateBehavioralPatterns]);

  useEffect(() => {
    if (!isTabletSpecific()) return;
    
    const timeSpent = Math.round((Date.now() - pageEnterTime.current) / 1000);
    // Ignore single momentary hops
    if (timeSpent > 2) {
       sessionActions.current.push({ type: 'page', value: currentPage.current, durationSeconds: timeSpent, time: Date.now() });
    }
    
    currentPage.current = location.pathname;
    pageEnterTime.current = Date.now();
    resetInactivity();
  }, [location.pathname, resetInactivity]);

  useEffect(() => {
    const handleUnload = () => {
      const timeSpent = Math.round((Date.now() - pageEnterTime.current) / 1000);
      if (timeSpent > 2 && isTabletSpecific()) {
         sessionActions.current.push({ type: 'page', value: currentPage.current, durationSeconds: timeSpent, time: Date.now() });
      }
      flushSession();
    };

    window.addEventListener('beforeunload', handleUnload);
    resetInactivity();
    
    const handleUI = () => resetInactivity();
    window.addEventListener('click', handleUI);
    window.addEventListener('scroll', handleUI, { passive: true });
    window.addEventListener('touchstart', handleUI, { passive: true });

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('click', handleUI);
      window.removeEventListener('scroll', handleUI);
      window.removeEventListener('touchstart', handleUI);
      if (inactivityTimeout.current) clearTimeout(inactivityTimeout.current);
    };
  }, [flushSession, resetInactivity]);

  return null; // Silent component
}
