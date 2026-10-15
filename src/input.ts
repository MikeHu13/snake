import type { Direction } from "./game";

export interface InputHandlers {
  onTurn(dir: Direction): void;
  /** Leertaste */
  onPrimary(): void;
  /** Enter */
  onRestart(): void;
}

const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

/** Mindestweg in px, ab dem eine Wischbewegung als Richtungswechsel zählt. */
const SWIPE_THRESHOLD = 24;

export function bindInput(swipeArea: HTMLElement, handlers: InputHandlers): void {
  // F-20, F-21: Tastatur
  window.addEventListener("keydown", (e) => {
    const dir = KEY_TO_DIRECTION[e.key];
    if (dir) {
      e.preventDefault();
      handlers.onTurn(dir);
    } else if (e.key === " ") {
      e.preventDefault();
      if (!e.repeat) handlers.onPrimary();
    } else if (e.key === "Enter") {
      e.preventDefault();
      handlers.onRestart();
    }
  });

  // F-22: Wischen. Die Richtung wird schon während der Bewegung erkannt
  // (nicht erst beim Loslassen); danach startet die Messung neu, so dass
  // mehrere Kurven in einer Wischbewegung möglich sind.
  let origin: { x: number; y: number; id: number } | null = null;

  swipeArea.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse") return;
    origin = { x: e.clientX, y: e.clientY, id: e.pointerId };
  });

  swipeArea.addEventListener("pointermove", (e) => {
    if (!origin || e.pointerId !== origin.id) return;
    const dx = e.clientX - origin.x;
    const dy = e.clientY - origin.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return;

    if (Math.abs(dx) > Math.abs(dy)) handlers.onTurn(dx > 0 ? "right" : "left");
    else handlers.onTurn(dy > 0 ? "down" : "up");
    origin = { x: e.clientX, y: e.clientY, id: e.pointerId };
  });

  const end = (e: PointerEvent) => {
    if (origin && e.pointerId === origin.id) origin = null;
  };
  swipeArea.addEventListener("pointerup", end);
  swipeArea.addEventListener("pointercancel", end);
}
