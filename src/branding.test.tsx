import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { DISCLAIMER, GAME_TITLE, TAGLINE } from './components/Brand'
import { CLOSINGS, EXCUSES, OPENINGS } from './game/excuses'
import { INCIDENTS } from './game/incidents'
import { UPGRADES } from './game/upgrades'

/** Namen, Marken und Zuggattungen realer Betreiber, die im Spiel nicht mehr vorkommen sollen. */
const FORBIDDEN = [/Deutsche Bahn/, /\bDB\b/, /Bitte haben Sie Verständnis/, /\bICE\b/, /BahnCard/, /BahnBonus/]

describe('Eigenständige Marke', () => {
  beforeEach(() => localStorage.clear())
  afterEach(cleanup)

  it('zeigt Titel, Leitspruch und Hinweis zur Eigenständigkeit im Hauptmenü', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: GAME_TITLE })).toBeTruthy()
    expect(screen.getByText(`„${TAGLINE}“`)).toBeTruthy()
    expect(screen.getByText('Ein satirisches Zug-Roguelike')).toBeTruthy()
    expect(screen.getByText(DISCLAIMER)).toBeTruthy()
  })

  it('das Hauptmenü nennt keine realen Bahnunternehmen', () => {
    render(<App />)
    const text = document.body.textContent ?? ''
    for (const pattern of FORBIDDEN) expect(text, String(pattern)).not.toMatch(pattern)
  })

  it('Spieltexte (Vorfälle, Ausreden, Verbesserungen, Durchsagen) nennen keine realen Bahnunternehmen', () => {
    const texts = JSON.stringify([INCIDENTS, EXCUSES, UPGRADES, OPENINGS, CLOSINGS])
    for (const pattern of FORBIDDEN) expect(texts, String(pattern)).not.toMatch(pattern)
  })
})
