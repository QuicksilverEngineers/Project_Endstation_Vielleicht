import { STATIONS } from './stations'
import type { GameState, Plausibility } from './types'

export type Grade = 'S' | 'A' | 'B' | 'C' | 'D' | 'E'

export interface RunRating {
  grade: Grade
  /** 0–5 */
  stars: number
  title: string
  comment: string
}

/** Abschlussbewertung einer beendeten Fahrt. */
export function rateRun(state: GameState): RunRating {
  const { delay } = state.resources
  if (state.phase === 'victory') {
    if (delay <= 2)
      return {
        grade: 'S',
        stars: 5,
        title: 'Fast schon Schweizer Verhältnisse',
        comment: 'Pünktlich, sauber, freundlich. Die Fahrgäste vermuten einen Fehler im System und melden ihn vorsorglich.',
      }
    if (delay <= 5)
      return {
        grade: 'A',
        stars: 4,
        title: 'Statistisch pünktlich',
        comment: 'Bis 5 Minuten und 59 Sekunden gilt ein Zug offiziell als pünktlich. Die Statistik ist ganz auf Ihrer Seite.',
      }
    if (delay <= 14)
      return {
        grade: 'B',
        stars: 3,
        title: 'Typischer Dienstag',
        comment: 'Etwas Verspätung, etwas Chaos, alle sind angekommen. Mehr verspricht der Fahrplan auch nicht.',
      }
    return {
      grade: 'C',
      stars: 2,
      title: 'Immerhin fährt noch etwas',
      comment: 'Die Ankunftszeit war eher ein unverbindlicher Vorschlag. Aber der Zug ist da, und das hatten nicht alle erwartet.',
    }
  }
  if (state.stationIndex >= STATIONS.length - 3)
    return {
      grade: 'D',
      stars: 1,
      title: 'Kurz vor dem Ziel liegen geblieben',
      comment: `${STATIONS[state.stationIndex].name} ist wirklich schön. Das finden jetzt auch Ihre Fahrgäste, ob sie wollen oder nicht.`,
    }
  return {
    grade: 'E',
    stars: 0,
    title: 'Schienenersatzverkehr',
    comment: 'Ab hier übernimmt ein Bus. Er kommt in etwa 40 Minuten. Ungefähr. Wahrscheinlich.',
  }
}

export interface RunStats {
  stationsReached: number
  totalStations: number
  delay: number
  satisfaction: number
  condition: number
  credibility: number
  incidents: number
  followUps: number
  excuses: number
  plausibility: Record<Plausibility, number>
  favoriteExcuse?: { cardId: string; uses: number }
  upgrades: number
}

export function runStats(state: GameState): RunStats {
  const plausibility: Record<Plausibility, number> = { perfekt: 0, plausibel: 0, neutral: 0, unglaubwuerdig: 0 }
  for (const a of state.announcements) plausibility[a.plausibility]++
  const favorite = Object.entries(state.cardUses).sort((a, b) => b[1] - a[1])[0]
  return {
    stationsReached: state.phase === 'victory' ? STATIONS.length : state.stationIndex + 1,
    totalStations: STATIONS.length,
    delay: state.resources.delay,
    satisfaction: state.resources.satisfaction,
    condition: state.resources.condition,
    credibility: state.credibility,
    incidents: state.history.length,
    followUps: state.history.filter((h) => state.events[h.eventIndex]?.depth > 0).length,
    excuses: state.announcements.length,
    plausibility,
    favoriteExcuse: favorite ? { cardId: favorite[0], uses: favorite[1] } : undefined,
    upgrades: state.upgrades.reduce((sum, u) => sum + u.stacks, 0),
  }
}
