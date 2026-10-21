import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { initTextScale } from './lib/textScale'
import { initAnalytics } from './lib/analytics'

// Apply any persisted text-size preference before first paint, so
// it's consistent across every route from load.
initTextScale()

// Umami (cookieless) — production builds only.
initAnalytics()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
