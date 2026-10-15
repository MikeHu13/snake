import type { Direction, GameState, Point } from "./game";

interface Palette {
  surface: string;
  surfaceAlt: string;
  head: string;
  tail: string;
  food: string;
  eye: string;
}

const EYE_OFFSET: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly palette: Palette;
  private size = 0; // Kantenlänge in Gerätepixeln

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D wird nicht unterstützt");
    this.ctx = ctx;

    const css = getComputedStyle(document.documentElement);
    const v = (name: string) => css.getPropertyValue(name).trim();
    this.palette = {
      surface: v("--surface"),
      surfaceAlt: v("--surface-alt"),
      head: v("--snake-head"),
      tail: v("--snake-tail"),
      food: v("--food"),
      eye: v("--bg"),
    };

    // N-05: Zeichenfläche an Darstellungsgröße × devicePixelRatio anpassen
    new ResizeObserver(() => this.resize()).observe(canvas);
    this.resize();
  }

  private resize(): void {
    const dpr = window.devicePixelRatio || 1;
    this.size = Math.round(this.canvas.clientWidth * dpr);
    this.canvas.width = this.size;
    this.canvas.height = this.size;
  }

  /**
   * Zeichnet den Spielstand. `progress` (0..1) ist der Anteil des laufenden
   * Schritts; die Schlange wird zwischen `prevSnake` und `state.snake`
   * interpoliert, damit sie gleitet statt springt (N-04).
   */
  draw(state: GameState, prevSnake: Point[], progress: number, time: number): void {
    const { ctx, size, palette } = this;
    if (size === 0) return;

    const n = state.config.gridSize;
    const cell = size / n;

    // Hintergrund mit dezentem Schachbrett
    ctx.fillStyle = palette.surface;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = palette.surfaceAlt;
    for (let y = 0; y < n; y++) {
      for (let x = y % 2; x < n; x += 2) {
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }

    if (state.food) this.drawFood(state.food, cell, time);
    this.drawSnake(state, prevSnake, progress, cell);
  }

  private drawFood(food: Point, cell: number, time: number): void {
    const { ctx, palette } = this;
    const pulse = 1 + Math.sin(time / 220) * 0.08;
    const cx = (food.x + 0.5) * cell;
    const cy = (food.y + 0.5) * cell;

    ctx.save();
    ctx.shadowColor = palette.food;
    ctx.shadowBlur = cell * 0.8;
    ctx.fillStyle = palette.food;
    ctx.beginPath();
    ctx.arc(cx, cy, cell * 0.3 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawSnake(state: GameState, prevSnake: Point[], progress: number, cell: number): void {
    const { ctx, palette } = this;
    const t = Math.min(Math.max(progress, 0), 1);

    // Mittelpunkte der Segmente, interpoliert. Segment i wandert von
    // prevSnake[i] nach snake[i]; ein neu angewachsenes Segment bleibt stehen.
    const points = state.snake.map((p, i) => {
      const from = prevSnake[i] ?? p;
      return {
        x: (from.x + (p.x - from.x) * t + 0.5) * cell,
        y: (from.y + (p.y - from.y) * t + 0.5) * cell,
      };
    });

    const width = cell * 0.72;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = width;

    // Körper: Segment für Segment vom Schwanz zum Kopf, mit Farbverlauf
    const count = points.length;
    for (let i = count - 1; i > 0; i--) {
      const a = points[i]!;
      const b = points[i - 1]!;
      ctx.strokeStyle = mix(palette.tail, palette.head, 1 - i / Math.max(count - 1, 1));
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    // Kopf mit leichtem Leuchten
    const head = points[0]!;
    ctx.shadowColor = palette.head;
    ctx.shadowBlur = cell * 0.6;
    ctx.fillStyle = palette.head;
    ctx.beginPath();
    ctx.arc(head.x, head.y, width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Augen in Blickrichtung
    const dir = EYE_OFFSET[state.direction];
    const forward = cell * 0.12;
    const side = cell * 0.17;
    ctx.fillStyle = palette.eye;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(
        head.x + dir.x * forward + dir.y * side * s,
        head.y + dir.y * forward + dir.x * side * s,
        cell * 0.075,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.restore();
  }
}

/** Mischt zwei Hex-Farben (#rrggbb); f = 0 → a, f = 1 → b. */
function mix(a: string, b: string, f: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (shift: number) => {
    const ca = (pa >> shift) & 0xff;
    const cb = (pb >> shift) & 0xff;
    return Math.round(ca + (cb - ca) * f);
  };
  return `rgb(${ch(16)} ${ch(8)} ${ch(0)})`;
}
