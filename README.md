# Snake

Das klassische Snake-Spiel als moderne Web-App – spielbar am PC (Pfeiltasten) und auf dem Handy (Wischen).

Anforderungen: [REQUIREMENTS.md](REQUIREMENTS.md)

## Entwicklung

Voraussetzung: Node.js (LTS)

```bash
npm install       # Abhängigkeiten installieren
npm run dev       # Dev-Server mit Live-Reload auf http://localhost:5173
npm test          # Unit-Tests der Spiellogik
npm run lint      # ESLint
npm run build     # Typprüfung + Produktions-Build nach dist/
```

## Hosting

`npm run build` erzeugt den Ordner `dist/` – eine rein statische Seite.
Den Inhalt einfach auf einen beliebigen Webserver kopieren (auch in einen Unterordner).

## Aufbau

| Datei | Inhalt |
|---|---|
| `src/game.ts` | Spiellogik ohne DOM (Bewegung, Kollision, Futter, Tempo) |
| `src/game.test.ts` | Tests der Spiellogik |
| `src/renderer.ts` | Zeichnen auf dem Canvas inkl. flüssiger Interpolation |
| `src/input.ts` | Tastatur und Wischgesten |
| `src/storage.ts` | Rekord im `localStorage` |
| `src/main.ts` | Spielablauf, Spielschleife, Oberfläche |
