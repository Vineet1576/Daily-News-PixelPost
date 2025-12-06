import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './style/output.css'
import './style/profile.css'
import App from './App.jsx'
import { SettingsProvider } from './context/SettingsContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </StrictMode>,
)