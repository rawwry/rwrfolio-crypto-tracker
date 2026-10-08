# rwrfolio – Home Assistant Add-on Dokumentation

**rwrfolio** ist ein privater, selbstgehosteter Krypto-Portfolio- und DCA-Tracker für Home Assistant OS mit persistenter SQLite-Datenbank, echten Live-Marktkursen, Multi-Börsen-Import und offiziellem Steuerbericht nach deutschem Einkommensteuerrecht (§ 23 EStG).

---

## 🌟 Funktionsumfang im Überblick

- **🔒 100 % Privat & Lokal:** Keine Weitergabe von Beständen oder Transaktionen an Drittanbieter. Alle Daten liegen ausschließlich auf deinem Home Assistant Server (z. B. Raspberry Pi, Intel NUC, Home Assistant Green/Yellow).
- **📈 Echte Live-Marktkurse, Historie & 24h-Portfolio Delta:**
  - Direkte Kursabfrage über die öffentlichen Schnittstellen von **Binance** und **Kraken** (kein API-Schlüssel erforderlich).
  - **Live 24h-Portfolio Delta (€ & %):** Sofortige Anzeige des absoluten und prozentualen Depotgewinns/-verlusts der letzten 24 Stunden direkt in der Hero-Karte des Dashboards inklusive interaktivem Asset-Aufschlüsselungs-Tooltip und Erkennung des stärksten Tages-Werttreibers.
  - Sekundengenaue Aktualisierung von Preisen, Allokationen, unrealisierten Gewinnen/Verlusten (UP&L) und DCA-Durchschnittspreisen.
- **📊 Interaktive TradingView-Style Charts:**
  - Echte historische Marktkurven für Bitcoin, Ethereum, Solana, Polkadot, Hedera, Akash und alle weiteren Portfolio-Assets.
  - **Vollbildmodus (Fullscreen):** Großformatige TradingView-Pro Ansicht per Knopfdruck (`[ ⛶ Vollbild ]` oder Tastatur-Shortcut `Esc`) mit erweiterter Zeichenfläche (`58vh`).
  - **Trade-Pins:** Kaufzeitpunkte (▲ KAUF) und Verkäufe (▼ VERK.) direkt auf der Kurslinie mit Glow-Effekten und vertikalen Orientierungslinien.
  - **Horizontale DCA-Referenzlinie:** Zeigt deinen persönlichen durchschnittlichen Kaufpreis mit prozentualem Abstand zum aktuellen Kurs.
  - **100% pixel-stabiles Live-HUD, Clean Canvas & Technische Indikatoren:** Feste, verdeckungsfreie Inspektionsleiste über dem Chart mit rigiden Spalten und `font-mono tabular-nums` (kein Springen oder Jitter beim Hovern über Trades); linienfreier TradingView-Canvas ohne störende horizontale Gitterstriche (sowohl im Hauptchart als auch im Portfolio-Verlaufsdiagramm); zuschaltbare **Bollinger Bänder (20, 2σ)**, **ATH-Referenzlinie** und synchronisierter **RSI (14)** Momentum-Oszillator.
- **🥧 Neugestaltete Coin-Allokation & Gewichtung (Dauerhaft ausgeklappt & sprungfrei):**
  - Kompakter, horizontaler **Horizon-Allokationsstreifen** mit Farbsegmentierung nach Coin-Markenfarben und interaktiver Segmentfokussierung (spart über 200px vertikalen Platz gegenüber alten Kreisdiagrammen).
  - **4-KPI-Konzentrationsleiste:** Top 1 Dominanz, Top 3 Konzentrationsgrad (*Fokussiert* vs. *Ausgewogen*), stärkster Alpha-Werttreiber vs. Kapital sowie Gesamtportfolio-Rendite.
  - **Hochdichte, 100 % sprungfreie Allokations-Tabelle & dedizierte Mobile-Kartenansicht:** Extrem schlanke, einzeilige Tabelle je Coin mit Rang, Asset, klaren Allokations-Pill-Badges (ohne graue Balkenspuren), Marktwert, Cost Basis, P&L und Allokations-Drift. Rigides `table-fixed`-Raster verhindert jegliches Breitenwackeln. Auf Mobilgeräten sorgt eine eigens gestaltete Kartenansicht für 100 % überlappungsfreie Lesbarkeit. Startet standardmäßig stets vollständig ausgeklappt für maximalen Überblick.
- **☀️ Light-Theme Kontrast-Perfektion & Bereinigte Typografie:** Sämtliche Komponenten, Metriken, Sortierknöpfe und Badges wurden auf optimale Lesbarkeit im Hellen Modus nach WCAG-Standards angepasst. Redundante Coin-Anzahl-Pills wurden seitenübergreifend aus Überschriften und Reitern entfernt für ein klares, modernes Erscheinungsbild.
- **⚡ Multi-Timeframe Performance-Matrix:**
  - Schneller Wechsel zwischen **24h (Tag)**, **7T (Woche)**, **30T (Monat)**, **90T (3 Monate)**, **1J (Jahr)** und **Gesamt (All-Time DCA)**.
  - Gegenüberstellung von **relativer Kursentwicklung (%)** und **absoluter Depotwert-Veränderung (€ / $)** – mobil ohne störende Zweizeiler.
  - 1-Klick-Aktivierung: Klick auf Top Performer im Dashboard, Klick auf Zeilen in der Matrix oder die neuen `[📈 Chart]`-Buttons in der Coinübersicht lädt das jeweilige Asset direkt in den interaktiven Großchart.
- **📥 Smart Auto-Detect Import & Nativer .eml Support:**
  - Drag & Drop für CSV-Dateien, PDF-Kontoauszüge und archivierte `.eml` E-Mail-Belege (z. B. aus n8n-Workflows).
  - Automatische Erkennung von **Kraken Pro** (CSV sowie offizielle mehrspaltige Spot-Trades PDF-Statements), **Kraken E-Mail Belegen (.eml / PDF / Text)** für Käufe und Verkäufe (*"You bought ONDO"*, *"You sold LAPTOP"*), **Crypto.com** (App & Exchange CSVs) sowie **Crypto.com E-Mail Belegen**.
  - Intelligente Multi-Source Duplikatserkennung gleicht Order-IDs und TxIDs zwischen PDF-, CSV- und E-Mail-Importen automatisch ab und verhindert Doppelerfassungen zuverlässig.
  - Automations-Schnittstelle `POST /api/transactions/eml` zur direkten Anbindung von Webhooks aus n8n.
- **📑 BMF-konformer Steuerbericht (§ 23 EStG) & Realisierte Gewinne:**
  - Druckfertiger, audit-sicherer PDF-Steuerbericht und strukturierter CSV-Export für Finanzamt und Steuerberater mit rigider `table-layout: fixed`-Architektur (verhindert jegliches seitliches Überlaufen auf Seiten 2 & 3).
  - Vollständige Anzeige aller Spalten inklusive *Wert €* ohne Rand-Beschneidung.
  - Dedizierte, großzügige Seitenarchitektur für Coin-Bestand zum Stichtag (Seite 3), offene Anschaffungstranchen (Anhang A, Seite 4), Methodik (Seite 5) und vollständige Querformat-Belegnachweise (Anhänge B & C ab Seite 6).
  - Cent-genaue mathematische Rundungskonsistenz (`Erlös - Anschaffungskosten - Gebühren = Gewinn/Verlust`) und automatisches Ausblenden redundanter Zwischensummen bei Verkäufen auf nur einer Börse.
  - Automatische Filterung unbedeutender Kleinsttranchen (< 0,005 €).
  - **Realisierte Verkäufe & Gewinne im Analyse-Tab (Closed Trades):** Vollständige Sektion im Analyse-Bereich mit aggregiertem Reingewinn, Bruttoerlösen, Anschaffungskosten, Gebühren, interaktivem Coin-Filter und Einzelnachweis aller geschlossenen Positionen.
  - **Coin-spezifische Realisierte Gewinne:** Interaktiver Coin-Filter in der Verkaufsübersicht des Steuer-Tabs inklusive KPI-Zusammenfassung; sofortige Anzeige des realisierten Gewinns im interaktiven Coin-Chart und in der Haltedauern-Tabelle.
  - Strikte FIFO-Berechnung (First In, First Out) mit getrennten Depots je Börse und automatischer Freigrenzen-Überwachung (1.000 € ab VZ 2024, 256 € für Staking/Rewards).
- **🖥️ Layout & Design (Fullwidth vs. Boxed):**
  - **Fullwidth-Widescreen-Layout:** Flüssige 1920px Widescreen-Darstellung als Standard für optimale Übersicht. Umschaltbar auf Kompakt (Boxed Layout, max. 1280px) in den Einstellungen.
  - 5 Farbthemen: *Midnight Slate*, *OLED Pure Black*, *Cyber Emerald*, *Nordic Cyan* und *Amber Gold*.
  - Upload eigener Webapp-Logos und Homescreen-Touchicons für iOS und Android.

---

## 🚀 Installation & Einrichtung

### 1. Repository im Home Assistant Add-on Store hinzufügen
1. Öffne deine Home Assistant Weboberfläche.
2. Gehe zu **Einstellungen** > **Add-ons** > **Add-on Store** (unten rechts).
3. Klicke oben rechts auf das Drei-Punkte-Menü `⋮` und wähle **Repositories**.
4. Trage die Repository-URL ein:
   ```text
   https://github.com/rawwry/rwrfolio-crypto-tracker
   ```
5. Klicke auf **Hinzufügen** und schließe das Dialogfenster.
6. Klicke erneut auf `⋮` > **Neu laden** (oder lade die Browserseite mit F5 neu).

### 2. Add-on installieren & starten
1. Scrolle im Add-on Store nach unten oder suche nach **rwrfolio**.
2. Klicke auf die Kachel und wähle **Installieren**.
3. Aktiviere nach Abschluss der Installation folgende Optionen:
   - ✅ **Beim Systemstart starten** (startet das Add-on automatisch mit Home Assistant)
   - ✅ **In Seitenleiste anzeigen** (aktiviert Home Assistant Ingress für direkten Zugriff)
4. Klicke auf **Starten**.
5. Klicke auf **Benutzeroberfläche öffnen** oder nutze den Link **rwrfolio** in der linken Home Assistant Menüleiste.

---

## 🌐 Zugriffsmöglichkeiten

Das Add-on unterstützt zwei Zugriffsarten:

1. **Home Assistant Ingress (Empfohlen):**
   - Nahtlos in die Home Assistant Seitenleiste eingebettet.
   - Automatisch über Home Assistant gesichert (keine separaten Logins notwendig, auch über Nabu Casa / Remote UI erreichbar).
2. **Direkter Port-Zugriff (Port 7544):**
   - Das Add-on stellt standardmäßig den Port `7544` bereit:
     ```text
     http://homeassistant.local:7544
     # bzw.
     http://<DEINE-HOME-ASSISTANT-IP>:7544
     ```
   - Ideal für Lesezeichen im Browser oder als eigenständige Progressive Web App (PWA) auf Smartphones und Tablets.

---

## 💾 Persistente Speicherung & Datensicherheit

Alle Anwendungsdaten werden dauerhaft im Home Assistant Shared-Speicher abgelegt:

- **SQLite-Datenbank:**
  `/share/rwrfolio/db/rwrfolio.db`
- **CSV-Importarchiv:**
  `/share/rwrfolio/imported/`

### Zugriff über Samba-Share:
Falls du das offizielle Home Assistant **Samba share** Add-on installiert hast, kannst du vom PC oder Mac direkt auf deine Daten zugreifen:
```text
Windows:  \\homeassistant\share\rwrfolio\
macOS:    smb://homeassistant.local/share/rwrfolio/
```

### Backups:
- Durch die Ablage im `/share/`-Verzeichnis wird dein gesamtes Portfolio bei regulären Home Assistant Backups (Voll- oder Teil-Backups) automatisch mitgesichert.
- In den Einstellungen von rwrfolio unter **„Daten & Backup“** kannst du jederzeit zusätzlich:
  - Ein **JSON-Komplettbackup** deiner Transaktionen und Einstellungen herunterladen.
  - Eine **Transaktions-CSV** für externe Tabellenprogramme exportieren.

---

## ⚙️ Add-on Konfiguration (Optionen)

In der Add-on-Konfiguration in Home Assistant können folgende Pfade bei Bedarf angepasst werden:

```yaml
database_path: "/share/rwrfolio/db/rwrfolio.db"
imported_csv_path: "/share/rwrfolio/imported"
```

Standardmäßig sind keine Änderungen erforderlich. Die Ordner werden beim ersten Start automatisch erstellt.

---

## 🔄 Updates & Versionsprüfung

- Bei neuen Versionen erscheint im Home Assistant Add-on Store automatisch ein Update-Hinweis.
- Im Reiter **Changelog** des Add-ons kannst du alle Neuerungen der jeweiligen Version einsehen.
- Deine Datenbank und Importe bleiben bei Updates uneingeschränkt erhalten.
