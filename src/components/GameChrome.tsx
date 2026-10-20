import { useEffect, useRef, useState, type ReactNode } from 'react'
import { deckSize } from '../game/announcements'
import { DELAY_LIMIT, RESOURCE_MAX } from '../game/constants'
import { getCurrentEvent, getFollowUpsFor } from '../game/engine'
import { STATIONS } from '../game/stations'
import { STATUS_DEFINITIONS } from '../game/statuses'
import type { GameState, StatusId } from '../game/types'
import { UPGRADES } from '../game/upgrades'
import { AnimatedNumber } from './AnimatedNumber'
import { Logo, SecondaryButton } from './Board'
import { BrandMark } from './Brand'
import { DeltaList, EventLog } from './Feedback'
import { PixelIcon, type IconName } from './PixelIcon'
import { SettingsMenu } from './SettingsMenu'
import { DeckList, UpgradeList } from './UpgradeScreens'

export const SHORT_NAMES = ['Berlin', 'Wittenberg', 'Leipzig', 'Erfurt', 'Bamberg', 'Nürnberg', 'Ingolstadt', 'München']

export const STATUS_ICONS: Record<StatusId, IconName> = {
  hitze: 'heat',
  ueberfuellung: 'crowd',
  technikschaden: 'wrench',
  erschoepfung: 'staff',
}

/** Station, die gerade angezeigt wird: Bei der Verbesserungswahl ist der Zug schon eingefahren. */
export function displayedStation(run: GameState): number {
  return run.phase === 'upgrade' ? run.events[run.eventIndex + 1].stationIndex : run.stationIndex
}

// ── Kopfzeile ───────────────────────────────────────────────────────────────────────

export function TopBar({ run, onMenu }: { run: GameState; onMenu: () => void }) {
  const station = displayedStation(run)
  const delay = run.resources.delay
  return (
    <header className="led-panel top-0 z-20 sm:sticky border-b-2 border-board-yellow/70 shadow-[0_6px_20px_rgb(0_0_0/0.45)]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 sm:px-6">
        <div className="hidden 2xl:block">
          <Logo />
        </div>
        <span className="hidden sm:flex 2xl:hidden" title="Endstation: Vielleicht">
          <BrandMark size={36} />
        </span>
        {/* Zugzielanzeiger */}
        {/* Breite Bildschirme zeigen auch den Halt; schmale nur Zug, Ziel und Fortschritt. */}
        <div className="flex min-w-0 flex-1 basis-48 items-center gap-3 overflow-hidden font-pixel text-xl leading-none sm:text-2xl">
          <span className="shrink-0 rounded bg-board-yellow px-1.5 py-0.5 whitespace-nowrap text-board-deep">PX 404</span>
          <span className="min-w-0 truncate whitespace-nowrap text-board-yellow">
            <span className="text-board-amber">→</span> München Hbf
          </span>
          <span className="hidden min-w-0 truncate whitespace-nowrap text-white/80 lg:inline">
            · Halt: <span className="text-board-yellow">{STATIONS[station].name}</span>
          </span>
          <span className="shrink-0 font-board text-xs text-white/50">
            {station + 1}/{STATIONS.length}
          </span>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
        <div
          className={`flex shrink-0 items-baseline gap-2 rounded border px-3 py-1 ${delay > 0 ? 'border-board-red/70 text-board-red' : 'border-board-green/50 text-board-green'}`}
          aria-label={`Verspätung ${delay} Minuten von höchstens ${DELAY_LIMIT}`}
        >
          <span className="hidden font-board text-[10px] tracking-widest uppercase opacity-80 sm:inline" aria-hidden>
            Verspätung
          </span>
          <span className={`font-pixel text-3xl leading-none ${delay > 0 ? 'text-glow-red' : ''} ${delay >= DELAY_LIMIT - 5 ? 'anim-blink' : ''}`} aria-hidden>
            <AnimatedNumber value={delay} higherIsBetter={false} format={(v) => (v === 0 ? '±0' : `+${v}`)} />
          </span>
          <span className="font-board text-xs opacity-80" aria-hidden>
            Min
          </span>
        </div>
          <span className="hidden font-board text-xs text-white/50 xl:inline">Fahrt-Nr. {run.seed}</span>
          <SettingsMenu />
          <SecondaryButton onClick={onMenu} label="Hauptmenü">
            Menü
          </SecondaryButton>
        </div>
      </div>
    </header>
  )
}

// ── Ressourcen ──────────────────────────────────────────────────────────────────────

interface MeterProps {
  label: string
  /** Kurze Bezeichnung für die kompakte Leiste auf kleinen Bildschirmen. */
  short?: string
  icon: IconName
  value: number
  max: number
  unit?: string
  danger: boolean
  /** Kurz vor dem Verlust: zusätzlich zur Farbe mit Symbol und Text markiert. */
  critical?: boolean
  higherIsBetter?: boolean
  compact?: boolean
}

function Meter({ label, short, icon, value, max, unit = '', danger, higherIsBetter = true, compact, critical = false }: MeterProps) {
  const percent = Math.min(100, (value / max) * 100)
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${value}${unit ? ` ${unit}` : ''} von ${max}${critical ? ', kritisch' : ''}`}
      data-testid={`resource-${label}`}
      className={compact ? 'min-w-0' : 'rounded-md border border-board-line bg-board-deep/60 p-3'}
    >
      <div className={compact ? 'mb-1 flex flex-col items-start' : 'mb-1.5 flex items-center justify-between gap-2'}>
        <span className={`flex min-w-0 items-center gap-1.5 text-white/80 ${compact ? 'text-[11px]' : 'text-sm'}`}>
          <PixelIcon name={icon} size={compact ? 12 : 16} className={danger ? 'text-board-red' : 'text-board-amber'} />
          <span className="truncate">{compact ? (short ?? label) : label}</span>
          {critical && (
            <span className="anim-blink shrink-0 font-board text-[10px] font-semibold text-board-red uppercase">⚠ kritisch</span>
          )}
        </span>
        <span className={`font-pixel leading-none ${compact ? 'text-xl' : 'text-2xl'} ${danger ? 'text-board-red' : 'text-board-yellow'}`}>
          <AnimatedNumber value={value} higherIsBetter={higherIsBetter} />
          {compact ? (
            unit && <span className="text-xs text-white/55"> {unit}</span>
          ) : (
            <span className="text-sm text-white/55">
              {' '}
              / {max}
              {unit && ` ${unit}`}
            </span>
          )}
        </span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-sm bg-board-deep">
        {/* Nachlauf: zeigt kurz, wie viel gerade verloren ging, und schrumpft dann hinterher */}
        <div className="absolute inset-y-0 left-0 bg-white/40 transition-[width] delay-500 duration-500 ease-out" style={{ width: `${percent}%` }} aria-hidden />
        <div
          className={`relative h-full transition-[width] duration-300 ease-out ${danger ? 'bg-board-red' : 'bg-board-yellow'}`}
          style={{ width: `${percent}%`, backgroundImage: 'repeating-linear-gradient(90deg, transparent 0 6px, rgb(0 0 0 / 0.25) 6px 8px)' }}
        />
      </div>
    </div>
  )
}

export function ResourceMeters({ run, compact = false }: { run: GameState; compact?: boolean }) {
  const { delay, satisfaction, condition } = run.resources
  return (
    <div className={compact ? 'grid grid-cols-3 gap-3' : 'space-y-2'}>
      <Meter label="Verspätung" short="Verspätung" icon="clock" value={delay} max={DELAY_LIMIT} unit="Min" danger={delay > 0} critical={delay >= DELAY_LIMIT - 8} higherIsBetter={false} compact={compact} />
      <Meter label="Fahrgastzufriedenheit" short="Fahrgäste" icon="passenger" value={satisfaction} max={RESOURCE_MAX} danger={satisfaction <= 25} critical={satisfaction <= 25} compact={compact} />
      <Meter label="Zugzustand" short="Zug" icon="wrench" value={condition} max={RESOURCE_MAX} danger={condition <= 25} critical={condition <= 25} compact={compact} />
    </div>
  )
}

function PanelSection({ title, icon, children, extra }: { title: string; icon: IconName; children: ReactNode; extra?: ReactNode }) {
  return (
    <section className="rounded-lg border-2 border-board-line bg-board-card/80 p-4">
      <h2 className="mb-3 flex items-center justify-between gap-2 font-board text-xs tracking-widest text-board-amber uppercase">
        <span className="flex items-center gap-2">
          <PixelIcon name={icon} size={14} />
          {title}
        </span>
        {extra}
      </h2>
      {children}
    </section>
  )
}

/** Seitenleiste: Ressourcen, Glaubwürdigkeit, Probleme, Verbesserungen, Deck. */
export function SidePanel({ run }: { run: GameState }) {
  return (
    <div className="space-y-4">
      <div className="hidden lg:block">
        <PanelSection title="Lage" icon="signal">
          <ResourceMeters run={run} />
          <Credibility value={run.credibility} />
          <p className="mt-3 text-xs text-white/60">
            <span className="font-board text-board-red uppercase">Zugausfall bei:</span> {DELAY_LIMIT} Min Verspätung · 0 Zufriedenheit · 0 Zugzustand
          </p>
        </PanelSection>
      </div>
      <StatusList run={run} />
      <PanelSection title="Verbesserungen" icon="star" extra={<span className="text-white/50">{run.upgrades.length}</span>}>
        {run.upgrades.length === 0 ? (
          <p className="text-sm text-white/50">Noch keine. Die erste gibt es bei der Ankunft in Wittenberg.</p>
        ) : (
          <>
            <ul className="flex flex-wrap gap-1.5">
              {run.upgrades.map((u) => (
                <li
                  key={u.id}
                  title={UPGRADES[u.id].description}
                  className="rounded border border-board-yellow/40 bg-board-yellow/10 px-2 py-0.5 font-board text-xs text-board-yellow"
                >
                  {UPGRADES[u.id].name}
                  {UPGRADES[u.id].maxStacks > 1 && <span className="text-white/60"> ×{u.stacks}</span>}
                </li>
              ))}
            </ul>
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer font-board text-xs text-white/60">Wirkungen und Synergien</summary>
              <div className="mt-2">
                <UpgradeList state={run} />
              </div>
            </details>
          </>
        )}
      </PanelSection>
      <PanelSection title="Ausreden-Deck" icon="card" extra={<span className="text-white/50">{deckSize(run.deck)}</span>}>
        <p className="flex gap-4 font-board text-xs text-white/70">
          <span>Stapel {run.deck.drawPile.length}</span>
          <span>Ablage {run.deck.discard.length}</span>
          {run.deck.hand.length > 0 && <span>Hand {run.deck.hand.length}</span>}
        </p>
        <details className="mt-2 text-sm">
          <summary className="cursor-pointer font-board text-xs text-white/60">Alle Karten</summary>
          <div className="mt-2">
            <DeckList state={run} />
          </div>
        </details>
      </PanelSection>
    </div>
  )
}

export function Credibility({ value, compact = false }: { value: number; compact?: boolean }) {
  return (
    <div className={compact ? 'mt-2' : 'mt-3 rounded-md border border-board-line bg-board-deep/60 p-3'} data-testid="credibility">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="flex items-center gap-1.5 text-white/80">
          <PixelIcon name="speaker" size={compact ? 12 : 16} className="text-board-sky" />
          <span className={compact ? 'text-[11px]' : ''}>Glaubwürdigkeit</span>
        </span>
        <span className={`font-pixel text-xl leading-none ${value < 30 ? 'text-board-red' : 'text-board-sky'}`}>
          <AnimatedNumber value={value} /> <span className="text-sm text-white/55">/ 100</span>
        </span>
      </div>
      {!compact && <p className="mt-1 text-xs text-white/50">Verstärkt oder schwächt jede Ausrede.</p>}
    </div>
  )
}

function StatusList({ run }: { run: GameState }) {
  if (run.statuses.length === 0) return null
  return (
    <section aria-label="Laufende Probleme" className="rounded-lg border-2 border-board-red/60 bg-board-red/5 p-4">
      <h2 className="mb-2 flex items-center gap-2 font-board text-xs tracking-widest text-board-red uppercase">
        <PixelIcon name="warning" size={14} />
        Laufende Probleme
      </h2>
      <ul className="space-y-2">
        {run.statuses.map((status) => {
          const def = STATUS_DEFINITIONS[status.id]
          return (
            <li key={status.id} className="anim-enter flex gap-2 text-sm">
              <PixelIcon name={STATUS_ICONS[status.id]} size={18} className="mt-0.5 text-board-red" />
              <div className="min-w-0">
                <p className="font-board font-semibold text-white">
                  {def.label}{' '}
                  <span className="font-normal text-white/50">
                    · noch {status.remaining} {status.remaining === 1 ? 'Ereignis' : 'Ereignisse'}
                  </span>
                </p>
                <p className="text-xs text-white/70">{def.description}</p>
                <p className="text-xs text-white/70">
                  Pro Ereignis <DeltaList effects={def.tick} />
                </p>
                <p className="text-xs text-white/50">
                  Droht:{' '}
                  {getFollowUpsFor(status.id)
                    .map((i) => i.title)
                    .join(', ')}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

// ── Strecke ─────────────────────────────────────────────────────────────────────────

/** Streckenband mit fahrendem Zug. Auf kleinen Bildschirmen ohne Namen, damit nichts seitlich scrollt. */
export function TrainTrack({ run }: { run: GameState }) {
  const station = displayedStation(run)
  const percent = (station / (STATIONS.length - 1)) * 100
  const [moving, setMoving] = useState(false)
  const previous = useRef(station)
  useEffect(() => {
    if (previous.current === station) return
    previous.current = station
    setMoving(true)
    const timer = setTimeout(() => setMoving(false), 900)
    return () => clearTimeout(timer)
  }, [station])

  return (
    <nav aria-label="Streckenverlauf" className="led-panel rounded-lg border-2 border-board-line px-4 pt-4 pb-3 sm:px-8">
      <div className={`relative mx-2 h-10 ${moving ? 'train-moving' : ''}`}>
        {/* Gleis */}
        <div className="absolute top-7 right-0 left-0 h-1 bg-board-line" aria-hidden />
        <div className="absolute top-7 left-0 h-1 bg-board-yellow transition-[width] duration-[900ms] ease-in-out" style={{ width: `${percent}%` }} aria-hidden />
        {/* Zug */}
        <div
          className="absolute top-0 -translate-x-1/2 text-board-yellow transition-[left] duration-[900ms] ease-in-out"
          style={{ left: `${percent}%` }}
          aria-hidden
        >
          <div className="train-body text-glow">
            <PixelIcon name="train" size={26} />
          </div>
        </div>
        <ol className="absolute top-[22px] right-0 left-0 flex justify-between">
          {STATIONS.map((s, index) => {
            const passed = index < station
            const current = index === station
            return (
              <li key={s.id} className="relative -mx-1.5 flex w-3 justify-center" aria-current={current ? 'step' : undefined}>
                <span
                  className={`h-3 w-3 rounded-sm border-2 ${current ? 'border-board-yellow bg-board-yellow' : passed ? 'border-board-yellow bg-board-deep' : 'border-board-line bg-board-deep'}`}
                />
                <span className="sr-only">
                  {s.name}
                  {current ? ' (aktuell)' : passed ? ' (passiert)' : ''}
                </span>
              </li>
            )
          })}
        </ol>
      </div>
      {/* Namen: ab mittlerer Breite alle, sonst nur der aktuelle Halt */}
      <div className="mt-1 hidden justify-between font-board text-[11px] md:flex" aria-hidden>
        {STATIONS.map((s, index) => (
          <span key={s.id} className={`w-0 text-center whitespace-nowrap ${index === station ? 'font-semibold text-board-yellow' : index < station ? 'text-board-yellow/60' : 'text-white/55'}`}>
            <span className="inline-block -translate-x-1/2">{SHORT_NAMES[index]}</span>
          </span>
        ))}
      </div>
      <p className="mt-1 text-center font-board text-xs text-board-yellow md:hidden" aria-hidden>
        {STATIONS[station].name} · {station + 1}/{STATIONS.length}
      </p>
    </nav>
  )
}

/** Die letzten Ereignisse und das ganze Protokoll zum Aufklappen. */
export function RecentLog({ run }: { run: GameState }) {
  if (run.history.length === 0) {
    return <p className="rounded-lg border-2 border-dashed border-board-line p-4 text-sm text-white/50">Noch keine Vorkommnisse. Genießen Sie es, es hält nicht lange.</p>
  }
  const recent = run.history.slice(-3)
  return (
    <section className="rounded-lg border-2 border-board-line bg-board-card/80 p-4" aria-label="Letzte Ereignisse">
      <h2 className="mb-3 flex items-center gap-2 font-board text-xs tracking-widest text-board-amber uppercase">
        <PixelIcon name="flag" size={14} />
        Letzte Ereignisse
      </h2>
      <EventLog history={recent} announcements={run.announcements} newestFirst />
      {run.history.length > recent.length && (
        <details className="mt-3">
          <summary className="cursor-pointer font-board text-xs text-white/60">Fahrtprotokoll ({run.history.length})</summary>
          <div className="mt-3">
            <EventLog history={run.history} announcements={run.announcements} newestFirst />
          </div>
        </details>
      )}
    </section>
  )
}

/** Kleine Info, ob das aktuelle Ereignis ein Folgeereignis ist (für Kopf und Hinweise). */
export function isCritical(run: GameState): boolean {
  const event = getCurrentEvent(run)
  return event.depth > 0 || STATIONS[run.stationIndex].tier === 3
}

/** Grenzwerte, ab denen das Spiel deutlich warnt. */
export const WARN_DELAY = DELAY_LIMIT - 8
export const WARN_RESOURCE = 20

export function criticalWarnings(run: GameState): string[] {
  const { delay, satisfaction, condition } = run.resources
  const list: string[] = []
  if (delay >= WARN_DELAY) list.push(`Verspätung kritisch: noch ${DELAY_LIMIT - delay} Min bis zum Zugausfall.`)
  if (satisfaction <= WARN_RESOURCE) list.push(`Fahrgäste am Limit: Zufriedenheit nur noch ${satisfaction}.`)
  if (condition <= WARN_RESOURCE) list.push(`Zug am Limit: Zustand nur noch ${condition}.`)
  return list
}

/** Deutlicher Warnhinweis über dem Spielbereich, solange ein Wert kurz vor dem Verlust steht. */
export function CriticalWarning({ run }: { run: GameState }) {
  const warnings = criticalWarnings(run)
  if (warnings.length === 0) return null
  return (
    <div role="status" className="anim-enter flex gap-3 rounded-lg border-2 border-board-red bg-board-red/15 px-4 py-3 text-sm text-white anim-alarm">
      <PixelIcon name="warning" size={18} className="mt-0.5 text-board-red" />
      <ul className="space-y-0.5">
        {warnings.map((w) => (
          <li key={w}>
            <span className="font-board font-semibold text-board-red">⚠ </span>
            {w}
          </li>
        ))}
      </ul>
    </div>
  )
}
