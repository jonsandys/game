export const MATERIAL_TYPES = [
  "empty",
  "sand",
  "water",
  "stone",
  "metal",
  "acid",
  "fire",
  "smoke",
  "steam",
  "spark",
  "crystal",
  "lava",
  "ember",
  "plant",
  "spring",
  "lava-source",
] as const;

export type MaterialType = (typeof MATERIAL_TYPES)[number];

export interface CellState {
  material: MaterialType;
  life: number;
}

export interface WorldConfig {
  width: number;
  height: number;
  pixelScale: number;
}

export interface SimulationParams {
  reactionRate: number;
  windBias: number;
  speed: number;
}

export const PRESET_IDS = [
  "river-garden",
  "hanging-aquifer",
  "magma-falls",
  "overgrown-foundry",
  "storm-circuit",
  "crystal-delta",
  "acid-marsh",
  "ember-terrace",
] as const;

export type PresetId = (typeof PRESET_IDS)[number];

export const BRUSH_TOOLS = ["material", "erase", "ignite", "spark"] as const;

export type BrushTool = (typeof BRUSH_TOOLS)[number];

export interface BrushState {
  tool: BrushTool;
  material: MaterialType;
  size: number;
}

export const PAINTABLE_MATERIALS: MaterialType[] = [
  "sand",
  "water",
  "stone",
  "metal",
  "acid",
  "fire",
  "steam",
  "crystal",
  "lava",
  "plant",
  "spring",
  "lava-source",
];

export interface SerializedSetupState {
  seed: string;
  preset: PresetId;
  reactionRate: number;
  windBias: number;
  speed: number;
}

export interface PointerCell {
  x: number;
  y: number;
}

export interface PresetDefinition {
  id: PresetId;
  label: string;
  description: string;
  defaults: Pick<SimulationParams, "reactionRate" | "windBias">;
}
