import {
  addCard,
  buildAnnouncement,
  CREDIBILITY_MAX,
  createStartingDeck,
  discardHand,
  drawHand,
  evaluateExcuse,
  rewardCard,
  STARTING_CREDIBILITY,
} from './announcements'
import { DELAY_LIMIT, INITIAL_RESOURCES, MAX_CHAIN_DEPTH, MAX_FOLLOW_UPS, RESOURCE_MAX, TIMETABLE_RESERVE } from './constants'
import { getExcuse } from './excuses'
import { FOLLOW_UPS, getIncident, INCIDENTS } from './incidents'
import { createRng, rngFor, rollFor, shuffle } from './rng'
import { STATIONS } from './stations'
import { STATUS_DEFINITIONS, STATUS_IDS } from './statuses'
import { availableUpgrades, hasSynergy, hasUpgrade, UPGRADES, upgradeStacks } from './upgrades'
import type {
  ActiveStatus,
  AnnouncementRecord,
  ArrivalRecord,
  Choice,
  Consequence,
  DecisionRecord,
  FailureReason,
  GameState,
  Incident,
  ResourceChange,
  ResourceEffects,
  Resources,
  ScheduledEvent,
  StatusId,
  UpgradeId,
} from './types'

export { rollFor } from './rng'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** So viele Verbesserungen stehen bei jeder Ankunft zur Wahl. */
export const UPGRADE_OFFER_SIZE = 3
/** Auf diesen Wert setzt die Ersatzbus-Garantie die Verspätung. */
export const ERSATZBUS_DELAY = 24

/**
 * Wählt für jede Station einen regulären Vorfall aus der Schwierigkeitsstufe der Station.
 * Derselbe Seed ergibt immer dieselbe Reihenfolge, und innerhalb einer Fahrt wiederholt sich kein Vorfall.
 */
export function selectIncidents(seed: string, pool: readonly Incident[] = INCIDENTS): string[] {
  const shuffled = shuffle(pool, createRng(seed))
  const used = new Set<string>()
  return STATIONS.map((station, index) => {
    const incident = shuffled.find((i) => i.tier === station.tier && !used.has(i.id))
    if (!incident) throw new Error(`Zu wenige Vorfälle der Stufe ${station.tier} für Station ${index + 1}`)
    used.add(incident.id)
    return incident.id
  })
}

export function createRun(seed: string): GameState {
  return {
    version: 3,
    seed,
    phase: 'incident',
    stationIndex: 0,
    eventIndex: 0,
    resources: { ...INITIAL_RESOURCES },
    credibility: STARTING_CREDIBILITY,
    events: selectIncidents(seed).map((incidentId, stationIndex) => ({ stationIndex, incidentId, depth: 0 })),
    statuses: [],
    deck: createStartingDeck(seed),
    cardUses: {},
    upgrades: [],
    upgradeOffer: [],
    ersatzbusUsed: false,
    rewards: [],
    history: [],
    announcements: [],
    arrivals: [],
    failures: [],
  }
}

/** Wendet Änderungen an und hält alle Werte in ihren Grenzen. */
export function applyEffects(resources: Resources, effects: ResourceEffects): Resources {
  return {
    delay: Math.max(0, resources.delay + (effects.delay ?? 0)),
    satisfaction: clamp(resources.satisfaction + (effects.satisfaction ?? 0), 0, RESOURCE_MAX),
    condition: clamp(resources.condition + (effects.condition ?? 0), 0, RESOURCE_MAX),
  }
}

/**
 * Verstärkt nur die Nachteile (mehr Verspätung, weniger Zufriedenheit/Zustand). Die Verspätung
 * wächst nur mit 60 % des Zuschlags, weil ihr Grenzwert viel enger ist als bei den anderen Werten.
 */
export function scaleEffects(effects: ResourceEffects, factor: number): ResourceEffects {
  const scaled: ResourceEffects = {}
  const delayFactor = 1 + (factor - 1) * 0.6
  if (effects.delay !== undefined) {
    scaled.delay = effects.delay > 0 ? Math.round(effects.delay * delayFactor) : effects.delay
  }
  if (effects.satisfaction !== undefined) {
    scaled.satisfaction = effects.satisfaction < 0 ? Math.round(effects.satisfaction * factor) : effects.satisfaction
  }
  if (effects.condition !== undefined) {
    scaled.condition = effects.condition < 0 ? Math.round(effects.condition * factor) : effects.condition
  }
  return scaled
}

export function getFailures(resources: Resources): FailureReason[] {
  const failures: FailureReason[] = []
  if (resources.delay >= DELAY_LIMIT) failures.push('delay')
  if (resources.satisfaction <= 0) failures.push('satisfaction')
  if (resources.condition <= 0) failures.push('condition')
  return failures
}

export function getCurrentEvent(state: GameState): ScheduledEvent {
  return state.events[state.eventIndex]
}

export function getCurrentIncident(state: GameState): Incident {
  const event = getCurrentEvent(state)
  const incident = event && getIncident(event.incidentId)
  if (!incident) throw new Error(`Unbekannter Vorfall bei Ereignis ${state.eventIndex}`)
  return incident
}

export function getChoice(incident: Incident, choiceId: string): Choice | undefined {
  return incident.choices.find((choice) => choice.id === choiceId)
}

export function isLastEvent(state: GameState): boolean {
  return state.eventIndex === state.events.length - 1
}

/** Die zuletzt getroffene Entscheidung, sofern sie zum aktuellen Ereignis gehört. */
export function getLastDecision(state: GameState): DecisionRecord | undefined {
  const last = state.history[state.history.length - 1]
  return last && last.eventIndex === state.eventIndex ? last : undefined
}

/** Die Durchsage zum aktuellen Ereignis, sofern es schon eine gab. */
export function getLastAnnouncement(state: GameState): AnnouncementRecord | undefined {
  const last = state.announcements[state.announcements.length - 1]
  return last && last.eventIndex === state.eventIndex ? last : undefined
}

export interface Resolution extends Consequence {
  success: boolean
}

/** Entscheidet über den Ausgang einer Wahl. `roll` ist ein Wert in [0, 1). */
export function resolveChoice(choice: Choice, roll: number, chance = choice.kind === 'risky' ? choice.risk.chance : 0): Resolution {
  if (choice.kind === 'risky' && roll < chance) {
    const { chance: _chance, ...failure } = choice.risk
    return { ...failure, success: false }
  }
  return { effects: choice.effects, outcome: choice.outcome, causes: choice.causes, cures: choice.cures, success: true }
}

/** Fehlschlagwahrscheinlichkeit einer riskanten Option nach Verbesserungen. */
export function riskChance(state: GameState, incident: Incident, choice: Choice): number {
  if (choice.kind !== 'risky') return 0
  let chance = choice.risk.chance
  if (hasUpgrade(state, 'zocker')) chance -= 0.1
  if (incident.categories.includes('technik') && hasSynergy(state, 'mechaniker-technik')) chance -= 0.1
  return Math.max(0.05, Math.round(chance * 100) / 100)
}

/** Ausgang der Wahl im aktuellen Zustand, wie ihn chooseOption anwenden würde. */
export function previewResolution(state: GameState, choice: Choice, incident = getCurrentIncident(state)): Resolution {
  return resolveChoice(choice, rollFor(state.seed, 'risiko', state.eventIndex), riskChance(state, incident, choice))
}

/** Anzeigestufe des Risikos. Der tatsächliche Ausgang bleibt bis zur Wahl verborgen. */
export function riskLevel(chance: number): 'gering' | 'mittel' | 'hoch' {
  if (chance < 0.35) return 'gering'
  if (chance < 0.5) return 'mittel'
  return 'hoch'
}

function difference(before: Resources, after: Resources): Resources {
  return {
    delay: after.delay - before.delay,
    satisfaction: after.satisfaction - before.satisfaction,
    condition: after.condition - before.condition,
  }
}

/** Wirkung einer Entscheidung nach Stationsfaktor und Verbesserungen. */
export function effectiveEffects(state: GameState, incident: Incident, effects: ResourceEffects): ResourceEffects {
  const scaled = scaleEffects(effects, STATIONS[state.stationIndex].penalty)
  if (scaled.satisfaction !== undefined && scaled.satisfaction < 0 && incident.categories.includes('fahrgaeste') && hasUpgrade(state, 'legendaerer-schaffner')) {
    scaled.satisfaction = Math.round(scaled.satisfaction * 0.7)
  }
  if (scaled.condition !== undefined && scaled.condition > 0 && incident.categories.includes('technik') && hasSynergy(state, 'mechaniker-technik')) {
    scaled.condition = Math.round(scaled.condition * 1.5)
  }
  return scaled
}

/** Wirkung eines laufenden Problems pro Ereignis nach Verbesserungen. */
export function statusTick(state: GameState, id: StatusId): ResourceEffects {
  const tick = { ...STATUS_DEFINITIONS[id].tick }
  if (hasUpgrade(state, 'dickes-fell')) {
    if (tick.delay) tick.delay = Math.max(0, tick.delay - 1)
    if (tick.satisfaction) tick.satisfaction = Math.min(0, tick.satisfaction + 1)
    if (tick.condition) tick.condition = Math.min(0, tick.condition + 1)
  }
  return tick
}

export function statusDuration(state: GameState, id: StatusId): number {
  return Math.max(1, STATUS_DEFINITIONS[id].duration - (hasUpgrade(state, 'fruehwarnung') ? 1 : 0))
}

export function timetableReserve(state: GameState): number {
  return TIMETABLE_RESERVE + (hasUpgrade(state, 'fahrplan-puffer') ? 1 : 0)
}

/**
 * Löst das aktuelle Ereignis mit der gewählten Option. Ablauf:
 * 1. Ausgang würfeln (nur riskante Optionen) und mit dem Faktor der Station anwenden.
 * 2. Behobene Probleme entfernen; alle übrigen Probleme wirken einmal und laufen ab.
 * 3. Neue Probleme beginnen (sie wirken ab der nächsten Entscheidung).
 * 4. Fahrzeitreserve nach dem regulären Vorfall, dann ggf. die Ersatzbus-Garantie.
 * Ungültige Aufrufe (falsche Phase, unbekannte Option) lassen den Zustand unverändert.
 */
export function chooseOption(state: GameState, choiceId: string): GameState {
  if (state.phase !== 'incident') return state
  const incident = getCurrentIncident(state)
  const choice = getChoice(incident, choiceId)
  if (!choice) return state

  const event = getCurrentEvent(state)
  const resolution = previewResolution(state, choice, incident)
  const changes: ResourceChange[] = []
  let resources = state.resources
  const apply = (source: ResourceChange['source'], effects: ResourceEffects) => {
    const next = applyEffects(resources, effects)
    changes.push({ source, delta: difference(resources, next) })
    resources = next
  }

  apply('choice', effectiveEffects(state, incident, resolution.effects))
  const upgradeNotes = describeUpgradeEffects(state, incident, choice, resolution)
  if (hasUpgrade(state, 'bistro-flatrate') && changes[0].delta.delay >= 3) apply('bistro', { satisfaction: 2 })

  const cures = resolution.cures ?? []
  const statusesCured = state.statuses.filter((s) => cures.includes(s.id)).map((s) => s.id)
  const statusesExpired: StatusId[] = []
  let statuses: ActiveStatus[] = []
  for (const status of state.statuses) {
    if (cures.includes(status.id)) continue
    apply(status.id, statusTick(state, status.id))
    if (hasUpgrade(state, 'dickes-fell')) {
      const base = STATUS_DEFINITIONS[status.id].tick
      const tick = statusTick(state, status.id)
      const saved = (base.delay ?? 0) - (tick.delay ?? 0) + (tick.satisfaction ?? 0) - (base.satisfaction ?? 0) + (tick.condition ?? 0) - (base.condition ?? 0)
      if (saved > 0) upgradeNotes.push(`Dickes Fell: „${STATUS_DEFINITIONS[status.id].label}“ wirkt ${saved} Punkt${saved > 1 ? 'e' : ''} milder`)
    }
    if (status.remaining > 1) statuses.push({ ...status, remaining: status.remaining - 1 })
    else statusesExpired.push(status.id)
  }

  const causes = resolution.causes ?? []
  const statusesRenewed = causes.filter((id) => state.statuses.some((s) => s.id === id) && !cures.includes(id))
  const statusesAdded = causes.filter((id) => !statusesRenewed.includes(id))
  for (const id of causes) {
    // Ein Problem gibt es nur einmal; erneutes Auslösen setzt die Dauer zurück.
    statuses = statuses.filter((s) => s.id !== id)
    statuses.push({ id, remaining: statusDuration(state, id), depth: event.depth })
    if (hasUpgrade(state, 'fruehwarnung')) upgradeNotes.push(`Frühwarnsystem: „${STATUS_DEFINITIONS[id].label}“ endet ein Ereignis früher`)
  }
  statuses.sort((a, b) => STATUS_IDS.indexOf(a.id) - STATUS_IDS.indexOf(b.id))

  // Der reguläre Vorfall ist immer das letzte Ereignis einer Station; danach geht es auf die Strecke.
  if (event.depth === 0 && state.stationIndex < STATIONS.length - 1 && resources.delay > 0) {
    apply('reserve', { delay: -timetableReserve(state) })
    if (hasUpgrade(state, 'fahrplan-puffer') && changes.at(-1)!.delta.delay < -TIMETABLE_RESERVE) upgradeNotes.push('Großzügiger Fahrplan: 1 Minute zusätzlich aufgeholt')
  }

  let ersatzbusUsed = state.ersatzbusUsed
  if (resources.delay >= DELAY_LIMIT && hasUpgrade(state, 'ersatzbus') && !ersatzbusUsed) {
    apply('ersatzbus', { delay: ERSATZBUS_DELAY - resources.delay })
    ersatzbusUsed = true
  }

  return {
    ...state,
    phase: 'result',
    resources,
    statuses,
    ersatzbusUsed,
    history: [
      ...state.history,
      {
        eventIndex: state.eventIndex,
        stationIndex: state.stationIndex,
        incidentId: incident.id,
        choiceId: choice.id,
        kind: choice.kind,
        success: resolution.success,
        before: state.resources,
        after: resources,
        changes,
        statusesAdded,
        statusesRenewed,
        statusesCured,
        statusesExpired: statusesExpired.filter((id) => !causes.includes(id)),
        upgradeNotes,
      },
    ],
    failures: getFailures(resources),
  }
}

/** Was Verbesserungen an Risiko und Wirkung einer Entscheidung geändert haben, für die Rückmeldung. */
function describeUpgradeEffects(state: GameState, incident: Incident, choice: Choice, resolution: Resolution): string[] {
  const notes: string[] = []
  if (choice.kind === 'risky') {
    const chance = riskChance(state, incident, choice)
    if (chance < choice.risk.chance) {
      const sources = [hasUpgrade(state, 'zocker') ? 'Zocker-Lokführer' : '', incident.categories.includes('technik') && hasSynergy(state, 'mechaniker-technik') ? 'Schrauber-Instinkt' : '']
      notes.push(`${sources.filter(Boolean).join(' + ')}: Risiko ${Math.round(choice.risk.chance * 100)} % → ${Math.round(chance * 100)} %`)
    }
  }
  const plain = scaleEffects(resolution.effects, STATIONS[state.stationIndex].penalty)
  const actual = effectiveEffects(state, incident, resolution.effects)
  const savedSatisfaction = (actual.satisfaction ?? 0) - (plain.satisfaction ?? 0)
  if (savedSatisfaction > 0) notes.push(`Legendärer Schaffner: ${savedSatisfaction} Zufriedenheit gespart`)
  const extraCondition = (actual.condition ?? 0) - (plain.condition ?? 0)
  if (extraCondition > 0) notes.push(`Schrauber-Instinkt: +${extraCondition} Zugzustand zusätzlich`)
  return notes
}

/** Folgeereignisse, die ein Problem auslösen kann. */
export function getFollowUpsFor(status: StatusId): Incident[] {
  return FOLLOW_UPS.filter((incident) => incident.trigger?.status === status)
}

/** Auslösewahrscheinlichkeit eines Folgeereignisses nach Verbesserungen. */
export function followUpChance(state: GameState, incident: Incident): number {
  const chance = incident.trigger?.chance ?? 0
  return hasUpgrade(state, 'notfallplan') ? chance / 2 : chance
}

/**
 * Prüft beim Wechsel zu einer neuen Station, ob ein aktives Problem ein Folgeereignis auslöst.
 * Grenzen gegen Endlosketten: höchstens MAX_FOLLOW_UPS pro Fahrt, jedes Folgeereignis nur einmal,
 * höchstens eines pro Station und eine Kettentiefe von höchstens MAX_CHAIN_DEPTH.
 */
export function rollFollowUp(state: GameState, stationIndex: number): ScheduledEvent | null {
  const scheduled = state.events.filter((e) => e.depth > 0)
  if (scheduled.length >= MAX_FOLLOW_UPS) return null
  const used = new Set(state.events.map((e) => e.incidentId))
  for (const status of state.statuses) {
    if (status.depth + 1 > MAX_CHAIN_DEPTH) continue
    for (const incident of getFollowUpsFor(status.id)) {
      if (used.has(incident.id)) continue
      if (rollFor(state.seed, `folge-${incident.id}`, stationIndex) < followUpChance(state, incident)) {
        return { stationIndex, incidentId: incident.id, depth: status.depth + 1, cause: status.id }
      }
    }
  }
  return null
}

/** Weiter zum nächsten Ereignis; beim Stationswechsel kann ein Folgeereignis eingeschoben werden. */
function advanceToNextEvent(state: GameState): GameState {
  let events = state.events
  const next = events[state.eventIndex + 1]
  let arrivals = state.arrivals
  if (next.stationIndex !== state.stationIndex) {
    const followUp = rollFollowUp(state, next.stationIndex)
    if (followUp) events = [...events.slice(0, state.eventIndex + 1), followUp, ...events.slice(state.eventIndex + 1)]
    // Hat der Notfallplan ein Folgeereignis verhindert? Dann soll man es auch erfahren.
    if (!followUp && hasUpgrade(state, 'notfallplan')) {
      const without = rollFollowUp({ ...state, upgrades: state.upgrades.filter((u) => u.id !== 'notfallplan') }, next.stationIndex)
      const last = arrivals.at(-1)
      if (without && last?.stationIndex === next.stationIndex) {
        const note = `Notfallplan: „${getIncident(without.incidentId)!.title}“ wurde verhindert`
        arrivals = [...arrivals.slice(0, -1), { ...last, notes: [...(last.notes ?? []), note] }]
      }
    }
  }
  const eventIndex = state.eventIndex + 1
  return { ...state, phase: 'incident', events, eventIndex, stationIndex: events[eventIndex].stationIndex, upgradeOffer: [], arrivals }
}

/** Wirkung der Verbesserungen bei der Ankunft an einer neuen Station. */
export function arrivalEffects(state: GameState, stationIndex: number): ArrivalRecord {
  const changes: ArrivalRecord['changes'] = []
  const werkstatt = upgradeStacks(state, 'werkstatt-abo')
  if (werkstatt > 0) changes.push({ source: 'werkstatt-abo', delta: { delay: 0, satisfaction: 0, condition: 2 * werkstatt } })
  const bonus = upgradeStacks(state, 'bahnbonus')
  if (bonus > 0) changes.push({ source: 'bahnbonus', delta: { delay: 0, satisfaction: 2 * bonus, condition: 0 } })
  if (hasUpgrade(state, 'wunder-mechaniker') && rollFor(state.seed, 'mechaniker', stationIndex) < 0.35) {
    changes.push({ source: 'wunder-mechaniker', delta: { delay: 0, satisfaction: 0, condition: 8 } })
  }
  return { stationIndex, changes }
}

/** Drei zufällige, noch verfügbare Verbesserungen nach Seed. */
export function rollUpgradeOffer(state: GameState, stationIndex: number): UpgradeId[] {
  return shuffle(availableUpgrades(state), rngFor(state.seed, 'angebot', stationIndex)).slice(0, UPGRADE_OFFER_SIZE)
}

/**
 * Weiter im Ablauf:
 * - result → announcement (Hand ziehen) oder gameover
 * - announced → victory, gameover, upgrade (bei Ankunft an einer neuen Station) oder nächstes Ereignis
 * In allen anderen Phasen bleibt der Zustand unverändert.
 */
export function continueJourney(state: GameState): GameState {
  if (state.phase === 'result') {
    if (state.failures.length > 0) return { ...state, phase: 'gameover' }
    return { ...state, phase: 'announcement', deck: drawHand(state, getCurrentIncident(state)) }
  }
  if (state.phase !== 'announced') return state
  if (state.failures.length > 0) return { ...state, phase: 'gameover' }
  if (isLastEvent(state)) return { ...state, phase: 'victory' }

  const next = state.events[state.eventIndex + 1]
  if (next.stationIndex === state.stationIndex) return advanceToNextEvent(state)

  // Ankunft an der nächsten Station: Verbesserungen wirken, dann gibt es neue zur Auswahl.
  const arrival = arrivalEffects(state, next.stationIndex)
  const resources = arrival.changes.reduce((r, change) => applyEffects(r, change.delta), state.resources)
  const arrived: GameState = { ...state, resources, arrivals: [...state.arrivals, arrival] }
  const offer = rollUpgradeOffer(arrived, next.stationIndex)
  if (offer.length === 0) return advanceToNextEvent(arrived)
  return { ...arrived, phase: 'upgrade', upgradeOffer: offer }
}

/** Spielt eine Ausrede aus der Hand. Ungültige Aufrufe lassen den Zustand unverändert. */
export function playExcuse(state: GameState, cardId: string): GameState {
  if (state.phase !== 'announcement' || !state.deck.hand.includes(cardId)) return state
  const card = getExcuse(cardId)!
  const incident = getCurrentIncident(state)
  const evaluation = evaluateExcuse(state, cardId, incident)
  const { text, reaction } = buildAnnouncement(state, card, incident, evaluation)

  const resources = applyEffects(state.resources, { satisfaction: evaluation.satisfaction, condition: evaluation.condition })
  const credibility = clamp(state.credibility + evaluation.credibility, 0, CREDIBILITY_MAX)
  let statuses = state.statuses
  if (evaluation.cures) statuses = statuses.filter((s) => s.id !== evaluation.cures)
  if (evaluation.eases) {
    statuses = statuses
      .map((s) => (s.id === evaluation.eases ? { ...s, remaining: s.remaining - 1 } : s))
      .filter((s) => s.remaining > 0)
  }

  // Die gespielte Karte zuerst ablegen, damit sie nach dem Mischen wieder dabei ist.
  const rest = [...state.deck.hand]
  rest.splice(rest.indexOf(cardId), 1)
  const hand = [cardId, ...rest]
  const record: AnnouncementRecord = {
    eventIndex: state.eventIndex,
    cardId,
    plausibility: evaluation.plausibility,
    text,
    reaction,
    before: state.resources,
    after: resources,
    credibilityBefore: state.credibility,
    credibilityAfter: credibility,
    eased: evaluation.eases ?? evaluation.cures,
    notes: evaluation.notes,
  }
  return {
    ...state,
    phase: 'announced',
    resources,
    credibility,
    statuses,
    deck: discardHand({ ...state.deck, hand }),
    cardUses: { ...state.cardUses, [cardId]: (state.cardUses[cardId] ?? 0) + 1 },
    announcements: [...state.announcements, record],
    failures: getFailures(resources),
  }
}

/** Wählt eine Verbesserung aus dem Angebot und fährt mit dem nächsten Ereignis fort. */
export function chooseUpgrade(state: GameState, upgradeId: UpgradeId): GameState {
  if (state.phase !== 'upgrade' || !state.upgradeOffer.includes(upgradeId)) return state
  // Einzigartige Verbesserungen nie doppelt, stapelbare nie über das Maximum (auch nicht aus alten Spielständen).
  if (upgradeStacks(state, upgradeId) >= UPGRADES[upgradeId].maxStacks) return state
  return advanceToNextEvent(grantUpgrade(state, upgradeId))
}

/** Fügt eine Stufe hinzu und wendet Sofortwirkungen an (Glaubwürdigkeit, neue Karten). Ohne Phasenprüfung. */
export function grantUpgrade(state: GameState, upgradeId: UpgradeId): GameState {
  const owned = state.upgrades.find((u) => u.id === upgradeId)
  const upgrades = owned
    ? state.upgrades.map((u) => (u.id === upgradeId ? { ...u, stacks: u.stacks + 1 } : u))
    : [...state.upgrades, { id: upgradeId, stacks: 1 }]
  let next: GameState = { ...state, upgrades }
  if (upgradeId === 'seriose-stimme') next = { ...next, credibility: Math.min(CREDIBILITY_MAX, next.credibility + 20) }
  if (upgradeId === 'pressemappe') {
    const picks = upgradeStacks(next, 'pressemappe')
    // Zwei Karten pro Pressemappe, jede nach eigenem Seed-Wurf
    const cards = [rewardCard(state.seed, picks * 2 - 1), rewardCard(state.seed, picks * 2)]
    next = { ...next, deck: cards.reduce(addCard, next.deck), rewards: [...next.rewards, ...cards] }
  }
  return next
}

export function isFinished(state: GameState): boolean {
  return state.phase === 'victory' || state.phase === 'gameover'
}
