export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return res.status(503).json({ error: 'Tracking is not configured' })

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const event = typeof body?.event === 'string' ? body.event.slice(0, 160) : 'unknown'
    const route = typeof body?.route === 'string' ? body.route.slice(0, 200) : '/'
    const timestamp = typeof body?.timestamp === 'string' ? body.timestamp : new Date().toISOString()
    const device = typeof body?.device === 'string' ? body.device.slice(0, 32) : 'unknown'
    const text = ['Mori website activity', `Event: ${event}`, `Route: ${route}`, `Device: ${device}`, `Time: ${timestamp}`].join('\\n')
    const apiBase = Buffer.from('aHR0cHM6Ly9hcGkudGVsZWdyYW0ub3JnL2JvdA==', 'base64').toString('utf8')
    const response = await fetch(`${apiBase}${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    })
    if (!response.ok) return res.status(502).json({ error: 'Telegram request failed' })
    return res.status(204).end()
  } catch {
    return res.status(400).json({ error: 'Invalid tracking request' })
  }
}
