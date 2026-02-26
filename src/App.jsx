import { useRef, useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import NavDots      from './components/NavDots'
import IntroGate    from './components/IntroGate'
import MusicButton  from './components/MusicButton'
import WelcomeSection  from './sections/WelcomeSection'
import BirthdaySection from './sections/BirthdaySection'
import MessageSection  from './sections/MessageSection'
import PoetrySection   from './sections/PoetrySection'
import KokoSection     from './sections/KokoSection'
import DuaSection      from './sections/DuaSection'
import MusicSection    from './sections/MusicSection'
import GiftSection     from './sections/GiftSection'

// 8 sections: Welcome → Birthday → Message → Poetry → Koko → Dua → Music → Gift
const SECTION_COUNT = 8

export default function App() {
  const scrollContainerRef = useRef(null)
  const sectionRefs = useRef(Array.from({ length: SECTION_COUNT }, () => null))

  const [isIntroDone,   setIsIntroDone]   = useState(false)
  const [activeSection, setActiveSection] = useState(0)

  const setRef = useCallback((index) => (el) => {
    sectionRefs.current[index] = el
  }, [])

  // IntroGate calls this — no music start here
  const handleEnterComplete = useCallback(() => {
    setIsIntroDone(true)
  }, [])

  // Section tracking for NavDots
  useEffect(() => {
    if (!isIntroDone) return
    const container = scrollContainerRef.current
    if (!container) return
    const observers = sectionRefs.current.map((el, i) => {
      if (!el) return null
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(i) },
        { root: container, threshold: 0.5 }
      )
      obs.observe(el)
      return obs
    })
    return () => observers.forEach(obs => obs?.disconnect())
  }, [isIntroDone])

  const scrollTo = useCallback((index) => {
    sectionRefs.current[index]?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  return (
    <>
      {/* ── Cinematic intro (no music) ─────────────────────────── */}
      <AnimatePresence>
        {!isIntroDone && (
          <IntroGate key="intro" onEnterComplete={handleEnterComplete} />
        )}
      </AnimatePresence>

      {/* ── Main site ──────────────────────────────────────────── */}
      <AnimatePresence>
        {isIntroDone && (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            style={{ position: 'relative', width: '100%', height: '100%' }}
          >
            <div className="noise-overlay" aria-hidden="true" />

            {/* ── Floating music control (bottom-left, always visible) ── */}
            <MusicButton />

            <NavDots active={activeSection} scrollTo={scrollTo} />

            <main ref={scrollContainerRef} className="scroll-container" role="main">
              <WelcomeSection  sectionRef={setRef(0)} />
              <BirthdaySection sectionRef={setRef(1)} />
              <MessageSection  sectionRef={setRef(2)} />
              <PoetrySection   sectionRef={setRef(3)} />
              <KokoSection     sectionRef={setRef(4)} />
              <DuaSection      sectionRef={setRef(5)} />
              <MusicSection    sectionRef={setRef(6)} />
              <GiftSection     sectionRef={setRef(7)} />
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
