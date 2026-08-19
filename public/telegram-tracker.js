(() => {
  if (window.__moriTelegramWatcher) return
  window.__moriTelegramWatcher = true

  const SESSION_KEY = 'mori_telegram_session'
  const INACTIVITY_MS = 5 * 60 * 1000
  const HEARTBEAT_MS = 30 * 1000
  const MIN_INTERACTION_GAP_MS = 1500
  const routeNames = { '/birthday': 'Birthday', '/eid': 'Eid' }
  const session = {
    id: `mori_${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)}_${Math.random().toString(36).slice(2, 6)}`,
    startedAt: new Date().toISOString(),
    lastSeenAt: Date.now(),
    currentRoute: window.location.pathname,
    pagesVisited: [window.location.pathname],
    pageStartedAt: Date.now(),
    pageTimesMs: {},
    interactions: 0,
    specialInteractions: 0,
    musicEvents: 0,
    lastAction: 'Session started',
    ended: false,
    musicStartedAt: null,
    musicPlayedMs: 0,
  }

  const pageName = (route) => routeNames[route] || route.replace(/^\//, '') || 'Home'
  const deviceInfo = () => {
    const ua = navigator.userAgent
    const lower = ua.toLowerCase()
    const device = /ipad|tablet|android(?!.*mobile)/i.test(ua) ? 'Tablet' : /mobi|iphone|ipod|android/i.test(ua) ? 'Mobile' : 'Desktop'
    const browser = /edg\//i.test(ua) ? 'Edge' : /firefox\//i.test(ua) ? 'Firefox' : /chrome\//i.test(ua) ? 'Chrome' : /safari\//i.test(ua) ? 'Safari' : 'Other'
    const os = /android/i.test(ua) ? 'Android' : /iphone|ipad|ipod/i.test(ua) ? 'iOS' : /windows/i.test(ua) ? 'Windows' : /macintosh|mac os x/i.test(ua) ? 'macOS' : /linux/i.test(ua) ? 'Linux' : 'Other'
    return { device, browser, os, screen: `${window.screen?.width || 0} × ${window.screen?.height || 0}` }
  }

  const send = (event, extra = {}, useBeacon = false) => {
    if (session.ended) return
    const payload = JSON.stringify({ event, sessionId: session.id, route: session.currentRoute, page: pageName(session.currentRoute), timestamp: new Date().toISOString(), ...deviceInfo(), ...extra })
    try {
      if (useBeacon && navigator.sendBeacon) {
        navigator.sendBeacon('/api/telegram-track', new Blob([payload], { type: 'application/json' }))
        return
      }
      fetch('/api/telegram-track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(() => {})
    } catch (_) {}
  }

  const recordPageTime = (route, now = Date.now()) => {
    const elapsed = Math.max(0, now - session.pageStartedAt)
    session.pageTimesMs[route] = (session.pageTimesMs[route] || 0) + elapsed
    session.pageStartedAt = now
  }

  const sendRouteChange = (nextRoute) => {
    if (!nextRoute || nextRoute === session.currentRoute || session.ended) return
    const now = Date.now()
    const previousRoute = session.currentRoute
    const previousDuration = now - session.pageStartedAt
    recordPageTime(previousRoute, now)
    session.currentRoute = nextRoute
    session.pagesVisited.push(nextRoute)
    session.lastSeenAt = now
    session.lastAction = `Entered ${pageName(nextRoute)}`
    send('route_change', { previousRoute, previousPage: pageName(previousRoute), nextRoute, nextPage: pageName(nextRoute), previousPageDurationMs: previousDuration })
  }

  const checkRoute = () => {
    const next = window.location.pathname
    if (next !== session.currentRoute) sendRouteChange(next)
  }

  const wrapHistory = (name) => {
    const original = history[name]
    history[name] = function (...args) {
      const result = original.apply(this, args)
      queueMicrotask(checkRoute)
      return result
    }
  }
  wrapHistory('pushState')
  wrapHistory('replaceState')
  window.addEventListener('popstate', checkRoute)

  const interactionLabel = (target) => {
    if (!(target instanceof Element)) return null
    const control = target.closest('button, a, [role="button"]')
    if (!control) return null
    const label = control.getAttribute('aria-label') || control.getAttribute('title') || control.textContent?.trim()
    return label ? label.replace(/\s+/g, ' ').slice(0, 120) : null
  }

  let lastInteractionAt = 0
  document.addEventListener('click', (event) => {
    const now = Date.now()
    if (now - lastInteractionAt < MIN_INTERACTION_GAP_MS || session.ended) return
    const label = interactionLabel(event.target)
    if (!label) return
    lastInteractionAt = now
    session.lastSeenAt = now
    session.interactions += 1
    session.lastAction = label
    const lower = label.toLowerCase()
    const special = /letter|card|message|eid|memory|gift|open|next|previous|music|play|pause/.test(lower)
    if (special) session.specialInteractions += 1
    send(special ? 'special_interaction' : 'interaction', { label })
  }, true)

  document.addEventListener('play', (event) => {
    const audio = event.target
    if (!(audio instanceof HTMLMediaElement)) return
    if (session.ended) return
    session.lastSeenAt = Date.now()
    session.musicEvents += 1
    session.musicStartedAt = Date.now()
    session.lastAction = 'Music started'
    const track = audio.getAttribute('aria-label') || audio.dataset.track || audio.getAttribute('title') || 'Current website audio'
    send('music_started', { track })
  }, true)

  document.addEventListener('pause', (event) => {
    const audio = event.target
    if (!(audio instanceof HTMLMediaElement) || !session.musicStartedAt || session.ended) return
    const now = Date.now()
    session.musicPlayedMs += Math.max(0, now - session.musicStartedAt)
    session.musicStartedAt = null
    session.lastSeenAt = now
    session.musicEvents += 1
    session.lastAction = 'Music paused'
    const track = audio.getAttribute('aria-label') || audio.dataset.track || audio.getAttribute('title') || 'Current website audio'
    send('music_paused', { track, playedMs: session.musicPlayedMs })
  }, true)

  document.addEventListener('ended', (event) => {
    const audio = event.target
    if (!(audio instanceof HTMLMediaElement) || session.ended) return
    if (session.musicStartedAt) session.musicPlayedMs += Math.max(0, Date.now() - session.musicStartedAt)
    session.musicStartedAt = null
    session.lastSeenAt = Date.now()
    session.musicEvents += 1
    session.lastAction = 'Music finished'
    const track = audio.getAttribute('aria-label') || audio.dataset.track || audio.getAttribute('title') || 'Current website audio'
    send('music_finished', { track, playedMs: session.musicPlayedMs })
  }, true)

  const finish = (reason = 'inactive') => {
    if (session.ended) return
    const now = Date.now()
    recordPageTime(session.currentRoute, now)
    if (session.musicStartedAt) session.musicPlayedMs += Math.max(0, now - session.musicStartedAt)
    session.musicStartedAt = null
    session.ended = true
    const pages = [...new Set(session.pagesVisited)]
    send('session_end', { startedAt: session.startedAt, durationMs: now - new Date(session.startedAt).getTime(), pagesVisited: pages, pageTimesMs: session.pageTimesMs, interactions: session.interactions, specialInteractions: session.specialInteractions, musicEvents: session.musicEvents, lastAction: session.lastAction, reason }, true)
  }

  const heartbeat = () => {
    if (session.ended) return
    const now = Date.now()
    if (document.visibilityState === 'visible') {
      session.lastSeenAt = now
      return
    }
    if (now - session.lastSeenAt >= INACTIVITY_MS) finish('inactive')
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      session.lastSeenAt = Date.now()
      return
    }
    session.lastSeenAt = Date.now()
  })
  window.addEventListener('pagehide', () => {
    if (Date.now() - session.lastSeenAt >= INACTIVITY_MS) finish('pagehide')
  })
  setInterval(heartbeat, HEARTBEAT_MS)

  send('session_start', { sessionId: session.id })
})()
