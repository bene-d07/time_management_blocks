# Wochenplan Live-Anzeige für GitHub Pages

Diese Website liest eine Excel-Datei mit folgendem Aufbau ein:

- Zeile 1: `Zeit | Montag | Dienstag | Mittwoch | Donnerstag | Freitag`
- Spalte A: Uhrzeiten in 5-Minuten-Schritten (`08:00`, `08:05`, ...)
- Restliche Zellen: Einträge wie `Schule`, `Pause`, `Lernen`, `Essen`, `Gym` oder leer

Leere Zellen werden automatisch als `Freizeit` interpretiert.

## Lokal testen

Einfach `index.html` im Browser öffnen.

## Auf GitHub hochladen

1. Neues Repository anlegen, z. B. `wochenplan-live`
2. Alle Dateien aus diesem Ordner hochladen
3. In GitHub: `Settings` → `Pages`
4. Bei **Build and deployment** `Deploy from a branch` wählen
5. Branch `main` und Ordner `/root` auswählen
6. Speichern
7. Nach kurzer Zeit ist die Seite online

## Datei benutzen

Nach dem Öffnen der Seite:
1. Excel-Datei hochladen
2. Die Seite erkennt automatisch den heutigen Wochentag
3. Falls heute Wochenende ist oder du testen willst, Tag manuell auswählen

## Wichtige Hinweise

- Für GitHub Pages am besten `.xlsx` verwenden
- Die erste Spalte muss `Zeit` heißen
- Die Tagesnamen müssen exakt `Montag` bis `Freitag` sein
