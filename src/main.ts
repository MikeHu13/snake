import "./style.css";
import { createGame, queueTurn, step, type Direction, type GameState, type Point } from "./game";
import { bindInput } from "./input";
import { Renderer } from "./renderer";
import { loadBest, saveBest } from "./storage";

type Status = "ready" | "running" | "paused" | "over";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const board = $<HTMLDivElement>("board");
const scoreEl = $<HTMLSpanElement>("score");
const bestEl = $<HTMLSpanElement>("best");
const overlay = $<HTMLDivElement>("overlay");
const overlayTitle = $<HTMLParagraphElement>("overlay-title");
const overlayText = $<HTMLParagraphElement>("overlay-text");
const overlayButton = $<HTMLButtonElement>("overlay-button");
const pauseButton = $<HTMLButtonElement>("pause");
const hint = $<HTMLParagraphElement>("hint");

const isTouch = window.matchMedia("(pointer: coarse)").matches;
const renderer = new Renderer($<HTMLCanvasElement>("canvas"));

let state: GameState = createGame();
let prevSnake: Point[] = state.snake;
let status: Status = "ready";
let best = loadBest();
/** seit dem letzten Schritt vergangene Zeit (ms) */
let elapsed = 0;
let lastFrame = performance.now();

bestEl.textContent = String(best);
hint.textContent = isTouch
  ? "Wischen zum Steuern"
  : "Pfeiltasten steuern · Leertaste Pause · Enter Neustart";
showOverlay("Snake", isTouch ? "Wische, um die Richtung zu ändern." : "Steuere mit den Pfeiltasten.", "Start");

// --- Spielablauf ---

function start(): void {
  state = createGame();
  prevSnake = state.snake;
  elapsed = 0;
  setScore(0);
  setStatus("running");
}

function pause(): void {
  if (status !== "running") return;
  setStatus("paused");
  showOverlay("Pause", "", "Weiter");
}

function resume(): void {
  if (status !== "paused") return;
  setStatus("running");
}

function end(won: boolean): void {
  setStatus("over");
  const record = state.score > best;
  if (record) {
    best = state.score;
    bestEl.textContent = String(best);
    saveBest(best);
  }
  if (!won) {
    board.classList.remove("shake");
    void board.offsetWidth; // Animation neu starten
    board.classList.add("shake");
  }
  const title = won ? "Gewonnen!" : record ? "Neuer Rekord!" : "Game Over";
  const points = state.score === 1 ? "1 Punkt" : `${state.score} Punkte`;
  showOverlay(title, points, "Nochmal");
}

function setStatus(next: Status): void {
  status = next;
  pauseButton.hidden = next !== "running";
  if (next === "running") overlay.hidden = true;
}

function setScore(score: number): void {
  scoreEl.textContent = String(score);
  if (score > 0) {
    scoreEl.classList.remove("bump");
    void scoreEl.offsetWidth;
    scoreEl.classList.add("bump");
  }
}

function showOverlay(title: string, text: string, button: string): void {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  overlayButton.textContent = button;
  overlay.hidden = false;
  if (!isTouch) overlayButton.focus({ preventScroll: true });
}

/** Leertaste / Overlay-Button: je nach Zustand starten, pausieren oder fortsetzen. */
function primaryAction(): void {
  if (status === "running") pause();
  else if (status === "paused") resume();
  else start();
}

// --- Spielschleife ---

function frame(now: number): void {
  // große Sprünge (z. B. nach Tab-Wechsel) kappen
  const dt = Math.min(now - lastFrame, 250);
  lastFrame = now;

  if (status === "running") {
    elapsed += dt;
    while (status === "running" && elapsed >= state.tickMs) {
      elapsed -= state.tickMs;
      prevSnake = state.snake;
      const result = step(state);
      state = result.state;
      if (result.event === "ate") setScore(state.score);
      else if (result.event === "died") end(false);
      else if (result.event === "won") {
        setScore(state.score);
        end(true);
      }
    }
  }

  const progress = status === "over" ? 1 : elapsed / state.tickMs;
  renderer.draw(state, prevSnake, progress, now);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// --- Eingabe ---

bindInput(board, {
  onTurn(dir: Direction) {
    if (status === "running") state = queueTurn(state, dir);
  },
  onPrimary: primaryAction,
  onRestart: start,
});

overlayButton.addEventListener("click", (e) => {
  // Tastatur-Klicks (Leertaste/Enter) werden bereits über bindInput behandelt
  if (e.detail === 0) return;
  primaryAction();
  overlayButton.blur();
});

pauseButton.addEventListener("click", () => {
  pause();
  pauseButton.blur();
});

// F-13: automatisch pausieren, wenn der Tab in den Hintergrund geht
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
});
