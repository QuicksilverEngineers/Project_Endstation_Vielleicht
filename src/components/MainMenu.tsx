import { useState } from 'react'
import { playSound } from '../audio/sound'
import { DELAY_LIMIT, TIMETABLE_RESERVE } from '../game/constants'
import { randomSeed } from '../game/rng'
import { STATIONS } from '../game/stations'
import { Board, Card, PrimaryButton, SecondaryButton } from './Board'
import { BrandMark, GAME_TITLE, OPERATOR_PROMISE, TAGLINE, Wordmark } from './Brand'
import { SHORT_NAMES } from './GameChrome'
import { PixelIcon, type IconName } from './PixelIcon'
import { SettingsMenu } from './SettingsMenu'

interface MainMenuProps {
  hasSavedRun: boolean
  onStart: (seed: string) => void
  onResume: () => void
  onAbandon: () => void
  tutorialEnabled: boolean
  onTutorialChange: (enabled: boolean) => void
  onTutorialReset: () => void
}

const RULES: { icon: IconName; text: string }[] = [
  { icon: 'clock', text: `Verspätung: Ab ${DELAY_LIMIT} Minuten wird Ihr Zug aus dem Fahrplan genommen. Das ist das eigentliche Ziel: unter ${DELAY_LIMIT} bleiben.` },
  { icon: 'passenger', text: 'Fahrgastzufriedenheit und Zugzustand dürfen nicht auf 0 fallen.' },
  { icon: 'warning', text: 'Jede Option zeigt vorher, ob sie sicher, riskant oder strategisch ist. Was genau passiert, erfahren Sie wie im echten Leben erst hinterher.' },
  { icon: 'wrench', text: 'Ignorierte Probleme fahren mit, kosten bei jedem Ereignis etwas und lösen gerne Folgeereignisse aus.' },
  { icon: 'speaker', text: 'Nach jedem Vorfall machen Sie eine Durchsage. Passt die Ausrede, beruhigt sie. Passt sie nicht, glaubt Ihnen niemand.' },
  { icon: 'star', text: 'An jeder Station wählen Sie eine Verbesserung. Manche ergänzen sich mit bestimmten Ausreden.' },
  { icon: 'train', text: `Zwischen den Stationen holt der Lokführer bis zu ${TIMETABLE_RESERVE} Minuten auf. Je näher München, desto teurer jeder Fehler.` },
]

/** Kundeninformationen des Betreibers, eine pro Minute. Rein dekorativ, beeinflusst keine Fahrt. */
const PUENKT_NOTICES = [
  'Aufgrund einer unvorhersehbaren Vorhersehbarkeit verzögert sich unsere Weiterfahrt.',
  'Wir erreichen den nächsten Bahnhof voraussichtlich heute.',
  'Die angezeigte Ankunftszeit dient ausschließlich der Orientierung.',
  'Bitte beachten Sie, dass Pünktlichkeit keine garantierte Produkteigenschaft darstellt.',
]

function DepartureBoard() {
  const now = new Date()
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const notice = PUENKT_NOTICES[now.getMinutes() % PUENKT_NOTICES.length]
  return (
    <div className="led-panel overflow-hidden rounded-lg border-2 border-board-line font-pixel text-xl leading-tight sm:text-2xl" role="table" aria-label="Abfahrt">
      <div role="row" className="grid grid-cols-[4.5rem_6rem_1fr_3.5rem] gap-2 border-b border-board-line px-3 py-1.5 font-board text-[11px] tracking-widest text-white/50 uppercase">
        <span role="columnheader">Zeit</span>
        <span role="columnheader">Zug</span>
        <span role="columnheader">Ziel</span>
        <span role="columnheader">Gleis</span>
      </div>
      <div role="row" className="grid grid-cols-[4.5rem_6rem_1fr_3.5rem] gap-2 px-3 pt-2">
        <span role="cell" className="text-board-yellow">{time}</span>
        <span role="cell" className="text-board-yellow">PX 404</span>
        <span role="cell" className="truncate text-board-yellow text-glow">München Hbf</span>
        <span role="cell" className="text-board-yellow">7?</span>
      </div>
      <div className="truncate px-3 text-base text-white/60 sm:text-lg">über {SHORT_NAMES.slice(1, -1).join(' – ')}</div>
      <div className="mt-1 flex items-center gap-2 bg-board-red/15 px-3 py-1.5 text-board-red">
        <PixelIcon name="warning" size={14} />
        <span className="anim-blink">Heute ca. +5 Min</span>
        <span className="truncate text-white/60">· Grund: Verzögerungen im Betriebsablauf</span>
      </div>
      <p className="border-t border-board-line px-3 py-1.5 font-board text-xs leading-snug">
        <span className="font-semibold tracking-widest text-board-sky">PÜNKT-Info:</span> <span className="text-white/70">{notice}</span>
      </p>
    </div>
  )
}

function TitleHero() {
  return (
    <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-7">
      <BrandMark size={96} className="drop-shadow-[0_6px_0_rgb(0_0_0/0.35)]" />
      <div className="min-w-0">
        <h1>
          <span className="sr-only">{GAME_TITLE}</span>
          <Wordmark size="xl" />
        </h1>
        <p className="mt-4 text-lg text-white/90 sm:text-xl">„{TAGLINE}“</p>
        <p className="mt-1 font-board text-xs tracking-[0.25em] text-board-amber uppercase">Ein satirisches Zug-Roguelike</p>
      </div>
    </div>
  )
}

export function MainMenu({ hasSavedRun, onStart, onResume, onAbandon, tutorialEnabled, onTutorialChange, onTutorialReset }: MainMenuProps) {
  const [seed, setSeed] = useState('')
  // Eine gespeicherte Fahrt wird erst nach Rückfrage ersetzt.
  const [confirming, setConfirming] = useState(false)
  const start = () => {
    playSound('select')
    onStart(seed.trim() || randomSeed())
  }

  return (
    <Board actions={<SettingsMenu />}>
      <div className="mx-auto max-w-3xl space-y-8">
        <section className="anim-enter pt-2 sm:pt-6" aria-label="Titel">
          <TitleHero />
        </section>

        <div className="anim-enter flex flex-col gap-4">
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(event) => {
              event.preventDefault()
              if (hasSavedRun) setConfirming(true)
              else start()
            }}
          >
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded bg-board-yellow px-5 py-3 font-board font-semibold text-board-deep shadow-[0_4px_0_0_#b3841a] transition hover:brightness-110 active:translate-y-1 active:shadow-none"
            >
              <PixelIcon name="train" size={18} />
              Neue Fahrt starten
            </button>
            <label className="flex flex-col gap-1 text-sm text-white/70">
              Fahrt-Nr. (optional)
              <input
                value={seed}
                onChange={(event) => setSeed(event.target.value)}
                placeholder="zufällig"
                className="w-40 rounded border-2 border-board-line bg-board-deep px-3 py-2 font-board text-board-yellow placeholder:text-white/50 focus:border-board-yellow"
              />
            </label>
          </form>
          {hasSavedRun && confirming && (
            <div role="alertdialog" aria-labelledby="ersetzen-frage" className="anim-enter rounded-lg border-2 border-board-red/70 bg-board-red/10 p-4">
              <p id="ersetzen-frage" className="font-board text-sm text-white">
                Ihre gespeicherte Fahrt geht dabei verloren. Wirklich eine neue Fahrt starten?
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <SecondaryButton onClick={start}>Ja, neue Fahrt starten</SecondaryButton>
                <SecondaryButton onClick={() => setConfirming(false)}>Abbrechen</SecondaryButton>
              </div>
            </div>
          )}
          {hasSavedRun && (
            <div className="flex flex-wrap items-center gap-3">
              <PrimaryButton onClick={onResume} hint="Enter">
                Fahrt fortsetzen
              </PrimaryButton>
              <SecondaryButton onClick={onAbandon}>Gespeicherte Fahrt verwerfen</SecondaryButton>
            </div>
          )}
          {hasSavedRun && !confirming && <p className="text-sm text-white/55">Eine neue Fahrt ersetzt die gespeicherte (mit Rückfrage).</p>}
          <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={tutorialEnabled} onChange={(e) => onTutorialChange(e.target.checked)} className="h-4 w-4 accent-[#74c6c6]" />
              Tipps für Einsteiger anzeigen
            </label>
            <button type="button" onClick={onTutorialReset} className="font-board text-xs text-board-sky underline">
              Tipps von vorn
            </button>
          </div>
          <p className="text-xs text-white/55">Steuerung: Maus, Touch oder Tastatur (1–5 wählen, Enter weiter, M Ton). Ton und Animationen: oben unter „Einstellungen“.</p>
        </div>

        <div className="anim-enter">
          <DepartureBoard />
        </div>
        <Card className="anim-enter">
          <p className="font-board text-xs tracking-widest text-board-amber uppercase">Information zu Ihrer Fahrt</p>
          <h2 className="mt-2 font-pixel text-4xl leading-none text-board-yellow">Berlin Hbf → München Hbf</h2>
          <p className="mt-3 max-w-prose leading-relaxed text-white/90">
            Sie sind Zugchef im PX 404 von PÜNKT, dem Fernverkehr mit Vorbehalt. Ihre Aufgabe: den Zug über {STATIONS.length} Stationen nach
            München bringen. Ihre Werkzeuge: Entscheidungen, Ausreden und eine Lautsprecheranlage. Ihre Gegner: alles andere, die eigene
            Konzernzentrale eingeschlossen.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {RULES.map((rule) => (
              <li key={rule.text} className="flex gap-3 text-sm text-white/80">
                <PixelIcon name={rule.icon} size={18} className="mt-0.5 text-board-amber" />
                <span>{rule.text}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 border-t border-board-line pt-3 font-board text-xs text-white/55">Leitbild der PÜNKT: „{OPERATOR_PROMISE}“</p>
        </Card>
      </div>
    </Board>
  )
}
