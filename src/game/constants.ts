import type { Resources } from './types'

export const DELAY_LIMIT = 30
export const RESOURCE_MAX = 100

export const INITIAL_RESOURCES: Resources = {
  delay: 0,
  satisfaction: 75,
  condition: 85,
}

/** So viele Minuten holt der Zug auf jedem Streckenabschnitt bis zur nächsten Station auf. */
export const TIMETABLE_RESERVE = 2

/** Höchstens so viele Folgeereignisse pro Fahrt. */
export const MAX_FOLLOW_UPS = 3
/** Ein Folgeereignis darf höchstens diese Kettentiefe haben (Vorfall → Folge → Folge der Folge). */
export const MAX_CHAIN_DEPTH = 2

/**
 * Obergrenzen für die Nachteile einer einzelnen Entscheidung nach Verstärkung durch die Station.
 * Zusammen mit den laufenden Problemen bleibt so jede Entscheidung aus einem gesunden Zustand
 * heraus überlebbar.
 */
export const MAX_CHOICE_PENALTY: Resources = {
  delay: 17,
  satisfaction: 44,
  condition: 44,
}
