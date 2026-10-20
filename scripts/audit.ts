/**
 * Spielspaß-Audit mit echten Simulationsläufen: `npm run audit`.
 * Misst Wahlhäufigkeiten, dominierte Optionen, Kartenwert, Aktivierung von Verbesserungen,
 * Niederlagen nach Station und Klicks pro Fahrt. Schreibt docs/audit-data.md.
 */
import { writeFileSync } from 'node:fs'
import { evaluateExcuse } from '../src/game/announcements'
import { createRun } from '../src/game/engine'
import { getExcuse } from '../src/game/excuses'
import { FOLLOW_UPS, getIncident, INCIDENTS } from '../src/game/incidents'
import { STATIONS } from '../src/game/stations'
import type { GameState, UpgradeId } from '../src/game/types'
import { UPGRADES } from '../src/game/upgrades'
import { evaluateStrategy, expectedChange, getStrategy, seeds, type RunResult } from '../src/sim/simulate'

const RUNS = Number(process.argv[2] ?? 2000)
const runSeeds = seeds(RUNS, 300000)
const lines: string[] = []
const out = (l = '') => lines.push(l)
const pct = (x: number) => `${(x * 100).toFixed(1)} %`

out('# Audit-Daten')
out()
out(`Erzeugt mit \`npm run audit\`, ${RUNS} Fahrten je Strategie (Seeds ${runSeeds[0]}–${runSeeds.at(-1)}).`)
out()

const runsBy: Record<string, RunResult[]> = {}
for (const id of ['random', 'beginner', 'conservative', 'balanced']) runsBy[id] = evaluateStrategy(getStrategy(id), runSeeds).results

// ── 1. Wahlhäufigkeit je Option (Referenzstrategie) ─────────────────────────────────
out('## Welche Optionen wählt gutes Spiel?')
out()
out('Anteil, mit dem die Referenzstrategie (Ausgewogen) jede Option wählt. ⚠ = dominant (über 85 %) oder praktisch nie gewählt (unter 5 %), bei mindestens 40 Auftritten.')
out()
const picks = new Map<string, number[]>()
for (const r of runsBy.balanced) {
  for (const h of r.state.history) {
    const incident = getIncident(h.incidentId)!
    const counts = picks.get(h.incidentId) ?? [0, 0, 0]
    counts[incident.choices.findIndex((c) => c.id === h.choiceId)]++
    picks.set(h.incidentId, counts)
  }
}
out('| Vorfall | n | A | B | C | Auffällig |')
out('|---|---|---|---|---|---|')
const flagged: string[] = []
for (const incident of [...INCIDENTS, ...FOLLOW_UPS]) {
  const counts = picks.get(incident.id) ?? [0, 0, 0]
  const n = counts.reduce((a, b) => a + b, 0)
  const shares = counts.map((c) => (n ? c / n : 0))
  const notes = incident.choices
    .map((c, i) => (n >= 40 && shares[i] > 0.85 ? `⚠ ${c.label} dominant` : n >= 40 && shares[i] < 0.05 ? `⚠ ${c.label} kaum gewählt` : ''))
    .filter(Boolean)
  if (notes.length) flagged.push(`${incident.id}: ${notes.join('; ')}`)
  out(`| ${incident.title} | ${n} | ${shares.map(pct).join(' | ')} | ${notes.join('; ')} |`)
}
out()
const kindTotals = { safe: 0, risky: 0, strategic: 0 }
for (const r of runsBy.balanced) for (const h of r.state.history) kindTotals[h.kind]++
const kindSum = kindTotals.safe + kindTotals.risky + kindTotals.strategic
out(`Gewählte Arten (Referenz): sicher ${pct(kindTotals.safe / kindSum)}, riskant ${pct(kindTotals.risky / kindSum)}, strategisch ${pct(kindTotals.strategic / kindSum)}.`)
out()

// ── 2. Dominierte Optionen (statisch) ───────────────────────────────────────────────
out('## Dominierte Optionen')
out()
out('Erwartete Änderung (inkl. Risiko und Kosten neuer Probleme) an der schwierigsten Station, an der der Vorfall vorkommt, ohne Verbesserungen. Eine Option ist dominiert, wenn eine andere in allen drei Ressourcen mindestens gleich gut und in einer besser ist.')
out()
const dominated: string[] = []
for (const incident of [...INCIDENTS, ...FOLLOW_UPS]) {
  const stationIndex = Math.max(...STATIONS.map((s, i) => (incident.trigger ? i : s.tier === incident.tier ? i : -1)))
  let state: GameState = createRun('audit')
  state = { ...state, stationIndex, eventIndex: state.events.findIndex((e) => e.stationIndex === stationIndex) }
  state = { ...state, events: state.events.map((e, i) => (i === state.eventIndex ? { ...e, incidentId: incident.id } : e)) }
  const ex = incident.choices.map((c) => expectedChange(state, c))
  const better = (a: (typeof ex)[number], b: (typeof ex)[number]) =>
    a.delay <= b.delay && a.satisfaction >= b.satisfaction && a.condition >= b.condition && (a.delay < b.delay || a.satisfaction > b.satisfaction || a.condition > b.condition)
  incident.choices.forEach((c, i) => {
    const by = incident.choices.findIndex((_, j) => j !== i && better(ex[j], ex[i]))
    if (by >= 0) dominated.push(`${incident.title}: „${c.label}“ wird von „${incident.choices[by].label}“ dominiert`)
  })
}
out(dominated.length ? dominated.map((d) => `- ${d}`).join('\n') : '- keine')
out()

// ── 3. Karten ───────────────────────────────────────────────────────────────────────
out('## Ausreden: Wert und Wahl')
out()
out('„Wahl, wenn auf der Hand“: wie oft die Referenz eine Karte spielt, wenn sie sie halten könnte. „Ø Wert“: durchschnittliche Zufriedenheitswirkung der Karte über alle Hände, egal ob gespielt.')
out()
const held = new Map<string, { held: number; played: number; value: number; plausible: number }>()
for (const r of runsBy.balanced) {
  for (const a of r.state.announcements) {
    // Hand zum Zeitpunkt der Durchsage rekonstruieren ist teuer; stattdessen alle Karten im Deck bewerten
    const card = held.get(a.cardId) ?? { held: 0, played: 0, value: 0, plausible: 0 }
    card.played++
    held.set(a.cardId, card)
  }
}
// Wert jeder Karte gegen jeden Vorfall bei Startwerten
const baseState = createRun('audit')
const cardRows = [...new Set([...runsBy.balanced.flatMap((r) => r.cards.map((c) => c.cardId))])].map((id) => {
  const values = [...INCIDENTS, ...FOLLOW_UPS].map((incident) => evaluateExcuse(baseState, id, incident))
  const avg = values.reduce((s, v) => s + v.satisfaction, 0) / values.length
  const plausible = values.filter((v) => v.plausibility !== 'unglaubwuerdig').length / values.length
  return { id, avg, plausible, played: held.get(id)?.played ?? 0 }
})
cardRows.sort((a, b) => b.avg - a.avg)
out('| Ausrede | Seltenheit | Ø Wirkung (alle Vorfälle) | passt zu | gespielt (Referenz) |')
out('|---|---|---|---|---|')
for (const c of cardRows) out(`| ${getExcuse(c.id)!.name} | ${getExcuse(c.id)!.rarity} | ${c.avg.toFixed(1)} | ${pct(c.plausible)} | ${c.played} |`)
out()

// ── 4. Verbesserungen: wie oft wirken sie? ──────────────────────────────────────────
out('## Verbesserungen: Aktivierungen')
out()
out('Mit Zufallswahl der Verbesserungen (Anfänger-Strategie). „Besitz“ = Fahrten, in denen sie gewählt wurde. „Aktiv“ = durchschnittliche Zahl der Gelegenheiten pro Fahrt nach der Wahl, bei denen sie tatsächlich etwas verändert hat.')
out()
function activations(r: RunResult): Partial<Record<UpgradeId, number>> {
  const s = r.state
  const acquiredAt = new Map<UpgradeId, number>()
  // Station, ab der eine Verbesserung besessen wurde (Ankünfte in Reihenfolge)
  let pickIndex = 0
  for (const arrival of s.arrivals) {
    const id = r.upgrades[pickIndex++]
    if (id && !acquiredAt.has(id)) acquiredAt.set(id, arrival.stationIndex)
  }
  const owned = (id: UpgradeId, station: number) => acquiredAt.has(id) && station >= acquiredAt.get(id)!
  const count: Partial<Record<UpgradeId, number>> = {}
  const add = (id: UpgradeId) => (count[id] = (count[id] ?? 0) + 1)
  for (const h of s.history) {
    const incident = getIncident(h.incidentId)!
    if (h.changes.some((c) => c.source === 'bistro')) add('bistro-flatrate')
    if (h.changes.some((c) => c.source === 'ersatzbus')) add('ersatzbus')
    if (h.changes.some((c) => c.source === 'reserve') && owned('fahrplan-puffer', h.stationIndex)) add('fahrplan-puffer')
    if (h.kind === 'risky' && owned('zocker', h.stationIndex)) add('zocker')
    if (incident.categories.includes('fahrgaeste') && h.changes[0].delta.satisfaction < 0 && owned('legendaerer-schaffner', h.stationIndex)) add('legendaerer-schaffner')
    if (h.changes.some((c) => c.source !== 'choice' && c.source !== 'reserve' && c.source !== 'bistro' && c.source !== 'ersatzbus') && owned('dickes-fell', h.stationIndex)) add('dickes-fell')
    if (h.statusesAdded.length && owned('fruehwarnung', h.stationIndex)) add('fruehwarnung')
  }
  for (const a of s.announcements) {
    const station = s.history.find((h) => h.eventIndex === a.eventIndex)!.stationIndex
    const card = getExcuse(a.cardId)!
    if (owned('durchsage-profi', station) && a.plausibility !== 'unglaubwuerdig') add('durchsage-profi')
    if (owned('repertoire', station)) add('repertoire')
    if (owned('pressesprecher', station) && (a.plausibility === 'unglaubwuerdig' || a.plausibility === 'neutral')) add('pressesprecher')
    if (owned('schuld-andere', station) && card.external && a.plausibility !== 'unglaubwuerdig') add('schuld-andere')
    if (owned('seriose-stimme', station) && a.credibilityAfter > a.credibilityBefore) add('seriose-stimme')
    if (s.rewards.includes(a.cardId)) add('pressemappe')
  }
  for (const arrival of s.arrivals) for (const c of arrival.changes) add(c.source)
  return count
}
const upgradeRows = new Map<UpgradeId, { owned: number; active: number }>()
for (const r of runsBy.beginner) {
  const counts = activations(r)
  for (const id of new Set(r.upgrades)) {
    const row = upgradeRows.get(id) ?? { owned: 0, active: 0 }
    row.owned++
    row.active += counts[id] ?? 0
    upgradeRows.set(id, row)
  }
}
out('| Verbesserung | Besitz | Ø Aktivierungen pro Fahrt |')
out('|---|---|---|')
const lowActivation: string[] = []
for (const [id, row] of [...upgradeRows].sort((a, b) => b[1].active / b[1].owned - a[1].active / a[1].owned)) {
  const avg = row.active / row.owned
  if (avg < 1) lowActivation.push(`${UPGRADES[id].name} (${avg.toFixed(2)})`)
  out(`| ${UPGRADES[id].name} | ${row.owned} | ${avg.toFixed(2)} |`)
}
out()
out(`Selten aktiv (unter 1× pro Fahrt): ${lowActivation.join(', ') || 'keine'}`)
out()

// ── 5. Niederlagen nach Station ─────────────────────────────────────────────────────
out('## Wo und woran Fahrten scheitern')
out()
out('| Strategie | ' + STATIONS.map((s) => s.name.replace(' Hbf', '')).join(' | ') + ' |')
out('|---|' + STATIONS.map(() => '---').join('|') + '|')
for (const id of ['random', 'beginner', 'conservative', 'balanced']) {
  const counts = STATIONS.map(() => 0)
  for (const r of runsBy[id]) if (!r.won) counts[r.stationsReached - 1]++
  out(`| ${getStrategy(id).name} | ${counts.map((c) => (c ? pct(c / RUNS) : '–')).join(' | ')} |`)
}
out()
for (const id of ['beginner', 'conservative']) {
  const reasons = { delay: 0, satisfaction: 0, condition: 0 }
  for (const r of runsBy[id]) for (const f of r.failures) reasons[f]++
  out(`- ${getStrategy(id).name}: Niederlagen durch Verspätung ${reasons.delay}, Zufriedenheit ${reasons.satisfaction}, Zugzustand ${reasons.condition}.`)
}
out()

// ── 6. Klicks ───────────────────────────────────────────────────────────────────────
out('## Bedienaufwand')
out()
const clicks = (r: RunResult) => {
  const s = r.state
  // Option + Ausrede + „Weiter“ je Ereignis (das Ergebnis steht direkt über der Durchsage), jede Verbesserungswahl,
  // und bei einer Niederlage direkt nach der Entscheidung ein „Weiter“ auf dem Ergebnisbildschirm.
  const lostOnDecision = s.phase === 'gameover' && s.announcements.at(-1)?.eventIndex !== s.eventIndex ? 1 : 0
  return s.history.length * 3 - lostOnDecision + s.upgrades.reduce((a, u) => a + u.stacks, 0)
}
const avgClicks = runsBy.beginner.reduce((a, r) => a + clicks(r), 0) / RUNS
const avgDecisions = runsBy.beginner.reduce((a, r) => a + r.state.history.length * 2 + r.upgrades.length, 0) / RUNS
out(`- Anfänger: Ø ${avgClicks.toFixed(1)} Klicks pro Fahrt, davon ${avgDecisions.toFixed(1)} echte Entscheidungen (Option, Ausrede, Verbesserung) und ${(avgClicks - avgDecisions).toFixed(1)} reine „Weiter“-Klicks.`)
out()

out('## Kurzfassung der Auffälligkeiten')
out()
out('- Auffällige Wahlhäufigkeiten:')
for (const f of flagged) out(`  - ${f}`)
out(`- Dominierte Optionen: ${dominated.length}`)
out(`- Selten aktive Verbesserungen: ${lowActivation.join(', ') || 'keine'}`)

writeFileSync('docs/audit-data.md', `${lines.join('\n')}\n`)
console.log(lines.filter((l) => !l.startsWith('|')).join('\n'))
