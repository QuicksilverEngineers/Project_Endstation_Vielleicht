import { useCallback, useState } from 'react'
import { DELAY_LIMIT, TIMETABLE_RESERVE } from '../game/constants'
import { CURRENT_KEYS } from '../game/migration'
import type { GameState } from '../game/types'

/** Kurze Einstiegstipps, die nacheinander im passenden Moment erscheinen. */
export interface TutorialHint {
  id: string
  title: string
  text: string
  /** Wann der Tipp passt. Er erscheint erst, wenn alle vorherigen gesehen wurden. */
  when: (run: GameState) => boolean
}

export const TUTORIAL_HINTS: TutorialHint[] = [
  {
    id: 'entscheidungen',
    title: 'Vorfälle und Entscheidungen',
    text: 'An jeder Station passiert etwas. Sie wählen eine von drei Optionen: sicher (vorhersehbar), riskant (mit Angabe, wie oft es schiefgeht) oder strategisch (opfert bewusst eine Ressource). Was genau passiert, sehen Sie erst danach.',
    when: (run) => run.phase === 'incident',
  },
  {
    id: 'ressourcen',
    title: 'Ressourcen und Zugausfall',
    text: `Die Fahrt endet bei ${DELAY_LIMIT} Minuten Verspätung oder wenn Zufriedenheit oder Zugzustand auf 0 fallen. Zwischen den Stationen holt der Lokführer ${TIMETABLE_RESERVE} Minuten auf. Ziel ist München Hbf unter ${DELAY_LIMIT} Minuten.`,
    when: (run) => run.history.length >= 1,
  },
  {
    id: 'ausreden',
    title: 'Ausreden',
    text: 'Jetzt erklären Sie den Vorfall per Durchsage. Vergleichen Sie die Bereiche: ✓ markiert Übereinstimmungen. „Passt perfekt“ wirkt am stärksten, „Passt nicht“ kostet Zufriedenheit und Glaubwürdigkeit. Wiederholte Ausreden nutzen sich ab.',
    when: (run) => run.phase === 'announcement',
  },
  {
    id: 'verbesserungen',
    title: 'Verbesserungen',
    text: 'Bei jeder Ankunft wählen Sie eine Verbesserung. Einzigartige gibt es nur einmal, stapelbare mehrfach. Wo eine Verbesserung gerade wirkt, steht ein ★ – beim Vorfall und im Ergebnis.',
    when: (run) => run.phase === 'upgrade',
  },
  {
    id: 'probleme',
    title: 'Laufende Probleme und Synergien',
    text: 'Manche Entscheidungen hinterlassen Probleme wie Hitze oder Überfüllung. Sie kosten bei jedem Ereignis etwas und können Folgeereignisse auslösen; passende Optionen und Ausreden beheben sie. Synergien (★) verbinden Verbesserungen mit bestimmten Ausreden.',
    when: (run) => (run.statuses.length > 0 || run.upgrades.length > 0) && (run.phase === 'incident' || run.phase === 'announcement'),
  },
]

export interface TutorialState {
  enabled: boolean
  seen: string[]
}

export const TUTORIAL_KEY = CURRENT_KEYS.tutorial
const DEFAULT_TUTORIAL: TutorialState = { enabled: true, seen: [] }

export function loadTutorial(): TutorialState {
  try {
    const raw = localStorage.getItem(TUTORIAL_KEY)
    if (!raw) return DEFAULT_TUTORIAL
    const parsed = JSON.parse(raw) as Partial<TutorialState>
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : true,
      seen: Array.isArray(parsed.seen) ? parsed.seen.filter((id): id is string => typeof id === 'string') : [],
    }
  } catch {
    return DEFAULT_TUTORIAL
  }
}

function saveTutorial(state: TutorialState) {
  try {
    localStorage.setItem(TUTORIAL_KEY, JSON.stringify(state))
  } catch {
    // ignorieren
  }
}

/** Der nächste Tipp, der jetzt passt: immer in fester Reihenfolge, nie zwei auf einmal. */
export function currentHint(tutorial: TutorialState, run: GameState | null): { hint: TutorialHint; number: number } | null {
  if (!tutorial.enabled || !run || run.phase === 'victory' || run.phase === 'gameover') return null
  const index = TUTORIAL_HINTS.findIndex((h) => !tutorial.seen.includes(h.id))
  if (index < 0) return null
  const hint = TUTORIAL_HINTS[index]
  return hint.when(run) ? { hint, number: index + 1 } : null
}

export function useTutorial() {
  const [tutorial, setTutorial] = useState(loadTutorial)
  const update = useCallback((next: (t: TutorialState) => TutorialState) => {
    setTutorial((t) => {
      const value = next(t)
      saveTutorial(value)
      return value
    })
  }, [])
  return {
    tutorial,
    dismiss: (id: string) => update((t) => ({ ...t, seen: t.seen.includes(id) ? t.seen : [...t.seen, id] })),
    disable: () => update((t) => ({ ...t, enabled: false })),
    setEnabled: (enabled: boolean) => update((t) => ({ ...t, enabled })),
    reset: () => update(() => ({ enabled: true, seen: [] })),
  }
}
