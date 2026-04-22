import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ReactGA from 'react-ga4'
import './index.css'
import App from './App.jsx'

// Initialize Google Analytics
ReactGA.initialize('G-A4')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Track initial page view
ReactGA.send({ hitType: 'pageview', page: window.location.pathname })

// Track page changes
window.addEventListener('popstate', () => {
  ReactGA.send({ hitType: 'pageview', page: window.location.pathname })
})
