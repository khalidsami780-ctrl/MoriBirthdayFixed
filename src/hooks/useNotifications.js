import { useState, useEffect } from 'react'
import { messages } from '../data/messages.js'
import { tips } from '../data/tips.js'

export function useNotifications() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Force re-evaluation on window focus optionally, but on mount is fine for fully static
  useEffect(() => {
    // 1. Map raw static arrays
    const rawData = [
      ...messages.map(m => ({ ...m, notifType: 'message' })),
      ...tips.map(t => ({ ...t, notifType: 'tip' }))
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
      .map(item => ({
        id: item.id,
        type: item.notifType,
        text: item.notifType === 'message' ? "رسالة جديدة لكِ 💙: " + (item.title || "مفاجأة 🌸") : "نصيحة جديدة لكِ 🌸: " + (item.title || "مفاجأة 💙"),
        createdAt: item.createdAt,
        expiresAt: item.createdAt + THIRTY_DAYS_MS,
        isRead: storedRead.includes(item.id),
        route: '/messages', // Quick tap destination for both types
        targetId: item.notifType === 'message' ? `message-${item.id}` : `tip-${item.id}`,
        tab: item.notifType === 'message' ? 'messages' : 'advice'
      }))
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
