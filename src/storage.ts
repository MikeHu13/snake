const BEST_KEY = "snake.best";

// localStorage kann fehlen oder werfen (privates Fenster, blockierte Cookies).

export function loadBest(): number {
  try {
    const value = Number(localStorage.getItem(BEST_KEY));
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  } catch {
    return 0;
  }
}

export function saveBest(score: number): void {
  try {
    localStorage.setItem(BEST_KEY, String(score));
  } catch {
    // Rekord geht dann nach dem Neuladen verloren – kein Grund, das Spiel zu stören.
  }
}
