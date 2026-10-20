import { useEffect, useRef, useState } from 'react'
import { playSound } from '../audio/sound'
import { cardCategories, plausibilityOf } from '../game/announcements'
import { CATEGORY_LABELS, getExcuse } from '../game/excuses'
import { STATIONS } from '../game/stations'
import { STATUS_DEFINITIONS } from '../game/statuses'
import { activeSynergies } from '../game/upgrades'
import type { AnnouncementRecord, Category, DecisionRecord, ExcuseCard, GameState, Incident, Plausibility, Rarity } from '../game/types'
import { useSettings } from '../state/settings'
import { Card, KeyHint, PrimaryButton } from './Board'
import { DeltaList } from './Feedback'
import { formatDelta } from './labels'
import { PixelIcon } from './PixelIcon'
import { DecisionSummary } from './ResultScreen'

export const RARITY_LABELS: Record<Rarity, string> = { common: 'Gewöhnlich', rare: 'Selten', epic: 'Episch' }
const RARITY_STYLES: Record<Rarity, string> = {
  common: 'text-white/60',
  rare: 'text-board-sky',
  epic: 'text-board-violet',
}
const RARITY_BORDERS: Record<Rarity, string> = {
  common: 'border-board-line',
  rare: 'border-board-sky/60',
  epic: 'border-board-violet/70',
}

export const PLAUSIBILITY_LABELS: Record<Plausibility, string> = {
  perfekt: 'Passt perfekt',
  plausibel: 'Passt',
  neutral: 'Allzweck-Ausrede',
  unglaubwuerdig: 'Passt nicht',
}
const PLAUSIBILITY_STYLES: Record<Plausibility, string> = {
  perfekt: 'text-board-green',
  plausibel: 'text-board-green/80',
  neutral: 'text-white/60',
  unglaubwuerdig: 'text-board-red',
}

export function CategoryTags({ categories, highlight = [] }: { categories: Category[] | 'all'; highlight?: Category[] }) {
  if (categories === 'all') return <span className="font-board text-[11px] text-white/50 uppercase">passt zu allem</span>
  return (
    <span className="flex flex-wrap gap-1">
      {categories.map((category) => (
        <span
          key={category}
          className={`rounded px-1.5 py-0.5 font-board text-[11px] leading-none uppercase ${
            highlight.includes(category) ? 'bg-board-green/20 text-board-green' : 'bg-white/10 text-white/60'
          }`}
        >
          {highlight.includes(category) && <span aria-hidden>✓ </span>}
          {CATEGORY_LABELS[category]}
        </span>
      ))}
    </span>
  )
}

interface AnnouncementScreenProps {
  state: GameState
  incident: Incident
  /** Die Entscheidung zu diesem Vorfall; ihr Ergebnis steht kompakt über den Ausreden. */
  decision?: DecisionRecord
  onPlay: (cardId: string) => void
}

/** Phase „announcement“: eine Ausrede aus der Hand wählen. Die Karten werden ausgeteilt, die gewählte fliegt ans Mikrofon. */
export function AnnouncementScreen({ state, incident, decision, onPlay }: AnnouncementScreenProps) {
  const { reducedMotion } = useSettings()
  const [playing, setPlaying] = useState<number | null>(null)
  // Verlässt man den Bildschirm während der Animation (z. B. ins Menü), darf die Karte nicht nachträglich gespielt werden.
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  const play = (cardId: string, index: number) => {
    if (playing !== null) return
    playSound('play')
    if (reducedMotion) {
      onPlay(cardId)
      return
    }
    setPlaying(index)
    timer.current = setTimeout(() => onPlay(cardId), 260)
  }

  return (
    <div className="space-y-4">
      {decision && <DecisionSummary incident={incident} decision={decision} failed={false} compact />}
      <Card className="anim-enter">
        <p className="flex items-center gap-2 font-board text-xs tracking-widest text-board-amber uppercase">
          <PixelIcon name="speaker" size={14} />
          Durchsage · {incident.title}
        </p>
        <h2 tabIndex={-1} {...(decision ? {} : { 'data-phase-heading': true })} className="mt-2 font-pixel text-4xl leading-none text-board-yellow focus:outline-none">
          🔊 Wie erklären Sie das den Fahrgästen?
        </h2>
        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-white/70">
          Der Vorfall betrifft: <CategoryTags categories={incident.categories} highlight={incident.categories} />
        </p>
        <p className="mt-1 text-sm text-white/50">
          Passende Ausreden wirken stärker und stärken Ihre Glaubwürdigkeit. Unpassende kosten Zufriedenheit, und jede Ausrede nutzt sich ab.
        </p>
        <div className={`mt-5 grid gap-3 ${state.deck.hand.length > 3 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 xl:grid-cols-3'}`}>
          {state.deck.hand.map((cardId, index) => {
            const card = getExcuse(cardId)!
            const categories = cardCategories(state, card)
            const plausibility = plausibilityOf(categories, incident)
            const uses = state.cardUses[cardId] ?? 0
            const synergies = activeSynergies(state, cardId)
            const animation = playing === null ? 'anim-deal' : playing === index ? 'anim-play-out ring-4 ring-board-yellow' : 'anim-discard-out'
            return (
              <button
                key={`${cardId}-${index}`}
                type="button"
                data-hotkey={index + 1}
                disabled={playing !== null}
                onClick={() => play(cardId, index)}
                style={{ animationDelay: playing === null ? `${(decision ? 250 : 0) + index * 90}ms` : '0ms' }}
                className={`${animation} relative flex flex-col items-start gap-2 rounded-lg border-2 bg-board-deep p-4 text-left transition hover:-translate-y-1 hover:border-board-yellow hover:shadow-[0_6px_0_0_rgb(255_210_63/0.25)] ${RARITY_BORDERS[card.rarity]}`}
              >
                <span className="flex w-full items-center justify-between">
                  <span className={`flex items-center gap-1 font-board text-[11px] uppercase ${RARITY_STYLES[card.rarity]}`}>
                    <PixelIcon name="card" size={12} />
                    {RARITY_LABELS[card.rarity]}
                  </span>
                  <KeyHint className="text-white/60">{index + 1}</KeyHint>
                </span>
                <span className="font-semibold text-white">{card.name}</span>
                <CategoryTags categories={categories} highlight={incident.categories} />
                <span className={`font-board text-xs ${PLAUSIBILITY_STYLES[plausibility]}`}>{PLAUSIBILITY_LABELS[plausibility]}</span>
                {card.bonus && <span className="text-xs text-white/60">Bonus: {card.bonus.label}</span>}
                {card.eases && <span className="text-xs text-white/60">Lindert: {STATUS_DEFINITIONS[card.eases].label}</span>}
                {card.external && <span className="text-xs text-white/50">Schiebt die Schuld nach außen</span>}
                {uses > 0 && <span className="text-xs text-board-red">Schon {uses}× benutzt – wirkt schwächer</span>}
                {synergies.map((s) => (
                  <span key={s.id} className="flex items-center gap-1 text-xs text-board-yellow">
                    <PixelIcon name="star" size={10} /> Synergie: {s.name}
                  </span>
                ))}
              </button>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

interface AnnouncedScreenProps {
  state: GameState
  incident: Incident
  record: AnnouncementRecord
  onContinue: () => void
}

/** Ein Satz, der die Passung erklärt: welche Bereiche sich überschneiden und was das bedeutet. */
export function explainPlausibility(record: AnnouncementRecord, card: ExcuseCard, incident: Incident): string {
  const incidentText = incident.categories.map((c) => CATEGORY_LABELS[c]).join(', ')
  if (card.categories === 'all') return `Allzweck-Ausreden passen immer, wirken aber nur zu drei Vierteln. Der Vorfall betraf ${incidentText}.`
  const shared = incident.categories.filter((c) => (card.categories as Category[]).includes(c))
  const cardText = card.categories.map((c) => CATEGORY_LABELS[c]).join(', ')
  if (record.plausibility === 'perfekt') return `Der Vorfall betraf vor allem ${CATEGORY_LABELS[incident.categories[0]]}, und genau darum geht es in der Ausrede. Volle Wirkung, mehr Glaubwürdigkeit.`
  if (record.plausibility === 'plausibel')
    return `Gemeinsamer Bereich: ${shared.map((c) => CATEGORY_LABELS[c]).join(', ')}. Das reicht für eine glaubwürdige Durchsage, aber nicht für den Hauptgrund (${CATEGORY_LABELS[incident.categories[0]]}).`
  return `Der Vorfall betraf ${incidentText}, die Ausrede handelt von ${cardText}. Keine Überschneidung – die Fahrgäste merken das.`
}

/** Phase „announced“: die Durchsage und ihre Wirkung. */
export function AnnouncedScreen({ state, incident, record, onContinue }: AnnouncedScreenProps) {
  const card = getExcuse(record.cardId)!
  const failed = state.failures.length > 0
  const next = state.events[state.eventIndex + 1]
  const nextLabel = failed
    ? 'Weiter'
    : !next
      ? 'Einfahrt München Hbf'
      : next.stationIndex === state.stationIndex
        ? 'Weiter'
        : `Weiterfahrt nach ${STATIONS[next.stationIndex].name}`
  const credibility = record.credibilityAfter - record.credibilityBefore
  const bad = record.plausibility === 'unglaubwuerdig'
  return (
    <Card tone={bad ? 'bad' : record.plausibility === 'perfekt' ? 'good' : 'default'} className={bad ? 'anim-flash-bad' : record.plausibility === 'perfekt' ? 'anim-flash-good' : ''}>
      <p className="flex items-center gap-2 font-board text-xs tracking-widest text-board-amber uppercase">
        <PixelIcon name="speaker" size={14} />
        Durchsage · {card.name}
      </p>
      <p tabIndex={-1} data-phase-heading className={`mt-1 font-pixel text-2xl leading-none focus:outline-none ${PLAUSIBILITY_STYLES[record.plausibility]}`}>
        {PLAUSIBILITY_LABELS[record.plausibility]}
      </p>
      <blockquote className="led-panel anim-flip mt-3 rounded-md border-l-4 border-board-yellow p-4 font-board leading-relaxed text-board-yellow text-glow">
        „{record.text}“
      </blockquote>
      {record.reaction && (
        <p className="anim-enter mt-3 text-white/80 italic" style={{ animationDelay: '250ms' }}>
          {record.reaction}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <span>
          <span className="text-white/60">Wirkung: </span>
          <DeltaList
            effects={{
              satisfaction: record.after.satisfaction - record.before.satisfaction,
              condition: record.after.condition - record.before.condition,
            }}
          />
        </span>
        <span>
          <span className="text-white/60">Glaubwürdigkeit: </span>
          <span className={`font-board ${credibility < 0 ? 'text-board-red' : credibility > 0 ? 'text-board-green' : 'text-white/55'}`}>
            {credibility === 0 ? '±0' : formatDelta(credibility).replace('-', '−')} ({record.credibilityAfter})
          </span>
        </span>
        {record.eased && (
          <span className="font-board text-board-green">
            {STATUS_DEFINITIONS[record.eased].label} {state.statuses.some((s) => s.id === record.eased) ? 'klingt schneller ab' : 'behoben'}
          </span>
        )}
      </div>
      <p className="mt-3 text-sm text-white/80">
        <span className="font-board text-xs tracking-widest text-white/60 uppercase">Warum? </span>
        {explainPlausibility(record, card, incident)}
      </p>
      {record.notes.length > 0 && (
        <ul className="mt-3 space-y-0.5 text-xs text-white/60">
          {record.notes.map((note) => (
            <li key={note}>· {note}</li>
          ))}
        </ul>
      )}

      {failed && (
        <p className="mt-6 rounded border border-board-red bg-board-red/10 p-3 font-board text-board-red" role="alert">
          Das war’s. Die Fahrgäste haben genug gehört.
        </p>
      )}
      <div className="mt-6">
        <PrimaryButton onClick={onContinue} hint="Enter">
          {nextLabel}
        </PrimaryButton>
      </div>
    </Card>
  )
}
