import type { ReactNode } from 'react'
import { playSound } from '../audio/sound'
import { BrandMark, DISCLAIMER, GAME_TITLE, OperatorBadge, Wordmark } from './Brand'

interface BoardProps {
  children: ReactNode
  /** Rechte Seite der Kopfzeile, z. B. Einstellungen. */
  actions?: ReactNode
}

/** Rahmen für das Hauptmenü: Betreiberzeile oben, Hinweis zur Eigenständigkeit unten. */
export function Board({ children, actions }: BoardProps) {
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 sm:px-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-board-line pb-3">
        <OperatorBadge />
        <div className="flex items-center gap-2">{actions}</div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="mt-8 space-y-1 text-center font-board text-xs text-white/55">
        <p>{DISCLAIMER}</p>
        <p>Alle Grafiken, Klänge und Texte sind eigene Arbeiten. Alle Verspätungen sind frei erfunden, leider.</p>
      </footer>
    </div>
  )
}

/** Kleines Logo für die Kopfzeile im Spiel. */
export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <BrandMark size={36} />
      <h1>
        <span className="sr-only">{GAME_TITLE}</span>
        <Wordmark size="sm" />
      </h1>
    </div>
  )
}

type Tone = 'default' | 'alarm' | 'good' | 'bad'
const TONES: Record<Tone, string> = {
  default: 'border-board-line',
  alarm: 'border-board-red anim-alarm',
  good: 'border-board-green/70',
  bad: 'border-board-red/70',
}

export function Card({ children, className = '', tone = 'default' }: { children: ReactNode; className?: string; tone?: Tone }) {
  return (
    <section className={`rounded-lg border-2 bg-board-card/95 p-5 shadow-[0_8px_0_0_rgb(0_0_0/0.35)] ${TONES[tone]} ${className}`}>{children}</section>
  )
}

/** Tastenhinweis, z. B. [1] oder [Enter]. */
export function KeyHint({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      aria-hidden
      className={`hidden rounded border border-current/40 px-1 font-board text-[10px] leading-4 opacity-70 sm:inline-block ${className}`}
    >
      {children}
    </kbd>
  )
}

interface ButtonProps {
  children: ReactNode
  onClick: () => void
  hint?: string
  autoFocus?: boolean
}

export function PrimaryButton({ children, onClick, hint, autoFocus }: ButtonProps) {
  return (
    <button
      type="button"
      data-primary
      autoFocus={autoFocus}
      onClick={() => {
        playSound('select')
        onClick()
      }}
      className="inline-flex items-center gap-3 rounded bg-board-yellow px-5 py-3 font-board font-semibold text-board-deep shadow-[0_4px_0_0_#b3841a] transition hover:brightness-110 active:translate-y-1 active:shadow-none"
    >
      {children}
      {hint && <KeyHint>{hint}</KeyHint>}
    </button>
  )
}

export function SecondaryButton({ children, onClick, hint, label }: ButtonProps & { label?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        playSound('click')
        onClick()
      }}
      className="inline-flex items-center gap-2 rounded border border-board-yellow/60 px-3 py-2 font-board text-sm text-board-yellow transition hover:bg-board-yellow/10"
    >
      {children}
      {hint && <KeyHint>{hint}</KeyHint>}
    </button>
  )
}
