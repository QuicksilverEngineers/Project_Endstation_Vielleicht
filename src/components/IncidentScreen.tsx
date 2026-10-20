import { playSound } from '../audio/sound'
import { CATEGORY_LABELS } from '../game/excuses'
import { getCurrentEvent, riskChance, riskLevel } from '../game/engine'
import { STATIONS } from '../game/stations'
import { STATUS_DEFINITIONS } from '../game/statuses'
import type { Choice, GameState, Incident } from '../game/types'
import { UPGRADES } from '../game/upgrades'
import { Card, KeyHint } from './Board'
import { DeltaList, KindBadge } from './Feedback'
import { activeModifiers, isFirstEventAtStation, riskPercent } from './modifiers'
import { CHOICE_LETTERS, KIND_HINTS, KIND_LABELS } from './labels'
import { PixelIcon } from './PixelIcon'

interface IncidentScreenProps {
  state: GameState
  incident: Incident
  onChoose: (choiceId: string) => void
}

const DIFFICULTY = ['', 'leicht', 'mittel', 'schwer'] as const

function tag(state: GameState, incident: Incident, choice: Choice): string {
  if (choice.kind !== 'risky') return KIND_LABELS[choice.kind]
  const chance = riskChance(state, incident, choice)
  return `${KIND_LABELS.risky} · Risiko ${riskLevel(chance)} (${riskPercent(chance)})`
}

const LEVEL_PIPS = { gering: 1, mittel: 2, hoch: 3 } as const

/** Drei Kästchen für die Risikostufe: zusätzlich zur Farbe und zum Text. */
function RiskPips({ chance }: { chance: number }) {
  const filled = LEVEL_PIPS[riskLevel(chance)]
  return (
    <span className="flex gap-0.5" aria-hidden>
      {[1, 2, 3].map((i) => (
        <span key={i} className={`h-2 w-2 rounded-[1px] ${i <= filled ? 'bg-board-red' : 'bg-board-line'}`} />
      ))}
    </span>
  )
}

export function IncidentScreen({ state, incident, onChoose }: IncidentScreenProps) {
  const station = STATIONS[state.stationIndex]
  const event = getCurrentEvent(state)
  const cause = event.cause && STATUS_DEFINITIONS[event.cause]
  const critical = event.depth > 0 || station.tier === 3
  const remaining = STATIONS.length - 1 - state.stationIndex
  const modifiers = activeModifiers(state, incident)
  const arrival = state.arrivals.at(-1)
  const arrivalHere = isFirstEventAtStation(state) && arrival?.stationIndex === state.stationIndex ? arrival : undefined
  return (
    <Card tone={critical ? 'alarm' : 'default'} className={critical ? 'anim-shake' : ''}>
      <div className="flex flex-wrap items-center justify-between gap-2 font-board text-xs tracking-widest uppercase">
        <span className={`flex items-center gap-2 rounded px-2 py-1 ${critical ? 'bg-board-red text-board-deep' : 'bg-board-amber/20 text-board-amber'}`}>
          <PixelIcon name="warning" size={14} />
          {critical ? 'Kritische Störung' : 'Störung im Betriebsablauf'}
        </span>
        <span className="text-white/60">
          Station {state.stationIndex + 1} von {STATIONS.length} · {station.name} · Lage: {DIFFICULTY[station.tier]}
        </span>
      </div>
      <p className="mt-2 font-board text-xs text-white/60">
        {remaining === 0 ? 'Letzter Vorfall vor dem Ziel – danach Einfahrt München Hbf.' : `Noch ${remaining} Station${remaining > 1 ? 'en' : ''} bis München Hbf.`}
      </p>
      {arrivalHere && (arrivalHere.changes.length > 0 || (arrivalHere.notes ?? []).length > 0) && (
        <ul className="mt-2 space-y-0.5 text-sm" aria-label="Bei der Ankunft">
          {arrivalHere.changes.map((change) => (
            <li key={change.source} className="flex flex-wrap items-center gap-1.5">
              <PixelIcon name="star" size={12} className="text-board-yellow" />
              <span className="text-white/70">{UPGRADES[change.source].name}:</span> <DeltaList effects={change.delta} />
            </li>
          ))}
          {(arrivalHere.notes ?? []).map((note) => (
            <li key={note} className="flex items-center gap-1.5 text-board-yellow">
              <PixelIcon name="star" size={12} />
              {note}
            </li>
          ))}
        </ul>
      )}
      {cause && (
        <p className="mt-3 rounded border border-board-red/60 bg-board-red/10 px-3 py-2 font-board text-sm text-board-red">
          Folgeereignis – ausgelöst durch „{cause.label}“
        </p>
      )}
      <h2 tabIndex={-1} data-phase-heading className="mt-3 font-pixel text-4xl leading-none text-board-red text-glow-red focus:outline-none">
        ⚠ {incident.title}
      </h2>
      <p className="mt-2 flex flex-wrap gap-1">
        {incident.categories.map((c) => (
          <span key={c} className="rounded bg-white/10 px-1.5 py-0.5 font-board text-[11px] text-white/60 uppercase">
            {CATEGORY_LABELS[c]}
          </span>
        ))}
      </p>
      <p className="mt-3 max-w-prose leading-relaxed text-white/90">{incident.description}</p>
      {modifiers.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs" aria-label="Ihre Verbesserungen bei diesem Vorfall">
          <span className="font-board text-white/60 uppercase">Hier wirkt:</span>
          {modifiers.map((m) => (
            <span key={m} className="rounded border border-board-yellow/40 bg-board-yellow/10 px-1.5 py-0.5 font-board text-board-yellow">
              ★ {m}
            </span>
          ))}
        </div>
      )}
      <div className="mt-6 grid gap-3 xl:grid-cols-3">
        {incident.choices.map((choice, index) => (
          <button
            key={choice.id}
            type="button"
            data-hotkey={index + 1}
            onClick={() => {
              playSound('select')
              onChoose(choice.id)
            }}
            style={{ animationDelay: `${index * 70}ms` }}
            className="anim-enter group flex items-start gap-3 rounded-md border-2 border-board-line bg-board-deep p-4 text-left transition hover:-translate-y-0.5 hover:border-board-yellow hover:bg-board-yellow/5"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-board-yellow font-pixel text-xl text-board-deep">
              {CHOICE_LETTERS[index]}
            </span>
            <span className="flex flex-1 flex-col items-start gap-2">
              <span className="text-white">{choice.label}</span>
              <span className="flex items-center gap-2">
                <KindBadge kind={choice.kind}>{tag(state, incident, choice)}</KindBadge>
                {choice.kind === 'risky' && <RiskPips chance={riskChance(state, incident, choice)} />}
              </span>
            </span>
            <KeyHint className="text-white/60">{index + 1}</KeyHint>
          </button>
        ))}
      </div>
      {state.stationIndex < 2 && (
        <ul className="mt-4 space-y-1 text-xs text-white/50">
          {(['safe', 'risky', 'strategic'] as const).map((kind) => (
            <li key={kind}>
              <KindBadge kind={kind} /> {KIND_HINTS[kind]}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
