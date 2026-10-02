export interface ChangelogRelease {
  version: string;
  date: string;
  title: string;
  badge?: 'Aktuell' | 'Major' | 'Feature';
  changes: {
    type: 'feat' | 'fix' | 'ui' | 'perf';
    text: string;
  }[];
}

export const APP_VERSION = '0.5.17';

export const CHANGELOG_DATA: ChangelogRelease[] = [
  {
    version: '0.5.17',
    date: '02.10.2026',
    title: 'Korrektur der Gesamt-Portfolio Bewertung & P&L im Analyse-Chart',
    badge: 'Aktuell',
    changes: [
      {
        type: 'fix',
        text: 'Berechnung des Gesamt-Portfoliowerts im Analyse-Chart korrigiert: Behebt einen Rechenfehler, bei dem im Gesamt-Portfolio-Modus fälschlicherweise Einzelpreise ganzer Coins aufsummiert wurden, anstatt jeden Coin mit seinem tatsächlichen Bestand zu multiplizieren. Portfoliowert, Investiertes Kapital und Gewinn/Verlust (P&L) stimmen nun exakt mit den Dashboard-Daten überein.',
      },
    ],
  },
  {
    version: '0.5.16',
    date: '02.10.2026',
    title: 'UI/UX Facelift, Interaktive Coin- & Trade-Charts, Performance-Matrix & Custom Branding',
    changes: [
      {
        type: 'feat',
        text: 'Interaktive Coin-Charts mit Kauf- & Verkauf-Markern: Für jeden beliebigen Coin oder das Gesamt-Portfolio können nun interaktive Charts angezeigt werden. Käufe (grüne Punkte) und Verkäufe (rote Punkte) werden direkt auf der Kurve platziert mit genauen Trade-Details im Tooltip.',
      },
      {
        type: 'feat',
        text: 'Zeitfenster-Switches & Metriken: Schnelle Umschaltung zwischen 24h, 7T, 30T, 90T, 1J und Gesamt-Historie sowie Umschaltung zwischen Einzelkurs, Gesamtwert und P&L.',
      },
      {
        type: 'feat',
        text: 'Coin-Performance Matrix: Übersichtliche tabellarische und mobile Vergleichsmatrix aller Coins mit Allokation, Kapitaleinsatz, Portfoliowert, Ø Kaufkurs (DCA) vs. Live-Marktkurs und 1-Klick Chart-Aktivierung.',
      },
      {
        type: 'ui',
        text: 'Optimaler Kontrast & Lesbarkeit: Kontrastarme blaue Schriften auf dunklem Hintergrund vollständig eliminiert. Optimierte visuelle Hierarchie mit klaren Smaragdgrün- und Korallen-Akzenten und hochauflösender Slate/Weiß-Typografie.',
      },
      {
        type: 'feat',
        text: 'Eigene Touchicons & Logo-Upload in den Einstellungen: Im Bereich "Logo & Touchicon" können individuelle Webapp-Logos sowie Homescreen-Touchicons für iOS, Android und Browser hochgeladen und sofort live angewendet werden.',
      },
      {
        type: 'ui',
        text: 'Neues Pixel-Art Fox-Emblem: Integriert in Navigationsleiste mit subtiler Schwebe- und Rotations-Animation sowie als native Touchicons (180x180, 192x192, 512x512, SVG) und Home Assistant Add-on Icon.',
      },
    ],
  },
  {
    version: '0.5.15',
    date: '01.10.2026',
    title: 'Echtes Multi-Page-Routing, Browser-History (Vor & Zurück) & direkte URL-Unterseiten',
    changes: [
      {
        type: 'feat',
        text: 'URL-Synchronisation für alle Unterseiten: Jede Ansicht besitzt nun eine eigene, direkte URL (/, /transactions, /coins, /analytics, /taxes sowie /settings und /changelog). Lesezeichen, Direktaufrufe und Neuladen (F5) bleiben exakt auf der gewählten Unterseite.',
      },
      {
        type: 'feat',
        text: 'Browser-History Support (Vor & Zurück): Die Vor- und Zurück-Buttons von Webbrowsern (Desktop & Mobil) navigieren nun nahtlos durch den Verlauf der besuchten Ansichten und Unterseiten.',
      },
      {
        type: 'ui',
        text: 'Echte semantische Navigation: Navigations-Tabs und Logo verfügen über echte Links mit Link-Vorschau in der Browser-Statusleiste sowie Rechtsklick-Option ("In neuem Tab öffnen").',
      },
      {
        type: 'ui',
        text: 'Dynamische Browser-Titel: Der Tab-Titel passt sich automatisch an die aktive Unterseite an (z. B. "rwrfolio • Transaktionen", "rwrfolio • Coins", "rwrfolio • Steuern & Haltefristen").',
      },
      {
        type: 'fix',
        text: 'Coin-Filterung in URL verankert: Beim Klick auf einen Coin in den Performance-Karten oder der Coin-Liste wird der Filter direkt in der URL festgehalten (/transactions?coin=BTC).',
      },
    ],
  },
  {
    version: '0.5.14',
    date: '30.09.2026',
    title: 'Querformat für PDF-Belege, vollständige Spalten & scharfe Darstellung ohne Kürzungen',
    changes: [
      {
        type: 'ui',
        text: 'Querformat (A4 Landscape) für Anhänge B & C: Buchungs- und Belegprotokolle werden nun im Querformat ausgegeben. Dadurch steht mit 297 mm Breite maximaler Platz für alle Spalten zur Verfügung.',
      },
      {
        type: 'fix',
        text: 'Keine Kürzungen ("...") mehr: Sämtliche Transaktions-IDs, Hashes, Order-IDs und Ledger-Referenzen werden in voller Länge in präziser Monospace-Schrift ohne Textabschneiden dargestellt.',
      },
      {
        type: 'feat',
        text: 'Vollständige Spalten für Kraken (Anhang B): Dedizierte Spalten für Trade-ID (txid), Order- / PostTx-ID, Ledgers / Ref, Handelspaar, Ordertyp/Art, Volumen, Gegenwert, Kurs EUR und Gebühren.',
      },
      {
        type: 'feat',
        text: 'Vollständige Spalten für Crypto.com (Anhang C): Dedizierte Spalten für Transaktionsart (Kind), Beschreibung, Erhalten, Ausgegeben, Kurs EUR, nativer Gegenwert (USD), Gebühr und Transaktions-Hash.',
      },
      {
        type: 'ui',
        text: 'Optimierte Zeilenpaginierung: 22 Zeilen pro Querformat-Seite für harmonische optische Ausnutzung und lückenlose Seitennummerierung.',
      },
    ],
  },
  {
    version: '0.5.13',
    date: '30.09.2026',
    title: 'Erweiterte Abschnittsabstände, nahtlose Beleg-Paginierung & zentraler PDF-Komplettbericht',
    changes: [
      {
        type: 'ui',
        text: 'Abschnittsabstände vergrößert: Deutlichere visuelle Abgrenzung der Punkte 1 bis 6 durch vergrößerte Abstände (24–28px) und elegante Trennlinien zwischen den Sektionen auf geteilten Seiten.',
      },
      {
        type: 'ui',
        text: 'Moderne Abschnitts-Badges: Markante Squircle-Badges für die Ziffern 1 bis 6 sowie Anhänge B und C mit verbesserter Typografie für erstklassige Erkennbarkeit auf Papier und Monitor.',
      },
      {
        type: 'feat',
        text: 'Zentraler PDF-Komplettbericht: Das PDF enthält nun alle Belege und Buchungsprotokolle vollständig aufbereitet als Anhang B (Kraken) und Anhang C (Crypto.com) mit automatischer Paginierung und globaler Seitenzählung (Seite X von Y). Ein separates Anhängen von CSVs ist nicht mehr erforderlich.',
      },
      {
        type: 'ui',
        text: 'Export-Menü gestrafft: Fokussierung auf den Gesamten Steuerbericht (PDF) inklusive aller aufbereiteter Anlagen sowie den CSV-Bericht für Tabellenkalkulationen.',
      },
    ],
  },
  {
    version: '0.5.12',
    date: '30.09.2026',
    title: 'Steuerbericht-Optimierungen, Beleg-Anhänge (Anhang B & C) & direkte CSV-Belegexporte',
    changes: [
      {
        type: 'feat',
        text: 'Belegnachweise direkt im Steuerbericht (Anhang B & C): Vollständige Buchungsprotokolle für Kraken (Anhang B) und Crypto.com (Anhang C) werden nun direkt an den PDF-Steuerbericht angehängt, inklusive dynamischer Seitenzählung und grüner Bestätigung in Abschnitt 6.',
      },
      {
        type: 'feat',
        text: 'Separate Beleg-Exporte (CSV): Im Export-Menü unter „Steuern“ können die Rohdaten und Buchungsnachweise für Kraken und Crypto.com als eigenständige CSV-Dateien für den Veranlagungszeitraum heruntergeladen werden.',
      },
      {
        type: 'ui',
        text: 'Tabelle Coin-Bestand harmonisiert: Einheitliche einzeilige Spaltenüberschriften ohne Zeilenumbrüche, Umbenennung in „Steuerfrei ab“ und neuer Titel „Coin-Bestand zum [Datum]“ mit korrekter Spaltensummen-Ausrichtung.',
      },
      {
        type: 'ui',
        text: 'Layout-Bereinigung: Zeilenumbruch für nachrichtlich steuerfreie Erlöse auf Seite 1 eingefügt; Vorjahres-Nachweis und Disclaimer-Text auf Seite 4 wunschgemäß entfernt.',
      },
    ],
  },
  {
    version: '0.5.11',
    date: '30.09.2026',
    title: 'Neuer 4-seitiger BMF-Steuerbericht (PDF & CSV) nach Steuerberater-Standard',
    changes: [
      {
        type: 'feat',
        text: 'Umfassender 4-seitiger PDF-Steuerbericht: Vollständige Neugestaltung des Steuerberichts für das Finanzamt und Steuerberater gemäß § 23 Abs. 1 Satz 1 Nr. 2 EStG, § 22 Nr. 3 EStG und aktuellem BMF-Schreiben vom 06.03.2025.',
      },
      {
        type: 'feat',
        text: 'Depotgetrennte FIFO-Berechnung: Getrennte FIFO-Warteschlangen je Börse (Kraken & Crypto.com) mit automatischer Aufteilung von Teillosverkäufen (z. B. Tx 3a, 3b) und exakter anteiliger Zuweisung von Verkaufsgebühren als Werbungskosten.',
      },
      {
        type: 'feat',
        text: 'Anlage SO & Freigrenzen-Logik: Übersichtskarten für private Veräußerungsgeschäfte (§ 23 EStG mit 1.000 € Freigrenze ab VZ 2024) und sonstige Einkünfte (§ 22 Nr. 3 EStG Staking & Rewards mit 256 € Freigrenze), tabellarische Aufschlüsselung nach Börse und Statusanzeige (Entwurf / Final).',
      },
      {
        type: 'feat',
        text: 'Offene Anschaffungstranchen & Stichtagsbestand: Detaillierte Bestandsaufstellung zum 31.12. inkl. Kennzeichnung steuerfreier Coins und Frühest-Freigabedaten sowie Anhang A mit allen offenen Tranchen (IDs K-xx, C-xx) und Anschaffungskosten.',
      },
      {
        type: 'feat',
        text: 'Methodik- & Beleg-Checkliste: Zweispaltige Prüfübersicht zu Crypto-to-Crypto-Swaps, Börsenherkunft, Revisionssicherheit und steuerlichen Rahmenbedingungen.',
      },
      {
        type: 'feat',
        text: 'CSV-Export synchronisiert: Der CSV-Steuerexport liefert nun dieselben 6 strukturierten Sektionen mit deutschen Dezimaltrennern und Semikolons für Excel und Steuersoftware.',
      },
    ],
  },
  {
    version: '0.5.10',
    date: '30.09.2026',
    title: 'Automatische Smartphone/Desktop-Ansichten, Footer-Neugestaltung & Datenverwaltung',
    changes: [
      {
        type: 'ui',
        text: 'Automatische Smartphone- & Desktop-Darstellung: Manueller Umschalter unter „Coins“ und „Transaktionen“ entfernt. Auf Desktop-Browsern erscheint automatisch die vollständige Datentabelle, auf Smartphones die touchoptimierte Raster-Kartenansicht ohne horizontales Wischen.',
      },
      {
        type: 'ui',
        text: 'Footer minimalistisch neugestaltet: Keine Textumbrüche mehr auf mobilen Geräten. Entfernung überflüssiger Buttons und Ziegen-Icons zugunsten einer einzeiligen, aufgeräumten Status- und Changelog-Leiste.',
      },
      {
        type: 'feat',
        text: 'Datenverwaltung in Einstellungen verlegt: CSV-Export, JSON-Komplettbackup und die Sicherheitszone zum Zurücksetzen des Portfolios befinden sich nun geschützt im neuen Einstellungs-Reiter „Daten & Backup“ mit ausführlichen Erklärungen.',
      },
      {
        type: 'ui',
        text: 'Pseudo-Coin-Icons entfernt: Bunte Kürzel-Kästchen in Coin-Listen, Transaktionstabellen, Top-Performern und Steuerübersichten durch klare, hochwertige Typografie ersetzt.',
      },
    ],
  },
  {
    version: '0.5.9',
    date: '30.09.2026',
    title: 'Steuer-ID & Voller Name, Steuerfreigaben-Karten & Menüleisten-Verschlankung',
    changes: [
      {
        type: 'feat',
        text: 'Steuerdaten in Einstellungen: Konfiguration für vollständigen Namen und Steuer-Identifikationsnummer (IdNr), die direkt im offiziellen Steuer-Report (PDF & CSV) ausgewiesen werden.',
      },
      {
        type: 'ui',
        text: 'Steuerfreigaben modernisiert: Die Box „Nächste Steuerfreigaben“ wurde auf eine elegante kartenbasierte Paginierung umgestellt. Kein versteckter Scrollbalken mehr, inklusive 365-Tage-Fortschrittsbalken und Resttage-Countdown.',
      },
      {
        type: 'ui',
        text: 'Menüleiste verschlankt: Ziegen-Icon im Header entfernt (klarer Schriftzug „rwr/folio“) sowie Abmelden-Button aus der Desktop- und mobilen Navigationsleiste entfernt.',
      },
      {
        type: 'fix',
        text: 'Aktionsbutton Erfassung: Korrektur des doppelten Pluszeichens finalisiert und Versions-Release für Home Assistant Addon bereitgestellt.',
      },
    ],
  },
  {
    version: '0.5.8',
    date: '29.09.2026',
    title: 'Coin Allokation 3-Spalten-Raster, Tabellen-Struktur & UI-Feinschliff',
    changes: [
      {
        type: 'ui',
        text: 'Coin Allokation Re-Design: Umbenennung in „Coin Allokation“. Zentrierte Wertanzeige im Donut-Innenkreis statt verdeckender Tooltips sowie Darstellung aller Coins in einem sauberen responsiven 3-Spalten-Raster ohne „Andere“-Kürzung.',
      },
      {
        type: 'ui',
        text: 'Transaktionstabelle aufgeteilt: „Typ“ und „Börse“ in zwei separate Spalten getrennt. „Datum / Zeit“ in „Datum“ und „Erhalten / Asset“ in „Erhalten“ verkürzt.',
      },
      {
        type: 'ui',
        text: 'Dashboard-Bereinigung: Entfernung des überflüssigen Diagramms „Investitions-Entwicklung über Zeit“.',
      },
      {
        type: 'ui',
        text: 'Steuerbereich verfeinert: „FIFO-Prinzip“-Pill entfernt, Umbenennung in „Coins in Haltefrist“ und „Coin Haltedauern & FIFO Bestände“, optimierter Scrollbereich bei „Nächste Steuerfreigaben“ und korrigierte Pfeilposition im Jahres-Dropdown.',
      },
      {
        type: 'fix',
        text: 'Aktionsbutton korrigiert: Doppeltes Plus-Zeichen im Button „Erfassung“ auf der Übersichtsseite behoben.',
      },
    ],
  },
  {
    version: '0.5.7',
    date: '29.09.2026',
    title: 'Klares Dashboard-Layout, Thematische Unterseiten & Vollständige Entrümpelung',
    changes: [
      {
        type: 'ui',
        text: 'Dashboard-Reorganisation: Vereinheitlichte Übersicht mit schlankem Hero-Header, 3 zentralen Portfolio-Kennzahlen (Gesamtwert, Ertrag, Investiert) und klar strukturierter 3-Säulen-Hierarchie.',
      },
      {
        type: 'ui',
        text: 'Entrümpelung redundanter KPI-Boxen: Die 4 generischen Top-Boxen wurden von den Unterseiten (Coins, Transaktionen, Analyse, Steuern) entfernt. Die überflüssige Box „Assets & Diversifizierung“ wurde komplett eliminiert.',
      },
      {
        type: 'ui',
        text: 'Thematisch gestalteter Steuerbereich: Schlanker Steuer-Kopf mit direkt integriertem Steuerjahr-Wechsler, Export-Dropdown (PDF/CSV) und 3 fokussierten Haltefrist- & Gewinn-Karten (§ 23 EStG).',
      },
      {
        type: 'ui',
        text: 'Verständliche Begriffe & DCA-Entfernung: Technische Fachbegriffe wie „DCA“ wurden überall durch selbsterklärende Bezeichnungen wie „Ø Kaufkurs“ und „Investiertes Kapital“ ersetzt.',
      },
      {
        type: 'ui',
        text: 'Kompakte Tabellenspalten: „Eingezahlt / Ausgegeben“ in „Kauf / Verkauf“ umbenannt, zweizeiliges Datums- & Uhrzeitformat und Bereinigung von überflüssigen Texten in Transaktionslisten.',
      },
      {
        type: 'ui',
        text: 'Aktionsbuttons & Menü-Verschlankung: Buttons unter Transaktionen in „Import“ und „Erfassung“ umbenannt, manueller Live-Kurse-Button und Währungsumschalter aus dem Hauptmenü entfernt (Währung jetzt aufgeräumt in den Einstellungen).',
      },
    ],
  },
  {
    version: '0.5.6',
    date: '29.09.2026',
    title: 'Smart Import Auto-Detect, Börsen-Vergleich, Coin-Timeline-Overlays & Dashboard Widgets',
    changes: [
      {
        type: 'feat',
        text: 'Smart Auto-Detect Import: CSV & PDF können nun ohne vorherige Börsenauswahl per Drag & Drop importiert werden. Automatische Erkennung von Kraken Pro vs. Crypto.com mit Rückfrage bei Unklarheiten (Binance komplett entfernt).',
      },
      {
        type: 'feat',
        text: 'Börsen-Vergleich (Kraken Pro vs. Crypto.com): Neuer Analyse-Bereich mit Gegenüberstellung von Portfoliowert, DCA-Erfolg, Kapitalallokation und Rendite.',
      },
      {
        type: 'feat',
        text: 'Dashboard-Widgets: Top Gainer & Top Loser Quick-Cards, Crypto Fear & Greed Index Widget (Alternative.me Live-Sentiment & DCA-Tipps) und Quick-Action Bar auf der Startseite.',
      },
      {
        type: 'feat',
        text: 'Coin-Timeline-Overlays: Im Portfolio-Verlaufschart können nun einzelne Coin-Verlaufskurven flexibel ein- und ausgeblendet werden.',
      },
      {
        type: 'ui',
        text: 'Optimierte Coin-Tabelle: Schlankes Layout ohne horizontales Scrollen auf Desktop.',
      },
      {
        type: 'ui',
        text: 'Steuerbericht Export: Schlanker Einzelbutton mit Dropdown zur Auswahl von PDF und CSV.',
      },
      {
        type: 'ui',
        text: 'Ausbalancierte Asset-Allokation: Entfernung von Scrollbalken und exakte Höhenanpassung im Dashboard.',
      },
    ],
  },
  {
    version: '0.5.5',
    date: '29.09.2026',
    title: 'Fokus-Dashboard, Sortierfunktion in der Coin-Tabelle & Überarbeitete Analyse-Kacheln',
    changes: [
      {
        type: 'ui',
        text: 'Aufgeräumte Übersicht (Dashboard): Redundante Duplikate der DCA-Asset-Tabelle und der Transaktionshistorie entfernt – der Fokus liegt nun klar auf Portfolio-KPIs und Wertverlauf-Charts.',
      },
      {
        type: 'ui',
        text: 'Menü & Bezeichnungen: Reiter „Assets“ in „Coins“ umbenannt, Tabelle in „Coinübersicht & Durchschnittskurse (DCA)“ umbenannt.',
      },
      {
        type: 'feat',
        text: 'Interaktive Sortierung: Spalten der Coin-Tabelle lassen sich per Klick vorwärts und rückwärts sortieren (Name, Bestand, Ø Kaufkurs, Marktkurs, Investition, Wert, Gewinn/Verlust, Portfolio-Anteil).',
      },
      {
        type: 'ui',
        text: 'Schlankere Tabelle: Die Spalte „Details“ wurde entfernt – die Transaktionsfilterung ist nun direkt durch Klick auf die Transaktionsanzahl unter dem Coinnamen erreichbar.',
      },
      {
        type: 'ui',
        text: 'Neugestaltung der Analyse-Kacheln: Eigener Bereichskopf mit Filter- und Sortieroptionen sowie verbesserte Wertanordnung mit direktem DCA-zu-Marktpreis-Vergleich.',
      },
    ],
  },
  {
    version: '0.5.4',
    date: '29.09.2026',
    title: 'Light Theme Diagramme & Tabellen, Steuerbericht (PDF) & Bereinigung von Fiat-Transaktionen',
    changes: [
      {
        type: 'ui',
        text: 'Vollständiges Light-Theme für alle Charts & Tabellen: Tortendiagramm, Timeline-Chart, Transaktionstabelle, KPI-Karten und Modals passen sich nahtlos dem hellen Farbschema an.',
      },
      {
        type: 'ui',
        text: 'Typografie: Einheitliches Leerzeichen vor dem Prozentzeichen (z. B. "+22,04 %") im gesamten Dashboard.',
      },
      {
        type: 'ui',
        text: 'Navigation: Das Steuermenü lautet nun schlicht und aufgeräumt „Steuern“ (ohne Icon und ohne Fifo-Klammerzusatz).',
      },
      {
        type: 'fix',
        text: 'Automatische Filterung reiner Fiat-Transaktionen (EUR, USD, ZEUR, SEPA-Einzahlungen, Kartentransfers): Verhindert „UNKNOWN“-Platzhalter in der Asset- und DCA-Tabelle.',
      },
      {
        type: 'feat',
        text: 'Professioneller Steuerbericht-Export als PDF: Druckfertige, hochauflösende Übersicht für Steuerberater oder Finanzamt mit FIFO-Haltefristen (§ 23 EStG), Freigrenzen und Einzeltranchen.',
      },
    ],
  },
  {
    version: '0.5.3',
    date: '29.09.2026',
    title: 'Kraken Live-Kurse & Exakte Rendite-Berechnung (UP&L) für Kraken Pro Assets',
    changes: [
      {
        type: 'feat',
        text: 'Direkte Anbindung an die offizielle Kraken Public Ticker API: Live-Spot-Preise für alle Kraken-Handelspaare (u.a. MLN, LINK, DOGE und Meme-Coins wie LAPTOP/USD) werden in Echtzeit sekundengenau synchronisiert.',
      },
      {
        type: 'fix',
        text: 'Behebung drastisch abweichender Prozentwerte (UP&L): Krypto-Assets wie LAPTOP (zuvor 0 € / -100%) und MLN (zuvor abweichender Fremdbörsenkurs) erhalten nun die identischen Marktkurse wie auf der Kraken Pro Plattform.',
      },
      {
        type: 'feat',
        text: 'Erweiterte Standard-Asset-Definitionen für Enzyme Finance (MLN) und Hunter Biden’s Laptop (LAPTOP) inklusive automatischer EUR/USD-Wechselkursberechnung.',
      },
    ],
  },
  {
    version: '0.5.2',
    date: '29.09.2026',
    title: 'Konsistente Rechtsbündigkeit aller Zahlenwerte in der Asset-Übersicht',
    badge: 'Aktuell',
    changes: [
      {
        type: 'ui',
        text: 'Rechtsbündige Ausrichtung aller Zahlen- und Prozentwerte (Bestand, Ø Kaufkurs, aktueller Kurs, investierter Betrag, aktueller Wert, Gewinn/Verlust, Portfolio-Anteil).',
      },
      {
        type: 'ui',
        text: 'Asset- & Coin-Bezeichnungen in der ersten Spalte bleiben konsistent linksbündig.',
      },
    ],
  },
  {
    version: '0.5.1',
    date: '28.09.2026',
    title: 'Portfolio-Wertverlauf, Steuerbalken-Ausrichtung & Mobile Quick-Check',
    badge: 'Aktuell',
    changes: [
      {
        type: 'feat',
        text: 'Neues Modul unter „Analysen“: Visualisierung der Portfolio-Gesamtbewertung über die Zeit im Liniendiagramm inklusive Investitionspfad, Renditekurve und Zeitraum-Filtern (Alles, 6M, 3M, 30T).',
      },
      {
        type: 'ui',
        text: 'Perfekt ausgerichtete Haltefristen-Balken unter „Steuern (FIFO)“ durch festes 12-Spalten-Raster ohne Versatz.',
      },
      {
        type: 'ui',
        text: 'Asset-Übersicht & Durchschnittskurse beruhigt: Einheitliche einzeilige Spaltenköpfe mit konsistenter Rechtsbündigkeit aller Zahlenwerte.',
      },
      {
        type: 'ui',
        text: 'Mobile Quick-Check Kartenansicht: Auf dem Smartphone sind aktueller Gesamtwert und Gewinn/Verlust (+% / +€) sofort ohne horizontales Wischen auf den ersten Blick sichtbar.',
      },
    ],
  },
  {
    version: '0.5.0',
    date: '28.09.2026',
    title: 'Kraken Pro CSV & PDF Import Unterstützung',
    changes: [
      {
        type: 'feat',
        text: 'Vollständige Unterstützung für Kraken Pro Spot-Trades: Importiere Trades direkt als CSV-Export oder als PDF-Kontoauszug.',
      },
      {
        type: 'feat',
        text: 'Server-gestützte PDF-Textextraktion mit automatischer Erkennung von Handelspaaren (z.B. XXBTZEUR, BTC/EUR, POL/EUR, HBAR/EUR, AKT/EUR, DOT/EUR), Stückpreisen, Kosten und Gebühren.',
      },
      {
        type: 'feat',
        text: 'Nahtlose Duplikatserkennung: Enthält ein PDF dieselben Trades wie ein CSV-Export, werden Duplikate automatisch erkannt und sicher übersprungen.',
      },
      {
        type: 'ui',
        text: 'Erweiterter Import-Dialog mit dediziertem Kraken-Tab, Drag & Drop für CSV & PDF, Beispieldaten-Ladern und neuem Börsen-Filter in der Transaktionsübersicht.',
      },
    ],
  },
  {
    version: '0.4.1',
    date: '01.09.2026',
    title: 'Steuer-Berechnung (FIFO) & Interface-Bereinigung',
    changes: [
      {
        type: 'feat',
        text: 'Steuer- & Haltedauer-Rechner (FIFO § 23 EStG): Detaillierte Haltefristen (365 Tage), steuerfreie Tranchen und Export für die Steuererklärung.',
      },
      {
        type: 'ui',
        text: 'Branding auf rwr/folio angepasst und Menüleiste bereinigt.',
      },
      {
        type: 'ui',
        text: 'Analysen-Ansicht auf Kern-Charts und Asset-Details fokussiert.',
      },
    ],
  },
  {
    version: '0.4.0',
    date: '01.09.2026',
    title: 'Einstellungen, Light & Dark Mode, E-Mail Alarme & GitHub Audit',
    changes: [
      {
        type: 'feat',
        text: 'Neues Einstellungsmenü mit Benutzerprofil (Benutzername, E-Mail und optionaler lokaler Passwortschutz).',
      },
      {
        type: 'ui',
        text: 'Vollständiger Hell- & Dunkelmodus (Light & Dark Theme) inklusive Diskretionsmodus zum Ausblenden von Beträgen.',
      },
      {
        type: 'feat',
        text: 'E-Mail & SMTP Benachrichtigungskonfiguration für Preisalarme und tägliche Portfolioberichte inklusive Test-E-Mail Funktion.',
      },
      {
        type: 'feat',
        text: 'GitHub Privacy Audit & Schutz: .gitignore optimiert, sodass keine privaten Datenbanken (*.db), CSVs oder Schlüssel im öffentlichen GitHub-Repo landen.',
      },
    ],
  },
  {
    version: '0.3.0',
    date: '01.09.2026',
    title: 'Samba-Share Integration (/share/rwrfolio)',
    changes: [
      {
        type: 'feat',
        text: 'Dauerhafte SQLite-Datenbank wird standardmäßig im Home Assistant Samba-Share unter /share/rwrfolio/db/rwrfolio.db gespeichert.',
      },
      {
        type: 'feat',
        text: 'Automatisches CSV-Archiv: Alle importierten CSV-Dateien (z. B. Crypto.com Exporte) werden mit Zeitstempel im Samba-Share unter /share/rwrfolio/imported/ abgelegt.',
      },
      {
        type: 'feat',
        text: 'Home Assistant Add-on Berechtigungen um map: - share:rw erweitert, inklusive automatischer Ordner-Erstellung und Migrationsroutine.',
      },
    ],
  },
  {
    version: '0.2.1',
    date: '01.09.2026',
    title: 'Typografie & Layout Feinschliff',
    changes: [
      {
        type: 'ui',
        text: 'Layout-Fix bei langen Asset-Namen: Einzeiliges Wrapping verhindert Zeilensprünge bei Kryptowährungen mit langen Bezeichnungen, inkl. Tooltip beim Hovern.',
      },
      {
        type: 'ui',
        text: 'Gewinn/Verlust Spalte optimiert: Prozentuale Rendite steht nun prominent oben, der absolute Euro-Betrag dezent darunter.',
      },
    ],
  },
  {
    version: '0.2.0',
    date: '01.09.2026',
    title: 'SQLite-Datenbank & Home Assistant OS Add-on',
    badge: 'Feature',
    changes: [
      {
        type: 'feat',
        text: 'Vollständige SQLite-Datenbankpersistenz für unbegrenzten Datenerhalt auch bei Neustarts und Container-Updates.',
      },
      {
        type: 'feat',
        text: 'Home Assistant OS Add-on Konfiguration (config.yaml, Dockerfile, Ingress Support für die Seitenleiste).',
      },
      {
        type: 'feat',
        text: 'Echtzeit-Synchronisation zwischen Frontend und lokalem Express/SQLite Backend mit Statusindikator in der Navigation.',
      },
    ],
  },
  {
    version: '0.1.0',
    date: '31.08.2026',
    title: 'Initialer Release: Krypto DCA & Portfolio Tracker',
    changes: [
      {
        type: 'feat',
        text: 'Automatischer Import von Crypto.com CSV-Transaktionsexporten mit Erkennung von Kauf, Verkauf, Staking Rewards und Cashbacks.',
      },
      {
        type: 'feat',
        text: 'DCA-Durchschnittskaufpreis-Berechnung und Echtzeit-Portfolio-Kennzahlen.',
      },
      {
        type: 'feat',
        text: 'Live-Kursabfrage über Krypto-APIs mit automatischem Fallback und manueller Kursanpassung.',
      },
      {
        type: 'feat',
        text: 'Interaktive Allokations- und Rendite-Charts sowie CSV/JSON Backup-Export.',
      },
    ],
  },
];
