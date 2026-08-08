import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import App from './App.jsx'
import { TelegramProvider } from './context/TelegramContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <TelegramProvider>
        <App />
      </TelegramProvider>
      {/* Vercel Analytics — works automatically in production */}
      <Analytics />
    </BrowserRouter>
  </React.StrictMode>,
)
