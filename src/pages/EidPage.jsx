import { useRef, useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import WorldSwitcher   from '../shared/WorldSwitcher.jsx'
import EidGreeting     from '../eid/EidGreeting.jsx'
import EidMusicSection from '../eid/EidMusicSection.jsx'
import EidMemories     from '../eid/EidMemories.jsx'

const EID_SECTIONS = ['greeting', 'music', 'memories']
const SECTION_COUNT = 3

/* ─── Eid Nav Dots ───────────────────────────────────────────── */
function EidNavDots({ active, scrollTo }) {
  const LABELS = ['Greeting', 'Music', 'Memories']
  return (
    <nav
      style={{
        position: 'fixed', right: '1.1rem', top: '50%',
        transform: 'translateY(-50%)', display: 'flex',
        flexDirection: 'column', gap: 10, zIndex: 100,
      }}
      aria-label="Eid section navigation"
    >
      {EID_SECTIONS.map((id, i) => (
        <button
          key={id}
          style={{
            width: 7, height: 7, borderRadius: '50%',
            border: '1px solid rgba(90,150,240,0.25)',
            background: active === i
              ? 'rgba(91,156,246,0.9)'
              : 'rgba(90,150,240,0.2)',
            boxShadow: active === i
              ? '0 0 10px rgba(91,156,246,0.6)'
              : 'none',
            transform: `scale(${active === i ? 1.35 : 1})`,
            cursor: 'pointer', padding: 0, outline: 'none',
            transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
            WebkitTapHighlightColor: 'transparent',
          }}
          onClick={() => scrollTo(i)}
          aria-label={LABELS[i]}
          title={LABELS[i]}
        />
      ))}
    </nav>
  )
}

export default function EidPage() {
  const scrollRef    = useRef(null)
  const sectionRefs  = useRef(Array.from({ length: SECTION_COUNT }, () => null))
  const [active, setActive] = useState(0)

  const setRef = useCallback((i) => (el) => { sectionRefs.current[i] = el }, [])

  useEffect(() => {
    const container = scrollRef.current; if (!container) return
    const observers = sectionRefs.current.map((el, i) => {
      if (!el) return null
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(i) },
        { root: container, threshold: 0.5 }
      )
      obs.observe(el)
      return obs
    })
    return () => observers.forEach(obs => obs?.disconnect())
  }, [])

  const scrollTo = useCallback((i) => {
    sectionRefs.current[i]?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55, ease: 'easeInOut' }}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      <div className="noise-overlay" aria-hidden="true" />

      {/* World Switcher */}
      <WorldSwitcher />

      {/* Eid nav dots */}
      <EidNavDots active={active} scrollTo={scrollTo} />

      <main ref={scrollRef} className="scroll-container" role="main">
        <EidGreeting     sectionRef={setRef(0)} />
        <EidMusicSection sectionRef={setRef(1)} />
        <EidMemories     sectionRef={setRef(2)} />
      </main>
    </motion.div>
  )
}
