import { PRESET_IDS, type PresetId, type SerializedSetupState } from "./types";

const DEFAULT_STATE: SerializedSetupState = {
  seed: "terrarium-001",
  preset: "river-garden",
  reactionRate: 0.72,
  windBias: 0.08,
  speed: 1,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isPresetId(value: string | null): value is PresetId {
  return value !== null && PRESET_IDS.includes(value as PresetId);
}

export function getDefaultSetupState(): SerializedSetupState {
  return { ...DEFAULT_STATE };
}

export function encodeSetupState(state: SerializedSetupState): string {
  const params = new URLSearchParams();
  params.set("seed", state.seed);
  params.set("preset", state.preset);
  params.set("reactionRate", state.reactionRate.toFixed(2));
  params.set("windBias", state.windBias.toFixed(2));
  params.set("speed", state.speed.toFixed(2));
  return params.toString();
}

export function decodeSetupState(search: string): SerializedSetupState {
  const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  const preset = isPresetId(params.get("preset")) ? (params.get("preset") as PresetId) : DEFAULT_STATE.preset;
  const reactionRate = clamp(Number(params.get("reactionRate") ?? DEFAULT_STATE.reactionRate), 0, 1);
  const windBias = clamp(Number(params.get("windBias") ?? DEFAULT_STATE.windBias), -1, 1);
  const speed = clamp(Number(params.get("speed") ?? DEFAULT_STATE.speed), 0.25, 3);
  const seed = (params.get("seed") ?? DEFAULT_STATE.seed).trim() || DEFAULT_STATE.seed;

  return {
    seed,
    preset,
    reactionRate: Number.isFinite(reactionRate) ? reactionRate : DEFAULT_STATE.reactionRate,
    windBias: Number.isFinite(windBias) ? windBias : DEFAULT_STATE.windBias,
    speed: Number.isFinite(speed) ? speed : DEFAULT_STATE.speed,
  };
}
