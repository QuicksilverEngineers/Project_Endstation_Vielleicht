import type { Station } from './types'

/** Früh lernt man die Mechaniken kennen, ab Bamberg wird es ernst. */
export const STATIONS: readonly Station[] = [
  { id: 'berlin', name: 'Berlin Hbf', tier: 1, penalty: 1.2 },
  { id: 'wittenberg', name: 'Lutherstadt Wittenberg', tier: 1, penalty: 1.45 },
  { id: 'leipzig', name: 'Leipzig Hbf', tier: 2, penalty: 1.8 },
  { id: 'erfurt', name: 'Erfurt Hbf', tier: 2, penalty: 2 },
  { id: 'bamberg', name: 'Bamberg', tier: 2, penalty: 2.2 },
  { id: 'nuernberg', name: 'Nürnberg Hbf', tier: 3, penalty: 2.4 },
  { id: 'ingolstadt', name: 'Ingolstadt Hbf', tier: 3, penalty: 2.6 },
  { id: 'muenchen', name: 'München Hbf', tier: 3, penalty: 2.75 },
]
