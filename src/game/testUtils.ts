import { evaluateExcuse } from './announcements'
import { chooseOption, chooseUpgrade, continueJourney, getCurrentIncident, isFinished, playExcuse } from './engine'
import type { GameState, UpgradeId } from './types'

/** Hilfsfunktionen für Tests und Simulationen: eine Fahrt durch alle Phasen steuern. */

export type CardPick = (state: GameState) => string
export type UpgradePick = (state: GameState) => UpgradeId

/** Die Ausrede mit der größten Zufriedenheitswirkung. */
export const bestCard: CardPick = (state) => {
  const incident = getCurrentIncident(state)
  return [...state.deck.hand].sort(
    (a, b) => evaluateExcuse(state, b, incident).satisfaction - evaluateExcuse(state, a, incident).satisfaction,
  )[0]
}

export const firstCard: CardPick = (state) => state.deck.hand[0]

/** Erste angebotene Verbesserung, außer dem Notfallplan (er würde Folgeereignis-Würfe verändern). */
export const firstUpgrade: UpgradePick = (state) => state.upgradeOffer.find((id) => id !== 'notfallplan') ?? state.upgradeOffer[0]

/**
 * Führt eine Fahrt von einer beliebigen Phase bis zum nächsten Vorfall oder zum Spielende weiter.
 * In der Vorfallsphase passiert nichts.
 */
export function finishEvent(state: GameState, card: CardPick = bestCard, upgrade: UpgradePick = firstUpgrade): GameState {
  let guard = 0
  while (state.phase !== 'incident' && !isFinished(state)) {
    if (++guard > 10) throw new Error(`Hängt in Phase ${state.phase}`)
    if (state.phase === 'announcement') state = playExcuse(state, card(state))
    else if (state.phase === 'upgrade') state = chooseUpgrade(state, upgrade(state))
    else state = continueJourney(state)
  }
  return state
}

/** Spielt ein Ereignis komplett: Option wählen, Durchsage, ggf. Verbesserung. */
export function playEvent(state: GameState, choiceIndex: number, card: CardPick = bestCard, upgrade: UpgradePick = firstUpgrade): GameState {
  const choice = getCurrentIncident(state).choices[choiceIndex]
  return finishEvent(chooseOption(state, choice.id), card, upgrade)
}

/** Bis zum Ende spielen; `choose` liefert den Index der Option im aktuellen Vorfall. */
export function playRun(
  state: GameState,
  choose: (state: GameState) => number,
  card: CardPick = bestCard,
  upgrade: UpgradePick = firstUpgrade,
): GameState {
  let guard = 0
  while (!isFinished(state)) {
    if (++guard > 50) throw new Error('Fahrt endet nicht')
    state = state.phase === 'incident' ? playEvent(state, choose(state), card, upgrade) : finishEvent(state, card, upgrade)
  }
  return state
}
