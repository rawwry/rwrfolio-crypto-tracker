# Changelog

Alle wichtigen Änderungen und Versionssprünge von **rwrfolio** werden in dieser Datei dokumentiert.

---

## [0.5.27] - 05.10.2026

### ✨ Neue Features
- **Kraken E-Mail Kaufbeleg-Import (PDF & Text)**:
  - Vollständige Unterstützung für gespeicherte Kraken-Kaufbestätigungs-E-Mails (z. B. *"You bought ONDO"*, *"Du hast ONDO gekauft"*).
  - Der Parser extrahiert sekundengenau Asset (ONDO, BTC etc.), Kaufvolumen, Fiat-Gesamtbetrag, Ausführungskurs, Gebühren, Transaktions-ID und Zeitstempel aus PDF-Ausdrucken oder direkt eingefügtem Text.
- **Smart Auto-Detection & Archivierung**:
  - E-Mail-Belege werden beim Drag & Drop automatisch als "Kraken E-Mail Beleg" klassifiziert, dedupliziert und im Samba-Share (`/share/rwrfolio/imported/`) manipulationssicher archiviert.
- **Demo-Button für E-Mail-Belege**:
  - Neuer Schnelltest-Button `[Kraken E-Mail]` im Import-Modal zur sofortigen Vorschau und Funktionsprüfung mit echten Kaufbelegdaten.

---

## [0.5.26] - 04.10.2026

### ✨ Neue Features
- **Interaktiver Vollbildmodus (Fullscreen)**:
  - Neuer Vollbild-Schalter `[ ⛶ Vollbild ]` in der Kopfzeile und der Chart-Toolbar.
  - Ermöglicht maximale Übersicht im Stil professioneller TradingView Pro Ansichten mit erweiterter Zeichenflächenhöhe (`58vh`).
  - Schnelles Schließen jederzeit über den Button `[ ✕ Vollbild beenden ]` oder per Tastatur mit der `Escape`-Taste.
  - Nahtloser Erhalt aller eingestellten Indikatoren (SMA, Bollinger Bänder, ATH, RSI) und Zeitfenster ohne Reload.

### 🐛 Bugfixes & Verbesserungen
- **Zuverlässige Live-Hover-Inspektion wiederhergestellt**:
  - Die Datenaktualisierung beim Bewegen der Maus über die Kurve wurde wiederhergestellt. Sowohl das kopfseitig verankerte Live-HUD als auch die integrierte Statusleiste aktualisieren Datum, Kurs, Depotwert, P&L, Einstiegsabstand und Trades synchron in Echtzeit.
- **Blaue Fokus-Auswahlrahmen beim Klick eliminiert**:
  - Unerwünschte Browser-Auswahlrahmen und blaue Fokusringe beim Anklicken der Recharts SVG-Zeichenfläche wurden im gesamten Chartbereich vollständig entfernt.

---

## [0.5.25] - 04.10.2026

### ✨ Neue Features & Indikatoren
- **Fest im Diagrammbereich verankertes Live-HUD (Verdeckungs- & Schwebefix)**:
  - Die Punkt- und Trade-Inspektion folgt nicht mehr dem Mauszeiger als störendes Popup, sondern ist als festes Ribbon direkt über der Zeichenfläche verankert.
  - Im Ruhezustand wird der aktuelle Live-Stand dargestellt; bei Mausbewegung aktualisiert sich die Anzeige verzögerungsfrei auf den jeweiligen Punkt (Datum, Kurs, Depotwert, P&L, Abstand zum Ø Kaufkurs und ausgeführte Käufe/Verkäufe).
  - Volle Sicht auf die Marktkurve und Trade-Pins ohne jegliche Verdeckung von Bedienelementen. Der separate Cursor-Popup Schalter wurde überflüssig und entfernt.
- **Bollinger Bänder (20, 2σ)**:
  - Neues technisches Chart-Overlay visualisiert den dynamischen Volatilitäts-Korridor und identifiziert überkaufte sowie überverkaufte Zonen (DCA Dip-Kaufgelegenheiten).
- **Allzeithoch (ATH) Referenzlinie**:
  - Horizontale Orientierungslinie am Zyklus- bzw. Periodenhöchststand mit automatischer Echtzeit-Berechnung des Rabattabstands (`-X % vom ATH`).
- **Synchronisierter RSI (14) Momentum-Oszillator**:
  - Zuschaltbares Mini-Panel unter dem Chart mit automatischer Markierung von überverkauften Akkumulationszonen (&le; 30) und überhitzten Zonen (&ge; 70).

### 🐛 Bugfixes & Layout
- **Layout-Shift in der Performance-Matrix behoben**:
  - Beim Wechseln des Beobachtungszeitraums in der Coin-Performance-Matrix bleibt die Zeile mit den Zeitfenster-Buttons vollkommen stabil. Der Ladehinweis wurde in den Untertitel verlegt, wodurch jeglicher Umbruch oder Versatz eliminiert wird.

---

## [0.5.24] - 04.10.2026

### ✨ Neue Features & Verbesserungen
- **Multi-Timeframe Umschalter in Coin-Performance Matrix**:
  - Neue intuitive Zeitfenster-Auswahl (**24h**, **7T**, **30T**, **90T**, **1J** und **Gesamt**) direkt in der Kopfzeile der Performance-Matrix.
  - Dynamischer Wechsel zwischen All-Time DCA-Ergebnis und periodenspezifischer Performance.
  - Anzeige sowohl der **relativen Kursrendite** (`+X.XX %`) als auch der **absoluten Depotwert-Veränderung** (`+XX,XX € / $`) der gehaltenen Coin-Position.
  - Dynamische Sortierung nach Rendite des aktuell ausgewählten Zeitfensters.
  - Nahtlose Aktualisierung der mobilen Kartenansicht inklusive Zeitfenster-Badges.
- **Cursor-Popup Schalter (`[💬 Cursor-Popup]`)**:
  - Neuer Schalter in der Chart-Toolbar, mit dem das schwebende Maus-Popup ein- oder ausgeschaltet werden kann.
  - Standardmäßig deaktiviert für freie, unverdeckte Sicht auf die Marktkurve und Trade-Pins.

### 🐛 Bugfixes & UX
- **Tooltip Fly-in Animation behoben**:
  - Das störende Hereinfliegen des Chart-Popups von der linken Bildschirmkante beim Bewegen der Maus über das Diagramm wurde vollständig beseitigt (`isAnimationActive={false}`, `animationDuration={0}`).
  - Feste **Live-Hover-Inspektionsleiste** direkt über dem Chart: Zeigt Datum, Kurs, Depotwert, Gewinn/Verlust und ausgeführte Trades in Echtzeit an, ohne die Kurve oder Bedienelemente zu überlagern.
- **Home Assistant Dokumentation & Changelog**:
  - Hinzufügen von `CHANGELOG.md` und `DOCS.md` zur direkten Anzeige im Home Assistant Supervisor (Reiter *Dokumentation* und *Changelog*).

---

## [0.5.23] - 04.10.2026

### 🎨 UI & Layout
- **Einzeilige Bestandsanzeige in der Coin-Übersicht**:
  - Spalte „Bestand“ bereinigt: Die zweite Zeile mit dem Währungscode wurde entfernt. Der Coin-Bestand wird nun sauber, kompakt und platzsparend als einzeilige Zahl dargestellt.

---

## [0.5.22] - 03.10.2026

### ✨ Features
- **TradingView-Style Trade-Pins**:
  - Kauf- und Verkaufszeitpunkte werden im Diagramm mit modernen Badges (▲ KAUF / ▼ VERK.), vertikalen Drop-Lines und dezenten Glow-Halos visualisiert.
  - Klick auf einen Pin fokussiert die Tranche direkt im neuen Inspektor.
- **Horizontale DCA-Referenzlinie (Ø Kaufkurs)**:
  - Blendet den persönlichen durchschnittlichen Kaufkurs als gestrichelte Orientierungslinie mit dynamischer Abstands-Prozentanzeige (`+X %` zum Einstieg) direkt im Kursverlauf ein.
- **Interaktive Chart-Overlays Toolbar**:
  - Schnellwahlschalter über dem Diagramm zum Ein- und Ausblenden von Ø Kaufkurs, Trade-Pins, Perioden-Höchst-/Tiefstständen (Hoch / Tief) sowie 20-Perioden Trendlinie (SMA).
- **Tranchen- & Steuer-Inspektor (§ 23 EStG)**:
  - Detaillierte Auswertung jeder einzelnen Kauf-Tranche mit Kaufkurs, aktuellem Gegenwert, Tranchen-Gewinn/Verlust (%) sowie Haltedauer mit Countdown bis zur 1-jährigen deutschen Steuerfreiheit.
- **Tranchen-Timeline-Ribbon**:
  - Horizontale Klick-Karten unter dem Chart zum schnellen Durchstöbern und Fokussieren einzelner Trades der gewählten Periode.

---

## [0.5.21] - 03.10.2026

### ✨ Features & UI
- **Echte historische Börsen-Marktkurse für Coin-Charts**:
  - Direkte Integration von historischen Marktdaten von Binance & Kraken für BTC, ETH, SOL, DOT, HBAR, AKT, POL und alle weiteren Assets.
  - Echter historischer Kursverlauf mit darauf platzierten Käufen (grüne Punkte) und Verkäufen (rote Punkte).
- **Doppelte Coin-Kürzel-Boxen entfernt**:
  - Redundante quadratische Boxen mit Wiederholungen in der Coin-Performance-Matrix wurden durch dezente vertikale Brand-Farbakzente ersetzt.
- **Fokus auf Einzel-Coins in der Analyse**:
  - Startet direkt mit dem Chart des führenden Coins (z. B. BTC) und seinen konkreten Trades. Gesamt-Portfolio als separate Option wählbar.

---

## [0.5.20] - 03.10.2026

### 🐛 Bugfixes & Feinschliff
- **Kurs- und Bestandsskalierung bei Micro-Cent-Coins behoben**:
  - Präzise Erfassung von Coins mit Stückpreisen unter 0,005 € (CELR, SHIB, PEPE) mit bis zu 8 Dezimalstellen.
- **Dynamische Y-Achsen-Skalierung**:
  - Automatisches Padding und flexibler Tick-Formatter verhindern Ganzzahlscheiben bei Sub-Cent-Kursen.
- **Verlust- und Profit-Signalgebung korrigiert**:
  - Bei 0,00 % Kursverlauf im Zeitfenster orientiert sich die Farbe am Gesamtergebnis der Position (P&L). Verlustpositionen erhalten rote Chartlinie (#f43f5e).
- **Asset-Katalog erweitert**:
  - CELR, ONDO, PEPE und FLOKI zu KNOWN_COINS hinzugefügt.

---

## [0.5.19] - 03.10.2026

### 🐛 Bugfixes
- **Hotfix: Gesamt-Portfolio Chartbewertung & Multi-Coin Isolation**:
  - Behebt einen Zuordnungsfehler, bei dem Kauf-Transaktionen als Kurs-Anker auf alle anderen Coins im Portfolio übertragen wurden. Strikte Isolierung stellt realistische Kurven und Renditen sicher.

---

## [0.5.18] - 03.10.2026

### ✨ Features & UI
- **Stetige Chart-Interpolation**:
  - Stückweise stetige Interpolation eliminiert künstliche V-Zacken an Transaktionstagen.
- **Y-Achsen Zahlen-Abschneidung behoben**:
  - Breiten- und Randabstand-Optimierung verhindert das Abschneiden führender Ziffern.
- **Analyse Matrix**:
  - Sämtliche Chart-Buttons entfernt; Zeilen und Kacheln sind nun komplett klickbar.
- **Coin-Allokation Facelift**:
  - Kompaktes Redesign mit Umschalter zwischen Marktwert und Investition, Konzentrations-Kennzahlen (Top 1, Top 3) und Werttreibern.
- **Farbunterscheidung Börsen**:
  - Kraken in Royal Purple, Crypto.com in Electric Cyan für optimale optische Trennung.
- **Farb-Themen (Color Themes)**:
  - Midnight Slate, OLED Pure Black (#000000), Cyber Emerald, Nordic Cyan und Amber Gold in den Einstellungen wählbar.

---

## [0.5.17] - 02.10.2026

### 🐛 Bugfixes
- **Korrektur Gesamt-Portfolio Bewertung**:
  - Rechenfehler behoben, bei dem Einzelpreise statt bestandsgewichtete Werte addiert wurden.

---

## [0.5.16] - 02.10.2026

### ✨ Features & UI
- **Interaktive Coin-Charts mit Kauf- & Verkauf-Markern**:
  - Visualisierung von Käufen (grün) und Verkäufen (rot) direkt auf der Preiskurve.
- **Zeitfenster-Switches & Metriken**:
  - Umschaltung zwischen 24h, 7T, 30T, 90T, 1J und Gesamt.
- **Optimaler Kontrast & Lesbarkeit**:
  - Beseitigung kontrastarmer blauer Schriften auf dunklem Hintergrund; moderne Slate-Typografie.
- **Eigene Touchicons & Logo-Upload**:
  - Individuelle Webapp-Logos und Homescreen-Touchicons in den Einstellungen hochladbar.
- **Neues Fox-Emblem**:
  - Feines Emblem in der Navigationsleiste, native Touchicons und Home Assistant Icon.

---

## [0.5.15] - 01.10.2026

### ✨ Features & Navigation
- **Echtes Multi-Page-Routing**:
  - Direkte URLs (`/`, `/transactions`, `/coins`, `/analytics`, `/taxes`, `/settings`, `/changelog`).
- **Browser-History Support (Vor & Zurück)**:
  - Nahtlose Navigation mit den Browser-Buttons auf Desktop und Mobilgeräten.
- **Dynamische Browser-Titel & Semantische Links**:
  - Tabs aktualisieren Seitentitel automatisch, Link-Vorschau in der Browser-Statusleiste.

---

## [0.5.14] - 30.09.2026

### 📄 Steuerbericht & PDF
- **Querformat (A4 Landscape) für Anhänge B & C**:
  - Volle 297 mm Breite für lückenlose Darstellung aller Buchungs- und Belegspalten.
- **Keine Kürzungen mehr**:
  - Transaktions-IDs, Hashes, Order-IDs und Referenzen werden ungekürzt in Monospace-Schrift gedruckt.
- **Detaillierte Spalten für Kraken (Anhang B) & Crypto.com (Anhang C)**.

---

## [0.5.13] - 30.09.2026

### 📄 PDF & Belege
- **Zentraler PDF-Komplettbericht**:
  - Enthält alle Belege und Buchungsprotokolle vollständig aufbereitet mit automatischer Gesamtpaginierung („Seite X von Y“).
- **Moderne Abschnitts-Badges & vergrößerte Abstände** für erstklassige Lesbarkeit.

---

## [0.5.12] - 30.09.2026

### 📄 Steuern & Exporte
- **Belegnachweise direkt im Steuerbericht (Anhang B & C)**.
- **Separate CSV-Belegexporte** für Kraken und Crypto.com im Steuerbereich.
- **Harmonisierung der Coin-Bestandstabelle** mit Spalte „Steuerfrei ab“.

---

## [0.5.11] - 30.09.2026

### 📄 BMF-Steuerbericht (§ 23 EStG)
- **4-seitiger BMF-Steuerbericht (PDF & CSV)**:
  - Entspricht den Anforderungen des Bundesfinanzministeriums (BMF-Schreiben vom 06.03.2025).
- **Depotgetrennte FIFO-Berechnung** je Börse mit anteiliger Berücksichtigung von Gebühren als Werbungskosten.
- **Anlage SO & Freigrenzen-Logik** (1.000 € Freigrenze nach § 23 EStG, 256 € für Rewards nach § 22 Nr. 3 EStG).
- **Offene Anschaffungstranchen & Stichtagsbestand** zum 31.12.

---

## [0.5.10] - 30.09.2026

### 🎨 UI & Layout
- **Automatische Erkennung Desktop vs. Smartphone**:
  - Automatische Umschaltung zwischen vollständiger Datentabelle und kompakter Touch-Kartenansicht.
- **Minimalistischer Footer**:
  - Einzeilige, aufgeräumte Statusleiste ohne überflüssige Umbrüche.
- **Datenverwaltung in Einstellungen verlegt** (CSV-Export, JSON-Backup, Datenbank-Reset).

---

## [0.5.9] - 30.09.2026

### ✨ Features
- **Steuer-ID & Name in den Einstellungen** für automatischen Eindruck in offizielle Steuerberichte.
- **Kartenbasierte Paginierung für nächste Steuerfreigaben** mit 365-Tage-Fortschrittsbalken.

---

## [0.5.8] - 29.09.2026

### 🎨 UI & Dashboard
- **Coin-Allokation 3-Spalten-Raster** mit zentrierter Wertanzeige im Donut-Innenkreis.
- **Transaktionstabelle aufgeteilt** in getrennte Spalten für Typ und Börse.

---

## [0.5.7] - 29.09.2026

### 🎨 Dashboard-Layout
- **Klares 3-Säulen-Dashboard**:
  - Redundante KPI-Boxen auf Unterseiten entfernt.
  - Verständliche Begriffe wie „Ø Kaufkurs“ und „Investiertes Kapital“ anstelle von technischem Jargon.

---

## [0.5.6] - 29.09.2026

### ✨ Features
- **Smart Auto-Detect Import**:
  - Automatisches Erkennen von Kraken Pro und Crypto.com CSV & PDF ohne manuelle Vorauswahl.
- **Börsen-Vergleich (Kraken Pro vs. Crypto.com)** im Analyse-Bereich.
- **Crypto Fear & Greed Index Widget** mit Live-Sentiment von Alternative.me.

---

## [0.5.5] - 29.09.2026

### 🎨 UI & Sortierung
- **Interaktive Sortierung** in der Coin-Tabelle (Klick auf beliebige Spaltenüberschriften).
- **Reiterumbenennung** von „Assets“ in „Coins“.

---

## [0.5.4] - 29.09.2026

### 🎨 Light Theme & Exporte
- **Vollständiges Light-Theme** für alle Charts, Tabellen und Modals.
- **Druckfertiger PDF-Steuerbericht** mit FIFO-Haltefristen.
- **Filterung reiner Fiat-Buchungen** (SEPA, EUR-Transfers) zur Vermeidung von UNKNOWN-Assets.

---

## [0.5.3] - 29.09.2026

### ✨ Kurs-Anbindung
- **Kraken Public Ticker API**:
  - Live-Spot-Preise für alle Kraken-Paare inklusive Nischen-Assets (MLN, LINK, DOGE, Meme-Coins).
- **Exakte Rendite-Berechnung** analog zu Kraken Pro.

---

## [0.5.2] - 29.09.2026

### 🎨 Layout
- **Rechtsbündige Zahlenspalten** für optimale Lesbarkeit und schnellen Zahlenvergleich.

---

## [0.5.1] - 28.09.2026

### ✨ Features
- **Portfolio-Wertverlauf über Zeit** mit Zeitraumfiltern.
- **12-Spalten-Raster für Steuer-Haltefristen**.
- **Mobile Quick-Check Kartenansicht**.

---

## [0.5.0] - 28.09.2026

### ✨ Börsen-Unterstützung
- **Kraken Pro Spot-Trade Support**:
  - Vollständiger Import von Kraken Pro CSVs und PDF-Kontoauszügen mit automatischer Textextraktion.
  - Automatische Duplikatserkennung.

---

## [0.4.0] - 01.09.2026

### ✨ Einstellungen & Sicherheit
- **Benutzerprofil**, Light/Dark Mode und Diskretionsmodus.
- **E-Mail & SMTP Benachrichtigungen** für Preisalarme und tägliche Berichte.
- **GitHub Privacy Audit**: Schutz von `.db`-Dateien und privaten Schlüsseln vor Veröffentlichung.

---

## [0.3.0] - 01.09.2026

### 💾 Samba-Share & Persistenz
- **Dauerhafte SQLite-Datenbank** unter `/share/rwrfolio/db/rwrfolio.db`.
- **Automatisches CSV-Archiv** unter `/share/rwrfolio/imported/`.

---

## [0.2.0] - 01.09.2026

### 🏠 Home Assistant Integration
- **SQLite-Persistenz** für dauerhaften Datenerhalt bei Add-on-Updates.
- **Home Assistant OS Add-on** Konfiguration mit Ingress-Unterstützung für die Seitenleiste.

---

## [0.1.0] - 31.08.2026

### 🚀 Initialer Release
- Import von Crypto.com Transaktionsexporten (Kauf, Verkauf, Rewards, Cashbacks).
- DCA-Durchschnittskaufpreis-Berechnung und Echtzeit-Portfolio-Kennzahlen.
- Live-Kursabfrage und interaktive Allokations-Charts.
