import { attachInputController } from "./input";
import { PRESETS } from "./presets";
import { Renderer } from "./renderer";
import { decodeSetupState, encodeSetupState, getDefaultSetupState } from "./serialization";
import { createSimulationFromSetup, createWorldConfig } from "./world";
import { type BrushState, type PresetId, type SerializedSetupState } from "./types";

interface AppOptions {
  search?: string;
}

interface AppHandle {
  destroy(): void;
}

function randomSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}

function createLabeledRange(
  label: string,
  min: number,
  max: number,
  step: number,
  value: number,
): { wrapper: HTMLLabelElement; input: HTMLInputElement; output: HTMLOutputElement } {
  const wrapper = document.createElement("label");
  wrapper.className = "control-range";
  wrapper.textContent = label;

  const input = document.createElement("input");
  input.type = "range";
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);

  const output = document.createElement("output");
  output.textContent = value.toFixed(2);
  output.value = value.toFixed(2);

  wrapper.append(input, output);
  return { wrapper, input, output };
}

export function createApp(mount: HTMLElement, options: AppOptions = {}): AppHandle {
  let state: SerializedSetupState = {
    ...getDefaultSetupState(),
    ...decodeSetupState(options.search ?? window.location.search),
  };

  let brush: BrushState = {
    tool: "material",
    material: "sand",
    size: 2,
  };
  let playing = true;

  const worldConfig = createWorldConfig(window.innerWidth);
  let simulation = createSimulationFromSetup(worldConfig, state);

  const shell = document.createElement("div");
  shell.className = "app-shell";

  const stage = document.createElement("section");
  stage.className = "stage";
  const canvasWrap = document.createElement("div");
  canvasWrap.className = "canvas-wrap";
  const canvas = document.createElement("canvas");
  canvas.className = "sim-canvas";
  canvasWrap.append(canvas);
  stage.append(canvasWrap);

  const chrome = document.createElement("aside");
  chrome.className = "control-panel";

  const title = document.createElement("div");
  title.className = "title-block";
  title.innerHTML = `
    <p class="eyebrow">Industrial Alchemy Sandbox</p>
    <h1>Watch matter collide, corrode, and bloom.</h1>
    <p class="lede">A living pixel toy that keeps going on its own while you nudge the chemistry.</p>
  `;

  const presetLabel = document.createElement("label");
  presetLabel.className = "control-stack";
  presetLabel.textContent = "Preset";
  const presetSelect = document.createElement("select");
  for (const preset of Object.values(PRESETS)) {
    const option = document.createElement("option");
    option.value = preset.id;
    option.textContent = preset.label;
    option.selected = preset.id === state.preset;
    presetSelect.append(option);
  }
  presetLabel.append(presetSelect);

  const presetDescription = document.createElement("p");
  presetDescription.className = "preset-description";
  presetDescription.textContent = PRESETS[state.preset].description;

  const seedLabel = document.createElement("label");
  seedLabel.className = "control-stack";
  seedLabel.textContent = "Seed";
  const seedInput = document.createElement("input");
  seedInput.type = "text";
  seedInput.value = state.seed;
  seedLabel.append(seedInput);

  const toolLabel = document.createElement("label");
  toolLabel.className = "control-stack";
  toolLabel.textContent = "Tool";
  const toolSelect = document.createElement("select");
  [
    ["material", "Material Brush"],
    ["erase", "Erase"],
    ["ignite", "Ignite"],
    ["spark", "Spark"],
  ].forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    toolSelect.append(option);
  });
  toolLabel.append(toolSelect);

  const materialLabel = document.createElement("label");
  materialLabel.className = "control-stack";
  materialLabel.textContent = "Material";
  const materialSelect = document.createElement("select");
  [
    "sand",
    "water",
    "stone",
    "metal",
    "acid",
    "fire",
    "smoke",
    "steam",
    "crystal",
  ].forEach((material) => {
    const option = document.createElement("option");
    option.value = material;
    option.textContent = material;
    materialSelect.append(option);
  });
  materialLabel.append(materialSelect);

  const brushSize = createLabeledRange("Brush Size", 1, 6, 1, brush.size);
  const speedControl = createLabeledRange("Speed", 0.25, 3, 0.25, state.speed);
  const reactionControl = createLabeledRange("Reaction Rate", 0, 1, 0.05, state.reactionRate);
  const windControl = createLabeledRange("Wind Bias", -1, 1, 0.05, state.windBias);

  const buttons = document.createElement("div");
  buttons.className = "button-row";
  const playButton = document.createElement("button");
  playButton.type = "button";
  playButton.textContent = "Pause";
  const stepButton = document.createElement("button");
  stepButton.type = "button";
  stepButton.textContent = "Step";
  const resetButton = document.createElement("button");
  resetButton.type = "button";
  resetButton.textContent = "Reset";
  const reseedButton = document.createElement("button");
  reseedButton.type = "button";
  reseedButton.textContent = "Random Reseed";
  const shareButton = document.createElement("button");
  shareButton.type = "button";
  shareButton.textContent = "Copy Share Link";
  buttons.append(playButton, stepButton, resetButton, reseedButton, shareButton);

  chrome.append(
    title,
    presetLabel,
    presetDescription,
    seedLabel,
    toolLabel,
    materialLabel,
    brushSize.wrapper,
    speedControl.wrapper,
    reactionControl.wrapper,
    windControl.wrapper,
    buttons,
  );

  shell.append(stage, chrome);
  mount.replaceChildren(shell);

  const renderer = new Renderer(canvas, simulation);
  const detachInput = attachInputController({
    canvas,
    getSimulation: () => simulation,
    getBrush: () => brush,
  });

  const syncSimulationParams = (): void => {
    simulation.params.speed = Number(speedControl.input.value);
    simulation.params.reactionRate = Number(reactionControl.input.value);
    simulation.params.windBias = Number(windControl.input.value);
  };

  const refreshOutputs = (): void => {
    brushSize.output.textContent = brushSize.input.value;
    speedControl.output.textContent = Number(speedControl.input.value).toFixed(2);
    reactionControl.output.textContent = Number(reactionControl.input.value).toFixed(2);
    windControl.output.textContent = Number(windControl.input.value).toFixed(2);
    presetDescription.textContent = PRESETS[presetSelect.value as PresetId].description;
    materialLabel.style.display = brush.tool === "material" ? "" : "none";
    syncSimulationParams();
  };

  const rebuildSimulation = (): void => {
    state = {
      seed: seedInput.value.trim() || state.seed,
      preset: presetSelect.value as PresetId,
      reactionRate: Number(reactionControl.input.value),
      windBias: Number(windControl.input.value),
      speed: Number(speedControl.input.value),
    };
    simulation = createSimulationFromSetup(worldConfig, state);
    renderer.resize(simulation);
    syncSimulationParams();
    renderer.render(simulation);
  };

  toolSelect.addEventListener("change", () => {
    brush.tool = toolSelect.value as BrushState["tool"];
    refreshOutputs();
  });

  materialSelect.addEventListener("change", () => {
    brush.material = materialSelect.value as BrushState["material"];
  });

  brushSize.input.addEventListener("input", () => {
    brush.size = Number(brushSize.input.value);
    refreshOutputs();
  });

  speedControl.input.addEventListener("input", refreshOutputs);
  reactionControl.input.addEventListener("input", refreshOutputs);
  windControl.input.addEventListener("input", refreshOutputs);

  presetSelect.addEventListener("change", () => {
    const preset = PRESETS[presetSelect.value as PresetId];
    reactionControl.input.value = preset.defaults.reactionRate.toFixed(2);
    windControl.input.value = preset.defaults.windBias.toFixed(2);
    refreshOutputs();
    rebuildSimulation();
  });

  seedInput.addEventListener("change", rebuildSimulation);

  playButton.addEventListener("click", () => {
    playing = !playing;
    playButton.textContent = playing ? "Pause" : "Play";
  });

  stepButton.addEventListener("click", () => {
    simulation.step();
    renderer.render(simulation);
  });

  resetButton.addEventListener("click", rebuildSimulation);

  reseedButton.addEventListener("click", () => {
    seedInput.value = randomSeed();
    rebuildSimulation();
  });

  shareButton.addEventListener("click", async () => {
    state = {
      seed: seedInput.value.trim() || state.seed,
      preset: presetSelect.value as PresetId,
      reactionRate: Number(reactionControl.input.value),
      windBias: Number(windControl.input.value),
      speed: Number(speedControl.input.value),
    };

    const url = new URL(window.location.href);
    url.search = encodeSetupState(state);
    window.history.replaceState({}, "", url);

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url.toString());
      shareButton.textContent = "Link Copied";
      window.setTimeout(() => {
        shareButton.textContent = "Copy Share Link";
      }, 1200);
    }
  });

  refreshOutputs();
  renderer.render(simulation);

  let frameId = 0;
  let accumulator = 0;
  let previousTime = performance.now();

  const loop = (time: number): void => {
    const delta = Math.min(32, time - previousTime);
    previousTime = time;

    if (playing) {
      accumulator += delta * simulation.params.speed;
      while (accumulator >= 16) {
        simulation.step();
        accumulator -= 16;
      }
    }

    renderer.render(simulation);
    frameId = window.requestAnimationFrame(loop);
  };

  frameId = window.requestAnimationFrame(loop);

  return {
    destroy() {
      window.cancelAnimationFrame(frameId);
      detachInput();
      mount.replaceChildren();
    },
  };
}
