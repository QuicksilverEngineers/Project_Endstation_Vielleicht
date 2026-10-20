# Balance-Änderungen (Schritt 5)

> Spätere Anpassungen aus Schritt 6 (dominierte Optionen, Risikochancen, Kartenbereiche, Großes Repertoire) stehen in [GAMEPLAY_AUDIT.md](../GAMEPLAY_AUDIT.md).

Grundlage: `npm run simulate` mit je 2000 Fahrten pro Strategie auf denselben Seeds. Der vollständige Bericht nach allen Änderungen steht in [balance-report.md](balance-report.md).

## Ausgangslage (vor den Änderungen)

| Strategie | Siegquote |
|---|---|
| Zufall | 46,2 % |
| Anfänger (Ausrede nach Etikett) | 66,9 % |
| Vorsichtig (immer sicher) | 84,7 % |
| Risikofreudig (immer riskant) | 59,5 % |
| Zufriedenheit zuerst | 28,2 % |
| Verspätung minimieren | 17,3 % |
| Ausgewogen (Referenz) | 98,2 % |

Befunde:

- **Zu leicht.** Gute Spielweise verlor fast nie, und „immer die sichere Option“ war beinahe eine Siegformel.
- **Zufriedenheit war kein Druck mehr.** Die Referenzstrategie kam in München mit durchschnittlich 80 Zufriedenheit und 72 Zugzustand an: Ausreden und Verbesserungen glichen mehr aus, als Vorfälle kosteten. Gefahr ging nur noch von der Verspätung aus.
- **Fünf Verbesserungen fast wirkungslos** (für Anfänger): PÜNKT-Pressesprecher +0,0, Pressemappe +0,5, Schuld sind die anderen +1,3, Dickes Fell +1,7, Seriöse Stimme +1,7 Prozentpunkte.

## Änderungen

| Was | Vorher | Nachher | Warum |
|---|---|---|---|
| Ausreden-Stärke (`EXCUSE_STRENGTH`, alle Karten) | 1,0 | 0,7 | Zufriedenheit soll über die Fahrt eher sinken als steigen. |
| Verspätungszuschlag je Station (`scaleEffects`) | 40 % des Stationsfaktors | 60 % | Mehr Druck auf die Verspätung in der zweiten Hälfte; „immer sicher“ ist nicht mehr dominant. |
| Höchstverspätung einer Entscheidung (`MAX_CHOICE_PENALTY.delay`) | 15 | 17 | Folge der höheren Skalierung; die Garantie „kein Sofortverlust aus gesundem Zustand“ gilt jetzt ab ≤ 10 Min Verspätung. |
| Personen im Gleis, Fehlschlag „Polizei anfordern“ | +9 Min, −10 Zufr. | +8 Min, −12 Zufr. | Lag über der neuen Obergrenze. |
| PÜNKT-Pressesprecher | nur halbe Strafe | zusätzlich +2 Zufriedenheit bei Allzweck-Ausreden | War für sorgfältige Spieler wertlos. |
| Schuld sind die anderen | +40 % | +60 % | Zu schwach. |
| Dickes Fell | −1 Zufriedenheit/Zustand je Problem | zusätzlich −1 Minute Verspätung je Problem | Zu schwach, jetzt auch gegen den Hauptgegner Verspätung. |
| Seriöse Stimme | +15 Glaubwürdigkeit | +20 | Zu schwach. |
| Pressemappe | 1 seltene/epische Karte | 2 Karten | Zu schwach. |

Unverändert geblieben: Fahrzeitreserve (2 Minuten). Eine Reserve von 1 Minute wurde getestet und verworfen, weil sie „immer sicher“ auf 45 % und Anfänger auf 53 % drückte, ohne die Referenzstrategie spürbar zu fordern.

## Ergebnis (nach den Änderungen)

| Strategie | Siegquote | Ø Züge | Ø Stationen | Spielzeit (geschätzt) |
|---|---|---|---|---|
| Zufall | 36,0 % | 7,9 | 7,3 | 13,5 min |
| Anfänger | 51,7 % | 8,2 | 7,6 | 14,1 min |
| Vorsichtig | 58,0 % | 7,9 | 7,9 | 13,9 min |
| Risikofreudig | 54,3 % | 8,1 | 7,4 | 13,9 min |
| Zufriedenheit zuerst | 22,1 % | 7,3 | 7,0 | 12,3 min |
| Verspätung minimieren | 12,8 % | 7,3 | 6,7 | 12,1 min |
| Ausgewogen (Referenz) | 94,7 % | 8,5 | 8,0 | 15,0 min |

Gegen die Ziele:

- **Anfänger haben eine realistische Chance:** 51,7 % (nur nach Etikett gewählte Ausreden, sonst Zufall).
- **Bessere Strategien schlagen Zufall deutlich:** 36 % → 52 % → 95 %. Einseitige Strategien (nur Zufriedenheit oder nur Verspätung) verlieren klar – Abwägen lohnt sich.
- **10–15 Minuten:** geschätzt 12–15 Minuten im Schnitt (siehe Bericht für die Methode).
- **Keine Verbesserung macht den Sieg automatisch:** stärkste Einzelwirkung für Anfänger +12 Prozentpunkte (Ersatzbus-Garantie), alle anderen zwischen +2 und +11.
- **Ausreden wirken spürbar:** Anfänger mit bester Ausrede 52,8 %, mit zufälliger 35,4 %, mit schlechtester 22,9 %.
- **Glück schafft Spannung:** Auch bei der Referenzstrategie sind 45 % der Siege knapp (Verspätung ≥ 20 oder eine Ressource ≤ 20), und in zwei von drei Fahrten geht mindestens eine riskante Entscheidung schief.

Hinweis zur Referenzstrategie: Sie kennt die exakten Grundwerte jeder Option (nicht den Würfel). Menschen sehen diese Zahlen nicht, die Referenz ist daher eine Obergrenze und kein erwarteter Wert für erfahrene Spieler.

## Messfehler, der dabei auffiel

Im Verbesserungs-Vergleich wurden Sofortwirkungen (Karten der Pressemappe, Glaubwürdigkeit der Seriösen Stimme) zunächst nicht ausgelöst, weil die Verbesserung nur in die Liste geschrieben wurde. Behoben durch `grantUpgrade` in der Spiellogik, das die echte Wahl und die Simulation gemeinsam nutzen.
