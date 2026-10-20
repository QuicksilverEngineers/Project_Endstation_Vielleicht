import { TUTORIAL_HINTS, type TutorialHint } from '../state/tutorial'
import { PixelIcon } from './PixelIcon'

interface TutorialHintBoxProps {
  hint: TutorialHint
  number: number
  onDismiss: () => void
  onDisable: () => void
}

/** Einstiegstipp über dem Spielbereich. Blockiert nichts; das Spiel geht auch ohne Klick darauf weiter. */
export function TutorialHintBox({ hint, number, onDismiss, onDisable }: TutorialHintBoxProps) {
  return (
    <aside
      aria-label={`Tipp ${number} von ${TUTORIAL_HINTS.length}: ${hint.title}`}
      className="anim-enter rounded-lg border-2 border-dashed border-board-sky/70 bg-board-sky/10 p-4 text-sm"
    >
      <p className="flex items-center gap-2 font-board text-xs tracking-widest text-board-sky uppercase">
        <PixelIcon name="flag" size={12} />
        Tipp {number} von {TUTORIAL_HINTS.length} · {hint.title}
      </p>
      <p className="mt-2 max-w-prose leading-relaxed text-white/90">{hint.text}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onDismiss}
          className="rounded border border-board-sky/70 px-3 py-1.5 font-board text-xs text-board-sky hover:bg-board-sky/15"
        >
          Verstanden
        </button>
        <button type="button" onClick={onDisable} className="rounded px-3 py-1.5 font-board text-xs text-white/60 underline hover:text-white">
          Tipps ausblenden
        </button>
      </div>
    </aside>
  )
}
