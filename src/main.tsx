import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { migrateLegacyStorage } from './game/migration'
import './index.css'

// Spielstände aus der Zeit vor der Umbenennung übernehmen, bevor irgendetwas geladen wird.
migrateLegacyStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
