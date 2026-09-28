# 🚀 Antigravity & GitHub Übergabe-Anleitung für rwr/folio

Dieses Dokument führt dich Schritt für Schritt durch die Übergabe und den Import dieses Projekts (**rwr/folio**) in **Google Project Antigravity** über GitHub.

---

## 📋 Überblick: Was brauchst du?

1. Ein kostenloses **GitHub-Konto** ([github.com](https://github.com))
2. Deinen Zugang zu **Google Project Antigravity**

---

## 🛠️ Schritt 1: Ein neues GitHub-Repository erstellen

1. Öffne im Browser: **[https://github.com/new](https://github.com/new)** (eingeloggt in dein GitHub-Konto).
2. Vergib einen Namen für das Repository, z. B.:
   * **Repository name:** `rwrfolio` *(oder `rwrfolio-crypto-tracker`)*
3. Wähle **Public** (öffentlich) oder **Private** (privat).
   > 🔒 *Hinweis:* Die `.gitignore` dieses Projekts ist bereits so konfiguriert, dass **keine** privaten SQLite-Datenbankdateien (`*.db`), lokalen Passwörter oder CSV/PDF-Imports auf GitHub hochgeladen werden.
4. **WICHTIG:** Lasse die Häkchen bei:
   * ❌ *Add a README file* (abgewählt lassen!)
   * ❌ *Add .gitignore* (abgewählt lassen!)
   * ❌ *Choose a license* (abgewählt lassen!)
5. Klicke auf den grünen Button **„Create repository“**.
6. GitHub zeigt dir nun die Repository-URL an, z. B.:
   `https://github.com/DEIN-BENUTZERNAME/rwrfolio.git`

---

## 💻 Schritt 2: Code zu GitHub hochladen (Push)

Das Git-Repository wurde hier im Projekt bereits vorinitialisiert (`git init -b main`).

Führe in der Konsole / im Terminal einfach folgende Befehle aus (ersetze `DEIN-BENUTZERNAME` durch deinen tatsächlichen GitHub-Benutzernamen):

```bash
# 1. Alle Dateien zum Commit vormerken
git add .

# 2. Den ersten Commit erstellen
git commit -m "feat: rwr/folio v0.5.1 - Krypto Tracker mit Kraken CSV/PDF Import, FIFO Steuern & Portfoliowert-Chart"

# 3. Dein GitHub Repository als 'origin' verknüpfen
git remote add origin https://github.com/DEIN-BENUTZERNAME/rwrfolio.git

# 4. Code zu GitHub hochladen
git push -u origin main
```

*(Falls GitHub dich nach Authentifizierung fragt, kannst du dich per GitHub CLI `gh auth login`, Browser oder mit einem Personal Access Token anmelden).*

---

## 🌌 Schritt 3: In Google Project Antigravity öffnen

1. Öffne **Google Project Antigravity** in deinem Browser oder Workspace.
2. Wähle die Option **„Import Repository“**, **„New Project from Git“** oder **„Clone from GitHub“**.
3. Gib deine Repository-URL ein:
   ```text
   https://github.com/DEIN-BENUTZERNAME/rwrfolio.git
   ```
4. Antigravity klont das Repository und erkennt die Node.js / TypeScript Konfiguration automatisch anhand der `package.json`.

---

## ⚙️ Schritt 4: Starten & Entwickeln in Antigravity

Sobald Antigravity das Projekt geladen hat:

### 1. Abhängigkeiten installieren
Falls nicht bereits automatisch geschehen:
```bash
npm install
```

### 2. Entwicklungsserver starten
```bash
npm run dev
```
* Startet den Express-Backend-Server auf Port `3000`.
* Vite middlewares bedienen die React 19 Frontend-App inklusive Tailwind CSS.
* Unter `http://localhost:3000` ist deine App sofort erreichbar.

### 3. Produktions-Build erstellen
```bash
npm run build
```
Kompiliert das React-Frontend mit Vite nach `dist/` und baut den Backend-Server mit `esbuild` nach `dist/server.cjs`.

### 4. Produktions-Server starten
```bash
npm start
```

---

## 🏗️ Projekt-Architektur im Überblick

Hier ist eine kurze Orientierung für die Weiterarbeit in Antigravity:

```text
├── server.ts                  # Express Backend Server (Port 3000)
│                               # REST-API für SQLite (/api/transactions, /api/prices)
│                               # PDF Parser Endpoint (/api/parse-pdf)
├── server/
│   └── db.ts                  # SQLite-Datenbank-Anbindung (@libsql/client)
│                               # Samba-Share Archivierung (/share/rwrfolio)
├── src/
│   ├── App.tsx                # Hauptkomponente, Modals, Tab-Steuerung
│   ├── types.ts               # TypeScript Interfaces (Transaction, AssetSummary, etc.)
│   ├── components/
│   │   ├── AssetList.tsx      # Asset-Tabelle & mobile Zero-Swipe Quick-Check Karten
│   │   ├── PortfolioValueTimelineChart.tsx  # Liniendiagramm: Portfoliowert über Zeit
│   │   ├── PortfolioCharts.tsx              # Donut-Allokation & Investitionspfad
│   │   ├── CSVImportModal.tsx # Import-Center für Kraken Pro (CSV & PDF) & Crypto.com
│   │   ├── TaxView.tsx        # Steuer- & FIFO-Rechner (§ 23 EStG) mit ausgerichteten Haltefristen
│   │   ├── TransactionTable.tsx # Transaktionsliste mit Filtern (Börse, Coin, Typ)
│   │   └── SettingsModal.tsx  # Dark/Light Mode, Benutzerprofil, SMTP-Alarme
│   └── utils/
│       ├── krakenParser.ts    # Kraken CSV & PDF-Textextraktion mit Kurs-Volumen-Formeln
│       ├── csvParser.ts       # Crypto.com & generischer Spalten-Mapper
│       ├── transactionDedup.ts# Intelligente Duplikatserkennung (verhindert Doppeleinträge)
│       └── taxCalculator.ts   # FIFO-Haltefristen- und Steuerberechnung
├── Dockerfile                 # Multi-Platform Container für Home Assistant Add-on
├── config.yaml                # Home Assistant OS Add-on Metadaten
└── package.json               # Node 22, React 19, TypeScript, Tailwind CSS, Recharts
```

---

## 💡 Nützliche Tipps für Antigravity

- **Port:** Die App läuft standardmäßig auf Port `3000`. In Antigravity kann dieser Port bei Bedarf über die Umgebungsvariable `PORT=...` angepasst werden.
- **Datenbank:** Lokal nutzt die App automatisch SQLite unter `./data/share/rwrfolio/db/rwrfolio.db`. Auf einem Home Assistant System wird automatisch der Samba-Share `/share/rwrfolio/db/` verwendet.
- **Testing:** Mit `npm run lint` überprüfst du jederzeit, ob alle TypeScript-Typen fehlerfrei sind (`tsc --noEmit`).
