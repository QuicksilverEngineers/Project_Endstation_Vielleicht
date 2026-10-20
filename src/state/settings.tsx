import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { configureSound } from '../audio/sound'
import { CURRENT_KEYS } from '../game/migration'

export type MotionSetting = 'system' | 'full' | 'reduced'

export interface Settings {
  sound: boolean
  /** 0–1 */
  volume: number
  motion: MotionSetting
}

export const SETTINGS_KEY = CURRENT_KEYS.settings
export const DEFAULT_SETTINGS: Settings = { sound: true, volume: 0.35, motion: 'system' }

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<Settings>
    return {
      sound: typeof parsed.sound === 'boolean' ? parsed.sound : DEFAULT_SETTINGS.sound,
      volume: typeof parsed.volume === 'number' && parsed.volume >= 0 && parsed.volume <= 1 ? parsed.volume : DEFAULT_SETTINGS.volume,
      motion: parsed.motion === 'full' || parsed.motion === 'reduced' || parsed.motion === 'system' ? parsed.motion : DEFAULT_SETTINGS.motion,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

/** Ob Animationen gerade reduziert werden (Spieleinstellung oder Systemeinstellung). */
export function prefersReducedMotion(motion: MotionSetting): boolean {
  if (motion === 'reduced') return true
  if (motion === 'full') return false
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

interface SettingsContextValue {
  settings: Settings
  update: (patch: Partial<Settings>) => void
  reducedMotion: boolean
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  update: () => {},
  reducedMotion: false,
})

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(loadSettings)

  useEffect(() => {
    configureSound({ enabled: settings.sound, volume: settings.volume })
    document.documentElement.dataset.motion = settings.motion
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    } catch {
      // ignorieren
    }
  }, [settings])

  const value = useMemo(
    () => ({
      settings,
      update: (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })),
      reducedMotion: prefersReducedMotion(settings.motion),
    }),
    [settings],
  )
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): SettingsContextValue {
  return useContext(SettingsContext)
}
