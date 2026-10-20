# Rebranding-Bericht: „DB: Bitte haben Sie Verständnis“ → „Endstation: Vielleicht“

Stand: 2026-10-20

Ziel war eine eigenständige Marke ohne Anleihen an der Unternehmensidentität der Deutschen Bahn – bei unverändertem Spiel. Dies ist eine Umbenennung, kein Neubau: Spiellogik, Balance, Inhalte, Seeds und Spielstände sind erhalten.

> **Kein Rechtsgutachten.** Dieser Bericht dokumentiert technische und gestalterische Änderungen. Er stellt **nicht** fest, dass der neue Titel, der fiktive Betreiber oder die Gestaltung markenrechtlich frei sind. Siehe Abschnitt „Offene Punkte für die rechtliche Prüfung“.

## Neue Identität

| | |
|---|---|
| Spieltitel | **Endstation: Vielleicht** |
| Leitspruch | „Wir erreichen unser Ziel. Vermutlich.“ |
| Untertitel | „Ein satirisches Zug-Roguelike“ |
| Fiktiver Betreiber | **PÜNKT – Fernverkehr mit Vorbehalt**, Leitbild: „Ankommen ist unser Ziel. Nicht unbedingt Ihres.“ |
| Zug | **PX 404** (vorher: ICE 1001) |
| Markenzeichen | Bahnhofsuhr mit zwei Minutenzeigern: einem offiziellen (gelb) und einem realistischen (gestrichelt, cyan); Mittelpunkt koralle |
| Schriftzug | „ENDSTATION:“ in IBM Plex Mono, gesperrt, cyan; darunter „VIELLEICHT“ in VT323, signalgelb, das letzte T flackert (bei reduzierter Bewegung nicht) |

### Farben (`src/index.css`)

| Rolle | vorher | jetzt |
|---|---|---|
| Hintergrund (tief / Fläche / Karte) | `#060b19` / `#0a1226` / `#111d3b` | `#080c14` / `#0e1420` / `#131b2b` – Mitternachtsblau Richtung Anthrazit |
| Linien | `#263a6b` | `#2a3850` |
| Hauptfarbe (Signalgelb) | `#ffd23f` | `#ffc940` |
| Bernstein | `#ffa630` | `#f0a43a` |
| Gefahr | `#ff4b3e` (Rot) | `#ff7a5c` (Koralle) |
| Zweitfarbe | `#7cc7ff` (Himmelblau) | `#74c6c6` (gedämpftes Cyan) |
| Erfolg | `#5fe08a` | `#6bdc8e` |

Die Token-Namen (`board-yellow`, `board-red`, …) bleiben, damit keine Komponente angefasst werden muss. Kein Rot-Weiß, keine Unternehmenslogos, keine Nachbildung eines realen Leitsystems. Die bestehende Kontrastprüfung (`src/regressions.test.tsx`) läuft weiter und hat beim Umbau einen zu blassen Trenner im Betreiber-Abzeichen erkannt (behoben).

## Geänderte Dateien

### Oberfläche
- **`src/components/Brand.tsx`** (neu): `BrandMark` (SVG), `Wordmark`, `OperatorBadge` sowie die Texte `GAME_TITLE`, `TAGLINE`, `OPERATOR_PROMISE`, `DISCLAIMER` an einer Stelle.
- **`src/components/MainMenu.tsx`**: Titelbildschirm mit großem Markenzeichen und Schriftzug, Leitspruch, Untertitel; darunter „Neue Fahrt starten“ (mit optionaler Fahrt-Nr.), „Fahrt fortsetzen“ (nur bei gespeicherter Fahrt), Tipps-Schalter; danach Abfahrtstafel (PX 404, Gleis „7?“, wechselnde PÜNKT-Kundeninformation) und Fahrtinformation. Alle bisherigen Bedienelemente und Rückfragen sind unverändert vorhanden.
- **`src/components/Board.tsx`**: Kopfzeile mit PÜNKT-Abzeichen statt altem Titel; Fußzeile mit dem Hinweis zur Eigenständigkeit; `Logo` zeigt das neue Markenzeichen.
- **`src/components/GameChrome.tsx`**: Zuganzeige „PX 404“, neues Markenzeichen in der Kopfzeile.
- **`src/components/EndScreens.tsx`**: kurze Schlusszeile auf Sieg- („Endstation: Vielleicht. Diesmal: ja.“) und Niederlagenbildschirm („Diesmal: nein.“ + PÜNKT-Leitbild).
- **`src/components/SettingsMenu.tsx`**: Akzentfarbe angepasst.
- **`src/index.css`**: neue Farbwelt, dezenter Cyan-Schimmer im Hintergrund, Animation `anim-flicker`.

### Spieltexte (nur Anzeigetexte, keine IDs)
| Ort | vorher | jetzt |
|---|---|---|
| Verbesserung `pressesprecher` | DB-Pressesprecher | PÜNKT-Pressesprecher |
| Verbesserung `bahnbonus` | BahnBonus-Punkte | PÜNKTchen-Treuepunkte |
| Hinweise in `announcements.ts` | „DB-Pressesprecher: …“ | „PÜNKT-Pressesprecher: …“ |
| Vorfall (Aushilfsschaffner) | kontrolliert ausschließlich BahnCards | … PÜNKT-Vorteilskarten |
| Vorfall (Hitze) | ICE-Fenster lassen sich nicht öffnen | die Fenster im PX 404 … |
| Vorfall (Ablösung) | mit Verweis auf die Deutsche Bahn | mit Verweis auf eine interne Richtlinie von PÜNKT |
| Vorfall (Kollegin kommt „gleich“) | bei der Bahn | bei PÜNKT |
| Vorfall (Zusatzhalt) | Dankesbrief an die Bahn | Dankesbrief an den PÜNKT-Kundendienst. Er wird in 6–8 Wochen gelesen. |
| Durchsage-Schluss | Ihr Zugteam bedankt sich … | Ihr PÜNKT-Zugteam bedankt sich … |

Alle anderen Vorfälle, Ausreden, Bewertungen und Durchsagen sind unverändert. Die Anzahl der Durchsage-Anfänge und -Schlüsse ist gleich geblieben, damit dieselbe Fahrt-Nr. dieselben Texte zieht.

### Metadaten und Assets
- **`index.html`**: Titel, Beschreibung, `application-name`, `apple-mobile-web-app-title`, `theme-color`, Open Graph (`og:title`, `og:description`, `og:locale`, `og:site_name`), Twitter-Karte, `noscript`-Text, statische Ladeanzeige („Zug wird bereitgestellt …“), die React beim Start ersetzt.
- **`public/favicon.svg`**: neues Markenzeichen (vorher: gelber Pixel-Zug mit rotem Licht).
- **`package.json` / `package-lock.json`**: Name `endstation-vielleicht`, neue Beschreibung (im Lockfile nur die beiden Namensfelder).
- **`README.md`**: Titel, Leitspruch, Welt und Gestaltung, Hinweis zur Speicherübernahme, Verzeichnisübersicht.
- **`GAMEPLAY_AUDIT.md`, `docs/*.md`**: Verbesserungsnamen und Speicherschlüssel umbenannt. `docs/balance-report.md` und `docs/audit-data.md` wurden neu erzeugt (siehe Prüfung).
- Kein PWA-Manifest, keine Bild-/Audiodateien mit Marken vorhanden. Klänge werden live erzeugt; Schriften (VT323, IBM Plex) sind lokal gebündelt und stehen unter der SIL Open Font License.

## Spielstände

Früher: `db-game:active-run`, `db-game:settings`, `db-game:tutorial`. Jetzt: `endstation:active-run`, `endstation:settings`, `endstation:tutorial`.

`src/game/migration.ts` läuft in `src/main.tsx` vor dem ersten Laden:

1. Liegt unter dem alten Schlüssel nichts → nichts tun.
2. Liegt unter dem neuen Schlüssel schon etwas → neue Daten haben Vorrang. Der alte Schlüssel wird nur entfernt, wenn er inhaltlich identisch ist (abgebrochene frühere Übernahme); sonst bleibt er unangetastet.
3. Alte Daten kein gültiges JSON → liegen lassen (die Ladefunktionen hätten sie ohnehin verworfen).
4. Sonst kopieren, **Kopie zurücklesen und vergleichen**, erst dann den alten Schlüssel löschen. Stimmt die Kopie nicht, wird die halbe Kopie entfernt und der alte Stand bleibt.
5. Speicherfehler (voll/gesperrt) werden je Schlüssel abgefangen; nichts wird gelöscht, das Spiel startet trotzdem.

Die Übernahme ist idempotent und verändert keine Inhalte. Serialisierte IDs (Vorfälle, Ausreden, Verbesserungen wie `bahnbonus` oder `pressesprecher`, laufende Probleme) und die Speicherversion `3` sind unverändert. Statistiken und Erfolge werden vom Spiel nicht dauerhaft gespeichert (die Abschlussstatistik wird aus dem Spielstand berechnet), es gibt daher nichts weiteres zu übernehmen.

## Prüfung

| Prüfung | Ergebnis |
|---|---|
| Tests vor dem Umbau | 202/202 bestanden |
| Tests nach dem Umbau (`npm run check`) | **216/216 bestanden**, Produktions-Build erfolgreich |
| Neue Tests | `src/game/migration.test.ts` (11 Fälle: Übernahme, Idempotenz, kein Überschreiben neuerer Daten, Aufräumen nach Abbruch, kaputte Altdaten, Speicher voll, fehlerhafte Kopie, kein Speicher, Fortsetzen in der App); `src/branding.test.tsx` (3 Fälle: Titel/Leitspruch/Hinweis im Menü, keine realen Betreibernamen in Menü und Spieltexten) |
| Balance unverändert | `npm run simulate` (2000 Fahrten × Strategie, feste Seeds): Siegquoten, Ausfallgründe, Verbesserungswirkung identisch zum Stand vor dem Umbau. Einzige Abweichung: geschätzte Spielzeit eines Strategie-Maximums 15,8 → 15,9 min, weil ein Vorfalltext einen Satz länger ist. |
| Mechanik unverändert | `npm run audit`: `docs/audit-data.md` abgesehen von den zwei Verbesserungsnamen byte-identisch. |
| Browser (Produktions-Build, `vite preview`) | Titelbildschirm, Spiel, Niederlage, Sieg, Menü → „Fahrt fortsetzen“ (Zustand identisch), gleiche Fahrt-Nr. ergibt denselben Sieg. |
| Übernahme im echten Browser | Laufende Fahrt, Einstellungen (Ton aus, 70 %, reduziert) und Tipp-Fortschritt unter `db-game:*` abgelegt, neu geladen: Fahrt byte-identisch an derselben Stelle fortgesetzt und bis zum Sieg gespielt, Einstellungen und Tipps übernommen, alte Schlüssel entfernt. |
| Layout | Desktop und 375 px (Mobil) ohne horizontales Scrollen; keine Konsolenfehler. |
| Suche nach Altmarke | Quellcode, Doku und `dist/`: kein „Deutsche Bahn“, „DB“, „ICE“, „BahnCard“, „BahnBonus“ oder alter Titel mehr. Verbleibend und beabsichtigt: die alten Speicherschlüssel `db-game:*` in `migration.ts` (nötig für die Übernahme) und die Suchmuster im Markentest. |

## Bewusst beibehalten (allgemeine Bahnsprache, keine Betreibermarke)

Stellwerkstörung, Signalstörung, Personen im Gleis, Verspätung aus vorheriger Fahrt, Schienenersatzverkehr, Wagenreihung, Zugausfall, „Verzögerungen im Betriebsablauf“, Zugchef, Lokführer, Schaffner, Bordbistro, Hbf, Fahrgastrechte, reale Städte und Bahnhöfe als Strecke (Berlin – Lutherstadt Wittenberg – Leipzig – Erfurt – Bamberg – Nürnberg – Ingolstadt – München).

## Offene Punkte für die rechtliche Prüfung

Nicht geprüft und ausdrücklich **nicht** als frei eingestuft:

1. **„Endstation: Vielleicht“** – keine Marken-, Titelschutz- oder Domainrecherche durchgeführt (Spiele, Bücher, Filme, Podcasts mit „Endstation …“ sind häufig).
2. **„PÜNKT“** – Kunstwort nahe an „pünktlich“; keine Recherche nach bestehenden Marken oder Firmennamen, auch nicht für „PÜNKTchen“.
3. **„PX 404“** – Zuggattung frei erfunden; nicht geprüft, ob „PX“ irgendwo als Zuggattung oder Produktname eines Verkehrsunternehmens genutzt wird.
4. **Markenzeichen (Bahnhofsuhr)** – eigene Zeichnung, aber Bahnhofsuhren sind ein verbreitetes Motiv; Ähnlichkeit zu geschützten Uhrendesigns (z. B. bekannte Schweizer Bahnhofsuhr) wurde nicht geprüft. Die Zeigerform hier ist bewusst schlicht, ohne roten Kellenzeiger.
5. **Gelbe LED-Abfahrtstafel** – allgemeiner Stil, keine Nachbildung eines konkreten Systems beabsichtigt; trotzdem prüfen, ob die Anmutung zu nah an realen Fahrgastinformationsanzeigen liegt.
6. **Anspielungen auf reale Praxis** – „Bis 5 Minuten und 59 Sekunden gilt ein Zug offiziell als pünktlich“ (Bewertungstext), „Thank you for your patience“ (Durchsage), „Fast schon Schweizer Verhältnisse“ (Bewertungstitel), „Bordbistro“ (Produktbezeichnung, die auch ein realer Betreiber verwendet), „Verzögerungen im Betriebsablauf“. Satire ohne Betreibernamen, aber erkennbar auf reale Verhältnisse bezogen.
7. **Reale Orte und Strecke** – reale Bahnhofsnamen und eine real existierende Fernverkehrsachse.
8. **Interne Bezeichner** – Verbesserungs-ID `bahnbonus` und die alten Speicherschlüssel `db-game:*` bleiben für die Kompatibilität im Code (nicht sichtbar für Spielende, aber im ausgelieferten JavaScript lesbar). Bei Bedarf in einer späteren Version mit eigener Speicher-Migration umbenennen.
9. **Schriftnamen** – „IBM Plex“ ist eine Marke von IBM; die Nutzung der Schrift ist durch die OFL gedeckt, der Name wird nur im Quelltext genannt.

## Noch zu erledigen vor einer Veröffentlichung

- **Screenshots in `docs/screenshots/`** (`2-incident.png`, `3-result.png`, `4-end.png`, `6-victory.png`) zeigen noch den alten Titel, „ICE 1001“ und die alten Farben. Sie werden in keiner Doku verlinkt, sollten aber neu aufgenommen oder gelöscht werden.
- **Vorschaubild für soziale Netzwerke**: Es gibt kein `og:image`. Die meisten Plattformen brauchen PNG/JPG (ca. 1200 × 630); SVG wird kaum unterstützt. Bei Bedarf aus dem Titelbildschirm erzeugen und in `index.html` eintragen.
- **Repository- und Hosting-Namen** (Ordner `DB_game`, GitHub-Repository, Netlify-/Vercel-Projektname, Domain) liegen außerhalb des Codes und wurden nicht geändert.
- **Statistiken / Erfolge**: Das Spiel hat keine dauerhafte Statistikseite. Ein „Statistiken“-Knopf im Hauptmenü wurde daher bewusst **nicht** eingebaut (keine Attrappen). „Einstellungen“ bleibt oben rechts im Menü und im Spiel.
