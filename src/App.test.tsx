import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { createRun, getCurrentIncident, previewResolution } from './game/engine'
import { firstCard, playRun } from './game/testUtils'
import { saveRun } from './game/storage'
import type { GameState } from './game/types'
import { STORAGE_KEY } from './game/storage'
import { SETTINGS_KEY } from './state/settings'

/**
 * Sucht einen Seed, bei dem diese Spielweise zum gewünschten Ende führt: immer Option B,
 * immer die erste Ausrede der Hand, immer die erste angebotene Verbesserung.
 */
function findSeed(target: 'victory' | 'gameover'): string {
  for (let seed = 0; seed < 500; seed++) {
    const end = playRun(createRun(String(seed)), () => 1, firstCard, (s) => s.upgradeOffer[0])
    if (end.phase === target) return String(seed)
  }
  throw new Error('Kein passender Seed')
}

function startRun(seed: string) {
  fireEvent.change(screen.getByLabelText('Fahrt-Nr. (optional)'), { target: { value: seed } })
  fireEvent.click(screen.getByRole('button', { name: 'Neue Fahrt starten' }))
}

/** Leerer Speicher; Ton aus und reduzierte Bewegung, damit Animationen nicht verzögern. */
function resetStorage() {
  localStorage.clear()
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ sound: false, volume: 0, motion: 'reduced' }))
}

const startsWith = (pattern: RegExp) => screen.queryAllByRole('button').filter((b) => pattern.test(b.textContent ?? ''))

/** Spielt wie findSeed über die Oberfläche, bis ein Endbildschirm erscheint. */
function playWithOptionB() {
  for (let i = 0; i < 100; i++) {
    if (screen.queryByRole('button', { name: 'Gleiche Fahrt wiederholen' })) return
    const step =
      startsWith(/^B/)[0] ?? // Option B im Vorfall
      startsWith(/^(Gewöhnlich|Selten|Episch)/)[0] ?? // erste Ausrede der Hand
      startsWith(/^(Einzigartig|Stufe)/)[0] ?? // erste Verbesserung
      screen.getByRole('button', { name: /Zur Durchsage|Weiterfahrt|Einfahrt|^Weiter$/ })
    fireEvent.click(step)
  }
  throw new Error('Kein Spielende erreicht')
}

describe('App', () => {
  beforeEach(resetStorage)
  afterEach(cleanup)

  it('zeigt das Hauptmenü mit „Neue Fahrt starten“', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: 'Neue Fahrt starten' })).toBeTruthy()
    expect(screen.queryByText('Fahrt fortsetzen')).toBeNull()
  })

  // Komplette Fahrten durch die Oberfläche dauern in jsdom einige Sekunden.
  it('spielt eine komplette Fahrt bis zum Sieg', { timeout: 30000 }, () => {
    render(<App />)
    startRun(findSeed('victory'))
    playWithOptionB()
    expect(screen.getByText('Ankunft München Hbf')).toBeTruthy()
    expect(screen.getAllByRole('listitem').some((li) => li.textContent?.includes('München Hbf'))).toBe(true)
  })

  it('spielt eine komplette Fahrt bis zum Game Over', { timeout: 30000 }, () => {
    render(<App />)
    startRun(findSeed('gameover'))
    playWithOptionB()
    expect(screen.getByText(/Fahrt endet in/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Zum Hauptmenü' }))
    expect(screen.queryByText('Fahrt fortsetzen')).toBeNull()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('zeigt die Konsequenzen einer Entscheidung', () => {
    render(<App />)
    startRun('42')
    const run = createRun('42')
    const incident = getCurrentIncident(run)
    expect(screen.getByText(`⚠ ${incident.title}`)).toBeTruthy()
    // Folgen sind vor der Wahl verborgen.
    for (const choice of incident.choices) expect(screen.queryByText(choice.outcome)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: new RegExp(incident.choices[0].label) }))
    expect(screen.getByText(previewResolution(run, incident.choices[0]).outcome)).toBeTruthy()
    // Das Ergebnis steht kompakt über der Durchsage, ohne Extra-Klick.
    expect(screen.getByText('Insgesamt:')).toBeTruthy()
    expect(screen.getByText('🔊 Wie erklären Sie das den Fahrgästen?')).toBeTruthy()
  })

  it('stellt die Fahrt nach einem Neuladen wieder her', () => {
    const first = render(<App />)
    startRun('42')
    const incident = getCurrentIncident(createRun('42'))
    fireEvent.click(screen.getByRole('button', { name: new RegExp(incident.choices[0].label) }))
    first.unmount()

    render(<App />)
    expect(screen.getByText(previewResolution(createRun('42'), incident.choices[0]).outcome)).toBeTruthy()
    expect(screen.getByText('Fahrt-Nr. 42')).toBeTruthy()
  })

  it('bietet im Menü das Fortsetzen einer laufenden Fahrt an', () => {
    render(<App />)
    startRun('42')
    fireEvent.click(screen.getByRole('button', { name: 'Hauptmenü' }))
    fireEvent.click(screen.getByRole('button', { name: 'Fahrt fortsetzen' }))
    expect(screen.getByText('Fahrt-Nr. 42')).toBeTruthy()
  })

  it('startet nach dem Spielende eine neue Fahrt', { timeout: 30000 }, () => {
    render(<App />)
    startRun(findSeed('gameover'))
    playWithOptionB()
    fireEvent.click(screen.getByRole('button', { name: 'Neue Fahrt starten' }))
    expect(screen.getByText(/Station 1 von 8/)).toBeTruthy()
    expect(screen.getAllByRole('meter', { name: 'Verspätung' })[0].getAttribute('aria-valuenow')).toBe('0')
  })

  it('zeigt die Art jeder Option und bei riskanten die Risikostufe', () => {
    render(<App />)
    startRun('42')
    const incident = getCurrentIncident(createRun('42'))
    for (const choice of incident.choices) {
      const button = screen.getByRole('button', { name: new RegExp(choice.label) })
      expect(button.textContent).toMatch(choice.kind === 'safe' ? /Sicher/ : choice.kind === 'risky' ? /Riskant · Risiko (gering|mittel|hoch)/ : /Strategisch/)
    }
  })

  it('führt ein Fahrtprotokoll mit Entscheidung, Ergebnis und Änderungen', () => {
    render(<App />)
    startRun('42')
    const run = createRun('42')
    const incident = getCurrentIncident(run)
    const choice = incident.choices[1]
    fireEvent.click(screen.getByRole('button', { name: new RegExp(choice.label) }))
    fireEvent.click(startsWith(/^(Gewöhnlich|Selten|Episch)/)[0])
    const log = screen.getByRole('region', { name: 'Letzte Ereignisse' })
    expect(log.textContent).toContain('🔊')
    expect(log.textContent).toContain(incident.title)
    expect(log.textContent).toContain(choice.label)
    expect(log.textContent).toMatch(/Wie erwartet|Gutgegangen|Schiefgegangen|Bewusst geopfert/)
    expect(log.textContent).toMatch(/Min|Zufriedenheit|Zustand|keine Änderung/)
  })

  it('zeigt laufende Probleme und kennzeichnet Folgeereignisse', () => {
    const base = createRun('7')
    const state: GameState = {
      ...base,
      eventIndex: 1,
      stationIndex: 1,
      events: [base.events[0], { stationIndex: 1, incidentId: 'hitzekollaps', depth: 1, cause: 'hitze' }, ...base.events.slice(1)],
      statuses: [{ id: 'hitze', remaining: 2, depth: 0 }],
    }
    saveRun(state)
    render(<App />)
    const panel = screen.getByRole('region', { name: 'Laufende Probleme' })
    expect(panel.textContent).toContain('Hitze im Zug')
    expect(panel.textContent).toContain('noch 2 Ereignisse')
    expect(panel.textContent).toContain('Hitzekollaps')
    expect(screen.getByText(/Folgeereignis – ausgelöst durch „Hitze im Zug“/)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Halten, Rettungsdienst/ }))
    expect(screen.getByText('Behoben:')).toBeTruthy()
    expect(screen.queryByRole('region', { name: 'Laufende Probleme' })).toBeNull()
  })
})
describe('Durchsage und Verbesserungen in der Oberfläche', () => {
  beforeEach(resetStorage)
  afterEach(cleanup)

  it('führt durch Durchsage, Ansagetext und Verbesserungswahl', () => {
    render(<App />)
    startRun('42')
    fireEvent.click(startsWith(/^A/)[0])

    // Hand mit drei Ausreden, Kategorien des Vorfalls und Passung sichtbar
    expect(screen.getByText('🔊 Wie erklären Sie das den Fahrgästen?')).toBeTruthy()
    const cards = startsWith(/^(Gewöhnlich|Selten|Episch)/)
    expect(cards).toHaveLength(3)
    expect(cards.every((c) => /Passt perfekt|Passt|Allzweck-Ausrede|Passt nicht/.test(c.textContent ?? ''))).toBe(true)

    fireEvent.click(cards[0])
    expect(document.querySelector('blockquote')?.textContent).toMatch(/^„.+“$/)
    expect(screen.getByText(/Glaubwürdigkeit:/)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Weiterfahrt nach Lutherstadt Wittenberg/ }))
    expect(screen.getByText('Einfahrt Lutherstadt Wittenberg')).toBeTruthy()
    const offers = startsWith(/^(Einzigartig|Stufe)/)
    expect(offers).toHaveLength(3)
    const name = offers[0].querySelector('.font-semibold')!.textContent!
    fireEvent.click(offers[0])

    expect(screen.getByText(/Station 2 von 8/)).toBeTruthy()
    const owned = screen.getByRole('complementary', { name: 'Zugstatus' })
    expect(owned.textContent).toContain(name)
  })
})
