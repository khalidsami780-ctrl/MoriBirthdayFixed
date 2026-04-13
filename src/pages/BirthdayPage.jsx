import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTelegramBot } from '../hooks/useTelegramBot'
import NavDots         from '../components/NavDots.jsx'
import IntroGate       from '../components/IntroGate.jsx'
import WorldSwitcher   from '../shared/WorldSwitcher.jsx'
import PdfSection      from '../sections/PdfSection.jsx'
import WelcomeSection  from '../sections/WelcomeSection.jsx'
import BirthdaySection from '../sections/BirthdaySection.jsx'
import MessageSection  from '../sections/MessageSection.jsx'
import PoetrySection   from '../sections/PoetrySection.jsx'
import KokoSection     from '../sections/KokoSection.jsx'
import DuaSection      from '../sections/DuaSection.jsx'
import MusicSection    from '../sections/MusicSection.jsx'
import GiftSection     from '../sections/GiftSection.jsx'

const SECTION_COUNT = 9

export default function BirthdayPage() {
  const scrollContainerRef = useRef(null)
  const sectionRefs = useRef(Array.from({ length: SECTION_COUNT }, () => null))

  const [isIntroDone,   setIsIntroDone]   = useState(false)
  const [activeSection, setActiveSection] = useState(0)

  const { trackSectionEntrance } = useTelegramBot()

  const setRef = useCallback((index) => (el) => {
    sectionRefs.current[index] = el
  }, [])

  const handleEnterComplete = useCallback(() => {
    setIsIntroDone(true)
    trackSectionEntrance("عيد ميلاد موري 🎂")
  }, [trackSectionEntrance])

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      <AnimatePresence>
        {!isIntroDone && (
          <IntroGate key="intro" onEnterComplete={handleEnterComplete} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isIntroDone && (
          <motion.div
            key="birthday-main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            style={{ position: 'relative', width: '100%', height: '100%' }}
          >
            <div className="noise-overlay" aria-hidden="true" />
            <NavDots active={activeSection} scrollTo={scrollTo} />

            <main ref={scrollContainerRef} className="scroll-container" role="main">
              {/* ✅ PDF surprise is now the FIRST section */}
              <PdfSection      sectionRef={setRef(0)} />
              <WelcomeSection  sectionRef={setRef(1)} />
              <BirthdaySection sectionRef={setRef(2)} />
              <MessageSection  sectionRef={setRef(3)} />
              <PoetrySection   sectionRef={setRef(4)} />
              <KokoSection     sectionRef={setRef(5)} />
              <DuaSection      sectionRef={setRef(6)} />
              <MusicSection    sectionRef={setRef(7)} />
              <GiftSection     sectionRef={setRef(8)} />
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}