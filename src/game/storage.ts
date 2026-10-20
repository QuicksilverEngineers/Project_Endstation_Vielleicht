import { MAX_CHAIN_DEPTH } from './constants'
import { getIncident } from './incidents'
import { STATIONS } from './stations'
import { isStatusId } from './statuses'
import { getExcuse } from './excuses'
import { isUpgradeId, UPGRADES } from './upgrades'
import type { GamePhase, GameState, OwnedUpgrade, Resources, UpgradeId } from './types'

import { CURRENT_KEYS } from './migration'

export const STORAGE_KEY = CURRENT_KEYS.run

const PHASES: readonly GamePhase[] = ['incident', 'result', 'announcement', 'announced', 'upgrade', 'victory', 'gameover']

function isResources(value: unknown): value is Resources {
  if (typeof value !== 'object' || value === null) return false
  const r = value as Record<string, unknown>
  return ['delay', 'satisfaction', 'condition'].every((key) => Number.isFinite(r[key]))
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

/** Ein regulärer Vorfall je Station in Reihenfolge, Folgeereignisse dazwischen. */
function isValidEvents(value: unknown): boolean {
  if (!Array.isArray(value)) return false
  let station = 0
  let regular = 0
  for (const event of value) {
    if (!isRecord(event) || typeof event.incidentId !== 'string') return false
    const incident = getIncident(event.incidentId)
    if (!incident || event.stationIndex !== station) return false
    if (event.depth === 0 && !incident.trigger) {
      regular++
      station++
    } else if (!(Number.isInteger(event.depth) && (event.depth as number) >= 1 && (event.depth as number) <= MAX_CHAIN_DEPTH)) {
      return false
    }
  }
  return regular === STATIONS.length
}

function isValidStatuses(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every((s) => isRecord(s) && isStatusId(s.id) && Number.isInteger(s.remaining) && Number.isInteger(s.depth))
  )
}

const isCardList = (value: unknown) => Array.isArray(value) && value.every((id) => typeof id === 'string' && getExcuse(id) !== undefined)

function isValidDeck(value: unknown): boolean {
  return isRecord(value) && isCardList(value.drawPile) && isCardList(value.hand) && isCardList(value.discard) && Number.isInteger(value.shuffles)
}

function isValidUpgrades(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every((u) => isRecord(u) && isUpgradeId(u.id) && Number.isInteger(u.stacks) && (u.stacks as number) >= 1 && (u.stacks as number) <= UPGRADES[u.id].maxStacks)
  )
}

/** Prüft, ob ein geladener Wert ein gültiger Spielstand dieser Version ist. */
export function isValidGameState(value: unknown): value is GameState {
  if (!isRecord(value)) return false
  const s = value
  if (
    !(
      s.version === 3 &&
      typeof s.seed === 'string' &&
      PHASES.includes(s.phase as GamePhase) &&
      isResources(s.resources) &&
      isValidEvents(s.events) &&
      isValidStatuses(s.statuses) &&
      Array.isArray(s.history) &&
      Array.isArray(s.announcements) &&
      Array.isArray(s.arrivals) &&
      isValidDeck(s.deck) &&
      isValidUpgrades(s.upgrades) &&
      Array.isArray(s.upgradeOffer) &&
      s.upgradeOffer.every(isUpgradeId) &&
      isRecord(s.cardUses) &&
      typeof s.ersatzbusUsed === 'boolean' &&
      isCardList(s.rewards) &&
      Number.isFinite(s.credibility) &&
      Array.isArray(s.failures) &&
      Number.isInteger(s.eventIndex)
    )
  ) {
    return false
  }
  const events = s.events as GameState['events']
  const eventIndex = s.eventIndex as number
  const history = s.history as { eventIndex?: unknown }[]
  const announcements = s.announcements as { eventIndex?: unknown }[]
  const decided = history.length > 0 && history[history.length - 1].eventIndex === eventIndex
  const announced = announcements.length > 0 && announcements[announcements.length - 1].eventIndex === eventIndex
  const deck = s.deck as GameState['deck']
  return (
    eventIndex >= 0 &&
    eventIndex < events.length &&
    s.stationIndex === events[eventIndex].stationIndex &&
    // Jede Phase braucht die passenden Vorleistungen zum aktuellen Ereignis.
    (s.phase === 'incident' || decided) &&
    (s.phase !== 'announcement' || deck.hand.length > 0) &&
    (!['announced', 'upgrade', 'victory'].includes(s.phase as string) || announced) &&
    (s.phase !== 'upgrade' || (s.upgradeOffer as unknown[]).length > 0) &&
    // Kein Angebot darf eine Verbesserung enthalten, die schon voll ausgebaut ist.
    (s.upgradeOffer as UpgradeId[]).every((id) => !(s.upgrades as OwnedUpgrade[]).some((u) => u.id === id && u.stacks >= UPGRADES[id].maxStacks))
  )
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function defaultStorage(): StorageLike | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage
  } catch {
    return undefined
  }
}

export function saveRun(state: GameState, storage = defaultStorage()): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Speicher voll oder gesperrt: Das Spiel läuft trotzdem weiter.
  }
}

/** Lädt den gespeicherten Spielstand. Kaputte oder veraltete Daten werden verworfen. */
export function loadRun(storage = defaultStorage()): GameState | null {
  try {
    const raw = storage?.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (isValidGameState(parsed)) return parsed
    storage?.removeItem(STORAGE_KEY)
    return null
  } catch {
    return null
  }
}

export function clearRun(storage = defaultStorage()): void {
  try {
    storage?.removeItem(STORAGE_KEY)
  } catch {
    // ignorieren
  }
}
