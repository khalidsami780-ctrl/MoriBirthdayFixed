(() => {
  const getDeviceCategory = () => {
    const ua = navigator.userAgent.toLowerCase()
    if (/ipad|tablet|android(?!.*mobile)/i.test(ua)) return 'tablet'
    if (/mobi|iphone|ipod|android/i.test(ua)) return 'mobile'
    return 'desktop'
  }

  const sendEvent = (event) => {
    const payload = JSON.stringify({
      event,
      route: window.location.pathname,
      timestamp: new Date().toISOString(),
      device: getDeviceCategory(),
    })

    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/telegram-track', new Blob([payload], { type: 'application/json' }))
      return
    }

    fetch('/api/telegram-track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {})
  }

  const trackRoute = (() => {
    let lastRoute = window.location.pathname
    return () => {
      const route = window.location.pathname
      if (route === lastRoute) return
      lastRoute = route
      sendEvent('route_change')
    }
  })()

  const originalPushState = history.pushState
  const originalReplaceState = history.replaceState

  history.pushState = function (...args) {
    const result = originalPushState.apply(this, args)
    trackRoute()
    return result
  }

  history.replaceState = function (...args) {
    const result = originalReplaceState.apply(this, args)
    trackRoute()
    return result
  }

  window.addEventListener('popstate', trackRoute)

  let lastInteraction = 0
  document.addEventListener('click', (event) => {
    const now = Date.now()
    if (now - lastInteraction < 1500) return

    const target = event.target instanceof Element
      ? event.target.closest('button, a, [role="button"]')
      : null
    if (!target) return

    const label = target.getAttribute('aria-label') || target.textContent?.trim()
    if (!label) return

    lastInteraction = now
    sendEvent(`interaction: ${label.replace(/\\s+/g, ' ').slice(0, 120)}`)
  }, true)

  const initialRoute = window.location.pathname
  if (initialRoute !== '/') sendEvent('initial_visit')
  else window.addEventListener('load', () => setTimeout(() => sendEvent('initial_visit'), 0), { once: true })
})()
