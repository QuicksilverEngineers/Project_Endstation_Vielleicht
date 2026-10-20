import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { explainPlausibility } from './components/AnnouncementScreens'
import { criticalWarnings, WARN_DELAY } from './components/GameChrome'
import { activeModifiers, riskPercent } from './components/modifiers'
import { DELAY_LIMIT } from './game/constants'
import { chooseOption, chooseUpgrade, continueJourney, createRun, getCurrentIncident, playExcuse } from './game/engine'
import { getExcuse } from './game/excuses'
import { getIncident } from './game/incidents'
import { saveRun } from './game/storage'
import { bestCard } from './game/testUtils'
import type { AnnouncementRecord, GameState, UpgradeId } from './game/types'
import { dominatedOptions } from './sim/simulate'
import { appReducer, initAppState } from './state/gameReducer'
import { SETTINGS_KEY } from './state/settings'
import { currentHint, TUTORIAL_HINTS, TUTORIAL_KEY } from './state/tutorial'

const withIncident = (state: GameState, id: string): GameState => ({
  ...state,
  events: state.events.map((e, i) => (i === state.eventIndex ? { ...e, incidentId: id } : e)),
})
const withUpgrades = (state: GameState, ...ids: UpgradeId[]): GameState => ({ ...state, upgrades: ids.map((id) => ({ id, stacks: 1 })) })

function quiet(tutorial = false) {
  localStorage.clear()
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ sound: false, volume: 0, motion: 'reduced' }))
  if (!tutorial) localStorage.setItem(TUTORIAL_KEY, JSON.stringify({ enabled: false, seen: [] }))
}

describe('Weniger Klicks', () => {
  it('nach der Wahl geht es direkt zur Durchsage, das Ergebnis bleibt sichtbar', () => {
    let app = appReducer(initAppState(null), { type: 'start', seed: '1' })
    app = appReducer(app, { type: 'choose', choiceId: getCurrentIncident(app.run!).choices[0].id })
    expect(app.run!.phase).toBe('announcement')
    expect(app.run!.history).toHaveLength(1)
    expect(app.run!.deck.hand.length).toBeGreaterThan(0)
  })

  it('bei einer Niederlage bleibt der Ergebnisbildschirm', () => {
    const run = { ...withIncident(createRun('1'), 'klimaanlage'), resources: { delay: 0, satisfaction: 1, condition: 50 } }
    const app = appReducer({ screen: 'game', run, runId: 1 }, { type: 'choose', choiceId: 'ignorieren' })
    expect(app.run!.phase).toBe('result')
    expect(app.run!.failures).toContain('satisfaction')
  })
})

describe('Balance-Audit', () => {
  it('keine Option ist in allen Ressourcen schlechter als eine andere desselben Vorfalls', () => {
    const found = dominatedOptions().map((d) => `${d.incident.id}/${d.choice.id} < ${d.by.id}`)
    expect(found).toEqual([])
  })
})

describe('Sichtbare Wirkung der Verbesserungen', () => {
  const run = createRun('1')

  it('Zocker-Lokführer: das gesenkte Risiko steht im Ergebnis', () => {
    const state = withUpgrades(withIncident(run, 'wlan'), 'zocker')
    const notes = chooseOption(state, 'landschaft').history[0].upgradeNotes
    expect(notes).toContain('Zocker-Lokführer: Risiko 55 % → 45 %')
  })

  it('Legendärer Schaffner: gesparte Zufriedenheit wird genannt', () => {
    const state = withUpgrades(withIncident(run, 'reservierung'), 'legendaerer-schaffner')
    expect(chooseOption(state, 'aufheben').history[0].upgradeNotes!.some((n) => /Legendärer Schaffner: \d+ Zufriedenheit gespart/.test(n))).toBe(true)
  })

  it('Dickes Fell, Frühwarnsystem und Großzügiger Fahrplan melden sich', () => {
    const state = {
      ...withUpgrades(withIncident(run, 'klimaanlage'), 'dickes-fell', 'fruehwarnung', 'fahrplan-puffer'),
      statuses: [{ id: 'ueberfuellung' as const, remaining: 2, depth: 0 }],
      resources: { delay: 10, satisfaction: 70, condition: 70 },
    }
    const notes = chooseOption(state, 'ignorieren').history[0].upgradeNotes!
    expect(notes.some((n) => n.startsWith('Dickes Fell'))).toBe(true)
    expect(notes.some((n) => n.startsWith('Frühwarnsystem'))).toBe(true)
    expect(notes).toContain('Großzügiger Fahrplan: 1 Minute zusätzlich aufgeholt')
  })

  it('ohne Verbesserungen gibt es keine Hinweise', () => {
    expect(chooseOption(withIncident(run, 'wlan'), 'landschaft').history[0].upgradeNotes).toEqual([])
  })

  it('Notfallplan: ein verhindertes Folgeereignis wird bei der Ankunft vermerkt', () => {
    let found = false
    for (let seed = 0; seed < 300 && !found; seed++) {
      let s = createRun(String(seed))
      s = continueJourney(chooseOption(withIncident(s, 'puenktlich'), 'wartung'))
      s = continueJourney(playExcuse(s, bestCard(s)))
      s = { ...s, statuses: [{ id: 'hitze', remaining: 3, depth: 0 }], upgrades: [{ id: 'notfallplan', stacks: 1 }] }
      const offer = s.upgradeOffer.find((id) => id !== 'notfallplan')!
      const next = chooseUpgrade(s, offer)
      const note = next.arrivals.at(-1)!.notes?.find((n) => n.startsWith('Notfallplan'))
      if (note) {
        found = true
        expect(note).toContain('verhindert')
        expect(next.events.some((e) => e.depth > 0)).toBe(false)
      }
    }
    expect(found).toBe(true)
  })

  it('zeigt vorab, welche Verbesserungen bei einem Vorfall wirken', () => {
    const state = withUpgrades(withIncident(run, 'reservierung'), 'zocker', 'legendaerer-schaffner', 'ersatzbus')
    const list = activeModifiers(state, getIncident('reservierung')!)
    expect(list.some((m) => m.startsWith('Zocker-Lokführer'))).toBe(true)
    expect(list.some((m) => m.startsWith('Legendärer Schaffner'))).toBe(true)
    expect(list).toContain('Ersatzbus-Garantie: bereit')
    expect(activeModifiers({ ...state, ersatzbusUsed: true }, getIncident('wlan')!)).not.toContain('Ersatzbus-Garantie: bereit')
  })
})

describe('Verständlichkeit', () => {
  it('Risiko als gerundeter Prozentwert', () => {
    expect(riskPercent(0.3)).toBe('ca. 30 %')
    expect(riskPercent(0.45)).toBe('ca. 45 %')
    expect(riskPercent(0.32)).toBe('ca. 30 %')
  })

  it('erklärt, warum eine Ausrede passt oder nicht', () => {
    const incident = getIncident('notbremse')! // Fahrgäste, Technik, Sicherheit
    const record = (plausibility: AnnouncementRecord['plausibility']) => ({ plausibility }) as AnnouncementRecord
    expect(explainPlausibility(record('perfekt'), getExcuse('aufkommen')!, incident)).toContain('Fahrgäste')
    expect(explainPlausibility(record('plausibel'), getExcuse('technische-stoerung')!, incident)).toContain('Gemeinsamer Bereich: Technik')
    expect(explainPlausibility(record('unglaubwuerdig'), getExcuse('witterung')!, getIncident('reservierung')!)).toContain('Keine Überschneidung')
    expect(explainPlausibility(record('neutral'), getExcuse('betriebsablauf')!, incident)).toContain('Allzweck')
  })

  it('warnt deutlich, bevor ein Wert zum Zugausfall führt', () => {
    const base = createRun('1')
    expect(criticalWarnings(base)).toEqual([])
    const late = { ...base, resources: { delay: WARN_DELAY, satisfaction: 20, condition: 15 } }
    const warnings = criticalWarnings(late)
    expect(warnings).toHaveLength(3)
    expect(warnings[0]).toContain(`noch ${DELAY_LIMIT - WARN_DELAY} Min`)
  })
})

describe('Einstiegstipps', () => {
  afterEach(cleanup)

  it('erscheinen einzeln, in fester Reihenfolge und nur im passenden Moment', () => {
    const run = createRun('1')
    const fresh = { enabled: true, seen: [] as string[] }
    expect(currentHint(fresh, run)?.hint.id).toBe('entscheidungen')
    // Tipp 2 erst, wenn Tipp 1 gesehen wurde und eine Entscheidung gefallen ist
    expect(currentHint({ enabled: true, seen: ['entscheidungen'] }, run)).toBeNull()
    const decided = appReducer({ screen: 'game', run, runId: 1 }, { type: 'choose', choiceId: getCurrentIncident(run).choices[0].id }).run!
    expect(currentHint({ enabled: true, seen: ['entscheidungen'] }, decided)?.hint.id).toBe('ressourcen')
    expect(currentHint({ enabled: true, seen: ['entscheidungen', 'ressourcen'] }, decided)?.hint.id).toBe('ausreden')
    expect(currentHint({ enabled: false, seen: [] }, run)).toBeNull()
    expect(currentHint({ enabled: true, seen: TUTORIAL_HINTS.map((h) => h.id) }, decided)).toBeNull()
    expect(TUTORIAL_HINTS.map((h) => h.id)).toEqual(['entscheidungen', 'ressourcen', 'ausreden', 'verbesserungen', 'probleme'])
  })

  it('lassen sich bestätigen und ganz ausblenden; die Wahl bleibt gespeichert', () => {
    quiet(true)
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /Neue Fahrt starten/ }))
    expect(screen.getByLabelText(/Tipp 1 von 5/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Verstanden' }))
    expect(screen.queryByLabelText(/Tipp 1 von 5/)).toBeNull()
    // Nach der ersten Entscheidung kommt Tipp 2
    fireEvent.click(screen.queryAllByRole('button').find((b) => /^A/.test(b.textContent ?? ''))!)
    expect(screen.getByLabelText(/Tipp 2 von 5/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Tipps ausblenden' }))
    expect(screen.queryByLabelText(/Tipp \d von 5/)).toBeNull()
    expect(JSON.parse(localStorage.getItem(TUTORIAL_KEY)!)).toEqual({ enabled: false, seen: ['entscheidungen'] })
  })

  it('im Menü wieder einschalten und von vorn beginnen', () => {
    quiet(false)
    render(<App />)
    const toggle = screen.getByLabelText('Tipps für Einsteiger anzeigen') as HTMLInputElement
    expect(toggle.checked).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Tipps von vorn' }))
    expect((screen.getByLabelText('Tipps für Einsteiger anzeigen') as HTMLInputElement).checked).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: /Neue Fahrt starten/ }))
    expect(screen.getByLabelText(/Tipp 1 von 5/)).toBeTruthy()
  })
})

describe('Rückmeldung in der Oberfläche', () => {
  beforeEach(() => quiet(false))
  afterEach(cleanup)

  it('zeigt Risiko mit Prozentangabe, verbleibende Stationen und Warnungen', () => {
    const base = withIncident(createRun('1'), 'wlan')
    saveRun({ ...base, resources: { delay: 24, satisfaction: 70, condition: 70 } })
    render(<App />)
    const risky = screen.queryAllByRole('button').find((b) => /Riskant/.test(b.textContent ?? ''))!
    expect(risky.textContent).toMatch(/Risiko hoch \(ca\. 55 %\)/)
    expect(screen.getByText('Noch 7 Stationen bis München Hbf.')).toBeTruthy()
    expect(screen.getByRole('status').textContent).toContain('Verspätung kritisch: noch 6 Min')
  })

  it('erklärt nach der Durchsage, warum die Ausrede (nicht) passte', () => {
    let s = withIncident(createRun('1'), 'tuerstoerung')
    s = continueJourney(chooseOption(s, 'reparieren'))
    s = { ...s, deck: { ...s.deck, hand: ['bauarbeiten', ...s.deck.hand.slice(1)] } }
    saveRun(s)
    render(<App />)
    fireEvent.click(screen.queryAllByRole('button').find((b) => /Kurzfristige Bauarbeiten/.test(b.textContent ?? ''))!)
    expect(screen.getByText(/Keine Überschneidung/)).toBeTruthy()
    expect(screen.getByText('Warum?')).toBeTruthy()
  })
})
