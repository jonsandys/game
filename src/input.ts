import { Simulation } from "./simulation";
import { type BrushState, type PointerCell, type WorldConfig } from "./types";

export function getCellFromClientPoint(
  clientX: number,
  clientY: number,
  rect: DOMRect | { left: number; top: number; width: number; height: number },
  world: WorldConfig,
): PointerCell {
  const relativeX = (clientX - rect.left) / rect.width;
  const relativeY = (clientY - rect.top) / rect.height;

  return {
    x: Math.max(0, Math.min(world.width - 1, Math.floor(relativeX * world.width))),
    y: Math.max(0, Math.min(world.height - 1, Math.floor(relativeY * world.height))),
  };
}

function interpolateCells(from: PointerCell, to: PointerCell): PointerCell[] {
  const deltaX = to.x - from.x;
  const deltaY = to.y - from.y;
  const steps = Math.max(Math.abs(deltaX), Math.abs(deltaY), 1);
  const cells: PointerCell[] = [];

  for (let step = 0; step <= steps; step += 1) {
    cells.push({
      x: Math.round(from.x + (deltaX * step) / steps),
      y: Math.round(from.y + (deltaY * step) / steps),
    });
  }

  return cells;
}

function applyBrushPoint(simulation: Simulation, point: PointerCell, brush: BrushState): void {
  for (let y = point.y - brush.size; y <= point.y + brush.size; y += 1) {
    for (let x = point.x - brush.size; x <= point.x + brush.size; x += 1) {
      const deltaX = x - point.x;
      const deltaY = y - point.y;
      if (deltaX * deltaX + deltaY * deltaY > brush.size * brush.size) {
        continue;
      }

      switch (brush.tool) {
        case "erase":
          simulation.setCell(x, y, "empty", 0);
          break;
        case "ignite":
          simulation.applyIgnite(x, y);
          break;
        case "spark":
          simulation.applySpark(x, y);
          break;
        case "material":
          simulation.setCell(x, y, brush.material);
          break;
      }
    }
  }
}

export function applyBrushStroke(
  simulation: Simulation,
  from: PointerCell,
  to: PointerCell,
  brush: BrushState,
): void {
  for (const point of interpolateCells(from, to)) {
    applyBrushPoint(simulation, point, brush);
  }
}

export function attachInputController(options: {
  canvas: HTMLCanvasElement;
  getSimulation: () => Simulation;
  getBrush: () => BrushState;
}): () => void {
  const { canvas, getSimulation, getBrush } = options;
  let active = false;
  let previousCell: PointerCell | null = null;

  const resolveCell = (event: PointerEvent): PointerCell =>
    getCellFromClientPoint(
      event.clientX,
      event.clientY,
      canvas.getBoundingClientRect(),
      getSimulation().config,
    );

  const paint = (cell: PointerCell): void => {
    applyBrushStroke(getSimulation(), previousCell ?? cell, cell, getBrush());
    previousCell = cell;
  };

  const onPointerDown = (event: PointerEvent): void => {
    active = true;
    canvas.setPointerCapture(event.pointerId);
    paint(resolveCell(event));
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (active) {
      paint(resolveCell(event));
    }
  };

  const stopPainting = (): void => {
    active = false;
    previousCell = null;
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", stopPainting);
  canvas.addEventListener("pointercancel", stopPainting);
  canvas.addEventListener("pointerleave", stopPainting);

  return () => {
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", stopPainting);
    canvas.removeEventListener("pointercancel", stopPainting);
    canvas.removeEventListener("pointerleave", stopPainting);
  };
}
