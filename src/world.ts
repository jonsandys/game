import { PRESETS, seedPreset } from "./presets";
import { Simulation } from "./simulation";
import { type SerializedSetupState, type WorldConfig } from "./types";

export function createWorldConfig(viewportWidth: number): WorldConfig {
  const mobile = viewportWidth < 840;
  return {
    width: mobile ? 88 : 132,
    height: mobile ? 64 : 84,
    pixelScale: mobile ? 5 : 6,
  };
}

export function createSimulationFromSetup(
  config: WorldConfig,
  setup: SerializedSetupState,
): Simulation {
  const defaults = PRESETS[setup.preset].defaults;
  const simulation = new Simulation(config, setup.seed, {
    reactionRate: setup.reactionRate ?? defaults.reactionRate,
    windBias: setup.windBias ?? defaults.windBias,
    speed: setup.speed,
  });

  seedPreset(simulation, setup.preset);
  return simulation;
}
