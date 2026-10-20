import { CLOSINGS, EXCUSES, getExcuse, IMPLAUSIBLE_REACTIONS, OPENINGS, PERFECT_REACTIONS, REPEAT_REACTIONS, STARTING_CORE, STARTING_EXTRA_COMMONS, STARTING_EXTRA_RARES } from './excuses'
import { rngFor, rollFor, shuffle } from './rng'
import { STATIONS } from './stations'
import { hasSynergy, hasUpgrade, upgradeStacks } from './upgrades'
import type { Category, DeckState, ExcuseCard, GameState, Incident, Plausibility, StatusId } from './types'

export const HAND_SIZE = 3
export const STARTING_CREDIBILITY = 50
/** Gesamtstärke aller Ausreden (Balance-Stellschraube, siehe docs/balance-report.md). */
export const EXCUSE_STRENGTH = 0.7
export const CREDIBILITY_MAX = 100

/** Glaubwürdigkeitsänderung je Passung, bevor Verbesserungen wirken. */
const CREDIBILITY_GAIN: Record<Plausibility, number> = { perfekt: 6, plausibel: 3, neutral: 0, unglaubwuerdig: -12 }
const MATCH_MULTIPLIER: Record<Exclude<Plausibility, 'unglaubwuerdig'>, number> = { perfekt: 1.3, plausibel: 1, neutral: 0.75 }
/** Zufriedenheitsverlust einer unglaubwürdigen Ausrede, bevor Verbesserungen wirken. */
const MISMATCH_SATISFACTION = 3

// ── Deck ─────────────────────────────────────────────────────────────────────────────

/** Startdeck: feste Grundausstattung, dazu gewöhnliche und eine seltene Karte nach Seed. */
export function createStartingDeck(seed: string): DeckState {
  const rng = rngFor(seed, 'startdeck', 0)
  const commons = EXCUSES.filter((c) => c.rarity === 'common' && !STARTING_CORE.includes(c.id))
  const rares = EXCUSES.filter((c) => c.rarity === 'rare')
  const cards = [
    ...STARTING_CORE,
    ...shuffle(commons, rng).slice(0, STARTING_EXTRA_COMMONS).map((c) => c.id),
    ...shuffle(rares, rng).slice(0, STARTING_EXTRA_RARES).map((c) => c.id),
  ]
  return { drawPile: shuffle(cards, rng), hand: [], discard: [], shuffles: 0 }
}

export function deckSize(deck: DeckState): number {
  return deck.drawPile.length + deck.hand.length + deck.discard.length
}

export function handSize(state: Pick<GameState, 'upgrades'>): number {
  return hasUpgrade(state, 'repertoire') ? HAND_SIZE + 2 : HAND_SIZE
}

/**
 * Zieht Karten vom Nachziehstapel. Ist er leer, wird der Ablagestapel nach Seed neu gemischt.
 * Liegen insgesamt weniger Karten vor, wird entsprechend weniger gezogen.
 */
export function drawCards(deck: DeckState, count: number, seed: string): DeckState {
  let { drawPile, discard, shuffles } = deck
  const hand = [...deck.hand]
  while (hand.length < count) {
    if (drawPile.length === 0) {
      if (discard.length === 0) break
      drawPile = shuffle(discard, rngFor(seed, 'mischen', shuffles))
      discard = []
      shuffles++
    }
    hand.push(drawPile[0])
    drawPile = drawPile.slice(1)
  }
  return { drawPile, hand, discard, shuffles }
}

/** Legt die ganze Hand (gespielte und ungespielte Karten) auf den Ablagestapel. */
export function discardHand(deck: DeckState): DeckState {
  return { ...deck, hand: [], discard: [...deck.discard, ...deck.hand] }
}

/**
 * Zieht die Hand für die Durchsage und stellt sicher, dass mindestens eine Karte nicht schadet.
 * Fehlt eine solche Karte, wird die letzte Handkarte gegen die erste harmlose Karte aus
 * Nachzieh- oder Ablagestapel getauscht. Universelle Karten sind nie schädlich und liegen immer
 * im Deck, daher gibt es diese Karte stets.
 */
export function drawHand(state: GameState, incident: Incident): DeckState {
  const deck = drawCards(state.deck, handSize(state), state.seed)
  const harmless = (id: string) => evaluateExcuse(state, id, incident).satisfaction >= 0
  if (deck.hand.length === 0 || deck.hand.some(harmless)) return deck
  const fromDraw = deck.drawPile.findIndex(harmless)
  const fromDiscard = deck.discard.findIndex(harmless)
  const last = deck.hand[deck.hand.length - 1]
  if (fromDraw >= 0) {
    const drawPile = [...deck.drawPile]
    const [replacement] = drawPile.splice(fromDraw, 1, last)
    return { ...deck, drawPile, hand: [...deck.hand.slice(0, -1), replacement] }
  }
  if (fromDiscard >= 0) {
    const discard = [...deck.discard]
    const [replacement] = discard.splice(fromDiscard, 1, last)
    return { ...deck, discard, hand: [...deck.hand.slice(0, -1), replacement] }
  }
  return deck
}

/** Fügt eine Karte dem Ablagestapel hinzu; sie kommt beim nächsten Mischen ins Spiel. */
export function addCard(deck: DeckState, cardId: string): DeckState {
  return { ...deck, discard: [...deck.discard, cardId] }
}

/** Seltene (3×) oder epische (1×) Karte für die Pressemappe. */
export function rewardCard(seed: string, index: number): string {
  const pool = EXCUSES.flatMap((c) => (c.rarity === 'rare' ? [c, c, c] : c.rarity === 'epic' ? [c] : []))
  return pool[Math.floor(rollFor(seed, 'pressemappe', index) * pool.length)].id
}

// ── Glaubwürdigkeit ──────────────────────────────────────────────────────────────────

/** Themenbereiche, zu denen eine Karte passt, inklusive Synergien. */
export function cardCategories(state: Pick<GameState, 'upgrades'>, card: ExcuseCard): Category[] | 'all' {
  if (card.categories === 'all') return 'all'
  if (card.id === 'hoehere-gewalt' && hasSynergy(state, 'andere-gewalt')) {
    return [...card.categories, 'betrieb', 'sicherheit']
  }
  return card.categories
}

export function plausibilityOf(categories: Category[] | 'all', incident: Incident): Plausibility {
  if (categories === 'all') return 'neutral'
  if (categories.includes(incident.categories[0])) return 'perfekt'
  if (incident.categories.some((c) => categories.includes(c))) return 'plausibel'
  return 'unglaubwuerdig'
}

/** Wie stark die Glaubwürdigkeit Ausreden verstärkt: 50 → ×1, 100 → ×1,5, 0 → ×0,5. */
export function credibilityFactor(credibility: number): number {
  return 0.5 + credibility / 100
}

export interface ExcuseEvaluation {
  plausibility: Plausibility
  satisfaction: number
  credibility: number
  condition: number
  /** Problem, das ein Ereignis früher abklingt. */
  eases?: StatusId
  /** Problem, das sofort behoben wird. */
  cures?: StatusId
  uses: number
  /** Restwirkung nach Abnutzung (1 = unverbraucht). */
  repetition: number
  notes: string[]
}

const pct = (factor: number) => `×${factor.toFixed(2).replace(/0$/, '').replace('.', ',')}`

/** Berechnet die Wirkung einer Ausrede für den aktuellen Vorfall, ohne den Zustand zu ändern. */
export function evaluateExcuse(state: GameState, cardId: string, incident: Incident): ExcuseEvaluation {
  const card = getExcuse(cardId)
  if (!card) throw new Error(`Unbekannte Ausrede ${cardId}`)
  const plausibility = plausibilityOf(cardCategories(state, card), incident)
  const uses = state.cardUses[cardId] ?? 0
  const decay = cardId === 'betriebsablauf' && hasSynergy(state, 'sprecher-betriebsablauf') ? 0 : card.decay
  const repetition = Math.max(0.2, 1 - decay * uses)
  const notes: string[] = []
  const sprecher = hasUpgrade(state, 'pressesprecher')

  if (plausibility === 'unglaubwuerdig') {
    const severity = card.mismatchPenalty ?? 1
    let satisfaction = -MISMATCH_SATISFACTION * severity
    let credibility = CREDIBILITY_GAIN.unglaubwuerdig * severity
    notes.push('Passt nicht zum Vorfall – niemand glaubt das.')
    if (severity > 1) notes.push('Je größer die Ausrede, desto peinlicher der Fehlgriff.')
    if (sprecher) {
      satisfaction = Math.round(satisfaction / 2)
      credibility = Math.round(credibility / 2)
      notes.push('PÜNKT-Pressesprecher: Strafe halbiert.')
    }
    return { plausibility, satisfaction, credibility, condition: 0, uses, repetition, notes }
  }

  let value = card.power * EXCUSE_STRENGTH
  if (cardId === 'verstaendnis' && hasSynergy(state, 'profi-verstaendnis')) {
    value *= 2
    notes.push('Synergie „Routinierte Demut“ ×2')
  }
  const match = MATCH_MULTIPLIER[plausibility]
  if (plausibility === 'perfekt') notes.push(`Passt perfekt zum Vorfall ${pct(match)}`)
  if (plausibility === 'plausibel') notes.push('Passt zum Vorfall')
  if (plausibility === 'neutral') notes.push('Allzweck-Ausrede: passt immer, aber nie richtig')
  value *= match
  if (card.bonus) {
    const active =
      (card.bonus.status && state.statuses.some((s) => s.id === card.bonus!.status)) ||
      (card.bonus.category && incident.categories.includes(card.bonus.category))
    if (active) {
      value *= card.bonus.multiplier
      notes.push(`${card.bonus.label} ${pct(card.bonus.multiplier)}`)
    }
  }
  const profi = upgradeStacks(state, 'durchsage-profi')
  if (profi > 0) {
    value *= 1 + 0.25 * profi
    notes.push(`Durchsage-Profi ${pct(1 + 0.25 * profi)}`)
  }
  if (card.external && hasUpgrade(state, 'schuld-andere')) {
    value *= 1.6
    notes.push('Schuld sind die anderen ×1,6')
  }
  const cred = credibilityFactor(state.credibility)
  value *= cred
  if (cred !== 1) notes.push(`Glaubwürdigkeit ${state.credibility} ${pct(cred)}`)
  if (repetition < 1) {
    value *= repetition
    notes.push(`Schon ${uses}× benutzt ${pct(repetition)}`)
  } else if (uses > 0 && decay === 0 && card.decay > 0) {
    notes.push('Synergie „Sprachregelung“: keine Abnutzung')
  }
  let satisfaction = Math.max(1, Math.round(value))
  if (plausibility === 'neutral' && sprecher) {
    satisfaction += 2
    notes.push('PÜNKT-Pressesprecher: Allzweck-Ausreden sitzen +2')
  }

  let credibility = CREDIBILITY_GAIN[plausibility]
  if (credibility > 0 && hasUpgrade(state, 'seriose-stimme')) credibility = Math.round(credibility * 1.5)
  // Dieselbe Ausrede immer wieder: Die Fahrgäste merken es.
  if (uses >= 2) credibility -= 2 * (uses - 1)
  if (cardId === 'behoerdlich' && hasSynergy(state, 'stimme-behoerde')) {
    credibility += 10
    notes.push('Synergie „Amtlicher Tonfall“: +10 Glaubwürdigkeit')
  }

  let condition = 0
  if (cardId === 'reparatur' && hasSynergy(state, 'mechaniker-reparatur')) {
    condition = 5
    notes.push('Synergie „Er repariert wirklich“: +5 Zugzustand')
  }

  let eases: StatusId | undefined
  let cures: StatusId | undefined
  if (card.eases && state.statuses.some((s) => s.id === card.eases)) {
    if (cardId === 'aufkommen' && hasSynergy(state, 'schaffner-aufkommen')) {
      cures = card.eases
      notes.push('Synergie „Platz da!“: Überfüllung behoben')
    } else {
      eases = card.eases
    }
  }
  return { plausibility, satisfaction, credibility, condition, eases, cures, uses, repetition, notes }
}

// ── Ansagetexte ──────────────────────────────────────────────────────────────────────

function pick<T>(items: readonly T[], roll: number): T {
  return items[Math.floor(roll * items.length)]
}

function fill(template: string, state: GameState, incident: Incident): string {
  const next = STATIONS[Math.min(state.stationIndex + 1, STATIONS.length - 1)].name
  return template
    .replaceAll('{station}', STATIONS[state.stationIndex].name)
    .replaceAll('{next}', next)
    .replaceAll('{minutes}', String(Math.max(1, state.resources.delay)))
    .replaceAll('{incident}', incident.title)
}

/** Baut die Durchsage aus Anrede, Kartentext und Schluss; dazu die Reaktion im Zug. */
export function buildAnnouncement(
  state: GameState,
  card: ExcuseCard,
  incident: Incident,
  evaluation: ExcuseEvaluation,
): { text: string; reaction?: string } {
  const roll = (part: string) => rollFor(state.seed, `durchsage-${part}`, state.eventIndex)
  const text = [pick(OPENINGS, roll('anrede')), pick(card.templates, roll('text')), pick(CLOSINGS, roll('schluss'))]
    .map((part) => fill(part, state, incident))
    .join(' ')
  let reaction: string | undefined
  if (evaluation.plausibility === 'unglaubwuerdig') reaction = pick(IMPLAUSIBLE_REACTIONS, roll('reaktion'))
  else if (evaluation.uses >= 2) reaction = pick(REPEAT_REACTIONS, roll('reaktion'))
  else if (evaluation.plausibility === 'perfekt') reaction = pick(PERFECT_REACTIONS, roll('reaktion'))
  return { text, reaction }
}
