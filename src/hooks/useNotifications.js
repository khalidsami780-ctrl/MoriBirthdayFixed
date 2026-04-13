import { useEffect, useSyncExternalStore, useRef } from 'react'

const READ_STORAGE_KEY = 'mori_read_notifs'
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

const notificationState = {
  notifications: [],
  unreadCount: 0,
}

const listeners = new Set()
let notificationsPromise = null

function emitChange() {
  listeners.forEach(listener => listener())
}

function pushNotification(text) {
  const newNotif = {
    id: `sys-${Date.now()}`,
    type: 'system',
    text,
    createdAt: Date.now(),
    isRead: false,
  };
  notificationState.notifications = [newNotif, ...notificationState.notifications];
  emitChange();
}

function safeReadStoredIds(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function safeWriteStoredIds(key, ids) {
  try {
    localStorage.setItem(key, JSON.stringify(ids))
  } catch (error) {
    console.warn('Storage write failed', error)
  }
}

function buildNotifications(messages, tips, playlist, storedRead) {
  const now = Date.now()
  const rawData = [
    ...messages.map(message => ({ ...message, notifType: 'message' })),
    ...tips.map(tip => ({ ...tip, notifType: 'tip' })),
    ...playlist.filter(track => track.createdAt).map(track => ({ ...track, notifType: 'song' })),
  ]

  return rawData
    .filter(item => now <= item.createdAt + THIRTY_DAYS_MS)
    .map(item => {
      let text = ''
      let route = null
      let targetId = null
      let tab = null

      if (item.notifType === 'message') {
        text = `تم إضافة رسالة جديدة لكِ 💙: ${item.title || 'مفاجأة 🌸'}`
        route = '/messages'
        targetId = `message-${item.id}`
        tab = 'messages'
      } else if (item.notifType === 'tip') {
        text = `تم إضافة نصيحة جديدة لكِ 🌸: ${item.title || 'مفاجأة 💙'}`
        route = '/messages'
        targetId = `tip-${item.id}`
        tab = 'advice'
      } else if (item.notifType === 'song') {
        text = `🎶 تم إضافة أغنية جديدة عشان تسمعيها! (${item.title})`
      }

      const uniqueId = item.notifType === 'song' ? `song-${item.id}` : item.id

      return {
        id: uniqueId,
        type: item.notifType,
        text,
        createdAt: item.createdAt,
        expiresAt: item.createdAt + THIRTY_DAYS_MS,
        isRead: storedRead.includes(uniqueId),
        route,
        targetId,
        tab,
      }
    })
    .sort((a, b) => b.createdAt - a.createdAt)
}

async function loadNotifications() {
  if (notificationsPromise) return notificationsPromise

  notificationsPromise = Promise.all([
    import('../data/messages.js'),
    import('../data/tips.js'),
    import('../data/playlist.js'),
  ])
    .then(([messagesModule, tipsModule, playlistModule]) => {
      const storedRead = safeReadStoredIds(READ_STORAGE_KEY)
      const notifications = buildNotifications(
        messagesModule.messages,
        tipsModule.tips,
        playlistModule.playlist,
        storedRead,
      )

      notificationState.notifications = notifications
      notificationState.unreadCount = notifications.filter(notification => !notification.isRead).length
      emitChange()
    })
    .catch(error => {
      console.warn('Notification preload failed', error)
    })

  return notificationsPromise
}

function subscribe(listener) {
  listeners.add(listener)
  void loadNotifications()

  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return notificationState
}

function markAsRead(id) {
  const storedRead = safeReadStoredIds(READ_STORAGE_KEY)
  if (!storedRead.includes(id)) {
    storedRead.push(id)
    safeWriteStoredIds(READ_STORAGE_KEY, storedRead)
  }

  let changed = false
  notificationState.notifications = notificationState.notifications.map(notification => {
    if (notification.id !== id || notification.isRead) return notification
    changed = true
    return { ...notification, isRead: true }
  })

  if (!changed) return

  notificationState.unreadCount = notificationState.notifications.filter(notification => !notification.isRead).length
  emitChange()
}

export function useNotifications() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const prevCountRef = useRef(snapshot.notifications.length)

  useEffect(() => {
    void loadNotifications()
    
    // 60-second background polling for new content
    const pollId = setInterval(() => {
      loadNotifications()
    }, 60000)

    return () => clearInterval(pollId)
  }, [])

  return {
    notifications: snapshot.notifications,
    unreadCount: snapshot.unreadCount,
    markAsRead,
    pushNotification,
  }
}

function unusedLegacyUseNotifications() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Force re-evaluation on window focus optionally, but on mount is fine for fully static
  useEffect(() => {
    // 1. Map raw static arrays
    const rawData = [
      ...messages.map(m => ({ ...m, notifType: 'message' })),
      ...tips.map(t => ({ ...t, notifType: 'tip' })),
      ...playlist.filter(p => p.createdAt).map(p => ({ ...p, notifType: 'song' }))
    ]

    const now = Date.now()
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

    // 2. Load what has been successfully marked 'read'
    let storedRead = []
    try {
      storedRead = JSON.parse(localStorage.getItem('mori_read_notifs') || '[]')
    } catch { 
      storedRead = [] 
    }

    // 3. Filter expiring nodes > 30 Days and Map state
    const activeNotifs = rawData
      .filter(item => now <= (item.createdAt + THIRTY_DAYS_MS))
      .map(item => {
        let text = "";
        let route = null;
        let targetId = null;
        let tab = null;

        if (item.notifType === 'message') {
           text = "رسالة جديدة لكِ 💙: " + (item.title || "مفاجأة 🌸");
           route = '/messages';
           targetId = `message-${item.id}`;
           tab = 'messages';
        } else if (item.notifType === 'tip') {
           text = "نصيحة جديدة لكِ 🌸: " + (item.title || "مفاجأة 💙");
           route = '/messages';
           targetId = `tip-${item.id}`;
           tab = 'advice';
        } else if (item.notifType === 'song') {
           text = "🎶 دودو ضاف أغنية جديدة عشان تسمعيها! (" + item.title + ")";
           route = null;
        }

        const uniqueId = item.notifType === 'song' ? `song-${item.id}` : item.id;

        return {
          id: uniqueId,
          type: item.notifType,
          text: text,
          createdAt: item.createdAt,
          expiresAt: item.createdAt + THIRTY_DAYS_MS,
          isRead: storedRead.includes(uniqueId),
          route: route,
          targetId: targetId,
          tab: tab
        }
      })
      .sort((a, b) => b.createdAt - a.createdAt) // Newest Top

    setNotifications(activeNotifs)
    setUnreadCount(activeNotifs.filter(n => !n.isRead).length)
  }, []) 

  const markAsRead = (id) => {
    // Save cache instantly
    try {
      const storedRead = JSON.parse(localStorage.getItem('mori_read_notifs') || '[]')
      if (!storedRead.includes(id)) {
        storedRead.push(id)
        localStorage.setItem('mori_read_notifs', JSON.stringify(storedRead))
      }
    } catch (e) {
      console.warn("Storage write failed", e)
    }

    // Safely update React hooks rapidly for UI crispness
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  return { notifications, unreadCount, markAsRead }
}
