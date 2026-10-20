# Gameplay-Audit (Schritt 6)

Grundlage: Durchsicht des gesamten Codes und zwei Werkzeuge mit echten Läufen der Spiellogik:

- `npm run audit` → [docs/audit-data.md](docs/audit-data.md): Wahlhäufigkeiten, dominierte Optionen, Kartenwert, Aktivierungen von Verbesserungen, Niederlagen nach Station, Klicks pro Fahrt.
- `npm run simulate` → [docs/balance-report.md](docs/balance-report.md): Siegquoten von sieben Strategien, je 2000 Fahrten.

Alle Zahlen unten stammen aus diesen Läufen.

## Befunde

Schweregrad: **hoch** = verfälscht Entscheidungen oder verwirrt regelmäßig, **mittel** = spürbar, aber umgehbar, **niedrig** = Feinschliff.

| # | Befund | Schwere | Auswirkung aufs Spiel | Status |
|---|---|---|---|---|
| 1 | **8 Optionen waren dominiert**: Eine andere Option desselben Vorfalls war in allen drei Ressourcen mindestens gleich gut (z. B. „Bei der Fahrdienstleitung drängeln“ vs. „Geduldig warten“, „Mit halber Kraft weiterfahren“ vs. „Techniker an Bord holen“). | hoch | Scheinentscheidungen; wer rechnet, hat keine Wahl. | behoben (0 dominiert) |
| 2 | **Allzweck-Ausreden dominierten die Durchsage.** „Wir bitten um Verständnis“ und „Verzögerungen im Betriebsablauf“ machten 8090 von rund 14 000 Durchsagen aus, weil mehrere gewöhnliche Karten nur zu 12–25 % der Vorfälle passten (Personalausfall 12,5 %, Höhere Gewalt 6 %). | hoch | Das Kernsystem „passende Ausrede finden“ griff zu selten. | verbessert (7095 Allzweck-Durchsagen; alle gewöhnlichen Karten passen jetzt zu ≥ 37,5 %) |
| 3 | **Wirkung von Verbesserungen war unsichtbar.** Legendärer Schaffner, Dickes Fell, Frühwarnsystem, Zocker-Lokführer, Großzügiger Fahrplan und vor allem der Notfallplan wirkten still. | hoch | Spieler konnten nicht lernen, was ihre Wahl bringt. | behoben (★-Hinweise vorab und im Ergebnis) |
| 4 | **Zu viele reine „Weiter“-Klicks**: 16,6 von 39,8 Klicks pro Fahrt (Anfänger), vor allem der Zwischenschritt Ergebnis → „Zur Durchsage“. | mittel | Tempo, Ermüdung bei 8–11 Ereignissen. | behoben (7,8 von 31,0) |
| 5 | **Risiko nur als Wort** („Risiko mittel“). Wie oft etwas schiefgeht, blieb Gefühlssache. | mittel | Risiken schwer abwägbar. | behoben (Prozent und Stufenanzeige) |
| 6 | **Warum eine Ausrede passte, blieb offen.** Es gab nur „Passt“/„Passt nicht“ und Rechennotizen. | mittel | Lernkurve beim Kartensystem. | behoben („Warum?“-Satz mit Bereichen) |
| 7 | **Verlustbedingungen und Reststationen nur indirekt** (Leiste „/30“, „3/8“). Kein Hinweis kurz vor dem Zugausfall. | mittel | Überraschende Niederlagen. | behoben (Zugausfall-Zeile, „Noch N Stationen“, Warnbanner + Warnton) |
| 8 | **Laufende Probleme ohne Erklärung**: nur Name, Kosten, drohendes Folgeereignis. | niedrig | Unklar, woher sie kommen und wie man sie loswird. | behoben (Beschreibung im Panel, Tipp 5) |
| 9 | **Kein Einstieg**: Alle Regeln standen auf einmal im Menü. | mittel | Erste Fahrt überfordert. | behoben (5 Einstiegstipps, überspringbar) |
| 10 | **„Immer riskant“ wurde nach Behebung von #1 zur besten Blindstrategie** (60,4 % vs. 55,3 % „immer sicher“). | mittel | Eine Faustregel ersetzt das Nachdenken. | behoben (54,4 % vs. 55,3 %) |
| 11 | **Großes Repertoire fast wirkungslos** (+0,1 Prozentpunkte für Anfänger). | niedrig | Tote Wahl im Verbesserungsangebot. | verbessert (+2,1 pp) |
| 12 | **Wiederholte Vorfälle zwischen Fahrten**: Für die ersten zwei Stationen gibt es nur 8 leichte Vorfälle. | niedrig | Der Anfang fühlt sich nach einigen Fahrten bekannt an. | offen (siehe Risiken) |
| 13 | **Deterministische Wahl der Referenz** zeigt bei 26 Vorfällen eine Option mit > 85 % – meist Folge davon, dass die Referenz immer den kleinsten Erwartungswert nimmt, nicht echte Dominanz. Gemischte Strategien wählen die Arten ausgewogen (Referenz: sicher 38 %, riskant 33 %, strategisch 29 %). | niedrig | Keine; dient als Beobachtungsliste. | beobachtet |

## Änderungen

### Spielablauf und Rückmeldung

- **Ergebnis und Durchsage auf einem Bildschirm.** Nach der Wahl erscheint das Ergebnis kompakt (Stempel, Text, Gesamtänderung mit ▲/▼, „Woher kommt das?“ zum Aufklappen) direkt über den Ausreden. Nur bei einer Niederlage bleibt der eigene Ergebnisbildschirm. Die Spiellogik und ihre Phasen sind unverändert; der Reducer führt beide Schritte nacheinander aus.
- **Risiko mit Zahl**: „Riskant · Risiko mittel (ca. 45 %)“ plus drei Kästchen. Der Ausgang selbst bleibt verborgen.
- **„Hier wirkt“** beim Vorfall: welche eigenen Verbesserungen bei diesem Vorfall eine Rolle spielen.
- **★-Hinweise im Ergebnis**: „Zocker-Lokführer: Risiko 55 % → 45 %“, „Legendärer Schaffner: 4 Zufriedenheit gespart“, „Dickes Fell …“, „Frühwarnsystem …“, „Großzügiger Fahrplan …“. Bei der Ankunft: Werkstatt-Abo, PÜNKTchen-Treuepunkte, Wunder-Mechaniker und „Notfallplan: … wurde verhindert“.
- **„Warum?“ nach der Durchsage**: welche Bereiche sich überschneiden und was daraus folgt.
- **Klarheit**: „Noch N Stationen bis München Hbf“, Zeile „Zugausfall bei: 30 Min · 0 · 0“, Problembeschreibungen im Seitenpanel.

### Spielgefühl

- **Warnbanner** ab 22 Minuten Verspätung oder ≤ 20 Zufriedenheit/Zugzustand, mit Warnton beim Überschreiten.
- **Nachlauf-Balken** in den Ressourcenanzeigen: Verlorenes bleibt kurz hell sichtbar und schrumpft dann.
- **Kartenwahl**: gewählte Karte mit gelbem Rahmen, Karten werden nach dem Ergebnis kurz versetzt ausgeteilt.
- **Einfahrt**: Bahnhofsschild rollt herein, dazu „Noch N Stationen“.
- **Richtungspfeile ▲/▼** an allen Änderungen, ✓/✗ an Ergebnissen (nicht nur Farbe).
- Alle neuen Animationen sind kurz (≤ 520 ms) und folgen der Einstellung „Animationen“ bzw. `prefers-reduced-motion`.

### Einstiegstipps

Fünf Tipps, je einer zur Zeit, in fester Reihenfolge und nur im passenden Moment: (1) Vorfälle und Entscheidungen beim ersten Vorfall, (2) Ressourcen und Zugausfall nach der ersten Entscheidung, (3) Ausreden bei der ersten Durchsage, (4) Verbesserungen bei der ersten Ankunft, (5) laufende Probleme und Synergien, sobald es Probleme oder Verbesserungen gibt. „Verstanden“ zeigt den nächsten Tipp, „Tipps ausblenden“ schaltet alle ab. Im Menü: „Tipps für Einsteiger anzeigen“ und „Tipps von vorn“. Gespeichert in localStorage unter `endstation:tutorial` (früher `db-game:tutorial`, wird automatisch übernommen).

### Balance (vorher → nachher)

| Was | Vorher | Nachher |
|---|---|---|
| Güterzug: „Geduldig warten“ | +4 Min, −3 Zufr. | +4 Min |
| Güterzug: „Drängeln“ Erfolg / Fehlschlag | +2 Min / +6 Min, −8 Zufr. | +1 Min / +6 Min, −6 Zufr. |
| Verspätetes Personal: „Mit halbem Team losfahren“ | −6 Zufr. (+ Personal am Limit) | −3 Min, −5 Zufr. (+ Personal am Limit) |
| Überfüllter Zug: „Alle mitnehmen“ | −6 Zufr. (+ Überfüllung) | −2 Min, −4 Zufr. (+ Überfüllung) |
| Überfüllter Zug: „Auf den nächsten Zug verweisen“ | 45 %; +2 Min, −4 / +3 Min, −16 | 35 %; +1 Min, −1 / +3 Min, −12 |
| Fehlender Wagen: „Auf die übrigen Wagen verteilen“ | −8 Zufr. + Überfüllung | −2 Min, −10 Zufr., keine Überfüllung |
| Anschlusszug: „Fahrgastrechte-Formulare“ | +2 Min, −8 Zufr. | +1 Min, −4 Zufr. |
| Baum auf der Oberleitung: „Darunter durchfahren“ | 55 %; +1 Min, −6 / +2 Min, −16 | 45 %; −4 Zustand / +1 Min, −16 |
| Polizeieinsatz: „Wagen räumen“ | +5 Min, −7 Zufr. | +6 Min |
| Antriebsstörung: „Mit halber Kraft“ | 55 %; +4 Min, −4 / +6 Min, −16 | 50 %; +1 Min, −3 / +4 Min, −16 |
| Fehlschlagchance aller riskanten Optionen ab 35 % | wie oben | +5 Prozentpunkte (max. 60 %), „gering“ bleibt unverändert |
| Ausreden-Bereiche | Personalausfall: Personal · Bauarbeiten: Infrastruktur · vorausfahrender Zug: Betrieb · Witterung: Wetter, Infrastruktur · Höhere Gewalt: Wetter · Tiere: Infrastruktur, Wetter | jeweils + Betrieb · + Betrieb · + Infrastruktur · + Technik · + Infrastruktur · Infrastruktur, Sicherheit |
| Synergie „Alles höhere Gewalt“ | + Infrastruktur, Betrieb | + Betrieb, Sicherheit (Infrastruktur ist jetzt Grundbereich) |
| Großes Repertoire | 4 Karten | 5 Karten (Tasten 1–5) |

Ergebnis, je 2000 Fahrten:

| Strategie | Schritt 5 | Nach Audit-Korrekturen | Final |
|---|---|---|---|
| Zufall | 36,0 % | 41,8 % | 39,8 % |
| Anfänger | 51,7 % | 56,9 % | 54,2 % |
| Vorsichtig | 58,0 % | 55,3 % | 55,3 % |
| Risikofreudig | 54,3 % | 60,4 % | 54,4 % |
| Ausgewogen (Referenz) | 94,7 % | 96,1 % | 96,4 % |

Weitere Messwerte (final): Ausreden für Anfänger beste 55,5 % / nach Etikett 54,2 % / zufällig 38,1 % / schlechteste 25,9 %. Stärkste Verbesserung für Anfänger: Ersatzbus-Garantie +12,4 pp, schwächste: Pressemappe +1,7 pp. Geschätzte Spielzeit 12–15 Minuten. Klicks pro Fahrt 31,0 (vorher 39,8).

## Tests

- 202 Tests in 8 Dateien, alle grün; Produktions-Build erfolgreich (`npm run check`).
- Neu (`src/step6.test.tsx`): direkter Übergang zur Durchsage und Ausnahme bei Niederlage, **keine dominierten Optionen** (Dauerprüfung), Hinweise für Zocker/Schaffner/Dickes Fell/Frühwarnsystem/Fahrplan/Notfallplan, „Hier wirkt“, Risiko in Prozent, „Warum?“-Erklärungen, Warnschwellen, Reihenfolge und Speicherung der Einstiegstipps, Menüschalter.
- Im Browser durchgespielt: komplette Fahrt nur per Tastatur mit eingeschalteten Tipps (alle fünf erschienen in Reihenfolge), Einfahrtsschild, ★-Hinweise, Ergebnis über der Durchsage, Sieg mit Bewertung.

## Verbleibende Risiken

- **Referenzstrategie ≈ 96 %.** Sie kennt die Grundwerte jeder Option; Menschen sehen diese nicht. Wie stark erfahrene Menschen werden, lässt sich nur mit echten Spieltests messen.
- **Spielzeit ist geschätzt** (Lesetempo 180 Wörter/Minute plus Bedenkzeit), nicht gemessen.
- **Wiederholung zwischen Fahrten**: Stufe 1 hat 8 Vorfälle für 2 Stationen. Nach etwa fünf Fahrten kennt man den Anfang. Mehr Vorfälle wären der wirksamste nächste Schritt, sind aber neuer Inhalt.
- **Seltene Inhalte**: Folgeereignisse kommen bei vorsichtigem Spiel kaum vor (Referenz ~0,1 pro Fahrt); epische Ausreden nur über die Pressemappe.
- **Aktivierungen bleiben situativ**: Ersatzbus-Garantie (0,31 Aktivierungen pro Fahrt) und Notfallplan sind Versicherungen und wirken naturgemäß selten; der Notfallplan ist jetzt aber sichtbar, wenn er greift.
- **Ergebnis über der Durchsage** verlängert den Bildschirm auf Mobilgeräten; die Ausreden liegen dort unterhalb der Falz. Bisher nur per Emulation geprüft, nicht auf echten Geräten.
