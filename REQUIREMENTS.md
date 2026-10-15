# Snake – Anforderungen

Status: **Entwurf v0.1** · Stand: 2026-10-15

## 1. Ziel

Ein klassisches Snake-Spiel als moderne Web-App, spielbar auf Desktop und Smartphone, das als statische Seite auf einem beliebigen Webserver gehostet werden kann.

## 2. Funktionale Anforderungen

### Spielregeln
| ID | Anforderung |
|---|---|
| F-01 | Die Schlange bewegt sich auf einem quadratischen Raster kontinuierlich in die aktuelle Richtung. |
| F-02 | Auf dem Spielfeld liegt immer genau ein Futter, zufällig auf einem freien Feld. |
| F-03 | Frisst die Schlange das Futter, wächst sie um ein Segment und der Punktestand steigt um 1. |
| F-04 | Berührt die Schlange die Wand, ist das Spiel vorbei (Game Over). |
| F-05 | Berührt die Schlange sich selbst, ist das Spiel vorbei. |
| F-06 | Mit jedem gefressenen Futter wird das Spiel schneller, bis zu einer Höchstgeschwindigkeit. |
| F-07 | Die Schlange kann nicht direkt in die entgegengesetzte Richtung umkehren. |
| F-08 | Schnelle Eingaben hintereinander gehen nicht verloren (Eingabepuffer), z. B. für enge Kurven. |

### Spielablauf
| ID | Anforderung |
|---|---|
| F-10 | Startbildschirm mit Start-Button. |
| F-11 | Game-Over-Bildschirm mit erreichter Punktzahl und „Nochmal“-Button. |
| F-12 | Das Spiel lässt sich pausieren und fortsetzen. |
| F-13 | Das Spiel pausiert automatisch, wenn der Browser-Tab in den Hintergrund geht. |
| F-14 | Aktueller Punktestand und Rekord werden während des Spiels angezeigt. |
| F-15 | Der Rekord wird lokal im Browser gespeichert und bleibt nach dem Neuladen erhalten. |

### Steuerung
| ID | Anforderung |
|---|---|
| F-20 | Desktop: Steuerung mit den Pfeiltasten. |
| F-21 | Desktop: Leertaste = Pause/Weiter bzw. Start, Enter = Neustart. |
| F-22 | Mobil: Steuerung per Wischgeste auf dem Spielfeld (hoch/runter/links/rechts). |
| F-23 | Mobil: Wischen auf dem Spielfeld scrollt bzw. zoomt die Seite nicht. |

## 3. Nicht-funktionale Anforderungen

| ID | Anforderung |
|---|---|
| N-01 | **Optik:** modernes, minimalistisches Design (dunkles Farbschema, abgerundete Formen, flüssige Darstellung). |
| N-02 | **Responsive:** nutzbar ab 320 px Breite bis Desktop; das Spielfeld bleibt quadratisch und passt ohne Scrollen in den Bildschirm. |
| N-03 | **Browser:** aktuelle Versionen von Chrome, Edge, Firefox, Safari (inkl. iOS Safari, Android Chrome). |
| N-04 | **Performance:** flüssige Darstellung mit 60 fps; Spieltempo unabhängig von der Bildwiederholrate. |
| N-05 | **Scharfe Darstellung** auf hochauflösenden Displays (Retina / devicePixelRatio). |
| N-06 | **Hosting:** Ergebnis ist eine rein statische Seite (HTML/CSS/JS), ohne Backend, auf jedem Webserver hostbar. |
| N-07 | **Qualität:** Die Spiellogik ist von der Darstellung getrennt und mit automatischen Tests abgedeckt. |
| N-08 | **Sprache der Oberfläche:** Deutsch. |

## 4. Nicht im Umfang (vorerst)

Schwierigkeitsstufen, Hindernisse/Level, Sonder-Items, Sound, Online-Highscore-Liste, Mehrspieler, Wrap-around an der Wand.

## 5. Technik (Vorschlag)

| Bereich | Wahl | Begründung |
|---|---|---|
| Sprache | TypeScript | Typprüfung, weniger Fehler beim Vibe-Coden |
| Build / Dev-Server | Vite | schneller Dev-Server mit Live-Reload, erzeugt statischen `dist/`-Ordner für den Webserver |
| Rendering | HTML5 Canvas | einfach, performant, kein Framework nötig |
| Tests | Vitest | Unit-Tests für die Spiellogik |
| Code-Stil | ESLint + Prettier | einheitlicher Code |
| Laufzeit (nur Entwicklung) | Node.js LTS | wird für Vite/Vitest benötigt |

## 6. Offene Punkte

- Ziel-Webserver: eigener Server, GitHub Pages oder anderer Hoster? (beeinflusst später den Deploy-Schritt)
