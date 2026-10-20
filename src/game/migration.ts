/**
 * Einmalige Übernahme von Spielständen aus der Zeit vor der Umbenennung.
 *
 * Früher lagen alle Daten unter `db-game:*`. Jetzt heißen die Schlüssel `endstation:*`.
 * Die Übernahme ist idempotent: Sie kopiert nur, wenn unter dem neuen Schlüssel noch nichts liegt,
 * prüft die Kopie und löscht den alten Schlüssel erst danach. Inhalte werden nicht verändert.
 */

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export const LEGACY_KEYS = {
  run: 'db-game:active-run',
  settings: 'db-game:settings',
  tutorial: 'db-game:tutorial',
} as const

export const CURRENT_KEYS = {
  run: 'endstation:active-run',
  settings: 'endstation:settings',
  tutorial: 'endstation:tutorial',
} as const

export type MigrationOutcome = 'migrated' | 'nothing-to-do' | 'kept-current' | 'failed'

function isJson(raw: string): boolean {
  try {
    JSON.parse(raw)
    return true
  } catch {
    return false
  }
}

function migrateKey(storage: StorageLike, from: string, to: string): MigrationOutcome {
  const legacy = storage.getItem(from)
  if (legacy === null) return 'nothing-to-do'
  const current = storage.getItem(to)
  if (current !== null) {
    // Neue Daten haben Vorrang. Den alten Stand nur wegräumen, wenn er schon vollständig übernommen ist.
    if (current === legacy) storage.removeItem(from)
    return 'kept-current'
  }
  // Unlesbare Altdaten bleiben unangetastet liegen; die Ladefunktionen hätten sie ohnehin verworfen.
  if (!isJson(legacy)) return 'failed'
  storage.setItem(to, legacy)
  // Erst wenn die Kopie nachweislich angekommen ist, darf das Original weg.
  if (storage.getItem(to) !== legacy) {
    // Halbe Kopie entfernen, damit der nächste Start es erneut versucht.
    storage.removeItem(to)
    return 'failed'
  }
  storage.removeItem(from)
  return 'migrated'
}

function defaultStorage(): StorageLike | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage
  } catch {
    return undefined
  }
}

/** Übernimmt alte Spielstände, Einstellungen und Tipps. Gefahrlos bei jedem Start aufrufbar. */
export function migrateLegacyStorage(storage = defaultStorage()): Record<keyof typeof CURRENT_KEYS, MigrationOutcome> {
  const result = { run: 'nothing-to-do', settings: 'nothing-to-do', tutorial: 'nothing-to-do' } as Record<keyof typeof CURRENT_KEYS, MigrationOutcome>
  if (!storage) return result
  for (const name of Object.keys(CURRENT_KEYS) as (keyof typeof CURRENT_KEYS)[]) {
    try {
      result[name] = migrateKey(storage, LEGACY_KEYS[name], CURRENT_KEYS[name])
    } catch {
      // Speicher gesperrt oder voll: Alte Daten bleiben, wo sie sind, und das Spiel startet trotzdem.
      result[name] = 'failed'
    }
  }
  return result
}
