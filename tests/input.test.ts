import { applyBrushStroke, getCellFromClientPoint } from "../src/input";
import { Simulation } from "../src/simulation";
import { type BrushState, type SimulationParams, type WorldConfig } from "../src/types";

const config: WorldConfig = {
  width: 10,
  height: 10,
  pixelScale: 4,
};

const params: SimulationParams = {
  reactionRate: 1,
  windBias: 0,
  speed: 1,
};

describe("input helpers", () => {
  it("maps pointer coordinates to cell coordinates", () => {
    const cell = getCellFromClientPoint(55, 45, { left: 0, top: 0, width: 100, height: 100 }, config);
    expect(cell).toEqual({ x: 5, y: 4 });
  });

  it("paints and erases through brush strokes", () => {
    const simulation = new Simulation(config, "input", params);
    const paintBrush: BrushState = { tool: "material", material: "sand", size: 1 };
    const eraseBrush: BrushState = { tool: "erase", material: "sand", size: 0 };

    applyBrushStroke(simulation, { x: 2, y: 2 }, { x: 4, y: 2 }, paintBrush);
    expect(simulation.getCell(3, 2).material).toBe("sand");

    applyBrushStroke(simulation, { x: 3, y: 2 }, { x: 3, y: 2 }, eraseBrush);
    expect(simulation.getCell(3, 2).material).toBe("empty");
  });
});
