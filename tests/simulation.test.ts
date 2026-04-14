import { seedPreset } from "../src/presets";
import { Simulation } from "../src/simulation";
import { type SimulationParams, type WorldConfig } from "../src/types";

const config: WorldConfig = {
  width: 8,
  height: 8,
  pixelScale: 4,
};

const params: SimulationParams = {
  reactionRate: 1,
  windBias: 0,
  speed: 1,
};

describe("simulation", () => {
  it("creates deterministic preset worlds", () => {
    const first = new Simulation(config, "seed-a", params);
    const second = new Simulation(config, "seed-a", params);

    seedPreset(first, "foundry");
    seedPreset(second, "foundry");

    expect(Array.from(first.cloneMaterialBuffer())).toEqual(Array.from(second.cloneMaterialBuffer()));
  });

  it("sand falls and settles", () => {
    const simulation = new Simulation(config, "sand", params);
    simulation.setCell(3, 1, "sand");

    simulation.step();

    expect(simulation.getCell(3, 2).material).toBe("sand");
  });

  it("water flows sideways when blocked", () => {
    const simulation = new Simulation(config, "water", params);
    simulation.setCell(3, 2, "water");
    simulation.setCell(3, 3, "stone");
    simulation.setCell(2, 3, "stone");
    simulation.setCell(4, 3, "stone");

    simulation.step();

    expect(
      simulation.getCell(2, 2).material === "water" || simulation.getCell(4, 2).material === "water",
    ).toBe(true);
  });

  it("acid dissolves metal", () => {
    const simulation = new Simulation(config, "acid", params);
    simulation.setCell(3, 3, "acid");
    simulation.setCell(4, 3, "metal");

    simulation.step();

    expect(simulation.getCell(4, 3).material).not.toBe("metal");
  });

  it("fire turns water into steam", () => {
    const simulation = new Simulation(config, "fire", params);
    simulation.setCell(3, 3, "fire", 3);
    simulation.setCell(3, 2, "water");

    simulation.step();

    expect(simulation.getCell(3, 2).material).toBe("steam");
  });

  it("spark propagates through metal", () => {
    const simulation = new Simulation(config, "spark", params);
    simulation.setCell(3, 3, "spark", 2);
    simulation.setCell(4, 3, "metal");

    simulation.step();
    expect(simulation.getCell(4, 3).material).toBe("spark");
  });

  it("spark has a bounded lifetime when isolated", () => {
    const simulation = new Simulation(config, "spark-isolated", params);
    simulation.setCell(3, 3, "spark", 2);

    simulation.step();
    simulation.step();
    expect(simulation.getCell(3, 3).material).toBe("metal");
  });

  it("crystal grows under constrained rules", () => {
    const simulation = new Simulation(config, "crystal", params);
    simulation.setCell(3, 4, "stone");
    simulation.setCell(3, 3, "crystal", 1);

    simulation.step();

    const nearby = [
      simulation.getCell(2, 2).material,
      simulation.getCell(3, 2).material,
      simulation.getCell(4, 2).material,
      simulation.getCell(2, 3).material,
      simulation.getCell(4, 3).material,
      simulation.getCell(2, 4).material,
      simulation.getCell(4, 4).material,
    ];
    expect(nearby).toContain("crystal");
  });
});
