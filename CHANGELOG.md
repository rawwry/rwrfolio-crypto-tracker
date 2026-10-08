# Changelog

Alle wichtigen Änderungen und Versionssprünge von **rwrfolio** werden in dieser Datei dokumentiert.

---

## [0.5.40] - 08.10.2026

### 🎨 Chart Live-HUD Trade-Badge Clipping behoben & Responsive Metriken
- **Interaktiver Coin-Chart Live-HUD**:
  - **Kein Clipping bei Mehrfach-Trades am selben Tag**: Wurden an einem Tag sowohl Käufe als auch Verkäufe getätigt (z. B. Kauf & Verkauf von LAPTOP), wurden die über 300px breiten Trade-Banner zuvor im flexiblen Slot abgeschnitten (sodass vom zweiten Trade nur ein grünes Bruchstück `[` sichtbar war).
  - **Adaptive Badges**:
    - **2 Trades am Tag**: Anzeige als zwei schlanke, vollwertige Badges nebeneinander (`▼ VERK. $0.0915` & `▲ KAUF $0.0768`) ohne Währungsdopplung und ohne horizontalen Kantenbeschnitt.
    - **1 Trade**: Prägnante Anzeige von Menge und Kurs (`▼ VERK. 1.398,6 @ $0.0915`).
    - **Interaktivität & Tooltip**: Jeder Badge bleibt einzeln anklickbar und öffnet den Steuer- und Tranchen-Inspektor für den jeweiligen Trade; Hover zeigt den vollständigen Tooltip mit Stückzahl, Börse und Ausführungskurs.
- **HUD-Breiten & Metriken**:
  - Wegfall starrer Spaltenbreiten (`w-32`, `w-48`) für Kurs, Wert, P&L und DCA-Abstand – die Metriken passen sich flexibel an die tatsächliche Inhaltsbreite an, sodass das HUD auch auf Bildschirmen unter 1.400px nicht mehr horizontal überläuft.
  - Reingewinn-Statuskarte im Chart-Header (`Real.: +12.84 €`) mit `whitespace-nowrap` gegen vertikale Umbrüche geschützt.

---

## [0.5.39] - 08.10.2026

### 🔄 Korrektur der Verkaufsanzeige (SELL) in Transaktionshistorie & Bearbeiten-Modal
- **Transaktions-Historie (Tabelle & Mobile Cards)**:
  - **Beseitigung fehlerhafter Gegenwert- & Einzelkurs-Berechnung**: Bisher wurden bei Verkäufen (`SELL`) die veräußerten Krypto-Token-Mengen irrtümlich als Euro-Guthaben interpretiert und in USD umgerechnet (z. B. 1.398,601 LAPTOP × 1,08 = 1.510,49 $), was zu absurden Gegenwerten und verzerrten Stückpreisen (13,35 $) führte.
  - **Saubere Trennung von Asset & Erlös**:
    - **Asset & Menge**: Zeigt bei Verkäufen die veräußerte Krypto-Menge mit Minuszeichen in Signalrot (z. B. `−1.398,601 LAPTOP`).
    - **Kauf- / Verkaufswert**: Zeigt den tatsächlichen Netto-Verkaufserlös mit Pluszeichen in Smaragdgrün (z. B. `+$122.23 ≈ +113,18 €`) mit Kennzeichnung als *Erlös*.
    - **Einzelkurs**: Weist den korrekten Ausführungskurs je Coin aus (z. B. `$0.0883 ≈ 0,0817 €`).
- **Transaktionsdetails-Modal**:
  - Übersichtliche Aufschlüsselung mit Typ-Badge (`Verkauf`), veräußertem Krypto-Asset, Netto-Verkaufserlös in EUR/USD, Ausführungskurs und Gebühren.
- **Transaktions-Erfassungs- & Bearbeiten-Modal**:
  - Dynamische Anpassung aller Formularfelder je nach Transaktionstyp: Bei Verkäufen werden Krypto-Token und Auszahlungswährung/Erlös eindeutig unterschieden.
  - Automatisches Laden und Speichern ohne Währungsvertauschung (`spentCurrency = Coin`, `receivedCurrency = Fiat`).
- **Sortierung & Filterung**:
  - Sortierung nach höchstem/niedrigstem Betrag (`highest_spent` / `lowest_spent`) basiert nun korrekt auf dem tatsächlichen Fiat-Wert der Transaktion.

---

## [0.5.38] - 08.10.2026

### 📑 Steuer-PDF Seitenrand-Korrektur, Chart-HUD Badges & Realisierte Verkäufe im Analyse-Bereich
- **Steuer-PDF Export Layout & Seitenränder (§ 23 EStG)**:
  - **Kein horizontales Überlaufen mehr**: Alle Tabellen auf Seite 2 (Einzelnachweis Veräußerungen, Staking & Rewards), Seite 3 (Coin-Bestand zum Stichtag) und Seite 4 (Anhang A) nutzen nun ein rigides `table-layout: fixed; width: 100%;` mit prozentual abgestimmten Spaltenbreiten.
  - **Spalte "Wert €" vollständig sichtbar**: Beseitigung der 800px-Überbreite auf Seite 3 – die Spalte *Wert €* wird nun sauber innerhalb des druckbaren A4-Seitenbereichs gerendert und nicht mehr am rechten Rand abgeschnitten.
  - **A4-Druckbegrenzung**: `.page` mit `overflow: hidden; box-sizing: border-box` und optimierten 14mm-Rändern garantiert perfekte Druckergebnisse ohne seitliche Ausreißer.
- **Interaktiver Coin-Chart Live-HUD**:
  - **Kein Abschneiden von Trade-Badges**: Die Trade-Inspektionsleiste über dem Chart (`[▲ KAUF]` und `[▼ VERK.]`) verfügt nun über einen flexiblen Container (`flex-1 min-w-0 overflow-x-auto`) anstelle einer starren Breitenbeschränkung.
  - Werden an einem Tag sowohl Käufe als auch Verkäufe getätigt, werden beide Trade-Pins vollständig nebeneinander angezeigt, ohne benachbarte Live-Metriken (Kurs, Wert, P&L) zu verdecken oder zu quetschen.
- **Realisierte Verkäufe & Gewinne im Analyse-Bereich**:
  - Neue dedizierte Sektion **Realisierte Verkäufe & Gewinne (Closed Trades)** direkt im Analyse-Tab.
  - Sofortiger Überblick über den gesamten realisierten Nettogewinn (§ 23 stpfl. vs. steuerfrei), Verkaufserlöse, Anschaffungskosten (Cost Basis) und Verkaufsgebühren.
  - Interaktiver Coin-Filter und Übersicht nach Asset: Klick auf einen Coin filtert die Closed-Trades-Tabelle und aktualisiert den interaktiven Kurschart.

---

## [0.5.37] - 08.10.2026

### 📑 Kraken PDF-Statement Parser, Steuer-PDF Layout-Optimierung & Coin-spezifische Realisierte Gewinne
- **Kraken Pro PDF-Statement Parser**:
  - Vollständige Erkennung und fehlerfreie Extraktion von offiziellen Kraken Pro Spot Trades Statement-PDFs im Spalten-Block-Format (`Unique ID`, `Time (UTC)`, `Pair`, `Type`, `Subtype`, `Price`, `Cost`, `Volume`, `Fee`).
  - Automatische Zuordnung von Zeitstempeln (`2026-09-26T08:25:35Z`), Handelskursen, Krypto- und Fiat-Volumina sowie eindeutigen Trade-IDs.
- **Steuer-PDF Export Layout & Formatierungs-Überarbeitung (§ 23 EStG)**:
  - **Anhang B (Kraken Ledger)**: Bereinigte `Order/Art`-Spalte (`email_receipt` wird lesbar als `E-Mail` dargestellt), vergrößerte `Menge (Vol)`-Spalte mit `white-space: nowrap` verhindert das Umbrechen des Coin-Tickers auf eine zweite Zeile.
  - **Anhang C (Crypto.com)**: Übersetzung interner technischer Enum-Strings in klare deutsche Beschriftungen (`Limit-Kauf`, `VIBAN-Kauf`), konsistente 2-Dezimalstellen-Währungsformatierung für `Gegenwert USD` (`$ 1.028,90`) und verbreiterte Hash-Spalte ohne Zeilenumbruch einzelner Endziffern.
  - **Seitenarchitektur**: Dedizierte Seite 3 für den Coin-Bestand zum Stichtag mit rigiden Spaltenbreiten (verhindert unschöne Umbrüche langer Coin-Namen wie *Polygon Ecosystem Token*). Anhang A (Offene Anschaffungstranchen) erhält eine eigene Seite 4, gefolgt von Methodik (Seite 5) und den Belegnachweisen (ab Seite 6).
  - **Bereinigung von Kleinsttranchen**: Vollständiges Ausfiltern nichtiger Rundungs-Resttranchen (< 0,005 € und < 0,001 Coin) in Anhang A.
  - **Rundungskonsistenz & Subtotale**: Wegfall redundanter Einzelbörsen-Zwischensummen bei nur einer handelnden Börse und cent-genaue mathematische Rundungskonsistenz zwischen Erlös, Anschaffungskosten, Gebühren und Nettogewinn (`Erlös - Anschaffungskosten - Gebühren = Gewinn/Verlust`).
- **Übersichtsseite Bereinigt**:
  - Entfernung der überflüssigen Pille *Transaktions-Historie* aus der Überschrift des Portfolio-Gesamtbewertungsdiagramms.
- **Transparente Anzeige Realisierter Gewinne (Gesamt & je Coin)**:
  - Neuer interaktiver Coin-Filter in der Karte *Realisierte Verkäufe {Jahr} (FIFO)* im Steuer-Tab inklusive hervorgehobenem KPI-Banner für den realisierten Gewinn, Erlöse und Kosten des gewählten Coins.
  - Anzeige des realisierten Gewinns im interaktiven Coin-Chart (Header-Pill & P&L-Statuskarte) bei Assets mit Verkaufshistorie.
  - Ausweisung des realisierten Gewinns direkt in der Zeile jedes Coins in *Coin Haltedauern & FIFO Bestände*.

---

## [0.5.36] - 07.10.2026

### 📧 Nativer .eml E-Mail Import (Kraken Buy/Sell & Crypto.com) & n8n Workflow Support
- **Nativer E-Mail Import (.eml)**:
  - Vollständige Unterstützung für das direkte Importieren von archivierten `.eml`-Dateien via Drag & Drop oder Dateidialog.
  - Automatisches Dekodieren von Base64 und Quoted-Printable (inklusive voller UTF-8-Unterstützung für Umlaute und Sonderzeichen) sowie HTML-Normalisierung.
- **Kraken Verkauf- & Kaufbelege**:
  - Nahtlose Erkennung von BUY- und SELL-Mails (z. B. *"You bought ONDO"*, *"You sold LAPTOP"*).
  - Korrekte Extraktion von verkauftem/gekauftem Krypto-Volumen, EUR-Gegenwert bzw. Netto-Proceeds, Einzelkurs, Gebühren, TxID/Order-ID und sekundengenauem RFC 2822 Zeitstempel.
  - Verkäufe (`SELL`) mindern die Asset-Bestände und realisieren EUR-Erlöse.
- **Intelligente Duplikatssperre zwischen PDF & EML**:
  - Durch den Abgleich der eindeutigen Order-IDs / TxIDs (z. B. `BQZ4TQZ` für den ONDO-Kauf) werden Trades, die bereits aus PDF-Kontoauszügen importiert wurden, beim Import einer `.eml`-Datei automatisch als Duplikat erkannt und übersprungen.
- **n8n Automations-Endpoint (`POST /api/transactions/eml`)**:
  - Direkter HTTP-Endpunkt im Node.js Server für automatisierte n8n-Workflows zur Weiterleitung und Archivierung gesicherter E-Mails.
- **Archivierung im Samba-Share**:
  - Alle importierten `.eml`-Dateien werden originalgetreu mit `.eml`-Dateiendung im Archivordner `/share/rwrfolio/imported/` gesichert.

---

## [0.5.35] - 06.10.2026

### 📈 24h-Portfolio Delta (€ & %) & Live-Tagesrendite
- **Live 24h-Portfolio Delta in Hero-KPIs**:
  - Prominente Integration der tagesaktuellen Portfolio-Veränderung in absoluter Währung (€ / $) und relativer Performance (%) direkt in der Karte **Portfolio Gesamtwert** auf dem Dashboard (analog zu führenden Neobrokern wie Trade Republic oder Bitpanda).
  - Zeigt auf einen Blick: `[▲ +240,50 € (+1,94 %)] 24h Delta` mit dynamischer Farbcodierung (Smaragdgrün bei Gewinn, Rosenrot bei Verlust).
- **Interaktiver 24h Delta-Inspektor (Tooltip)**:
  - Beim Bewegen der Maus über die 24h-Plakette wird ein vollständiger Aufschlüsselungs-Tooltip eingeblendet, der die genauen Wertbeiträge (€ / $) und prozentualen Kursbewegungen jedes einzelnen gehaltenen Coins für die letzten 24 Stunden detailliert auflistet.
- **Top 24h-Treiber-Indikator**:
  - Zeigt in der Status-Fußzeile der Gesamtwert-Karte automatisch das krypto-Asset mit dem stärksten positiven Tagesbeitrag (z. B. `Top: BTC (+0,4 %)`).
- **Klar abgegrenzter All-Time Gesamtertrag**:
  - Karte 2 (**Gesamtertrag P&L**) wurde mit einer expliziten `Gesamt`-Plakette versehen, um die langfristige DCA-Gesamtrendite eindeutig von der 24h-Tagesbewegung abzugrenzen.
- **24h-Kursveränderung in der Coin-Tabelle**:
  - In der Coinübersicht (`AssetList`) wird neben dem aktuellen Live-Kurs nun für jedes Asset die 24h-Performance angezeigt (sowohl in der Desktop-Tabelle als auch in den mobilen Asset-Karten).
- **Ultraschneller Multi-Börsen Ticker-Abruf mit Cache**:
  - Parallele Abfrage der 24h-Spot-Ticker über Binance und Crypto.com mit 60-Sekunden In-Memory Caching für maximale Performance und zuverlässigen Fallback.

---

## [0.5.34] - 06.10.2026

### 📱 Mobile Optimierungen & Layout-Fixes
- **Beseitigung von Spaltenüberlappungen & Tabellen-Umbruch**:
  - Vollständige Behebung des Darstellungsfehlers in der Coin-Allokation auf Mobilgeräten, bei dem Spaltenköpfe ("Asset" & "Gewichtung") ineinanderliefen und Text zweizeilig umbrach.
  - Implementierung einer dedizierten, responsiven Mobile-Kartenansicht (`sm:hidden`) mit Rang, Coin-Farbpunkt, einzeiliger Allokationspille, aktuellem Marktwert, Cost Basis und P&L.
  - Absicherung der Desktop-Tabelle (`hidden sm:block`) mit einer festen Mindestbreite von `620px` und weichem horizontalem Scrollen.
- **Bereinigte Performance-Matrix auf Smartphones**:
  - Entfernung der unschön zweizeilig umbrechenden Info-Pillen ("X im Plus / Y im Minus") neben den Timeframe-Buttons.
  - Volle Bildschirmbreite und hervorragende Touch-Ergonomie für alle 6 Zeitfilter (24h, 7T, 30T, 90T, 1J, Gesamt) ohne Textstauchungen.

### 🏛️ Architektur- & Strukturbereinigung
- **Portfoliowert-Verlauf im Dashboard aktiviert**:
  - Das historische Vermögens-Verlaufsdiagramm (`PortfolioValueTimelineChart`) ist nun standardmäßig direkt unter den Hero-KPIs im Dashboard eingebunden.
  - Nutzer sehen die historische Wertentwicklung ihres Gesamtvermögens sofort beim Laden der Webapp.
- **Redundanz-Bereinigung in den Analysen**:
  - Die doppelte Coin-Allokations-Tabelle wurde aus der Ansicht *Analysen* entfernt, da sie originär auf das Dashboard gehört.
- **Nahtlose 1-Klick Chart-Navigation**:
  - Klicks auf die *Top Performer* Karten im Dashboard sowie neue `[📈 Chart]`-Aktionsbuttons in der Coin-Tabelle navigieren direkt zur interaktiven Großansicht des TradingView-Charts mit dem vorausgewählten Coin.

---

## [0.5.33] - 06.10.2026

### 🎨 Design & Minimalismus
- **Seitenübergreifende Bereinigung der Coin-Anzahl-Pills**:
  - Vollständige Entfernung aller redundanten Plaketten mit der Anzahl an Coins bzw. Assets über alle Bereiche der Benutzeroberfläche hinweg.
  - Entfernt aus der Überschrift von **Coinübersicht & Durchschnittskurse** (unter *Coins*).
  - Entfernt aus der Überschrift der **Coin-Performance Matrix** (unter *Analysen*).
  - Entfernt aus dem **"Coins"**-Reiter in der Hauptnavigationsleiste (Desktop-Header).
  - Sorgt für ein konsistentes, klares und reduziertes Erscheinungsbild ohne unnötige Zähler-Abzeichen in den Titeln.

---

## [0.5.32] - 05.10.2026

### 🎨 Design & Kontrast
- **Umfassendes Light-Theme Kontrast-Overhaul**:
  - Sämtliche Komponenten wurden auf perfekte Lesbarkeit im Hellen Modus (Light Theme) nach WCAG-Standards optimiert.
  - Beseitigung aller schwer lesbaren weißen Texte auf hellem Hintergrund (z. B. in der Coin-Performance-Matrix und im Live-HUD des Charts) sowie Ausmerzung von unsichtbarem Text bei Hover-Effekten (`hover:text-white`).
  - Neue, hochkontrastierende Farbklassen für Hell-Modus: Kräftiges Dunkelschiefer (`text-slate-900`, `text-slate-800`), tiefes Indigo (`text-indigo-700`) und sattes Smaragdgrün/Rosenrot (`text-emerald-700` / `text-rose-700`) für P&L- und Rendite-Ziffern.
  - Vollständige Überarbeitung des Fear & Greed Index Widgets, des Portfoliowert-Verlaufsdiagramms und aller Toolbar-Buttons für das Light Theme.

### 🥧 Coin-Allokation & Layout-Stabilität
- **Standardmäßig dauerhaft ausgeklappt**: Die Allokations-Tabelle startet nun immer vollständig expandiert (`isExpanded = true`), sodass alle Coin-Positionen unmittelbar ohne Klick sichtbar sind.
- **Bereinigte Kopfzeile**: Die redundante Pill-Plakette `(x Positionen)` neben der Überschrift wurde entfernt für ein aufgeräumtes Erscheinungsbild.
- **100 % sprungfreies Tabellen-Layout**:
  - Vollständige Behebung von Breiten- und Zeilensprüngen beim Bewegen der Maus über die Allokations-Tabelle.
  - Umstellung auf ein striktes `table-fixed`-Layout mit fest definierten Breitenklassen je Spalte (`w-9 sm:w-11`, `w-auto`, `w-24 sm:w-28`, `w-32 sm:w-36`).
  - Beseitigung dynamischer Schriftstärken-Änderungen (`font-semibold`) auf Zeilen-Hover, wodurch die Spaltenbreiten bei jeder Interaktion auf den Pixel exakt stabil bleiben.
- **Linienfreies Verlaufsdiagramm**:
  - Entfernung störender horizontaler Gitterlinien im Portfoliowert-Verlauf (`PortfolioValueTimelineChart`) für ein einheitlich klares, freies Kurvenerlebnis im modernen TradingView-Stil.

---

## [0.5.31] - 05.10.2026

### 🎨 Design & Ästhetik
- **Entfernung horizontaler Linien & Modernisierung durch Allokations-Pills**:
  - Vollständige Beseitigung der unästhetischen grauen Fortschritts- und Trennlinien in den Allokations-Spalten (in der Tabelle unter Coin-Allokation, in der Coin-Performance-Matrix und der Asset-Übersicht).
  - Ersetzt durch hochwertige, kompakte Allokations-Pills mit Coin-spezifischem Farbpunkt und klarer Prozentangabe ohne störende Balkenspuren.
  - **Linienfreier Chart-Hintergrund**: Die horizontalen Gitternetzlinien (`CartesianGrid`) im Hauptchart und im RSI-Oszillator wurden vollständig entfernt – die Kurskurve und Trade-Pins stehen nun im Stil moderner TradingView- und Apple-Stocks-Layouts völlig frei und ungestört im Raum.
  - **Rahmenlose, atmende Tabellen**: Beseitigung harter horizontaler Trennstriche (`divide-y`) zugunsten flüssiger, abgerundeter Zeilenhervorhebungen beim Überfahren mit der Maus.

---

## [0.5.30] - 05.10.2026

### 🎨 Optimierungen & Platzersparnis
- **Hochdichte Allokations-Tabelle (Ersatz der Kacheln)**:
  - Vollständige Ablösung der sperrigen Kacheln/Boxen unter der Coin-Allokation durch eine extrem platzsparende, einzeilige Finanztabelle.
  - Reduziert die vertikale Bauhöhe um über 65 % und sorgt für eine übersichtliche Gesamtdarstellung auf dem Dashboard und der Analyse-Seite.
  - Jede Position bietet auf einen Blick: Rang (`#1`), Asset-Farbe, Symbol & Name, Gewichtung mit Miniatur-Fortschrittsbalken, aktueller Marktwert, Cost Basis (eingesetztes Kapital), P&L-Rendite und Alpha-Drift.
  - Vollständig interaktiv: Zeilen-Hover hebt das entsprechende Segment im Horizon-Allokationsstreifen synchron hervor und umgekehrt.
  - **Intelligente Top-6-Kompaktansicht**: Bei Portfolios mit mehr als 6 Positionen werden standardmäßig die Top 6 angezeigt, mit einem dezenten Schalter zum Ausklappen aller weiteren Bestände.

---

## [0.5.29] - 05.10.2026

### ✨ Neue Features & Verbesserungen
- **Fullwidth-Widescreen-Layout als neuer Standard**:
  - Die gesamte Benutzeroberfläche nutzt standardmäßig ein flüssiges Widescreen-Layout (bis 1920px), das große Monitore optimal ausnutzt und mehr Platz für Charts, KPIs und Tabellen bietet.
  - Neuer Layout-Wahlschalter in den Einstellungen unter *Erscheinungsbild*: Flexibler Wechsel zwischen **Volle Breite (Standard)** und **Kompakt (Boxed Layout, max. 1280px)**.
- **100 % pixel-stabiles & sprungfreies Chart-HUD**:
  - Vollständige Behebung von Höhen- und Breiten-Jitter beim Bewegen der Maus über den Chart.
  - Reservierter, fester Badge-Slot für Kauf-/Verkaufsinformationen mit dezentem Platzhalter verhindert das Verschieben benachbarter Spalten.
  - Feste Breiten (`shrink-0`) und `font-mono tabular-nums` für Kurs, Wert, P&L und Durchschnittspreis eliminieren jedes Ziffernwackeln.
  - Beseitigung redundanter Tooltip-Kästen im Zeichenbereich – freier Blick auf die Kurve.
- **Neugestaltete Coin-Allokation & Gewichtung**:
  - Der unpraktische und platzraubende Recharts-Donut-Kreis wurde durch einen modernen, horizontalen **Horizon-Allokationsstreifen** ersetzt (spart über 200px vertikale Bauhöhe).
  - Interaktives Segment-Hover mit Sofort-Feedback und Fokussierung verknüpfter Asset-Karten.
  - **4-KPI-Konzentrationsleiste**: Direkte Anzeige von Top 1 Dominanz, Top 3 Konzentration (Fokussiert vs. Ausgewogen), größtem Alpha-Werttreiber vs. Kapital sowie Portfolio-Gesamtrendite.
  - **Kompakte, hochdichte Asset-Matrix**: Strukturierte Kartenansicht mit Marktwert, Cost Basis, P&L und Allokations-Drift (Marktgewicht vs. Investitionsanteil).

---

## [0.5.28] - 05.10.2026

### ✨ Neue Features & Verbesserungen
- **Crypto.com E-Mail Kaufbeleg-Import (PDF & Text)**:
  - Vollständige Unterstützung für gespeicherte Crypto.com-Kaufbestätigungen (z. B. *"POL Kaufanfrage bestätigt"*, *"Sie haben 3537.49 POL gekauft"*).
  - Extrahiert sekundengenau Asset (POL, BTC, ETH etc.), Kaufmenge, Gesamtkosten (€ EUR), Handelsgebühren, Zahlungsmethode (z. B. Banküberweisung) und Ausführungszeitpunkt aus iOS/Mail-PDF-Exporten (inkl. nativer Swift Vision OCR-Erkennung für gerenderte Mail-Header) oder direkt eingefügtem Text.
- **Intelligente Multi-Source Duplikatserkennung (CSV vs. E-Mail)**:
  - Erkennt automatisch, wenn ein Kaufbeleg bereits früher über einen CSV-Export (z. B. `viban_purchase`) oder einen Ledger-Report importiert wurde.
  - Gleicht Asset, Volumen, Fiat-Kosten und Börsenursprung ab und fängt Mail-Versandlatenzen (z. B. 3 Sekunden Versatz zwischen Börsen-Matching-Engine und E-Mail-Gateway) sowie Zeitzonenunterschiede zuverlässig ab.
  - Keine doppelten Bestände oder verfälschten Einstandskurse beim kombinierten Import von CSV-Listen und E-Mail-Belegen.
- **Demo-Button & UI-Erweiterungen**:
  - Neuer Schnelltest-Button `[Crypto.com E-Mail]` im Import-Modal zur sofortigen Überprüfung der Erkennung und Duplikatssperre.
  - Dedizierte Badge-Anzeige `Crypto.com (E-Mail Beleg)` mit transparenter Duplikatsinformation (*"Bereits im Portfolio (0 neu)"*).

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
