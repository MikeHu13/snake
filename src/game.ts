// Reine Spiellogik ohne DOM – dadurch vollständig testbar.

export type Direction = "up" | "down" | "left" | "right";

export interface Point {
  x: number;
  y: number;
}

export interface GameConfig {
  /** Felder pro Seite */
  gridSize: number;
  /** Dauer eines Schritts zu Beginn (ms) */
  startTickMs: number;
  /** kürzeste Schrittdauer (= Höchstgeschwindigkeit) */
  minTickMs: number;
  /** Beschleunigung pro gefressenem Futter (ms) */
  tickStepMs: number;
  /** maximal gepufferte Richtungswechsel */
  maxQueuedTurns: number;
}

export const DEFAULT_CONFIG: GameConfig = {
  gridSize: 20,
  startTickMs: 140,
  minTickMs: 65,
  tickStepMs: 3,
  maxQueuedTurns: 3,
};

export interface GameState {
  config: GameConfig;
  /** Kopf ist snake[0] */
  snake: Point[];
  direction: Direction;
  queuedTurns: Direction[];
  /** null, wenn das Spielfeld komplett gefüllt ist */
  food: Point | null;
  score: number;
  tickMs: number;
  alive: boolean;
}

export type StepEvent = "moved" | "ate" | "died" | "won";

export type Rng = () => number;

const VECTORS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

export function createGame(config: GameConfig = DEFAULT_CONFIG, rng: Rng = Math.random): GameState {
  const mid = Math.floor(config.gridSize / 2);
  const snake = [
    { x: mid, y: mid },
    { x: mid - 1, y: mid },
    { x: mid - 2, y: mid },
  ];
  return {
    config,
    snake,
    direction: "right",
    queuedTurns: [],
    food: placeFood(snake, config.gridSize, rng),
    score: 0,
    tickMs: config.startTickMs,
    alive: true,
  };
}

/** Wählt ein zufälliges freies Feld, oder null, wenn keins frei ist. */
export function placeFood(snake: Point[], gridSize: number, rng: Rng): Point | null {
  const occupied = new Set(snake.map((p) => p.y * gridSize + p.x));
  const free: Point[] = [];
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (!occupied.has(y * gridSize + x)) free.push({ x, y });
    }
  }
  if (free.length === 0) return null;
  return free[Math.floor(rng() * free.length)] ?? null;
}

/**
 * Puffert einen Richtungswechsel. Ignoriert 180°-Wenden und Wiederholungen,
 * jeweils bezogen auf die zuletzt gepufferte Richtung.
 */
export function queueTurn(state: GameState, dir: Direction): GameState {
  if (!state.alive) return state;
  const last = state.queuedTurns.at(-1) ?? state.direction;
  if (dir === last || dir === OPPOSITE[last]) return state;
  if (state.queuedTurns.length >= state.config.maxQueuedTurns) return state;
  return { ...state, queuedTurns: [...state.queuedTurns, dir] };
}

/** Führt einen Spielschritt aus. */
export function step(state: GameState, rng: Rng = Math.random): { state: GameState; event: StepEvent } {
  if (!state.alive) return { state, event: "died" };

  const [nextDir = state.direction, ...rest] = state.queuedTurns;
  const v = VECTORS[nextDir];
  const head = state.snake[0]!;
  const newHead = { x: head.x + v.x, y: head.y + v.y };
  const { gridSize } = state.config;

  const eats = state.food !== null && newHead.x === state.food.x && newHead.y === state.food.y;
  // Ohne Fressen rückt der Schwanz nach – sein Feld wird also frei.
  const body = eats ? state.snake : state.snake.slice(0, -1);

  const hitsWall =
    newHead.x < 0 || newHead.y < 0 || newHead.x >= gridSize || newHead.y >= gridSize;
  const hitsSelf = body.some((p) => p.x === newHead.x && p.y === newHead.y);

  if (hitsWall || hitsSelf) {
    return { state: { ...state, direction: nextDir, queuedTurns: rest, alive: false }, event: "died" };
  }

  const snake = [newHead, ...body];

  if (!eats) {
    return { state: { ...state, snake, direction: nextDir, queuedTurns: rest }, event: "moved" };
  }

  const food = placeFood(snake, gridSize, rng);
  const next: GameState = {
    ...state,
    snake,
    direction: nextDir,
    queuedTurns: rest,
    food,
    score: state.score + 1,
    tickMs: Math.max(state.config.minTickMs, state.tickMs - state.config.tickStepMs),
    alive: food !== null,
  };
  return { state: next, event: food === null ? "won" : "ate" };
}
