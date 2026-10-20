/** Wandelt einen beliebigen Seed-String in eine 32-Bit-Zahl um (FNV-1a). */
export function hashSeed(seed: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** Deterministischer Zufallsgenerator (mulberry32). Liefert Werte in [0, 1). */
export function createRng(seed: string): () => number {
  let a = hashSeed(seed)
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Fisher-Yates-Mischung mit gegebenem Zufallsgenerator; das Original bleibt unverändert. */
export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** Zufälliger Seed für eine neue Fahrt (nicht deterministisch, nur für die UI). */
export function randomSeed(): string {
  return String(Math.floor(Math.random() * 900000) + 100000)
}

/**
 * Deterministischer Zufallswert für einen bestimmten Zweck an einer bestimmten Stelle der Fahrt.
 * So braucht der Spielstand keinen Generatorzustand, und Laden/Fortsetzen ändert nichts am Ausgang.
 */
export function rollFor(seed: string, purpose: string, index: number): number {
  return createRng(`${seed}|${purpose}|${index}`)()
}

/** Seed-Zufall für einen ganzen Ablauf (z. B. Mischen), abgeleitet wie rollFor. */
export function rngFor(seed: string, purpose: string, index: number): () => number {
  return createRng(`${seed}|${purpose}|${index}`)
}
