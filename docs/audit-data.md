# Audit-Daten

Erzeugt mit `npm run audit`, 2000 Fahrten je Strategie (Seeds 400000–401999).

## Welche Optionen wählt gutes Spiel?

Anteil, mit dem die Referenzstrategie (Ausgewogen) jede Option wählt. ⚠ = dominant (über 85 %) oder praktisch nie gewählt (unter 5 %), bei mindestens 40 Auftritten.

| Vorfall | n | A | B | C | Auffällig |
|---|---|---|---|---|---|
| Kaffeemaschine im Bordbistro defekt | 528 | 98.7 % | 0.8 % | 0.6 % | ⚠ Kaltgetränke gratis verteilen dominant; ⚠ Der Maschine einen beherzten Tritt verpassen kaum gewählt; ⚠ Bistro schließen, Personal hilft beim Fahrgastwechsel kaum gewählt |
| WLAN ausgefallen | 528 | 43.4 % | 0.0 % | 56.6 % | ⚠ Durchsage: „Genießen Sie die Landschaft“ kaum gewählt |
| Reservierungsanzeige ausgefallen | 473 | 96.2 % | 0.6 % | 3.2 % | ⚠ Jeden Fall einzeln klären dominant; ⚠ Den Zugbegleiter schlichten lassen kaum gewählt; ⚠ Alle Reservierungen für ungültig erklären kaum gewählt |
| Güterzug hat Vorrang | 514 | 99.0 % | 1.0 % | 0.0 % | ⚠ Geduldig warten dominant; ⚠ Bei der Fahrdienstleitung drängeln kaum gewählt; ⚠ Entschuldigung in drei Sprachen durchsagen kaum gewählt |
| Kühe im Gleis | 495 | 44.8 % | 0.0 % | 55.2 % | ⚠ Dauerhupen kaum gewählt |
| Der Zug ist pünktlich | 512 | 0.0 % | 100.0 % | 0.0 % | ⚠ Kurz anhalten für eine Schnellwartung kaum gewählt; ⚠ Durchsage: „Das ist kein Fehler“ dominant; ⚠ Die Gelegenheit nutzen und Zeit aufholen kaum gewählt |
| Türstörung in Wagen 23 | 471 | 100.0 % | 0.0 % | 0.0 % | ⚠ Tür reparieren lassen dominant; ⚠ Mit Panzertape sichern kaum gewählt; ⚠ Tür absperren kaum gewählt |
| Verspätetes Personal | 479 | 0.0 % | 54.7 % | 45.3 % | ⚠ Auf die Kollegen warten kaum gewählt |
| Klimaanlage defekt | 464 | 95.3 % | 1.1 % | 3.7 % | ⚠ Mechaniker rufen dominant; ⚠ Fenster öffnen kaum gewählt; ⚠ Problem ignorieren kaum gewählt |
| Signalstörung | 466 | 42.5 % | 0.0 % | 57.5 % | ⚠ Auf Sicht fahren kaum gewählt |
| Alle Toiletten defekt | 451 | 37.5 % | 0.0 % | 62.5 % | ⚠ Selbst mit dem Pümpel ran kaum gewählt |
| Bauarbeiten | 486 | 72.8 % | 1.9 % | 25.3 % | ⚠ Danach mit Vollgas aufholen kaum gewählt |
| Notbremsung | 464 | 48.3 % | 0.0 % | 51.7 % | ⚠ Sofort weiterfahren kaum gewählt |
| Ablösung fehlt | 488 | 0.8 % | 0.2 % | 99.0 % | ⚠ Auf die Ablösung warten kaum gewählt; ⚠ Einen Fahrgast mit Modelleisenbahn-Erfahrung fragen kaum gewählt; ⚠ Lokführer um Überstunden bitten dominant |
| Falsche Wagenreihung | 473 | 25.4 % | 0.0 % | 74.6 % | ⚠ Kurze Durchsage machen kaum gewählt |
| Stellwerk nicht besetzt | 466 | 57.5 % | 4.3 % | 38.2 % | ⚠ Fahrdienstleiter aus der Pause holen kaum gewählt |
| Überfüllter Zug | 461 | 0.2 % | 0.0 % | 99.8 % | ⚠ Verstärkungswagen anfordern kaum gewählt; ⚠ Fahrgäste auf den nächsten Zug verweisen kaum gewählt; ⚠ Alle mitnehmen dominant |
| Fehlender Wagen | 436 | 0.0 % | 75.2 % | 24.8 % | ⚠ Ersatzwagen ankuppeln lassen kaum gewählt |
| Anschlusszug verpasst | 433 | 17.3 % | 32.3 % | 50.3 % |  |
| Halte in falscher Reihenfolge | 485 | 0.0 % | 6.0 % | 94.0 % | ⚠ Ausführliche Durchsage mit Skizze kaum gewählt; ⚠ Halte einfach auslassen dominant |
| Fußballfans an Bord | 427 | 1.6 % | 96.0 % | 2.3 % | ⚠ Bundespolizei mitfahren lassen kaum gewählt; ⚠ Bordbistro gibt Freibier aus dominant; ⚠ Alle Fans in einen Wagen kaum gewählt |
| Baum auf der Oberleitung | 845 | 9.2 % | 53.1 % | 37.6 % |  |
| Personen im Gleis | 829 | 45.6 % | 8.2 % | 46.2 % |  |
| Medizinischer Notfall | 891 | 0.1 % | 69.5 % | 30.4 % | ⚠ Außerplanmäßig halten, Rettungsdienst rufen kaum gewählt |
| Polizeieinsatz | 841 | 63.7 % | 8.7 % | 27.6 % |  |
| Unwetter | 846 | 45.7 % | 18.6 % | 35.7 % |  |
| Heißläufer-Alarm | 862 | 71.5 % | 21.7 % | 6.8 % |  |
| Bordstromausfall | 869 | 61.4 % | 13.9 % | 24.6 % |  |
| Medizinischer Notfall: Hitzekollaps | 103 | 72.8 % | 17.5 % | 9.7 % |  |
| Streit im Gang | 567 | 0.0 % | 99.6 % | 0.4 % | ⚠ Persönlich schlichten kaum gewählt; ⚠ Durchsage mit Autorität dominant; ⚠ Am nächsten Halt Fahrgäste umsetzen kaum gewählt |
| Antriebsstörung | 125 | 62.4 % | 0.0 % | 37.6 % | ⚠ Mit halber Kraft weiterfahren kaum gewählt |
| Personalausfall | 638 | 65.4 % | 5.6 % | 29.0 % |  |

Gewählte Arten (Referenz): sicher 42.3 %, riskant 23.1 %, strategisch 34.6 %.

## Dominierte Optionen

Erwartete Änderung (inkl. Risiko und Kosten neuer Probleme) an der schwierigsten Station, an der der Vorfall vorkommt, ohne Verbesserungen. Eine Option ist dominiert, wenn eine andere in allen drei Ressourcen mindestens gleich gut und in einer besser ist.

- keine

## Ausreden: Wert und Wahl

„Wahl, wenn auf der Hand“: wie oft die Referenz eine Karte spielt, wenn sie sie halten könnte. „Ø Wert“: durchschnittliche Zufriedenheitswirkung der Karte über alle Hände, egal ob gespielt.

| Ausrede | Seltenheit | Ø Wirkung (alle Vorfälle) | passt zu | gespielt (Referenz) |
|---|---|---|---|---|
| Bundesweite Großstörung | epic | 5.0 | 100.0 % | 28 |
| Notarzteinsatz am Zug | rare | 2.5 | 50.0 % | 687 |
| Warnstreik der anderen Gewerkschaft | epic | 2.4 | 37.5 % | 8 |
| Wir bitten um Verständnis | common | 2.0 | 100.0 % | 3895 |
| Verzögerungen im Betriebsablauf | common | 2.0 | 100.0 % | 3180 |
| Personen im Gleis | rare | 2.0 | 40.6 % | 622 |
| Störung der IT-Systeme | common | 1.8 | 62.5 % | 669 |
| Witterungsbedingte Einschränkungen | common | 1.8 | 62.5 % | 905 |
| Hohes Fahrgastaufkommen | common | 1.1 | 53.1 % | 773 |
| Tiere im Gleis | rare | 1.0 | 40.6 % | 685 |
| Reparatur am Zug | common | 0.1 | 40.6 % | 441 |
| Verspätung eines vorausfahrenden Zuges | common | 0.1 | 40.6 % | 560 |
| Störung am Stellwerk | common | 0.1 | 40.6 % | 620 |
| Kurzfristige Bauarbeiten | common | 0.1 | 40.6 % | 621 |
| Technische Störung | common | 0.1 | 40.6 % | 1546 |
| Kurzfristiger Personalausfall | common | -0.1 | 37.5 % | 577 |
| Behördliche Maßnahmen | rare | -0.1 | 25.0 % | 472 |
| Verspätung aus vorheriger Fahrt | common | -0.4 | 37.5 % | 1055 |
| Höhere Gewalt | epic | -1.3 | 25.0 % | 7 |

## Verbesserungen: Aktivierungen

Mit Zufallswahl der Verbesserungen (Anfänger-Strategie). „Besitz“ = Fahrten, in denen sie gewählt wurde. „Aktiv“ = durchschnittliche Zahl der Gelegenheiten pro Fahrt nach der Wahl, bei denen sie tatsächlich etwas verändert hat.

| Verbesserung | Besitz | Ø Aktivierungen pro Fahrt |
|---|---|---|
| Durchsage-Profi | 750 | 3.79 |
| Großes Repertoire | 740 | 3.78 |
| PÜNKTchen-Treuepunkte | 764 | 2.85 |
| Großzügiger Fahrplan | 730 | 2.77 |
| Werkstatt-Abo | 743 | 2.75 |
| Bordbistro-Flatrate | 741 | 2.53 |
| Seriöse Stimme | 765 | 1.82 |
| PÜNKT-Pressesprecher | 728 | 1.48 |
| Zocker-Lokführer | 745 | 1.39 |
| Dickes Fell | 795 | 1.17 |
| Schuld sind die anderen | 760 | 1.09 |
| Wunder-Mechaniker | 772 | 1.04 |
| Frühwarnsystem | 721 | 0.93 |
| Pressemappe | 728 | 0.92 |
| Legendärer Schaffner | 756 | 0.77 |
| Ersatzbus-Garantie | 741 | 0.31 |
| Notfallplan | 685 | 0.00 |

Selten aktiv (unter 1× pro Fahrt): Frühwarnsystem (0.93), Pressemappe (0.92), Legendärer Schaffner (0.77), Ersatzbus-Garantie (0.31), Notfallplan (0.00)

## Wo und woran Fahrten scheitern

| Strategie | Berlin | Lutherstadt Wittenberg | Leipzig | Erfurt | Bamberg | Nürnberg | Ingolstadt | München |
|---|---|---|---|---|---|---|---|---|
| Zufall | – | – | 0.1 % | 2.1 % | 5.1 % | 11.9 % | 17.6 % | 23.2 % |
| Anfänger | – | – | – | 0.5 % | 2.1 % | 8.0 % | 14.5 % | 20.8 % |
| Vorsichtig | – | – | – | – | – | 1.6 % | 10.5 % | 33.1 % |
| Ausgewogen (Referenz) | – | – | – | – | – | – | 0.3 % | 2.9 % |

- Anfänger: Niederlagen durch Verspätung 465, Zufriedenheit 297, Zugzustand 172.
- Vorsichtig: Niederlagen durch Verspätung 903, Zufriedenheit 0, Zugzustand 0.

## Bedienaufwand

- Anfänger: Ø 31.0 Klicks pro Fahrt, davon 23.2 echte Entscheidungen (Option, Ausrede, Verbesserung) und 7.8 reine „Weiter“-Klicks.

## Kurzfassung der Auffälligkeiten

- Auffällige Wahlhäufigkeiten:
  - kaffeemaschine: ⚠ Kaltgetränke gratis verteilen dominant; ⚠ Der Maschine einen beherzten Tritt verpassen kaum gewählt; ⚠ Bistro schließen, Personal hilft beim Fahrgastwechsel kaum gewählt
  - wlan: ⚠ Durchsage: „Genießen Sie die Landschaft“ kaum gewählt
  - reservierung: ⚠ Jeden Fall einzeln klären dominant; ⚠ Den Zugbegleiter schlichten lassen kaum gewählt; ⚠ Alle Reservierungen für ungültig erklären kaum gewählt
  - ueberholung: ⚠ Geduldig warten dominant; ⚠ Bei der Fahrdienstleitung drängeln kaum gewählt; ⚠ Entschuldigung in drei Sprachen durchsagen kaum gewählt
  - kuehe: ⚠ Dauerhupen kaum gewählt
  - puenktlich: ⚠ Kurz anhalten für eine Schnellwartung kaum gewählt; ⚠ Durchsage: „Das ist kein Fehler“ dominant; ⚠ Die Gelegenheit nutzen und Zeit aufholen kaum gewählt
  - tuerstoerung: ⚠ Tür reparieren lassen dominant; ⚠ Mit Panzertape sichern kaum gewählt; ⚠ Tür absperren kaum gewählt
  - zugbegleiter-fehlt: ⚠ Auf die Kollegen warten kaum gewählt
  - klimaanlage: ⚠ Mechaniker rufen dominant; ⚠ Fenster öffnen kaum gewählt; ⚠ Problem ignorieren kaum gewählt
  - signalstoerung: ⚠ Auf Sicht fahren kaum gewählt
  - toiletten: ⚠ Selbst mit dem Pümpel ran kaum gewählt
  - langsamfahrstelle: ⚠ Danach mit Vollgas aufholen kaum gewählt
  - notbremse: ⚠ Sofort weiterfahren kaum gewählt
  - lokfuehrer: ⚠ Auf die Ablösung warten kaum gewählt; ⚠ Einen Fahrgast mit Modelleisenbahn-Erfahrung fragen kaum gewählt; ⚠ Lokführer um Überstunden bitten dominant
  - wagenreihung: ⚠ Kurze Durchsage machen kaum gewählt
  - stellwerk: ⚠ Fahrdienstleiter aus der Pause holen kaum gewählt
  - ueberfuellt: ⚠ Verstärkungswagen anfordern kaum gewählt; ⚠ Fahrgäste auf den nächsten Zug verweisen kaum gewählt; ⚠ Alle mitnehmen dominant
  - fehlender-wagen: ⚠ Ersatzwagen ankuppeln lassen kaum gewählt
  - falsche-reihenfolge: ⚠ Ausführliche Durchsage mit Skizze kaum gewählt; ⚠ Halte einfach auslassen dominant
  - fussballfans: ⚠ Bundespolizei mitfahren lassen kaum gewählt; ⚠ Bordbistro gibt Freibier aus dominant; ⚠ Alle Fans in einen Wagen kaum gewählt
  - medizinischer-notfall: ⚠ Außerplanmäßig halten, Rettungsdienst rufen kaum gewählt
  - fahrgastkonflikt: ⚠ Persönlich schlichten kaum gewählt; ⚠ Durchsage mit Autorität dominant; ⚠ Am nächsten Halt Fahrgäste umsetzen kaum gewählt
  - antriebsausfall: ⚠ Mit halber Kraft weiterfahren kaum gewählt
- Dominierte Optionen: 0
- Selten aktive Verbesserungen: Frühwarnsystem (0.93), Pressemappe (0.92), Legendärer Schaffner (0.77), Ersatzbus-Garantie (0.31), Notfallplan (0.00)
