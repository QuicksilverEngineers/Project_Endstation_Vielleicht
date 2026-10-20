/**
 * Markenzeichen von „Endstation: Vielleicht“: eine Bahnhofsuhr mit zwei Minutenzeigern,
 * weil sich die Ankunftszeit nicht festlegen möchte. Selbst gezeichnet, keine fremden Vorlagen.
 */
export function BrandMark({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className={`shrink-0 ${className}`}>
      <rect x="1" y="1" width="30" height="30" rx="6" fill="var(--color-board-deep)" stroke="var(--color-board-line)" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="10.5" fill="none" stroke="var(--color-board-yellow)" strokeWidth="2.25" />
      <g stroke="var(--color-board-yellow)" strokeWidth="1.5" strokeLinecap="round" opacity="0.7">
        <line x1="16" y1="7.5" x2="16" y2="9" />
        <line x1="24.5" y1="16" x2="23" y2="16" />
        <line x1="16" y1="24.5" x2="16" y2="23" />
        <line x1="7.5" y1="16" x2="9" y2="16" />
      </g>
      {/* Stundenzeiger und die offizielle Minute */}
      <line x1="16" y1="16" x2="16" y2="10.5" stroke="var(--color-board-yellow)" strokeWidth="2.25" strokeLinecap="round" />
      <line x1="16" y1="16" x2="22.5" y2="16" stroke="var(--color-board-yellow)" strokeWidth="1.75" strokeLinecap="round" />
      {/* Die realistische Minute */}
      <line x1="16" y1="16" x2="20.5" y2="21.5" stroke="var(--color-board-sky)" strokeWidth="1.75" strokeLinecap="round" strokeDasharray="1.6 1.6" />
      <circle cx="16" cy="16" r="1.6" fill="var(--color-board-red)" />
    </svg>
  )
}

/** Zweizeiliger Schriftzug. Das letzte T flackert wie eine müde Anzeigetafel. */
export function Wordmark({ size = 'md' }: { size?: 'sm' | 'md' | 'xl' }) {
  const top = { sm: 'text-[10px]', md: 'text-xs', xl: 'text-sm sm:text-base' }[size]
  const bottom = { sm: 'text-2xl', md: 'text-3xl sm:text-4xl', xl: 'text-6xl sm:text-8xl' }[size]
  return (
    <span className="flex flex-col">
      <span className={`font-board font-semibold tracking-[0.42em] text-board-sky uppercase ${top}`} aria-hidden>
        Endstation:
      </span>
      <span className={`font-pixel leading-[0.85] tracking-wide text-board-yellow text-glow uppercase ${bottom}`} aria-hidden>
        Vielleich<span className="anim-flicker">t</span>
      </span>
    </span>
  )
}

/** Der fiktive Betreiber. Bewusst sparsam eingesetzt. */
export function OperatorBadge() {
  return (
    <p className="inline-flex items-center gap-2 rounded-full border border-board-sky/40 px-3 py-1 font-board text-[11px] text-white/70">
      <span className="font-semibold tracking-widest text-board-sky">PÜNKT</span>
      <span aria-hidden className="text-white/50">|</span>
      <span>Fernverkehr mit Vorbehalt</span>
    </p>
  )
}

export const GAME_TITLE = 'Endstation: Vielleicht'
export const TAGLINE = 'Wir erreichen unser Ziel. Vermutlich.'
export const OPERATOR_PROMISE = 'Ankommen ist unser Ziel. Nicht unbedingt Ihres.'
export const DISCLAIMER = 'Endstation: Vielleicht ist ein eigenständiges satirisches Spiel. Es besteht keine Verbindung zu realen Eisenbahnunternehmen.'
