import { IUpdatable, IDestroyable } from '../core/Interfaces';
import { Lane } from '../core/Config';

/**
 * Lane personality types - temporary traits assigned to lanes
 */
export enum LanePersonality {
  NORMAL = 'normal',           // No special properties
  BLESSED = 'blessed',         // More gates, fewer enemies
  CURSED = 'cursed',          // More enemies, fewer gates
  FORTUNE = 'fortune',        // Gates worth more
  DANGER = 'danger',          // Enemies stronger
  LUCKY = 'lucky',            // Random good effects
  CHAOTIC = 'chaotic',        // Unpredictable
  EMPTY = 'empty'             // Nothing spawns
}

/**
 * Personality configuration
 */
interface PersonalityConfig {
  name: string;
  gateSpawnMultiplier: number;
  enemySpawnMultiplier: number;
  gateValueMultiplier: number;
  enemyStrengthMultiplier: number;
  duration: number;
  color?: string; // For visual indication
}

/**
 * Active lane personality
 */
interface ActivePersonality {
  lane: Lane;
  personality: LanePersonality;
  timeRemaining: number;
  config: PersonalityConfig;
}

/**
 * Single Responsibility: Manage temporary lane personality traits
 * Open/Closed: New personalities can be added via PERSONALITIES config
 * Dependency Inversion: Uses callbacks for communication
 */
export class LanePersonalitySystem implements IUpdatable, IDestroyable {
  private activePersonalities: Map<Lane, ActivePersonality> = new Map();
  private timeSinceAssignment: number = 0;
  private assignmentInterval: number = 25; // Assign personality every 25s

  private onPersonalityAssigned?: (lane: Lane, personality: LanePersonality) => void;
  private onPersonalityExpired?: (lane: Lane, personality: LanePersonality) => void;

  private static readonly PERSONALITIES: Record<LanePersonality, PersonalityConfig> = {
    [LanePersonality.NORMAL]: {
      name: 'Normal',
      gateSpawnMultiplier: 1.0,
      enemySpawnMultiplier: 1.0,
      gateValueMultiplier: 1.0,
      enemyStrengthMultiplier: 1.0,
      duration: 0
    },
    [LanePersonality.BLESSED]: {
      name: 'Blessed Lane',
      gateSpawnMultiplier: 1.8,
      enemySpawnMultiplier: 0.3,
      gateValueMultiplier: 1.0,
      enemyStrengthMultiplier: 1.0,
      duration: 12,
      color: '#FFD700'
    },
    [LanePersonality.CURSED]: {
      name: 'Cursed Lane',
      gateSpawnMultiplier: 0.3,
      enemySpawnMultiplier: 1.8,
      gateValueMultiplier: 1.0,
      enemyStrengthMultiplier: 1.0,
      duration: 12,
      color: '#8B0000'
    },
    [LanePersonality.FORTUNE]: {
      name: 'Fortune Lane',
      gateSpawnMultiplier: 1.0,
      enemySpawnMultiplier: 1.0,
      gateValueMultiplier: 2.0,
      enemyStrengthMultiplier: 1.0,
      duration: 10,
      color: '#FFD700'
    },
    [LanePersonality.DANGER]: {
      name: 'Danger Lane',
      gateSpawnMultiplier: 1.0,
      enemySpawnMultiplier: 1.0,
      gateValueMultiplier: 1.0,
      enemyStrengthMultiplier: 1.5,
      duration: 10,
      color: '#FF4500'
    },
    [LanePersonality.LUCKY]: {
      name: 'Lucky Lane',
      gateSpawnMultiplier: 1.3,
      enemySpawnMultiplier: 0.7,
      gateValueMultiplier: 1.3,
      enemyStrengthMultiplier: 0.8,
      duration: 15,
      color: '#00FF00'
    },
    [LanePersonality.CHAOTIC]: {
      name: 'Chaotic Lane',
      gateSpawnMultiplier: 1.5,
      enemySpawnMultiplier: 1.5,
      gateValueMultiplier: 1.5,
      enemyStrengthMultiplier: 1.5,
      duration: 8,
      color: '#9400D3'
    },
    [LanePersonality.EMPTY]: {
      name: 'Empty Lane',
      gateSpawnMultiplier: 0,
      enemySpawnMultiplier: 0,
      gateValueMultiplier: 1.0,
      enemyStrengthMultiplier: 1.0,
      duration: 6,
      color: '#808080'
    }
  };

  constructor(
    onPersonalityAssigned?: (lane: Lane, personality: LanePersonality) => void,
    onPersonalityExpired?: (lane: Lane, personality: LanePersonality) => void
  ) {
    this.onPersonalityAssigned = onPersonalityAssigned;
    this.onPersonalityExpired = onPersonalityExpired;
  }

  public update(deltaTime: number): void {
    // Update active personalities
    for (const [lane, active] of this.activePersonalities.entries()) {
      active.timeRemaining -= deltaTime;

      if (active.timeRemaining <= 0) {
        // Personality expired
        if (this.onPersonalityExpired) {
          this.onPersonalityExpired(lane, active.personality);
        }
        this.activePersonalities.delete(lane);
      }
    }

    // Check if time to assign new personality
    this.timeSinceAssignment += deltaTime;

    if (this.timeSinceAssignment >= this.assignmentInterval) {
      this.assignRandomPersonality();
      this.timeSinceAssignment = 0;
    }
  }

  /**
   * Assign random personality to random lane
   */
  private assignRandomPersonality(): void {
    // Choose random lane
    const lanes = [Lane.LEFT, Lane.CENTER, Lane.RIGHT];
    const availableLanes = lanes.filter(lane => !this.activePersonalities.has(lane));

    if (availableLanes.length === 0) {
      return; // All lanes have personalities
    }

    const randomLane = availableLanes[Math.floor(Math.random() * availableLanes.length)];

    // Choose random personality (excluding NORMAL)
    const personalities = Object.values(LanePersonality).filter(p => p !== LanePersonality.NORMAL);
    const randomPersonality = personalities[Math.floor(Math.random() * personalities.length)];

    const config = LanePersonalitySystem.PERSONALITIES[randomPersonality];

    this.activePersonalities.set(randomLane, {
      lane: randomLane,
      personality: randomPersonality,
      timeRemaining: config.duration,
      config
    });

    if (this.onPersonalityAssigned) {
      this.onPersonalityAssigned(randomLane, randomPersonality);
    }
  }

  /**
   * Get personality for a lane
   */
  public getLanePersonality(lane: Lane): LanePersonality {
    return this.activePersonalities.get(lane)?.personality || LanePersonality.NORMAL;
  }

  /**
   * Get modifiers for a lane
   */
  public getLaneModifiers(lane: Lane): {
    gateSpawnMultiplier: number;
    enemySpawnMultiplier: number;
    gateValueMultiplier: number;
    enemyStrengthMultiplier: number;
  } {
    const active = this.activePersonalities.get(lane);

    if (!active) {
      return {
        gateSpawnMultiplier: 1.0,
        enemySpawnMultiplier: 1.0,
        gateValueMultiplier: 1.0,
        enemyStrengthMultiplier: 1.0
      };
    }

    return {
      gateSpawnMultiplier: active.config.gateSpawnMultiplier,
      enemySpawnMultiplier: active.config.enemySpawnMultiplier,
      gateValueMultiplier: active.config.gateValueMultiplier,
      enemyStrengthMultiplier: active.config.enemyStrengthMultiplier
    };
  }

  /**
   * Get personality config
   */
  public getPersonalityConfig(personality: LanePersonality): PersonalityConfig {
    return LanePersonalitySystem.PERSONALITIES[personality];
  }

  /**
   * Check if lane has active personality
   */
  public hasActivePersonality(lane: Lane): boolean {
    return this.activePersonalities.has(lane);
  }

  /**
   * Get all active personalities
   */
  public getActivePersonalities(): ReadonlyMap<Lane, Readonly<ActivePersonality>> {
    return this.activePersonalities;
  }

  public reset(): void {
    this.activePersonalities.clear();
    this.timeSinceAssignment = 0;
  }

  public destroy(): void {
    this.reset();
  }
}
