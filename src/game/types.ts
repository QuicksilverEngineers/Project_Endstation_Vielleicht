/** Die drei Ressourcen, die der Zugchef verwaltet. */
export interface Resources {
  /** Verspätung in Minuten. Ab DELAY_LIMIT ist das Spiel verloren. */
  delay: number
  /** Fahrgastzufriedenheit, 0–100. Bei 0 ist das Spiel verloren. */
  satisfaction: number
  /** Zugzustand, 0–100. Bei 0 ist das Spiel verloren. */
  condition: number
}

export type ResourceKey = keyof Resources

/** Relative Änderungen an den Ressourcen. Fehlende Werte bedeuten 0. */
export type ResourceEffects = Partial<Resources>

/** Anhaltende Probleme, die nach einer Entscheidung im Zug bleiben. */
export type StatusId = 'hitze' | 'ueberfuellung' | 'technikschaden' | 'erschoepfung'

/** Themenbereiche von Vorfällen und Ausreden. Passt beides zusammen, wirkt die Ausrede glaubwürdig. */
export type Category = 'technik' | 'fahrgaeste' | 'infrastruktur' | 'wetter' | 'personal' | 'sicherheit' | 'betrieb'

/**
 * - safe: feste, vorhersehbare Auswirkungen.
 * - risky: mit einer Wahrscheinlichkeit geht es schief, sonst läuft es besser als „sicher“.
 * - strategic: die Kosten landen bewusst auf einer einzigen Ressource, um die anderen zu schonen.
 */
export type ChoiceKind = 'safe' | 'risky' | 'strategic'

/** Was nach einer Entscheidung passiert. */
export interface Consequence {
  /** Grundwerte; Nachteile werden je nach Station verstärkt (siehe stations.ts). */
  effects: ResourceEffects
  /** Kurzer Text, der nach der Auswahl angezeigt wird. */
  outcome: string
  /** Probleme, die durch diese Entscheidung entstehen. */
  causes?: StatusId[]
  /** Probleme, die durch diese Entscheidung behoben werden. */
  cures?: StatusId[]
}

interface BaseChoice extends Consequence {
  id: string
  label: string
}

export interface SafeChoice extends BaseChoice {
  kind: 'safe'
}

export interface StrategicChoice extends BaseChoice {
  kind: 'strategic'
}

export interface RiskyChoice extends BaseChoice {
  kind: 'risky'
  /** Fehlschlag: tritt mit `chance` ein und ersetzt die Grundwerte vollständig. */
  risk: Consequence & { chance: number }
}

export type Choice = SafeChoice | StrategicChoice | RiskyChoice

/** 1 = Einstieg, 3 = schwer. */
export type Tier = 1 | 2 | 3

export interface Incident {
  id: string
  title: string
  description: string
  tier: Tier
  /** Themenbereiche, der erste ist der Hauptbereich. */
  categories: Category[]
  /** Genau drei Lösungsmöglichkeiten. */
  choices: [Choice, Choice, Choice]
  /**
   * Nur bei Folgeereignissen: Sie werden nie regulär gezogen, sondern können nur durch ein
   * aktives Problem ausgelöst werden.
   */
  trigger?: { status: StatusId; chance: number }
}

export interface Station {
  id: string
  name: string
  /** Aus welcher Schwierigkeitsstufe der reguläre Vorfall dieser Station stammt. */
  tier: Tier
  /** Faktor für Nachteile an dieser Station. Vorteile bleiben unverändert. */
  penalty: number
}

export interface StatusDefinition {
  id: StatusId
  label: string
  description: string
  /** Wird bei jeder Entscheidung angewendet, solange das Problem besteht. */
  tick: ResourceEffects
  /** Wie viele Entscheidungen das Problem anhält, wenn es nicht behoben wird. */
  duration: number
}

export interface ActiveStatus {
  id: StatusId
  remaining: number
  /** Kettentiefe des Ereignisses, das das Problem verursacht hat. */
  depth: number
}

/** Ein Ereignis im Fahrtverlauf. Folgeereignisse werden vor dem regulären Vorfall eingeschoben. */
export interface ScheduledEvent {
  stationIndex: number
  incidentId: string
  /** 0 = regulärer Vorfall, ab 1 = Folgeereignis. */
  depth: number
  /** Auslöser eines Folgeereignisses. */
  cause?: StatusId
}

export type FailureReason = 'delay' | 'satisfaction' | 'condition'

/**
 * Ablauf eines Ereignisses: incident → result → announcement → announced, danach bei Ankunft an
 * einer neuen Station upgrade, sonst direkt das nächste incident. Am Ende victory oder gameover.
 */
export type GamePhase = 'incident' | 'result' | 'announcement' | 'announced' | 'upgrade' | 'victory' | 'gameover'

/** Woher eine Ressourcenänderung stammt: die Entscheidung, ein laufendes Problem oder die Fahrzeitreserve. */
export interface ResourceChange {
  source: 'choice' | 'reserve' | 'ersatzbus' | 'bistro' | StatusId
  /** Tatsächlich angewendete Änderung (nach Begrenzung auf die Grenzwerte). */
  delta: Resources
}

/** Eine getroffene Entscheidung mit den tatsächlich angewendeten Werten. */
export interface DecisionRecord {
  eventIndex: number
  stationIndex: number
  incidentId: string
  choiceId: string
  kind: ChoiceKind
  /** Bei riskanten Entscheidungen: ob es gutgegangen ist. Sonst immer true. */
  success: boolean
  before: Resources
  after: Resources
  changes: ResourceChange[]
  statusesAdded: StatusId[]
  /** Bereits bestehende Probleme, deren Dauer erneut beginnt. */
  statusesRenewed: StatusId[]
  statusesCured: StatusId[]
  statusesExpired: StatusId[]
  /** Wie Verbesserungen diese Entscheidung verändert haben, in Worten (fehlt in älteren Spielständen). */
  upgradeNotes?: string[]
}

// ── Ausreden ────────────────────────────────────────────────────────────────────────

export type Rarity = 'common' | 'rare' | 'epic'

export interface ExcuseCard {
  id: string
  name: string
  rarity: Rarity
  /** Passende Themenbereiche. `'all'` = universell: passt immer, aber nie perfekt. */
  categories: Category[] | 'all'
  /** Grundwert der Zufriedenheit, die eine passende Durchsage zurückbringt. */
  power: number
  /** Wirkungsverlust je früherer Nutzung in dieser Fahrt (0.25 = −25 % pro Nutzung). */
  decay: number
  /** Schiebt die Schuld auf äußere Umstände (wichtig für „Schuld sind die anderen“). */
  external?: boolean
  /** Zusatzwirkung bei einem bestimmten aktiven Problem oder Themenbereich. */
  bonus?: { status?: StatusId; category?: Category; multiplier: number; label: string }
  /** Eine glaubwürdige Durchsage lässt dieses Problem ein Ereignis früher abklingen. */
  eases?: StatusId
  /** Faktor für Strafen bei unpassendem Einsatz (Standard 1). */
  mismatchPenalty?: number
  /** Ansagetexte; Platzhalter: {station}, {next}, {minutes}, {incident}. */
  templates: string[]
}

/** Wie gut eine Ausrede zum Vorfall passt. */
export type Plausibility = 'perfekt' | 'plausibel' | 'neutral' | 'unglaubwuerdig'

export interface DeckState {
  drawPile: string[]
  hand: string[]
  discard: string[]
  /** Wie oft der Ablagestapel schon neu gemischt wurde (für den Seed-Zufall). */
  shuffles: number
}

export interface AnnouncementRecord {
  eventIndex: number
  cardId: string
  plausibility: Plausibility
  /** Ausgeschriebene Durchsage. */
  text: string
  /** Reaktion im Zug, z. B. bei unglaubwürdigen oder abgenutzten Ausreden. */
  reaction?: string
  before: Resources
  after: Resources
  credibilityBefore: number
  credibilityAfter: number
  eased?: StatusId
  /** Erklärung der Berechnung in Worten, z. B. „Passt perfekt zu Technik ×1,5“. */
  notes: string[]
}

// ── Verbesserungen ───────────────────────────────────────────────────────────────────

export type UpgradeId =
  | 'durchsage-profi'
  | 'pressesprecher'
  | 'wunder-mechaniker'
  | 'bistro-flatrate'
  | 'ersatzbus'
  | 'schuld-andere'
  | 'legendaerer-schaffner'
  | 'werkstatt-abo'
  | 'bahnbonus'
  | 'dickes-fell'
  | 'zocker'
  | 'seriose-stimme'
  | 'repertoire'
  | 'pressemappe'
  | 'notfallplan'
  | 'fruehwarnung'
  | 'fahrplan-puffer'

export interface UpgradeDefinition {
  id: UpgradeId
  name: string
  description: string
  /** 1 = einzigartig, sonst wie oft man es höchstens besitzen kann. */
  maxStacks: number
}

export interface OwnedUpgrade {
  id: UpgradeId
  stacks: number
}

/** Was bei der Ankunft an einer Station durch Verbesserungen passiert ist. */
export interface ArrivalRecord {
  stationIndex: number
  changes: { source: UpgradeId; delta: Resources }[]
  /** Weitere Wirkungen bei der Ankunft, z. B. ein verhindertes Folgeereignis. */
  notes?: string[]
}

export interface GameState {
  version: 3
  seed: string
  phase: GamePhase
  /** Index in STATIONS, an dem der Zug gerade steht. */
  stationIndex: number
  /** Index in `events` des aktuellen Ereignisses. */
  eventIndex: number
  resources: Resources
  /** Glaubwürdigkeit der Durchsagen, 0–100. Kein Verlustgrund, aber sie verstärkt oder schwächt Ausreden. */
  credibility: number
  /** Fahrtverlauf; beim Start ein regulärer Vorfall je Station, Folgeereignisse kommen dazu. */
  events: ScheduledEvent[]
  statuses: ActiveStatus[]
  deck: DeckState
  /** Wie oft jede Ausrede in dieser Fahrt schon benutzt wurde. */
  cardUses: Record<string, number>
  upgrades: OwnedUpgrade[]
  /** Angebot in der Phase `upgrade`. */
  upgradeOffer: UpgradeId[]
  /** Die Ersatzbus-Garantie wurde in dieser Fahrt schon eingelöst. */
  ersatzbusUsed: boolean
  /** Karten, die durch Verbesserungen ins Deck kamen, in Reihenfolge. */
  rewards: string[]
  history: DecisionRecord[]
  announcements: AnnouncementRecord[]
  arrivals: ArrivalRecord[]
  failures: FailureReason[]
}
