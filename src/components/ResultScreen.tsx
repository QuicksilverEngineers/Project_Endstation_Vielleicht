import { getChoice } from '../game/engine'
import type { DecisionRecord, GameState, Incident } from '../game/types'
import { Card, PrimaryButton } from './Board'
import { DeltaList, KindBadge, StatusChanges } from './Feedback'
import { changeLabel, decisionMood, formatDelta, isBad, RESOURCE_KEYS, RESOURCE_LABELS, verdict } from './labels'
import { PixelIcon } from './PixelIcon'

const STAMP_STYLES = {
  good: 'border-board-green text-board-green',
  bad: 'border-board-red text-board-red',
  neutral: 'border-board-amber text-board-amber',
} as const

interface DecisionSummaryProps {
  incident: Incident
  decision: DecisionRecord
  failed: boolean
  /** Kompakt über der Durchsage: ohne Tabelle, Aufschlüsselung zum Aufklappen. */
  compact?: boolean
}

/** Was nach einer Entscheidung passiert ist: Stempel, Text, Änderungen, Probleme, Wirkung der Verbesserungen. */
export function DecisionSummary({ incident, decision, failed, compact = false }: DecisionSummaryProps) {
  const choice = getChoice(incident, decision.choiceId)
  const outcome = choice?.kind === 'risky' && !decision.success ? choice.risk.outcome : choice?.outcome
  const mood = decisionMood(decision, failed)
  // Aufschlüsselung nur zeigen, wenn mehr als die Entscheidung selbst gewirkt hat.
  const breakdown = decision.changes.filter((change) => change.source !== 'choice' || decision.changes.length > 1)
  const total = {
    delay: decision.after.delay - decision.before.delay,
    satisfaction: decision.after.satisfaction - decision.before.satisfaction,
    condition: decision.after.condition - decision.before.condition,
  }
  const notes = decision.upgradeNotes ?? []

  const breakdownList = breakdown.length > 0 && (
    <ul className="mt-1 space-y-0.5 text-sm">
      {breakdown.map((change) => (
        <li key={change.source} className="flex flex-wrap gap-x-2">
          <span className="w-40 shrink-0 text-white/70">{changeLabel(change)}</span>
          <DeltaList effects={change.delta} />
        </li>
      ))}
    </ul>
  )

  return (
    <Card
      tone={mood === 'bad' ? 'bad' : mood === 'good' ? 'good' : 'default'}
      className={`relative ${mood === 'good' ? 'anim-flash-good' : mood === 'bad' ? 'anim-flash-bad anim-shake' : ''}`}
    >
      <span
        aria-hidden
        className={`anim-stamp absolute top-4 right-4 hidden rounded border-4 px-3 py-1 font-pixel tracking-widest uppercase sm:block ${compact ? 'text-xl' : 'text-2xl'} ${STAMP_STYLES[mood]}`}
      >
        {verdict(decision).text}
      </span>
      <p className="font-board text-sm text-white/60 sm:pr-52">{incident.title} · Ihre Entscheidung</p>
      <h2
        tabIndex={-1}
        data-phase-heading
        className={`mt-1 max-w-[80%] font-pixel leading-tight text-board-yellow focus:outline-none ${compact ? 'text-2xl' : 'text-3xl'}`}
      >
        {choice?.label}
      </h2>
      <div className="mt-2 flex flex-wrap gap-2">
        <KindBadge kind={decision.kind} />
        <span
          className={`rounded px-1.5 py-0.5 font-board text-[11px] leading-none uppercase ${mood === 'good' ? 'bg-board-green/15 text-board-green' : mood === 'bad' ? 'bg-board-red/15 text-board-red' : 'bg-white/10 text-white/80'}`}
        >
          {mood === 'good' ? '✓ ' : mood === 'bad' ? '✗ ' : ''}
          {verdict(decision).text}
        </span>
      </div>
      <p className="anim-enter mt-3 max-w-prose leading-relaxed text-white/90">{outcome}</p>

      {compact ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="text-white/60">Insgesamt:</span>
          <DeltaList effects={total} empty="keine Änderung" />
        </div>
      ) : (
        <table className="mt-6 w-full max-w-lg font-board text-sm">
          <thead>
            <tr className="text-left text-white/55">
              <th className="py-1 font-normal">Auswirkung</th>
              <th className="py-1 text-right font-normal">vorher</th>
              <th className="py-1 text-right font-normal">Änderung</th>
              <th className="py-1 text-right font-normal">jetzt</th>
            </tr>
          </thead>
          <tbody>
            {RESOURCE_KEYS.map((key, index) => {
              const diff = decision.after[key] - decision.before[key]
              const unit = key === 'delay' ? ' Min' : ''
              return (
                <tr key={key} className="anim-enter border-t border-board-line" style={{ animationDelay: `${120 + index * 80}ms` }}>
                  <td className="py-2 text-white/80">{RESOURCE_LABELS[key]}</td>
                  <td className="py-2 text-right text-white/60">{decision.before[key]}</td>
                  <td className={`py-2 text-right font-semibold ${diff === 0 ? 'text-white/55' : isBad(key, diff) ? 'text-board-red' : 'text-board-green'}`}>
                    {diff === 0 ? '±0' : formatDelta(diff, unit)}
                  </td>
                  <td className="py-2 text-right">{decision.after[key]}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {breakdownList &&
        (compact ? (
          <details className="mt-2">
            <summary className="cursor-pointer font-board text-xs text-white/60">Woher kommt das?</summary>
            {breakdownList}
          </details>
        ) : (
          <div className="mt-4">
            <h3 className="font-board text-xs tracking-widest text-white/55 uppercase">Zusammensetzung</h3>
            {breakdownList}
          </div>
        ))}

      {notes.length > 0 && (
        <ul className="mt-3 space-y-0.5 text-sm" aria-label="Wirkung Ihrer Verbesserungen">
          {notes.map((note) => (
            <li key={note} className="flex items-center gap-1.5 text-board-yellow">
              <PixelIcon name="star" size={12} />
              {note}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3">
        <StatusChanges record={decision} />
      </div>
    </Card>
  )
}

interface ResultScreenProps {
  state: GameState
  incident: Incident
  decision: DecisionRecord
  onContinue: () => void
}

/**
 * Eigener Ergebnisbildschirm. Im normalen Ablauf erscheint das Ergebnis direkt über der Durchsage;
 * dieser Bildschirm bleibt für das Fahrtende (und für ältere Spielstände in der Ergebnisphase).
 */
export function ResultScreen({ state, incident, decision, onContinue }: ResultScreenProps) {
  const failed = state.failures.length > 0
  return (
    <div className="space-y-4">
      <DecisionSummary incident={incident} decision={decision} failed={failed} />
      {failed && (
        <p className="rounded border-2 border-board-red bg-board-red/10 p-3 font-board text-board-red" role="alert">
          ✗ Das war’s. Diese Fahrt endet hier. Bitte alle aussteigen.
        </p>
      )}
      <PrimaryButton onClick={onContinue} hint="Enter">
        {failed ? 'Weiter' : 'Zur Durchsage'}
      </PrimaryButton>
    </div>
  )
}
