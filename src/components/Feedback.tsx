import { getChoice } from '../game/engine'
import { getIncident } from '../game/incidents'
import { STATIONS } from '../game/stations'
import { STATUS_DEFINITIONS } from '../game/statuses'
import { getExcuse } from '../game/excuses'
import type { AnnouncementRecord, ChoiceKind, DecisionRecord, ResourceEffects, StatusId } from '../game/types'
import { deltaParts, KIND_LABELS, verdict } from './labels'

/** Änderungen als farbige Liste, z. B. „+3 Min · −8 Zufriedenheit“. */
export function DeltaList({ effects, empty = '±0' }: { effects: ResourceEffects; empty?: string }) {
  const parts = deltaParts(effects)
  if (parts.length === 0) return <span className="text-white/55">{empty}</span>
  return (
    <span className="font-board">
      {parts.map((part, index) => (
        <span key={part.key}>
          {index > 0 && <span className="text-white/50"> · </span>}
          <span className={part.bad ? 'text-board-red' : 'text-board-green'}>{part.text}</span>
        </span>
      ))}
    </span>
  )
}

const KIND_STYLES: Record<ChoiceKind, string> = {
  safe: 'border-board-green/60 text-board-green',
  risky: 'border-board-red/70 text-board-red',
  strategic: 'border-sky-300/60 text-sky-300',
}

export function KindBadge({ kind, children }: { kind: ChoiceKind; children?: string }) {
  return (
    <span className={`inline-block rounded border px-1.5 py-0.5 font-board text-[11px] leading-none whitespace-nowrap uppercase ${KIND_STYLES[kind]}`}>
      {children ?? KIND_LABELS[kind]}
    </span>
  )
}

export function VerdictBadge({ record }: { record: Pick<DecisionRecord, 'kind' | 'success'> }) {
  const { text, good } = verdict(record)
  const style = good === null ? 'bg-white/10 text-white/80' : good ? 'bg-board-green/15 text-board-green' : 'bg-board-red/15 text-board-red'
  return <span className={`inline-block rounded px-1.5 py-0.5 font-board text-[11px] leading-none uppercase ${style}`}>{text}</span>
}

/** Neue, behobene und abgeklungene Probleme einer Entscheidung. */
export function StatusChanges({ record }: { record: DecisionRecord }) {
  const rows: { id: StatusId; label: string; className: string }[] = [
    ...record.statusesAdded.map((id) => ({ id, label: 'Neues Problem', className: 'text-board-red' })),
    ...record.statusesRenewed.map((id) => ({ id, label: 'Verschärft (Dauer beginnt neu)', className: 'text-board-red' })),
    ...record.statusesCured.map((id) => ({ id, label: 'Behoben', className: 'text-board-green' })),
    ...record.statusesExpired.map((id) => ({ id, label: 'Abgeklungen', className: 'text-white/60' })),
  ]
  if (rows.length === 0) return null
  return (
    <ul className="space-y-1 text-sm">
      {rows.map((row) => (
        <li key={`${row.label}-${row.id}`}>
          <span className={`font-board font-bold ${row.className}`}>{row.label}:</span>{' '}
          <span className="text-white/90">{STATUS_DEFINITIONS[row.id].label}</span>
        </li>
      ))}
    </ul>
  )
}

/** Fahrtprotokoll: was passiert ist, was gewählt wurde, wie es ausging und was es gekostet hat. */
const PLAUSIBILITY_SHORT = { perfekt: 'passt perfekt', plausibel: 'passt', neutral: 'Allzweck', unglaubwuerdig: 'unglaubwürdig' } as const

interface EventLogProps {
  history: DecisionRecord[]
  announcements?: AnnouncementRecord[]
  newestFirst?: boolean
}

export function EventLog({ history, announcements = [], newestFirst = false }: EventLogProps) {
  if (history.length === 0) return null
  const records = newestFirst ? [...history].reverse() : history
  return (
    <ol className="space-y-2">
      {records.map((record) => {
        const incident = getIncident(record.incidentId)
        const choice = incident && getChoice(incident, record.choiceId)
        const total = {
          delay: record.after.delay - record.before.delay,
          satisfaction: record.after.satisfaction - record.before.satisfaction,
          condition: record.after.condition - record.before.condition,
        }
        const announcement = announcements.find((a) => a.eventIndex === record.eventIndex)
        return (
          <li key={record.eventIndex} className="rounded border border-board-line/70 p-3 text-sm">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="font-board text-white/50">{STATIONS[record.stationIndex].name}</span>
              <span className="font-bold text-white">{incident?.title}</span>
              {incident?.trigger && <span className="font-board text-[11px] text-board-red uppercase">Folgeereignis</span>}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-board-yellow">{choice?.label}</span>
              <KindBadge kind={record.kind} />
              <VerdictBadge record={record} />
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
              <DeltaList effects={total} empty="keine Änderung" />
              {[...record.statusesAdded, ...record.statusesRenewed].map((id) => (
                <span key={id} className="font-board text-board-red">
                  + {STATUS_DEFINITIONS[id].label}
                </span>
              ))}
              {record.statusesCured.map((id) => (
                <span key={id} className="font-board text-board-green">
                  ✓ {STATUS_DEFINITIONS[id].label} behoben
                </span>
              ))}
            </div>
            {announcement && (
              <div className="mt-1 flex flex-wrap gap-x-2 text-white/70">
                <span>🔊 {getExcuse(announcement.cardId)?.name}</span>
                <span className={`font-board ${announcement.plausibility === 'unglaubwuerdig' ? 'text-board-red' : 'text-white/50'}`}>
                  ({PLAUSIBILITY_SHORT[announcement.plausibility]})
                </span>
                <DeltaList effects={{ satisfaction: announcement.after.satisfaction - announcement.before.satisfaction }} />
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
