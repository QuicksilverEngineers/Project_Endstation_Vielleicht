import { describe, expect, it } from 'vitest'
import {
  addCard,
  createStartingDeck,
  credibilityFactor,
  deckSize,
  discardHand,
  drawCards,
  drawHand,
  evaluateExcuse,
  HAND_SIZE,
  plausibilityOf,
  rewardCard,
} from './announcements'
import { DELAY_LIMIT, TIMETABLE_RESERVE } from './constants'
import {
  arrivalEffects,
  chooseOption,
  chooseUpgrade,
  continueJourney,
  createRun,
  ERSATZBUS_DELAY,
  followUpChance,
  getCurrentIncident,
  playExcuse,
  riskChance,
  rollUpgradeOffer,
  statusDuration,
  statusTick,
  UPGRADE_OFFER_SIZE,
} from './engine'
import { EXCUSES, getExcuse, STARTING_CORE } from './excuses'
import { FOLLOW_UPS, getIncident, INCIDENTS } from './incidents'
import { createRng } from './rng'
import { STATIONS } from './stations'
import { STATUS_DEFINITIONS } from './statuses'
import { bestCard, finishEvent, firstUpgrade, playRun } from './testUtils'
import type { Category, GameState, UpgradeId } from './types'
import { availableUpgrades, SYNERGIES, UPGRADE_IDS, UPGRADES } from './upgrades'

const CATEGORIES: Category[] = ['technik', 'fahrgaeste', 'infrastruktur', 'wetter', 'personal', 'sicherheit', 'betrieb']
const ALL_INCIDENTS = [...INCIDENTS, ...FOLLOW_UPS]
const incident = (id: string) => getIncident(id)!

function withIncident(state: GameState, incidentId: string): GameState {
  return { ...state, events: state.events.map((e, i) => (i === state.eventIndex ? { ...e, incidentId } : e)) }
}

function withUpgrades(state: GameState, ...ids: UpgradeId[]): GameState {
  const upgrades = [...state.upgrades]
  for (const id of ids) {
    const owned = upgrades.find((u) => u.id === id)
    if (owned) owned.stacks++
    else upgrades.push({ id, stacks: 1 })
  }
  return { ...state, upgrades }
}

/** Zustand in der Durchsage-Phase mit genau dieser Hand. */
function announcing(incidentId: string, hand: string[], base = createRun('1')): GameState {
  const state = withIncident(base, incidentId)
  const result = chooseOption(state, getCurrentIncident(state).choices[0].id)
  return { ...result, phase: 'announcement', deck: { ...result.deck, hand } }
}

/** Zustand in der Ergebnisphase des regulären Vorfalls von Station 0 mit gesunden Werten. */
function afterFirstChoice(seed = '1'): GameState {
  const state = withIncident(createRun(seed), 'ueberholung')
  return chooseOption(state, 'warten')
}

describe('Daten: Ausreden, Kategorien und Verbesserungen', () => {
  it('hat mindestens 15 Ausreden mit eindeutigen IDs, gültigen Kategorien und Ansagen', () => {
    expect(EXCUSES.length).toBeGreaterThanOrEqual(15)
    expect(new Set(EXCUSES.map((c) => c.id)).size).toBe(EXCUSES.length)
    for (const card of EXCUSES) {
      expect(card.templates.length, card.id).toBeGreaterThanOrEqual(2)
      if (card.categories !== 'all') expect(card.categories.every((c) => CATEGORIES.includes(c)), card.id).toBe(true)
      expect(card.power).toBeGreaterThan(0)
      expect(card.decay).toBeGreaterThanOrEqual(0)
    }
    for (const rarity of ['common', 'rare', 'epic'] as const) expect(EXCUSES.some((c) => c.rarity === rarity)).toBe(true)
  })

  it('jeder Vorfall gehört zu mindestens einer Kategorie, und jede Kategorie wird benutzt', () => {
    for (const i of ALL_INCIDENTS) {
      expect(i.categories.length, i.id).toBeGreaterThanOrEqual(1)
      expect(i.categories.every((c) => CATEGORIES.includes(c)), i.id).toBe(true)
    }
    for (const c of CATEGORIES) {
      expect(ALL_INCIDENTS.some((i) => i.categories.includes(c)), c).toBe(true)
      expect(EXCUSES.some((card) => card.categories !== 'all' && card.categories.includes(c)), c).toBe(true)
    }
  })

  it('jeder Vorfall hat im Kartenpool mindestens eine passende Ausrede', () => {
    for (const i of ALL_INCIDENTS) {
      expect(EXCUSES.some((card) => card.categories !== 'all' && plausibilityOf(card.categories, i) !== 'unglaubwuerdig'), i.id).toBe(true)
    }
  })

  it('hat mindestens 15 Verbesserungen, einzigartige und stapelbare', () => {
    expect(UPGRADE_IDS.length).toBeGreaterThanOrEqual(15)
    expect(UPGRADE_IDS.some((id) => UPGRADES[id].maxStacks === 1)).toBe(true)
    expect(UPGRADE_IDS.some((id) => UPGRADES[id].maxStacks > 1)).toBe(true)
  })

  it('Synergien verweisen auf echte Verbesserungen und Karten', () => {
    expect(SYNERGIES.length).toBeGreaterThanOrEqual(5)
    for (const s of SYNERGIES) {
      expect(UPGRADE_IDS).toContain(s.upgrade)
      if (s.card) expect(getExcuse(s.card), s.id).toBeDefined()
    }
    // Synergien verteilen sich auf mehrere Verbesserungen, damit verschiedene Builds entstehen.
    expect(new Set(SYNERGIES.map((s) => s.upgrade)).size).toBeGreaterThanOrEqual(5)
  })
})

describe('Deck', () => {
  it('Startdeck: feste Grundausstattung plus Karten nach Seed, deterministisch', () => {
    const deck = createStartingDeck('7')
    expect(deck).toEqual(createStartingDeck('7'))
    expect(deck.hand).toEqual([])
    expect(deck.discard).toEqual([])
    expect(deckSize(deck)).toBe(10)
    for (const id of new Set(STARTING_CORE)) {
      expect(deck.drawPile.filter((c) => c === id).length).toBe(STARTING_CORE.filter((c) => c === id).length)
    }
    expect(deck.drawPile.filter((id) => getExcuse(id)!.rarity === 'rare')).toHaveLength(1)
    expect(deck.drawPile.some((id) => getExcuse(id)!.rarity === 'epic')).toBe(false)
    const decks = new Set(['1', '2', '3', '4', '5', '6'].map((s) => createStartingDeck(s).drawPile.join()))
    expect(decks.size).toBeGreaterThan(1)
  })

  it('zieht Karten vom Nachziehstapel', () => {
    const deck = { drawPile: ['a', 'b', 'c', 'd'], hand: [], discard: [], shuffles: 0 }
    expect(drawCards(deck, 3, 's')).toEqual({ drawPile: ['d'], hand: ['a', 'b', 'c'], discard: [], shuffles: 0 })
  })

  it('mischt den Ablagestapel neu, wenn der Nachziehstapel leer ist', () => {
    const deck = { drawPile: ['a'], hand: [], discard: ['b', 'c', 'd', 'e'], shuffles: 2 }
    const drawn = drawCards(deck, 3, 's')
    expect(drawn.hand[0]).toBe('a')
    expect(drawn.hand).toHaveLength(3)
    expect(drawn.discard).toEqual([])
    expect(drawn.shuffles).toBe(3)
    expect([...drawn.hand, ...drawn.drawPile].sort()).toEqual(['a', 'b', 'c', 'd', 'e'])
    // Deterministisch nach Seed und Mischzähler
    expect(drawCards(deck, 3, 's')).toEqual(drawn)
    expect(drawCards({ ...deck, shuffles: 5 }, 3, 's').hand).toHaveLength(3)
  })

  it('zieht weniger, wenn insgesamt nicht genug Karten da sind', () => {
    const deck = { drawPile: ['a'], hand: [], discard: ['b'], shuffles: 0 }
    expect(drawCards(deck, 3, 's').hand.sort()).toEqual(['a', 'b'])
  })

  it('legt die ganze Hand ab und fügt neue Karten dem Ablagestapel hinzu', () => {
    const deck = { drawPile: ['a'], hand: ['b', 'c'], discard: ['d'], shuffles: 0 }
    expect(discardHand(deck)).toEqual({ drawPile: ['a'], hand: [], discard: ['d', 'b', 'c'], shuffles: 0 })
    expect(addCard(deck, 'x').discard).toEqual(['d', 'x'])
  })

  it('verliert über eine ganze Fahrt keine Karten', () => {
    for (let seed = 0; seed < 50; seed++) {
      let state = createRun(String(seed))
      const start = deckSize(state.deck)
      let added = 0
      while (state.phase !== 'victory' && state.phase !== 'gameover') {
        if (state.phase === 'incident') state = chooseOption(state, getCurrentIncident(state).choices[seed % 3].id)
        else if (state.phase === 'upgrade') {
          const pick = state.upgradeOffer[0]
          if (pick === 'pressemappe') added += 2
          state = chooseUpgrade(state, pick)
        } else if (state.phase === 'announcement') state = playExcuse(state, state.deck.hand[0])
        else state = continueJourney(state)
        expect(deckSize(state.deck)).toBe(start + added)
      }
    }
  })

  it('zieht in der Durchsage-Phase drei Karten (mit Großem Repertoire fünf)', () => {
    const result = afterFirstChoice()
    expect(continueJourney(result).deck.hand).toHaveLength(HAND_SIZE)
    expect(continueJourney(withUpgrades(result, 'repertoire')).deck.hand).toHaveLength(HAND_SIZE + 2)
  })

  it('bietet immer mindestens eine Ausrede, die nicht schadet', () => {
    // Drei unpassende Karten oben auf dem Stapel, die Allzweck-Ausrede weiter unten.
    const base = withIncident(createRun('1'), 'tuerstoerung')
    const state = { ...base, deck: { drawPile: ['hoehere-gewalt', 'behoerdlich', 'tiere', 'bauarbeiten', 'betriebsablauf'], hand: [], discard: [], shuffles: 0 } }
    const deck = drawHand(state, incident('tuerstoerung'))
    expect(deck.hand).toHaveLength(3)
    expect(deck.hand).toContain('betriebsablauf')
    expect(deckSize(deck)).toBe(5)
    expect(deck.hand.some((id) => evaluateExcuse(state, id, incident('tuerstoerung')).satisfaction >= 0)).toBe(true)

    for (let seed = 0; seed < 300; seed++) {
      let s = createRun(String(seed))
      while (s.phase !== 'victory' && s.phase !== 'gameover') {
        if (s.phase === 'announcement') {
          const i = getCurrentIncident(s)
          expect(s.deck.hand.some((id) => evaluateExcuse(s, id, i).satisfaction >= 0), `Seed ${seed}`).toBe(true)
          s = playExcuse(s, s.deck.hand[s.deck.hand.length - 1])
        } else if (s.phase === 'incident') s = chooseOption(s, getCurrentIncident(s).choices[seed % 3].id)
        else s = finishEvent(s, (x) => x.deck.hand[0])
        if (s.phase === 'announcement' || s.phase === 'incident') continue
      }
    }
  })
})

describe('Glaubwürdigkeit und Passung', () => {
  it('ordnet Ausreden dem Vorfall zu', () => {
    const tuer = incident('tuerstoerung') // Technik
    const notbremse = incident('notbremse') // Fahrgäste, Technik, Sicherheit
    expect(plausibilityOf(['technik'], tuer)).toBe('perfekt')
    expect(plausibilityOf(['technik'], notbremse)).toBe('plausibel')
    expect(plausibilityOf(['fahrgaeste'], notbremse)).toBe('perfekt')
    expect(plausibilityOf(['wetter'], tuer)).toBe('unglaubwuerdig')
    expect(plausibilityOf('all', tuer)).toBe('neutral')
  })

  it('passende Ausreden wirken stärker als Allzweck-Ausreden, unpassende schaden', () => {
    const state = announcing('tuerstoerung', [])
    const i = incident('tuerstoerung')
    const perfect = evaluateExcuse(state, 'reparatur', i)
    const neutral = evaluateExcuse(state, 'betriebsablauf', i)
    const wrong = evaluateExcuse(state, 'bauarbeiten', i)
    expect(perfect.plausibility).toBe('perfekt')
    expect(perfect.satisfaction).toBeGreaterThan(neutral.satisfaction)
    expect(perfect.credibility).toBeGreaterThan(0)
    expect(neutral.credibility).toBe(0)
    expect(wrong.plausibility).toBe('unglaubwuerdig')
    expect(wrong.satisfaction).toBeLessThan(0)
    expect(wrong.credibility).toBeLessThan(0)
  })

  it('perfekt schlägt plausibel bei gleicher Karte', () => {
    const state = announcing('tuerstoerung', [])
    const perfect = evaluateExcuse(state, 'technische-stoerung', incident('tuerstoerung'))
    const plausible = evaluateExcuse(state, 'technische-stoerung', incident('notbremse'))
    expect(plausible.plausibility).toBe('plausibel')
    expect(perfect.satisfaction).toBeGreaterThan(plausible.satisfaction)
  })

  it('Höhere Gewalt: stark bei Wetter, besonders peinlich, wenn es nicht passt', () => {
    const state = announcing('unwetter', [])
    const weather = evaluateExcuse(state, 'hoehere-gewalt', incident('unwetter'))
    const misuse = evaluateExcuse(state, 'hoehere-gewalt', incident('tuerstoerung'))
    const normalMisuse = evaluateExcuse(state, 'bauarbeiten', incident('tuerstoerung'))
    expect(weather.satisfaction).toBeGreaterThan(evaluateExcuse(state, 'witterung', incident('unwetter')).satisfaction)
    expect(misuse.satisfaction).toBeLessThan(normalMisuse.satisfaction)
    expect(misuse.credibility).toBeLessThan(normalMisuse.credibility)
  })

  it('Kartenbonus bei passendem Problem: Technische Störung bei technischem Mangel', () => {
    const base = announcing('wlan', [])
    const withDamage = { ...base, statuses: [{ id: 'technikschaden' as const, remaining: 2, depth: 0 }] }
    expect(evaluateExcuse(withDamage, 'technische-stoerung', incident('wlan')).satisfaction).toBeGreaterThan(
      evaluateExcuse(base, 'technische-stoerung', incident('wlan')).satisfaction,
    )
  })

  it('Glaubwürdigkeit verstärkt oder schwächt die Wirkung', () => {
    expect(credibilityFactor(50)).toBe(1)
    expect(credibilityFactor(100)).toBe(1.5)
    expect(credibilityFactor(0)).toBe(0.5)
    const base = announcing('tuerstoerung', [])
    const low = evaluateExcuse({ ...base, credibility: 10 }, 'reparatur', incident('tuerstoerung'))
    const high = evaluateExcuse({ ...base, credibility: 90 }, 'reparatur', incident('tuerstoerung'))
    expect(high.satisfaction).toBeGreaterThan(low.satisfaction)
  })

  it('wendet die Wirkung beim Ausspielen an', () => {
    const state = announcing('tuerstoerung', ['reparatur', 'bauarbeiten', 'betriebsablauf'])
    const evaluation = evaluateExcuse(state, 'reparatur', incident('tuerstoerung'))
    const after = playExcuse(state, 'reparatur')
    expect(after.phase).toBe('announced')
    expect(after.resources.satisfaction).toBe(Math.min(100, state.resources.satisfaction + evaluation.satisfaction))
    expect(after.credibility).toBe(state.credibility + evaluation.credibility)
    expect(after.cardUses).toEqual({ reparatur: 1 })
    expect(after.deck.hand).toEqual([])
    expect(after.deck.discard.slice(-3)).toEqual(['reparatur', 'bauarbeiten', 'betriebsablauf'])
    expect(after.announcements.at(-1)).toMatchObject({ cardId: 'reparatur', plausibility: 'perfekt', eventIndex: state.eventIndex })
  })

  it('passende Ausreden lassen ein Problem schneller abklingen', () => {
    const base = announcing('tuerstoerung', ['reparatur'])
    const state = { ...base, statuses: [{ id: 'technikschaden' as const, remaining: 2, depth: 0 }] }
    expect(playExcuse(state, 'reparatur').statuses).toEqual([{ id: 'technikschaden', remaining: 1, depth: 0 }])
    const almostGone = { ...state, statuses: [{ id: 'technikschaden' as const, remaining: 1, depth: 0 }] }
    const after = playExcuse(almostGone, 'reparatur')
    expect(after.statuses).toEqual([])
    expect(after.announcements.at(-1)!.eased).toBe('technikschaden')
  })

  it('Glaubwürdigkeit bleibt zwischen 0 und 100', () => {
    const low = { ...announcing('tuerstoerung', ['hoehere-gewalt']), credibility: 5 }
    expect(playExcuse(low, 'hoehere-gewalt').credibility).toBe(0)
    const high = { ...announcing('tuerstoerung', ['reparatur']), credibility: 98 }
    expect(playExcuse(high, 'reparatur').credibility).toBe(100)
  })
})

describe('Wiederholung', () => {
  it('jede Wiederholung schwächt die Ausrede für den Rest der Fahrt', () => {
    const base = announcing('tuerstoerung', [])
    const i = incident('tuerstoerung')
    const values = [0, 1, 2, 3].map((uses) => evaluateExcuse({ ...base, cardUses: { reparatur: uses } }, 'reparatur', i).satisfaction)
    expect(values[1]).toBeLessThan(values[0])
    expect(values[2]).toBeLessThan(values[1])
    expect(values[3]).toBeLessThanOrEqual(values[2])
    expect(values[3]).toBeGreaterThanOrEqual(1)
  })

  it('häufig nutzbare Ausreden nutzen sich kaum ab', () => {
    const base = announcing('ueberholung', [])
    const i = incident('ueberholung')
    const left = (id: string) => evaluateExcuse({ ...base, cardUses: { [id]: 3 } }, id, i).repetition
    expect(left('vorherige-fahrt')).toBeGreaterThan(left('betriebsablauf'))
    expect(left('vorherige-fahrt')).toBeGreaterThanOrEqual(0.8)
  })

  it('dieselbe Ausrede immer wieder kostet Glaubwürdigkeit', () => {
    const base = announcing('ueberholung', [])
    const i = incident('ueberholung')
    expect(evaluateExcuse(base, 'betriebsablauf', i).credibility).toBe(0)
    expect(evaluateExcuse({ ...base, cardUses: { betriebsablauf: 3 } }, 'betriebsablauf', i).credibility).toBeLessThan(0)
  })

  it('zählt die Nutzung über mehrere Durchsagen', () => {
    let state = announcing('ueberholung', ['betriebsablauf'])
    state = playExcuse(state, 'betriebsablauf')
    state = { ...state, phase: 'announcement', deck: { ...state.deck, hand: ['betriebsablauf'] } }
    state = playExcuse(state, 'betriebsablauf')
    expect(state.cardUses.betriebsablauf).toBe(2)
    expect(state.announcements[1].notes.some((n) => n.includes('Schon 1×'))).toBe(true)
  })
})

describe('Ansagetexte', () => {
  it('erzeugt vollständige deutsche Durchsagen ohne offene Platzhalter, deterministisch', () => {
    for (const card of EXCUSES) {
      const state = announcing('tuerstoerung', [card.id])
      const a = playExcuse(state, card.id).announcements.at(-1)!
      const b = playExcuse(state, card.id).announcements.at(-1)!
      expect(a.text).toBe(b.text)
      expect(a.text).not.toMatch(/[{}]/)
      expect(a.text.length).toBeGreaterThan(40)
    }
  })

  it('unglaubwürdige und abgenutzte Ausreden lösen Reaktionen aus', () => {
    const wrong = playExcuse(announcing('tuerstoerung', ['bauarbeiten']), 'bauarbeiten').announcements.at(-1)!
    expect(wrong.reaction).toBeDefined()
    const worn = playExcuse({ ...announcing('ueberholung', ['betriebsablauf']), cardUses: { betriebsablauf: 3 } }, 'betriebsablauf')
    expect(worn.announcements.at(-1)!.reaction).toBeDefined()
  })
})

describe('Verbesserungen: Erwerb', () => {
  function atUpgrade(seed = '1'): GameState {
    const announced = playExcuse(continueJourney(afterFirstChoice(seed)), bestCard(continueJourney(afterFirstChoice(seed))))
    return continueJourney(announced)
  }

  it('bietet bei Ankunft drei verschiedene, nach Seed feste Verbesserungen an', () => {
    const state = atUpgrade()
    expect(state.phase).toBe('upgrade')
    expect(state.upgradeOffer).toHaveLength(UPGRADE_OFFER_SIZE)
    expect(new Set(state.upgradeOffer).size).toBe(UPGRADE_OFFER_SIZE)
    expect(atUpgrade().upgradeOffer).toEqual(state.upgradeOffer)
    const offers = new Set(Array.from({ length: 10 }, (_, s) => atUpgrade(String(s)).upgradeOffer.join()))
    expect(offers.size).toBeGreaterThan(1)
  })

  it('nimmt die gewählte Verbesserung auf und fährt weiter', () => {
    const state = atUpgrade()
    const pick = state.upgradeOffer[0]
    const next = chooseUpgrade(state, pick)
    expect(next.upgrades).toEqual([{ id: pick, stacks: 1 }])
    expect(next.phase).toBe('incident')
    expect(next.stationIndex).toBe(1)
    expect(next.upgradeOffer).toEqual([])
  })

  it('bietet einzigartige Verbesserungen nicht erneut an, stapelbare bis zum Maximum', () => {
    const state = createRun('1')
    expect(availableUpgrades(withUpgrades(state, 'zocker'))).not.toContain('zocker')
    expect(availableUpgrades(withUpgrades(state, 'werkstatt-abo'))).toContain('werkstatt-abo')
    expect(availableUpgrades(withUpgrades(state, 'werkstatt-abo', 'werkstatt-abo', 'werkstatt-abo'))).not.toContain('werkstatt-abo')
    for (let s = 0; s < 50; s++) {
      expect(rollUpgradeOffer(withUpgrades(state, 'zocker', 'notfallplan'), s)).not.toContain('zocker')
    }
  })

  it('stapelt stapelbare Verbesserungen', () => {
    const state = { ...atUpgrade(), upgrades: [{ id: 'bahnbonus' as const, stacks: 1 }], upgradeOffer: ['bahnbonus' as const] }
    expect(chooseUpgrade(state, 'bahnbonus').upgrades).toEqual([{ id: 'bahnbonus', stacks: 2 }])
  })

  it('ignoriert Verbesserungen, die nicht im Angebot sind', () => {
    const state = atUpgrade()
    const other = UPGRADE_IDS.find((id) => !state.upgradeOffer.includes(id))!
    expect(chooseUpgrade(state, other)).toBe(state)
    const fresh = createRun('1')
    expect(chooseUpgrade(fresh, state.upgradeOffer[0])).toBe(fresh)
  })

  it('überspringt die Auswahl, wenn alles schon im Besitz ist', () => {
    const all = UPGRADE_IDS.flatMap((id) => Array.from({ length: UPGRADES[id].maxStacks }, () => id))
    const result = withUpgrades(afterFirstChoice(), ...all)
    const announced = playExcuse(continueJourney(result), continueJourney(result).deck.hand[0])
    expect(continueJourney(announced).phase).toBe('incident')
  })

  it('Pressemappe: zwei seltene oder epische Karten kommen ins Deck', () => {
    const state = { ...atUpgrade(), upgradeOffer: ['pressemappe' as const] }
    const next = chooseUpgrade(state, 'pressemappe')
    expect(deckSize(next.deck)).toBe(deckSize(state.deck) + 2)
    const added = next.deck.discard.slice(-2)
    for (const id of added) expect(['rare', 'epic']).toContain(getExcuse(id)!.rarity)
    expect(next.rewards).toEqual(added)
    expect(rewardCard('1', 1)).toBe(rewardCard('1', 1))
  })

  it('Seriöse Stimme: sofort mehr Glaubwürdigkeit', () => {
    const state = { ...atUpgrade(), upgradeOffer: ['seriose-stimme' as const] }
    expect(chooseUpgrade(state, 'seriose-stimme').credibility).toBe(state.credibility + 20)
  })
})

describe('Verbesserungen: Wirkung', () => {
  const run = createRun('1')

  it('Durchsage-Profi und Schuld sind die anderen verstärken Ausreden', () => {
    const base = announcing('stellwerk', [])
    const i = incident('stellwerk')
    const plain = evaluateExcuse(base, 'stellwerk', i).satisfaction
    expect(evaluateExcuse(withUpgrades(base, 'durchsage-profi'), 'stellwerk', i).satisfaction).toBeGreaterThan(plain)
    expect(evaluateExcuse(withUpgrades(base, 'durchsage-profi', 'durchsage-profi'), 'stellwerk', i).satisfaction).toBeGreaterThan(
      evaluateExcuse(withUpgrades(base, 'durchsage-profi'), 'stellwerk', i).satisfaction,
    )
    expect(evaluateExcuse(withUpgrades(base, 'schuld-andere'), 'stellwerk', i).satisfaction).toBeGreaterThan(plain)
    // Keine äußere Ursache: kein Bonus
    expect(evaluateExcuse(withUpgrades(base, 'schuld-andere'), 'personal', i).satisfaction).toBe(evaluateExcuse(base, 'personal', i).satisfaction)
  })

  it('PÜNKT-Pressesprecher halbiert die Strafe für unpassende Ausreden', () => {
    const base = announcing('tuerstoerung', [])
    const plain = evaluateExcuse(base, 'hoehere-gewalt', incident('tuerstoerung'))
    const press = evaluateExcuse(withUpgrades(base, 'pressesprecher'), 'hoehere-gewalt', incident('tuerstoerung'))
    expect(press.satisfaction).toBe(Math.round(plain.satisfaction / 2))
    expect(press.credibility).toBe(Math.round(plain.credibility / 2))
  })

  it('Zocker-Lokführer senkt das Risiko', () => {
    const i = incident('wlan')
    const choice = i.choices.find((c) => c.kind === 'risky')!
    expect(riskChance(withUpgrades(run, 'zocker'), i, choice)).toBeCloseTo(riskChance(run, i, choice) - 0.1)
  })

  it('Legendärer Schaffner: weniger Zufriedenheitsverlust bei Fahrgast-Vorfällen', () => {
    const state = withIncident(run, 'reservierung')
    const loss = (s: GameState) => s.resources.satisfaction - chooseOption(s, 'aufheben').resources.satisfaction
    expect(loss(withUpgrades(state, 'legendaerer-schaffner'))).toBeLessThan(loss(state))
    // Kein Fahrgast-Vorfall: keine Wirkung
    const other = withIncident(run, 'wlan')
    const otherLoss = (s: GameState) => s.resources.satisfaction - chooseOption(s, 'router').resources.satisfaction
    expect(otherLoss(withUpgrades(other, 'legendaerer-schaffner'))).toBe(otherLoss(other))
  })

  it('Dickes Fell und Frühwarnsystem schwächen laufende Probleme', () => {
    expect(statusTick(withUpgrades(run, 'dickes-fell'), 'hitze')).toEqual({ satisfaction: -2 })
    expect(statusTick(withUpgrades(run, 'dickes-fell'), 'ueberfuellung')).toEqual({ delay: 0, satisfaction: -1 })
    expect(statusDuration(withUpgrades(run, 'fruehwarnung'), 'hitze')).toBe(STATUS_DEFINITIONS.hitze.duration - 1)
    const state = withUpgrades(withIncident(run, 'klimaanlage'), 'fruehwarnung')
    expect(chooseOption(state, 'ignorieren').statuses[0].remaining).toBe(STATUS_DEFINITIONS.hitze.duration - 1)
  })

  it('Notfallplan halbiert die Wahrscheinlichkeit von Folgeereignissen', () => {
    const i = FOLLOW_UPS[0]
    expect(followUpChance(withUpgrades(run, 'notfallplan'), i)).toBe(i.trigger!.chance / 2)
  })

  it('Großzügiger Fahrplan: mehr Fahrzeitreserve', () => {
    const state = { ...withIncident(run, 'wlan'), resources: { delay: 10, satisfaction: 70, condition: 70 } }
    const reserve = (s: GameState) => chooseOption(s, 'router').history[0].changes.find((c) => c.source === 'reserve')!.delta.delay
    expect(reserve(state)).toBe(-TIMETABLE_RESERVE)
    expect(reserve(withUpgrades(state, 'fahrplan-puffer'))).toBe(-TIMETABLE_RESERVE - 1)
  })

  it('Ersatzbus-Garantie rettet genau einmal vor dem Verspätungslimit', () => {
    const munich = { ...run, eventIndex: 7, stationIndex: 7, resources: { delay: 29, satisfaction: 70, condition: 70 } }
    const state = withUpgrades(withIncident(munich, 'oberleitung'), 'ersatzbus')
    const saved = chooseOption(state, 'raeumen')
    expect(saved.resources.delay).toBe(ERSATZBUS_DELAY)
    expect(saved.failures).toEqual([])
    expect(saved.ersatzbusUsed).toBe(true)
    expect(saved.history[0].changes.some((c) => c.source === 'ersatzbus')).toBe(true)
    const again = chooseOption({ ...state, ersatzbusUsed: true }, 'raeumen')
    expect(again.resources.delay).toBeGreaterThanOrEqual(DELAY_LIMIT)
    expect(chooseOption(withIncident(munich, 'oberleitung'), 'raeumen').failures).toContain('delay')
  })

  it('Bordbistro-Flatrate: Freigetränke bei größeren Verspätungen', () => {
    const state = withUpgrades(withIncident(run, 'kuehe'), 'bistro-flatrate')
    expect(chooseOption(state, 'bauer').history[0].changes.some((c) => c.source === 'bistro')).toBe(true)
    expect(chooseOption(state, 'schieben').history[0].changes.some((c) => c.source === 'bistro')).toBe(false)
  })

  it('Werkstatt-Abo, PÜNKTchen-Treuepunkte und Wunder-Mechaniker wirken bei der Ankunft', () => {
    const state = withUpgrades(run, 'werkstatt-abo', 'werkstatt-abo', 'bahnbonus')
    const arrival = arrivalEffects(state, 1)
    expect(arrival.changes).toEqual([
      { source: 'werkstatt-abo', delta: { delay: 0, satisfaction: 0, condition: 4 } },
      { source: 'bahnbonus', delta: { delay: 0, satisfaction: 2, condition: 0 } },
    ])
    // Wunder-Mechaniker: zufällig nach Seed, etwa in 35 % der Ankünfte
    const across = Array.from({ length: 200 }, (_, s) =>
      arrivalEffects(withUpgrades(createRun(String(s)), 'wunder-mechaniker'), 1 + (s % (STATIONS.length - 1))).changes.length,
    ).reduce((a, b) => a + b, 0)
    expect(across / 200).toBeGreaterThan(0.25)
    expect(across / 200).toBeLessThan(0.45)
  })

  it('Ankunftsboni werden beim Weiterfahren angewendet', () => {
    const result = withUpgrades({ ...afterFirstChoice(), resources: { delay: 0, satisfaction: 50, condition: 50 } }, 'werkstatt-abo')
    const announcement = continueJourney(result)
    const announced = playExcuse(announcement, announcement.deck.hand[0])
    const arrived = continueJourney(announced)
    expect(arrived.resources.condition).toBe(announced.resources.condition + 2)
    expect(arrived.arrivals.at(-1)!.stationIndex).toBe(1)
  })
})

describe('Synergien', () => {
  it('Durchsage-Profi + „Wir bitten um Verständnis“: deutlich stärker', () => {
    const base = announcing('ueberholung', [])
    const i = incident('ueberholung')
    const profi = withUpgrades(base, 'durchsage-profi')
    // Ohne Synergie würde der Profi nur ×1,25 bringen; mit Synergie mehr als das Doppelte.
    expect(evaluateExcuse(profi, 'verstaendnis', i).satisfaction).toBeGreaterThanOrEqual(2 * evaluateExcuse(base, 'verstaendnis', i).satisfaction)
    expect(evaluateExcuse(profi, 'verstaendnis', i).notes.some((n) => n.includes('Routinierte Demut'))).toBe(true)
  })

  it('PÜNKT-Pressesprecher + „Verzögerungen im Betriebsablauf“: keine Abnutzung', () => {
    const base = { ...announcing('ueberholung', []), cardUses: { betriebsablauf: 3, verstaendnis: 3 } }
    const i = incident('ueberholung')
    const press = withUpgrades(base, 'pressesprecher')
    expect(evaluateExcuse(press, 'betriebsablauf', i).repetition).toBe(1)
    expect(evaluateExcuse(press, 'verstaendnis', i).repetition).toBeLessThan(1)
  })

  it('Wunder-Mechaniker + Technik-Vorfälle: bessere Reparaturen, weniger Risiko', () => {
    const run = createRun('1')
    const door = withIncident(run, 'tuerstoerung') // Technik
    const mech = (s: GameState) => withUpgrades(s, 'wunder-mechaniker')
    const gain = (s: GameState) => chooseOption(s, 'reparieren').resources.condition - s.resources.condition
    expect(gain(mech({ ...door, resources: { delay: 0, satisfaction: 70, condition: 50 } }))).toBeGreaterThan(
      gain({ ...door, resources: { delay: 0, satisfaction: 70, condition: 50 } }),
    )
    const risky = incident('tuerstoerung').choices.find((c) => c.kind === 'risky')!
    expect(riskChance(mech(door), incident('tuerstoerung'), risky)).toBeLessThan(riskChance(door, incident('tuerstoerung'), risky))
    // Kein Technik-Vorfall: keine Wirkung
    const freight = incident('ueberholung')
    const freightRisky = freight.choices.find((c) => c.kind === 'risky')!
    expect(riskChance(mech(run), freight, freightRisky)).toBe(riskChance(run, freight, freightRisky))
  })

  it('Wunder-Mechaniker + „Reparatur am Zug“: zusätzlich Zugzustand', () => {
    const state = withUpgrades({ ...announcing('tuerstoerung', ['reparatur']), resources: { delay: 0, satisfaction: 50, condition: 50 } }, 'wunder-mechaniker')
    expect(playExcuse(state, 'reparatur').resources.condition).toBe(55)
  })

  it('Schuld sind die anderen + Höhere Gewalt: passt auch zu Betrieb und Sicherheit', () => {
    const base = announcing('ueberholung', [])
    expect(evaluateExcuse(base, 'hoehere-gewalt', incident('ueberholung')).plausibility).toBe('unglaubwuerdig')
    expect(evaluateExcuse(withUpgrades(base, 'schuld-andere'), 'hoehere-gewalt', incident('ueberholung')).plausibility).toBe('perfekt')
  })

  it('Legendärer Schaffner + „Hohes Fahrgastaufkommen“: Überfüllung sofort behoben', () => {
    const base = { ...announcing('ueberfuellt', ['aufkommen']), statuses: [{ id: 'ueberfuellung' as const, remaining: 3, depth: 0 }] }
    expect(playExcuse(base, 'aufkommen').statuses).toEqual([{ id: 'ueberfuellung', remaining: 2, depth: 0 }])
    expect(playExcuse(withUpgrades(base, 'legendaerer-schaffner'), 'aufkommen').statuses).toEqual([])
  })

  it('Seriöse Stimme + Behördliche Maßnahmen: zusätzliche Glaubwürdigkeit', () => {
    const base = announcing('polizeieinsatz', [])
    const i = incident('polizeieinsatz')
    expect(evaluateExcuse(withUpgrades(base, 'seriose-stimme'), 'behoerdlich', i).credibility).toBeGreaterThanOrEqual(
      evaluateExcuse(base, 'behoerdlich', i).credibility + 10,
    )
  })
})

describe('Phasenübergänge', () => {
  it('incident → result → announcement → announced → upgrade → incident', () => {
    const start = withIncident(createRun('1'), 'ueberholung')
    expect(start.phase).toBe('incident')
    const result = chooseOption(start, 'warten')
    expect(result.phase).toBe('result')
    const announcement = continueJourney(result)
    expect(announcement.phase).toBe('announcement')
    expect(announcement.deck.hand.length).toBeGreaterThan(0)
    const announced = playExcuse(announcement, announcement.deck.hand[0])
    expect(announced.phase).toBe('announced')
    const upgrade = continueJourney(announced)
    expect(upgrade.phase).toBe('upgrade')
    expect(upgrade.stationIndex).toBe(0)
    const next = chooseUpgrade(upgrade, upgrade.upgradeOffer[0])
    expect(next.phase).toBe('incident')
    expect(next.stationIndex).toBe(1)
    expect(next.eventIndex).toBe(1)
  })

  it('nach einem Folgeereignis geht es ohne Verbesserung zum Vorfall derselben Station', () => {
    const base = createRun('1')
    const state: GameState = { ...base, events: [{ stationIndex: 0, incidentId: 'fahrgastkonflikt', depth: 1 }, ...base.events] }
    const announcement = continueJourney(chooseOption(state, 'schlichten'))
    const next = continueJourney(playExcuse(announcement, announcement.deck.hand[0]))
    expect(next.phase).toBe('incident')
    expect(next.stationIndex).toBe(0)
    expect(next.eventIndex).toBe(1)
  })

  it('nach der Durchsage in München: Sieg', () => {
    const base = createRun('1')
    const munich = withIncident({ ...base, eventIndex: 7, stationIndex: 7 }, 'ueberholung')
    const announcement = continueJourney(chooseOption(munich, 'warten'))
    const announced = playExcuse(announcement, bestCard(announcement))
    expect(continueJourney(announced).phase).toBe('victory')
  })

  it('Niederlage direkt nach dem Vorfall überspringt die Durchsage', () => {
    const state = { ...withIncident(createRun('1'), 'klimaanlage'), resources: { delay: 0, satisfaction: 1, condition: 50 } }
    expect(continueJourney(chooseOption(state, 'ignorieren')).phase).toBe('gameover')
  })

  it('eine unglaubwürdige Durchsage kann die Fahrt beenden', () => {
    const state = { ...announcing('tuerstoerung', ['hoehere-gewalt', 'betriebsablauf']), resources: { delay: 5, satisfaction: 2, condition: 50 } }
    const announced = playExcuse(state, 'hoehere-gewalt')
    expect(announced.failures).toEqual(['satisfaction'])
    expect(continueJourney(announced).phase).toBe('gameover')
    // Die harmlose Alternative hätte gerettet.
    expect(playExcuse(state, 'betriebsablauf').failures).toEqual([])
  })

  it('ungültige Aktionen ändern nichts', () => {
    const incidentPhase = createRun('1')
    expect(playExcuse(incidentPhase, 'betriebsablauf')).toBe(incidentPhase)
    expect(continueJourney(incidentPhase)).toBe(incidentPhase)
    const result = chooseOption(incidentPhase, getCurrentIncident(incidentPhase).choices[0].id)
    expect(playExcuse(result, 'betriebsablauf')).toBe(result)
    expect(chooseOption(result, getCurrentIncident(result).choices[0].id)).toBe(result)
    const announcement = continueJourney(result)
    expect(continueJourney(announcement)).toBe(announcement)
    expect(chooseOption(announcement, getCurrentIncident(announcement).choices[0].id)).toBe(announcement)
    const notInHand = EXCUSES.find((c) => !announcement.deck.hand.includes(c.id))!.id
    expect(playExcuse(announcement, notInHand)).toBe(announcement)
    const announced = playExcuse(announcement, announcement.deck.hand[0])
    expect(playExcuse(announced, announced.deck.discard[0])).toBe(announced)
    const upgrade = continueJourney(announced)
    expect(continueJourney(upgrade)).toBe(upgrade)
    expect(playExcuse(upgrade, 'betriebsablauf')).toBe(upgrade)
  })

  it('keine Fahrt bleibt hängen, egal wie gespielt wird', () => {
    for (let seed = 0; seed < 300; seed++) {
      const rng = createRng(`haenger-${seed}`)
      const end = playRun(
        createRun(String(seed)),
        () => Math.floor(rng() * 3),
        (s) => s.deck.hand[Math.floor(rng() * s.deck.hand.length)],
        (s) => s.upgradeOffer[Math.floor(rng() * s.upgradeOffer.length)],
      )
      expect(['victory', 'gameover']).toContain(end.phase)
      expect(end.history.length).toBeGreaterThanOrEqual(1)
      // Jede Entscheidung ohne Niederlage wurde auch angesagt.
      expect(end.announcements.length).toBeGreaterThanOrEqual(end.history.length - 1)
    }
  })
})

describe('Seed-Determinismus', () => {
  it('dieselbe Fahrt mit denselben Entscheidungen ergibt exakt denselben Verlauf', () => {
    const once = () => playRun(createRun('determinismus'), (s) => s.eventIndex % 3, (s) => s.deck.hand[s.eventIndex % s.deck.hand.length], firstUpgrade)
    expect(once()).toEqual(once())
  })

  it('verschiedene Seeds ergeben verschiedene Decks, Hände und Angebote', () => {
    const hands = new Set(
      Array.from({ length: 8 }, (_, s) => continueJourney(afterFirstChoice(String(s))).deck.hand.join()),
    )
    expect(hands.size).toBeGreaterThan(1)
  })
})

describe('Balance mit Ausreden und Verbesserungen', () => {
  function winRate(card: (s: GameState, rng: () => number) => string, n = 400): number {
    let wins = 0
    for (let seed = 0; seed < n; seed++) {
      const rng = createRng(`balance-${seed}`)
      const end = playRun(
        createRun(String(seed)),
        () => Math.floor(rng() * 3),
        (s) => card(s, rng),
        (s) => s.upgradeOffer[Math.floor(rng() * s.upgradeOffer.length)],
      )
      if (end.phase === 'victory') wins++
    }
    return wins / n
  }

  it('gute Durchsagen helfen spürbar, ersetzen aber keine guten Entscheidungen', () => {
    const randomCards = winRate((s, rng) => s.deck.hand[Math.floor(rng() * s.deck.hand.length)])
    const smartCards = winRate((s) => bestCard(s))
    expect(randomCards).toBeGreaterThan(0.25)
    expect(randomCards).toBeLessThan(0.65)
    expect(smartCards).toBeGreaterThan(randomCards + 0.1)
    expect(smartCards).toBeLessThan(0.85)
  })
})
