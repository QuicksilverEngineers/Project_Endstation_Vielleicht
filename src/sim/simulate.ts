/**
 * Kopflose Simulation ganzer Fahrten mit der echten Spiellogik.
 * Wird von `npm run simulate` (scripts/simulate.ts) und von den Balance-Tests benutzt.
 */
import { cardCategories, evaluateExcuse, plausibilityOf } from '../game/announcements'
import { DELAY_LIMIT } from '../game/constants'
import {
  chooseOption,
  chooseUpgrade,
  continueJourney,
  createRun,
  effectiveEffects,
  getCurrentIncident,
  grantUpgrade,
  isFinished,
  playExcuse,
  riskChance,
} from '../game/engine'
import { getExcuse } from '../game/excuses'
import { createRng } from '../game/rng'
import { STATIONS } from '../game/stations'
import { STATUS_DEFINITIONS } from '../game/statuses'
import type { Choice, Consequence, FailureReason, GameState, Incident, Plausibility, Resources, UpgradeId } from '../game/types'
import { FOLLOW_UPS, INCIDENTS } from '../game/incidents'
import { UPGRADE_IDS } from '../game/upgrades'

type Rng = () => number

export interface Strategy {
  id: string
  name: string
  description: string
  /** Index der Option im aktuellen Vorfall */
  choose: (state: GameState, rng: Rng) => number
  card: (state: GameState, rng: Rng) => string
  upgrade: (state: GameState, rng: Rng) => UpgradeId
}

const pick = <T>(items: readonly T[], rng: Rng): T => items[Math.floor(rng() * items.length)]

// ── Bewertung von Optionen ──────────────────────────────────────────────────────────

/** Erwartete Änderung (nach Station und Verbesserungen) einer Option, gemittelt über das Risiko. */
export function expectedChange(state: GameState, choice: Choice): Resources {
  const incident = getCurrentIncident(state)
  const of = (c: Consequence) => {
    const e = effectiveEffects(state, incident, c.effects)
    const statusCost = { delay: 0, satisfaction: 0, condition: 0 }
    for (const id of c.causes ?? []) {
      const def = STATUS_DEFINITIONS[id]
      statusCost.delay += (def.tick.delay ?? 0) * def.duration
      statusCost.satisfaction += (def.tick.satisfaction ?? 0) * def.duration
      statusCost.condition += (def.tick.condition ?? 0) * def.duration
    }
    return {
      delay: (e.delay ?? 0) + statusCost.delay,
      satisfaction: (e.satisfaction ?? 0) + statusCost.satisfaction,
      condition: (e.condition ?? 0) + statusCost.condition,
    }
  }
  const success = of(choice)
  if (choice.kind !== 'risky') return success
  const p = riskChance(state, incident, choice)
  const failure = of(choice.risk)
  return {
    delay: (1 - p) * success.delay + p * failure.delay,
    satisfaction: (1 - p) * success.satisfaction + p * failure.satisfaction,
    condition: (1 - p) * success.condition + p * failure.condition,
  }
}

/** Kosten relativ zum verbleibenden Spielraum: Ein Punkt ist teurer, je knapper die Ressource ist. */
function marginCost(state: GameState, change: Resources): number {
  const r = state.resources
  return (
    change.delay / Math.max(1, DELAY_LIMIT - r.delay) - change.satisfaction / Math.max(1, r.satisfaction) - change.condition / Math.max(1, r.condition)
  )
}

const argmin = (values: number[]) => values.indexOf(Math.min(...values))
const choiceIndex = (state: GameState, kind: Choice['kind']) => getCurrentIncident(state).choices.findIndex((c) => c.kind === kind)

// ── Karten- und Verbesserungswahl ───────────────────────────────────────────────────

/** Beste Ausrede nach tatsächlicher Wirkung (so spielt jemand, der das System kennt). */
const bestCard = (state: GameState) => {
  const incident = getCurrentIncident(state)
  return [...state.deck.hand].sort((a, b) => evaluateExcuse(state, b, incident).satisfaction - evaluateExcuse(state, a, incident).satisfaction)[0]
}

const LABEL_ORDER: Plausibility[] = ['perfekt', 'plausibel', 'neutral', 'unglaubwuerdig']

/** Ausrede nur nach dem sichtbaren Etikett („Passt perfekt“, „Passt“ …) – so spielt jemand beim ersten Mal. */
const labelCard = (state: GameState, rng: Rng) => {
  const incident = getCurrentIncident(state)
  const rank = (id: string) => LABEL_ORDER.indexOf(plausibilityOf(cardCategories(state, getExcuse(id)!), incident))
  const best = Math.min(...state.deck.hand.map(rank))
  return pick(state.deck.hand.filter((id) => rank(id) === best), rng)
}

const randomCard = (state: GameState, rng: Rng) => pick(state.deck.hand, rng)
const randomUpgrade = (state: GameState, rng: Rng) => pick(state.upgradeOffer, rng)

/** Wählt die erste angebotene Verbesserung aus einer Vorliebenliste. */
const preferUpgrades =
  (order: UpgradeId[]) =>
  (state: GameState, rng: Rng): UpgradeId =>
    order.find((id) => state.upgradeOffer.includes(id)) ?? randomUpgrade(state, rng)

// ── Strategien ──────────────────────────────────────────────────────────────────────

export const STRATEGIES: Strategy[] = [
  {
    id: 'random',
    name: 'Zufall',
    description: 'Option, Ausrede und Verbesserung jeweils zufällig.',
    choose: (_, rng) => Math.floor(rng() * 3),
    card: randomCard,
    upgrade: randomUpgrade,
  },
  {
    id: 'beginner',
    name: 'Anfänger',
    description: 'Zufällige Optionen, aber Ausreden nach dem sichtbaren Etikett („Passt perfekt“ zuerst). Verbesserungen zufällig.',
    choose: (_, rng) => Math.floor(rng() * 3),
    card: labelCard,
    upgrade: randomUpgrade,
  },
  {
    id: 'conservative',
    name: 'Vorsichtig',
    description: 'Immer die sichere Option, beste Ausrede, defensive Verbesserungen.',
    choose: (state) => choiceIndex(state, 'safe'),
    card: bestCard,
    upgrade: preferUpgrades(['fahrplan-puffer', 'ersatzbus', 'dickes-fell', 'werkstatt-abo', 'bahnbonus', 'notfallplan']),
  },
  {
    id: 'risky',
    name: 'Risikofreudig',
    description: 'Immer die riskante Option, beste Ausrede, Verbesserungen gegen Risiko.',
    choose: (state) => choiceIndex(state, 'risky'),
    card: bestCard,
    upgrade: preferUpgrades(['zocker', 'werkstatt-abo', 'ersatzbus', 'dickes-fell', 'bahnbonus']),
  },
  {
    id: 'satisfaction',
    name: 'Zufriedenheit zuerst',
    description: 'Option mit dem geringsten erwarteten Zufriedenheitsverlust, beste Ausrede, Verbesserungen für die Fahrgäste.',
    choose: (state) => {
      const changes = getCurrentIncident(state).choices.map((c) => expectedChange(state, c))
      // Bei Gleichstand gewinnt die geringere Verspätung.
      return argmin(changes.map((c) => -c.satisfaction * 100 + c.delay))
    },
    card: bestCard,
    upgrade: preferUpgrades(['durchsage-profi', 'legendaerer-schaffner', 'bahnbonus', 'seriose-stimme', 'bistro-flatrate']),
  },
  {
    id: 'delay',
    name: 'Verspätung minimieren',
    description: 'Option mit der geringsten erwarteten Verspätung, beste Ausrede, Verbesserungen gegen Verspätung.',
    choose: (state) => {
      const changes = getCurrentIncident(state).choices.map((c) => expectedChange(state, c))
      return argmin(changes.map((c) => c.delay * 100 - c.satisfaction - c.condition))
    },
    card: bestCard,
    upgrade: preferUpgrades(['fahrplan-puffer', 'ersatzbus', 'notfallplan', 'zocker', 'werkstatt-abo']),
  },
  {
    id: 'balanced',
    name: 'Ausgewogen (Referenz)',
    description: 'Wägt alle Ressourcen nach verbleibendem Spielraum ab, beste Ausrede, ausgewogene Verbesserungen. Kennt die Grundwerte, nicht den Würfel.',
    choose: (state) => argmin(getCurrentIncident(state).choices.map((c) => marginCost(state, expectedChange(state, c)))),
    card: bestCard,
    upgrade: preferUpgrades(['fahrplan-puffer', 'ersatzbus', 'durchsage-profi', 'werkstatt-abo', 'dickes-fell', 'bahnbonus', 'legendaerer-schaffner']),
  },
]

export function getStrategy(id: string): Strategy {
  const strategy = STRATEGIES.find((s) => s.id === id)
  if (!strategy) throw new Error(`Unbekannte Strategie ${id}`)
  return strategy
}

// ── Eine Fahrt ──────────────────────────────────────────────────────────────────────

export interface RunResult {
  seed: string
  won: boolean
  failures: FailureReason[]
  /** Entscheidungen (Vorfälle) */
  turns: number
  stationsReached: number
  final: Resources
  /** Ressourcen bei der Ankunft an jeder erreichten Station (Index = Station). */
  trajectory: Resources[]
  upgrades: UpgradeId[]
  cards: { cardId: string; plausibility: Plausibility; satisfaction: number }[]
  /** Geschätzte Spielzeit eines Menschen in Minuten (siehe estimateMinutes). */
  minutes: number
  followUps: number
  state: GameState
}

export interface RunOptions {
  /** Diese Verbesserungen gibt es schon zu Beginn (für Wirksamkeitsvergleiche). */
  startUpgrades?: UpgradeId[]
  /** Ersetzt die Kartenwahl der Strategie. */
  card?: Strategy['card']
}

const words = (text: string) => text.split(/\s+/).filter(Boolean).length

/**
 * Geschätzte Spielzeit aus dem tatsächlich angezeigten Text: 180 Wörter pro Minute Lesetempo
 * plus feste Bedenkzeit je Entscheidung (Option 12 s, Ausrede 10 s, Verbesserung 10 s) und
 * 3 s je Bildschirmwechsel. Eine Schätzung, keine Messung.
 */
function estimateMinutes(state: GameState): number {
  let seconds = 0
  for (const record of state.history) {
    const incident = getCurrentIncident({ ...state, eventIndex: record.eventIndex })
    const choice = incident.choices.find((c) => c.id === record.choiceId)!
    const read = words(incident.title) + words(incident.description) + incident.choices.reduce((n, c) => n + words(c.label), 0)
    const result = words(record.success || choice.kind !== 'risky' ? choice.outcome : choice.risk.outcome)
    seconds += ((read + result) / 180) * 60 + 12 + 3 * 2
  }
  for (const a of state.announcements) {
    const cards = 3 * 12 // Kartenname, Kategorien, Etikett
    seconds += ((cards + words(a.text) + words(a.reaction ?? '')) / 180) * 60 + 10 + 3 * 2
  }
  seconds += state.arrivals.length * (((3 * 25) / 180) * 60 + 10 + 3)
  return seconds / 60
}

export function simulateRun(strategy: Strategy, seed: string, options: RunOptions = {}): RunResult {
  const rng = createRng(`sim|${strategy.id}|${seed}`)
  let state = createRun(seed)
  // Wie eine echte Wahl, inklusive Sofortwirkung (z. B. Karten der Pressemappe)
  for (const id of options.startUpgrades ?? []) state = grantUpgrade(state, id)
  const card = options.card ?? strategy.card
  const trajectory: Resources[] = [state.resources]
  let guard = 0
  while (!isFinished(state)) {
    if (++guard > 200) throw new Error(`Fahrt ${seed} mit ${strategy.id} hängt in Phase ${state.phase}`)
    const before = state
    switch (state.phase) {
      case 'incident': {
        const index = strategy.choose(state, rng)
        state = chooseOption(state, getCurrentIncident(state).choices[index].id)
        break
      }
      case 'announcement':
        state = playExcuse(state, card(state, rng))
        break
      case 'upgrade':
        state = chooseUpgrade(state, strategy.upgrade(state, rng))
        break
      default:
        state = continueJourney(state)
    }
    if (state === before) throw new Error(`Fahrt ${seed} mit ${strategy.id}: Aktion in Phase ${state.phase} ohne Wirkung`)
    if (state.phase === 'incident' && state.stationIndex !== before.stationIndex) trajectory[state.stationIndex] = state.resources
  }
  const won = state.phase === 'victory'
  return {
    seed,
    won,
    failures: state.failures,
    turns: state.history.length,
    stationsReached: won ? STATIONS.length : state.stationIndex + 1,
    final: state.resources,
    trajectory,
    upgrades: state.upgrades.flatMap((u) => Array.from({ length: u.stacks }, () => u.id)),
    cards: state.announcements.map((a) => ({
      cardId: a.cardId,
      plausibility: a.plausibility,
      satisfaction: a.after.satisfaction - a.before.satisfaction,
    })),
    minutes: estimateMinutes(state),
    followUps: state.events.filter((e) => e.depth > 0).length,
    state,
  }
}

// ── Auswertung ──────────────────────────────────────────────────────────────────────

export interface StrategyReport {
  strategy: Strategy
  runs: number
  winRate: number
  avgTurns: number
  avgStations: number
  avgMinutes: number
  minutesP10: number
  minutesP90: number
  avgFollowUps: number
  failures: Record<FailureReason, number>
  /** Durchschnittliche Ressourcen bei Ankunft je Station und Anteil der Fahrten, die sie erreichen. */
  trajectory: { station: string; reached: number; delay: number; satisfaction: number; condition: number }[]
  avgFinal: Resources
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
const percentile = (xs: number[], p: number) => {
  const sorted = [...xs].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] ?? 0
}

export function seeds(count: number, offset = 0): string[] {
  return Array.from({ length: count }, (_, i) => String(100000 + offset + i))
}

export function evaluateStrategy(strategy: Strategy, runSeeds: string[], options: RunOptions = {}): { report: StrategyReport; results: RunResult[] } {
  const results = runSeeds.map((seed) => simulateRun(strategy, seed, options))
  const failures: Record<FailureReason, number> = { delay: 0, satisfaction: 0, condition: 0 }
  for (const r of results) for (const f of r.failures) failures[f]++
  const trajectory = STATIONS.map((station, i) => {
    const at = results.filter((r) => r.trajectory[i])
    return {
      station: station.name,
      reached: at.length / results.length,
      delay: mean(at.map((r) => r.trajectory[i].delay)),
      satisfaction: mean(at.map((r) => r.trajectory[i].satisfaction)),
      condition: mean(at.map((r) => r.trajectory[i].condition)),
    }
  })
  const minutes = results.map((r) => r.minutes)
  return {
    results,
    report: {
      strategy,
      runs: results.length,
      winRate: results.filter((r) => r.won).length / results.length,
      avgTurns: mean(results.map((r) => r.turns)),
      avgStations: mean(results.map((r) => r.stationsReached)),
      avgMinutes: mean(minutes),
      minutesP10: percentile(minutes, 0.1),
      minutesP90: percentile(minutes, 0.9),
      avgFollowUps: mean(results.map((r) => r.followUps)),
      failures,
      trajectory,
      avgFinal: {
        delay: mean(results.map((r) => r.final.delay)),
        satisfaction: mean(results.map((r) => r.final.satisfaction)),
        condition: mean(results.map((r) => r.final.condition)),
      },
    },
  }
}

export interface UpgradeEffect {
  id: UpgradeId
  /** Siegquote, wenn die Verbesserung von Beginn an vorhanden ist */
  winRate: number
  /** Unterschied zur Basis in Prozentpunkten */
  delta: number
}

/** Kontrollierter Vergleich: dieselben Seeds, einmal ohne und einmal mit der Verbesserung ab Start. */
export function upgradeEffects(strategy: Strategy, runSeeds: string[]): { baseline: number; effects: UpgradeEffect[] } {
  const baseline = evaluateStrategy(strategy, runSeeds).report.winRate
  const effects = UPGRADE_IDS.map((id) => {
    const winRate = evaluateStrategy(strategy, runSeeds, { startUpgrades: [id] }).report.winRate
    return { id, winRate, delta: (winRate - baseline) * 100 }
  })
  return { baseline, effects: effects.sort((a, b) => b.delta - a.delta) }
}

export interface CardStat {
  cardId: string
  plays: number
  avgSatisfaction: number
  plausibility: Record<Plausibility, number>
}

export function cardStats(results: RunResult[]): CardStat[] {
  const map = new Map<string, CardStat>()
  for (const r of results) {
    for (const c of r.cards) {
      const stat = map.get(c.cardId) ?? { cardId: c.cardId, plays: 0, avgSatisfaction: 0, plausibility: { perfekt: 0, plausibel: 0, neutral: 0, unglaubwuerdig: 0 } }
      stat.avgSatisfaction = (stat.avgSatisfaction * stat.plays + c.satisfaction) / (stat.plays + 1)
      stat.plays++
      stat.plausibility[c.plausibility]++
      map.set(c.cardId, stat)
    }
  }
  return [...map.values()].sort((a, b) => b.plays - a.plays)
}

/** Kartenwahl, die immer die schlechteste Ausrede spielt – um den Einfluss der Karten zu messen. */
export const worstCard: Strategy['card'] = (state) => {
  const incident = getCurrentIncident(state)
  return [...state.deck.hand].sort((a, b) => evaluateExcuse(state, a, incident).satisfaction - evaluateExcuse(state, b, incident).satisfaction)[0]
}


/**
 * Optionen, die eine andere Option desselben Vorfalls in allen drei Ressourcen schlägt
 * (erwartete Änderung inkl. Risiko und Problemkosten, an der schwierigsten Station des Vorfalls).
 */
export function dominatedOptions(): { incident: Incident; choice: Choice; by: Choice }[] {
  const found: { incident: Incident; choice: Choice; by: Choice }[] = []
  for (const incident of [...INCIDENTS, ...FOLLOW_UPS]) {
    const stationIndex = Math.max(...STATIONS.map((s, i) => (incident.trigger ? i : s.tier === incident.tier ? i : -1)))
    let state: GameState = createRun('dominanz')
    state = { ...state, stationIndex, eventIndex: state.events.findIndex((e) => e.stationIndex === stationIndex) }
    state = { ...state, events: state.events.map((e, i) => (i === state.eventIndex ? { ...e, incidentId: incident.id } : e)) }
    const ex = incident.choices.map((c) => expectedChange(state, c))
    const better = (a: Resources, b: Resources) =>
      a.delay <= b.delay && a.satisfaction >= b.satisfaction && a.condition >= b.condition && (a.delay < b.delay || a.satisfaction > b.satisfaction || a.condition > b.condition)
    incident.choices.forEach((choice, i) => {
      const j = incident.choices.findIndex((_, k) => k !== i && better(ex[k], ex[i]))
      if (j >= 0) found.push({ incident, choice, by: incident.choices[j] })
    })
  }
  return found
}
