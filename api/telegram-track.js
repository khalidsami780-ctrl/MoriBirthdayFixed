export default async function handler(req, res) {
  const EVENT_TYPES = new Set(['session_start', 'route_change', 'interaction', 'special_interaction', 'music_started', 'music_paused', 'music_resumed', 'music_finished', 'session_end', 'heartbeat'])
  const routeNames = { '/birthday': 'Birthday', '/eid': 'Eid' }
  const pageName = (route = '/') => routeNames[route] || route.replace(/^\//, '') || 'Home'
  const trim = (value, max) => String(value ?? '').replace(/[\u0000-\u001F\u007F]/g, '').slice(0, max)
  const duration = (ms) => {
    const total = Math.max(0, Math.round(Number(ms || 0) / 1000))
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    return h > 0 ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  const time = (value) => {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? 'Unknown time' : new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(date)
  }
  const location = () => {
    const city = trim(req.headers['x-vercel-ip-city'], 80)
    const country = trim(req.headers['x-vercel-ip-country'], 16)
    return [city, country].filter(Boolean).join(', ')
  }
  const pageTimes = (values = {}) => Object.entries(values).filter(([, ms]) => Number(ms) > 0).map(([route, ms]) => `• ${pageName(route)}: ${duration(ms)}`).join('\n') || 'No page timing recorded.'

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return res.status(503).json({ error: 'Tracking is not configured' })

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const event = trim(body?.event, 40)
    if (!EVENT_TYPES.has(event) || event === 'heartbeat') return res.status(204).end()

    const route = trim(body?.route || '/', 200)
    const page = trim(body?.page || pageName(route), 80)
    const sessionId = trim(body?.sessionId || 'unknown', 80)
    const device = trim(body?.device || 'Unknown', 32)
    const browser = trim(body?.browser || 'Unknown', 32)
    const os = trim(body?.os || 'Unknown', 32)
    const screen = trim(body?.screen || 'Unknown', 32)
    const timestamp = body?.timestamp || new Date().toISOString()
    const approxLocation = location()
    const locationLine = approxLocation ? `\n📍 Approx. location:\n${approxLocation}` : ''
    let text = ''

    if (event === 'session_start') text = ['🛡️ MORI WEBSITE WATCHER', '━━━━━━━━━━━━━━━━━━', '', '🟢 SESSION STARTED', '', 'Someone just opened the website.', '', `🆔 ${sessionId}`, `🕐 Started: ${time(timestamp)}`, `📄 Page: ${page}`, `🔗 Route: ${route}`, `📱 Device: ${device}`, `🌐 Browser: ${browser}`, `💻 OS: ${os}`, `📐 Screen: ${screen}`, locationLine, '', '━━━━━━━━━━━━━━━━━━', '👀 WATCHING ACTIVITY...'].filter(Boolean).join('\n')
    else if (event === 'route_change') text = ['🛡️ MORI WEBSITE WATCHER', '━━━━━━━━━━━━━━━━━━', '', '📄 PAGE CHANGE', '', `➡️ ${trim(body.previousPage || pageName(body.previousRoute), 80)}`, '      ↓', `➡️ ${trim(body.nextPage || pageName(body.nextRoute), 80)}`, '', `⏱️ Previous page: ${duration(body.previousPageDurationMs)}`, `🕐 ${time(timestamp)}`, `📱 ${device}`].join('\n')
    else if (event === 'interaction' || event === 'special_interaction') text = ['🛡️ MORI WEBSITE WATCHER', '━━━━━━━━━━━━━━━━━━', '', event === 'special_interaction' ? '💌 SPECIAL INTERACTION' : '🖱️ INTERACTION', '', `💬 "${trim(body.label || 'Unnamed control', 120)}"`, `📄 Page: ${page}`, `🕐 ${time(timestamp)}`, `📱 ${device}`].join('\n')
    else if (event.startsWith('music_')) {
      const labels = { music_started: '🎵 MUSIC STARTED', music_resumed: '▶️ MUSIC RESUMED', music_paused: '⏸️ MUSIC PAUSED', music_finished: '🎵 MUSIC FINISHED' }
      text = ['🛡️ MORI WEBSITE WATCHER', '━━━━━━━━━━━━━━━━━━', '', labels[event], '', `🎧 ${trim(body.track || 'Current website audio', 120)}`, `📄 ${page}`, event === 'music_paused' || event === 'music_finished' ? `⏱️ Played: ${duration(body.playedMs)}` : null, `🕐 ${time(timestamp)}`, `📱 ${device}`].filter(Boolean).join('\n')
    } else if (event === 'session_end') {
      const pages = Array.isArray(body.pagesVisited) && body.pagesVisited.length ? body.pagesVisited.map((item) => trim(item, 80)).join(' → ') : 'None recorded'
      text = ['🛡️ MORI WEBSITE WATCHER', '━━━━━━━━━━━━━━━━━━', '', '🔴 SESSION ENDED', '', `🆔 ${sessionId}`, `🕐 Started: ${time(body.startedAt)}`, `🔴 Ended: ${time(timestamp)}`, `⏱️ Duration: ${duration(body.durationMs)}`, '', `📄 Pages visited: ${Array.isArray(body.pagesVisited) ? body.pagesVisited.length : 0}`, `🧭 Path: ${pages}`, `🖱️ Meaningful interactions: ${Math.max(0, Number(body.interactions) || 0)}`, `🎵 Music events: ${Math.max(0, Number(body.musicEvents) || 0)}`, `💌 Special interactions: ${Math.max(0, Number(body.specialInteractions) || 0)}`, `📱 Device: ${device}`, `🌐 Browser: ${browser}`, `💻 OS: ${os}`, `📐 Screen: ${screen}`, '', '━━━━━━━━━━━━━━━━━━', '📊 TIME SPENT', pageTimes(body.pageTimesMs), '', '━━━━━━━━━━━━━━━━━━', '📝 LAST ACTIVITY', trim(body.lastAction || 'None recorded', 160), locationLine].filter(Boolean).join('\n')
    }

    if (!text) return res.status(204).end()
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text }) })
    if (!response.ok) return res.status(502).json({ error: 'Telegram request failed' })
    return res.status(204).end()
  } catch {
    return res.status(400).json({ error: 'Invalid tracking request' })
  }
}
