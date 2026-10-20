import type { Category, ExcuseCard } from './types'

export const CATEGORY_LABELS: Record<Category, string> = {
  technik: 'Technik',
  fahrgaeste: 'Fahrgäste',
  infrastruktur: 'Infrastruktur',
  wetter: 'Wetter',
  personal: 'Personal',
  sicherheit: 'Sicherheit',
  betrieb: 'Betrieb',
}

/**
 * Alle Ausreden. Platzhalter in den Ansagen: {station}, {next}, {minutes}, {incident}.
 * Gewöhnliche Karten bilden das Startdeck, seltene und epische kommen über Verbesserungen dazu.
 */
export const EXCUSES: readonly ExcuseCard[] = [
  {
    id: 'betriebsablauf',
    name: 'Verzögerungen im Betriebsablauf',
    rarity: 'common',
    categories: 'all',
    power: 4,
    decay: 0.2,
    templates: [
      'Aufgrund von Verzögerungen im Betriebsablauf erreichen wir {next} voraussichtlich mit {minutes} Minuten Verspätung.',
      'Wegen Verzögerungen im Betriebsablauf verzögert sich unser Betriebsablauf. Weitere Informationen haben wir leider auch nicht.',
      'Grund für die Verzögerung sind Verzögerungen. Im Betriebsablauf. Wir arbeiten an einer genaueren Erklärung.',
      'Unsere Weiterfahrt verzögert sich um wenige Minuten. Die Bedeutung von „wenige“ wird derzeit geprüft.',
    ],
  },
  {
    id: 'verstaendnis',
    name: 'Wir bitten um Verständnis',
    rarity: 'common',
    categories: 'all',
    power: 3,
    decay: 0.15,
    templates: [
      'Wir bitten um Ihr Verständnis. Und um Ihre Geduld. Und, falls vorhanden, um einen Kaffee für das Zugteam.',
      'Für die entstandenen Unannehmlichkeiten bitten wir aufrichtig um Verständnis. Wirklich aufrichtig. Diesmal.',
      'Wir bitten um Verständnis für die aktuelle Situation in {station}, die wir selbst nicht ganz verstehen.',
    ],
  },
  {
    id: 'vorherige-fahrt',
    name: 'Verspätung aus vorheriger Fahrt',
    rarity: 'common',
    categories: ['betrieb', 'personal'],
    power: 4,
    decay: 0.05,
    templates: [
      'Die aktuelle Verspätung stammt noch aus einer vorherigen Fahrt. Diese Fahrt hatte ihre Verspätung ebenfalls aus einer vorherigen Fahrt.',
      'Dieser Zug hat seine Verspätung bereits mitgebracht. Wir haben sie lediglich bis {next} weitergereicht.',
    ],
  },
  {
    id: 'technische-stoerung',
    name: 'Technische Störung',
    rarity: 'common',
    categories: ['technik'],
    power: 6,
    decay: 0.25,
    bonus: { status: 'technikschaden', multiplier: 1.5, label: 'Technischer Mangel macht die Ausrede glaubhafter' },
    templates: [
      'Grund für die Verzögerung ist eine technische Störung am Zug. Die Technik ist informiert. Die Technik ist nicht begeistert.',
      'Aufgrund einer technischen Störung kommt es zu Verzögerungen. Unser Techniker hat schon zweimal kräftig gepustet.',
      'An unserem Zug liegt eine technische Störung vor. Welche genau, wissen wir nach dem dritten Neustart.',
    ],
  },
  {
    id: 'reparatur',
    name: 'Reparatur am Zug',
    rarity: 'common',
    categories: ['technik'],
    power: 5,
    decay: 0.25,
    eases: 'technikschaden',
    templates: [
      'Wir führen eine kurze Reparatur am Zug durch. Bitte erschrecken Sie nicht über Hammergeräusche aus Wagen 4.',
      'Unsere Kollegen reparieren gerade einen Teil des Zuges, den wir vorher gar nicht kannten. Wir bitten um Geduld.',
    ],
  },
  {
    id: 'stellwerk',
    name: 'Störung am Stellwerk',
    rarity: 'common',
    categories: ['infrastruktur', 'betrieb'],
    power: 6,
    decay: 0.25,
    external: true,
    templates: [
      'Grund für die Verzögerung ist eine Störung am Stellwerk {station}. Das Stellwerk entschuldigt sich nicht.',
      'Wegen einer Stellwerksstörung müssen wir auf einen schriftlichen Befehl warten. Der Kugelschreiber ist unterwegs.',
    ],
  },
  {
    id: 'bauarbeiten',
    name: 'Kurzfristige Bauarbeiten',
    rarity: 'common',
    categories: ['infrastruktur', 'betrieb'],
    power: 6,
    decay: 0.3,
    external: true,
    templates: [
      'Aufgrund kurzfristiger Bauarbeiten, die seit 2009 geplant waren, kommt es zu Einschränkungen.',
      'Zwischen {station} und {next} wird gebaut. Was, weiß niemand, aber es wird gründlich gemacht.',
    ],
  },
  {
    id: 'witterung',
    name: 'Witterungsbedingte Einschränkungen',
    rarity: 'common',
    categories: ['wetter', 'infrastruktur', 'technik'],
    power: 6,
    decay: 0.25,
    external: true,
    templates: [
      'Aufgrund der Witterung kommt es zu Einschränkungen. Draußen ist Wetter, und zwar ziemlich viel davon.',
      'Wegen witterungsbedingter Einschränkungen fahren wir vorsichtig. Das Wetter fährt leider nicht mit.',
    ],
  },
  {
    id: 'personal',
    name: 'Kurzfristiger Personalausfall',
    rarity: 'common',
    categories: ['personal', 'betrieb'],
    power: 6,
    decay: 0.25,
    eases: 'erschoepfung',
    templates: [
      'Aufgrund eines kurzfristigen Personalausfalls kommt es zu Verzögerungen. Der Rest des Teams gibt sein Bestes. Es ist nicht viel übrig.',
      'Ein Kollege ist kurzfristig ausgefallen. Wir übernehmen seine Aufgaben, sobald wir herausgefunden haben, was er gemacht hat.',
    ],
  },
  {
    id: 'aufkommen',
    name: 'Hohes Fahrgastaufkommen',
    rarity: 'common',
    categories: ['fahrgaeste', 'betrieb'],
    power: 6,
    decay: 0.25,
    eases: 'ueberfuellung',
    bonus: { status: 'ueberfuellung', multiplier: 1.4, label: 'Die Überfüllung sieht man ja' },
    templates: [
      'Aufgrund des hohen Fahrgastaufkommens verlängert sich der Halt in {station}. Bitte rücken Sie zusammen. Noch etwas mehr. Danke.',
      'Wegen des hohen Fahrgastaufkommens bitten wir Sie, nicht im Gang zu stehen. Wir wissen, dass Sie keine andere Wahl haben.',
    ],
  },
  {
    id: 'vorausfahrender',
    name: 'Verspätung eines vorausfahrenden Zuges',
    rarity: 'common',
    categories: ['betrieb', 'infrastruktur'],
    power: 5,
    decay: 0.15,
    external: true,
    templates: [
      'Wir fahren hinter einem verspäteten Zug. Der fährt hinter einem verspäteten Zug. Ganz vorne fährt vermutlich niemand.',
      'Der vorausfahrende Zug hat Verspätung, weil vor ihm ein Zug Verspätung hat. Die Ursache liegt nach aktuellem Stand irgendwo in Hamburg.',
      'Ein vorausfahrender Zug hat Verspätung. Wir haben uns solidarisch angeschlossen.',
    ],
  },
  {
    id: 'it-stoerung',
    name: 'Störung der IT-Systeme',
    rarity: 'common',
    categories: ['technik', 'betrieb'],
    power: 5,
    decay: 0.25,
    templates: [
      'Aufgrund einer Störung unserer IT-Systeme zeigt die Anzeige Unsinn. Die Durchsage leider auch.',
      'Unsere Systeme werden gerade aktualisiert. Bitte schalten Sie Ihre Erwartungen aus und wieder ein.',
    ],
  },
  {
    id: 'personen-im-gleis',
    name: 'Personen im Gleis',
    rarity: 'rare',
    categories: ['sicherheit', 'infrastruktur'],
    power: 10,
    decay: 0.35,
    external: true,
    bonus: { category: 'sicherheit', multiplier: 1.3, label: 'Sicherheit geht vor, das sieht jeder ein' },
    templates: [
      'Wegen Personen im Gleis zwischen {station} und {next} muss die Strecke gesperrt werden. Ihre Sicherheit hat Vorrang.',
      'Aufgrund von Personen im Gleis verzögert sich die Weiterfahrt. Die Bundespolizei ist vor Ort und sehr gründlich.',
    ],
  },
  {
    id: 'behoerdlich',
    name: 'Behördliche Maßnahmen',
    rarity: 'rare',
    categories: ['sicherheit'],
    power: 11,
    decay: 0.35,
    external: true,
    templates: [
      'Aufgrund behördlicher Maßnahmen verzögert sich unsere Weiterfahrt. Näheres dürfen wir nicht sagen. Wir wissen es auch nicht.',
      'Die Behörden ermitteln. Wir bitten Sie, sitzen zu bleiben und möglichst unverdächtig auszusehen.',
    ],
  },
  {
    id: 'notarzt',
    name: 'Notarzteinsatz am Zug',
    rarity: 'rare',
    categories: ['fahrgaeste', 'sicherheit'],
    power: 10,
    decay: 0.4,
    eases: 'hitze',
    templates: [
      'Aufgrund eines Notarzteinsatzes verzögert sich die Abfahrt. Wir wünschen dem betroffenen Fahrgast gute Besserung.',
      'Aufgrund eines medizinischen Einsatzes verzögert sich die Weiterfahrt. Bitte halten Sie den Gang frei. Die Verspätung wird nachträglich als „unvermeidbar“ verbucht – ausnahmsweise völlig zu Recht.',
    ],
  },
  {
    id: 'tiere',
    name: 'Tiere im Gleis',
    rarity: 'rare',
    categories: ['infrastruktur', 'sicherheit'],
    power: 9,
    decay: 0.35,
    external: true,
    templates: [
      'Aufgrund von Tieren im Gleis verzögert sich die Weiterfahrt. Die Tiere wurden informiert und zeigen sich unbeeindruckt.',
      'Zwischen {station} und {next} befindet sich eine Wildschweinfamilie auf der Strecke. Sie hat Vorfahrt.',
    ],
  },
  {
    id: 'hoehere-gewalt',
    name: 'Höhere Gewalt',
    rarity: 'epic',
    categories: ['wetter', 'infrastruktur'],
    power: 15,
    decay: 0.4,
    external: true,
    mismatchPenalty: 2,
    templates: [
      'Aufgrund höherer Gewalt kommt es zu Verzögerungen. Wir haben uns bei der höheren Gewalt beschwert. Sie hat nicht geantwortet.',
      'Was gerade passiert, liegt außerhalb jeder menschlichen Kontrolle. Insbesondere außerhalb unserer.',
    ],
  },
  {
    id: 'warnstreik',
    name: 'Warnstreik der anderen Gewerkschaft',
    rarity: 'epic',
    categories: ['personal', 'betrieb'],
    power: 13,
    decay: 0.45,
    external: true,
    templates: [
      'Aufgrund eines Warnstreiks einer Gewerkschaft, der wir nicht angehören, kommt es zu Einschränkungen. Wir arbeiten. Trotzdem.',
      'Ein Warnstreik legt Teile des Netzes lahm. Wir möchten betonen: Wir waren es nicht. Diesmal nicht.',
    ],
  },
  {
    id: 'grossstoerung',
    name: 'Bundesweite Großstörung',
    rarity: 'epic',
    categories: 'all',
    power: 9,
    decay: 0.6,
    templates: [
      'Aufgrund einer bundesweiten Großstörung kommt es überall zu Verspätungen. Wir sind also ganz normal unpünktlich.',
      'Derzeit ist das gesamte Netz gestört. Ihre Verspätung ist damit Teil von etwas Größerem.',
    ],
  },
]

const excusesById = new Map(EXCUSES.map((card) => [card.id, card]))

export function getExcuse(id: string): ExcuseCard | undefined {
  return excusesById.get(id)
}

/** Feste Karten im Startdeck; dazu kommen gewöhnliche Karten und eine seltene Karte nach Seed. */
export const STARTING_CORE = ['betriebsablauf', 'betriebsablauf', 'verstaendnis', 'verstaendnis', 'vorherige-fahrt', 'technische-stoerung']
export const STARTING_EXTRA_COMMONS = 3
export const STARTING_EXTRA_RARES = 1

/** Anreden enden mit Doppelpunkt, damit der Kartentext als eigener Satz großgeschrieben beginnen kann. */
export const OPENINGS = [
  'Sehr geehrte Fahrgäste, eine Information zu Ihrer Fahrt:',
  'Meine Damen und Herren, hier spricht Ihr Zugchef:',
  'Liebe Reisende, eine kurze Durchsage:',
  'Verehrte Fahrgäste in {station}, eine wichtige Information:',
]
export const CLOSINGS = [
  'Vielen Dank für Ihr Verständnis.',
  'Ihr PÜNKT-Zugteam bedankt sich für Ihre Geduld.',
  'Wir wünschen Ihnen trotzdem eine angenehme Weiterreise.',
  'Thank you for your patience. Wir meinen das ernst.',
  'Ihre Anschlusszüge entnehmen Sie bitte dem Zufall.',
  'Bei Fragen wenden Sie sich bitte an jemanden, der Bescheid weiß.',
  'Die nächste Durchsage erfolgt, sobald wir selbst mehr wissen. Also eher nicht.',
]

/** Reaktionen, wenn die Ausrede gar nicht passt. */
export const IMPLAUSIBLE_REACTIONS = [
  'Aus Wagen 7 ruft jemand: „Das glauben Sie doch selbst nicht!“',
  'Ein Fahrgast filmt die Durchsage. Für später. Als Beweis.',
  'Gelächter in der 1. Klasse. Kein gutes Gelächter.',
  'Mehrere Fahrgäste schauen gleichzeitig aus dem Fenster und suchen vergeblich nach dem genannten Grund.',
]

/** Reaktionen, wenn eine Ausrede schon mehrfach benutzt wurde. */
export const REPEAT_REACTIONS = [
  'Einige Fahrgäste sprechen die Durchsage inzwischen auswendig mit.',
  'Ein Kind fragt laut: „Mama, warum sagt der das schon wieder?“',
  'Jemand in Wagen 3 hat angefangen, eine Strichliste zu führen.',
]

/** Reaktionen bei einer perfekt passenden Ausrede. */
export const PERFECT_REACTIONS = [
  'Zustimmendes Nicken im ganzen Wagen. Einige schreiben sich die Erklärung auf.',
  'Ein Fahrgast sagt: „Na, wenigstens ehrlich.“',
  'Für einen Moment herrscht so etwas wie Vertrauen.',
]
