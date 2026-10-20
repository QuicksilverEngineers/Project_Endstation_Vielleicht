import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { chooseOption, chooseUpgrade, continueJourney, createRun, getCurrentIncident, isFinished, playExcuse } from './game/engine'
import { isValidGameState, loadRun, saveRun, STORAGE_KEY } from './game/storage'
import { bestCard } from './game/testUtils'
import type { GameState } from './game/types'
import { UPGRADES } from './game/upgrades'
import { evaluateStrategy, getStrategy, seeds, STRATEGIES, upgradeEffects } from './sim/simulate'
import { appReducer, initAppState } from './state/gameReducer'
import { SETTINGS_KEY } from './state/settings'

function quietSettings() {
  localStorage.clear()
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ sound: false, volume: 0, motion: 'reduced' }))
}

/** Zustand in der Verbesserungsphase nach dem ersten Vorfall. */
function atUpgrade(seed = '1'): GameState {
  let s = createRun(seed)
  s = continueJourney(chooseOption(s, getCurrentIncident(s).choices[0].id))
  s = continueJourney(playExcuse(s, bestCard(s)))
  return s
}

describe('Regression: einzigartige Verbesserungen', () => {
  it('nimmt eine bereits voll ausgebaute Verbesserung nicht noch einmal, auch wenn ein alter Spielstand sie anbietet', () => {
    const state: GameState = { ...atUpgrade(), upgrades: [{ id: 'zocker', stacks: 1 }], upgradeOffer: ['zocker', 'bahnbonus'] }
    expect(chooseUpgrade(state, 'zocker')).toBe(state)
    expect(chooseUpgrade(state, 'bahnbonus').upgrades).toEqual([
      { id: 'zocker', stacks: 1 },
      { id: 'bahnbonus', stacks: 1 },
    ])
  })

  it('verwirft Spielstände mit solchen Angeboten', () => {
    const state: GameState = { ...atUpgrade(), upgrades: [{ id: 'zocker', stacks: 1 }], upgradeOffer: ['zocker', 'bahnbonus'] }
    expect(isValidGameState(state)).toBe(false)
    expect(isValidGameState({ ...state, upgradeOffer: ['bahnbonus'] })).toBe(true)
  })

  it('kein Lauf besitzt am Ende eine Verbesserung öfter als erlaubt', () => {
    for (const strategy of STRATEGIES) {
      for (const r of evaluateStrategy(strategy, seeds(100, 7000)).results) {
        for (const u of r.state.upgrades) expect(u.stacks, `${strategy.id} ${u.id}`).toBeLessThanOrEqual(UPGRADES[u.id].maxStacks)
        expect(new Set(r.state.upgrades.map((u) => u.id)).size).toBe(r.state.upgrades.length)
      }
    }
  })
})

describe('Regression: Neuladen in jeder Phase', () => {
  beforeEach(quietSettings)
  afterEach(cleanup)

  it('stellt jede Phase einer ganzen Fahrt nach einem Neuladen korrekt dar', { timeout: 60000 }, () => {
    let state = createRun('neuladen')
    const seen = new Set<string>()
    let guard = 0
    while (++guard < 80) {
      saveRun(state)
      expect(loadRun()).toEqual(state)
      const view = render(<App />)
      // Jede Phase zeigt ihre eigene Überschrift und reagiert auf die Hauptaktion.
      expect(document.querySelector('[data-phase-heading]'), state.phase).toBeTruthy()
      view.unmount()
      seen.add(state.phase)
      if (isFinished(state)) break
      if (state.phase === 'incident') state = chooseOption(state, getCurrentIncident(state).choices[0].id)
      else if (state.phase === 'announcement') state = playExcuse(state, bestCard(state))
      else if (state.phase === 'upgrade') state = chooseUpgrade(state, state.upgradeOffer[0])
      else state = continueJourney(state)
    }
    expect([...seen]).toEqual(expect.arrayContaining(['incident', 'result', 'announcement', 'announced', 'upgrade']))
    expect(seen.has('victory') || seen.has('gameover')).toBe(true)
  })

  it('verwirft kaputte Spielstände und zeigt das Menü statt abzustürzen', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...createRun('1'), phase: 'announcement' }))
    render(<App />)
    expect(screen.getByRole('button', { name: /Neue Fahrt starten/ })).toBeTruthy()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})

describe('Regression: Neustart und Rückfrage', () => {
  beforeEach(quietSettings)
  afterEach(cleanup)

  it('fragt nach, bevor eine gespeicherte Fahrt ersetzt wird', () => {
    const saved = continueJourney(chooseOption(createRun('77'), getCurrentIncident(createRun('77')).choices[0].id))
    saveRun(saved)
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Hauptmenü' }))
    fireEvent.click(screen.getByRole('button', { name: /Neue Fahrt starten/ }))
    expect(screen.getByRole('alertdialog')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Abbrechen' }))
    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(loadRun()).toEqual(saved)
    fireEvent.click(screen.getByRole('button', { name: /Neue Fahrt starten/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Ja, neue Fahrt starten' }))
    expect(screen.getByText(/Station 1 von 8/)).toBeTruthy()
    expect(loadRun()?.history).toEqual([])
  })

  it('ohne gespeicherte Fahrt startet der Knopf sofort', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /Neue Fahrt starten/ }))
    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(screen.getByText(/Station 1 von 8/)).toBeTruthy()
  })

  it('nach dem Ende sofort neu starten: frische Werte, neue Fahrtnummer', () => {
    let app = initAppState(null)
    app = appReducer(app, { type: 'start', seed: '5' })
    let guard = 0
    while (app.run && !isFinished(app.run) && ++guard < 100) {
      const run: GameState = app.run
      if (run.phase === 'incident') app = appReducer(app, { type: 'choose', choiceId: getCurrentIncident(run).choices[2].id })
      else if (run.phase === 'announcement') app = appReducer(app, { type: 'playExcuse', cardId: run.deck.hand[0] })
      else if (run.phase === 'upgrade') app = appReducer(app, { type: 'chooseUpgrade', upgradeId: run.upgradeOffer[0] })
      else app = appReducer(app, { type: 'continue' })
    }
    const again = appReducer(app, { type: 'start', seed: '5' })
    expect(again.run).toEqual(createRun('5'))
    expect(again.runId).toBe(app.runId + 1)
  })

  it('doppeltes Weiter überspringt keine Phase', () => {
    let app = appReducer(initAppState(null), { type: 'start', seed: '1' })
    app = appReducer(app, { type: 'choose', choiceId: getCurrentIncident(app.run!).choices[0].id })
    app = appReducer(app, { type: 'continue' })
    const once = app
    app = appReducer(app, { type: 'continue' })
    expect(app.run!.phase).toBe('announcement')
    expect(app.run).toBe(once.run)
  })
})

describe('Regression: Lesbarkeit', () => {
  it('verwendet keine Textfarben mit zu wenig Kontrast (unter 4,5:1)', () => {
    const dir = join(process.cwd(), 'src', 'components')
    const files = [...readdirSync(dir).map((f) => join(dir, f)), join(process.cwd(), 'src', 'App.tsx')].filter((f) => f.endsWith('.tsx'))
    for (const file of files) {
      const source = readFileSync(file, 'utf8')
      // Weiß unter 50 % Deckkraft und abgeschwächtes Rot liegen auf dem dunklen Grund unter 4,5:1.
      expect(source, file).not.toMatch(/text-white\/[1-4]\d\b/)
      expect(source, file).not.toMatch(/text-board-red\/\d+/)
    }
  })
})

describe('Balance (Simulation mit echter Spiellogik)', () => {
  const runSeeds = seeds(400, 90000)
  const rate = (id: string) => evaluateStrategy(getStrategy(id), runSeeds).report.winRate

  it('Anfänger haben eine realistische Chance, Können lohnt sich, Zufall reicht nicht', { timeout: 60000 }, () => {
    const random = rate('random')
    const beginner = rate('beginner')
    const balanced = rate('balanced')
    expect(beginner).toBeGreaterThan(0.35)
    expect(beginner).toBeLessThan(0.7)
    expect(random).toBeLessThan(beginner)
    expect(balanced).toBeGreaterThan(beginner + 0.2)
    expect(balanced).toBeLessThan(0.99)
  })

  it('keine einzelne Verbesserung macht den Sieg automatisch', { timeout: 120000 }, () => {
    const { baseline, effects } = upgradeEffects(getStrategy('beginner'), seeds(300, 91000))
    for (const e of effects) {
      expect(e.delta, e.id).toBeLessThan(20)
      expect(e.winRate, e.id).toBeLessThan(0.85)
    }
    expect(baseline).toBeLessThan(0.75)
  })

  it('Ausreden beeinflussen das Ergebnis spürbar', { timeout: 60000 }, () => {
    const beginner = getStrategy('beginner')
    const withRandomCards = evaluateStrategy(beginner, runSeeds, { card: getStrategy('random').card }).report.winRate
    expect(rate('beginner')).toBeGreaterThan(withRandomCards + 0.08)
  })

  it('Fahrten dauern geschätzt 10–15 Minuten und unterscheiden sich', { timeout: 60000 }, () => {
    const { report, results } = evaluateStrategy(getStrategy('beginner'), runSeeds)
    expect(report.avgMinutes).toBeGreaterThan(9)
    expect(report.avgMinutes).toBeLessThan(16)
    const orders = new Set(results.map((r) => r.state.events.map((e) => e.incidentId).join()))
    expect(orders.size).toBeGreaterThan(runSeeds.length * 0.95)
  })
})

describe('Regression: Kartenanimation und Menü', () => {
  afterEach(cleanup)

  it('spielt keine Karte mehr, wenn man während der Animation ins Menü wechselt', async () => {
    localStorage.clear()
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ sound: false, volume: 0, motion: 'full' }))
    let s = createRun('42')
    s = continueJourney(chooseOption(s, getCurrentIncident(s).choices[0].id))
    saveRun(s)
    render(<App />)
    const card = screen.queryAllByRole('button').find((b) => /^(Gewöhnlich|Selten|Episch)/.test(b.textContent ?? ''))!
    fireEvent.click(card)
    fireEvent.click(screen.getByRole('button', { name: 'Hauptmenü' }))
    await new Promise((resolve) => setTimeout(resolve, 400))
    expect(loadRun()?.phase).toBe('announcement')
  })
})
