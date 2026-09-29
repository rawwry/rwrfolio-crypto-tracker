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

export const APP_VERSION = '0.5.6';

export const CHANGELOG_DATA: ChangelogRelease[] = [
  {
    version: '0.5.6',
    date: '29.09.2026',
    title: 'Smart Import Auto-Detect, Börsen-Vergleich, Coin-Timeline-Overlays & Dashboard Widgets',
    badge: 'Aktuell',
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
