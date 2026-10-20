import { chooseOption, chooseUpgrade, continueJourney, createRun, playExcuse } from '../game/engine'
import type { GameState, UpgradeId } from '../game/types'

export type Screen = 'menu' | 'game'

export interface AppState {
  screen: Screen
  run: GameState | null
  /** Zählt gestartete Fahrten, damit die Oberfläche eine neue Fahrt frisch aufbaut (ohne Restanimationen der alten). */
  runId: number
}

export type AppAction =
  | { type: 'start'; seed: string }
  | { type: 'resume' }
  | { type: 'choose'; choiceId: string }
  | { type: 'continue' }
  | { type: 'playExcuse'; cardId: string }
  | { type: 'chooseUpgrade'; upgradeId: UpgradeId }
  | { type: 'menu' }
  | { type: 'abandon' }

/** Ein gespeicherter Lauf wird beim Laden direkt fortgesetzt. */
export function initAppState(saved: GameState | null): AppState {
  return { screen: saved ? 'game' : 'menu', run: saved, runId: 0 }
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'start':
      return { screen: 'game', run: createRun(action.seed), runId: state.runId + 1 }
    case 'resume':
      return state.run ? { ...state, screen: 'game' } : state
    case 'choose': {
      if (!state.run) return state
      const result = chooseOption(state.run, action.choiceId)
      // Ohne Niederlage geht es direkt zur Durchsage; das Ergebnis steht dort über den Ausreden.
      // So spart jede Station einen reinen „Weiter“-Klick. Bei einer Niederlage bleibt der Ergebnisbildschirm.
      const run = result.phase === 'result' && result.failures.length === 0 ? continueJourney(result) : result
      return { ...state, run }
    }
    case 'continue':
      return state.run ? { ...state, run: continueJourney(state.run) } : state
    case 'playExcuse':
      return state.run ? { ...state, run: playExcuse(state.run, action.cardId) } : state
    case 'chooseUpgrade':
      return state.run ? { ...state, run: chooseUpgrade(state.run, action.upgradeId) } : state
    case 'menu':
      // Zurück ins Menü: Ein laufendes Spiel bleibt zum Fortsetzen erhalten, ein beendetes nicht.
      if (state.run && (state.run.phase === 'victory' || state.run.phase === 'gameover')) {
        return { ...state, screen: 'menu', run: null }
      }
      return { ...state, screen: 'menu' }
    case 'abandon':
      return { ...state, screen: 'menu', run: null }
  }
}
