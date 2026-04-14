import { createRng, randomInt } from "./random";
import { Simulation } from "./simulation";
import { type PresetDefinition, type PresetId } from "./types";

export const PRESETS: Record<PresetId, PresetDefinition> = {
  foundry: {
    id: "foundry",
    label: "Foundry",
    description: "Dense metal scaffolds, hot pockets, and unstable sand charges.",
    defaults: {
      reactionRate: 0.65,
      windBias: 0.1,
    },
  },
  corrosion: {
    id: "corrosion",
    label: "Corrosion",
    description: "Acid rain chews through structures while stone slowly gives way.",
    defaults: {
      reactionRate: 0.82,
      windBias: -0.15,
    },
  },
  "storm-circuit": {
    id: "storm-circuit",
    label: "Storm Circuit",
    description: "Metal veins conduct sparks through wet lowlands and vapor clouds.",
    defaults: {
      reactionRate: 0.78,
      windBias: 0.4,
    },
  },
  "crystal-bloom": {
    id: "crystal-bloom",
    label: "Crystal Bloom",
    description: "Crystal gardens slowly colonize ruins and condensing vapor banks.",
    defaults: {
      reactionRate: 0.58,
      windBias: -0.05,
    },
  },
};

function buildGround(simulation: Simulation): void {
  const { width, height } = simulation.config;
  simulation.fillRect(0, height - 4, width, 4, "stone");
  simulation.fillRect(0, height - 1, width, 1, "metal");
}

export function seedPreset(simulation: Simulation, presetId: PresetId): void {
  simulation.clear();
  const rng = createRng(`${simulation.getSeed()}:${presetId}`);
  const { width, height } = simulation.config;
  buildGround(simulation);

  switch (presetId) {
    case "foundry":
      simulation.scatter("sand", 0.1, 6, height - 8);
      simulation.scatter("smoke", 0.035, 0, Math.floor(height / 4));
      for (let x = 8; x < width - 8; x += 14) {
        simulation.fillRect(x, height - 14, 3, 10, "metal");
        simulation.fillCircle(x + 1, height - 15, 2, "fire");
      }
      for (let index = 0; index < 10; index += 1) {
        simulation.fillCircle(randomInt(rng, 6, width - 6), randomInt(rng, 6, height - 12), 2, "sand");
      }
      break;
    case "corrosion":
      simulation.scatter("water", 0.05, 0, Math.floor(height / 2));
      for (let x = 6; x < width - 6; x += 18) {
        simulation.fillRect(x, height - 18, 4, 14, "stone");
        simulation.fillCircle(x + 2, height - 20, 3, "acid");
      }
      simulation.scatter("acid", 0.025, 4, Math.floor(height / 2));
      break;
    case "storm-circuit":
      simulation.scatter("water", 0.08, Math.floor(height / 2), height - 6);
      simulation.scatter("steam", 0.03, 0, Math.floor(height / 3));
      for (let y = 8; y < height - 10; y += 10) {
        simulation.fillRect(6, y, width - 12, 2, "metal");
      }
      for (let index = 0; index < 7; index += 1) {
        simulation.setCell(randomInt(rng, 8, width - 8), randomInt(rng, 6, height - 10), "spark");
      }
      break;
    case "crystal-bloom":
      simulation.scatter("water", 0.04, Math.floor(height / 3), height - 5);
      simulation.scatter("steam", 0.05, 0, Math.floor(height / 3));
      for (let index = 0; index < 9; index += 1) {
        const baseX = randomInt(rng, 6, width - 6);
        const baseY = randomInt(rng, Math.floor(height / 3), height - 12);
        simulation.fillCircle(baseX, baseY, 3, "stone");
        simulation.setCell(baseX, baseY - 1, "crystal");
      }
      break;
  }
}
