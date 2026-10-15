import { describe, expect, it } from "vitest";
import {
  createGame,
  DEFAULT_CONFIG,
  placeFood,
  queueTurn,
  step,
  type GameState,
  type Point,
} from "./game";

const rng0 = () => 0;

/** Spielstand mit fester Schlange und festem Futter. */
function game(snake: Point[], food: Point | null, overrides: Partial<GameState> = {}): GameState {
  return { ...createGame(DEFAULT_CONFIG, rng0), snake, food, ...overrides };
}

describe("createGame", () => {
  it("startet mit 3 Segmenten in der Mitte, nach rechts, Punktestand 0", () => {
    const g = createGame(DEFAULT_CONFIG, rng0);
    expect(g.snake).toEqual([
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ]);
    expect(g.direction).toBe("right");
    expect(g.score).toBe(0);
    expect(g.tickMs).toBe(DEFAULT_CONFIG.startTickMs);
    expect(g.alive).toBe(true);
  });

  it("legt das Futter nicht auf die Schlange (F-02)", () => {
    for (const r of [0, 0.25, 0.5, 0.75, 0.999]) {
      const g = createGame(DEFAULT_CONFIG, () => r);
      expect(g.snake).not.toContainEqual(g.food);
    }
  });
});

describe("placeFood", () => {
  it("wählt nur freie Felder", () => {
    const snake = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ];
    expect(placeFood(snake, 2, rng0)).toEqual({ x: 1, y: 1 });
  });

  it("gibt null zurück, wenn kein Feld frei ist", () => {
    const snake = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ];
    expect(placeFood(snake, 2, rng0)).toBeNull();
  });
});

describe("step – Bewegung (F-01)", () => {
  it("bewegt die Schlange um ein Feld in die aktuelle Richtung", () => {
    const g = game(
      [
        { x: 5, y: 5 },
        { x: 4, y: 5 },
      ],
      { x: 0, y: 0 },
    );
    const { state, event } = step(g, rng0);
    expect(event).toBe("moved");
    expect(state.snake).toEqual([
      { x: 6, y: 5 },
      { x: 5, y: 5 },
    ]);
  });
});

describe("step – Fressen (F-03, F-06)", () => {
  it("wächst, zählt einen Punkt und wird schneller", () => {
    const g = game(
      [
        { x: 5, y: 5 },
        { x: 4, y: 5 },
      ],
      { x: 6, y: 5 },
    );
    const { state, event } = step(g, rng0);
    expect(event).toBe("ate");
    expect(state.snake).toHaveLength(3);
    expect(state.score).toBe(1);
    expect(state.tickMs).toBe(DEFAULT_CONFIG.startTickMs - DEFAULT_CONFIG.tickStepMs);
    expect(state.snake).not.toContainEqual(state.food);
  });

  it("wird nicht schneller als die Höchstgeschwindigkeit", () => {
    const g = game(
      [
        { x: 5, y: 5 },
        { x: 4, y: 5 },
      ],
      { x: 6, y: 5 },
      { tickMs: DEFAULT_CONFIG.minTickMs },
    );
    expect(step(g, rng0).state.tickMs).toBe(DEFAULT_CONFIG.minTickMs);
  });

  it("meldet einen Sieg, wenn das Spielfeld voll ist", () => {
    const config = { ...DEFAULT_CONFIG, gridSize: 2 };
    const g = game(
      [
        { x: 0, y: 1 },
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ],
      { x: 1, y: 1 },
      { config, direction: "right" },
    );
    const { state, event } = step(g, rng0);
    expect(event).toBe("won");
    expect(state.alive).toBe(false);
  });
});

describe("step – Game Over", () => {
  it.each([
    ["rechts", { x: 19, y: 5 }, "right"],
    ["links", { x: 0, y: 5 }, "left"],
    ["oben", { x: 5, y: 0 }, "up"],
    ["unten", { x: 5, y: 19 }, "down"],
  ] as const)("an der Wand %s (F-04)", (_, head, direction) => {
    const g = game([head], { x: 10, y: 10 }, { direction });
    const { state, event } = step(g, rng0);
    expect(event).toBe("died");
    expect(state.alive).toBe(false);
  });

  it("bei Kollision mit sich selbst (F-05)", () => {
    // Kopf läuft nach unten in den eigenen Körper
    const g = game(
      [
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 6, y: 6 },
        { x: 5, y: 6 },
        { x: 4, y: 6 },
      ],
      { x: 0, y: 0 },
      { direction: "down" },
    );
    expect(step(g, rng0).event).toBe("died");
  });

  it("nicht, wenn der Kopf auf das gerade frei werdende Schwanzfeld zieht", () => {
    const g = game(
      [
        { x: 5, y: 5 },
        { x: 6, y: 5 },
        { x: 6, y: 6 },
        { x: 5, y: 6 },
      ],
      { x: 0, y: 0 },
      { direction: "down" },
    );
    expect(step(g, rng0).event).toBe("moved");
  });

  it("ein totes Spiel bewegt sich nicht mehr", () => {
    const g = game([{ x: 5, y: 5 }], null, { alive: false });
    expect(step(g, rng0).state).toBe(g);
  });
});

describe("queueTurn (F-07, F-08)", () => {
  const base = () =>
    game(
      [
        { x: 5, y: 5 },
        { x: 4, y: 5 },
      ],
      { x: 0, y: 0 },
    );

  it("ignoriert eine 180°-Wende", () => {
    expect(queueTurn(base(), "left").queuedTurns).toEqual([]);
  });

  it("ignoriert die aktuelle Richtung", () => {
    expect(queueTurn(base(), "right").queuedTurns).toEqual([]);
  });

  it("puffert schnelle Doppelkurven und führt sie nacheinander aus", () => {
    let g = queueTurn(base(), "up");
    g = queueTurn(g, "left");
    expect(g.queuedTurns).toEqual(["up", "left"]);

    g = step(g, rng0).state;
    expect(g.snake[0]).toEqual({ x: 5, y: 4 });
    g = step(g, rng0).state;
    expect(g.snake[0]).toEqual({ x: 4, y: 4 });
  });

  it("prüft die Umkehr gegen die zuletzt gepufferte Richtung", () => {
    let g = queueTurn(base(), "up");
    g = queueTurn(g, "down");
    expect(g.queuedTurns).toEqual(["up"]);
  });

  it("begrenzt den Puffer", () => {
    let g = base();
    for (const d of ["up", "left", "down", "right", "up"] as const) g = queueTurn(g, d);
    expect(g.queuedTurns).toHaveLength(DEFAULT_CONFIG.maxQueuedTurns);
  });
});
