import { createRng, randomInt } from "./random";
import { Simulation } from "./simulation";
import { type PresetDefinition, type PresetId } from "./types";

export const PRESETS: Record<PresetId, PresetDefinition> = {
  "river-garden": {
    id: "river-garden",
    label: "River Garden",
    description: "Tiered springs feed hanging plants and long-running terraces.",
    defaults: {
      reactionRate: 0.72,
      windBias: 0.08,
    },
  },
  "hanging-aquifer": {
    id: "hanging-aquifer",
    label: "Hanging Aquifer",
    description: "Ceiling springs drip through caverns into a slow, breathing basin.",
    defaults: {
      reactionRate: 0.68,
      windBias: -0.08,
    },
  },
  "magma-falls": {
    id: "magma-falls",
    label: "Magma Falls",
    description: "Lava sources and cold runoff keep birthing steam, stone, and fire.",
    defaults: {
      reactionRate: 0.82,
      windBias: 0.2,
    },
  },
  "overgrown-foundry": {
    id: "overgrown-foundry",
    label: "Overgrown Foundry",
    description: "Metal ruins, slow sparks, and regrowing plant beds compete for space.",
    defaults: {
      reactionRate: 0.7,
      windBias: 0.12,
    },
  },
  "storm-circuit": {
    id: "storm-circuit",
    label: "Storm Circuit",
    description: "Persistent springs energize metal decks into flickering storms.",
    defaults: {
      reactionRate: 0.78,
      windBias: 0.35,
    },
  },
  "crystal-delta": {
    id: "crystal-delta",
    label: "Crystal Delta",
    description: "Watered crystal shelves keep spreading through a shifting river plain.",
    defaults: {
      reactionRate: 0.62,
      windBias: -0.04,
    },
  },
  "acid-marsh": {
    id: "acid-marsh",
    label: "Acid Marsh",
    description: "Corrosive pools gnaw through wetlands while fresh springs fight back.",
    defaults: {
      reactionRate: 0.86,
      windBias: -0.18,
    },
  },
  "ember-terrace": {
    id: "ember-terrace",
    label: "Ember Terrace",
    description: "Fire pockets, lava drips, and plant regrowth create a slow burn ecosystem.",
    defaults: {
      reactionRate: 0.76,
      windBias: 0.05,
    },
  },
};

function buildFloor(simulation: Simulation): void {
  const { width, height } = simulation.config;
  simulation.fillRect(0, height - 4, width, 4, "stone");
}

function addColumn(simulation: Simulation, x: number, width: number, topY: number, material: "stone" | "metal" = "stone"): void {
  simulation.fillRect(x, topY, width, simulation.config.height - topY, material);
}

function addSpring(simulation: Simulation, x: number, y: number): void {
  simulation.setCell(x, y, "spring");
  simulation.setCell(x, y + 1, "water");
}

function addLavaSource(simulation: Simulation, x: number, y: number): void {
  simulation.setCell(x, y, "lava-source");
  simulation.setCell(x, y + 1, "lava");
}

function addPlantPatch(simulation: Simulation, x: number, y: number, radius: number): void {
  simulation.fillCircle(x, y, radius, "plant");
}

export function seedPreset(simulation: Simulation, presetId: PresetId): void {
  simulation.clear();
  const rng = createRng(`${simulation.getSeed()}:${presetId}`);
  const { width, height } = simulation.config;
  buildFloor(simulation);

  switch (presetId) {
    case "river-garden":
      addColumn(simulation, 0, 8, height - 18);
      addColumn(simulation, 22, 10, height - 28);
      addColumn(simulation, Math.max(40, Math.floor(width * 0.38)), 12, height - 22);
      addColumn(simulation, width - 20, 10, height - 32);
      addSpring(simulation, 6, height - 19);
      addSpring(simulation, 28, height - 29);
      addSpring(simulation, width - 14, height - 33);
      addPlantPatch(simulation, 16, height - 10, 4);
      addPlantPatch(simulation, Math.floor(width * 0.44), height - 9, 5);
      addPlantPatch(simulation, width - 20, height - 8, 4);
      simulation.scatter("water", 0.04, Math.floor(height / 2), height - 6);
      break;
    case "hanging-aquifer":
      addColumn(simulation, 14, 8, height - 34);
      addColumn(simulation, 42, 7, height - 24);
      addColumn(simulation, Math.floor(width * 0.5), 9, height - 30);
      addColumn(simulation, width - 18, 8, height - 22);
      addSpring(simulation, 18, 8);
      addSpring(simulation, 44, 12);
      addSpring(simulation, Math.floor(width * 0.56), 10);
      addSpring(simulation, width - 14, 14);
      simulation.fillRect(8, height - 10, width - 16, 2, "water");
      simulation.scatter("steam", 0.04, 0, Math.floor(height / 3));
      break;
    case "magma-falls":
      addColumn(simulation, 10, 12, height - 34);
      addColumn(simulation, 42, 12, height - 24);
      addColumn(simulation, width - 28, 12, height - 30);
      addLavaSource(simulation, 16, height - 35);
      addLavaSource(simulation, 48, height - 25);
      addSpring(simulation, width - 20, height - 31);
      simulation.fillRect(Math.floor(width * 0.55), height - 9, width - Math.floor(width * 0.55), 2, "water");
      addPlantPatch(simulation, width - 18, height - 8, 4);
      break;
    case "overgrown-foundry":
      simulation.fillRect(12, height - 18, width - 24, 2, "metal");
      addColumn(simulation, 18, 6, height - 26, "metal");
      addColumn(simulation, 58, 6, height - 32, "metal");
      addColumn(simulation, width - 18, 6, height - 24, "metal");
      addSpring(simulation, 22, height - 27);
      addSpring(simulation, width - 34, height - 25);
      addPlantPatch(simulation, 34, height - 8, 5);
      addPlantPatch(simulation, width - 34, height - 8, 5);
      simulation.setCell(60, height - 33, "spark");
      simulation.setCell(61, height - 33, "spark");
      break;
    case "storm-circuit":
      for (let y = 10; y < height - 14; y += 10) {
        simulation.fillRect(8, y, width - 16, 2, "metal");
      }
      addSpring(simulation, 12, 8);
      addSpring(simulation, width - 13, 18);
      simulation.scatter("water", 0.05, Math.floor(height / 2), height - 8);
      simulation.scatter("steam", 0.03, 0, Math.floor(height / 3));
      for (let index = 0; index < 10; index += 1) {
        simulation.setCell(randomInt(rng, 10, width - 10), randomInt(rng, 8, height - 12), "spark");
      }
      break;
    case "crystal-delta":
      addColumn(simulation, 8, 10, height - 20);
      addColumn(simulation, 40, 12, height - 26);
      addColumn(simulation, width - 22, 10, height - 18);
      addSpring(simulation, 12, height - 21);
      addSpring(simulation, 46, height - 27);
      addPlantPatch(simulation, width - 16, height - 8, 4);
      simulation.fillRect(0, height - 9, width, 1, "water");
      for (let index = 0; index < 14; index += 1) {
        const baseX = randomInt(rng, 10, width - 10);
        const baseY = randomInt(rng, Math.floor(height / 3), height - 12);
        simulation.setCell(baseX, baseY, "crystal");
      }
      break;
    case "acid-marsh":
      addColumn(simulation, 18, 12, height - 20);
      addColumn(simulation, 62, 12, height - 22);
      addSpring(simulation, 24, height - 21);
      addSpring(simulation, width - 18, height - 17);
      simulation.fillRect(0, height - 8, width, 1, "acid");
      simulation.scatter("acid", 0.03, Math.floor(height / 2), height - 10);
      addPlantPatch(simulation, 46, height - 7, 3);
      addPlantPatch(simulation, width - 14, height - 7, 4);
      break;
    case "ember-terrace":
      addColumn(simulation, 6, 10, height - 24);
      addColumn(simulation, 36, 10, height - 30);
      addColumn(simulation, 72, 10, height - 22);
      addColumn(simulation, width - 20, 10, height - 28);
      addLavaSource(simulation, 12, height - 25);
      addLavaSource(simulation, width - 14, height - 29);
      addSpring(simulation, 42, height - 31);
      addPlantPatch(simulation, 58, height - 8, 4);
      addPlantPatch(simulation, width - 20, height - 8, 5);
      simulation.scatter("ember", 0.015, Math.floor(height / 3), height - 10);
      break;
  }
}
