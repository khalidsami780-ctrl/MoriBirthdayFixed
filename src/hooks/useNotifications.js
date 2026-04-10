import { useState, useEffect } from 'react'
import { messages } from '../data/messages.js'
import { tips } from '../data/tips.js'
import { playlist } from '../data/playlist.js'

export function useNotifications() {
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
