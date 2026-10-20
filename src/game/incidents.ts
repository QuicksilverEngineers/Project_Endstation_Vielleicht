import type { Incident } from './types'

/** Reguläre Vorfälle. Jede Station zieht einen davon aus der Stufe, die zu ihr passt. */
export const INCIDENTS: readonly Incident[] = [
  // ── Stufe 1: Einstieg ──────────────────────────────────────────────────────────────
  {
    id: 'kaffeemaschine',
    title: 'Kaffeemaschine im Bordbistro defekt',
    tier: 1,
    categories: ['technik', 'fahrgaeste'],
    description:
      'Die Kaffeemaschine im Bordbistro zeigt „Bitte entkalken“. Das tut sie seit 2019. Heute meint sie es ernst.',
    choices: [
      {
        id: 'freigetraenke',
        kind: 'safe',
        label: 'Kaltgetränke gratis verteilen',
        effects: { delay: 2, satisfaction: 4 },
        outcome: 'Warme Apfelschorle für alle! Das Bistro-Team braucht etwas länger, die Stimmung steigt.',
      },
      {
        id: 'treten',
        kind: 'risky',
        label: 'Der Maschine einen beherzten Tritt verpassen',
        effects: { satisfaction: 6 },
        outcome: 'Ein Tritt, ein Röcheln – und die Maschine brüht wieder. Applaus aus Wagen 11.',
        risk: {
          chance: 0.3,
          effects: { satisfaction: -8, condition: -14 },
          outcome: 'Die Maschine läuft wieder. Dafür klappert jetzt die Bistro-Tür, und aus der Steckdose riecht es verbrannt.',
          causes: ['technikschaden'],
        },
      },
      {
        id: 'schliessen',
        kind: 'strategic',
        label: 'Bistro schließen, Personal hilft beim Fahrgastwechsel',
        effects: { delay: -3, satisfaction: -14 },
        outcome: 'Ein Schild „Heute leider kein Bistro-Betrieb“ hängt an der Tür. Es ist laminiert. Man ahnt, warum.',
      },
    ],
  },
  {
    id: 'wlan',
    title: 'WLAN ausgefallen',
    tier: 1,
    categories: ['technik'],
    description:
      'Das WLAN ist ausgefallen. Die Anzeige sagt „Verbunden, kein Internet“ – also wie immer, nur ehrlicher. In der 1. Klasse bricht ein Videocall mit dem Vorstand ab.',
    choices: [
      {
        id: 'router',
        kind: 'safe',
        label: 'Router aus- und wieder einschalten',
        effects: { delay: 1, satisfaction: -6 },
        outcome: 'Das WLAN kommt zurück, mit der Geschwindigkeit eines Faxgeräts.',
      },
      {
        id: 'landschaft',
        kind: 'risky',
        label: 'Durchsage: „Genießen Sie die Landschaft“',
        effects: { satisfaction: -2 },
        outcome: 'Draußen ist tatsächlich das Saaletal. Einige legen das Handy weg und schauen hinaus.',
        risk: {
          chance: 0.55,
          effects: { satisfaction: -16 },
          outcome: 'Draußen ist Lärmschutzwand. Sehr viel Lärmschutzwand. Sie ist grau und hat kein WLAN.',
        },
      },
      {
        id: 'halt',
        kind: 'strategic',
        label: 'Im Bahnhof mit gutem Netz länger halten',
        effects: { delay: 6, satisfaction: 8 },
        outcome: 'Alle Mails gehen raus, alle Calls laufen weiter. Der Vorstand ist zufrieden, der Fahrplan nicht.',
      },
    ],
  },
  {
    id: 'reservierung',
    title: 'Reservierungsanzeige ausgefallen',
    tier: 1,
    categories: ['technik', 'fahrgaeste'],
    description:
      'Alle Reservierungsanzeigen zeigen „ggf. freigeben“. Drei Fahrgäste und ein Hund beanspruchen Platz 61, jeweils mit Beleg.',
    choices: [
      {
        id: 'manuell',
        kind: 'safe',
        label: 'Jeden Fall einzeln klären',
        effects: { delay: 4, satisfaction: 2 },
        outcome: 'Mit Klemmbrett und Engelsgeduld lösen Sie jeden Konflikt. Der Hund bekommt Platz 61.',
      },
      {
        id: 'zugbegleiter',
        kind: 'risky',
        label: 'Den Zugbegleiter schlichten lassen',
        effects: { delay: 1, satisfaction: -2 },
        outcome: 'Der Zugbegleiter hat früher in einer Kita gearbeitet. Nach zwei Minuten teilen sich alle Platz 61.',
        risk: {
          chance: 0.3,
          effects: { delay: 3, satisfaction: -18 },
          outcome: 'Der Zugbegleiter schlichtet mit dem Satz „Setzen Sie sich einfach irgendwo hin.“ Drei Menschen und ein Hund setzen sich auf Platz 61.',
        },
      },
      {
        id: 'aufheben',
        kind: 'strategic',
        label: 'Alle Reservierungen für ungültig erklären',
        effects: { delay: -2, satisfaction: -16 },
        outcome: 'Freie Platzwahl! Die Stimmung erinnert an den Schlussverkauf, aber alle sitzen in Rekordzeit.',
      },
    ],
  },
  {
    id: 'ueberholung',
    title: 'Güterzug hat Vorrang',
    tier: 1,
    categories: ['betrieb'],
    description:
      'Die Fahrdienstleitung lässt einen Güterzug mit 40 Waggons Kies vorbei. Kies hat heute Vorrang. Kies hat erstaunlich oft Vorrang.',
    choices: [
      {
        id: 'warten',
        kind: 'safe',
        label: 'Geduldig warten',
        effects: { delay: 4 },
        outcome: 'Waggon 37, 38, 39 … Sie zählen mit, um nicht die Fassung zu verlieren.',
      },
      {
        id: 'draengeln',
        kind: 'risky',
        label: 'Bei der Fahrdienstleitung drängeln',
        effects: { delay: 1 },
        outcome: 'Mit Ihrem dritten Anruf haben Sie Erfolg. Der Güterzug muss auf das Nebengleis.',
        risk: {
          chance: 0.45,
          effects: { delay: 6, satisfaction: -6 },
          outcome: 'Die Fahrdienstleitung legt auf. Sie warten trotzdem, nur schlechter gelaunt – und der ganze Zug hat mitgehört.',
        },
      },
      {
        id: 'entschuldigung',
        kind: 'strategic',
        label: 'Entschuldigung in drei Sprachen durchsagen',
        effects: { delay: 8, satisfaction: 8 },
        outcome: '„We apologize for the inconvenience.“ Ihr Französisch beeindruckt besonders. Es dauert nur etwas.',
      },
    ],
  },
  {
    id: 'kuehe',
    title: 'Kühe im Gleis',
    tier: 1,
    categories: ['infrastruktur', 'sicherheit'],
    description:
      'Eine Herde Kühe steht auf der Strecke. Die Störungsmeldung führt sie als „Tiere mit ungeklärter Zuständigkeit“.',
    choices: [
      {
        id: 'bauer',
        kind: 'safe',
        label: 'Den Bauern anrufen',
        effects: { delay: 5, satisfaction: 2 },
        outcome: 'Der Bauer kommt mit dem Traktor und füllt geduldig das Formular „Tiere im Gleis, nicht dienstlich“ aus.',
      },
      {
        id: 'hupen',
        kind: 'risky',
        label: 'Dauerhupen',
        effects: { delay: 2 },
        outcome: 'Die Kühe trotten erstaunlich gehorsam davon. Sie fühlen sich kurz wie ein Hirte.',
        risk: {
          chance: 0.45,
          effects: { delay: 3, satisfaction: -12 },
          outcome: 'Die Kühe gehen. Das Baby in Wagen 3 wacht auf und bleibt es bis Nürnberg.',
        },
      },
      {
        id: 'schieben',
        kind: 'strategic',
        label: 'Im Schritttempo durch die Herde rollen',
        effects: { condition: -12 },
        outcome: 'Die Kühe weichen widerwillig. Eine hinterlässt einen Abdruck im Bugspoiler.',
      },
    ],
  },
  {
    id: 'puenktlich',
    title: 'Der Zug ist pünktlich',
    tier: 1,
    categories: ['betrieb'],
    description:
      'Der Zug liegt exakt im Fahrplan. Die Leitstelle fragt zweimal nach, ob Ihre Uhr richtig geht. Die Fahrgäste werden misstrauisch.',
    choices: [
      {
        id: 'wartung',
        kind: 'safe',
        label: 'Kurz anhalten für eine Schnellwartung',
        effects: { delay: 3, condition: 10 },
        outcome: 'Ein paar Schrauben werden nachgezogen. Danach fühlt sich alles wieder wie gewohnt verspätet an.',
        cures: ['technikschaden'],
      },
      {
        id: 'beruhigen',
        kind: 'risky',
        label: 'Durchsage: „Das ist kein Fehler“',
        effects: { satisfaction: 8 },
        outcome: 'Die Fahrgäste beruhigen sich und filmen die Anzeigetafel als Beweis für die Nachwelt.',
        risk: {
          chance: 0.25,
          effects: { satisfaction: -12 },
          outcome: 'Niemand glaubt Ihnen. Einige steigen vorsichtshalber aus und nehmen den nächsten Zug.',
        },
      },
      {
        id: 'aufholen',
        kind: 'strategic',
        label: 'Die Gelegenheit nutzen und Zeit aufholen',
        effects: { delay: -5, condition: -12 },
        outcome: 'Der Lokführer drückt aufs Tempo und holt fünf Minuten raus. Der Zug schwitzt.',
      },
    ],
  },
  {
    id: 'tuerstoerung',
    title: 'Türstörung in Wagen 23',
    tier: 1,
    categories: ['technik'],
    description:
      'Die Tür von Wagen 23 schließt nicht. Laut Display ist sie „in Bearbeitung“, seit Hamburg. Dieser Zug fährt nicht über Hamburg.',
    choices: [
      {
        id: 'reparieren',
        kind: 'safe',
        label: 'Tür reparieren lassen',
        effects: { delay: 3, condition: 4 },
        outcome: 'Ein Neustart der Türsteuerung hilft. Wie bei fast allem an diesem Zug.',
        cures: ['technikschaden'],
      },
      {
        id: 'klebeband',
        kind: 'risky',
        label: 'Mit Panzertape sichern',
        effects: { delay: 1, condition: -3 },
        outcome: 'Hält bombenfest. Sie notieren sich die Marke für die nächste Störung.',
        risk: {
          chance: 0.5,
          effects: { delay: 2, condition: -12 },
          outcome: 'Hält bombenfest. Bis zum nächsten Tunnel. Jetzt flattert das Tape, und die Tür klappert im Takt.',
          causes: ['technikschaden'],
        },
      },
      {
        id: 'absperren',
        kind: 'strategic',
        label: 'Tür absperren',
        effects: { satisfaction: -12 },
        outcome: 'Alle Fahrgäste aus Wagen 23 müssen durch zwei andere Wagen steigen. Mit Gepäck.',
      },
    ],
  },
  {
    id: 'zugbegleiter-fehlt',
    title: 'Verspätetes Personal',
    tier: 1,
    categories: ['personal'],
    description:
      'Das Zugbegleiterteam ist nur zur Hälfte da. Die andere Hälfte sitzt im Gegenzug, der seinerseits noch auf seine Zugbegleiter wartet.',
    choices: [
      {
        id: 'warten',
        kind: 'safe',
        label: 'Auf die Kollegen warten',
        effects: { delay: 4, satisfaction: -2 },
        outcome: 'Die Kollegen kommen gerannt, mit Kaffee für alle. Für Sie leider nicht.',
      },
      {
        id: 'aushilfe',
        kind: 'risky',
        label: 'Einen Fahrgast als Aushilfe anlernen',
        effects: { delay: 1, satisfaction: 6 },
        outcome: 'Frau Yilmaz aus Wagen 6 macht das großartig. Sie bekommt mehr Applaus als Sie.',
        risk: {
          chance: 0.5,
          effects: { delay: 2, satisfaction: -12 },
          outcome: 'Der Aushilfsschaffner kontrolliert ausschließlich PÜNKT-Vorteilskarten und bricht bei jeder abgelaufenen in Tränen aus.',
        },
      },
      {
        id: 'allein',
        kind: 'strategic',
        label: 'Mit halbem Team losfahren',
        effects: { delay: -3, satisfaction: -5 },
        outcome: 'Pünktliche Abfahrt! Das Team rennt ab jetzt doppelt so viel.',
        causes: ['erschoepfung'],
      },
    ],
  },

  // ── Stufe 2: Mittelstrecke ─────────────────────────────────────────────────────────
  {
    id: 'klimaanlage',
    title: 'Klimaanlage defekt',
    tier: 2,
    categories: ['technik', 'fahrgaeste'],
    description:
      'Die Klimaanlage hat den Dienst quittiert. In Wagen 7 ist es so warm, dass die Schokolade im Bordbistro offiziell als Getränk geführt wird.',
    choices: [
      {
        id: 'mechaniker',
        kind: 'safe',
        label: 'Mechaniker rufen',
        effects: { delay: 8, condition: 10 },
        outcome: 'Der Mechaniker kommt, klopft zweimal auf die Anlage und sagt „Jetzt geht’s wieder.“ Es geht wieder.',
        cures: ['hitze'],
      },
      {
        id: 'fenster',
        kind: 'risky',
        label: 'Fenster öffnen',
        effects: { delay: 2, satisfaction: -10 },
        outcome: 'Das Zugteam findet tatsächlich ein Fenster, das sich kippen lässt. Ein laues Lüftchen weht durch Wagen 7.',
        risk: {
          chance: 0.55,
          effects: { delay: 3, satisfaction: -16 },
          outcome: 'Leider lassen sich die Fenster im PX 404 nicht öffnen. Die Fahrgäste schätzen den guten Willen nur mäßig, die Hitze bleibt.',
          causes: ['hitze'],
        },
      },
      {
        id: 'ignorieren',
        kind: 'strategic',
        label: 'Problem ignorieren',
        effects: { satisfaction: -20 },
        outcome: 'Sie verteilen gedanklich Verständnis. Die Fahrgäste verteilen schriftliche Beschwerden – und schwitzen weiter.',
        causes: ['hitze'],
      },
    ],
  },
  {
    id: 'signalstoerung',
    title: 'Signalstörung',
    tier: 2,
    categories: ['infrastruktur', 'technik'],
    description:
      'Ein Signal zeigt gleichzeitig Rot und Grün. Der Fahrdienstleiter hat ein Störungsticket eröffnet. Bearbeitungszeit: drei bis fünf Werktage.',
    choices: [
      {
        id: 'warten',
        kind: 'safe',
        label: 'Auf Freigabe warten',
        effects: { delay: 3, satisfaction: -6 },
        outcome: 'Nach einer gefühlten Ewigkeit entscheidet sich das Signal für Grün. Das Ticket bleibt offen, für alle Fälle.',
      },
      {
        id: 'auf-sicht',
        kind: 'risky',
        label: 'Auf Sicht fahren',
        effects: { delay: 2, satisfaction: -3 },
        outcome: 'Im Schritttempo geht es weiter, nach einem Kilometer ist die Strecke wieder frei.',
        risk: {
          chance: 0.3,
          effects: { delay: 6, satisfaction: -10, condition: -12 },
          outcome: 'Im Schritttempo geht es weiter. Und weiter. Ein Radfahrer überholt den Zug und winkt.',
        },
      },
      {
        id: 'umleitung',
        kind: 'strategic',
        label: 'Über Nebenstrecke umleiten',
        effects: { condition: -13 },
        outcome: 'Die Nebenstrecke wurde zuletzt 1987 befahren. Das hört man an jedem Schienenstoß – aber Sie verlieren keine Zeit.',
      },
    ],
  },
  {
    id: 'toiletten',
    title: 'Alle Toiletten defekt',
    tier: 2,
    categories: ['technik', 'fahrgaeste'],
    description:
      'Sämtliche Toiletten melden „Außer Betrieb“. Die letzte funktionierende ist laut Bordsystem „reserviert“. Für wen, weiß niemand.',
    choices: [
      {
        id: 'halt',
        kind: 'safe',
        label: 'Außerplanmäßigen Halt einlegen',
        effects: { delay: 3, satisfaction: -2 },
        outcome: 'Die Bahnhofstoilette kostet einen Euro. Sie zahlen aus der Kaffeekasse.',
      },
      {
        id: 'selbst',
        kind: 'risky',
        label: 'Selbst mit dem Pümpel ran',
        effects: { delay: 2, satisfaction: 2 },
        outcome: 'Mit einem gezielten Stoß funktionieren drei Toiletten wieder. Sie sind ein Held. Ein nasser Held.',
        risk: {
          chance: 0.45,
          effects: { delay: 3, satisfaction: -8, condition: -9 },
          outcome: 'Eine Toilette funktioniert wieder. Über die anderen und den Boden in Wagen 5 schweigen Sie bis zur Rente.',
        },
      },
      {
        id: 'erste-klasse',
        kind: 'strategic',
        label: 'Die Toilette der 1. Klasse für alle öffnen',
        effects: { satisfaction: 6, condition: -12 },
        outcome: 'Die Toilette der 1. Klasse hält tapfer durch – bis sie es nicht mehr tut.',
      },
    ],
  },
  {
    id: 'langsamfahrstelle',
    title: 'Bauarbeiten',
    tier: 2,
    categories: ['infrastruktur', 'betrieb'],
    description:
      'Wegen Bauarbeiten gilt hier Tempo 40. Laut Schild seit 2009, laut Bauplan bis 2009. Gebaut wird heute nicht, gebremst trotzdem.',
    choices: [
      {
        id: 'langsam',
        kind: 'safe',
        label: 'Vorschriftsmäßig langsam fahren',
        effects: { delay: 4, satisfaction: -3 },
        outcome: 'Mit 40 km/h zuckeln Sie an verlassenen Baggern vorbei.',
      },
      {
        id: 'vollgas',
        kind: 'risky',
        label: 'Danach mit Vollgas aufholen',
        effects: { delay: 1, condition: -4 },
        outcome: 'Hinter der Baustelle geben Sie alles, und der Zug macht tapfer mit.',
        risk: {
          chance: 0.6,
          effects: { delay: 1, condition: -18 },
          outcome: 'Hinter der Baustelle geben Sie alles. Der Zug gibt ebenfalls alles, zum Teil Schrauben.',
          causes: ['technikschaden'],
        },
      },
      {
        id: 'wartung',
        kind: 'strategic',
        label: 'Die Schleichfahrt für eine Wartung nutzen',
        effects: { delay: 9, condition: 14 },
        outcome: 'Während der Zug kriecht, zieht das Team alle Schrauben nach. Der Fahrplan leidet, der Zug blüht auf.',
        cures: ['technikschaden'],
      },
    ],
  },
  {
    id: 'notbremse',
    title: 'Notbremsung',
    tier: 2,
    categories: ['fahrgaeste', 'technik', 'sicherheit'],
    description:
      'Ein Fahrgast hat die Notbremse gezogen, weil sein Koffer noch in Bamberg auf dem Bahnsteig steht. Der Koffer ist pünktlich, der Fahrgast nicht.',
    choices: [
      {
        id: 'pruefen',
        kind: 'safe',
        label: 'Bremsen ordnungsgemäß prüfen',
        effects: { delay: 4, condition: 5 },
        outcome: 'Alles in Ordnung. Den Koffer schicken die Kollegen in Bamberg mit dem nächsten Zug.',
        cures: ['technikschaden'],
      },
      {
        id: 'weiter',
        kind: 'risky',
        label: 'Sofort weiterfahren',
        effects: { delay: 2 },
        outcome: 'Die Bremsen lösen sich sauber. Glück gehabt.',
        risk: {
          chance: 0.5,
          effects: { delay: 2, condition: -14 },
          outcome: 'Es quietscht noch ein bisschen. Und dann noch ein bisschen mehr. Das wird schon.',
          causes: ['technikschaden'],
        },
      },
      {
        id: 'kurztest',
        kind: 'strategic',
        label: 'Nur das Nötigste prüfen und Zeit gutmachen',
        effects: { delay: -2, condition: -10 },
        outcome: 'Sie prüfen das Nötigste und holen die Zeit auf der Strecke wieder rein. Die Bremsen finden das weniger lustig.',
      },
    ],
  },
  {
    id: 'lokfuehrer',
    title: 'Ablösung fehlt',
    tier: 2,
    categories: ['personal'],
    description:
      'Der Lokführer hat Feierabend, gesetzlich vorgeschrieben. Die Ablösung steckt in einem verspäteten Zug fest, gefühlt ebenfalls vorgeschrieben.',
    choices: [
      {
        id: 'warten',
        kind: 'safe',
        label: 'Auf die Ablösung warten',
        effects: { delay: 5, satisfaction: -3 },
        outcome: 'Die Ablösung kommt mit Verspätung. Sie entschuldigt sich mit Verweis auf eine interne Richtlinie von PÜNKT.',
      },
      {
        id: 'fahrgast',
        kind: 'risky',
        label: 'Einen Fahrgast mit Modelleisenbahn-Erfahrung fragen',
        effects: { delay: 2, satisfaction: 8 },
        outcome: 'Herr Krüger aus Wagen 9 fährt butterweich. Er hat sein Leben lang auf diesen Moment gewartet.',
        risk: {
          chance: 0.6,
          effects: { delay: 3, condition: -16 },
          outcome: 'Herr Krüger ist begeistert. Der Zug eher nicht.',
          causes: ['technikschaden'],
        },
      },
      {
        id: 'ueberstunden',
        kind: 'strategic',
        label: 'Lokführer um Überstunden bitten',
        effects: { condition: -6 },
        outcome: 'Er fährt weiter, aber deutlich ruppiger. Die Bremsen und die Stimmung im Team bekommen es zu spüren.',
        causes: ['erschoepfung'],
      },
    ],
  },
  {
    id: 'wagenreihung',
    title: 'Falsche Wagenreihung',
    tier: 2,
    categories: ['betrieb', 'fahrgaeste'],
    description:
      'Aufgrund einer kurzfristigen Änderung der Wagenreihung befindet sich Wagen 7 heute möglicherweise in einem anderen Zug. 400 Menschen suchen ihn mit Rollkoffern.',
    choices: [
      {
        id: 'warten',
        kind: 'safe',
        label: 'Allen Zeit zum Umsortieren geben',
        effects: { delay: 4, satisfaction: -2 },
        outcome: 'Geduldig warten Sie, bis jeder seinen reservierten Platz gefunden hat. Fast jeder.',
      },
      {
        id: 'durchsage',
        kind: 'risky',
        label: 'Kurze Durchsage machen',
        effects: { delay: 2, satisfaction: -3 },
        outcome: 'Ihre Durchsage ist klar und deutlich. Erstaunlicherweise hören alle zu.',
        risk: {
          chance: 0.55,
          effects: { delay: 2, satisfaction: -15 },
          outcome: 'Ihre Durchsage geht im Rollkoffer-Donner unter. Alle steigen irgendwo ein, die meisten in Wagen 1.',
          causes: ['ueberfuellung'],
        },
      },
      {
        id: 'abfahren',
        kind: 'strategic',
        label: 'Sofort abfahren, sortiert wird unterwegs',
        effects: { delay: -2, satisfaction: -14 },
        outcome: 'Sie fahren auf die Sekunde ab. Die Gänge sind voll von Menschen, die sich gegenseitig ihre Reservierung zeigen.',
      },
    ],
  },
  {
    id: 'stellwerk',
    title: 'Stellwerk nicht besetzt',
    tier: 2,
    categories: ['personal', 'infrastruktur'],
    description:
      'Das nächste Stellwerk ist nicht besetzt. Die zuständige Kollegin kommt „gleich“. „Gleich“ ist bei PÜNKT eine Zeiteinheit, aber keine genormte.',
    choices: [
      {
        id: 'warten',
        kind: 'safe',
        label: 'Auf Schichtbeginn warten',
        effects: { delay: 4, satisfaction: -6 },
        outcome: '„Gleich“ war diesmal erstaunlich kurz. Die Kollegin entschuldigt sich mit Verweis auf den Schichtplan, den sie selbst nicht versteht.',
      },
      {
        id: 'anrufen',
        kind: 'risky',
        label: 'Fahrdienstleiter aus der Pause holen',
        effects: { delay: 3, satisfaction: -2 },
        outcome: 'Er kommt, ein halbes Brötchen noch im Mund. Die Weichen stellt er trotzdem souverän.',
        risk: {
          chance: 0.3,
          effects: { delay: 9, satisfaction: -12 },
          outcome: 'Er geht nicht ran. Dann geht er ran, und dann ist er beleidigt. Sie verlieren Zeit und Nerven.',
        },
      },
      {
        id: 'bistro',
        kind: 'strategic',
        label: 'Wartezeit mit Freigetränken überbrücken',
        effects: { delay: 9, satisfaction: 10 },
        outcome: 'Das Bistro schenkt aus, die Fahrgäste stoßen auf das Stellwerk an. Die Kollegin kommt, als die Gläser leer sind.',
      },
    ],
  },
  {
    id: 'ueberfuellt',
    title: 'Überfüllter Zug',
    tier: 2,
    categories: ['fahrgaeste', 'betrieb'],
    description:
      'Der Vorzug fällt aus, also nehmen alle diesen. 300 zusätzliche Fahrgäste, null zusätzliche Sitzplätze. Im Gang wird über Stehplatzreservierungen diskutiert.',
    choices: [
      {
        id: 'verstaerkung',
        kind: 'safe',
        label: 'Verstärkungswagen anfordern',
        effects: { delay: 4, condition: -6 },
        outcome: 'Zwei Wagen werden angekuppelt. Einer davon ist von 1994, aber er hat Sitze.',
        cures: ['ueberfuellung'],
      },
      {
        id: 'verweisen',
        kind: 'risky',
        label: 'Fahrgäste auf den nächsten Zug verweisen',
        effects: { delay: 1, satisfaction: -1 },
        outcome: 'Der nächste Zug kommt in acht Minuten und ist fast leer. Die meisten steigen murrend um.',
        risk: {
          chance: 0.4,
          effects: { delay: 3, satisfaction: -12 },
          outcome: 'Der nächste Zug fällt aus. Die Fahrgäste wissen jetzt, wer Sie sind und in welchem Wagen Sie sitzen.',
          causes: ['ueberfuellung'],
        },
      },
      {
        id: 'alle',
        kind: 'strategic',
        label: 'Alle mitnehmen',
        effects: { delay: -2, satisfaction: -4 },
        outcome: 'Alle passen rein. Irgendwie. Der Zug fährt pünktlich ab und riecht nach nassem Wintermantel.',
        causes: ['ueberfuellung'],
      },
    ],
  },
  {
    id: 'fehlender-wagen',
    title: 'Fehlender Wagen',
    tier: 2,
    categories: ['betrieb', 'technik'],
    description:
      'Wagen 21 fehlt. Nicht defekt, nicht gesperrt – einfach nicht da. Die 80 Reservierungen für Wagen 21 sind dagegen vollzählig erschienen.',
    choices: [
      {
        id: 'ersatz',
        kind: 'safe',
        label: 'Ersatzwagen ankuppeln lassen',
        effects: { delay: 4, satisfaction: -5 },
        outcome: 'Ein Ersatzwagen wird aus dem Abstellgleis geholt. Er riecht neu – vermutlich, weil ihn nie jemand benutzt hat.',
      },
      {
        id: 'erste-klasse',
        kind: 'risky',
        label: 'Die 1. Klasse für alle öffnen',
        effects: { satisfaction: 6 },
        outcome: 'Die Gäste aus Wagen 21 sinken in die Ledersitze. Einige wollen nie wieder aussteigen.',
        risk: {
          chance: 0.55,
          effects: { satisfaction: -14 },
          outcome: 'Die Gäste der 1. Klasse gründen spontan einen Betriebsrat. Er tagt in voller Lautstärke.',
        },
      },
      {
        id: 'verteilen',
        kind: 'strategic',
        label: 'Alle auf die übrigen Wagen verteilen',
        effects: { delay: -2, satisfaction: -10 },
        outcome: 'Es wird eng und laut, aber alle sind an Bord, und der Halt geht sogar schneller als geplant.',
      },
    ],
  },
  {
    id: 'anschluss',
    title: 'Anschlusszug verpasst',
    tier: 2,
    categories: ['betrieb', 'fahrgaeste'],
    description:
      '120 Fahrgäste wollen in Nürnberg den Anschluss nach Regensburg erreichen. Das Bordsystem meldet „Anschluss wird voraussichtlich erreicht“. Das meldet es immer.',
    choices: [
      {
        id: 'formulare',
        kind: 'safe',
        label: 'Fahrgastrechte-Formulare verteilen',
        effects: { delay: 1, satisfaction: -4 },
        outcome: 'Sie verteilen 120 Formulare. Die Fahrgäste füllen sie mit einer Inbrunst aus, die Sie beunruhigt.',
      },
      {
        id: 'warten-lassen',
        kind: 'risky',
        label: 'Den Anschlusszug um Warten bitten',
        effects: { satisfaction: 8 },
        outcome: 'Der Anschluss wartet tatsächlich. Ein historischer Moment, Fahrgäste umarmen sich.',
        risk: {
          chance: 0.6,
          effects: { satisfaction: -14 },
          outcome: 'Der Anschlusszug konnte leider nicht warten. Er war überraschenderweise pünktlich.',
        },
      },
      {
        id: 'hinterher',
        kind: 'strategic',
        label: 'Mit Höchstgeschwindigkeit hinterher',
        effects: { delay: -4, condition: -12 },
        outcome: 'Der Lokführer holt vier Minuten raus. Der Zug hat danach Seitenstechen.',
      },
    ],
  },
  {
    id: 'falsche-reihenfolge',
    title: 'Halte in falscher Reihenfolge',
    tier: 2,
    categories: ['betrieb', 'infrastruktur'],
    description:
      'Wegen einer Umleitung bedient der Zug die nächsten Halte in umgekehrter Reihenfolge. Die Innenanzeige hat beschlossen, gar keine Reihenfolge mehr anzuzeigen.',
    choices: [
      {
        id: 'erklaeren',
        kind: 'safe',
        label: 'Ausführliche Durchsage mit Skizze',
        effects: { delay: 2, satisfaction: -8 },
        outcome: 'Sie erklären die Lage dreimal, einmal davon auf Englisch. Danach ist es fast allen klar.',
      },
      {
        id: 'zusatzhalt',
        kind: 'risky',
        label: 'Zusatzhalt für alle Gestrandeten einlegen',
        effects: { delay: 4, satisfaction: 8 },
        outcome: 'Der Zusatzhalt klappt wie am Schnürchen. Eine Fahrgästin schreibt einen Dankesbrief an den PÜNKT-Kundendienst. Er wird in 6–8 Wochen gelesen.',
        risk: {
          chance: 0.45,
          effects: { delay: 9, satisfaction: -6 },
          outcome: 'Der Zusatzhalt hat leider keinen Bahnsteig auf der richtigen Seite. Es wird rangiert.',
        },
      },
      {
        id: 'auslassen',
        kind: 'strategic',
        label: 'Halte einfach auslassen',
        effects: { delay: -3, satisfaction: -14 },
        outcome: 'Sie fahren einfach durch. Schneller war der Zug nie, beliebter auch nicht.',
      },
    ],
  },
  {
    id: 'fussballfans',
    title: 'Fußballfans an Bord',
    tier: 2,
    categories: ['fahrgaeste', 'sicherheit'],
    description:
      '200 Fans steigen zu, auf dem Weg zum Auswärtsspiel. Sie haben bereits ein Lied über Ihren Zug. Es reimt sich auf „Verspätung“, mit etwas gutem Willen.',
    choices: [
      {
        id: 'polizei',
        kind: 'safe',
        label: 'Bundespolizei mitfahren lassen',
        effects: { delay: 3, satisfaction: -6 },
        outcome: 'Vier Beamte steigen zu. Die Fans singen jetzt leiser, aber über die Polizei.',
      },
      {
        id: 'freibier',
        kind: 'risky',
        label: 'Bordbistro gibt Freibier aus',
        effects: { satisfaction: 10 },
        outcome: 'Die Fans singen jetzt ein Lied über Sie. Ein nettes. Sogar mit Reim.',
        risk: {
          chance: 0.55,
          effects: { satisfaction: -10, condition: -12 },
          outcome: 'Die Fans feiern. Die Gepäckablagen feiern nicht mehr mit, sie liegen jetzt im Gang.',
        },
      },
      {
        id: 'eigener-wagen',
        kind: 'strategic',
        label: 'Alle Fans in einen Wagen',
        effects: { condition: -12 },
        outcome: 'Wagen 9 gehört jetzt den Fans. Der Rest des Zuges hat Ruhe. Wagen 9 wird nie wieder derselbe sein.',
      },
    ],
  },

  // ── Stufe 3: Endspurt ──────────────────────────────────────────────────────────────
  {
    id: 'oberleitung',
    title: 'Baum auf der Oberleitung',
    tier: 3,
    categories: ['wetter', 'infrastruktur'],
    description:
      'Sturmtief „Ursula“ hat einen Baum auf die Oberleitung gelegt. Zuständig für den Baum ist das Forstamt, für die Leitung die Netzsparte, für die Fahrgäste: niemand.',
    choices: [
      {
        id: 'raeumen',
        kind: 'safe',
        label: 'Strecke räumen lassen',
        effects: { delay: 5, satisfaction: -6 },
        outcome: 'Die Feuerwehr zersägt den Baum, das Forstamt bestätigt den Vorgang, die Netzsparte gibt frei. In dieser Reihenfolge. Mit Formularen.',
      },
      {
        id: 'drunter',
        kind: 'risky',
        label: 'Vorsichtig darunter durchfahren',
        effects: { condition: -4 },
        outcome: 'Der Stromabnehmer streift ein paar Zweige. Sie sind durch, mit Laub auf dem Dach.',
        risk: {
          chance: 0.5,
          effects: { delay: 1, condition: -16 },
          outcome: 'Der Stromabnehmer macht ein Geräusch, das man nie wieder vergisst. Aber Sie sind durch.',
          causes: ['technikschaden'],
        },
      },
      {
        id: 'umleitung',
        kind: 'strategic',
        label: 'Über eine andere Strecke umleiten',
        effects: { condition: -14 },
        outcome: 'Die Umleitung ist frei, aber holprig. Der Speisewagen räumt danach Geschirr auf.',
      },
    ],
  },
  {
    id: 'personen-im-gleis',
    title: 'Personen im Gleis',
    tier: 3,
    categories: ['sicherheit', 'infrastruktur'],
    description:
      'Die Leitstelle meldet Personen im Gleis, die Strecke wird gesperrt. Das ist richtig so. Unklar ist nur, wer die Sperrung wieder aufhebt – das wird gerade geklärt. Von wem, wird auch geklärt.',
    choices: [
      {
        id: 'sperrung',
        kind: 'safe',
        label: 'Streckensperrung abwarten',
        effects: { delay: 5, satisfaction: -6 },
        outcome: 'Die Bundespolizei klärt die Lage zügig und sachlich. Die Freigabe der Strecke dauert dann länger als der ganze Einsatz.',
      },
      {
        id: 'ranfahren',
        kind: 'risky',
        label: 'Polizei anfordern und die Freigabe aktiv nachhalten',
        effects: { delay: 4 },
        outcome: 'Die Polizei ist schnell vor Ort, die Strecke wird freigegeben. Die schriftliche Bestätigung folgt per Fax.',
        risk: {
          chance: 0.45,
          effects: { delay: 8, satisfaction: -12 },
          outcome: 'Die Freigabe zieht sich. Drei Stellen müssen zustimmen, zwei davon sind gerade in der Mittagspause.',
        },
      },
      {
        id: 'mitnehmen',
        kind: 'strategic',
        label: 'Übers Nachbargleis, Gestrandete mitnehmen',
        effects: { satisfaction: -14 },
        outcome: 'Sie fahren über das Nachbargleis und nehmen die Fahrgäste eines liegengebliebenen Zuges mit. Es ist eng, aber es geht weiter.',
        causes: ['ueberfuellung'],
      },
    ],
  },
  {
    id: 'medizinischer-notfall',
    title: 'Medizinischer Notfall',
    tier: 3,
    categories: ['fahrgaeste', 'sicherheit'],
    description:
      'Ein Fahrgast in Wagen 8 braucht ärztliche Hilfe, das Zugteam ist sofort zur Stelle. Kompliziert wird es erst danach: beim Formular „Außerplanmäßiger Halt, medizinisch (Anlage B)“.',
    choices: [
      {
        id: 'halt',
        kind: 'safe',
        label: 'Außerplanmäßig halten, Rettungsdienst rufen',
        effects: { delay: 5, satisfaction: -2 },
        outcome: 'Der Rettungsdienst übernimmt, dem Fahrgast geht es bald besser. Anlage B hat zwölf Seiten. Sie füllen sie mit Hingabe aus.',
      },
      {
        id: 'tierarzt',
        kind: 'risky',
        label: 'Ärztin unter den Fahrgästen helfen lassen und weiterfahren',
        effects: { delay: 1, satisfaction: 4 },
        outcome: 'Eine Ärztin unter den Fahrgästen hilft, am nächsten Halt übernimmt der Rettungsdienst. Die Leitstelle möchte trotzdem wissen, wer das genehmigt hat.',
        risk: {
          chance: 0.3,
          effects: { delay: 8, satisfaction: -16 },
          outcome: 'Sicher ist sicher: Der Rettungsdienst soll übernehmen. Leider hält der Zug an einem „Haltepunkt mit Entwicklungspotenzial“ ohne Zufahrt.',
        },
      },
      {
        id: 'vollgas',
        kind: 'strategic',
        label: 'Mit Höchstgeschwindigkeit zum nächsten Bahnhof',
        effects: { condition: -15 },
        outcome: 'Der Rettungswagen wartet schon am Bahnsteig, alles geht gut. Der Zug dagegen hat jetzt selbst einen Werkstatttermin.',
      },
    ],
  },
  {
    id: 'polizeieinsatz',
    title: 'Polizeieinsatz',
    tier: 3,
    categories: ['sicherheit'],
    description:
      'In Wagen 4 steht ein herrenloser Koffer. Das Protokoll sieht vor: Polizei verständigen. Das Protokoll sieht nicht vor, wie lange das dauert.',
    choices: [
      {
        id: 'raeumen',
        kind: 'safe',
        label: 'Wagen räumen und Polizei abwarten',
        effects: { delay: 6 },
        outcome: 'Die Polizei prüft den Koffer: 40 Butterbrezeln für ein Familienfest. Das Protokoll umfasst trotzdem neun Seiten.',
      },
      {
        id: 'selbst',
        kind: 'risky',
        label: 'Per Durchsage nach dem Besitzer fragen',
        effects: { delay: 1, satisfaction: 3 },
        outcome: 'Nach der zweiten Durchsage meldet sich der Besitzer: 40 Butterbrezeln für ein Familienfest. Er spendiert eine Runde.',
        risk: {
          chance: 0.5,
          effects: { delay: 8, satisfaction: -12 },
          outcome: 'Niemand meldet sich. Jetzt kommt doch die Polizei, und Sie müssen erklären, warum Sie erst gefragt haben. Schriftlich.',
        },
      },
      {
        id: 'sperren',
        kind: 'strategic',
        label: 'Wagen 4 sperren und weiterfahren',
        effects: { satisfaction: -14 },
        outcome: 'Wagen 4 bleibt leer, alle anderen sind voll. Die Polizei steigt am nächsten Halt zu und hat einen ganzen Wagen für sich.',
        causes: ['ueberfuellung'],
      },
    ],
  },
  {
    id: 'unwetter',
    title: 'Unwetter',
    tier: 3,
    categories: ['wetter'],
    description:
      'Sturmtief „Gerlinde“ zieht auf. Der Wetterdienst warnt vor Orkanböen, die Konzernkommunikation vor „wetterbedingten Unregelmäßigkeiten“.',
    choices: [
      {
        id: 'langsam',
        kind: 'safe',
        label: 'Mit 80 km/h weiterfahren',
        effects: { delay: 4, satisfaction: -6 },
        outcome: 'Vorsichtig schlängeln Sie sich durch den Sturm. Draußen fliegt ein Gartenstuhl vorbei.',
      },
      {
        id: 'durch',
        kind: 'risky',
        label: 'Mit voller Geschwindigkeit durch',
        effects: { delay: 1 },
        outcome: 'Sie sind schneller als der Sturm. Die Fahrgäste klatschen, als hätten Sie gerade gelandet.',
        risk: {
          chance: 0.6,
          effects: { delay: 4, condition: -16 },
          outcome: 'Ein Ast erwischt die Frontscheibe, ein zweiter den Stromabnehmer. Weiter geht’s, aber angeschlagen.',
          causes: ['technikschaden'],
        },
      },
      {
        id: 'abwarten',
        kind: 'strategic',
        label: 'Im Bahnhof abwarten und Wartung machen',
        effects: { delay: 8, condition: 10 },
        outcome: 'Der Sturm zieht vorbei, das Team nutzt die Zeit für eine Generalüberholung im Kleinformat.',
        cures: ['technikschaden'],
      },
    ],
  },
  {
    id: 'heisslaeufer',
    title: 'Heißläufer-Alarm',
    tier: 3,
    categories: ['technik', 'sicherheit'],
    description:
      'Die Heißläuferortungsanlage meldet: Achse 7 ist zu warm. Ob das stimmt, klärt eine Prüfung. Ob die Prüfung stimmt, klärt eine zweite Prüfung.',
    choices: [
      {
        id: 'pruefen',
        kind: 'safe',
        label: 'Achse prüfen und kühlen lassen',
        effects: { delay: 5, condition: 3 },
        outcome: 'Der Techniker kühlt die Achse mit Mineralwasser aus dem Bistro. Abgerechnet wird später.',
        cures: ['technikschaden'],
      },
      {
        id: 'fehlalarm',
        kind: 'risky',
        label: 'Als Fehlalarm abtun',
        effects: { condition: -2 },
        outcome: 'Es war tatsächlich ein Fehlalarm. Die Anlage meldet sich für den Rest der Fahrt beleidigt ab.',
        risk: {
          chance: 0.55,
          effects: { delay: 3, condition: -16 },
          outcome: 'Es war kein Fehlalarm. Achse 7 riecht jetzt nach Grillabend.',
          causes: ['technikschaden'],
        },
      },
      {
        id: 'abhaengen',
        kind: 'strategic',
        label: 'Wagen abhängen und verkürzt weiterfahren',
        effects: { satisfaction: -14, condition: 4 },
        outcome: 'Der betroffene Wagen bleibt stehen, seine Fahrgäste nicht. Sie verteilen sich auf den Rest des Zuges.',
        causes: ['ueberfuellung'],
      },
    ],
  },
  {
    id: 'stromausfall',
    title: 'Bordstromausfall',
    tier: 3,
    categories: ['technik'],
    description:
      'Bordstromausfall: Licht aus, Steckdosen tot, die Klimaanlage verabschiedet sich solidarisch. Nur die Ansage „Wir begrüßen Sie an Bord“ läuft in Schleife weiter.',
    choices: [
      {
        id: 'neustart',
        kind: 'safe',
        label: 'Bordnetz neu starten lassen',
        effects: { delay: 4, satisfaction: -4 },
        outcome: 'Nach einem Neustart läuft alles wieder. Auf den Bildschirmen steht kurz „Windows wird aktualisiert“.',
        cures: ['hitze'],
      },
      {
        id: 'notstrom',
        kind: 'risky',
        label: 'Auf Notstrom weiterfahren',
        effects: { delay: 1, satisfaction: -3 },
        outcome: 'Der Notstrom reicht für Licht und Lüftung. Gemütlich ist es trotzdem.',
        risk: {
          chance: 0.5,
          effects: { delay: 2, satisfaction: -10, condition: -10 },
          outcome: 'Der Notstrom reicht für genau eine Leselampe. Es wird warm, dunkel und still.',
          causes: ['hitze'],
        },
      },
      {
        id: 'dunkel',
        kind: 'strategic',
        label: 'Im Dunkeln weiterfahren',
        effects: { satisfaction: -15 },
        outcome: 'Sie machen eine Durchsage mit dem Titel „Romantische Abendfahrt“. Die Fahrgäste schwitzen im Dunkeln.',
        causes: ['hitze'],
      },
    ],
  },
]

/** Folgeereignisse: Sie treten nur auf, wenn ein passendes Problem noch nicht behoben ist. */
export const FOLLOW_UPS: readonly Incident[] = [
  {
    id: 'hitzekollaps',
    title: 'Medizinischer Notfall: Hitzekollaps',
    tier: 3,
    categories: ['fahrgaeste', 'technik'],
    trigger: { status: 'hitze', chance: 0.6 },
    description:
      'In Wagen 7 ist es inzwischen so heiß, dass einem Fahrgast schwindlig wird. Das Zugteam hilft sofort. Die Klimaanlage hilft weiterhin nicht.',
    choices: [
      {
        id: 'halt',
        kind: 'safe',
        label: 'Halten, Rettungsdienst und Techniker rufen',
        effects: { delay: 5 },
        outcome: 'Der Fahrgast wird versorgt und ist bald wieder wohlauf. Der Techniker repariert die Klimaanlage und fragt, warum ihn niemand früher gerufen hat.',
        cures: ['hitze'],
      },
      {
        id: 'wasser',
        kind: 'risky',
        label: 'Wasser verteilen und weiterfahren',
        effects: { delay: 2, satisfaction: 4 },
        outcome: 'Das Bistro verteilt kaltes Wasser, dem Fahrgast geht es schnell besser. Das Wasser wird später als „Kulanzleistung“ verbucht.',
        risk: {
          chance: 0.45,
          effects: { delay: 7, satisfaction: -12 },
          outcome: 'Das Wasser ist schnell alle. Am nächsten Bahnhof wartet sicherheitshalber der Rettungsdienst. Der Fahrplan wartet nicht.',
        },
      },
      {
        id: 'raeumen',
        kind: 'strategic',
        label: 'Wagen 7 räumen, alle ins kühle Bistro',
        effects: { satisfaction: -12 },
        outcome: 'Wagen 7 wird gesperrt. Im Bistro ist es jetzt kühl und sehr, sehr eng. Das Bistro meldet Rekordumsatz bei stillem Wasser.',
        cures: ['hitze'],
        causes: ['ueberfuellung'],
      },
    ],
  },
  {
    id: 'fahrgastkonflikt',
    title: 'Streit im Gang',
    tier: 3,
    categories: ['fahrgaeste', 'sicherheit'],
    trigger: { status: 'ueberfuellung', chance: 0.6 },
    description:
      'Im überfüllten Gang eskaliert ein Streit um einen Klappsitz. Beide Seiten berufen sich auf die Beförderungsbedingungen. Keine Seite hat sie gelesen.',
    choices: [
      {
        id: 'schlichten',
        kind: 'safe',
        label: 'Persönlich schlichten',
        effects: { delay: 3, satisfaction: -5 },
        outcome: 'Sie hören beiden Seiten zu. Am Ende bekommt der Rucksack den Klappsitz.',
      },
      {
        id: 'durchsage',
        kind: 'risky',
        label: 'Durchsage mit Autorität',
        effects: { satisfaction: 4 },
        outcome: 'Ihre Stimme ist so bestimmt, dass alle sich sofort entschuldigen. Auch Leute, die gar nicht beteiligt waren.',
        risk: {
          chance: 0.5,
          effects: { satisfaction: -15 },
          outcome: 'Ihre Durchsage wird ausgebuht. Der Streit hat jetzt zwei Fronten und einen neuen Gegner: Sie.',
          causes: ['erschoepfung'],
        },
      },
      {
        id: 'umsetzen',
        kind: 'strategic',
        label: 'Am nächsten Halt Fahrgäste umsetzen',
        effects: { delay: 7 },
        outcome: 'Sie lassen einen Teil der Fahrgäste in einen Entlastungszug umsteigen. Endlich ist wieder Luft im Gang.',
        cures: ['ueberfuellung'],
      },
    ],
  },
  {
    id: 'antriebsausfall',
    title: 'Antriebsstörung',
    tier: 3,
    categories: ['technik'],
    trigger: { status: 'technikschaden', chance: 0.55 },
    description:
      'Ein Triebwagen meldet sich ab, der Zug fährt nur noch mit halber Kraft. Die Fehlermeldung lautet: „Code 0815 – bitte wenden Sie sich an den Hersteller.“',
    choices: [
      {
        id: 'techniker',
        kind: 'safe',
        label: 'Techniker an Bord holen',
        effects: { delay: 5, condition: 5 },
        outcome: 'Der Techniker findet die Ursache: eine Schraube aus Ihrer letzten Notlösung. Er sagt nichts. Er schaut nur.',
        cures: ['technikschaden'],
      },
      {
        id: 'halbe-kraft',
        kind: 'risky',
        label: 'Mit halber Kraft weiterfahren',
        effects: { delay: 1, condition: -3 },
        outcome: 'Der Zug schleppt sich tapfer weiter, der zweite Triebwagen hält durch.',
        risk: {
          chance: 0.55,
          effects: { delay: 4, condition: -16 },
          outcome: 'Der zweite Triebwagen ist solidarisch und wird ebenfalls heiß. Sie erreichen den nächsten Bahnhof im Schneckentempo.',
          causes: ['technikschaden'],
        },
      },
      {
        id: 'abschalten',
        kind: 'strategic',
        label: 'Defekte Technik abschalten, Klimaanlage inklusive',
        effects: { satisfaction: -12, condition: 4 },
        outcome: 'Ohne Klimaanlage reicht die Kraft wieder. Die Fahrgäste bemerken die Änderung nach etwa vier Minuten.',
        cures: ['technikschaden'],
        causes: ['hitze'],
      },
    ],
  },
  {
    id: 'personalausfall',
    title: 'Personalausfall',
    tier: 3,
    categories: ['personal'],
    trigger: { status: 'erschoepfung', chance: 0.55 },
    description:
      'Ihre Kollegin aus dem Bordbistro meldet sich mit den Worten „Ich kann nicht mehr“ ab und setzt sich in die 1. Klasse. Arbeitsrechtlich einwandfrei.',
    choices: [
      {
        id: 'ersatz',
        kind: 'safe',
        label: 'Ersatzpersonal am nächsten Halt anfordern',
        effects: { delay: 4, satisfaction: -2 },
        outcome: 'Ein ausgeruhtes Team steigt zu. Es hat Kuchen dabei.',
        cures: ['erschoepfung'],
      },
      {
        id: 'selbst',
        kind: 'risky',
        label: 'Alles selbst übernehmen',
        effects: { satisfaction: 4 },
        outcome: 'Sie kontrollieren, kochen Kaffee und machen Durchsagen gleichzeitig. Die Fahrgäste sind beeindruckt.',
        risk: {
          chance: 0.55,
          effects: { delay: 3, satisfaction: -12 },
          outcome: 'Sie verschütten Kaffee auf das Kontrollgerät und sagen den falschen Bahnhof an. Zweimal.',
          causes: ['erschoepfung'],
        },
      },
      {
        id: 'bistro-zu',
        kind: 'strategic',
        label: 'Bistro schließen, Team entlasten',
        effects: { satisfaction: -12 },
        outcome: 'Das Bistro bleibt zu, das Team kommt wieder zu Atem. Die Fahrgäste weniger.',
        cures: ['erschoepfung'],
      },
    ],
  },
]

const incidentsById = new Map([...INCIDENTS, ...FOLLOW_UPS].map((incident) => [incident.id, incident]))

export function getIncident(id: string): Incident | undefined {
  return incidentsById.get(id)
}
