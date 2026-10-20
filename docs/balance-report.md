# Balance-Bericht

Erzeugt mit `npm run simulate` am 2026-10-20. 2000 Fahrten je Strategie mit denselben Seeds (100000–101999).
Alle Zahlen stammen aus echten Läufen der Spiellogik. Die Spielzeit ist eine Schätzung aus der Textmenge (siehe unten).

## Strategien im Vergleich

| Strategie | Siegquote | Züge (Vorfälle) | Stationen erreicht | Spielzeit (geschätzt) | Folgeereignisse | Häufigster Grund für Niederlagen |
|---|---|---|---|---|---|---|
| Zufall | **39.8 %** | 7.9 | 7.4 / 8 | 13.6 min (10.1–15.8) | 0.67 | Zufriedenheit (677), Verspätung (414), Zugzustand (150) |
| Anfänger | **54.2 %** | 8.3 | 7.6 / 8 | 14.2 min (11.7–15.9) | 0.73 | Verspätung (481), Zufriedenheit (271), Zugzustand (182) |
| Vorsichtig | **55.3 %** | 7.9 | 7.9 / 8 | 13.9 min (12.0–14.5) | 0.00 | Verspätung (894) |
| Risikofreudig | **54.4 %** | 8.2 | 7.4 / 8 | 13.9 min (10.1–15.9) | 0.84 | Zugzustand (659), Zufriedenheit (168), Verspätung (109) |
| Zufriedenheit zuerst | **17.1 %** | 7.1 | 6.8 / 8 | 11.9 min (9.2–14.4) | 0.34 | Zugzustand (1174), Verspätung (552) |
| Verspätung minimieren | **8.7 %** | 7.2 | 6.5 / 8 | 11.9 min (8.2–15.1) | 0.87 | Zufriedenheit (1231), Zugzustand (598) |
| Ausgewogen (Referenz) | **96.4 %** | 8.7 | 8.0 / 8 | 15.3 min (14.3–16.8) | 0.75 | Zufriedenheit (38), Verspätung (28), Zugzustand (7) |

Strategien:
- **Zufall**: Option, Ausrede und Verbesserung jeweils zufällig.
- **Anfänger**: Zufällige Optionen, aber Ausreden nach dem sichtbaren Etikett („Passt perfekt“ zuerst). Verbesserungen zufällig.
- **Vorsichtig**: Immer die sichere Option, beste Ausrede, defensive Verbesserungen.
- **Risikofreudig**: Immer die riskante Option, beste Ausrede, Verbesserungen gegen Risiko.
- **Zufriedenheit zuerst**: Option mit dem geringsten erwarteten Zufriedenheitsverlust, beste Ausrede, Verbesserungen für die Fahrgäste.
- **Verspätung minimieren**: Option mit der geringsten erwarteten Verspätung, beste Ausrede, Verbesserungen gegen Verspätung.
- **Ausgewogen (Referenz)**: Wägt alle Ressourcen nach verbleibendem Spielraum ab, beste Ausrede, ausgewogene Verbesserungen. Kennt die Grundwerte, nicht den Würfel.

## Ressourcenverläufe

Durchschnitt bei Ankunft an jeder Station, nur Fahrten, die die Station erreicht haben. „Erreicht“ = Anteil der Fahrten.

### Anfänger

| Station | Erreicht | Verspätung | Zufriedenheit | Zugzustand |
|---|---|---|---|---|
| Berlin Hbf | 100.0 % | 0.0 | 75.0 | 85.0 |
| Lutherstadt Wittenberg | 100.0 % | 1.2 | 75.9 | 84.0 |
| Leipzig Hbf | 100.0 % | 2.5 | 76.6 | 82.8 |
| Erfurt Hbf | 100.0 % | 4.3 | 74.3 | 78.9 |
| Bamberg | 99.1 % | 6.6 | 71.8 | 74.1 |
| Nürnberg Hbf | 96.3 % | 9.2 | 69.3 | 69.4 |
| Ingolstadt Hbf | 89.3 % | 12.3 | 65.1 | 64.8 |
| München Hbf | 75.0 % | 15.6 | 61.0 | 60.5 |
| Ende | – | 21.2 | 50.2 | 54.8 |

### Ausgewogen (Referenz)

| Station | Erreicht | Verspätung | Zufriedenheit | Zugzustand |
|---|---|---|---|---|
| Berlin Hbf | 100.0 % | 0.0 | 75.0 | 85.0 |
| Lutherstadt Wittenberg | 100.0 % | 1.3 | 80.4 | 83.7 |
| Leipzig Hbf | 100.0 % | 2.3 | 84.2 | 84.1 |
| Erfurt Hbf | 100.0 % | 3.2 | 83.1 | 80.1 |
| Bamberg | 100.0 % | 4.4 | 80.3 | 76.4 |
| Nürnberg Hbf | 100.0 % | 5.9 | 76.9 | 72.9 |
| Ingolstadt Hbf | 100.0 % | 10.8 | 74.2 | 71.2 |
| München Hbf | 99.6 % | 14.4 | 69.6 | 66.3 |
| Ende | – | 19.4 | 60.8 | 57.8 |

## Einfluss der Ausreden

Dieselben Seeds und Entscheidungen, nur die Kartenwahl ändert sich.

| Entscheidungen | Beste Ausrede | Nach Etikett | Zufällig | Schlechteste |
|---|---|---|---|---|
| Anfänger | 55.5 % | 54.2 % | 38.1 % | 25.9 % |
| Ausgewogen (Referenz) | 96.4 % | 96.2 % | 88.6 % | 79.0 % |

### Kartennutzung (alle Strategien)

| Ausrede | Seltenheit | Gespielt | Ø Zufriedenheit | perfekt | passt | Allzweck | unglaubwürdig |
|---|---|---|---|---|---|---|---|
| Verzögerungen im Betriebsablauf | common | 19553 | 2.3 | 0.0 % | 0.0 % | 100.0 % | 0.0 % |
| Wir bitten um Verständnis | common | 19517 | 2.4 | 0.0 % | 0.0 % | 100.0 % | 0.0 % |
| Technische Störung | common | 10070 | 5.0 | 75.9 % | 15.9 % | 0.0 % | 8.2 % |
| Verspätung aus vorheriger Fahrt | common | 7601 | 3.1 | 77.3 % | 11.1 % | 0.0 % | 11.7 % |
| Witterungsbedingte Einschränkungen | common | 5195 | 5.2 | 76.0 % | 20.4 % | 0.0 % | 3.6 % |
| Störung der IT-Systeme | common | 4660 | 4.3 | 80.2 % | 15.0 % | 0.0 % | 4.8 % |
| Hohes Fahrgastaufkommen | common | 4433 | 5.0 | 72.8 % | 21.5 % | 0.0 % | 5.7 % |
| Störung am Stellwerk | common | 3959 | 4.8 | 63.9 % | 29.1 % | 0.0 % | 6.9 % |
| Kurzfristiger Personalausfall | common | 3871 | 4.5 | 77.1 % | 13.2 % | 0.0 % | 9.7 % |
| Notarzteinsatz am Zug | rare | 3821 | 7.1 | 51.6 % | 43.2 % | 0.0 % | 5.2 % |
| Personen im Gleis | rare | 3765 | 8.9 | 38.2 % | 55.1 % | 0.0 % | 6.7 % |
| Kurzfristige Bauarbeiten | common | 3522 | 4.7 | 64.7 % | 26.5 % | 0.0 % | 8.8 % |
| Verspätung eines vorausfahrenden Zuges | common | 3522 | 4.1 | 62.3 % | 28.0 % | 0.0 % | 9.7 % |
| Tiere im Gleis | rare | 3367 | 6.9 | 38.6 % | 54.7 % | 0.0 % | 6.7 % |
| Reparatur am Zug | common | 3362 | 4.0 | 72.0 % | 17.8 % | 0.0 % | 10.2 % |
| Behördliche Maßnahmen | rare | 2493 | 8.2 | 29.6 % | 59.0 % | 0.0 % | 11.4 % |
| Bundesweite Großstörung | epic | 143 | 5.5 | 0.0 % | 0.0 % | 100.0 % | 0.0 % |
| Höhere Gewalt | epic | 133 | 13.9 | 64.7 % | 27.8 % | 0.0 % | 7.5 % |
| Warnstreik der anderen Gewerkschaft | epic | 64 | 8.1 | 60.9 % | 14.1 % | 0.0 % | 25.0 % |

## Wirksamkeit der Verbesserungen

Kontrollierter Vergleich mit 1000 Fahrten: Die Verbesserung ist ab Berlin vorhanden (eine Stufe), sonst identische Seeds und Strategie.
Ziel: Keine einzelne Verbesserung macht den Sieg automatisch.

| Verbesserung | Anfänger: Sieg (Δ) | Ausgewogen (Referenz): Sieg (Δ) |
|---|---|---|
| Ersatzbus-Garantie | 67.5 % (+12.4 pp) | 98.2 % (+2.6 pp) |
| Großzügiger Fahrplan | 62.9 % (+7.8 pp) | 98.1 % (+2.5 pp) |
| Zocker-Lokführer | 61.9 % (+6.8 pp) | 96.0 % (+0.4 pp) |
| Wunder-Mechaniker | 61.2 % (+6.1 pp) | 97.8 % (+2.2 pp) |
| PÜNKTchen-Treuepunkte | 59.6 % (+4.5 pp) | 97.5 % (+1.9 pp) |
| Notfallplan | 59.4 % (+4.3 pp) | 97.2 % (+1.6 pp) |
| Werkstatt-Abo | 59.2 % (+4.1 pp) | 96.6 % (+1.0 pp) |
| Durchsage-Profi | 58.4 % (+3.3 pp) | 97.6 % (+2.0 pp) |
| Legendärer Schaffner | 58.0 % (+2.9 pp) | 97.5 % (+1.9 pp) |
| Bordbistro-Flatrate | 57.8 % (+2.7 pp) | 97.6 % (+2.0 pp) |
| Seriöse Stimme | 57.6 % (+2.5 pp) | 97.5 % (+1.9 pp) |
| Frühwarnsystem | 57.4 % (+2.3 pp) | 96.2 % (+0.6 pp) |
| Dickes Fell | 57.2 % (+2.1 pp) | 97.9 % (+2.3 pp) |
| Großes Repertoire | 56.9 % (+1.8 pp) | 96.9 % (+1.3 pp) |
| PÜNKT-Pressesprecher | 56.8 % (+1.7 pp) | 97.6 % (+2.0 pp) |
| Schuld sind die anderen | 56.8 % (+1.7 pp) | 97.3 % (+1.7 pp) |
| Pressemappe | 56.8 % (+1.7 pp) | 96.3 % (+0.7 pp) |
| *ohne* | 55.1 % | 95.6 % |

## Glück und Spannung

- Ausgewogene Strategie: 96.4 % Siege, davon 51.0 % knapp (Verspätung ≥ 20 oder eine Ressource ≤ 20).
- In 62.5 % dieser Fahrten ging mindestens eine riskante Entscheidung schief.
- Anfänger gewinnen 54.2 %, reiner Zufall 39.8 %.
- 1999 verschiedene Vorfallsfolgen in 2000 Fahrten.

## Spielzeit-Schätzung

Lesetempo 180 Wörter pro Minute für alle angezeigten Texte (Vorfall, Optionen, Ergebnis, Karten, Durchsage, Verbesserungen), dazu 12 s Bedenkzeit je Vorfall, 10 s je Ausrede und Verbesserung und 3 s je Bildschirmwechsel. Gemessen wurde das nicht; es ist eine Abschätzung aus den echten Texten jeder simulierten Fahrt.

Stationen: Berlin Hbf → Lutherstadt Wittenberg → Leipzig Hbf → Erfurt Hbf → Bamberg → Nürnberg Hbf → Ingolstadt Hbf → München Hbf

Laufzeit der Simulation: 28.3 s.
