import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { configureSound, playSound, type SoundName } from './audio/sound'
import { createRun, getCurrentIncident } from './game/engine'
import { EXCUSES } from './game/excuses'
import { FOLLOW_UPS, INCIDENTS } from './game/incidents'
import { rateRun, runStats } from './game/rating'
import { saveRun } from './game/storage'
import { firstCard, playRun } from './game/testUtils'
import type { GameState } from './game/types'
import { DEFAULT_SETTINGS, loadSettings, SETTINGS_KEY } from './state/settings'

function reducedSettings() {
  localStorage.clear()
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ sound: false, volume: 0, motion: 'reduced' }))
}

function finished(phase: 'victory' | 'gameover', patch: Partial<GameState> = {}): GameState {
  return { ...createRun('1'), phase, ...patch }
}

describe('Abschlussbewertung', () => {
  it('vergibt Noten nach Ergebnis und Verspätung', () => {
    const victory = (delay: number) => rateRun(finished('victory', { resources: { delay, satisfaction: 50, condition: 50 } }))
    expect(victory(0)).toMatchObject({ grade: 'S', stars: 5, title: 'Fast schon Schweizer Verhältnisse' })
    expect(victory(5)).toMatchObject({ grade: 'A', stars: 4 })
    expect(victory(10)).toMatchObject({ grade: 'B', title: 'Typischer Dienstag' })
    expect(victory(25)).toMatchObject({ grade: 'C', title: 'Immerhin fährt noch etwas' })
    expect(rateRun(finished('gameover', { stationIndex: 6 }))).toMatchObject({ grade: 'D', stars: 1 })
    expect(rateRun(finished('gameover', { stationIndex: 1 }))).toMatchObject({ grade: 'E', stars: 0, title: 'Schienenersatzverkehr' })
  })

  it('fasst die Fahrt in Zahlen zusammen', () => {
    const end = playRun(createRun('17'), () => 0, firstCard, (s) => s.upgradeOffer[0])
    const stats = runStats(end)
    expect(stats.totalStations).toBe(8)
    expect(stats.stationsReached).toBe(end.phase === 'victory' ? 8 : end.stationIndex + 1)
    expect(stats.incidents).toBe(end.history.length)
    expect(stats.excuses).toBe(end.announcements.length)
    expect(Object.values(stats.plausibility).reduce((a, b) => a + b, 0)).toBe(end.announcements.length)
    expect(stats.upgrades).toBe(end.upgrades.reduce((a, u) => a + u.stacks, 0))
    expect(stats.favoriteExcuse?.uses).toBe(Math.max(...Object.values(end.cardUses)))
  })
})

describe('Einstellungen und Klang', () => {
  beforeEach(() => localStorage.clear())

  it('lädt sinnvolle Standardwerte und verwirft Unsinn', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
    expect(DEFAULT_SETTINGS.volume).toBeGreaterThan(0)
    expect(DEFAULT_SETTINGS.volume).toBeLessThanOrEqual(0.5)
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ sound: 'ja', volume: 7, motion: 'turbo' }))
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
    localStorage.setItem(SETTINGS_KEY, '{kaputt')
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ sound: false, volume: 0.8, motion: 'reduced' }))
    expect(loadSettings()).toEqual({ sound: false, volume: 0.8, motion: 'reduced' })
  })

  it('Klänge funktionieren auch ohne Audio-Unterstützung, ohne Fehler', () => {
    configureSound({ enabled: true, volume: 0.5 })
    const names: SoundName[] = ['click', 'select', 'draw', 'play', 'good', 'bad', 'critical', 'arrival', 'upgrade', 'gameover', 'victory']
    for (const name of names) expect(() => playSound(name)).not.toThrow()
    configureSound({ enabled: false, volume: 0 })
  })
})

describe('Texte', () => {
  it('Ansagen und Vorfälle sind knapp und haben keine offenen Platzhalter', () => {
    for (const i of [...INCIDENTS, ...FOLLOW_UPS]) {
      expect(i.description.length, i.id).toBeLessThan(260)
      for (const c of i.choices) {
        expect(c.outcome.length, `${i.id}/${c.id}`).toBeLessThan(220)
        expect(c.outcome).not.toMatch(/[{}]/)
      }
    }
    for (const card of EXCUSES) for (const t of card.templates) expect(t.length, card.id).toBeLessThan(220)
  })

  it('macht Notfälle nicht zur Pointe', () => {
    const sensitive = ['medizinischer-notfall', 'hitzekollaps', 'personen-im-gleis', 'polizeieinsatz']
    const texts = [...INCIDENTS, ...FOLLOW_UPS]
      .filter((i) => sensitive.includes(i.id))
      .flatMap((i) => [i.description, ...i.choices.flatMap((c) => [c.label, c.outcome, ...(c.kind === 'risky' ? [c.risk.outcome] : [])])])
      .join(' ')
    expect(texts).not.toMatch(/Tierarzt|braver Junge|Junggesellen|Doktor der Philosophie/)
    expect(texts).toMatch(/Formular|Protokoll|Freigabe|Anlage B/)
  })
})

describe('Oberfläche: Tastatur, Barrierefreiheit, Abschluss', () => {
  beforeEach(reducedSettings)
  afterEach(cleanup)

  function start(seed: string) {
    fireEvent.change(screen.getByLabelText('Fahrt-Nr. (optional)'), { target: { value: seed } })
    fireEvent.click(screen.getByRole('button', { name: 'Neue Fahrt starten' }))
  }

  it('lässt sich mit der Tastatur spielen: 1–3 wählen, Enter weiter', () => {
    render(<App />)
    start('42')
    const incident = getCurrentIncident(createRun('42'))
    fireEvent.keyDown(window, { key: '2' })
    expect(screen.getByText(incident.choices[1].label, { selector: 'h2' })).toBeTruthy()
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(screen.getByText('🔊 Wie erklären Sie das den Fahrgästen?')).toBeTruthy()
    fireEvent.keyDown(window, { key: '1' })
    expect(document.querySelector('blockquote')).toBeTruthy()
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(screen.getByRole('heading', { name: 'Einfahrt Lutherstadt Wittenberg' })).toBeTruthy()
    fireEvent.keyDown(window, { key: '3' })
    expect(screen.getByText(/Station 2 von 8/)).toBeTruthy()
  })

  it('M schaltet den Ton um, Ziffern in Eingabefeldern lösen nichts aus', () => {
    render(<App />)
    const input = screen.getByLabelText('Fahrt-Nr. (optional)')
    fireEvent.keyDown(input, { key: '1' })
    expect(screen.getByRole('button', { name: 'Neue Fahrt starten' })).toBeTruthy()
    start('42')
    const toggle = screen.getByRole('button', { name: /Ton einschalten/ })
    expect(toggle.getAttribute('aria-pressed')).toBe('false')
    fireEvent.keyDown(window, { key: 'm' })
    expect(screen.getByRole('button', { name: /Ton ausschalten/ }).getAttribute('aria-pressed')).toBe('true')
    expect(JSON.parse(localStorage.getItem(SETTINGS_KEY)!).sound).toBe(true)
  })

  it('Einstellungen: Lautstärke und Animationen sind bedienbar', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Einstellungen' }))
    const group = screen.getByRole('group', { name: 'Einstellungen' })
    expect(group).toBeTruthy()
    fireEvent.click(screen.getByLabelText('voll'))
    expect(document.documentElement.dataset.motion).toBe('full')
    fireEvent.click(screen.getByLabelText('reduziert'))
    expect(document.documentElement.dataset.motion).toBe('reduced')
  })

  it('zeigt Ressourcen als Messwerte, eine Sprungmarke und eine Live-Region', () => {
    render(<App />)
    start('42')
    const meters = screen.getAllByRole('meter')
    expect(meters.length).toBeGreaterThanOrEqual(3)
    expect(screen.getAllByRole('meter', { name: 'Fahrgastzufriedenheit' })[0].getAttribute('aria-valuenow')).toBe('75')
    expect(screen.getByRole('link', { name: 'Zum Spielbereich springen' })).toBeTruthy()
    expect(screen.getByRole('navigation', { name: 'Streckenverlauf' })).toBeTruthy()
    fireEvent.keyDown(window, { key: '1' })
    expect(document.querySelector('[aria-live="polite"]')?.textContent).toMatch(/Ergebnis/)
  })

  it('Abschlussbildschirm mit Bewertung und Statistik', () => {
    const end = playRun(createRun('17'), () => 0, firstCard, (s) => s.upgradeOffer[0])
    saveRun(end)
    render(<App />)
    const rating = rateRun(end)
    expect(screen.getByText(rating.title)).toBeTruthy()
    expect(screen.getByLabelText(`Note ${rating.grade}`)).toBeTruthy()
    expect(screen.getByLabelText(`${rating.stars} von 5 Sternen`)).toBeTruthy()
    for (const label of ['Stationen erreicht', 'Verspätung', 'Fahrgastzufriedenheit', 'Zugzustand', 'Vorfälle', 'Ausreden', 'Verbesserungen']) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0)
    }
    expect(screen.getAllByText(`${runStats(end).stationsReached}/8`).length).toBeGreaterThan(0)
  })
})
