import { type CellState } from "./types";
import { Simulation } from "./simulation";

const PALETTES: Record<CellState["material"], [number, number, number]> = {
  empty: [9, 11, 16],
  sand: [206, 171, 96],
  water: [63, 133, 214],
  stone: [92, 97, 111],
  metal: [146, 163, 178],
  acid: [121, 214, 99],
  fire: [255, 125, 57],
  smoke: [114, 110, 120],
  steam: [190, 208, 222],
  spark: [255, 231, 151],
  crystal: [112, 241, 232],
};

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, value));
}

function hashNoise(x: number, y: number, tick: number): number {
  const value = Math.sin(x * 12.9898 + y * 78.233 + tick * 0.17) * 43758.5453;
  return value - Math.floor(value);
}

export class Renderer {
  readonly canvas: HTMLCanvasElement;

  private readonly context: CanvasRenderingContext2D;
  private imageData: ImageData;

  constructor(canvas: HTMLCanvasElement, simulation: Simulation) {
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas 2D context is unavailable.");
    }

    this.canvas = canvas;
    this.context = context;
    this.imageData = context.createImageData(simulation.config.width, simulation.config.height);
    this.resize(simulation);
  }

  resize(simulation: Simulation): void {
    this.canvas.width = simulation.config.width;
    this.canvas.height = simulation.config.height;
    this.canvas.style.imageRendering = "pixelated";
    this.canvas.style.width = `${simulation.config.width * simulation.config.pixelScale}px`;
    this.canvas.style.height = `${simulation.config.height * simulation.config.pixelScale}px`;
    this.imageData = this.context.createImageData(simulation.config.width, simulation.config.height);
  }

  render(simulation: Simulation): void {
    const pixels = this.imageData.data;
    let pixelIndex = 0;

    simulation.forEachCell((x, y, cell) => {
      const [red, green, blue] = PALETTES[cell.material];
      const noise = hashNoise(x, y, simulation.tick);
      let tint = Math.floor((noise - 0.5) * 16);

      if (cell.material === "fire") {
        tint += Math.floor(Math.sin(simulation.tick * 0.35 + x * 0.7) * 24);
      } else if (cell.material === "spark") {
        tint += Math.floor(Math.sin(simulation.tick * 0.75 + y) * 40) + 12;
      } else if (cell.material === "steam") {
        tint += 10;
      } else if (cell.material === "empty") {
        tint = Math.floor(noise * 6);
      }

      pixels[pixelIndex] = clampByte(red + tint);
      pixels[pixelIndex + 1] = clampByte(green + tint);
      pixels[pixelIndex + 2] = clampByte(blue + tint);
      pixels[pixelIndex + 3] = 255;
      pixelIndex += 4;
    });

    this.context.putImageData(this.imageData, 0, 0);
  }
}
