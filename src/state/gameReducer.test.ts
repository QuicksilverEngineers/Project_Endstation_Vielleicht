import { describe, expect, it } from 'vitest'
import { createRun, getCurrentIncident, isFinished } from '../game/engine'
import type { GameState } from '../game/types'
import { appReducer, initAppState, type AppState } from './gameReducer'

/** Spielt über den Reducer bis zum Ende: Option C, erste Ausrede, erste Verbesserung. */
function playToEnd(state: AppState): AppState {
  while (state.run && !isFinished(state.run)) {
    const run: GameState = state.run
    if (run.phase === 'incident') state = appReducer(state, { type: 'choose', choiceId: getCurrentIncident(run).choices[2].id })
    else if (run.phase === 'announcement') state = appReducer(state, { type: 'playExcuse', cardId: run.deck.hand[0] })
    else if (run.phase === 'upgrade') state = appReducer(state, { type: 'chooseUpgrade', upgradeId: run.upgradeOffer[0] })
    else state = appReducer(state, { type: 'continue' })
  }
  return state
}

describe('App-Zustand', () => {
  it('startet im Menü ohne Spielstand und im Spiel mit Spielstand', () => {
    expect(initAppState(null)).toEqual({ screen: 'menu', run: null, runId: 0 })
    const run = createRun('1')
    expect(initAppState(run)).toEqual({ screen: 'game', run, runId: 0 })
  })

  it('startet eine neue Fahrt und ersetzt dabei eine laufende', () => {
    let state = appReducer(initAppState(null), { type: 'start', seed: '1' })
    state = appReducer(state, { type: 'choose', choiceId: getCurrentIncident(state.run!).choices[0].id })
    const restarted = appReducer(state, { type: 'start', seed: '2' })
    expect(restarted.screen).toBe('game')
    expect(restarted.run).toEqual(createRun('2'))
  })

  it('wiederholt eine Fahrt mit demselben Seed von vorn', () => {
    const finished = playToEnd(appReducer(initAppState(null), { type: 'start', seed: '5' }))
    const retry = appReducer(finished, { type: 'start', seed: finished.run!.seed })
    expect(retry.run).toEqual(createRun('5'))
  })

  it('behält eine laufende Fahrt im Menü und setzt sie fort', () => {
    const playing = appReducer(initAppState(null), { type: 'start', seed: '1' })
    const menu = appReducer(playing, { type: 'menu' })
    expect(menu.screen).toBe('menu')
    expect(menu.run).toBe(playing.run)
    expect(appReducer(menu, { type: 'resume' })).toEqual(playing)
  })

  it('verwirft eine beendete Fahrt beim Gang ins Menü', () => {
    const finished = playToEnd(appReducer(initAppState(null), { type: 'start', seed: '3' }))
    expect(['victory', 'gameover']).toContain(finished.run!.phase)
    expect(appReducer(finished, { type: 'menu' })).toMatchObject({ screen: 'menu', run: null })
  })

  it('verwirft eine gespeicherte Fahrt auf Wunsch', () => {
    const run: GameState = createRun('1')
    expect(appReducer({ screen: 'menu', run, runId: 3 }, { type: 'abandon' })).toEqual({ screen: 'menu', run: null, runId: 3 })
  })

  it('ignoriert Spielaktionen ohne laufende Fahrt', () => {
    const empty = initAppState(null)
    expect(appReducer(empty, { type: 'choose', choiceId: 'x' })).toBe(empty)
    expect(appReducer(empty, { type: 'continue' })).toBe(empty)
    expect(appReducer(empty, { type: 'resume' })).toBe(empty)
  })
})

describe('App-Zustand: Durchsage und Verbesserungen', () => {
  it('leitet Ausreden und Verbesserungen an die Spiellogik weiter', () => {
    let state = appReducer(initAppState(null), { type: 'start', seed: '1' })
    state = appReducer(state, { type: 'choose', choiceId: getCurrentIncident(state.run!).choices[0].id })
    state = appReducer(state, { type: 'continue' })
    expect(state.run!.phase).toBe('announcement')
    state = appReducer(state, { type: 'playExcuse', cardId: state.run!.deck.hand[0] })
    expect(state.run!.phase).toBe('announced')
    state = appReducer(state, { type: 'continue' })
    expect(state.run!.phase).toBe('upgrade')
    const pick = state.run!.upgradeOffer[0]
    state = appReducer(state, { type: 'chooseUpgrade', upgradeId: pick })
    expect(state.run!.upgrades).toEqual([{ id: pick, stacks: 1 }])
    expect(state.run!.phase).toBe('incident')
  })

  it('ignoriert Ausreden und Verbesserungen ohne laufende Fahrt', () => {
    const empty = initAppState(null)
    expect(appReducer(empty, { type: 'playExcuse', cardId: 'betriebsablauf' })).toBe(empty)
    expect(appReducer(empty, { type: 'chooseUpgrade', upgradeId: 'zocker' })).toBe(empty)
  })
})

describe('App-Zustand: Fahrtnummer', () => {
  it('zählt gestartete Fahrten, auch beim Wiederholen desselben Seeds', () => {
    let state = appReducer(initAppState(null), { type: 'start', seed: '1' })
    expect(state.runId).toBe(1)
    state = appReducer(state, { type: 'start', seed: '1' })
    expect(state.runId).toBe(2)
    expect(appReducer(state, { type: 'menu' }).runId).toBe(2)
  })
})
