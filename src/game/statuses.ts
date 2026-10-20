import type { StatusDefinition, StatusId } from './types'

/** Reihenfolge ist zugleich die Prüfreihenfolge für Folgeereignisse. */
export const STATUS_DEFINITIONS: Record<StatusId, StatusDefinition> = {
  hitze: {
    id: 'hitze',
    label: 'Hitze im Zug',
    description: 'Die Klimatisierung ist ausgefallen. Die Stimmung sinkt mit jedem Grad.',
    tick: { satisfaction: -3 },
    duration: 3,
  },
  ueberfuellung: {
    id: 'ueberfuellung',
    label: 'Überfüllung',
    description: 'Im Gang stehen Menschen, auf den Menschen stehen Koffer. Jeder Halt dauert länger.',
    tick: { delay: 1, satisfaction: -2 },
    duration: 3,
  },
  technikschaden: {
    id: 'technikschaden',
    label: 'Technischer Mangel',
    description: 'Etwas klappert, das nicht klappern sollte. Der Zug leidet weiter.',
    tick: { condition: -3 },
    duration: 4,
  },
  erschoepfung: {
    id: 'erschoepfung',
    label: 'Personal am Limit',
    description: 'Das Zugteam arbeitet am Anschlag. Alles dauert etwas länger, niemand lächelt mehr.',
    tick: { delay: 1, satisfaction: -1 },
    duration: 3,
  },
}

export const STATUS_IDS = Object.keys(STATUS_DEFINITIONS) as StatusId[]

export function isStatusId(value: unknown): value is StatusId {
  return typeof value === 'string' && value in STATUS_DEFINITIONS
}
