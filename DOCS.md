# rwrfolio – Home Assistant Add-on Dokumentation

**rwrfolio** ist ein privater, selbstgehosteter Krypto-Portfolio- und DCA-Tracker für Home Assistant OS mit persistenter SQLite-Datenbank, echten Live-Marktkursen, Multi-Börsen-Import und offiziellem Steuerbericht nach deutschem Einkommensteuerrecht (§ 23 EStG).

---

## 🌟 Funktionsumfang im Überblick

- **🔒 100 % Privat & Lokal:** Keine Weitergabe von Beständen oder Transaktionen an Drittanbieter. Alle Daten liegen ausschließlich auf deinem Home Assistant Server (z. B. Raspberry Pi, Intel NUC, Home Assistant Green/Yellow).
- **📈 Echte Live-Marktkurse & Historie:**
  - Direkte Kursabfrage über die öffentlichen Schnittstellen von **Binance** und **Kraken** (kein API-Schlüssel erforderlich).
  - Sekundengenaue Aktualisierung von Preisen, Allokationen, unrealisierten Gewinnen/Verlusten (UP&L) und DCA-Durchschnittspreisen.
- **📊 Interaktive TradingView-Style Charts:**
  - Echte historische Marktkurven für Bitcoin, Ethereum, Solana, Polkadot, Hedera, Akash und alle weiteren Portfolio-Assets.
  - **Vollbildmodus (Fullscreen):** Großformatige TradingView-Pro Ansicht per Knopfdruck (`[ ⛶ Vollbild ]` oder Tastatur-Shortcut `Esc`) mit erweiterter Zeichenfläche (`58vh`).
  - **Trade-Pins:** Kaufzeitpunkte (▲ KAUF) und Verkäufe (▼ VERK.) direkt auf der Kurslinie mit Glow-Effekten und vertikalen Orientierungslinien.
  - **Horizontale DCA-Referenzlinie:** Zeigt deinen persönlichen durchschnittlichen Kaufpreis mit prozentualem Abstand zum aktuellen Kurs.
  - **Fest verankertes Live-HUD & Technische Indikatoren:** Feste, verdeckungsfreie Inspektionsleiste über dem Chart; zuschaltbare **Bollinger Bänder (20, 2σ)**, **ATH-Referenzlinie** und synchronisierter **RSI (14)** Momentum-Oszillator.
- **⚡ Multi-Timeframe Performance-Matrix:**
  - Schneller Wechsel zwischen **24h (Tag)**, **7T (Woche)**, **30T (Monat)**, **90T (3 Monate)**, **1J (Jahr)** und **Gesamt (All-Time DCA)**.
  - Gegenüberstellung von **relativer Kursentwicklung (%)** und **absoluter Depotwert-Veränderung (€ / $)**.
  - 1-Klick-Aktivierung: Klick auf eine Zeile lädt das jeweilige Asset direkt in den interaktiven Großchart.
- **📥 Smart Auto-Detect Import:**
  - Drag & Drop für CSV-Dateien und PDF-Kontoauszüge.
  - Automatische Erkennung von **Kraken Pro** (CSV & PDF-Statements) und **Crypto.com** (App & Exchange CSVs).
  - Intelligente Duplikatserkennung verhindert Mehrfacherfassung.
- **📑 BMF-konformer Steuerbericht (§ 23 EStG):**
  - Druckfertiger 4-seitiger PDF-Steuerbericht und strukturierter CSV-Export für Finanzamt und Steuerberater.
  - Strikte FIFO-Berechnung (First In, First Out) mit getrennten Depots je Börse.
  - Automatische Berücksichtigung der Freigrenzen (1.000 € für private Veräußerungsgeschäfte ab VZ 2024, 256 € für Staking/Rewards nach § 22 Nr. 3 EStG).
  - Vollständige Buchungsprotokolle als Querformat-Anhang B (Kraken) und Anhang C (Crypto.com) mit ungekürzten Transaktions-IDs.
- **🎨 Design, Themes & Touchicons:**
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
