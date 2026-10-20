import { DELAY_LIMIT } from '../game/constants'
import { riskLevel } from '../game/engine'
import { getIncident } from '../game/incidents'
import { STATUS_DEFINITIONS } from '../game/statuses'
import type { Choice, ChoiceKind, DecisionRecord, FailureReason, ResourceChange, ResourceEffects, ResourceKey } from '../game/types'

export const RESOURCE_LABELS: Record<ResourceKey, string> = {
  delay: 'Verspätung',
  satisfaction: 'Fahrgastzufriedenheit',
  condition: 'Zugzustand',
}

/** Kurzformen für Aufzählungen von Änderungen. */
const SHORT_LABELS: Record<ResourceKey, string> = {
  delay: 'Min',
  satisfaction: 'Zufriedenheit',
  condition: 'Zustand',
}

export const RESOURCE_KEYS: ResourceKey[] = ['delay', 'satisfaction', 'condition']

export const FAILURE_TEXTS: Record<FailureReason, { title: string; text: string }> = {
  delay: {
    title: `Verspätung ab ${DELAY_LIMIT} Minuten`,
    text: 'Ihr Zug wird aus dem Fahrplan genommen und endet hier. Die Fahrgäste werden gebeten, auf den nächsten Zug auszuweichen. Dieser hat ebenfalls 30 Minuten Verspätung und endet ebenfalls hier.',
  },
  satisfaction: {
    title: 'Fahrgastzufriedenheit bei 0',
    text: 'Die Fahrgäste haben den Zug verlassen und eine Fahrgemeinschaft gegründet. Sie hat einen Gruppenchat, eine Satzung und schon jetzt eine bessere Pünktlichkeitsquote als Sie.',
  },
  condition: {
    title: 'Zugzustand bei 0',
    text: 'Der Zug bleibt mit einem letzten Seufzer stehen und wird ins Werk geschleppt. Sie werden zu einem Gespräch gebeten. Der Termin ist, ausnahmsweise, pünktlich.',
  },
}

export const CHOICE_LETTERS = ['A', 'B', 'C'] as const

export const KIND_LABELS: Record<ChoiceKind, string> = {
  safe: 'Sicher',
  risky: 'Riskant',
  strategic: 'Strategisch',
}

export const KIND_HINTS: Record<ChoiceKind, string> = {
  safe: 'Vorhersehbar, mit überschaubaren Nachteilen.',
  risky: 'Kann glimpflich ausgehen – oder richtig schiefgehen.',
  strategic: 'Opfert gezielt eine Ressource, um die anderen zu schonen.',
}

/** Text für das Etikett einer Option vor der Wahl. Der Ausgang bleibt verborgen. */
export function choiceTag(choice: Choice): string {
  return choice.kind === 'risky' ? `${KIND_LABELS.risky} · Risiko ${riskLevel(choice.risk.chance)}` : KIND_LABELS[choice.kind]
}

/** Wie eine Entscheidung ausgegangen ist, in Worten. */
export function verdict(record: Pick<DecisionRecord, 'kind' | 'success'>): { text: string; good: boolean | null } {
  if (record.kind === 'risky') return record.success ? { text: 'Gutgegangen', good: true } : { text: 'Schiefgegangen', good: false }
  return { text: record.kind === 'safe' ? 'Wie erwartet' : 'Bewusst geopfert', good: null }
}

export type Mood = 'good' | 'bad' | 'neutral'

/** Stimmung eines Ergebnisses für Farbe, Animation und Klang. */
export function decisionMood(record: Pick<DecisionRecord, 'kind' | 'success'>, failed: boolean): Mood {
  if (failed || (record.kind === 'risky' && !record.success)) return 'bad'
  if (record.kind === 'risky' || record.kind === 'safe') return 'good'
  return 'neutral'
}

export function formatDelay(minutes: number): string {
  return minutes === 0 ? 'pünktlich' : `+${minutes} Min`
}

export function formatDelta(value: number, unit = ''): string {
  return `${value > 0 ? '+' : ''}${value}${unit}`
}

/** Bei der Verspätung ist ein Plus schlecht, bei den anderen Werten ein Minus. */
export function isBad(key: ResourceKey, value: number): boolean {
  return key === 'delay' ? value > 0 : value < 0
}

export interface DeltaPart {
  key: ResourceKey
  text: string
  bad: boolean
}

/** Zerlegt Änderungen in lesbare Teile, z. B. „+3 Min“, „−8 Zufriedenheit“. Nullwerte entfallen. */
export function deltaParts(effects: ResourceEffects): DeltaPart[] {
  return RESOURCE_KEYS.filter((key) => (effects[key] ?? 0) !== 0).map((key) => {
    const value = effects[key]!
    const text = key === 'delay' ? `${formatDelta(value)} Min` : `${formatDelta(value)} ${SHORT_LABELS[key]}`
    // Pfeil zeigt die Richtung auch ohne Farbe: ▲ mehr, ▼ weniger.
    return { key, text: `${value > 0 ? '▲' : '▼'} ${text.replace('-', '−')}`, bad: isBad(key, value) }
  })
}

export function changeLabel(change: ResourceChange): string {
  if (change.source === 'choice') return 'Ihre Entscheidung'
  if (change.source === 'reserve') return 'Fahrzeitreserve'
  if (change.source === 'bistro') return 'Bordbistro-Flatrate'
  if (change.source === 'ersatzbus') return 'Ersatzbus-Garantie'
  return STATUS_DEFINITIONS[change.source].label
}

export function incidentTitle(id: string): string {
  return getIncident(id)?.title ?? id
}
