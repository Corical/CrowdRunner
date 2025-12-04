import { IUpdatable, IDestroyable } from '../core/Interfaces';
import { Lane } from '../core/Config';

/**
 * Pattern types for obstacle spawning
 */
export enum PatternType {
  RANDOM = 'random',           // Normal random spawning
  ZIGZAG = 'zigzag',          // Forces lane switching
  TUNNEL = 'tunnel',          // Safe path through enemies
  WALL = 'wall',              // All lanes blocked, must choose
  CHOICE = 'choice',          // High risk vs low risk paths
  WAVE = 'wave',              // Sequential lane filling
  GAUNTLET = 'gauntlet'       // Alternating obstacles
}

/**
 * Spawning instruction for ObstacleManager
 */
export interface SpawnInstruction {
  lane: Lane;
  type: 'gate' | 'enemy' | 'powerup';
  value?: number;
  delay?: number; // Seconds to delay this spawn
}

/**
 * Pattern definition
 */
export interface Pattern {
  type: PatternType;
  instructions: SpawnInstruction[];
  duration: number; // How long pattern lasts
  cooldown: number; // Minimum time before same pattern
}

/**
 * Single Responsibility: Generate structured obstacle spawn patterns
 * Dependencies: None (pure logic)
 */
export class ObstaclePatternSystem implements IUpdatable, IDestroyable {
  private activePattern: Pattern | null = null;
  private patternTimer: number = 0;
  private timeSincePattern: number = 0;
  private patternInterval: number = 20; // Trigger pattern every 20s
  private instructionQueue: Array<{ instruction: SpawnInstruction; timeLeft: number }> = [];

  private lastPatternType: PatternType | null = null;

  private onPatternStart?: (pattern: PatternType) => void;
  private onPatternEnd?: (pattern: PatternType) => void;
  private onSpawnRequest?: (instruction: SpawnInstruction) => void;

  constructor(
    onPatternStart?: (pattern: PatternType) => void,
    onPatternEnd?: (pattern: PatternType) => void,
    onSpawnRequest?: (instruction: SpawnInstruction) => void
  ) {
    this.onPatternStart = onPatternStart;
    this.onPatternEnd = onPatternEnd;
    this.onSpawnRequest = onSpawnRequest;
  }

  /**
   * Update pattern state and process spawn queue
   */
  public update(deltaTime: number): void {
    if (this.activePattern) {
      // Process active pattern
      this.patternTimer -= deltaTime;

      // Process instruction queue
      for (let i = this.instructionQueue.length - 1; i >= 0; i--) {
        this.instructionQueue[i].timeLeft -= deltaTime;

        if (this.instructionQueue[i].timeLeft <= 0) {
          // Time to spawn this instruction
          if (this.onSpawnRequest) {
            this.onSpawnRequest(this.instructionQueue[i].instruction);
          }
          this.instructionQueue.splice(i, 1);
        }
      }

      // Check if pattern ended
      if (this.patternTimer <= 0) {
        this.endPattern();
      }
    } else {
      // Count time since last pattern
      this.timeSincePattern += deltaTime;

      // Start new pattern if interval elapsed
      if (this.timeSincePattern >= this.patternInterval) {
        this.startRandomPattern();
      }
    }
  }

  /**
   * Start a random pattern
   */
  private startRandomPattern(): void {
    const patterns = Object.values(PatternType).filter(p => p !== PatternType.RANDOM);

    // Avoid repeating same pattern
    const availablePatterns = patterns.filter(p => p !== this.lastPatternType);
    const selectedType = availablePatterns[Math.floor(Math.random() * availablePatterns.length)];

    const pattern = this.generatePattern(selectedType);
    this.activatePattern(pattern);
  }

  /**
   * Generate pattern instructions based on type
   */
  private generatePattern(type: PatternType): Pattern {
    switch (type) {
      case PatternType.ZIGZAG:
        return this.createZigzagPattern();
      case PatternType.TUNNEL:
        return this.createTunnelPattern();
      case PatternType.WALL:
        return this.createWallPattern();
      case PatternType.CHOICE:
        return this.createChoicePattern();
      case PatternType.WAVE:
        return this.createWavePattern();
      case PatternType.GAUNTLET:
        return this.createGauntletPattern();
      default:
        return this.createZigzagPattern();
    }
  }

  private createZigzagPattern(): Pattern {
    return {
      type: PatternType.ZIGZAG,
      duration: 8,
      cooldown: 30,
      instructions: [
        { lane: Lane.LEFT, type: 'enemy', delay: 0 },
        { lane: Lane.CENTER, type: 'gate', delay: 0 },
        { lane: Lane.CENTER, type: 'enemy', delay: 1.5 },
        { lane: Lane.RIGHT, type: 'gate', delay: 1.5 },
        { lane: Lane.RIGHT, type: 'enemy', delay: 3 },
        { lane: Lane.LEFT, type: 'gate', delay: 3 }
      ]
    };
  }

  private createTunnelPattern(): Pattern {
    return {
      type: PatternType.TUNNEL,
      duration: 6,
      cooldown: 25,
      instructions: [
        // Enemies on left and right, safe center path with gates
        { lane: Lane.LEFT, type: 'enemy', delay: 0 },
        { lane: Lane.RIGHT, type: 'enemy', delay: 0 },
        { lane: Lane.CENTER, type: 'gate', delay: 0.5 },
        { lane: Lane.LEFT, type: 'enemy', delay: 2 },
        { lane: Lane.RIGHT, type: 'enemy', delay: 2 },
        { lane: Lane.CENTER, type: 'gate', delay: 2.5 },
        { lane: Lane.LEFT, type: 'enemy', delay: 4 },
        { lane: Lane.RIGHT, type: 'enemy', delay: 4 }
      ]
    };
  }

  private createWallPattern(): Pattern {
    return {
      type: PatternType.WALL,
      duration: 5,
      cooldown: 35,
      instructions: [
        // All lanes have obstacles - player must choose
        { lane: Lane.LEFT, type: 'enemy', delay: 0 },
        { lane: Lane.CENTER, type: 'gate', delay: 0 },
        { lane: Lane.RIGHT, type: 'enemy', delay: 0 },
        { lane: Lane.LEFT, type: 'gate', delay: 2 },
        { lane: Lane.CENTER, type: 'enemy', delay: 2 },
        { lane: Lane.RIGHT, type: 'gate', delay: 2 }
      ]
    };
  }

  private createChoicePattern(): Pattern {
    return {
      type: PatternType.CHOICE,
      duration: 7,
      cooldown: 30,
      instructions: [
        // Left: High risk (big enemy, big gate)
        { lane: Lane.LEFT, type: 'enemy', value: 40, delay: 0 },
        { lane: Lane.LEFT, type: 'gate', value: 50, delay: 1 },
        // Center: Medium risk
        { lane: Lane.CENTER, type: 'enemy', value: 20, delay: 0 },
        { lane: Lane.CENTER, type: 'gate', value: 30, delay: 1 },
        // Right: Low risk (small enemy, small gate)
        { lane: Lane.RIGHT, type: 'enemy', value: 10, delay: 0 },
        { lane: Lane.RIGHT, type: 'gate', value: 15, delay: 1 }
      ]
    };
  }

  private createWavePattern(): Pattern {
    return {
      type: PatternType.WAVE,
      duration: 9,
      cooldown: 28,
      instructions: [
        // Sequential wave across lanes
        { lane: Lane.LEFT, type: 'gate', delay: 0 },
        { lane: Lane.CENTER, type: 'gate', delay: 0.8 },
        { lane: Lane.RIGHT, type: 'gate', delay: 1.6 },
        { lane: Lane.RIGHT, type: 'enemy', delay: 3 },
        { lane: Lane.CENTER, type: 'enemy', delay: 3.8 },
        { lane: Lane.LEFT, type: 'enemy', delay: 4.6 },
        { lane: Lane.LEFT, type: 'gate', delay: 6 },
        { lane: Lane.CENTER, type: 'gate', delay: 6.8 },
        { lane: Lane.RIGHT, type: 'gate', delay: 7.6 }
      ]
    };
  }

  private createGauntletPattern(): Pattern {
    return {
      type: PatternType.GAUNTLET,
      duration: 10,
      cooldown: 32,
      instructions: [
        // Rapid alternating obstacles
        { lane: Lane.CENTER, type: 'enemy', delay: 0 },
        { lane: Lane.LEFT, type: 'gate', delay: 0.5 },
        { lane: Lane.RIGHT, type: 'enemy', delay: 1 },
        { lane: Lane.CENTER, type: 'gate', delay: 1.5 },
        { lane: Lane.LEFT, type: 'enemy', delay: 2 },
        { lane: Lane.RIGHT, type: 'gate', delay: 2.5 },
        { lane: Lane.CENTER, type: 'enemy', delay: 3 },
        { lane: Lane.LEFT, type: 'gate', delay: 3.5 },
        { lane: Lane.RIGHT, type: 'enemy', delay: 4 }
      ]
    };
  }

  /**
   * Activate a pattern
   */
  private activatePattern(pattern: Pattern): void {
    this.activePattern = pattern;
    this.patternTimer = pattern.duration;
    this.lastPatternType = pattern.type;

    // Queue all instructions with delays
    this.instructionQueue = pattern.instructions.map(inst => ({
      instruction: inst,
      timeLeft: inst.delay || 0
    }));

    if (this.onPatternStart) {
      this.onPatternStart(pattern.type);
    }
  }

  /**
   * End current pattern
   */
  private endPattern(): void {
    if (this.activePattern) {
      if (this.onPatternEnd) {
        this.onPatternEnd(this.activePattern.type);
      }

      this.activePattern = null;
      this.instructionQueue = [];
      this.timeSincePattern = 0;
    }
  }

  /**
   * Check if pattern is active
   */
  public hasActivePattern(): boolean {
    return this.activePattern !== null;
  }

  /**
   * Get active pattern type
   */
  public getActivePatternType(): PatternType | null {
    return this.activePattern?.type || null;
  }

  public reset(): void {
    this.activePattern = null;
    this.patternTimer = 0;
    this.timeSincePattern = 0;
    this.instructionQueue = [];
    this.lastPatternType = null;
  }

  public destroy(): void {
    this.reset();
  }
}
