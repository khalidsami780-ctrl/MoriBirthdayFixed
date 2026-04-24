import { lazy, Suspense, useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

/* ── Code splitting: each page loads only when navigated to ── */
const BirthdayPage  = lazy(() => import('./pages/BirthdayPage.jsx'))
const EidPage       = lazy(() => import('./pages/EidPage.jsx'))
const MessagesPage  = lazy(() => import('./pages/MessagesPage.jsx'))
const SafeBox       = lazy(() => import('./components/SafeBox.jsx'))
const GlobalToast   = lazy(() => import('./components/GlobalToast.jsx'))
const RandomLoveToast = lazy(() => import('./components/RandomLoveToast.jsx'))
const FloatingMusicPlayer = lazy(() => import('./components/FloatingMusicPlayer.jsx'))
const UpdateNotification = lazy(() => import('./components/UpdateNotification.jsx'))
const NotificationBell = lazy(() => import('./components/NotificationBell.jsx'))
const Navbar = lazy(() => import('./components/Navbar.jsx'))
const LiveNote = lazy(() => import('./components/LiveNote.jsx'))
const PulseOverlay = lazy(() => import('./components/PulseOverlay.jsx'))
const UnityHub = lazy(() => import('./pages/UnityHub.jsx'))
const GlobalAtmosphere = lazy(() => import('./components/GlobalAtmosphere.jsx'))
const AtmosphereController = lazy(() => import('./components/AtmosphereController.jsx'))

import useActiveTheme from './hooks/useActiveTheme.js'
import { isTabletSpecific } from './hooks/useTelegramBot.js'
import { useTelegram } from './context/TelegramContextCore.jsx'
import { useSupabaseSync } from './hooks/useSupabaseSync.js'
import { GlobalSessionTracker } from './hooks/useSessionTracker.js'
import { supabase } from './lib/supabase.js'

/* ── Full-screen loading fallback ─────────────────────────── */
function PageLoader() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-deep)',
    }}>
      <motion.div
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          fontFamily: `'Scheherazade New','Arial',serif`,
          fontSize: '1.5rem', color: 'rgba(168,200,248,0.6)',
          letterSpacing: '0.1em',
        }}
      >
        ✦
      </motion.div>
    </div>
  )
}

export default function App() {
  const location = useLocation()
  const [showEnhancements, setShowEnhancements] = useState(false)
  const { checkFirstVisitToday, checkWeeklyReport, trackDeepEngagement, pollTelegramReplies, sendTelegramMessage } = useTelegram()
  const { themeStyles } = useActiveTheme()
  
  // Migrate old localStorage data to Supabase (Runs once per device)
  useSupabaseSync()

  useEffect(() => {
    // Initial tracking on app mount
    checkFirstVisitToday()
    checkWeeklyReport()

    // --- 1. Inactivity Alert (Checked by Khalid's Device ideally, or globally) ---
    if (!isTabletSpecific()) {
      supabase.from('mori_presence').select('*').eq('id', 1).maybeSingle().then(({ data }) => {
        if (data && data.last_seen) {
          const daysAway = (Date.now() - data.last_seen) / (1000 * 60 * 60 * 24);
          if (daysAway > 3 && !sessionStorage.getItem('inactivity_alert_sent')) {
            sendTelegramMessage(`⚠️ موري مفتحتش الملاذ الآمن بقالها أكثر من ${Math.floor(daysAway)} أيام.. لعل المانع خير، حاول تطمن عليها 💌`);
            sessionStorage.setItem('inactivity_alert_sent', 'true');
          }
        }
      });
    }

    // --- 2. Live Presence Heartbeat (Mori's Device) ---
    let presenceInterval;

    const updatePresence = async (isOnline = true) => {
      const { error } = await supabase.from('mori_presence').upsert(
        { id: 1, online: isOnline, last_seen: Date.now() },
        { onConflict: 'id' }
      );
      if (error && error.code !== 'PGRST116') console.log("Presence Error:", error);
    };

    updatePresence(true);

    // ⚡ أسرع عشان status يبقى دقيق
    presenceInterval = setInterval(() => updatePresence(true), 5000);

    const handleUnload = () => updatePresence(false);
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(presenceInterval);
      window.removeEventListener('beforeunload', handleUnload);
      updatePresence(false);
    };

  }, [checkFirstVisitToday, checkWeeklyReport, sendTelegramMessage])

  // --- 3. Handle System Bot Commands ---
  useEffect(() => {
    return pollTelegramReplies(
      () => {}, () => {}, 
      async (signal) => {
        if (signal.type === 'status') {
          const { data } = await supabase.from('mori_presence').select('*').eq('id', 1).maybeSingle();
          if (data && data.online && (Date.now() - data.last_seen < 120000)) {
            sendTelegramMessage("🟢 موري متصلة بالموقع الآن.");
          } else {
            const timeAgo = data?.last_seen ? new Date(data.last_seen).toLocaleString('ar-EG') : 'غير معروف';
            sendTelegramMessage(`🔴 أوفلاين الآن. (آخر ظهور: ${timeAgo})`);
          }
        } else if (signal.type === 'report') {
          checkWeeklyReport(true);
          const og = localStorage.getItem('mori_weekly_report_sent');
          localStorage.setItem('mori_weekly_report_sent', 'force');
          checkWeeklyReport();
          localStorage.setItem('mori_weekly_report_sent', og);
        }
      }
    );
  }, [pollTelegramReplies, sendTelegramMessage, checkWeeklyReport]);

  // Global Engagement Timer (tracks if she spends a long time in the site today)
  useEffect(() => {
    const milestones = [15, 30, 45, 60];
    const timers = milestones.map(mins => {
      return setTimeout(() => {
        trackDeepEngagement(mins);
      }, mins * 60 * 1000);
    });

    return () => timers.forEach(clearTimeout);
  }, [trackDeepEngagement]);

  useEffect(() => {
    let cancelled = false
    let cleanup = () => {}

    const startDeferredWork = () => {
      if (cancelled) return
      setShowEnhancements(true)
    }

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(startDeferredWork, { timeout: 1500 })
      cleanup = () => window.cancelIdleCallback(idleId)
    } else {
      const timeoutId = window.setTimeout(startDeferredWork, 180)
      cleanup = () => window.clearTimeout(timeoutId)
    }

    return () => {
      cancelled = true
      cleanup()
    }
  }, [])

  return (
    <Suspense fallback={<PageLoader />}>
        <div style={{ 
          position: 'relative', 
          minHeight: '100vh', 
          transition: 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
          ...themeStyles
        }}>
          {/* Atmosphere Overlay Layer */}
          <div style={{
             position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 5,
             background: 'radial-gradient(circle at 50% 50%, var(--atmosphere-glow), transparent 70%)',
             filter: 'var(--atmosphere-filter)',
             transition: 'all 1.5s ease'
          }} />

          {/* 2. Routes Layer - Safebox portal inside here will stack ON TOP of Navbar */}
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/"          element={<Navigate to="/birthday" replace />} />
              <Route path="/birthday"  element={<BirthdayPage />} />
              <Route path="/eid"       element={<EidPage />} />
              <Route path="/messages"  element={<MessagesPage />} />
              <Route path="/unity"     element={<UnityHub />} />
              <Route path="/safebox"   element={<SafeBox />} />
              <Route path="*"          element={<Navigate to="/birthday" replace />} />
            </Routes>
          </AnimatePresence>

          {/* 1. Base UI Layer (Portalled) */}
          <Navbar />

          {/* 3. Utility & Global Layer (rendered last = highest top) */}
          {showEnhancements && (
            <Suspense fallback={null}>
              <FloatingMusicPlayer />
              <RandomLoveToast />
              <UpdateNotification />
              <NotificationBell />
              <GlobalToast />
              <LiveNote />
              <PulseOverlay />
              <GlobalAtmosphere />
              <AtmosphereController />
            </Suspense>
          )}

          {/* Global singleton session tracker */}
          <GlobalSessionTracker sendTelegramMessage={sendTelegramMessage} />
        </div>
      </Suspense>
  )
}
