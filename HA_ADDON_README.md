# rwrfolio – Home Assistant OS Add-on

Privater Krypto Portfolio- und DCA-Tracker mit **persistenter SQLite-Datenbank**, Live-Marktkursen, interaktiven TradingView-Style Charts und § 23 EStG Steuerbericht für Home Assistant OS.

---

## 🚀 Installation in Home Assistant OS

Du kannst diese App direkt über das GitHub-Repository im Home Assistant Add-on Store oder als lokales Add-on installieren:

### Methode 1: Über Add-on Store (Empfohlen)
1. In Home Assistant zu **Einstellungen > Add-ons > Add-on Store** navigieren.
2. Oben rechts auf das Drei-Punkte-Menü `⋮ > Repositories` klicken.
3. Repository hinzufügen:
   ```text
   https://github.com/rawwry/rwrfolio-crypto-tracker
   ```
4. Nach Neuladen **rwrfolio** anklicken, **Installieren** und starten.

### Methode 2: Als lokales Add-on
1. Repository in das Verzeichnis `/addons/local/rwrfolio` auf deinem Home Assistant kopieren.
2. Im Add-on Store auf `⋮ > Neu laden` klicken.
3. **rwrfolio** unter *Lokal* auswählen und installieren.

---

## 💾 Persistente Speicherung & Samba-Share

- **SQLite-Datenbank:** `/share/rwrfolio/db/rwrfolio.db`
- **Importierte Belege:** `/share/rwrfolio/imported/`
- Deine Daten bleiben bei Updates, Neustarts und Home Assistant System-Backups dauerhaft erhalten.
- Direkter Zugriff im lokalen Netzwerk via Samba: `\\homeassistant\share\rwrfolio\`.

---

## 📖 Dokumentation & Changelog

- Vollständige Feature-Dokumentation: [DOCS.md](DOCS.md)
- Ausführlicher Versionsverlauf: [CHANGELOG.md](CHANGELOG.md)
