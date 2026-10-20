import { beforeEach, describe, expect, it } from 'vitest'
import { chooseOption, chooseUpgrade, continueJourney, createRun, getCurrentIncident, playExcuse } from './engine'
import { clearRun, isValidGameState, loadRun, saveRun, STORAGE_KEY } from './storage'

describe('Speichern und Laden', () => {
  beforeEach(() => localStorage.clear())

  it('stellt einen gespeicherten Lauf exakt wieder her', () => {
    let run = createRun('777')
    run = continueJourney(chooseOption(run, getCurrentIncident(run).choices[1].id))
    run = chooseOption(run, getCurrentIncident(run).choices[2].id)
    saveRun(run)
    expect(loadRun()).toEqual(run)
  })

  it('setzt einen wiederhergestellten Lauf mit derselben Vorfallsfolge fort', () => {
    const run = createRun('777')
    saveRun(run)
    const restored = loadRun()!
    const choice = getCurrentIncident(run).choices[0].id
    expect(continueJourney(chooseOption(restored, choice))).toEqual(continueJourney(chooseOption(run, choice)))
  })

  it('liefert null, wenn nichts gespeichert ist', () => {
    expect(loadRun()).toBeNull()
  })

  it('verwirft kaputte oder fremde Daten', () => {
    localStorage.setItem(STORAGE_KEY, '{nicht json')
    expect(loadRun()).toBeNull()

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...createRun('1'), version: 99 }))
    expect(loadRun()).toBeNull()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()

    const run = createRun('1')
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...run, events: [{ ...run.events[0], incidentId: 'gibt-es-nicht' }, ...run.events.slice(1)] }))
    expect(loadRun()).toBeNull()

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...run, events: run.events.slice(1) }))
    expect(loadRun()).toBeNull()

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...run, statuses: [{ id: 'gibt-es-nicht', remaining: 1, depth: 0 }] }))
    expect(loadRun()).toBeNull()

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...run, eventIndex: 3 }))
    expect(loadRun()).toBeNull()
  })

  it('verwirft Spielstände aus Version 1', () => {
    const { events: _events, eventIndex: _eventIndex, statuses: _statuses, ...rest } = createRun('1')
    const v1 = { ...rest, version: 1, incidentIds: ['klimaanlage', 'wlan', 'kuehe', 'stellwerk', 'wlan', 'toiletten', 'notbremse', 'oberleitung'] }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v1))
    expect(loadRun()).toBeNull()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('stellt Folgeereignisse und Probleme wieder her', () => {
    const run = createRun('1')
    const state = {
      ...run,
      eventIndex: 1,
      stationIndex: 1,
      events: [run.events[0], { stationIndex: 1, incidentId: 'hitzekollaps', depth: 1, cause: 'hitze' as const }, ...run.events.slice(1)],
      statuses: [{ id: 'hitze' as const, remaining: 2, depth: 0 }],
    }
    expect(isValidGameState(state)).toBe(true)
    saveRun(state)
    expect(loadRun()).toEqual(state)
  })

  it('verwirft Spielstände aus Version 2', () => {
    const { deck: _d, cardUses: _c, upgrades: _u, upgradeOffer: _o, ersatzbusUsed: _e, rewards: _w, announcements: _a, arrivals: _r, credibility: _cr, ...rest } =
      createRun('1')
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...rest, version: 2 }))
    expect(loadRun()).toBeNull()
  })

  it('stellt Durchsage- und Verbesserungsphase exakt wieder her', () => {
    let run = createRun('5')
    run = continueJourney(chooseOption(run, getCurrentIncident(run).choices[0].id))
    expect(run.phase).toBe('announcement')
    saveRun(run)
    expect(loadRun()).toEqual(run)
    run = continueJourney(playExcuse(run, run.deck.hand[0]))
    expect(run.phase).toBe('upgrade')
    saveRun(run)
    expect(loadRun()).toEqual(run)
    run = chooseUpgrade(run, run.upgradeOffer[0])
    saveRun(run)
    expect(loadRun()).toEqual(run)
  })

  it('verlangt für jede Phase die passenden Daten', () => {
    const run = createRun('1')
    expect(isValidGameState({ ...run, phase: 'announcement' })).toBe(false)
    expect(isValidGameState({ ...run, phase: 'upgrade', upgradeOffer: [] })).toBe(false)
    expect(isValidGameState({ ...run, upgrades: [{ id: 'zocker', stacks: 2 }] })).toBe(false)
    expect(isValidGameState({ ...run, deck: { ...run.deck, hand: ['gibt-es-nicht'] } })).toBe(false)
  })

  it('verlangt für die Ergebnisphase eine passende Entscheidung', () => {
    expect(isValidGameState({ ...createRun('1'), phase: 'result' })).toBe(false)
  })

  it('löscht den Spielstand', () => {
    saveRun(createRun('1'))
    clearRun()
    expect(loadRun()).toBeNull()
  })

  it('übersteht einen nicht verfügbaren Speicher', () => {
    const broken = {
      getItem: () => {
        throw new Error('gesperrt')
      },
      setItem: () => {
        throw new Error('voll')
      },
      removeItem: () => {
        throw new Error('gesperrt')
      },
    }
    expect(() => saveRun(createRun('1'), broken)).not.toThrow()
    expect(loadRun(broken)).toBeNull()
    expect(() => clearRun(broken)).not.toThrow()
  })
})
