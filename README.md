# rwrfolio – Krypto Portfolio & DCA Tracker für Home Assistant OS

[![Home Assistant Add-on](https://img.shields.io/badge/Home%20Assistant-Add--on-blue.svg)](https://www.home-assistant.io/)
[![Version](https://img.shields.io/badge/Version-0.5.27-emerald.svg)](CHANGELOG.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

**rwrfolio** ist ein privater, lokaler Krypto-Portfolio- und DCA-Tracker für Home Assistant OS mit persistenter SQLite-Datenbank, echten Live-Marktkursen, interaktiven TradingView-Style Charts, Multi-Timeframe Performance-Matrix und offiziellem Steuerbericht (§ 23 EStG).

---

## 🌟 Highlights

- **🔒 100 % Privat & Lokal:** Läuft vollständig auf deinem Home Assistant Server – keine Datenweitergabe an Dritte.
- **📈 Echte Live-Marktkurse:** Direkte Einbindung von Binance & Kraken Public APIs (ohne API-Keys).
- **📊 Interaktive Charts & Vollbildmodus:** Großformatige TradingView Pro Ansicht per Knopfdruck (`[ ⛶ Vollbild ]`), Einstiegs- und Ausstiegskurse (▲ KAUF / ▼ VERK.), horizontale DCA-Linie, SMA 20 Trend, Bollinger Bänder, ATH-Abstand und synchronisierter RSI (14) Momentum-Oszillator.
- **🎯 Fest verankertes Live-HUD & Cursor:** Verdeckungsfreie Punkt- und Trade-Inspektion direkt über der Kurve (kein störend schwebendes Popup, keine Auswahllinien).
- **⚡ Multi-Timeframe Performance-Matrix:** Umschalten zwischen 24h, 7T, 30T, 90T, 1J und Gesamt mit relativer Kursrendite (%) und absolutem Vermögenszuwachs (€ / $).
- **📥 Smart Auto-Detect Import:** Drag & Drop für Kraken Pro (CSV & PDF-Statements), **Kraken E-Mail Kaufbelege** (PDF & Text) sowie Crypto.com (CSV) mit Duplikatserkennung.
- **📑 BMF-Steuerbericht (§ 23 EStG):** 4-seitiger PDF-Steuerbericht mit FIFO-Haltefristen, Freigrenzen und ungekürzten Buchungsbelegen (Anhänge B & C).
- **🎨 Design & Themes:** 5 Farbschemata (inkl. OLED Black), individuelle Logo- & Touchicon-Uploads.

---

## 🚀 Installation im Home Assistant Add-on Store

1. Öffne dein **Home Assistant**.
2. Gehe zu **Einstellungen** > **Add-ons** > **Add-on Store** (unten rechts).
3. Klicke oben rechts auf das Drei-Punkte-Menü `⋮` > **Repositories**.
4. Füge die URL dieses GitHub-Repositories ein:
   ```text
   https://github.com/rawwry/rwrfolio-crypto-tracker
   ```
5. Klicke auf **Hinzufügen** und schließe das Dialogfenster.
6. Klicke erneut auf `⋮` > **Neu laden** (oder F5 drücken).
7. Das Add-on **rwrfolio** erscheint nun im Add-on Store. Klicke darauf und wähle **Installieren**.
8. Aktiviere **Beim Systemstart starten** und **In Seitenleiste anzeigen (Ingress)** und starte das Add-on!

---

## 🌐 Zugriff

- **Home Assistant Seitenleiste (Ingress):** Direkt links im Home Assistant Dashboard eingebunden.
- **Weboberfläche (Direktzugriff):** `http://homeassistant.local:7544` (Port 7544).

---

## 💾 Persistente Speicherung auf dem Server

- **SQLite-Datenbank:** `/share/rwrfolio/db/rwrfolio.db`
- **CSV-Importe:** `/share/rwrfolio/imported/`
- Zugriff über Home Assistant Samba-Share (`\\homeassistant\share\rwrfolio\`).
- Automatische Sicherung über Home Assistant Backups.

---

## 📖 Weitere Dokumentation & Changelog

- Ausführliche Anleitung: [DOCS.md](DOCS.md)
- Vollständiger Versionsverlauf: [CHANGELOG.md](CHANGELOG.md)
