import type { GameState, UpgradeDefinition, UpgradeId } from './types'

/** Alle Verbesserungen. Die Wirkung ist jeweils in der Spiellogik umgesetzt (siehe Verweise). */
export const UPGRADES: Record<UpgradeId, UpgradeDefinition> = {
  'durchsage-profi': {
    id: 'durchsage-profi',
    name: 'Durchsage-Profi',
    description: 'Ausreden bringen pro Stufe 25 % mehr Zufriedenheit zurück.',
    maxStacks: 2,
  },
  pressesprecher: {
    id: 'pressesprecher',
    name: 'PÜNKT-Pressesprecher',
    description: 'Unpassende Ausreden kosten nur halb so viel Zufriedenheit und Glaubwürdigkeit, Allzweck-Ausreden bringen +2 Zufriedenheit.',
    maxStacks: 1,
  },
  'wunder-mechaniker': {
    id: 'wunder-mechaniker',
    name: 'Wunder-Mechaniker',
    description: 'Bei jeder Ankunft 35 % Chance auf +8 Zugzustand.',
    maxStacks: 1,
  },
  'bistro-flatrate': {
    id: 'bistro-flatrate',
    name: 'Bordbistro-Flatrate',
    description: 'Kostet eine Entscheidung 3 Minuten oder mehr, gibt es Freigetränke: +2 Zufriedenheit.',
    maxStacks: 1,
  },
  ersatzbus: {
    id: 'ersatzbus',
    name: 'Ersatzbus-Garantie',
    description: 'Einmal pro Fahrt: Erreicht die Verspätung 30 Minuten, übernimmt ein Ersatzbus. Die Verspätung sinkt auf 24 Minuten.',
    maxStacks: 1,
  },
  'schuld-andere': {
    id: 'schuld-andere',
    name: 'Schuld sind die anderen',
    description: 'Ausreden, die äußere Umstände verantwortlich machen, wirken 60 % stärker.',
    maxStacks: 1,
  },
  'legendaerer-schaffner': {
    id: 'legendaerer-schaffner',
    name: 'Legendärer Schaffner',
    description: 'Bei Fahrgast-Vorfällen verlieren Sie 30 % weniger Zufriedenheit.',
    maxStacks: 1,
  },
  'werkstatt-abo': {
    id: 'werkstatt-abo',
    name: 'Werkstatt-Abo',
    description: 'Pro Stufe +2 Zugzustand bei jeder Ankunft.',
    maxStacks: 3,
  },
  bahnbonus: {
    id: 'bahnbonus',
    name: 'PÜNKTchen-Treuepunkte',
    description: 'Pro Stufe +2 Zufriedenheit bei jeder Ankunft.',
    maxStacks: 3,
  },
  'dickes-fell': {
    id: 'dickes-fell',
    name: 'Dickes Fell',
    description: 'Laufende Probleme kosten je Ereignis 1 Punkt bzw. 1 Minute weniger.',
    maxStacks: 1,
  },
  zocker: {
    id: 'zocker',
    name: 'Zocker-Lokführer',
    description: 'Riskante Optionen gehen 10 Prozentpunkte seltener schief.',
    maxStacks: 1,
  },
  'seriose-stimme': {
    id: 'seriose-stimme',
    name: 'Seriöse Stimme',
    description: 'Sofort +20 Glaubwürdigkeit; Gewinne an Glaubwürdigkeit fallen um 50 % höher aus.',
    maxStacks: 1,
  },
  repertoire: {
    id: 'repertoire',
    name: 'Großes Repertoire',
    description: 'Sie ziehen bei jeder Durchsage 5 statt 3 Ausreden.',
    maxStacks: 1,
  },
  pressemappe: {
    id: 'pressemappe',
    name: 'Pressemappe',
    description: 'Zwei zufällige seltene oder epische Ausreden kommen sofort in Ihr Deck.',
    maxStacks: 3,
  },
  notfallplan: {
    id: 'notfallplan',
    name: 'Notfallplan',
    description: 'Folgeereignisse werden nur halb so oft ausgelöst.',
    maxStacks: 1,
  },
  fruehwarnung: {
    id: 'fruehwarnung',
    name: 'Frühwarnsystem',
    description: 'Neue Probleme halten ein Ereignis kürzer an.',
    maxStacks: 1,
  },
  'fahrplan-puffer': {
    id: 'fahrplan-puffer',
    name: 'Großzügiger Fahrplan',
    description: 'Die Fahrzeitreserve beträgt 3 statt 2 Minuten je Streckenabschnitt.',
    maxStacks: 1,
  },
}

export const UPGRADE_IDS = Object.keys(UPGRADES) as UpgradeId[]

export function isUpgradeId(value: unknown): value is UpgradeId {
  return typeof value === 'string' && value in UPGRADES
}

/** Kombinationen aus Verbesserung und Ausrede bzw. Vorfallsart mit Zusatzwirkung. */
export interface Synergy {
  id: string
  upgrade: UpgradeId
  /** Betroffene Ausrede (falls die Synergie an einer Karte hängt). */
  card?: string
  name: string
  description: string
}

export const SYNERGIES: readonly Synergy[] = [
  {
    id: 'profi-verstaendnis',
    upgrade: 'durchsage-profi',
    card: 'verstaendnis',
    name: 'Routinierte Demut',
    description: '„Wir bitten um Verständnis“ wirkt doppelt so stark.',
  },
  {
    id: 'sprecher-betriebsablauf',
    upgrade: 'pressesprecher',
    card: 'betriebsablauf',
    name: 'Sprachregelung',
    description: '„Verzögerungen im Betriebsablauf“ nutzt sich nicht mehr ab.',
  },
  {
    id: 'mechaniker-technik',
    upgrade: 'wunder-mechaniker',
    name: 'Schrauber-Instinkt',
    description: 'Bei Technik-Vorfällen bringen Reparaturen 50 % mehr Zugzustand, riskante Optionen gehen 10 Prozentpunkte seltener schief.',
  },
  {
    id: 'mechaniker-reparatur',
    upgrade: 'wunder-mechaniker',
    card: 'reparatur',
    name: 'Er repariert wirklich',
    description: '„Reparatur am Zug“ bringt zusätzlich +5 Zugzustand.',
  },
  {
    id: 'andere-gewalt',
    upgrade: 'schuld-andere',
    card: 'hoehere-gewalt',
    name: 'Alles höhere Gewalt',
    description: '„Höhere Gewalt“ passt zusätzlich zu Betrieb und Sicherheit.',
  },
  {
    id: 'schaffner-aufkommen',
    upgrade: 'legendaerer-schaffner',
    card: 'aufkommen',
    name: 'Platz da!',
    description: '„Hohes Fahrgastaufkommen“ behebt eine Überfüllung sofort vollständig.',
  },
  {
    id: 'stimme-behoerde',
    upgrade: 'seriose-stimme',
    card: 'behoerdlich',
    name: 'Amtlicher Tonfall',
    description: '„Behördliche Maßnahmen“ bringt zusätzlich +10 Glaubwürdigkeit.',
  },
]

export function upgradeStacks(state: Pick<GameState, 'upgrades'>, id: UpgradeId): number {
  return state.upgrades.find((u) => u.id === id)?.stacks ?? 0
}

export function hasUpgrade(state: Pick<GameState, 'upgrades'>, id: UpgradeId): boolean {
  return upgradeStacks(state, id) > 0
}

export function hasSynergy(state: Pick<GameState, 'upgrades'>, synergyId: string): boolean {
  const synergy = SYNERGIES.find((s) => s.id === synergyId)
  return synergy !== undefined && hasUpgrade(state, synergy.upgrade)
}

/** Aktive Synergien, optional nur die einer bestimmten Karte. */
export function activeSynergies(state: Pick<GameState, 'upgrades'>, cardId?: string): Synergy[] {
  return SYNERGIES.filter((s) => hasUpgrade(state, s.upgrade) && (cardId === undefined || s.card === cardId))
}

/** Verbesserungen, die noch angeboten werden dürfen. */
export function availableUpgrades(state: Pick<GameState, 'upgrades'>): UpgradeId[] {
  return UPGRADE_IDS.filter((id) => upgradeStacks(state, id) < UPGRADES[id].maxStacks)
}
