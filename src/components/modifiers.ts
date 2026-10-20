import { getCurrentEvent } from '../game/engine'
import { STATIONS } from '../game/stations'
import type { GameState, Incident } from '../game/types'
import { hasSynergy, hasUpgrade, UPGRADES } from '../game/upgrades'

/**
 * Verbesserungen, die beim aktuellen Vorfall eine Rolle spielen – damit sichtbar wird,
 * wie die eigenen Verbesserungen die Wahl beeinflussen.
 */
export function activeModifiers(state: GameState, incident: Incident): string[] {
  const list: string[] = []
  const event = getCurrentEvent(state)
  const hasRisky = incident.choices.some((c) => c.kind === 'risky')
  if (hasRisky && hasUpgrade(state, 'zocker')) list.push(`${UPGRADES.zocker.name}: riskante Option −10 % Risiko`)
  if (incident.categories.includes('technik') && hasSynergy(state, 'mechaniker-technik')) list.push('Schrauber-Instinkt: Reparaturen +50 %, Risiko −10 %')
  if (incident.categories.includes('fahrgaeste') && hasUpgrade(state, 'legendaerer-schaffner'))
    list.push(`${UPGRADES['legendaerer-schaffner'].name}: 30 % weniger Zufriedenheitsverlust`)
  if (hasUpgrade(state, 'bistro-flatrate')) list.push(`${UPGRADES['bistro-flatrate'].name}: +2 Zufriedenheit ab 3 Min`)
  if (event.depth === 0 && state.stationIndex < STATIONS.length - 1 && hasUpgrade(state, 'fahrplan-puffer'))
    list.push(`${UPGRADES['fahrplan-puffer'].name}: 3 statt 2 Min Reserve`)
  if (hasUpgrade(state, 'ersatzbus') && !state.ersatzbusUsed) list.push(`${UPGRADES.ersatzbus.name}: bereit`)
  if (state.statuses.length > 0 && hasUpgrade(state, 'dickes-fell')) list.push(`${UPGRADES['dickes-fell'].name}: Probleme wirken milder`)
  if (hasUpgrade(state, 'fruehwarnung')) list.push(`${UPGRADES.fruehwarnung.name}: neue Probleme kürzer`)
  return list
}

/** Risiko in Worten und Zahlen, z. B. „ca. 40 %“ – der Ausgang selbst bleibt verborgen. */
export function riskPercent(chance: number): string {
  return `ca. ${Math.round(chance * 20) * 5} %`
}

/** Erstes Ereignis an dieser Station (nach der Ankunft)? */
export function isFirstEventAtStation(state: GameState): boolean {
  return state.eventIndex === 0 || state.events[state.eventIndex - 1].stationIndex !== state.stationIndex
}
