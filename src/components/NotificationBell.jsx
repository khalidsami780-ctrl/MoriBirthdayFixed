import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotifications } from '../hooks/useNotifications.js'
import { useNavigate } from 'react-router-dom'

// Soft native browser time formatter (e.g. "منذ ساعتين", "منذ 3 أيام")
function getRelativeTime(timestamp) {
  const rtf = new Intl.RelativeTimeFormat('ar', { numeric: 'auto', style: 'short' })
  const daysDiff = Math.round((timestamp - Date.now()) / (1000 * 60 * 60 * 24))
  
  if (daysDiff === 0) {
     const hoursDiff = Math.round((timestamp - Date.now()) / (1000 * 60 * 60))
     if (hoursDiff === 0) return "الأن"
     return rtf.format(hoursDiff, 'hour')
  }
  return rtf.format(daysDiff, 'day')
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(8)
  const { notifications, unreadCount, markAsRead } = useNotifications()
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  // Gracefully close on external tap
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false)
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleNotifClick = (notif) => {
    if (!notif.isRead) markAsRead(notif.id)
    setIsOpen(false)
    if (notif.route) {
        navigate(notif.route, { state: { scrollTarget: notif.targetId, tab: notif.tab } })
    }
  }

  return (
    <div style={{ position: 'relative', zIndex: 1000 }} ref={dropdownRef}>
      {/* ── Bell Icon Button ── */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        style={{
           ...S.bellBtn, 
           boxShadow: unreadCount > 0 ? '0 0 16px rgba(255, 105, 180, 0.4)' : 'none',
           borderColor: unreadCount > 0 ? 'rgba(255, 105, 180, 0.5)' : 'rgba(90,150,240,0.3)',
           background: isOpen ? 'rgba(90,150,240,0.1)' : 'rgba(4,10,34,0.88)'
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div style={{ position: 'relative', display: 'flex' }}>
          <motion.span 
             animate={{ rotate: unreadCount > 0 && !isOpen ? [0, 15, -15, 10, -10, 0] : 0 }}
             transition={{ repeat: unreadCount > 0 ? Infinity : 0, duration: 2, repeatDelay: 3 }}
             style={{ fontSize: '1.2rem', lineHeight: 1 }}
          >
            🔔
          </motion.span>
          
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                style={S.badge}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.button>

      {/* ── Dropdown Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 24 }}
            style={S.dropdown}
          >
            <div style={S.dropdownHeader}>
              <span style={S.headerTitle}>الإشعارات</span>
              <span style={S.headerCount}>{notifications.length} سجل</span>
            </div>

            <div style={S.listWrapper}>
              {notifications.length === 0 ? (
                <div style={S.emptyState}>لا توجد أية تحديثات جديدة 💤</div>
              ) : (
                <>
                  {notifications.slice(0, visibleCount).map(notif => (
                    <motion.div
                      key={notif.id}
                      onClick={() => handleNotifClick(notif)}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28 }}
                      whileHover={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                      style={{
                        ...S.notifItem,
                        borderRight: notif.isRead ? '3px solid transparent' : '3px solid #f4c2d7',
                        background: notif.isRead ? 'transparent' : 'rgba(244, 194, 215, 0.05)',
                        opacity: notif.isRead ? 0.55 : 1
                      }}
                    >
                      <div style={S.notifInfo}>
                        <span style={S.notifText}>{notif.text}</span>
                        <span style={S.notifTime}>{getRelativeTime(notif.createdAt)}</span>
                      </div>
                      {!notif.isRead && <div style={S.unreadDot} />}
                    </motion.div>
                  ))}

                  {/* See Previous Button */}
                  {visibleCount < notifications.length && (
                    <motion.button
                      onClick={() => setVisibleCount(c => c + 5)}
                      whileHover={{ color: 'rgba(168,200,248,0.9)', backgroundColor: 'rgba(90,150,240,0.07)' }}
                      style={S.seeMoreBtn}
                    >
                      عرض الإشعارات السابقة
                    </motion.button>
                  )}
                </>
              )}
            </div>
            {/* Soft decorative bottom fade */}
            <div style={S.bottomFade} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const S = {
  bellBtn: {
    position: 'relative',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '42px', height: '42px',
    borderRadius: '50%',
    backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)',
    border: '1px solid', // Color inherited dynamically
    cursor: 'pointer', outline: 'none', WebkitTapHighlightColor: 'transparent',
    transition: 'background 0.3s, border-color 0.3s, box-shadow 0.3s',
  },
  badge: {
    position: 'absolute', top: '-6px', right: '-8px',
    background: 'linear-gradient(135deg, #ff4d94, #f4c2d7)',
    color: '#fff', fontSize: '0.65rem', fontWeight: 800,
    width: '18px', height: '18px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '50%',
    boxShadow: '0 2px 5px rgba(255, 77, 148, 0.5)',
    fontFamily: 'system-ui, sans-serif'
  },
  dropdown: {
    position: 'absolute', top: 'calc(100% + 12px)', right: 0,
    width: '320px', minHeight: '150px', maxHeight: '450px',
    background: 'rgba(5, 12, 38, 0.95)',
    backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
    border: '1px solid rgba(168, 200, 248, 0.25)',
    borderRadius: '20px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
    transformOrigin: 'top right'
  },
  dropdownHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid rgba(168, 200, 248, 0.1)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: 'rgba(255,255,255,0.02)'
  },
  headerTitle: {
    fontFamily: `'Scheherazade New', 'Arial', serif`,
    fontSize: '1.25rem', color: '#fff', fontWeight: 'bold'
  },
  headerCount: {
    fontSize: '0.75rem', color: 'rgba(168, 200, 248, 0.7)',
    fontFamily: 'system-ui, sans-serif', letterSpacing: '0.05em'
  },
  listWrapper: {
    flex: 1, overflowY: 'auto',
    padding: '8px 0',
    display: 'flex', flexDirection: 'column',
    scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch'
  },
  notifItem: {
    padding: '16px 20px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    cursor: 'pointer', transition: 'background 0.2s, opacity 0.3s',
    direction: 'rtl'
  },
  notifInfo: {
    display: 'flex', flexDirection: 'column', gap: '6px'
  },
  notifText: {
    fontFamily: `'Scheherazade New', 'Arial', serif`,
    fontSize: '1.1rem', color: '#fff', lineHeight: 1.3
  },
  notifTime: {
    fontSize: '0.7rem', color: 'rgba(168, 200, 248, 0.6)',
    fontFamily: 'system-ui, sans-serif'
  },
  unreadDot: {
    width: '8px', height: '8px', borderRadius: '50%',
    background: '#f4c2d7', boxShadow: '0 0 8px rgba(244, 194, 215, 0.8)',
    marginLeft: '5px'
  },
  emptyState: {
    padding: '40px 20px', textAlign: 'center',
    color: 'rgba(168, 200, 248, 0.5)',
    fontFamily: `'Scheherazade New', 'Arial', serif`,
    fontSize: '1.3rem'
  },
  seeMoreBtn: {
    width: '100%', padding: '12px 20px',
    background: 'transparent', border: 'none',
    borderTop: '1px solid rgba(168,200,248,0.08)',
    color: 'rgba(168,200,248,0.45)',
    fontFamily: `'Scheherazade New', 'Arial', serif`,
    fontSize: '1rem', cursor: 'pointer',
    letterSpacing: '0.04em', direction: 'rtl',
    transition: 'color 0.2s, background 0.2s',
    outline: 'none', WebkitTapHighlightColor: 'transparent',
  },
  bottomFade: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '20px',
    background: 'linear-gradient(transparent, rgba(5, 12, 38, 0.95))',
    pointerEvents: 'none'
  }
}
