# Endstation: Vielleicht

> *Wir erreichen unser Ziel. Vermutlich.*

Ein satirisches Zug-Roguelike im Browser über Verspätungen, Ausreden und Durchsagen. Sie sind Zugchef im PX 404 der fiktiven Bahngesellschaft **PÜNKT – Fernverkehr mit Vorbehalt** und bringen Ihren Zug über acht Stationen von Berlin Hbf nach München Hbf – mit Entscheidungen, Ausreden und einer Lautsprecheranlage.

Endstation: Vielleicht ist ein eigenständiges satirisches Spiel. Es besteht keine Verbindung zu realen Eisenbahnunternehmen. Alle Grafiken, Klänge und Texte sind eigene Arbeiten; es werden keine Logos oder fremden Assets verwendet. Die Oberfläche ist auf Deutsch.

## Die Welt

- **PÜNKT** ist ein erfundener Fernverkehrsbetreiber mit dem Leitbild „Ankommen ist unser Ziel. Nicht unbedingt Ihres.“ Er taucht sparsam auf: in Durchsagen, Kundeninformationen, einzelnen Verbesserungen und Vorfällen.
- **PX 404** ist die (erfundene) Zuggattung samt Zugnummer.
- Bahnbegriffe wie Stellwerkstörung, Personen im Gleis, Schienenersatzverkehr, Wagenreihung oder „Verzögerungen im Betriebsablauf“ bleiben bewusst erhalten: Sie sind allgemeiner deutscher Bahnalltag, keine Marke.

**Gestaltung:** Mitternachtsblau/Anthrazit als Grund, warmes Signalgelb als Hauptfarbe, gedämpftes Cyan als Zweitfarbe, Koralle für Gefahr. Das Markenzeichen ist eine Bahnhofsuhr mit zwei Minutenzeigern – einem offiziellen und einem realistischen (`src/components/Brand.tsx`, `public/favicon.svg`).

Details zur Umbenennung stehen in [REBRANDING_REPORT.md](REBRANDING_REPORT.md).

## Schnellstart

Voraussetzung: Node.js 20.19 oder neuer (empfohlen: 22).

```bash
npm install
```

```bash
npm run dev
```

Der Entwicklungsserver läuft dann unter http://localhost:5173.

| Befehl | Zweck |
|---|---|
| `npm run dev` | Entwicklungsserver mit Hot Reload |
| `npm test` | alle Tests (Vitest, jsdom) |
| `npm run typecheck` | TypeScript-Prüfung |
| `npm run build` | Typprüfung und Produktions-Build nach `dist/` |
| `npm run preview` | den Produktions-Build lokal ansehen |
| `npm run check` | Tests und Build in einem Schritt (so baut auch CI/Netlify/Vercel) |
| `npm run simulate` | Balance-Simulation, schreibt `docs/balance-report.md` (`npm run simulate -- 5000` für mehr Fahrten) |
| `npm run audit` | Spielspaß-Audit (Wahlhäufigkeiten, dominierte Optionen, Kartenwert, Aktivierungen), schreibt `docs/audit-data.md` |

## Veröffentlichen

Das Spiel ist eine rein statische Seite: kein Server, keine Datenbank, keine externen Dienste. Gespeichert wird nur im Browser (localStorage). Der Ordner `dist/` nach `npm run build` lässt sich auf jedem statischen Hosting ablegen.

### Netlify

Konfiguration liegt in `netlify.toml` (Build-Befehl `npm run check`, Ausgabe `dist`, Node 22).

1. Repository bei GitHub/GitLab anlegen und pushen.
2. In Netlify „Add new site → Import an existing project“ wählen und das Repository verbinden. Die Einstellungen werden aus `netlify.toml` übernommen.

Oder ohne Repository, direkt von der Kommandozeile:

```bash
npm run build
```

```bash
npx netlify-cli deploy --prod --dir=dist
```

### Vercel

Konfiguration liegt in `vercel.json` (Framework Vite, Build-Befehl `npm run check`, Ausgabe `dist`).

1. Repository pushen und in Vercel „Add New → Project“ importieren, oder
2. von der Kommandozeile:

```bash
npx vercel --prod
```

### Kontinuierliche Prüfung

`.github/workflows/ci.yml` führt bei jedem Push und Pull Request `npm ci` und `npm run check` aus und lädt `dist/` als Artefakt hoch.

## So funktioniert das Spiel

**Ziel:** München Hbf erreichen, bevor eines davon passiert:

- die Verspätung erreicht **30 Minuten** (der eigentliche Gegner),
- die **Fahrgastzufriedenheit** fällt auf 0,
- der **Zugzustand** fällt auf 0.

**Ablauf an jeder Station**

1. **Vorfall.** Jede Station bringt einen Vorfall mit drei Optionen. Jede Option zeigt vorher nur ihre Art:
   - **Sicher** – vorhersehbare, moderate Nachteile.
   - **Riskant** (mit Risikostufe gering/mittel/hoch) – kann glimpflich ausgehen oder richtig schiefgehen.
   - **Strategisch** – opfert gezielt eine Ressource, um die anderen zu schonen.
   Was genau passiert, sehen Sie erst danach.
2. **Ergebnis.** Erscheint sofort, direkt über der Durchsage: was passiert ist, alle Änderungen (aufklappbar nach Herkunft: Entscheidung, laufende Probleme, Fahrzeitreserve) und mit ★ markiert, was Ihre Verbesserungen dazu beigetragen haben.
3. **Durchsage.** Sie ziehen drei Ausreden aus Ihrem Deck und spielen eine; danach erklärt ein „Warum?“, weshalb sie (nicht) gepasst hat. Vorfälle und Ausreden haben Themenbereiche (Technik, Fahrgäste, Infrastruktur, Wetter, Personal, Sicherheit, Betrieb). Passt die Ausrede, beruhigt sie die Fahrgäste und stärkt Ihre **Glaubwürdigkeit**; passt sie nicht, kostet sie Zufriedenheit und Glaubwürdigkeit. Jede Ausrede nutzt sich mit jeder Wiederholung ab. Glaubwürdigkeit (0–100) verstärkt oder schwächt alle Ausreden.
4. **Ankunft und Verbesserung.** An jeder neuen Station wählen Sie eine von drei Verbesserungen. Manche sind einzigartig, manche stapelbar, manche ergänzen sich mit bestimmten Ausreden (Synergien, mit ★ markiert).

**Weitere Regeln**

- **Laufende Probleme** (Hitze, Überfüllung, Technischer Mangel, Personal am Limit) entstehen durch manche Entscheidungen, kosten bei jedem Ereignis etwas und können **Folgeereignisse** auslösen – höchstens drei pro Fahrt, jedes nur einmal.
- **Fahrzeitreserve:** Zwischen zwei Stationen holt der Lokführer bis zu 2 Minuten auf.
- **Schwierigkeit:** Je näher München, desto stärker wirken Nachteile. Keine einzelne Entscheidung kann aus einem gesunden Zustand heraus sofort verlieren.
- **Fahrt-Nr.:** Jede Fahrt folgt einem Seed. Dieselbe Fahrt-Nr. mit denselben Entscheidungen ergibt denselben Verlauf.
- **Speichern:** automatisch nach jeder Aktion; Neuladen setzt die Fahrt fort. Spielstände, Einstellungen und Tipp-Fortschritt aus Versionen vor der Umbenennung werden beim ersten Start einmalig übernommen (`src/game/migration.ts`).
- **Bewertung am Ende:** von „Schienenersatzverkehr“ (E) bis „Fast schon Schweizer Verhältnisse“ (S).

**Einstieg:** Bei den ersten Fahrten erklären fünf kurze Tipps nacheinander die Grundlagen. Sie lassen sich einzeln bestätigen oder ganz ausblenden; im Hauptmenü kann man sie wieder einschalten oder von vorn beginnen.

**Bedienung:** Maus, Touch oder Tastatur – `1`–`5` wählt Option, Ausrede oder Verbesserung, `Enter` geht weiter, `M` schaltet den Ton. Unter „Einstellungen“: Ton, Lautstärke (Standard 35 %) und Animationen (wie System / voll / reduziert).

## Technik

React 19, TypeScript 7, Vite 8, Tailwind 4, Vitest 5. Schriften (VT323, IBM Plex) sind lokal gebündelt, Klänge werden live mit der Web Audio API erzeugt.

```
src/
  game/          reine Spiellogik ohne React (Engine, Daten, Speichern, Bewertung)
    engine.ts        Zustandsübergänge aller Phasen
    announcements.ts Deck, Plausibilität, Ausredenwirkung, Ansagetexte
    incidents.ts     32 Vorfälle (28 regulär, 4 Folgeereignisse)
    excuses.ts       19 Ausreden mit Ansagevorlagen
    upgrades.ts      17 Verbesserungen und 7 Synergien
    storage.ts       localStorage mit Validierung (kaputte Stände werden verworfen)
    migration.ts     einmalige Übernahme alter Speicherschlüssel (db-game:* → endstation:*)
    rating.ts        Abschlussbewertung und Statistik
  sim/simulate.ts  kopflose Simulation mit Strategien (für Balance und Tests)
  state/         App-Reducer, Speichern, Einstellungen
  audio/         Klangsynthese
  components/    Oberfläche (Brand.tsx: Markenzeichen, Schriftzug, Titel und Hinweise)
scripts/simulate.ts  erzeugt docs/balance-report.md
docs/            Balance-Bericht und Änderungsprotokoll
```

## Balance

Das Gameplay-Audit mit Befunden, Änderungen und offenen Risiken steht in [GAMEPLAY_AUDIT.md](GAMEPLAY_AUDIT.md).

Der aktuelle Stand ist in [docs/balance-report.md](docs/balance-report.md) (erzeugt aus echten Simulationsläufen) und die Begründung der letzten Anpassungen in [docs/balance-changes.md](docs/balance-changes.md) dokumentiert. Kurz: Anfänger gewinnen etwa jede zweite Fahrt, zufälliges Spiel etwa jede dritte, durchdachtes Spiel deutlich öfter.
