import { useEffect, useRef } from 'react'
import { playSound } from './audio/sound'
import { AnnouncedScreen, AnnouncementScreen } from './components/AnnouncementScreens'
import { GameOverScreen, VictoryScreen } from './components/EndScreens'
import { Credibility, CriticalWarning, criticalWarnings, displayedStation, isCritical, RecentLog, ResourceMeters, SidePanel, TopBar, TrainTrack } from './components/GameChrome'
import { IncidentScreen } from './components/IncidentScreen'
import { decisionMood } from './components/labels'
import { MainMenu } from './components/MainMenu'
import { TutorialHintBox } from './components/TutorialHint'
import { ResultScreen } from './components/ResultScreen'
import { UpgradeScreen } from './components/UpgradeScreens'
import { getExcuse } from './game/excuses'
import { getCurrentIncident, getLastAnnouncement, getLastDecision, isFinished } from './game/engine'
import { randomSeed } from './game/rng'
import { STATIONS } from './game/stations'
import type { GameState } from './game/types'
import { SettingsProvider, useSettings } from './state/settings'
import { currentHint, useTutorial } from './state/tutorial'
import { useGame } from './state/useGame'

export default function App() {
  return (
    <SettingsProvider>
      <Game />
    </SettingsProvider>
  )
}

/** Kurzer Text für Screenreader, wenn sich die Phase ändert. */
function phaseMessage(run: GameState): string {
  const incident = getCurrentIncident(run)
  switch (run.phase) {
    case 'incident':
      return `Station ${run.stationIndex + 1}, ${STATIONS[run.stationIndex].name}. Neuer Vorfall: ${incident.title}.`
    case 'result':
      return `Ergebnis Ihrer Entscheidung. Verspätung ${run.resources.delay} Minuten.`
    case 'announcement': {
      const d = getLastDecision(run)
      return `${d ? `Ergebnis: ${d.kind === 'risky' ? (d.success ? 'gutgegangen' : 'schiefgegangen') : 'wie erwartet'}. ` : ''}Durchsage: Wählen Sie eine Ausrede aus Ihrer Hand.`
    }
    case 'announced': {
      const a = getLastAnnouncement(run)
      return a ? `Durchsage gespielt: ${getExcuse(a.cardId)?.name}.` : ''
    }
    case 'upgrade':
      return `Einfahrt ${STATIONS[displayedStation(run)].name}. Wählen Sie eine Verbesserung.`
    case 'victory':
      return 'Ankunft München Hbf. Fahrt beendet.'
    case 'gameover':
      return `Zug fällt aus in ${STATIONS[run.stationIndex].name}.`
  }
}

/** Klang passend zur neuen Phase. */
function phaseSound(run: GameState): void {
  switch (run.phase) {
    case 'incident':
      if (isCritical(run)) playSound('critical')
      break
    case 'result': {
      const decision = getLastDecision(run)
      if (!decision) break
      const mood = decisionMood(decision, run.failures.length > 0)
      if (mood !== 'neutral') playSound(mood)
      break
    }
    case 'announcement': {
      // Erst der Klang des Ergebnisses, dann das Austeilen der Karten
      const decision = getLastDecision(run)
      const mood = decision && decisionMood(decision, false)
      if (mood && mood !== 'neutral') playSound(mood)
      setTimeout(() => playSound('draw'), mood && mood !== 'neutral' ? 250 : 0)
      break
    }
    case 'announced': {
      const a = getLastAnnouncement(run)
      if (a?.plausibility === 'unglaubwuerdig') playSound('bad')
      else if (a?.plausibility === 'perfekt' || a?.plausibility === 'plausibel') playSound('good')
      break
    }
    case 'upgrade':
      playSound('arrival')
      break
    case 'victory':
      playSound('victory')
      break
    case 'gameover':
      playSound('gameover')
      break
  }
}

/** Tastatur: 1–5 wählt, Enter/Leertaste bestätigt die Hauptaktion, M schaltet den Ton. */
function useHotkeys() {
  const { settings, update } = useSettings()
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return
      const target = event.target instanceof Element ? event.target : null
      if (target?.closest('input, textarea, select, [role="group"]')) return
      if (/^[1-5]$/.test(event.key)) {
        const button = document.querySelector<HTMLButtonElement>(`[data-hotkey="${event.key}"]`)
        if (button && !button.disabled) {
          event.preventDefault()
          button.click()
        }
      } else if (event.key === 'Enter' || event.key === ' ') {
        // Auf fokussierten Bedienelementen übernimmt der Browser.
        if (target?.closest('button, a, summary')) return
        const primary = document.querySelector<HTMLButtonElement>('[data-primary]')
        if (primary) {
          event.preventDefault()
          primary.click()
        }
      } else if (event.key === 'm' || event.key === 'M') {
        update({ sound: !settings.sound })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [settings.sound, update])
}

function Game() {
  const { state, dispatch } = useGame()
  const run = state.run
  useHotkeys()
  const tutorial = useTutorial()
  const hint = state.screen === 'game' ? currentHint(tutorial.tutorial, run) : null

  // Warnton, sobald ein Wert in den kritischen Bereich rutscht (nicht bei jedem Ereignis erneut).
  const criticalCount = run && state.screen === 'game' ? criticalWarnings(run).length : 0
  const lastCritical = useRef(criticalCount)
  useEffect(() => {
    if (criticalCount > lastCritical.current) playSound('critical')
    lastCritical.current = criticalCount
  }, [criticalCount])

  const phaseKey = run && state.screen === 'game' ? `${run.phase}-${run.eventIndex}` : 'menu'
  const lastKey = useRef(phaseKey)
  const liveRef = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    if (lastKey.current === phaseKey) return
    lastKey.current = phaseKey
    if (!run || state.screen !== 'game') return
    phaseSound(run)
    if (liveRef.current) liveRef.current.textContent = phaseMessage(run)
    // Fokus auf die neue Überschrift, damit Tastatur und Screenreader beim neuen Inhalt landen.
    document.querySelector<HTMLElement>('[data-phase-heading]')?.focus({ preventScroll: false })
  }, [phaseKey, run, state.screen])

  if (state.screen === 'menu' || !run) {
    return (
      <MainMenu
        hasSavedRun={run !== null}
        onStart={(seed) => dispatch({ type: 'start', seed })}
        onResume={() => dispatch({ type: 'resume' })}
        onAbandon={() => dispatch({ type: 'abandon' })}
        tutorialEnabled={tutorial.tutorial.enabled}
        onTutorialChange={tutorial.setEnabled}
        onTutorialReset={tutorial.reset}
      />
    )
  }

  const endProps = {
    state: run,
    onNewRun: () => dispatch({ type: 'start', seed: randomSeed() }),
    onRetrySeed: () => dispatch({ type: 'start', seed: run.seed }),
    onMenu: () => dispatch({ type: 'menu' }),
  }
  const incident = getCurrentIncident(run)
  const decision = getLastDecision(run)
  const announcement = getLastAnnouncement(run)
  const onContinue = () => dispatch({ type: 'continue' })
  const finished = isFinished(run)

  return (
    // Neue Fahrt = frischer Aufbau, damit keine Animation der alten Fahrt nachläuft.
    <div key={state.runId} className="flex min-h-screen flex-col">
      <a href="#spielbereich" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-board-yellow focus:px-3 focus:py-2 focus:text-board-deep">
        Zum Spielbereich springen
      </a>
      <TopBar run={run} onMenu={() => dispatch({ type: 'menu' })} />
      <p ref={liveRef} aria-live="polite" className="sr-only" />

      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <main id="spielbereich" className="min-w-0 space-y-4">
          {!finished && (
            <div className="rounded-lg border-2 border-board-line bg-board-card/80 p-3 lg:hidden">
              <ResourceMeters run={run} compact />
              <Credibility value={run.credibility} compact />
            </div>
          )}
          {!finished && <CriticalWarning run={run} />}
          {hint && (
            <TutorialHintBox
              key={hint.hint.id}
              hint={hint.hint}
              number={hint.number}
              onDismiss={() => tutorial.dismiss(hint.hint.id)}
              onDisable={tutorial.disable}
            />
          )}
          <div key={phaseKey} className="anim-enter">
            {run.phase === 'incident' && (
              <IncidentScreen state={run} incident={incident} onChoose={(choiceId) => dispatch({ type: 'choose', choiceId })} />
            )}
            {run.phase === 'result' && decision && <ResultScreen state={run} incident={incident} decision={decision} onContinue={onContinue} />}
            {run.phase === 'announcement' && (
              <AnnouncementScreen state={run} incident={incident} decision={decision} onPlay={(cardId) => dispatch({ type: 'playExcuse', cardId })} />
            )}
            {run.phase === 'announced' && announcement && <AnnouncedScreen state={run} incident={incident} record={announcement} onContinue={onContinue} />}
            {run.phase === 'upgrade' && <UpgradeScreen state={run} onChoose={(upgradeId) => dispatch({ type: 'chooseUpgrade', upgradeId })} />}
            {run.phase === 'victory' && <VictoryScreen {...endProps} />}
            {run.phase === 'gameover' && <GameOverScreen {...endProps} />}
          </div>
        </main>
        <aside aria-label="Zugstatus" className="min-w-0">
          <SidePanel run={run} />
        </aside>
      </div>

      <footer className="mx-auto w-full max-w-7xl space-y-4 px-4 pb-8 sm:px-6">
        <TrainTrack run={run} />
        {!finished && <RecentLog run={run} />}
      </footer>
    </div>
  )
}
