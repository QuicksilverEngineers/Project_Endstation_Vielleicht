import { useEffect, useId, useRef, useState } from 'react'
import { playSound } from '../audio/sound'
import { useSettings, type MotionSetting } from '../state/settings'
import { PixelIcon } from './PixelIcon'

const MOTION_LABELS: Record<MotionSetting, string> = { system: 'wie System', full: 'voll', reduced: 'reduziert' }

/** Ton an/aus (Taste M), Lautstärke und Animationen. */
export function SettingsMenu() {
  const { settings, update } = useSettings()
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === 'Escape' : !ref.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  return (
    <div ref={ref} className="relative flex items-center gap-1">
      <button
        type="button"
        onClick={() => update({ sound: !settings.sound })}
        aria-pressed={settings.sound}
        aria-label={settings.sound ? 'Ton ausschalten (M)' : 'Ton einschalten (M)'}
        title={settings.sound ? 'Ton aus (M)' : 'Ton an (M)'}
        className="rounded border border-board-yellow/40 p-2 text-board-yellow hover:bg-board-yellow/10"
      >
        <PixelIcon name={settings.sound ? 'soundOn' : 'soundOff'} size={18} />
      </button>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="rounded border border-board-yellow/40 px-2 py-1.5 font-board text-xs text-board-yellow hover:bg-board-yellow/10"
      >
        Einstellungen
      </button>
      {open && (
        <div
          id={panelId}
          role="group"
          aria-label="Einstellungen"
          className="anim-enter absolute top-full right-0 z-30 mt-2 w-64 space-y-4 rounded-lg border-2 border-board-line bg-board-card p-4 text-sm text-white shadow-xl"
        >
          <label className="flex items-center justify-between gap-2">
            <span>Ton</span>
            <input type="checkbox" checked={settings.sound} onChange={(e) => update({ sound: e.target.checked })} className="h-4 w-4 accent-[#ffc940]" />
          </label>
          <label className="block">
            <span className="flex justify-between">
              <span>Lautstärke</span>
              <span className="font-board text-board-yellow">{Math.round(settings.volume * 100)} %</span>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={Math.round(settings.volume * 100)}
              onChange={(e) => update({ volume: Number(e.target.value) / 100 })}
              onPointerUp={() => playSound('select')}
              onKeyUp={() => playSound('select')}
              disabled={!settings.sound}
              className="mt-1 w-full accent-[#ffc940]"
            />
          </label>
          <fieldset>
            <legend>Animationen</legend>
            <div className="mt-1 flex gap-1">
              {(['system', 'full', 'reduced'] as const).map((motion) => (
                <label
                  key={motion}
                  className={`flex-1 cursor-pointer rounded border px-2 py-1 text-center font-board text-xs ${
                    settings.motion === motion ? 'border-board-yellow bg-board-yellow/15 text-board-yellow' : 'border-board-line text-white/70'
                  }`}
                >
                  <input type="radio" name={`${panelId}-motion`} className="sr-only" checked={settings.motion === motion} onChange={() => update({ motion })} />
                  {MOTION_LABELS[motion]}
                </label>
              ))}
            </div>
          </fieldset>
          <p className="text-xs text-white/50">Tasten: 1–5 wählen, Enter weiter, M Ton.</p>
        </div>
      )}
    </div>
  )
}
