import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import BirthdayPage from './pages/BirthdayPage.jsx'
import EidPage      from './pages/EidPage.jsx'

export default function App() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Default → Birthday */}
        <Route path="/"         element={<Navigate to="/birthday" replace />} />
        <Route path="/birthday" element={<BirthdayPage />} />
        <Route path="/eid"      element={<EidPage />} />
        {/* Catch-all */}
        <Route path="*"         element={<Navigate to="/birthday" replace />} />
      </Routes>
    </AnimatePresence>
  )
}
