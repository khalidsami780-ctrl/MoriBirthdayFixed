import { useState, useEffect } from 'react'

/**
 * useActiveTheme Hook
 * Derives and applies global atmosphere styles based on Mori's current mood.
 */
export default function useActiveTheme() {
  const [activeMood, setActiveMood] = useState(() => localStorage.getItem('mori_active_mood') || 'default')

  useEffect(() => {
    const handleStorage = () => {
      const mood = localStorage.getItem('mori_active_mood')
      if (mood) setActiveMood(mood)
    }

    window.addEventListener('storage', handleStorage)
    // Also poll slightly for immediate changes within the same tab since 'storage' only fires on other tabs
    const interval = setInterval(handleStorage, 1000)

    return () => {
      window.removeEventListener('storage', handleStorage)
      clearInterval(interval)
    }
  }, [])

  const getThemeStyles = () => {
    switch (activeMood) {
      case 'study': // Stressed / Study
        return {
          '--atmosphere-glow': 'rgba(232, 168, 126, 0.15)',
          '--atmosphere-filter': 'sepia(0.1) saturate(1.2) contrast(0.95)',
          '--atmosphere-border': 'rgba(232, 168, 126, 0.3)'
        }
      case 'random_sadness': // Sad
        return {
          '--atmosphere-glow': 'rgba(91, 156, 246, 0.1)',
          '--atmosphere-filter': 'brightness(0.85) saturate(0.8) contrast(1.05)',
          '--atmosphere-border': 'rgba(91, 156, 246, 0.2)'
        }
      case 'happy':
        return {
          '--atmosphere-glow': 'rgba(232, 201, 126, 0.18)',
          '--atmosphere-filter': 'brightness(1.05) saturate(1.1) drop-shadow(0 0 10px rgba(232, 201, 126, 0.1))',
          '--atmosphere-border': 'rgba(232, 201, 126, 0.4)'
        }
      case 'missing_you':
        return {
          '--atmosphere-glow': 'rgba(224, 168, 248, 0.15)',
          '--atmosphere-filter': 'hue-rotate(10deg) saturate(1.1)',
          '--atmosphere-border': 'rgba(224, 168, 248, 0.3)'
        }
      case 'overthinking':
        return {
          '--atmosphere-glow': 'rgba(91, 246, 229, 0.08)',
          '--atmosphere-filter': 'grayscale(0.1) brightness(0.9)',
          '--atmosphere-border': 'rgba(91, 246, 229, 0.2)'
        }
      case 'anxious':
        return {
          '--atmosphere-glow': 'rgba(168, 248, 182, 0.1)',
          '--atmosphere-filter': 'saturate(0.9) brightness(0.95)',
          '--atmosphere-border': 'rgba(168, 248, 182, 0.2)'
        }
      default:
        return {
          '--atmosphere-glow': 'transparent',
          '--atmosphere-filter': 'none',
          '--atmosphere-border': 'rgba(168, 200, 248, 0.2)'
        }
    }
  }

  return { activeMood, themeStyles: getThemeStyles() }
}
