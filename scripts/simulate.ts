/**
 * Kopflose Balance-Simulation: `npm run simulate` (optional: `npm run simulate -- 3000` für mehr Fahrten).
 * Schreibt docs/balance-report.md und gibt eine Kurzfassung aus. Alle Zahlen stammen aus echten Läufen.
 */
import { writeFileSync } from 'node:fs'
import { getExcuse } from '../src/game/excuses'
import { STATIONS } from '../src/game/stations'
import type { FailureReason } from '../src/game/types'
import { UPGRADES } from '../src/game/upgrades'
import { cardStats, evaluateStrategy, getStrategy, seeds, STRATEGIES, upgradeEffects, worstCard, type RunResult } from '../src/sim/simulate'

const RUNS = Number(process.argv[2] ?? 2000)
const UPGRADE_RUNS = Math.min(RUNS, 1000)
const started = Date.now()

const pct = (x: number) => `${(x * 100).toFixed(1)} %`
const num = (x: number, digits = 1) => x.toFixed(digits)
const FAILURE_LABELS: Record<FailureReason, string> = { delay: 'Verspätung', satisfaction: 'Zufriedenheit', condition: 'Zugzustand' }

const runSeeds = seeds(RUNS)
const lines: string[] = []
const out = (line = '') => lines.push(line)

out('# Balance-Bericht')
out()
out(`Erzeugt mit \`npm run simulate\` am ${new Date().toISOString().slice(0, 10)}. ${RUNS} Fahrten je Strategie mit denselben Seeds (${runSeeds[0]}–${runSeeds.at(-1)}).`)
out('Alle Zahlen stammen aus echten Läufen der Spiellogik. Die Spielzeit ist eine Schätzung aus der Textmenge (siehe unten).')
out()

// ── Strategien ──────────────────────────────────────────────────────────────────────
const all: { id: string; results: RunResult[] }[] = []
out('## Strategien im Vergleich')
out()
out('| Strategie | Siegquote | Züge (Vorfälle) | Stationen erreicht | Spielzeit (geschätzt) | Folgeereignisse | Häufigster Grund für Niederlagen |')
out('|---|---|---|---|---|---|---|')
for (const strategy of STRATEGIES) {
  const { report, results } = evaluateStrategy(strategy, runSeeds)
  all.push({ id: strategy.id, results })
  const losses = Object.entries(report.failures).sort((a, b) => b[1] - a[1])
  const lossText = losses[0][1] === 0 ? '–' : losses.filter(([, n]) => n > 0).map(([k, n]) => `${FAILURE_LABELS[k as FailureReason]} (${n})`).join(', ')
  out(
    `| ${strategy.name} | **${pct(report.winRate)}** | ${num(report.avgTurns)} | ${num(report.avgStations)} / 8 | ${num(report.avgMinutes)} min (${num(report.minutesP10)}–${num(report.minutesP90)}) | ${num(report.avgFollowUps, 2)} | ${lossText} |`,
  )
  console.log(`${strategy.name.padEnd(24)} Sieg ${pct(report.winRate).padStart(7)}  Züge ${num(report.avgTurns)}  Stationen ${num(report.avgStations)}  ~${num(report.avgMinutes)} min  Niederlagen ${JSON.stringify(report.failures)}`)
}
out()
out('Strategien:')
for (const s of STRATEGIES) out(`- **${s.name}**: ${s.description}`)
out()

// ── Verläufe ────────────────────────────────────────────────────────────────────────
out('## Ressourcenverläufe')
out()
out('Durchschnitt bei Ankunft an jeder Station, nur Fahrten, die die Station erreicht haben. „Erreicht“ = Anteil der Fahrten.')
out()
for (const id of ['beginner', 'balanced']) {
  const { report } = evaluateStrategy(getStrategy(id), runSeeds)
  out(`### ${report.strategy.name}`)
  out()
  out('| Station | Erreicht | Verspätung | Zufriedenheit | Zugzustand |')
  out('|---|---|---|---|---|')
  for (const t of report.trajectory) out(`| ${t.station} | ${pct(t.reached)} | ${num(t.delay)} | ${num(t.satisfaction)} | ${num(t.condition)} |`)
  out(`| Ende | – | ${num(report.avgFinal.delay)} | ${num(report.avgFinal.satisfaction)} | ${num(report.avgFinal.condition)} |`)
  out()
}

// ── Einfluss der Ausreden ───────────────────────────────────────────────────────────
out('## Einfluss der Ausreden')
out()
out('Dieselben Seeds und Entscheidungen, nur die Kartenwahl ändert sich.')
out()
out('| Entscheidungen | Beste Ausrede | Nach Etikett | Zufällig | Schlechteste |')
out('|---|---|---|---|---|')
for (const id of ['beginner', 'balanced']) {
  const strategy = getStrategy(id)
  const rate = (card: typeof strategy.card) => evaluateStrategy(strategy, runSeeds, { card }).report.winRate
  const label = getStrategy('beginner').card
  const random = getStrategy('random').card
  const best = getStrategy('balanced').card
  const row = [rate(best), rate(label), rate(random), rate(worstCard)]
  out(`| ${strategy.name} | ${row.map(pct).join(' | ')} |`)
  console.log(`Karten (${strategy.name}): beste ${pct(row[0])}, Etikett ${pct(row[1])}, zufällig ${pct(row[2])}, schlechteste ${pct(row[3])}`)
}
out()

out('### Kartennutzung (alle Strategien)')
out()
out('| Ausrede | Seltenheit | Gespielt | Ø Zufriedenheit | perfekt | passt | Allzweck | unglaubwürdig |')
out('|---|---|---|---|---|---|---|---|')
for (const c of cardStats(all.flatMap((a) => a.results))) {
  const card = getExcuse(c.cardId)!
  const share = (n: number) => pct(n / c.plays)
  out(
    `| ${card.name} | ${card.rarity} | ${c.plays} | ${num(c.avgSatisfaction)} | ${share(c.plausibility.perfekt)} | ${share(c.plausibility.plausibel)} | ${share(c.plausibility.neutral)} | ${share(c.plausibility.unglaubwuerdig)} |`,
  )
}
out()

// ── Verbesserungen ──────────────────────────────────────────────────────────────────
out('## Wirksamkeit der Verbesserungen')
out()
out(`Kontrollierter Vergleich mit ${UPGRADE_RUNS} Fahrten: Die Verbesserung ist ab Berlin vorhanden (eine Stufe), sonst identische Seeds und Strategie.`)
out('Ziel: Keine einzelne Verbesserung macht den Sieg automatisch.')
out()
const upgradeSeeds = seeds(UPGRADE_RUNS, 50000)
const upgradeTables = ['beginner', 'balanced'].map((id) => ({ id, ...upgradeEffects(getStrategy(id), upgradeSeeds) }))
out(`| Verbesserung | ${upgradeTables.map((t) => `${getStrategy(t.id).name}: Sieg (Δ)`).join(' | ')} |`)
out(`|---|${upgradeTables.map(() => '---').join('|')}|`)
for (const effect of upgradeTables[0].effects) {
  const cells = upgradeTables.map((t) => {
    const e = t.effects.find((x) => x.id === effect.id)!
    return `${pct(e.winRate)} (${e.delta >= 0 ? '+' : ''}${num(e.delta)} pp)`
  })
  out(`| ${UPGRADES[effect.id].name} | ${cells.join(' | ')} |`)
}
out(`| *ohne* | ${upgradeTables.map((t) => pct(t.baseline)).join(' | ')} |`)
out()
for (const t of upgradeTables) {
  const top = t.effects[0]
  console.log(`Verbesserungen (${getStrategy(t.id).name}): Basis ${pct(t.baseline)}, stärkste ${UPGRADES[top.id].name} ${pct(top.winRate)} (+${num(top.delta)} pp), schwächste ${UPGRADES[t.effects.at(-1)!.id].name} (${num(t.effects.at(-1)!.delta)} pp)`)
}

// ── Glück und Spannung ──────────────────────────────────────────────────────────────
out('## Glück und Spannung')
out()
const balanced = all.find((a) => a.id === 'balanced')!.results
const wins = balanced.filter((r) => r.won)
const close = wins.filter((r) => r.final.delay >= 20 || r.final.satisfaction <= 20 || r.final.condition <= 20)
out(`- Ausgewogene Strategie: ${pct(wins.length / balanced.length)} Siege, davon ${pct(close.length / Math.max(1, wins.length))} knapp (Verspätung ≥ 20 oder eine Ressource ≤ 20).`)
const failedRisky = balanced.filter((r) => r.state.history.some((h) => h.kind === 'risky' && !h.success)).length
out(`- In ${pct(failedRisky / balanced.length)} dieser Fahrten ging mindestens eine riskante Entscheidung schief.`)
const beginner = all.find((a) => a.id === 'beginner')!.results
const randomRuns = all.find((a) => a.id === 'random')!.results
out(`- Anfänger gewinnen ${pct(beginner.filter((r) => r.won).length / beginner.length)}, reiner Zufall ${pct(randomRuns.filter((r) => r.won).length / randomRuns.length)}.`)
const uniqueOrders = new Set(balanced.map((r) => r.state.events.map((e) => e.incidentId).join())).size
out(`- ${uniqueOrders} verschiedene Vorfallsfolgen in ${balanced.length} Fahrten.`)
out()

out('## Spielzeit-Schätzung')
out()
out('Lesetempo 180 Wörter pro Minute für alle angezeigten Texte (Vorfall, Optionen, Ergebnis, Karten, Durchsage, Verbesserungen), dazu 12 s Bedenkzeit je Vorfall, 10 s je Ausrede und Verbesserung und 3 s je Bildschirmwechsel. Gemessen wurde das nicht; es ist eine Abschätzung aus den echten Texten jeder simulierten Fahrt.')
out()
out(`Stationen: ${STATIONS.map((s) => s.name).join(' → ')}`)
out()
out(`Laufzeit der Simulation: ${((Date.now() - started) / 1000).toFixed(1)} s.`)

writeFileSync('docs/balance-report.md', `${lines.join('\n')}\n`)
console.log(`\nBericht geschrieben: docs/balance-report.md (${((Date.now() - started) / 1000).toFixed(1)} s)`)
