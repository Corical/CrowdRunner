import { IUpdatable, IDestroyable } from '../core/Interfaces';

/**
 * Enemy mutation types
 */
export enum MutationType {
  NORMAL = 'normal',          // Standard enemy
  TANK = 'tank',              // 2x size, slow
  SPEEDSTER = 'speedster',    // Fast moving
  REGENERATING = 'regenerating', // Grows over time
  VOLATILE = 'volatile',      // Explodes on hit (damages ALL lanes)
  PHANTOM = 'phantom',        // Invisible until close
  SPLIT = 'split',            // Splits into smaller enemies
  MAGNETIC = 'magnetic'       // Pulls player toward it
}

/**
 * Mutation configuration
 */
export interface MutationConfig {
  name: string;
  sizeMultiplier: number;
  speedMultiplier: number;
  strengthMultiplier: number;
  spawnChance: number; // 0-1
  color?: string;
  specialEffect?: string;
}

/**
 * Mutation data for spawned enemy
 */
export interface EnemyMutation {
  type: MutationType;
  config: MutationConfig;
  spawnTime: number;
}

/**
 * Single Responsibility: Assign special properties/mutations to enemies
 * Open/Closed: New mutations can be added via MUTATIONS config
 * Dependency Inversion: Returns mutation data, doesn't modify enemies directly
 */
export class EnemyMutationSystem implements IUpdatable, IDestroyable {
  private mutationChance: number = 0.15; // 15% chance for mutation
  private activeMutations: Map<string, EnemyMutation> = new Map();

  private onMutationSpawned?: (mutation: EnemyMutation) => void;

  private static readonly MUTATIONS: Record<MutationType, MutationConfig> = {
    [MutationType.NORMAL]: {
      name: 'Normal',
      sizeMultiplier: 1.0,
      speedMultiplier: 1.0,
      strengthMultiplier: 1.0,
      spawnChance: 0
    },
    [MutationType.TANK]: {
      name: 'Tank',
      sizeMultiplier: 2.0,
      speedMultiplier: 0.7,
      strengthMultiplier: 1.5,
      spawnChance: 0.25,
      color: '#4A4A4A',
      specialEffect: 'Heavy armor'
    },
    [MutationType.SPEEDSTER]: {
      name: 'Speedster',
      sizeMultiplier: 0.8,
      speedMultiplier: 1.8,
      strengthMultiplier: 0.8,
      spawnChance: 0.25,
      color: '#FF6B6B',
      specialEffect: 'Moves fast'
    },
    [MutationType.REGENERATING]: {
      name: 'Regenerating',
      sizeMultiplier: 1.0,
      speedMultiplier: 1.0,
      strengthMultiplier: 1.2,
      spawnChance: 0.15,
      color: '#4ECDC4',
      specialEffect: 'Grows over time'
    },
    [MutationType.VOLATILE]: {
      name: 'Volatile',
      sizeMultiplier: 1.2,
      speedMultiplier: 1.0,
      strengthMultiplier: 1.3,
      spawnChance: 0.10,
      color: '#FF4757',
      specialEffect: 'Explodes on hit!'
    },
    [MutationType.PHANTOM]: {
      name: 'Phantom',
      sizeMultiplier: 1.0,
      speedMultiplier: 1.2,
      strengthMultiplier: 1.0,
      spawnChance: 0.10,
      color: '#A29BFE',
      specialEffect: 'Hard to see'
    },
    [MutationType.SPLIT]: {
      name: 'Splitter',
      sizeMultiplier: 1.5,
      speedMultiplier: 0.9,
      strengthMultiplier: 0.7,
      spawnChance: 0.10,
      color: '#FFA502',
      specialEffect: 'Splits when hit'
    },
    [MutationType.MAGNETIC]: {
      name: 'Magnetic',
      sizeMultiplier: 1.1,
      speedMultiplier: 1.0,
      strengthMultiplier: 1.1,
      spawnChance: 0.05,
      color: '#5F27CD',
      specialEffect: 'Pulls player!'
    }
  };

  constructor(onMutationSpawned?: (mutation: EnemyMutation) => void) {
    this.onMutationSpawned = onMutationSpawned;
  }

  /**
   * Roll for mutation on enemy spawn
   * @returns Mutation type (or NORMAL if no mutation)
   */
  public rollMutation(): EnemyMutation {
    const roll = Math.random();

    // Check if mutation occurs
    if (roll >= this.mutationChance) {
      return this.createMutation(MutationType.NORMAL);
    }

    // Select mutation type based on spawn chances
    const mutations = Object.entries(EnemyMutationSystem.MUTATIONS)
      .filter(([type, _]) => type !== MutationType.NORMAL);

    const totalWeight = mutations.reduce((sum, [_, config]) => sum + config.spawnChance, 0);
    let random = Math.random() * totalWeight;

    for (const [type, config] of mutations) {
      random -= config.spawnChance;
      if (random <= 0) {
        return this.createMutation(type as MutationType);
      }
    }

    return this.createMutation(MutationType.NORMAL);
  }

  /**
   * Create mutation object
   */
  private createMutation(type: MutationType): EnemyMutation {
    const config = EnemyMutationSystem.MUTATIONS[type];
    const mutation: EnemyMutation = {
      type,
      config,
      spawnTime: performance.now() / 1000
    };

    if (type !== MutationType.NORMAL && this.onMutationSpawned) {
      this.onMutationSpawned(mutation);
    }

    return mutation;
  }

  /**
   * Register active mutation for tracking
   */
  public registerMutation(enemyId: string, mutation: EnemyMutation): void {
    if (mutation.type !== MutationType.NORMAL) {
      this.activeMutations.set(enemyId, mutation);
    }
  }

  /**
   * Remove mutation tracking
   */
  public unregisterMutation(enemyId: string): void {
    this.activeMutations.delete(enemyId);
  }

  /**
   * Get mutation for enemy
   */
  public getMutation(enemyId: string): EnemyMutation | undefined {
    return this.activeMutations.get(enemyId);
  }

  /**
   * Update mutations (for time-based effects like regenerating)
   */
  public update(_deltaTime: number): void {
    // Mutations are mostly passive
    // Time-based effects handled via getRegenerationMultiplier()
  }

  /**
   * Get regeneration multiplier for enemy
   */
  public getRegenerationMultiplier(enemyId: string): number {
    const mutation = this.activeMutations.get(enemyId);

    if (mutation?.type === MutationType.REGENERATING) {
      const currentTime = performance.now() / 1000;
      const timeSinceSpawn = currentTime - mutation.spawnTime;
      // Grow 10% per 5 seconds, capped at 2x
      return Math.min(2.0, 1.0 + (timeSinceSpawn / 5) * 0.1);
    }

    return 1.0;
  }

  /**
   * Set mutation chance
   */
  public setMutationChance(chance: number): void {
    this.mutationChance = Math.max(0, Math.min(1, chance));
  }

  /**
   * Get mutation chance
   */
  public getMutationChance(): number {
    return this.mutationChance;
  }

  /**
   * Get mutation config
   */
  public getMutationConfig(type: MutationType): MutationConfig {
    return EnemyMutationSystem.MUTATIONS[type];
  }

  /**
   * Get active mutations count
   */
  public getActiveMutationsCount(): number {
    return this.activeMutations.size;
  }

  public reset(): void {
    this.activeMutations.clear();
  }

  public destroy(): void {
    this.reset();
  }
}
