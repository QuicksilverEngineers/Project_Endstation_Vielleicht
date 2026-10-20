import { cleanup, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
import { loadSettings, SETTINGS_KEY } from '../state/settings'
import { loadTutorial, TUTORIAL_KEY } from '../state/tutorial'
import { chooseOption, continueJourney, createRun, getCurrentIncident, playExcuse } from './engine'
import { CURRENT_KEYS, LEGACY_KEYS, migrateLegacyStorage } from './migration'
import { loadRun, STORAGE_KEY } from './storage'

/** Ein Spielstand mitten in der Fahrt, wie ihn die alte Version gespeichert hätte. */
function midRun() {
  let run = createRun('migration-42')
  run = continueJourney(chooseOption(run, getCurrentIncident(run).choices[1].id))
  run = playExcuse(run, run.deck.hand[0])
  return run
}

const LEGACY_SETTINGS = { sound: false, volume: 0.6, motion: 'reduced' }
const LEGACY_TUTORIAL = { enabled: false, seen: ['entscheidungen', 'ressourcen'] }

function writeLegacy(run = midRun()) {
  localStorage.setItem(LEGACY_KEYS.run, JSON.stringify(run))
  localStorage.setItem(LEGACY_KEYS.settings, JSON.stringify(LEGACY_SETTINGS))
  localStorage.setItem(LEGACY_KEYS.tutorial, JSON.stringify(LEGACY_TUTORIAL))
  return run
}

describe('Übernahme alter Spielstände nach der Umbenennung', () => {
  beforeEach(() => localStorage.clear())
  afterEach(cleanup)

  it('die Ladefunktionen lesen die neuen Schlüssel', () => {
    expect(STORAGE_KEY).toBe(CURRENT_KEYS.run)
    expect(SETTINGS_KEY).toBe(CURRENT_KEYS.settings)
    expect(TUTORIAL_KEY).toBe(CURRENT_KEYS.tutorial)
    expect(Object.values(CURRENT_KEYS).some((key) => key.startsWith('db-game'))).toBe(false)
  })

  it('übernimmt Fahrt, Einstellungen und Tipps unverändert und räumt die alten Schlüssel weg', () => {
    const run = writeLegacy()
    expect(migrateLegacyStorage()).toEqual({ run: 'migrated', settings: 'migrated', tutorial: 'migrated' })

    expect(loadRun()).toEqual(run)
    expect(loadSettings()).toEqual(LEGACY_SETTINGS)
    expect(loadTutorial()).toEqual(LEGACY_TUTORIAL)
    for (const key of Object.values(LEGACY_KEYS)) expect(localStorage.getItem(key)).toBeNull()
  })

  it('ist idempotent: ein zweiter Aufruf ändert nichts', () => {
    writeLegacy()
    migrateLegacyStorage()
    const snapshot = Object.values(CURRENT_KEYS).map((key) => localStorage.getItem(key))
    expect(migrateLegacyStorage()).toEqual({ run: 'nothing-to-do', settings: 'nothing-to-do', tutorial: 'nothing-to-do' })
    expect(Object.values(CURRENT_KEYS).map((key) => localStorage.getItem(key))).toEqual(snapshot)
  })

  it('tut nichts, wenn es keine alten Daten gibt', () => {
    expect(migrateLegacyStorage()).toEqual({ run: 'nothing-to-do', settings: 'nothing-to-do', tutorial: 'nothing-to-do' })
    expect(localStorage.length).toBe(0)
  })

  it('überschreibt niemals neuere Daten unter dem neuen Schlüssel', () => {
    writeLegacy()
    const newer = createRun('neuer-stand')
    localStorage.setItem(CURRENT_KEYS.run, JSON.stringify(newer))
    expect(migrateLegacyStorage().run).toBe('kept-current')
    expect(loadRun()).toEqual(newer)
    // Der abweichende alte Stand bleibt sicherheitshalber liegen.
    expect(localStorage.getItem(LEGACY_KEYS.run)).not.toBeNull()
  })

  it('räumt einen alten Schlüssel weg, wenn die Kopie bereits identisch vorliegt (abgebrochene frühere Übernahme)', () => {
    const run = writeLegacy()
    localStorage.setItem(CURRENT_KEYS.run, JSON.stringify(run))
    expect(migrateLegacyStorage().run).toBe('kept-current')
    expect(localStorage.getItem(LEGACY_KEYS.run)).toBeNull()
    expect(loadRun()).toEqual(run)
  })

  it('lässt unlesbare Altdaten liegen, statt sie zu übernehmen', () => {
    localStorage.setItem(LEGACY_KEYS.run, '{kaputt')
    expect(migrateLegacyStorage().run).toBe('failed')
    expect(localStorage.getItem(LEGACY_KEYS.run)).toBe('{kaputt')
    expect(localStorage.getItem(CURRENT_KEYS.run)).toBeNull()
  })

  it('löscht nichts, wenn das Schreiben scheitert (Speicher voll)', () => {
    const data = new Map<string, string>([[LEGACY_KEYS.settings, JSON.stringify(LEGACY_SETTINGS)]])
    const full = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
      removeItem: (key: string) => void data.delete(key),
    }
    expect(migrateLegacyStorage(full).settings).toBe('failed')
    expect(data.get(LEGACY_KEYS.settings)).toBe(JSON.stringify(LEGACY_SETTINGS))
  })

  it('löscht nichts und entfernt die halbe Kopie, wenn die Kopie nicht stimmt', () => {
    const data = new Map<string, string>([[LEGACY_KEYS.tutorial, JSON.stringify(LEGACY_TUTORIAL)]])
    const lossy = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => void data.set(key, value.slice(0, 5)),
      removeItem: (key: string) => void data.delete(key),
    }
    expect(migrateLegacyStorage(lossy).tutorial).toBe('failed')
    expect(data.get(LEGACY_KEYS.tutorial)).toBe(JSON.stringify(LEGACY_TUTORIAL))
    expect(data.has(CURRENT_KEYS.tutorial)).toBe(false)
  })

  it('kommt ohne verfügbaren Speicher aus', () => {
    expect(migrateLegacyStorage(undefined)).toEqual({ run: 'nothing-to-do', settings: 'nothing-to-do', tutorial: 'nothing-to-do' })
  })

  it('eine übernommene Fahrt wird beim Start wie gewohnt fortgesetzt', () => {
    const run = writeLegacy()
    migrateLegacyStorage()
    render(createElement(App))
    // Das Spiel steigt direkt in die gespeicherte Fahrt ein, an genau derselben Stelle.
    expect(screen.getByText(`Fahrt-Nr. ${run.seed}`)).toBeTruthy()
    expect(run.phase).toBe('announced')
    expect(screen.getByRole('button', { name: /Weiterfahrt|Einfahrt|Weiter/ })).toBeTruthy()
    expect(loadRun()).toEqual(run)
  })
})
