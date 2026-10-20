import { describe, expect, it } from 'vitest'
import {
  DELAY_LIMIT,
  INITIAL_RESOURCES,
  MAX_CHAIN_DEPTH,
  MAX_CHOICE_PENALTY,
  MAX_FOLLOW_UPS,
  TIMETABLE_RESERVE,
} from './constants'
import {
  applyEffects,
  chooseOption,
  continueJourney,
  createRun,
  getCurrentIncident,
  getFailures,
  getFollowUpsFor,
  previewResolution,
  resolveChoice,
  riskLevel,
  rollFollowUp,
  rollFor,
  scaleEffects,
  selectIncidents,
} from './engine'
import { FOLLOW_UPS, getIncident, INCIDENTS } from './incidents'
import { createRng } from './rng'
import { STATIONS } from './stations'
import { STATUS_DEFINITIONS, STATUS_IDS } from './statuses'
import { finishEvent, playEvent } from './testUtils'
import type { Choice, Consequence, GameState, Incident, ResourceEffects, RiskyChoice, StatusId } from './types'

/** Spielt ein Ereignis komplett: Option wählen, Durchsage mit der besten Ausrede, ggf. Verbesserung. */
const play = (state: GameState, choiceIndex: number) => playEvent(state, choiceIndex)

/** Hilfsfunktion für gezielte Ressourcen-Tests. */
function withResources(state: GameState, resources: Partial<GameState['resources']>): GameState {
  return { ...state, resources: { ...state.resources, ...resources } }
}

/** Ersetzt den Vorfall des aktuellen Ereignisses. */
function withIncident(state: GameState, incidentId: string): GameState {
  const events = state.events.map((e, i) => (i === state.eventIndex ? { ...e, incidentId } : e))
  return { ...state, events }
}

function withStatuses(state: GameState, statuses: GameState['statuses']): GameState {
  return { ...state, statuses }
}

const ALL_INCIDENTS = [...INCIDENTS, ...FOLLOW_UPS]
const choiceOf = (incidentId: string, choiceId: string) => getIncident(incidentId)!.choices.find((c) => c.id === choiceId)!

/** Erster Seed, bei dem die riskante Option am aktuellen Ereignis gut- bzw. schiefgeht. */
function findSeedFor(choice: RiskyChoice, success: boolean, prepare: (s: GameState) => GameState): GameState {
  for (let seed = 0; seed < 1000; seed++) {
    const state = prepare(createRun(String(seed)))
    if (previewResolution(state, choice).success === success) return state
  }
  throw new Error('Kein passender Seed')
}

/** Nachteile einer Konsequenz als positive Zahlen. */
function penalties(effects: ResourceEffects) {
  return {
    delay: Math.max(0, effects.delay ?? 0),
    satisfaction: Math.max(0, -(effects.satisfaction ?? 0)),
    condition: Math.max(0, -(effects.condition ?? 0)),
  }
}

function outcomesOf(choice: Choice): Consequence[] {
  return choice.kind === 'risky' ? [choice, choice.risk] : [choice]
}

describe('Vorfallsdaten', () => {
  it('hat mindestens 25 reguläre Vorfälle mit eindeutigen IDs und je drei Optionen', () => {
    expect(INCIDENTS.length).toBeGreaterThanOrEqual(25)
    expect(new Set(ALL_INCIDENTS.map((i) => i.id)).size).toBe(ALL_INCIDENTS.length)
    for (const incident of ALL_INCIDENTS) {
      expect(incident.choices).toHaveLength(3)
      expect(new Set(incident.choices.map((c) => c.id)).size).toBe(3)
    }
  })

  it('bietet in jedem Vorfall verschiedene Entscheidungsarten', () => {
    for (const incident of ALL_INCIDENTS) {
      expect(new Set(incident.choices.map((c) => c.kind)).size, incident.id).toBeGreaterThanOrEqual(2)
    }
    const kinds = ALL_INCIDENTS.flatMap((i) => i.choices.map((c) => c.kind))
    for (const kind of ['safe', 'risky', 'strategic'] as const) {
      expect(kinds.filter((k) => k === kind).length).toBeGreaterThanOrEqual(20)
    }
  })

  it('riskante Optionen: echte Wahrscheinlichkeit, Fehlschlag schlimmer als Erfolg', () => {
    const weight = (e: ResourceEffects) => 2.5 * (e.delay ?? 0) - (e.satisfaction ?? 0) - (e.condition ?? 0)
    for (const choice of ALL_INCIDENTS.flatMap((i) => i.choices)) {
      if (choice.kind !== 'risky') continue
      expect(choice.risk.chance, choice.id).toBeGreaterThan(0)
      expect(choice.risk.chance, choice.id).toBeLessThan(1)
      expect(weight(choice.risk.effects), choice.id).toBeGreaterThan(weight(choice.effects) + 8)
    }
  })

  it('strategische Optionen opfern genau eine Ressource', () => {
    for (const incident of ALL_INCIDENTS) {
      for (const choice of incident.choices) {
        if (choice.kind !== 'strategic') continue
        const costs = Object.values(penalties(choice.effects)).filter((v) => v > 0)
        expect(costs, `${incident.id}/${choice.id}`).toHaveLength(1)
      }
    }
  })

  it('Folgeereignisse sind an ein Problem gebunden und kommen nicht regulär vor', () => {
    expect(INCIDENTS.every((i) => !i.trigger)).toBe(true)
    for (const incident of FOLLOW_UPS) {
      expect(incident.trigger, incident.id).toBeDefined()
      expect(STATUS_IDS).toContain(incident.trigger!.status)
    }
    for (const status of STATUS_IDS) {
      expect(getFollowUpsFor(status).length, status).toBeGreaterThan(0)
      // Jedes Problem lässt sich irgendwo beheben.
      expect(ALL_INCIDENTS.some((i) => i.choices.some((c) => c.cures?.includes(status))), status).toBe(true)
    }
  })

  it('hat 8 Stationen von Berlin Hbf nach München Hbf mit steigender Schwierigkeit', () => {
    expect(STATIONS).toHaveLength(8)
    expect(STATIONS[0].name).toBe('Berlin Hbf')
    expect(STATIONS[7].name).toBe('München Hbf')
    for (let i = 1; i < STATIONS.length; i++) {
      expect(STATIONS[i].penalty).toBeGreaterThan(STATIONS[i - 1].penalty)
      expect(STATIONS[i].tier).toBeGreaterThanOrEqual(STATIONS[i - 1].tier)
    }
    expect(STATIONS[0].tier).toBe(1)
    expect(STATIONS[7].tier).toBe(3)
  })

  it('hat für jede Stufe genug Vorfälle', () => {
    for (const tier of [1, 2, 3] as const) {
      const needed = STATIONS.filter((s) => s.tier === tier).length
      expect(INCIDENTS.filter((i) => i.tier === tier).length).toBeGreaterThanOrEqual(needed + 2)
    }
  })
})

describe('Kein unvermeidbarer Sofortverlust', () => {
  /** Ein „gesunder“ Zustand: deutlich über allen Grenzwerten. */
  const HEALTHY = { delay: 10, satisfaction: 52, condition: 50 }

  /** Stationen, an denen ein Vorfall auftreten kann. */
  function stationsFor(incident: Incident) {
    return STATIONS.filter((s, index) => (incident.trigger ? index > 0 : s.tier === incident.tier))
  }

  it('keine einzelne Entscheidung überschreitet die Obergrenzen, auch nicht in München', () => {
    for (const incident of ALL_INCIDENTS) {
      for (const station of stationsFor(incident)) {
        for (const choice of incident.choices) {
          for (const outcome of outcomesOf(choice)) {
            const p = penalties(scaleEffects(outcome.effects, station.penalty))
            const label = `${incident.id}/${choice.id} in ${station.name}`
            expect(p.delay, label).toBeLessThanOrEqual(MAX_CHOICE_PENALTY.delay)
            expect(p.satisfaction, label).toBeLessThanOrEqual(MAX_CHOICE_PENALTY.satisfaction)
            expect(p.condition, label).toBeLessThanOrEqual(MAX_CHOICE_PENALTY.condition)
          }
        }
      }
    }
  })

  it('überlebt aus einem gesunden Zustand jede Option, selbst mit allen Problemen gleichzeitig', () => {
    const allStatuses = STATUS_IDS.map((id) => ({ id, remaining: 3, depth: 0 }))
    for (const incident of ALL_INCIDENTS) {
      for (let seed = 0; seed < 30; seed++) {
        let state = createRun(String(seed))
        // An die schwierigste mögliche Station springen
        const station = STATIONS.indexOf(stationsFor(incident).at(-1)!)
        const eventIndex = state.events.findIndex((e) => e.stationIndex === station)
        state = { ...state, eventIndex, stationIndex: station }
        state = withStatuses(withResources(withIncident(state, incident.id), HEALTHY), allStatuses)
        for (const choice of incident.choices) {
          expect(chooseOption(state, choice.id).failures, `${incident.id}/${choice.id} Seed ${seed}`).toEqual([])
        }
      }
    }
  })
})

describe('Vorfallsauswahl', () => {
  it('liefert für denselben Seed dieselbe Reihenfolge', () => {
    expect(selectIncidents('42')).toEqual(selectIncidents('42'))
    expect(createRun('abc').events).toEqual(createRun('abc').events)
  })

  it('liefert für verschiedene Seeds unterschiedliche Reihenfolgen', () => {
    const sequences = new Set(['1', '2', '3', '4', '5'].map((s) => selectIncidents(s).join()))
    expect(sequences.size).toBeGreaterThan(1)
  })

  it('wählt einen Vorfall pro Station ohne Wiederholung und passend zur Stufe', () => {
    for (let seed = 0; seed < 100; seed++) {
      const ids = selectIncidents(String(seed))
      expect(ids).toHaveLength(STATIONS.length)
      expect(new Set(ids).size).toBe(ids.length)
      ids.forEach((id, index) => expect(getIncident(id)!.tier).toBe(STATIONS[index].tier))
    }
  })

  it('zieht nie Folgeereignisse als regulären Vorfall', () => {
    for (let seed = 0; seed < 100; seed++) {
      expect(selectIncidents(String(seed)).some((id) => getIncident(id)!.trigger)).toBe(false)
    }
  })

  it('wirft einen Fehler, wenn der Vorrat einer Stufe nicht reicht', () => {
    expect(() => selectIncidents('x', INCIDENTS.filter((i) => i.tier !== 3))).toThrow()
  })
})

describe('Neue Fahrt', () => {
  it('startet in Berlin mit den Startwerten', () => {
    const run = createRun('1')
    expect(run.stationIndex).toBe(0)
    expect(run.eventIndex).toBe(0)
    expect(run.phase).toBe('incident')
    expect(run.resources).toEqual({ delay: 0, satisfaction: 75, condition: 85 })
    expect(run.events).toHaveLength(8)
    expect(run.events.every((e, i) => e.stationIndex === i && e.depth === 0)).toBe(true)
    expect(run.statuses).toEqual([])
    expect(run.history).toEqual([])
    expect(run.failures).toEqual([])
  })

  it('verändert die Startwerte nicht über mehrere Fahrten hinweg', () => {
    const first = play(createRun('1'), 0)
    expect(first.resources).not.toEqual(INITIAL_RESOURCES)
    expect(createRun('1').resources).toEqual(INITIAL_RESOURCES)
  })
})

describe('Ressourcen', () => {
  it('wendet die Effekte einer sicheren Wahl mit dem Faktor der Station an', () => {
    const run = withResources(withIncident(createRun('1'), 'ueberholung'), { delay: 5 })
    const next = chooseOption(run, 'warten')
    const factor = STATIONS[0].penalty
    const expected = applyEffects(applyEffects(run.resources, scaleEffects({ delay: 4 }, factor)), {
      delay: -TIMETABLE_RESERVE,
    })
    expect(next.resources).toEqual(expected)
    expect(next.phase).toBe('result')
    expect(next.history).toHaveLength(1)
    expect(next.history[0]).toMatchObject({
      eventIndex: 0,
      stationIndex: 0,
      incidentId: 'ueberholung',
      choiceId: 'warten',
      kind: 'safe',
      success: true,
      before: run.resources,
      after: next.resources,
    })
  })

  it('wendet das Beispiel „Klimaanlage defekt“ korrekt an', () => {
    const start = { delay: 0, satisfaction: 75, condition: 85 }
    expect(applyEffects(start, { delay: 8, condition: 10 })).toEqual({ delay: 8, satisfaction: 75, condition: 95 })
    expect(applyEffects(start, { delay: 2, satisfaction: -10 })).toEqual({ delay: 2, satisfaction: 65, condition: 85 })
    expect(applyEffects(start, { satisfaction: -20 })).toEqual({ delay: 0, satisfaction: 55, condition: 85 })
    expect(choiceOf('klimaanlage', 'mechaniker').effects).toEqual({ delay: 8, condition: 10 })
    expect(choiceOf('klimaanlage', 'fenster').effects).toEqual({ delay: 2, satisfaction: -10 })
    expect(choiceOf('klimaanlage', 'ignorieren').effects).toEqual({ satisfaction: -20 })
  })

  it('begrenzt Zufriedenheit und Zustand auf 0 bis 100', () => {
    expect(applyEffects({ delay: 0, satisfaction: 95, condition: 98 }, { satisfaction: 20, condition: 10 })).toEqual({
      delay: 0,
      satisfaction: 100,
      condition: 100,
    })
    expect(applyEffects({ delay: 0, satisfaction: 5, condition: 3 }, { satisfaction: -20, condition: -10 })).toEqual({
      delay: 0,
      satisfaction: 0,
      condition: 0,
    })
  })

  it('lässt die Verspätung nie unter 0 fallen', () => {
    expect(applyEffects({ delay: 2, satisfaction: 50, condition: 50 }, { delay: -5 }).delay).toBe(0)
  })

  it('ignoriert unbekannte Optionen und Wahl außerhalb der Vorfallsphase', () => {
    const run = createRun('1')
    expect(chooseOption(run, 'gibt-es-nicht')).toBe(run)
    const result = chooseOption(run, getCurrentIncident(run).choices[0].id)
    expect(chooseOption(result, getCurrentIncident(result).choices[1].id)).toBe(result)
    expect(continueJourney(run)).toBe(run)
  })
})

describe('Schwierigkeit', () => {
  it('verstärkt nur Nachteile, die Verspätung schwächer', () => {
    expect(scaleEffects({ delay: 10, satisfaction: -10, condition: -10 }, 2)).toEqual({
      delay: 16,
      satisfaction: -20,
      condition: -20,
    })
    expect(scaleEffects({ delay: -4, satisfaction: 8, condition: 6 }, 2)).toEqual({ delay: -4, satisfaction: 8, condition: 6 })
    expect(scaleEffects({}, 2)).toEqual({})
  })

  it('macht dieselbe Entscheidung in München teurer als in Berlin', () => {
    const run = withIncident(createRun('1'), 'klimaanlage')
    const berlin = chooseOption(run, 'ignorieren')
    const muenchenIndex = run.events.length - 1
    const atMunich = withIncident({ ...run, eventIndex: muenchenIndex, stationIndex: 7 }, 'klimaanlage')
    const muenchen = chooseOption(atMunich, 'ignorieren')
    const loss = (s: GameState) => s.history[0].before.satisfaction - s.history[0].after.satisfaction
    expect(loss(muenchen)).toBeGreaterThan(loss(berlin))
  })
})

describe('Riskante Entscheidungen', () => {
  const risky = choiceOf('wlan', 'landschaft') as RiskyChoice

  it('entscheidet über den Ausgang anhand des Würfelwerts', () => {
    expect(resolveChoice(risky, 0)).toMatchObject({ success: false, effects: risky.risk.effects, outcome: risky.risk.outcome })
    expect(resolveChoice(risky, risky.risk.chance - 0.001).success).toBe(false)
    expect(resolveChoice(risky, risky.risk.chance)).toMatchObject({ success: true, effects: risky.effects })
    expect(resolveChoice(risky, 0.999).success).toBe(true)
  })

  it('sichere und strategische Optionen sind nie vom Zufall abhängig', () => {
    for (const choice of ALL_INCIDENTS.flatMap((i) => i.choices)) {
      if (choice.kind === 'risky') continue
      expect(resolveChoice(choice, 0)).toEqual(resolveChoice(choice, 0.99))
      expect(resolveChoice(choice, 0).success).toBe(true)
    }
  })

  it('wendet bei Erfolg und Fehlschlag die jeweiligen Werte an', () => {
    const prepare = (s: GameState) => withIncident(s, 'wlan')
    const good = findSeedFor(risky, true, prepare)
    const bad = findSeedFor(risky, false, prepare)
    const goodResult = chooseOption(good, 'landschaft')
    const badResult = chooseOption(bad, 'landschaft')
    expect(goodResult.history[0]).toMatchObject({ kind: 'risky', success: true })
    expect(badResult.history[0]).toMatchObject({ kind: 'risky', success: false })
    const factor = STATIONS[0].penalty
    expect(goodResult.resources).toEqual(applyEffects(good.resources, scaleEffects(risky.effects, factor)))
    expect(badResult.resources).toEqual(applyEffects(bad.resources, scaleEffects(risky.risk.effects, factor)))
  })

  it('ein Fehlschlag kann ein Problem verursachen, ein Erfolg nicht', () => {
    const choice = choiceOf('tuerstoerung', 'klebeband') as RiskyChoice
    const prepare = (s: GameState) => withIncident(s, 'tuerstoerung')
    expect(chooseOption(findSeedFor(choice, true, prepare), 'klebeband').statuses).toEqual([])
    expect(chooseOption(findSeedFor(choice, false, prepare), 'klebeband').statuses.map((s) => s.id)).toEqual(['technikschaden'])
  })

  it('zeigt die Risikostufe vor der Wahl an', () => {
    expect(riskLevel(0.25)).toBe('gering')
    expect(riskLevel(0.3)).toBe('gering')
    expect(riskLevel(0.4)).toBe('mittel')
    expect(riskLevel(0.45)).toBe('mittel')
    expect(riskLevel(0.5)).toBe('hoch')
    expect(riskLevel(0.6)).toBe('hoch')
  })

  it('nutzt alle Risikostufen, damit die Anzeige etwas aussagt', () => {
    const levels = ALL_INCIDENTS.flatMap((i) => i.choices).flatMap((c) => (c.kind === 'risky' ? [riskLevel(c.risk.chance)] : []))
    for (const level of ['gering', 'mittel', 'hoch'] as const) {
      expect(levels.filter((l) => l === level).length, level).toBeGreaterThanOrEqual(5)
    }
  })
})

describe('Seed-Zufall', () => {
  it('liefert für dieselben Eingaben denselben Wert in [0, 1)', () => {
    expect(rollFor('42', 'risiko', 3)).toBe(rollFor('42', 'risiko', 3))
    for (let i = 0; i < 200; i++) {
      const value = rollFor(String(i), 'risiko', i % 8)
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('unterscheidet Seeds, Zwecke und Positionen', () => {
    const values = new Set([rollFor('1', 'risiko', 0), rollFor('2', 'risiko', 0), rollFor('1', 'folge', 0), rollFor('1', 'risiko', 1)])
    expect(values.size).toBe(4)
  })

  it('der Zufallsgenerator ist reproduzierbar', () => {
    const a = createRng('seed')
    const b = createRng('seed')
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  it('trifft die angegebene Wahrscheinlichkeit über viele Seeds ungefähr', () => {
    const risky = choiceOf('lokfuehrer', 'fahrgast') as RiskyChoice
    let failures = 0
    const n = 2000
    for (let seed = 0; seed < n; seed++) {
      if (!previewResolution(createRun(`p${seed}`), risky).success) failures++
    }
    expect(failures / n).toBeGreaterThan(risky.risk.chance - 0.05)
    expect(failures / n).toBeLessThan(risky.risk.chance + 0.05)
  })

  it('ganze Fahrten sind mit demselben Seed reproduzierbar', () => {
    const runOnce = () => {
      let state = createRun('wiederholung')
      while (state.phase === 'incident') state = play(state, state.eventIndex % 3)
      return state
    }
    expect(runOnce()).toEqual(runOnce())
  })
})

describe('Anhaltende Probleme', () => {
  const ignore = (seed = '1') => chooseOption(withIncident(createRun(seed), 'klimaanlage'), 'ignorieren')

  it('eine Entscheidung kann ein Problem auslösen', () => {
    const result = ignore()
    expect(result.statuses).toEqual([{ id: 'hitze', remaining: STATUS_DEFINITIONS.hitze.duration, depth: 0 }])
    expect(result.history[0].statusesAdded).toEqual(['hitze'])
  })

  it('ein Problem wirkt erst ab der nächsten Entscheidung und läuft dann ab', () => {
    const first = ignore()
    // Die Hitze selbst hat bei ihrer Entstehung noch nicht gewirkt.
    expect(first.history[0].changes.map((c) => c.source)).not.toContain('hitze')

    let state = withResources(finishEvent(first), { satisfaction: 80 })
    state = withIncident(state, 'reservierung')
    const second = chooseOption(state, 'manuell')
    const tick = second.history[1].changes.find((c) => c.source === 'hitze')
    expect(tick?.delta.satisfaction).toBe(STATUS_DEFINITIONS.hitze.tick.satisfaction)
    expect(second.statuses[0].remaining).toBe(STATUS_DEFINITIONS.hitze.duration - 1)
  })

  it('läuft nach seiner Dauer von selbst aus', () => {
    let state = withStatuses(createRun('1'), [{ id: 'hitze', remaining: 1, depth: 0 }])
    state = chooseOption(withIncident(state, 'ueberholung'), 'warten')
    expect(state.statuses).toEqual([])
    expect(state.history[0].statusesExpired).toEqual(['hitze'])
  })

  it('wird durch passende Entscheidungen behoben und wirkt dann nicht mehr', () => {
    let state = withStatuses(createRun('1'), [{ id: 'hitze', remaining: 3, depth: 0 }])
    state = chooseOption(withIncident(state, 'klimaanlage'), 'mechaniker')
    expect(state.statuses).toEqual([])
    expect(state.history[0].statusesCured).toEqual(['hitze'])
    expect(state.history[0].changes.map((c) => c.source)).not.toContain('hitze')
  })

  it('stapelt sich nicht, sondern frischt die Dauer auf', () => {
    let state = withStatuses(createRun('1'), [{ id: 'hitze', remaining: 1, depth: 0 }])
    state = chooseOption(withIncident(state, 'klimaanlage'), 'ignorieren')
    expect(state.statuses).toEqual([{ id: 'hitze', remaining: STATUS_DEFINITIONS.hitze.duration, depth: 0 }])
    expect(state.history[0].statusesExpired).toEqual([])
    expect(state.history[0].statusesAdded).toEqual([])
    expect(state.history[0].statusesRenewed).toEqual(['hitze'])
  })

  it('kann im Zusammenspiel mit anderen Problemen wirken', () => {
    let state = withStatuses(createRun('1'), [
      { id: 'hitze', remaining: 2, depth: 0 },
      { id: 'technikschaden', remaining: 2, depth: 0 },
    ])
    state = withResources(withIncident(state, 'ueberholung'), { delay: 0, satisfaction: 50, condition: 50 })
    const result = chooseOption(state, 'warten')
    const sources = result.history[0].changes.map((c) => c.source)
    expect(sources).toEqual(['choice', 'hitze', 'technikschaden', 'reserve'])
    expect(result.resources.condition).toBe(50 + STATUS_DEFINITIONS.technikschaden.tick.condition!)
  })
})

describe('Fahrzeitreserve', () => {
  it('holt nach dem regulären Vorfall einer Station Zeit auf', () => {
    const state = withResources(withIncident(createRun('1'), 'wlan'), { delay: 10 })
    const result = chooseOption(state, 'router')
    const reserve = result.history[0].changes.find((c) => c.source === 'reserve')
    expect(reserve?.delta.delay).toBe(-TIMETABLE_RESERVE)
  })

  it('nicht unter 0, nicht nach Folgeereignissen und nicht in München', () => {
    const atZero = chooseOption(withIncident(createRun('1'), 'puenktlich'), 'beruhigen')
    expect(atZero.history[0].changes.some((c) => c.source === 'reserve')).toBe(false)

    const base = withResources(createRun('1'), { delay: 10 })
    const followUp = { ...base, events: [{ stationIndex: 0, incidentId: 'fahrgastkonflikt', depth: 1 }, ...base.events] }
    expect(chooseOption(followUp, 'schlichten').history[0].changes.some((c) => c.source === 'reserve')).toBe(false)

    const munich = { ...base, eventIndex: 7, stationIndex: 7 }
    const atMunich = chooseOption(munich, getCurrentIncident(munich).choices[0].id)
    expect(atMunich.history[0].changes.some((c) => c.source === 'reserve')).toBe(false)
  })
})

describe('Ereignisplanung und Kettenreaktionen', () => {
  /** Zustand im Ergebnis eines regulären Vorfalls mit dem angegebenen Problem. */
  function resultWith(seed: string, status: StatusId, depth = 0, stationIndex = 0): GameState {
    let state = createRun(seed)
    const eventIndex = state.events.findIndex((e) => e.stationIndex === stationIndex)
    state = { ...state, eventIndex, stationIndex }
    state = withIncident(state, 'puenktlich')
    state = chooseOption(state, 'wartung')
    return withStatuses(state, [{ id: status, remaining: 3, depth }])
  }

  /** Erster Seed, bei dem ein Folgeereignis ausgelöst bzw. nicht ausgelöst wird. */
  function findFollowUpSeed(status: StatusId, triggered: boolean): GameState {
    for (let seed = 0; seed < 500; seed++) {
      const state = resultWith(String(seed), status)
      if ((rollFollowUp(state, 1) !== null) === triggered) return state
    }
    throw new Error('Kein passender Seed')
  }

  it('ohne aktive Probleme gibt es keine Folgeereignisse', () => {
    for (let seed = 0; seed < 100; seed++) {
      let state = createRun(String(seed))
      state = chooseOption(withIncident(state, 'puenktlich'), 'wartung')
      expect(rollFollowUp(state, 1)).toBeNull()
      expect(finishEvent(state).events).toHaveLength(8)
    }
  })

  it('ein Problem erhöht die Wahrscheinlichkeit für sein Folgeereignis', () => {
    let triggered = 0
    const n = 400
    for (let seed = 0; seed < n; seed++) {
      if (rollFollowUp(resultWith(String(seed), 'hitze'), 1)?.incidentId === 'hitzekollaps') triggered++
    }
    const chance = getIncident('hitzekollaps')!.trigger!.chance
    expect(triggered / n).toBeGreaterThan(chance - 0.08)
    expect(triggered / n).toBeLessThan(chance + 0.08)
  })

  it('schiebt das Folgeereignis vor den regulären Vorfall der nächsten Station', () => {
    const state = findFollowUpSeed('technikschaden', true)
    const next = finishEvent(state)
    expect(next.events).toHaveLength(9)
    expect(next.eventIndex).toBe(1)
    expect(next.stationIndex).toBe(1)
    expect(next.events[1]).toEqual({ stationIndex: 1, incidentId: 'antriebsausfall', depth: 1, cause: 'technikschaden' })
    expect(next.events[2]).toEqual(state.events[1])
    expect(getCurrentIncident(next).id).toBe('antriebsausfall')

    // Nach dem Folgeereignis kommt der reguläre Vorfall derselben Station.
    const after = play(next, 0)
    expect(after.stationIndex).toBe(1)
    expect(getCurrentIncident(after).id).toBe(state.events[1].incidentId)
  })

  it('bleibt aus, wenn der Würfel es nicht will', () => {
    const state = findFollowUpSeed('technikschaden', false)
    expect(finishEvent(state).events).toEqual(state.events)
  })

  it('löst dasselbe Folgeereignis höchstens einmal pro Fahrt aus', () => {
    const state = findFollowUpSeed('hitze', true)
    const withUsed = { ...state, events: [...state.events, { stationIndex: 7, incidentId: 'hitzekollaps', depth: 1 }] }
    expect(rollFollowUp(withUsed, 1)).toBeNull()
  })

  it('begrenzt die Anzahl der Folgeereignisse pro Fahrt', () => {
    const state = findFollowUpSeed('hitze', true)
    const full = {
      ...state,
      events: [
        ...state.events,
        ...Array.from({ length: MAX_FOLLOW_UPS }, () => ({ stationIndex: 7, incidentId: 'personalausfall', depth: 1 })),
      ],
    }
    expect(rollFollowUp(full, 1)).toBeNull()
  })

  it('begrenzt die Kettentiefe', () => {
    for (let seed = 0; seed < 200; seed++) {
      const deep = resultWith(String(seed), 'hitze', MAX_CHAIN_DEPTH)
      expect(rollFollowUp(deep, 1)).toBeNull()
    }
    // Probleme aus einem Folgeereignis können noch eine Stufe tiefer führen.
    const found = Array.from({ length: 200 }, (_, seed) => rollFollowUp(resultWith(String(seed), 'hitze', 1), 1)).find(Boolean)
    expect(found?.depth).toBe(2)
  })

  it('Probleme aus Folgeereignissen erben deren Kettentiefe', () => {
    const state = findFollowUpSeed('technikschaden', true)
    const next = finishEvent(state)
    const result = chooseOption(next, 'abschalten')
    expect(result.statuses).toEqual([{ id: 'hitze', remaining: STATUS_DEFINITIONS.hitze.duration, depth: 1 }])
  })

  it('hält bei beliebigem Spiel alle Grenzen ein', () => {
    let longest = 0
    let sawFollowUp = false
    for (let seed = 0; seed < 500; seed++) {
      const rng = createRng(`spiel-${seed}`)
      let state = withResources(createRun(String(seed)), { satisfaction: 100, condition: 100 })
      let steps = 0
      while (state.phase !== 'victory' && state.phase !== 'gameover') {
        // Werte gesund halten, damit die Fahrt nicht vorzeitig endet.
        if (state.phase === 'incident') {
          state = withResources(state, { delay: 0, satisfaction: 100, condition: 100 })
          state = chooseOption(state, getCurrentIncident(state).choices[Math.floor(rng() * 3)].id)
        } else {
          state = finishEvent(state, (s) => s.deck.hand[Math.floor(rng() * s.deck.hand.length)], (s) => s.upgradeOffer[0])
        }
        if (++steps > 100) throw new Error('Endlosschleife')
      }
      const followUps = state.events.filter((e) => e.depth > 0)
      expect(followUps.length).toBeLessThanOrEqual(MAX_FOLLOW_UPS)
      expect(followUps.every((e) => e.depth <= MAX_CHAIN_DEPTH)).toBe(true)
      expect(new Set(state.events.map((e) => e.incidentId)).size).toBe(state.events.length)
      expect(state.phase).toBe('victory')
      expect(state.history).toHaveLength(state.events.length)
      longest = Math.max(longest, state.events.length)
      sawFollowUp ||= followUps.length > 0
    }
    expect(sawFollowUp).toBe(true)
    expect(longest).toBeLessThanOrEqual(STATIONS.length + MAX_FOLLOW_UPS)
  })
})

describe('Spielende', () => {
  it('erkennt alle Grenzwerte', () => {
    expect(getFailures({ delay: DELAY_LIMIT - 1, satisfaction: 1, condition: 1 })).toEqual([])
    expect(getFailures({ delay: DELAY_LIMIT, satisfaction: 50, condition: 50 })).toEqual(['delay'])
    expect(getFailures({ delay: 0, satisfaction: 0, condition: 50 })).toEqual(['satisfaction'])
    expect(getFailures({ delay: 0, satisfaction: 50, condition: 0 })).toEqual(['condition'])
    expect(getFailures({ delay: 45, satisfaction: 0, condition: 0 })).toEqual(['delay', 'satisfaction', 'condition'])
  })

  it('endet mit Game Over, wenn die Verspätung 30 Minuten erreicht', () => {
    // In München gibt es keine Fahrzeitreserve mehr.
    const base = createRun('1')
    const run = withIncident(withResources({ ...base, eventIndex: 7, stationIndex: 7 }, { delay: 29 }), 'oberleitung')
    const result = chooseOption(run, 'raeumen')
    expect(result.phase).toBe('result')
    expect(result.failures).toContain('delay')
    expect(continueJourney(result).phase).toBe('gameover')
  })

  it('endet mit Game Over, wenn die Zufriedenheit 0 erreicht', () => {
    const run = withIncident(withResources(createRun('1'), { satisfaction: 1 }), 'klimaanlage')
    const over = continueJourney(chooseOption(run, 'ignorieren'))
    expect(over.phase).toBe('gameover')
    expect(over.failures).toContain('satisfaction')
    expect(over.resources.satisfaction).toBe(0)
  })

  it('endet mit Game Over, wenn der Zugzustand 0 erreicht', () => {
    const run = withIncident(withResources(createRun('1'), { condition: 1 }), 'oberleitung')
    const over = continueJourney(chooseOption(run, 'drunter'))
    expect(over.phase).toBe('gameover')
    expect(over.failures).toEqual(['condition'])
  })

  it('ein laufendes Problem kann die Fahrt beenden', () => {
    const run = withStatuses(withIncident(withResources(createRun('1'), { condition: 2 }), 'wlan'), [
      { id: 'technikschaden', remaining: 2, depth: 0 },
    ])
    const result = chooseOption(run, 'router')
    expect(result.failures).toEqual(['condition'])
    expect(continueJourney(result).phase).toBe('gameover')
  })

  it('erreicht den Sieg nach dem Vorfall in München', () => {
    let state = createRun('1')
    while (state.stationIndex < STATIONS.length - 1 || getCurrentIncident(state).trigger) {
      // Werte künstlich gesund halten, um nur den Ablauf zu prüfen
      const station = state.stationIndex
      state = play(withResources(state, { delay: 0, satisfaction: 75, condition: 85 }), 0)
      expect(state.phase).toBe('incident')
      expect(state.stationIndex - station).toBeLessThanOrEqual(1)
    }
    const result = chooseOption(state, getCurrentIncident(state).choices[0].id)
    expect(result.phase).toBe('result')
    const final = finishEvent(result)
    expect(final.phase).toBe('victory')
    expect(final.history).toHaveLength(final.events.length)
    expect(final.history.at(-1)!.stationIndex).toBe(7)
    expect(continueJourney(final)).toBe(final)
    expect(chooseOption(final, 'x')).toBe(final)
  })

  it('zeigt bei einer Niederlage an der letzten Station Game Over statt Sieg', () => {
    const base = createRun('1')
    const state = withIncident(withResources({ ...base, eventIndex: 7, stationIndex: 7 }, { delay: 29 }), 'unwetter')
    expect(continueJourney(chooseOption(state, 'langsam')).phase).toBe('gameover')
  })
})

describe('Spielbalance', () => {
  /** Durchsucht alle Entscheidungsfolgen nach einem Sieg; Würfelergebnisse stehen pro Seed fest. */
  function canWin(state: GameState, seen = new Set<string>()): boolean {
    if (state.phase === 'victory') return true
    if (state.phase === 'gameover') return false
    const key = JSON.stringify([state.eventIndex, state.resources, state.statuses, state.events.length])
    if (seen.has(key)) return false
    seen.add(key)
    return [0, 1, 2].some((i) => canWin(play(state, i), seen))
  }

  it('ist für jeden Seed gewinnbar', () => {
    for (let seed = 0; seed < 200; seed++) {
      expect(canWin(createRun(String(seed))), `Seed ${seed}`).toBe(true)
    }
  })

  /** Siegquote einer Strategie über viele Seeds. */
  function winRate(pick: (state: GameState, rng: () => number) => number, n = 600): number {
    let wins = 0
    for (let seed = 0; seed < n; seed++) {
      const rng = createRng(`strategie-${seed}`)
      let state = createRun(String(seed))
      while (state.phase === 'incident') state = play(state, pick(state, rng))
      if (state.phase === 'victory') wins++
    }
    return wins / n
  }

  const indexOfKind = (state: GameState, kind: Choice['kind']) =>
    getCurrentIncident(state).choices.findIndex((c) => c.kind === kind)

  it('zufälliges Spiel gewinnt manchmal, aber nicht immer', () => {
    const rate = winRate((_, rng) => Math.floor(rng() * 3))
    // Zufällige Entscheidungen, aber gute Durchsagen: oft, aber nicht immer ein Sieg.
    expect(rate).toBeGreaterThan(0.3)
    expect(rate).toBeLessThan(0.8)
  })

  it('keine Entscheidungsart gewinnt blind immer', () => {
    for (const kind of ['safe', 'risky', 'strategic'] as const) {
      const rate = winRate((state, rng) => {
        const index = indexOfKind(state, kind)
        return index >= 0 ? index : Math.floor(rng() * 3)
      })
      expect(rate, kind).toBeLessThan(0.85)
    }
  })

  it('kann verloren werden, wenn man immer die erste Option wählt', () => {
    let losses = 0
    for (let seed = 0; seed < 200; seed++) {
      let state = createRun(String(seed))
      while (state.phase === 'incident') state = play(state, 0)
      if (state.phase === 'gameover') losses++
    }
    expect(losses).toBeGreaterThan(0)
  })
})
