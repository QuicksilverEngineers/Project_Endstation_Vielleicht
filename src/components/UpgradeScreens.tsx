import { deckSize } from '../game/announcements'
import { getExcuse } from '../game/excuses'
import { STATIONS } from '../game/stations'
import { hasUpgrade, SYNERGIES, UPGRADES, upgradeStacks } from '../game/upgrades'
import type { GameState, UpgradeId } from '../game/types'
import { RARITY_LABELS } from './AnnouncementScreens'
import { playSound } from '../audio/sound'
import { Card, KeyHint } from './Board'
import { PixelIcon } from './PixelIcon'
import { DeltaList } from './Feedback'

function stackLabel(state: GameState, id: UpgradeId): string | null {
  const max = UPGRADES[id].maxStacks
  if (max === 1) return 'Einzigartig'
  return `Stufe ${upgradeStacks(state, id) + 1} von ${max}`
}

interface UpgradeScreenProps {
  state: GameState
  onChoose: (id: UpgradeId) => void
}

/** Ankunftsgrüße der Stationen, frei erfunden. */
const ARRIVAL_LINES = [
  '',
  'Die Lutherstadt begrüßt Sie mit 95 Thesen zur Pünktlichkeit.',
  'Leipzig Hbf: so groß, dass Ihr Zug hier offiziell als Kleinbahn gilt.',
  'Erfurt: Drehkreuz, Knotenpunkt, Wartebank.',
  'Bamberg: Hier wurde schon auf Züge gewartet, als es noch keine gab.',
  'Nürnberg: Lebkuchen am Bahnsteig, Geduld im Zug.',
  'Ingolstadt: Nur noch eine Station. Was soll da noch schiefgehen?',
  'München Hbf: fast geschafft.',
]

/** Phase „upgrade“: Ankunft an der Station und Auswahl einer Verbesserung. */
export function UpgradeScreen({ state, onChoose }: UpgradeScreenProps) {
  const nextStation = state.events[state.eventIndex + 1].stationIndex
  const arrival = state.arrivals.at(-1)
  return (
    <Card>
      <p className="flex items-center gap-2 font-board text-xs tracking-widest text-board-amber uppercase">
        <PixelIcon name="flag" size={14} />
        Ankunft · Station {nextStation + 1} von {STATIONS.length}
      </p>
      {/* Bahnhofsschild, das bei der Einfahrt hereinrollt */}
      <div className="anim-arrive mt-3 inline-flex items-center gap-3 rounded border-4 border-white/85 bg-board-deep px-4 py-2 shadow-[0_6px_0_0_rgb(0_0_0/0.4)]">
        <PixelIcon name="train" size={22} className="text-board-yellow" />
        <h2 tabIndex={-1} data-phase-heading className="font-pixel text-4xl leading-none text-white focus:outline-none">
          Einfahrt {STATIONS[nextStation].name}
        </h2>
      </div>
      <p className="mt-2 font-board text-xs text-white/60">
        {nextStation === STATIONS.length - 1
          ? 'Nur noch München selbst – dann ist es geschafft.'
          : `Noch ${STATIONS.length - 1 - nextStation} Stationen bis München Hbf.`}
      </p>
      <p className="mt-2 text-sm text-white/60 italic">{ARRIVAL_LINES[nextStation]}</p>
      {arrival && arrival.stationIndex === nextStation && arrival.changes.length > 0 && (
        <ul className="mt-3 space-y-0.5 text-sm">
          {arrival.changes.map((change) => (
            <li key={change.source} className="anim-enter">
              <span className="text-white/70">{UPGRADES[change.source].name}: </span>
              <DeltaList effects={change.delta} />
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-white/80">Der Aufenthalt reicht für genau eine Verbesserung. Mehr wäre Luxus.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {state.upgradeOffer.map((id, index) => {
          const upgrade = UPGRADES[id]
          const synergies = SYNERGIES.filter((s) => s.upgrade === id)
          return (
            <button
              key={id}
              type="button"
              data-hotkey={index + 1}
              onClick={() => {
                playSound('upgrade')
                onChoose(id)
              }}
              style={{ animationDelay: `${index * 90}ms` }}
              className="anim-deal flex flex-col items-start gap-2 rounded-lg border-2 border-board-line bg-board-deep p-4 text-left transition hover:-translate-y-1 hover:border-board-yellow"
            >
              <span className="flex w-full items-center justify-between">
                <span className="font-board text-[11px] text-white/50 uppercase">{stackLabel(state, id)}</span>
                <KeyHint className="text-white/60">{index + 1}</KeyHint>
              </span>
              <span className="flex items-center gap-2 font-semibold text-white">
                <PixelIcon name="star" size={14} className="text-board-yellow" />
                {upgrade.name}
              </span>
              <span className="text-sm text-white/80">{upgrade.description}</span>
              {synergies.map((s) => (
                <span key={s.id} className="text-xs text-board-yellow">
                  ★ {s.name}: {s.description}
                </span>
              ))}
            </button>
          )
        })}
      </div>
    </Card>
  )
}

/** Alle Verbesserungen im Besitz mit ihrer Wirkung und aktiven Synergien. */
export function UpgradeList({ state }: { state: GameState }) {
  if (state.upgrades.length === 0) return <p className="text-sm text-white/50">Noch keine Verbesserungen.</p>
  const synergies = SYNERGIES.filter((s) => hasUpgrade(state, s.upgrade))
  return (
    <div className="space-y-3">
      <ul className="space-y-1 text-sm">
        {state.upgrades.map(({ id, stacks }) => (
          <li key={id}>
            <span className="font-bold text-white">{UPGRADES[id].name}</span>
            {UPGRADES[id].maxStacks > 1 && (
              <span className="font-board text-white/50">
                {' '}
                ({stacks}/{UPGRADES[id].maxStacks})
              </span>
            )}
            {id === 'ersatzbus' && state.ersatzbusUsed && <span className="font-board text-board-red"> · eingelöst</span>}
            {id === 'pressemappe' && state.rewards.length > 0 && (
              <span className="font-board text-board-green"> · erhalten: {state.rewards.map((r) => getExcuse(r)!.name).join(', ')}</span>
            )}
            <span className="text-white/70"> – {UPGRADES[id].description}</span>
          </li>
        ))}
      </ul>
      {synergies.length > 0 && (
        <ul className="space-y-1 text-sm">
          {synergies.map((s) => (
            <li key={s.id} className="text-board-yellow">
              ★ {s.name}: <span className="text-white/70">{s.description}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Deckübersicht: welche Ausreden es gibt und wo sie gerade liegen. */
export function DeckList({ state }: { state: GameState }) {
  const counts = new Map<string, number>()
  for (const id of [...state.deck.drawPile, ...state.deck.hand, ...state.deck.discard]) counts.set(id, (counts.get(id) ?? 0) + 1)
  return (
    <div className="space-y-2 text-sm">
      <p className="font-board text-white/60">
        {deckSize(state.deck)} Karten · Nachziehstapel {state.deck.drawPile.length} · Ablage {state.deck.discard.length}
      </p>
      <ul className="grid gap-1 sm:grid-cols-2">
        {[...counts].map(([id, count]) => {
          const card = getExcuse(id)!
          const uses = state.cardUses[id] ?? 0
          return (
            <li key={id}>
              <span className="text-white">
                {count > 1 ? `${count}× ` : ''}
                {card.name}
              </span>{' '}
              <span className="font-board text-xs text-white/50">
                {RARITY_LABELS[card.rarity]}
                {uses > 0 ? ` · ${uses}× benutzt` : ''}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
