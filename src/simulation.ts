import { createRng, pickOne, randomInt, type Rng } from "./random";
import {
  MATERIAL_TYPES,
  type CellState,
  type MaterialType,
  type SimulationParams,
  type WorldConfig,
} from "./types";

const MATERIAL_TO_ID = Object.fromEntries(
  MATERIAL_TYPES.map((material, index) => [material, index]),
) as Record<MaterialType, number>;

const EMPTY = MATERIAL_TO_ID.empty;
const SAND = MATERIAL_TO_ID.sand;
const WATER = MATERIAL_TO_ID.water;
const STONE = MATERIAL_TO_ID.stone;
const METAL = MATERIAL_TO_ID.metal;
const ACID = MATERIAL_TO_ID.acid;
const FIRE = MATERIAL_TO_ID.fire;
const SMOKE = MATERIAL_TO_ID.smoke;
const STEAM = MATERIAL_TO_ID.steam;
const SPARK = MATERIAL_TO_ID.spark;
const CRYSTAL = MATERIAL_TO_ID.crystal;
const LAVA = MATERIAL_TO_ID.lava;
const EMBER = MATERIAL_TO_ID.ember;
const PLANT = MATERIAL_TO_ID.plant;
const SPRING = MATERIAL_TO_ID.spring;
const LAVA_SOURCE = MATERIAL_TO_ID["lava-source"];
const ACID_SOURCE = MATERIAL_TO_ID["acid-source"];
const NEST = MATERIAL_TO_ID.nest;
const ANT = MATERIAL_TO_ID.ant;
const ANT_CARRY = MATERIAL_TO_ID["ant-carry"];
const EGG = MATERIAL_TO_ID.egg;

function defaultLife(materialId: number, rng: Rng): number {
  switch (materialId) {
    case FIRE:
      return randomInt(rng, 5, 8);
    case SMOKE:
      return randomInt(rng, 8, 14);
    case STEAM:
      return randomInt(rng, 10, 16);
    case SPARK:
      return 2;
    case CRYSTAL:
      return randomInt(rng, 3, 6);
    case LAVA:
      return randomInt(rng, 18, 28);
    case EMBER:
      return randomInt(rng, 10, 16);
    case PLANT:
      return randomInt(rng, 18, 28);
    case NEST:
      return randomInt(rng, 8, 14);
    case ANT:
    case ANT_CARRY:
      return randomInt(rng, 24, 40);
    case EGG:
      return randomInt(rng, 18, 28);
    default:
      return 0;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isGas(materialId: number): boolean {
  return materialId === SMOKE || materialId === STEAM;
}

function isSource(materialId: number): boolean {
  return materialId === SPRING || materialId === LAVA_SOURCE || materialId === ACID_SOURCE;
}

function isDissolvable(materialId: number): boolean {
  return materialId === SAND || materialId === STONE || materialId === METAL || materialId === CRYSTAL;
}

function isPlantFuel(materialId: number): boolean {
  return materialId === PLANT || materialId === EMBER;
}

function canSupportPlant(materialId: number): boolean {
  return materialId === STONE || materialId === SAND || materialId === METAL || materialId === PLANT || materialId === CRYSTAL;
}

function isHazard(materialId: number): boolean {
  return materialId === FIRE || materialId === ACID || materialId === LAVA || materialId === EMBER;
}

function isAntSupport(materialId: number): boolean {
  return materialId !== EMPTY && !isGas(materialId) && materialId !== WATER && materialId !== ACID;
}

function drainsOutBottom(materialId: number): boolean {
  return materialId === SAND || materialId === WATER || materialId === ACID || materialId === LAVA || materialId === EMBER;
}

export class Simulation {
  readonly config: WorldConfig;
  params: SimulationParams;
  tick = 0;

  private readonly seed: string;
  private readonly rng: Rng;
  private readonly materials: Uint8Array;
  private readonly life: Uint8Array;
  private readonly updatedAt: Uint32Array;

  constructor(config: WorldConfig, seed: string, params: SimulationParams) {
    this.config = config;
    this.seed = seed;
    this.params = { ...params };
    this.rng = createRng(seed);
    const size = config.width * config.height;
    this.materials = new Uint8Array(size);
    this.life = new Uint8Array(size);
    this.updatedAt = new Uint32Array(size);
  }

  getSeed(): string {
    return this.seed;
  }

  cloneMaterialBuffer(): Uint8Array {
    return this.materials.slice();
  }

  clear(): void {
    this.materials.fill(EMPTY);
    this.life.fill(0);
    this.updatedAt.fill(0);
    this.tick = 0;
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.config.width && y >= 0 && y < this.config.height;
  }

  index(x: number, y: number): number {
    return y * this.config.width + x;
  }

  getCell(x: number, y: number): CellState {
    if (!this.inBounds(x, y)) {
      return { material: "empty", life: 0 };
    }

    const index = this.index(x, y);
    return {
      material: MATERIAL_TYPES[this.materials[index]],
      life: this.life[index],
    };
  }

  setCell(x: number, y: number, material: MaterialType, life = -1): void {
    if (!this.inBounds(x, y)) {
      return;
    }

    const index = this.index(x, y);
    const materialId = MATERIAL_TO_ID[material];
    this.materials[index] = materialId;
    this.life[index] = life >= 0 ? life : defaultLife(materialId, this.rng);
    this.updatedAt[index] = this.tick;
  }

  fillRect(x: number, y: number, width: number, height: number, material: MaterialType): void {
    for (let row = y; row < y + height; row += 1) {
      for (let column = x; column < x + width; column += 1) {
        this.setCell(column, row, material);
      }
    }
  }

  fillCircle(centerX: number, centerY: number, radius: number, material: MaterialType): void {
    const squaredRadius = radius * radius;
    for (let y = centerY - radius; y <= centerY + radius; y += 1) {
      for (let x = centerX - radius; x <= centerX + radius; x += 1) {
        const deltaX = x - centerX;
        const deltaY = y - centerY;
        if (deltaX * deltaX + deltaY * deltaY <= squaredRadius) {
          this.setCell(x, y, material);
        }
      }
    }
  }

  scatter(material: MaterialType, density: number, minY = 0, maxY = this.config.height - 1): void {
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = 0; x < this.config.width; x += 1) {
        if (this.rng() < density) {
          this.setCell(x, y, material);
        }
      }
    }
  }

  applyIgnite(x: number, y: number): void {
    if (!this.inBounds(x, y)) {
      return;
    }

    const current = this.getCell(x, y).material;
    if (current === "water" || current === "steam") {
      this.setCell(x, y, "steam");
      return;
    }

    this.setCell(x, y, "fire");
  }

  applySpark(x: number, y: number): void {
    if (this.inBounds(x, y)) {
      this.setCell(x, y, "spark");
    }
  }

  forEachCell(callback: (x: number, y: number, cell: CellState) => void): void {
    for (let y = 0; y < this.config.height; y += 1) {
      for (let x = 0; x < this.config.width; x += 1) {
        callback(x, y, this.getCell(x, y));
      }
    }
  }

  step(): void {
    this.tick += 1;
    const direction = this.rng() < 0.5 ? 1 : -1;
    const startOffset = randomInt(this.rng, 0, this.config.width - 1);

    for (let y = this.config.height - 1; y >= 0; y -= 1) {
      for (let scan = 0; scan < this.config.width; scan += 1) {
        const offset = direction === 1 ? scan : this.config.width - 1 - scan;
        const x = (startOffset + offset) % this.config.width;
        const index = this.index(x, y);

        if (this.updatedAt[index] === this.tick) {
          continue;
        }

        switch (this.materials[index]) {
          case SAND:
            this.updateSand(x, y, index);
            break;
          case WATER:
            this.updateWater(x, y, index);
            break;
          case ACID:
            this.updateAcid(x, y, index);
            break;
          case FIRE:
            this.updateFire(x, y, index);
            break;
          case SMOKE:
            this.updateGas(x, y, SMOKE);
            break;
          case STEAM:
            this.updateGas(x, y, STEAM);
            break;
          case SPARK:
            this.updateSpark(x, y, index);
            break;
          case CRYSTAL:
            this.updateCrystal(x, y, index);
            break;
          case LAVA:
            this.updateLava(x, y, index);
            break;
          case EMBER:
            this.updateEmber(x, y, index);
            break;
          case PLANT:
            this.updatePlant(x, y, index);
            break;
          case SPRING:
            this.updateSpring(x, y, index);
            break;
          case LAVA_SOURCE:
            this.updateLavaSource(x, y, index);
            break;
          case ACID_SOURCE:
            this.updateAcidSource(x, y, index);
            break;
          case NEST:
            this.updateNest(x, y, index);
            break;
          case ANT:
            this.updateAnt(x, y, index, false);
            break;
          case ANT_CARRY:
            this.updateAnt(x, y, index, true);
            break;
          case EGG:
            this.updateEgg(x, y, index);
            break;
          default:
            this.updatedAt[index] = this.tick;
            break;
        }
      }
    }
  }

  private updateSand(x: number, y: number, index: number): void {
    if (this.tryDrainOutBottom(y, index, EMPTY)) {
      return;
    }

    const moved = this.tryMoveByPriority(
      x,
      y,
      [
        { x, y: y + 1 },
        { x: x - 1, y: y + 1 },
        { x: x + 1, y: y + 1 },
      ],
      (target) => target === EMPTY || target === WATER || target === ACID || isGas(target),
    );

    if (!moved) {
      this.updatedAt[index] = this.tick;
    }
  }

  private updateWater(x: number, y: number, index: number): void {
    for (const neighbor of [{ x, y: y + 1 }, { x: x - 1, y: y + 1 }, { x: x + 1, y: y + 1 }]) {
      if (!this.inBounds(neighbor.x, neighbor.y)) {
        continue;
      }

      const neighborIndex = this.index(neighbor.x, neighbor.y);
      if (this.materials[neighborIndex] === SAND && this.rng() < 0.015 + this.params.reactionRate * 0.03) {
        this.materials[neighborIndex] = EMPTY;
        this.life[neighborIndex] = 0;
        this.updatedAt[neighborIndex] = this.tick;
      }
    }

    if (this.tryDrainOutBottom(y, index, EMPTY)) {
      return;
    }

    this.updateWaterLike(x, y, index, (target) => target === EMPTY || isGas(target));
  }

  private updateWaterLike(
    x: number,
    y: number,
    index: number,
    canEnter: (targetMaterial: number) => boolean,
  ): void {
    const wind = clamp(Math.round(this.params.windBias * 2), -2, 2);
    const sideways = wind >= 0 ? [1, -1] : [-1, 1];
    const diagonals = pickOne(this.rng, [
      [
        { x: x - 1, y: y + 1 },
        { x: x + 1, y: y + 1 },
      ],
      [
        { x: x + 1, y: y + 1 },
        { x: x - 1, y: y + 1 },
      ],
    ]);

    const moved =
      this.tryMoveByPriority(
        x,
        y,
        [{ x, y: y + 1 }, ...diagonals],
        canEnter,
      ) ||
      this.tryMoveByPriority(
        x,
        y,
        [
          { x: x + sideways[0], y },
          { x: x + sideways[1], y },
          { x: x + sideways[0] + wind, y },
          { x: x + sideways[1] - wind, y },
        ],
        canEnter,
      );

    if (!moved) {
      this.updatedAt[index] = this.tick;
    }
  }

  private updateAcid(x: number, y: number, index: number): void {
    for (const neighbor of this.cardinalNeighbors(x, y)) {
      if (!this.inBounds(neighbor.x, neighbor.y)) {
        continue;
      }

      const neighborIndex = this.index(neighbor.x, neighbor.y);
      const material = this.materials[neighborIndex];
      if (isDissolvable(material) && !isSource(material) && (this.params.reactionRate >= 1 || this.rng() < this.params.reactionRate)) {
        this.materials[neighborIndex] = pickOne(this.rng, [EMPTY, SMOKE]);
        this.life[neighborIndex] = defaultLife(this.materials[neighborIndex], this.rng);
        this.updatedAt[neighborIndex] = this.tick;
        break;
      }
    }

    if (this.tryDrainOutBottom(y, index, EMPTY)) {
      return;
    }

    this.updateWaterLike(x, y, index, (target) => target === EMPTY || isGas(target) || target === WATER);
  }

  private updateFire(x: number, y: number, index: number): void {
    let transformed = false;

    for (const neighbor of this.cardinalNeighbors(x, y)) {
      if (!this.inBounds(neighbor.x, neighbor.y)) {
        continue;
      }

      const neighborIndex = this.index(neighbor.x, neighbor.y);
      const material = this.materials[neighborIndex];

      if (material === WATER || material === SPRING) {
        if (material !== SPRING) {
          this.materials[neighborIndex] = STEAM;
          this.life[neighborIndex] = defaultLife(STEAM, this.rng);
          this.updatedAt[neighborIndex] = this.tick;
        }
        transformed = true;
      } else if (
        (isPlantFuel(material) || material === CRYSTAL || material === ACID || material === SAND) &&
        (this.params.reactionRate >= 1 || this.rng() < 0.35 * this.params.reactionRate)
      ) {
        this.materials[neighborIndex] = pickOne(this.rng, [SMOKE, EMBER]);
        this.life[neighborIndex] = defaultLife(this.materials[neighborIndex], this.rng);
        this.updatedAt[neighborIndex] = this.tick;
        transformed = true;
      }
    }

    this.life[index] = this.life[index] > 0 ? this.life[index] - 1 : defaultLife(FIRE, this.rng);
    if (this.life[index] <= 0) {
      this.materials[index] = transformed ? SMOKE : EMPTY;
      this.life[index] = transformed ? defaultLife(SMOKE, this.rng) : 0;
      this.updatedAt[index] = this.tick;
      return;
    }

    const drift = Math.sign(this.params.windBias);
    const moved = this.tryMoveByPriority(
      x,
      y,
      [
        { x, y: y - 1 },
        { x: x + drift, y: y - 1 },
        { x: x - drift, y: y - 1 },
      ],
      (target) => target === EMPTY || target === SMOKE,
    );

    if (!moved) {
      this.updatedAt[index] = this.tick;
    }
  }

  private updateGas(x: number, y: number, materialId: number): void {
    const originIndex = this.index(x, y);
    const blockedAbove = y === 0 || (this.inBounds(x, y - 1) && this.materials[this.index(x, y - 1)] !== EMPTY);
    if (materialId === STEAM) {
      if (blockedAbove) {
        this.life[originIndex] = Math.min(60, this.life[originIndex] + 1);
        if (this.life[originIndex] >= 24 && this.rng() < 0.12) {
          this.materials[originIndex] = WATER;
          this.life[originIndex] = 0;
          this.updatedAt[originIndex] = this.tick;
          return;
        }
      } else if (y === 0) {
        this.materials[originIndex] = EMPTY;
        this.life[originIndex] = 0;
        this.updatedAt[originIndex] = this.tick;
        return;
      }
    } else if (y === 0) {
      this.materials[originIndex] = EMPTY;
      this.life[originIndex] = 0;
      this.updatedAt[originIndex] = this.tick;
      return;
    }

    const windDirection = this.params.windBias >= 0 ? 1 : -1;
    const diagonals = windDirection >= 0
      ? [
          { x: x + 1, y: y - 1 },
          { x: x - 1, y: y - 1 },
        ]
      : [
          { x: x - 1, y: y - 1 },
          { x: x + 1, y: y - 1 },
        ];

    if (materialId === STEAM && blockedAbove) {
      this.tryMoveByPriority(
        x,
        y,
        [{ x: x + windDirection, y }, { x: x - windDirection, y }],
        (target) => target === EMPTY,
      );
    } else {
      this.tryMoveByPriority(
        x,
        y,
        [{ x, y: y - 1 }, ...diagonals, { x: x + windDirection, y }],
        (target) => target === EMPTY || (materialId === SMOKE && target === STEAM),
      );
    }

    const currentIndex = this.findMaterialIndexNear(x, y, materialId);
    if (currentIndex === -1) {
      return;
    }

    if (materialId === STEAM) {
      if (this.life[currentIndex] <= 0) {
        this.life[currentIndex] = defaultLife(materialId, this.rng);
      }
    } else {
      this.life[currentIndex] = this.life[currentIndex] > 0 ? this.life[currentIndex] - 1 : defaultLife(materialId, this.rng);
      if (this.life[currentIndex] <= 0) {
        this.materials[currentIndex] = EMPTY;
        this.life[currentIndex] = 0;
      }
    }
    this.updatedAt[currentIndex] = this.tick;
  }

  private updateSpark(x: number, y: number, index: number): void {
    for (const neighbor of this.cardinalNeighbors(x, y)) {
      if (!this.inBounds(neighbor.x, neighbor.y)) {
        continue;
      }

      const neighborIndex = this.index(neighbor.x, neighbor.y);
      const material = this.materials[neighborIndex];
      if (material === METAL && (this.params.reactionRate >= 1 || this.rng() < 0.7 * this.params.reactionRate)) {
        this.materials[neighborIndex] = SPARK;
        this.life[neighborIndex] = defaultLife(SPARK, this.rng);
        this.updatedAt[neighborIndex] = this.tick;
      } else if (material === WATER || material === SPRING) {
        if (material !== SPRING) {
          this.materials[neighborIndex] = STEAM;
          this.life[neighborIndex] = defaultLife(STEAM, this.rng);
          this.updatedAt[neighborIndex] = this.tick;
        }
      } else if (material === ACID || material === CRYSTAL || material === PLANT) {
        this.materials[neighborIndex] = FIRE;
        this.life[neighborIndex] = defaultLife(FIRE, this.rng);
        this.updatedAt[neighborIndex] = this.tick;
      }
    }

    this.life[index] = this.life[index] > 0 ? this.life[index] - 1 : 1;
    if (this.life[index] <= 0) {
      this.materials[index] = METAL;
      this.life[index] = 0;
    }
    this.updatedAt[index] = this.tick;
  }

  private updateCrystal(x: number, y: number, index: number): void {
    this.life[index] = this.life[index] > 0 ? this.life[index] - 1 : 0;
    const wet = this.hasNeighborMaterial(x, y, [WATER, STEAM, SPRING]);
    if (this.life[index] <= 0) {
      const targets = this.allNeighbors(x, y).filter((neighbor) => {
        if (!this.inBounds(neighbor.x, neighbor.y)) {
          return false;
        }

        const neighborIndex = this.index(neighbor.x, neighbor.y);
        const neighborMaterial = this.materials[neighborIndex];
        if (neighborMaterial !== EMPTY && neighborMaterial !== WATER && neighborMaterial !== STEAM && neighborMaterial !== PLANT) {
          return false;
        }

        return this.cardinalNeighbors(neighbor.x, neighbor.y).some((adjacent) => {
          if (!this.inBounds(adjacent.x, adjacent.y)) {
            return false;
          }

          const adjacentMaterial = this.materials[this.index(adjacent.x, adjacent.y)];
          return adjacentMaterial === CRYSTAL || adjacentMaterial === STONE || adjacentMaterial === METAL;
        });
      });

      const growthChance = wet ? 0.12 + 0.2 * this.params.reactionRate : 0.04;
      if (targets.length > 0 && (this.params.reactionRate >= 1 || this.rng() < growthChance)) {
        const target = pickOne(this.rng, targets);
        const targetIndex = this.index(target.x, target.y);
        this.materials[targetIndex] = CRYSTAL;
        this.life[targetIndex] = defaultLife(CRYSTAL, this.rng);
        this.updatedAt[targetIndex] = this.tick;
      }

      this.life[index] = defaultLife(CRYSTAL, this.rng);
    }

    this.updatedAt[index] = this.tick;
  }

  private updateLava(x: number, y: number, index: number): void {
    if (this.tryDrainOutBottom(y, index, EMPTY)) {
      return;
    }

    for (const neighbor of this.cardinalNeighbors(x, y)) {
      if (!this.inBounds(neighbor.x, neighbor.y)) {
        continue;
      }

      const neighborIndex = this.index(neighbor.x, neighbor.y);
      const material = this.materials[neighborIndex];

      if (material === WATER || material === STEAM || material === SPRING) {
        if (material !== SPRING) {
          this.materials[neighborIndex] = STEAM;
          this.life[neighborIndex] = defaultLife(STEAM, this.rng);
          this.updatedAt[neighborIndex] = this.tick;
        }
        this.materials[index] = STONE;
        this.life[index] = 0;
        this.updatedAt[index] = this.tick;
        return;
      }

      if (material === METAL && (this.params.reactionRate >= 1 || this.rng() < 0.7 * this.params.reactionRate)) {
        this.materials[neighborIndex] = SPARK;
        this.life[neighborIndex] = defaultLife(SPARK, this.rng);
        this.updatedAt[neighborIndex] = this.tick;
      }

      if (isPlantFuel(material) || material === CRYSTAL) {
        this.materials[neighborIndex] = FIRE;
        this.life[neighborIndex] = defaultLife(FIRE, this.rng);
        this.updatedAt[neighborIndex] = this.tick;
      }
    }

    if ((this.tick + x + y) % 2 === 0) {
      this.updatedAt[index] = this.tick;
      return;
    }

    const moved = this.tryMoveByPriority(
      x,
      y,
      [
        { x, y: y + 1 },
        { x: x - 1, y: y + 1 },
        { x: x + 1, y: y + 1 },
        { x: x - 1, y },
        { x: x + 1, y },
      ],
      (target) => target === EMPTY || isGas(target) || target === WATER || target === ACID,
    );

    if (!moved) {
      this.updatedAt[index] = this.tick;
    }
  }

  private updateEmber(x: number, y: number, index: number): void {
    for (const neighbor of this.cardinalNeighbors(x, y)) {
      if (!this.inBounds(neighbor.x, neighbor.y)) {
        continue;
      }

      const neighborIndex = this.index(neighbor.x, neighbor.y);
      if (this.materials[neighborIndex] === PLANT && this.rng() < 0.3 + this.params.reactionRate * 0.3) {
        this.materials[neighborIndex] = FIRE;
        this.life[neighborIndex] = defaultLife(FIRE, this.rng);
        this.updatedAt[neighborIndex] = this.tick;
      }
    }

    this.life[index] = this.life[index] > 0 ? this.life[index] - 1 : defaultLife(EMBER, this.rng);
    if (this.life[index] <= 0) {
      this.materials[index] = pickOne(this.rng, [EMPTY, SMOKE]);
      this.life[index] = 0;
      this.updatedAt[index] = this.tick;
      return;
    }

    const moved = this.tryMoveByPriority(
      x,
      y,
      [
        { x, y: y + 1 },
        { x: x - 1, y: y + 1 },
        { x: x + 1, y: y + 1 },
      ],
      (target) => target === EMPTY || target === SMOKE,
    );

    if (!moved) {
      this.updatedAt[index] = this.tick;
    }
  }

  private updatePlant(x: number, y: number, index: number): void {
    for (const neighbor of this.cardinalNeighbors(x, y)) {
      if (!this.inBounds(neighbor.x, neighbor.y)) {
        continue;
      }

      const material = this.materials[this.index(neighbor.x, neighbor.y)];
      if (material === FIRE || material === LAVA || material === EMBER || material === LAVA_SOURCE) {
        this.materials[index] = pickOne(this.rng, [FIRE, EMBER]);
        this.life[index] = defaultLife(this.materials[index], this.rng);
        this.updatedAt[index] = this.tick;
        return;
      }
    }

    const hydrated = this.isHydrated(x, y);
    if (hydrated) {
      this.life[index] = Math.max(this.life[index], randomInt(this.rng, 18, 28));
    } else {
      this.life[index] = this.life[index] > 0 ? this.life[index] - 1 : 0;
    }

    if (!hydrated && this.life[index] <= 0) {
      this.materials[index] = EMPTY;
      this.life[index] = 0;
      this.updatedAt[index] = this.tick;
      return;
    }

    const growChance = hydrated ? 0.28 + this.params.reactionRate * 0.32 : 0.05;
    if (this.rng() < growChance) {
      const targets = this.allNeighbors(x, y).filter((neighbor) => {
        if (!this.inBounds(neighbor.x, neighbor.y)) {
          return false;
        }

        const neighborIndex = this.index(neighbor.x, neighbor.y);
        if (this.materials[neighborIndex] !== EMPTY && this.materials[neighborIndex] !== WATER) {
          return false;
        }

        const below = this.inBounds(neighbor.x, neighbor.y + 1)
          ? this.materials[this.index(neighbor.x, neighbor.y + 1)]
          : STONE;
        const touchingGrowth = this.cardinalNeighbors(neighbor.x, neighbor.y).some((adjacent) => {
          if (!this.inBounds(adjacent.x, adjacent.y)) {
            return false;
          }

          const adjacentMaterial = this.materials[this.index(adjacent.x, adjacent.y)];
          return adjacentMaterial === PLANT || adjacentMaterial === SPRING || adjacentMaterial === WATER;
        });

        return canSupportPlant(below) || touchingGrowth;
      });

      if (targets.length > 0) {
        const target = pickOne(this.rng, targets);
        const targetIndex = this.index(target.x, target.y);
        this.materials[targetIndex] = PLANT;
        this.life[targetIndex] = defaultLife(PLANT, this.rng);
        this.updatedAt[targetIndex] = this.tick;
      }
    }

    this.updatedAt[index] = this.tick;
  }

  private updateSpring(x: number, y: number, index: number): void {
    if (this.tick % 2 === 0) {
      this.emitMaterial(
        WATER,
        [
          { x, y: y + 1 },
          { x: x - 1, y: y + 1 },
          { x: x + 1, y: y + 1 },
          { x: x - 1, y },
          { x: x + 1, y },
        ],
      );
    }

    this.updatedAt[index] = this.tick;
  }

  private updateLavaSource(x: number, y: number, index: number): void {
    if ((this.tick + x) % 3 === 0) {
      this.emitMaterial(
        LAVA,
        [
          { x, y: y + 1 },
          { x: x - 1, y: y + 1 },
          { x: x + 1, y: y + 1 },
          { x: x - 1, y },
          { x: x + 1, y },
        ],
      );
    }

    this.updatedAt[index] = this.tick;
  }

  private updateAcidSource(x: number, y: number, index: number): void {
    if ((this.tick + y) % 3 === 0) {
      this.emitMaterial(
        ACID,
        [
          { x, y: y + 1 },
          { x: x - 1, y: y + 1 },
          { x: x + 1, y: y + 1 },
          { x: x - 1, y },
          { x: x + 1, y },
        ],
      );
    }

    this.updatedAt[index] = this.tick;
  }

  private updateNest(x: number, y: number, index: number): void {
    let stores = this.life[index] > 0 ? this.life[index] : defaultLife(NEST, this.rng);

    for (const neighbor of this.cardinalNeighbors(x, y)) {
      if (!this.inBounds(neighbor.x, neighbor.y)) {
        continue;
      }

      const neighborIndex = this.index(neighbor.x, neighbor.y);
      if (this.materials[neighborIndex] === ANT_CARRY) {
        this.materials[neighborIndex] = ANT;
        this.life[neighborIndex] = defaultLife(ANT, this.rng);
        this.updatedAt[neighborIndex] = this.tick;
        stores = Math.min(60, stores + 6);
      }
    }

    if (stores >= 12 && (this.tick + x + y) % 6 === 0) {
      const hatchery = this.allNeighbors(x, y).find((neighbor) => {
        if (!this.inBounds(neighbor.x, neighbor.y)) {
          return false;
        }

        const targetIndex = this.index(neighbor.x, neighbor.y);
        if (this.materials[targetIndex] !== EMPTY) {
          return false;
        }

        const below = this.inBounds(neighbor.x, neighbor.y + 1)
          ? this.materials[this.index(neighbor.x, neighbor.y + 1)]
          : STONE;

        return isAntSupport(below);
      });

      if (hatchery) {
        const hatcheryIndex = this.index(hatchery.x, hatchery.y);
        this.materials[hatcheryIndex] = EGG;
        this.life[hatcheryIndex] = defaultLife(EGG, this.rng);
        this.updatedAt[hatcheryIndex] = this.tick;
        stores -= 8;
      }
    }

    this.life[index] = stores;
    this.updatedAt[index] = this.tick;
  }

  private updateEgg(x: number, y: number, index: number): void {
    const below = this.inBounds(x, y + 1) ? this.materials[this.index(x, y + 1)] : STONE;
    if (y < this.config.height - 1 && below === EMPTY) {
      this.swap(index, this.index(x, y + 1));
      return;
    }

    for (const neighbor of this.cardinalNeighbors(x, y)) {
      if (!this.inBounds(neighbor.x, neighbor.y)) {
        continue;
      }

      if (isHazard(this.materials[this.index(neighbor.x, neighbor.y)])) {
        this.materials[index] = EMPTY;
        this.life[index] = 0;
        this.updatedAt[index] = this.tick;
        return;
      }
    }

    this.life[index] = this.life[index] > 0 ? this.life[index] - 1 : defaultLife(EGG, this.rng);
    if (this.life[index] <= 0) {
      this.materials[index] = ANT;
      this.life[index] = defaultLife(ANT, this.rng);
    }
    this.updatedAt[index] = this.tick;
  }

  private updateAnt(x: number, y: number, index: number, carrying: boolean): void {
    for (const neighbor of this.allNeighbors(x, y)) {
      if (!this.inBounds(neighbor.x, neighbor.y)) {
        continue;
      }

      const neighborIndex = this.index(neighbor.x, neighbor.y);
      const material = this.materials[neighborIndex];
      if (isHazard(material) || material === WATER) {
        this.materials[index] = EMPTY;
        this.life[index] = 0;
        this.updatedAt[index] = this.tick;
        return;
      }
    }

    if (carrying) {
      for (const neighbor of this.cardinalNeighbors(x, y)) {
        if (!this.inBounds(neighbor.x, neighbor.y)) {
          continue;
        }

        if (this.materials[this.index(neighbor.x, neighbor.y)] === NEST) {
          this.materials[index] = ANT;
          this.life[index] = defaultLife(ANT, this.rng);
          this.updatedAt[index] = this.tick;
          return;
        }
      }
    } else {
      for (const neighbor of this.allNeighbors(x, y)) {
        if (!this.inBounds(neighbor.x, neighbor.y)) {
          continue;
        }

        const neighborIndex = this.index(neighbor.x, neighbor.y);
        const material = this.materials[neighborIndex];
        if (material === PLANT || material === CRYSTAL) {
          this.materials[neighborIndex] = EMPTY;
          this.life[neighborIndex] = 0;
          this.updatedAt[neighborIndex] = this.tick;
          this.materials[index] = ANT_CARRY;
          this.life[index] = defaultLife(ANT_CARRY, this.rng);
          this.updatedAt[index] = this.tick;
          return;
        }
      }
    }

    const below = this.inBounds(x, y + 1) ? this.materials[this.index(x, y + 1)] : STONE;
    if (y < this.config.height - 1 && below === EMPTY && this.rng() < 0.55) {
      this.swap(index, this.index(x, y + 1));
      return;
    }

    const target = carrying
      ? this.findNearestMaterial(x, y, [NEST], 12)
      : this.findNearestMaterial(x, y, [PLANT, CRYSTAL], 10);

    const candidates = this.allNeighbors(x, y)
      .filter((neighbor) => this.inBounds(neighbor.x, neighbor.y))
      .map((neighbor) => ({ ...neighbor, index: this.index(neighbor.x, neighbor.y) }))
      .filter((neighbor) => this.materials[neighbor.index] === EMPTY);

    candidates.sort((left, right) => {
      const leftDistance = target ? Math.abs(target.x - left.x) + Math.abs(target.y - left.y) : 0;
      const rightDistance = target ? Math.abs(target.x - right.x) + Math.abs(target.y - right.y) : 0;
      const leftSupport = this.hasSupport(left.x, left.y) ? 0 : 2;
      const rightSupport = this.hasSupport(right.x, right.y) ? 0 : 2;
      return (leftDistance + leftSupport) - (rightDistance + rightSupport);
    });

    const preferred = candidates[0];
    if (preferred && (target || this.rng() < 0.8)) {
      this.swap(index, preferred.index);
      return;
    }

    this.life[index] = this.life[index] > 0 ? this.life[index] - 1 : defaultLife(carrying ? ANT_CARRY : ANT, this.rng);
    if (this.life[index] <= 0) {
      this.materials[index] = EMPTY;
      this.life[index] = 0;
    }
    this.updatedAt[index] = this.tick;
  }

  private emitMaterial(
    materialId: number,
    candidates: Array<{ x: number; y: number }>,
  ): boolean {
    for (const candidate of candidates) {
      if (!this.inBounds(candidate.x, candidate.y)) {
        continue;
      }

      const targetIndex = this.index(candidate.x, candidate.y);
      const targetMaterial = this.materials[targetIndex];
      if (targetMaterial === EMPTY || isGas(targetMaterial)) {
        this.materials[targetIndex] = materialId;
        this.life[targetIndex] = defaultLife(materialId, this.rng);
        this.updatedAt[targetIndex] = this.tick;
        return true;
      }
    }

    return false;
  }

  private tryDrainOutBottom(y: number, index: number, replacement: number): boolean {
    if (y !== this.config.height - 1) {
      return false;
    }

    if (drainsOutBottom(this.materials[index])) {
      this.materials[index] = replacement;
      this.life[index] = 0;
      this.updatedAt[index] = this.tick;
      return true;
    }

    return false;
  }

  private tryMoveByPriority(
    fromX: number,
    fromY: number,
    candidates: Array<{ x: number; y: number }>,
    canEnter: (targetMaterial: number) => boolean,
  ): boolean {
    const fromIndex = this.index(fromX, fromY);
    for (const candidate of candidates) {
      if (!this.inBounds(candidate.x, candidate.y)) {
        continue;
      }

      const toIndex = this.index(candidate.x, candidate.y);
      if (!canEnter(this.materials[toIndex]) || isSource(this.materials[toIndex])) {
        continue;
      }

      this.swap(fromIndex, toIndex);
      return true;
    }

    return false;
  }

  private swap(fromIndex: number, toIndex: number): void {
    const fromMaterial = this.materials[fromIndex];
    const fromLife = this.life[fromIndex];
    this.materials[fromIndex] = this.materials[toIndex];
    this.life[fromIndex] = this.life[toIndex];
    this.materials[toIndex] = fromMaterial;
    this.life[toIndex] = fromLife;
    this.updatedAt[fromIndex] = this.tick;
    this.updatedAt[toIndex] = this.tick;
  }

  private isHydrated(x: number, y: number): boolean {
    return this.hasNeighborMaterial(x, y, [WATER, STEAM, SPRING]);
  }

  private hasNeighborMaterial(x: number, y: number, materials: number[]): boolean {
    return this.allNeighbors(x, y).some((neighbor) => {
      if (!this.inBounds(neighbor.x, neighbor.y)) {
        return false;
      }

      return materials.includes(this.materials[this.index(neighbor.x, neighbor.y)]);
    });
  }

  private cardinalNeighbors(x: number, y: number): Array<{ x: number; y: number }> {
    return [
      { x, y: y - 1 },
      { x: x + 1, y },
      { x, y: y + 1 },
      { x: x - 1, y },
    ];
  }

  private allNeighbors(x: number, y: number): Array<{ x: number; y: number }> {
    return [
      { x: x - 1, y: y - 1 },
      { x, y: y - 1 },
      { x: x + 1, y: y - 1 },
      { x: x - 1, y },
      { x: x + 1, y },
      { x: x - 1, y: y + 1 },
      { x, y: y + 1 },
      { x: x + 1, y: y + 1 },
    ];
  }

  private findMaterialIndexNear(x: number, y: number, materialId: number): number {
    if (this.inBounds(x, y) && this.materials[this.index(x, y)] === materialId) {
      return this.index(x, y);
    }

    for (const neighbor of this.allNeighbors(x, y)) {
      if (!this.inBounds(neighbor.x, neighbor.y)) {
        continue;
      }

      const index = this.index(neighbor.x, neighbor.y);
      if (this.materials[index] === materialId && this.updatedAt[index] === this.tick) {
        return index;
      }
    }

    return -1;
  }

  private hasSupport(x: number, y: number): boolean {
    return this.cardinalNeighbors(x, y).some((neighbor) => {
      if (!this.inBounds(neighbor.x, neighbor.y)) {
        return true;
      }

      return isAntSupport(this.materials[this.index(neighbor.x, neighbor.y)]);
    });
  }

  private findNearestMaterial(
    originX: number,
    originY: number,
    materialIds: number[],
    radius: number,
  ): { x: number; y: number } | null {
    let closest: { x: number; y: number; distance: number } | null = null;

    for (let y = Math.max(0, originY - radius); y <= Math.min(this.config.height - 1, originY + radius); y += 1) {
      for (let x = Math.max(0, originX - radius); x <= Math.min(this.config.width - 1, originX + radius); x += 1) {
        const material = this.materials[this.index(x, y)];
        if (!materialIds.includes(material)) {
          continue;
        }

        const distance = Math.abs(originX - x) + Math.abs(originY - y);
        if (!closest || distance < closest.distance) {
          closest = { x, y, distance };
        }
      }
    }

    return closest ? { x: closest.x, y: closest.y } : null;
  }
}
