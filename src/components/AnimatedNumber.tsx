import { useEffect, useRef, useState } from 'react'
import { useSettings } from '../state/settings'

interface AnimatedNumberProps {
  value: number
  /** Formatierung der angezeigten Zahl. */
  format?: (value: number) => string
  /** Ob ein Anstieg gut ist (für die Farbe der schwebenden Änderung). */
  higherIsBetter?: boolean
  className?: string
}

/**
 * Zahl, die bei Änderungen kurz hochzählt, pulsiert und die Änderung schweben lässt.
 * Bei reduzierter Bewegung springt sie direkt auf den neuen Wert.
 */
export function AnimatedNumber({ value, format = String, higherIsBetter = true, className = '' }: AnimatedNumberProps) {
  const { reducedMotion } = useSettings()
  const [shown, setShown] = useState(value)
  const [delta, setDelta] = useState<{ value: number; key: number } | null>(null)
  const previous = useRef(value)

  useEffect(() => {
    const from = previous.current
    previous.current = value
    if (from === value) return
    setDelta({ value: value - from, key: Date.now() })
    if (reducedMotion || typeof requestAnimationFrame === 'undefined') {
      setShown(value)
      return
    }
    const start = performance.now()
    let frame = 0
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 450)
      setShown(Math.round(from + (value - from) * (1 - (1 - t) ** 3)))
      if (t < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [value, reducedMotion])

  const good = delta && (delta.value > 0) === higherIsBetter
  return (
    <span className={`relative inline-block tabular-nums ${className}`}>
      {/* Für Screenreader immer der Endwert, nie die Zwischenstände */}
      <span aria-hidden key={delta?.key} className={delta ? 'anim-pulse-value inline-block' : 'inline-block'}>
        {format(shown)}
      </span>
      <span className="sr-only">{format(value)}</span>
      {delta && (
        <span
          key={`d-${delta.key}`}
          aria-hidden
          className={`anim-float-up pointer-events-none absolute -top-4 right-0 font-board text-xs font-semibold ${good ? 'text-board-green' : 'text-board-red'}`}
        >
          {delta.value > 0 ? '+' : '−'}
          {Math.abs(delta.value)}
        </span>
      )}
    </span>
  )
}
