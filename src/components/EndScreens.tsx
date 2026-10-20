import { getExcuse } from '../game/excuses'
import { rateRun, runStats } from '../game/rating'
import { STATIONS } from '../game/stations'
import type { GameState } from '../game/types'
import { Card, PrimaryButton, SecondaryButton } from './Board'
import { EventLog } from './Feedback'
import { FAILURE_TEXTS, formatDelay } from './labels'
import { PixelIcon, type IconName } from './PixelIcon'
import { UpgradeList } from './UpgradeScreens'

interface EndScreenProps {
  state: GameState
  onNewRun: () => void
  onRetrySeed: () => void
  onMenu: () => void
}

function Stat({ icon, label, value, detail, danger = false, index }: { icon: IconName; label: string; value: string; detail?: string; danger?: boolean; index: number }) {
  return (
    <div className="anim-enter rounded-md border border-board-line bg-board-deep/70 p-3" style={{ animationDelay: `${300 + index * 60}ms` }}>
      <dt className="flex items-center gap-1.5 text-xs text-white/60">
        <PixelIcon name={icon} size={12} className="text-board-amber" />
        {label}
      </dt>
      <dd className={`mt-1 font-pixel text-3xl leading-none ${danger ? 'text-board-red' : 'text-board-yellow'}`}>{value}</dd>
      {detail && <dd className="mt-1 text-xs text-white/50">{detail}</dd>}
    </div>
  )
}

function Summary({ state }: { state: GameState }) {
  const rating = rateRun(state)
  const stats = runStats(state)
  const favorite = stats.favoriteExcuse && getExcuse(stats.favoriteExcuse.cardId)
  const won = state.phase === 'victory'
  return (
    <>
      <div className="mt-6 flex flex-col gap-4 rounded-lg border-2 border-board-line bg-board-deep/70 p-4 sm:flex-row sm:items-center">
        <div
          className={`anim-stamp flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border-4 font-pixel text-7xl leading-none ${won ? 'border-board-yellow text-board-yellow' : 'border-board-red text-board-red'}`}
          style={{ animationDelay: '200ms' }}
          aria-label={`Note ${rating.grade}`}
        >
          {rating.grade}
        </div>
        <div>
          <p className="flex gap-1" aria-label={`${rating.stars} von 5 Sternen`}>
            {Array.from({ length: 5 }, (_, i) => (
              <PixelIcon key={i} name="star" size={20} className={i < rating.stars ? 'text-board-yellow' : 'text-board-line'} />
            ))}
          </p>
          <p className="mt-2 font-board text-xs tracking-widest text-white/50 uppercase">Abschlussbewertung</p>
          <h3 className="font-pixel text-3xl leading-none text-board-yellow text-glow">{rating.title}</h3>
          <p className="mt-1 max-w-prose text-sm text-white/80">{rating.comment}</p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat index={0} icon="flag" label="Stationen erreicht" value={`${stats.stationsReached}/${stats.totalStations}`} />
        <Stat index={1} icon="clock" label="Verspätung" value={formatDelay(stats.delay)} danger={stats.delay > 0} />
        <Stat index={2} icon="passenger" label="Fahrgastzufriedenheit" value={String(stats.satisfaction)} danger={stats.satisfaction <= 25} />
        <Stat index={3} icon="wrench" label="Zugzustand" value={String(stats.condition)} danger={stats.condition <= 25} />
        <Stat index={4} icon="warning" label="Vorfälle" value={String(stats.incidents)} detail={stats.followUps > 0 ? `davon ${stats.followUps} Folgeereignis${stats.followUps > 1 ? 'se' : ''}` : 'keine Folgeereignisse'} />
        <Stat
          index={5}
          icon="speaker"
          label="Ausreden"
          value={String(stats.excuses)}
          detail={`${stats.plausibility.perfekt} perfekt · ${stats.plausibility.unglaubwuerdig} unglaubwürdig`}
        />
        <Stat index={6} icon="card" label="Lieblingsausrede" value={favorite ? `${stats.favoriteExcuse!.uses}×` : '–'} detail={favorite?.name ?? 'Sie haben geschwiegen.'} />
        <Stat index={7} icon="star" label="Verbesserungen" value={String(stats.upgrades)} detail={`Glaubwürdigkeit am Ende: ${stats.credibility}`} />
      </dl>

      <h3 className="mt-6 font-board text-sm text-white/60 uppercase">Verbesserungen</h3>
      <div className="mt-2">
        <UpgradeList state={state} />
      </div>
      <details className="mt-6" open>
        <summary className="cursor-pointer font-board text-sm text-white/60 uppercase">Fahrtprotokoll</summary>
        <div className="mt-2">
          <EventLog history={state.history} announcements={state.announcements} />
        </div>
      </details>
    </>
  )
}

/** Kleine Schlusszeile mit dem Spieltitel. */
function SignOff({ children }: { children: string }) {
  return <p className="mt-6 border-t border-board-line pt-3 font-board text-xs text-white/55">{children}</p>
}

function Buttons({ onNewRun, onRetrySeed, onMenu }: Omit<EndScreenProps, 'state'>) {
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <PrimaryButton onClick={onNewRun} hint="Enter">
        Neue Fahrt starten
      </PrimaryButton>
      <SecondaryButton onClick={onRetrySeed}>Gleiche Fahrt wiederholen</SecondaryButton>
      <SecondaryButton onClick={onMenu}>Zum Hauptmenü</SecondaryButton>
    </div>
  )
}

export function VictoryScreen(props: EndScreenProps) {
  const { delay } = props.state.resources
  return (
    <Card tone="good" className="anim-enter">
      <p className="flex items-center gap-2 font-board text-xs tracking-widest text-board-green uppercase">
        <PixelIcon name="flag" size={14} />
        Endstation · Bitte alle aussteigen
      </p>
      <h2 tabIndex={-1} data-phase-heading className="anim-flip mt-2 font-pixel text-5xl leading-none text-board-yellow text-glow focus:outline-none">
        Ankunft München Hbf
      </h2>
      <p className="mt-3 max-w-prose leading-relaxed text-white/90">
        {delay === 0
          ? 'Pünktlich auf die Minute. Am Bahnsteig wird zur Sicherheit ein Gutachter bestellt.'
          : delay < 6
            ? 'Laut offizieller Statistik gilt Ihre Fahrt damit als pünktlich. Die Fahrgäste sehen das anders, aber die Statistik hat recht.'
            : 'Sie haben es geschafft. Wir bedanken uns für Ihr Verständnis und wünschen einen angenehmen Aufenthalt in München – Sie haben ja jetzt weniger Zeit dafür.'}
      </p>
      <Summary state={props.state} />
      <Buttons {...props} />
      <SignOff>Endstation: Vielleicht. Diesmal: ja. PÜNKT bedankt sich für Ihre Reise mit Vorbehalt.</SignOff>
    </Card>
  )
}

export function GameOverScreen(props: EndScreenProps) {
  const station = STATIONS[props.state.stationIndex]
  return (
    <Card tone="bad" className="anim-gameover led-panel">
      <p className="flex items-center gap-2 font-board text-xs tracking-widest text-board-red uppercase">
        <PixelIcon name="cross" size={14} />
        <span className="anim-blink">Zug fällt aus</span>
      </p>
      <h2 tabIndex={-1} data-phase-heading className="mt-2 font-pixel text-5xl leading-none text-board-red text-glow-red focus:outline-none">
        Fahrt endet in {station.name}
      </h2>
      <div className="mt-4 space-y-3">
        {props.state.failures.map((failure) => (
          <div key={failure} className="anim-enter">
            <p className="font-board font-semibold text-board-red">{FAILURE_TEXTS[failure].title}</p>
            <p className="max-w-prose text-white/90">{FAILURE_TEXTS[failure].text}</p>
          </div>
        ))}
      </div>
      <Summary state={props.state} />
      <Buttons {...props} />
      <SignOff>Endstation: Vielleicht. Diesmal: nein. PÜNKT – Ankommen ist unser Ziel. Nicht unbedingt Ihres.</SignOff>
    </Card>
  )
}
