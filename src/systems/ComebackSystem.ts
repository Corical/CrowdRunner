import { IUpdatable, IDestroyable } from '../core/Interfaces';

/**
 * Comeback mechanic types
 */
export enum ComebackType {
  SHIELD_GRANT = 'shield_grant',        // Auto-grant shield
  GATE_BOOST = 'gate_boost',            // Increase gate values
  ENEMY_REDUCTION = 'enemy_reduction',  // Reduce enemy count
  POWERUP_RAIN = 'powerup_rain',        // Spawn multiple power-ups
  SECOND_CHANCE = 'second_chance'       // Survive at 1 HP
}

/**
 * Comeback state
 */
export interface ComebackState {
  isInDanger: boolean;
  dangerLevel: number; // 0-1, higher = more desperate
  mechanicsActive: Set<ComebackType>;
  secondChanceUsed: boolean;
}

/**
 * Single Responsibility: Provide comeback mechanics to help struggling players
 * Open/Closed: New comeback mechanics can be added easily
 * Dependency Inversion: Uses callbacks to trigger effects
 */
export class ComebackSystem implements IUpdatable, IDestroyable {
  private state: ComebackState = {
    isInDanger: false,
    dangerLevel: 0,
    mechanicsActive: new Set(),
    secondChanceUsed: false
  };

  private readonly LOW_CROWD_THRESHOLD = 30;
  private readonly CRITICAL_CROWD_THRESHOLD = 10;
  private readonly SECOND_CHANCE_THRESHOLD = 5;

  private timeSinceLastHelp: number = 0;
  private readonly HELP_COOLDOWN = 10; // seconds

  // Multipliers affected by comeback mechanics
  private gateValueMultiplier: number = 1.0;
  private enemyStrengthMultiplier: number = 1.0;

  private onComebackTriggered?: (type: ComebackType, dangerLevel: number) => void;
  private onSecondChanceUsed?: () => void;

  constructor(
    onComebackTriggered?: (type: ComebackType, dangerLevel: number) => void,
    onSecondChanceUsed?: () => void
  ) {
    this.onComebackTriggered = onComebackTriggered;
    this.onSecondChanceUsed = onSecondChanceUsed;
  }

  /**
   * Update comeback state based on player crowd size
   */
  public updateCrowdSize(crowdSize: number): void {
    const previousDangerLevel = this.state.dangerLevel;

    // Calculate danger level
    if (crowdSize <= this.CRITICAL_CROWD_THRESHOLD) {
      this.state.dangerLevel = 1.0; // Maximum danger
    } else if (crowdSize <= this.LOW_CROWD_THRESHOLD) {
      // Linear interpolation between thresholds
      this.state.dangerLevel = 1.0 - (
        (crowdSize - this.CRITICAL_CROWD_THRESHOLD) /
        (this.LOW_CROWD_THRESHOLD - this.CRITICAL_CROWD_THRESHOLD)
      );
    } else {
      this.state.dangerLevel = 0;
    }

    this.state.isInDanger = this.state.dangerLevel > 0;

    // Apply passive comeback mechanics
    this.updateMultipliers();

    // Check if danger level increased significantly
    if (this.state.dangerLevel > previousDangerLevel + 0.3) {
      this.triggerActiveComebackMechanic();
    }
  }

  /**
   * Update multipliers based on danger level
   */
  private updateMultipliers(): void {
    if (this.state.isInDanger) {
      // Boost gate values based on danger level
      this.gateValueMultiplier = 1.0 + (this.state.dangerLevel * 0.5); // Up to +50%

      // Reduce enemy strength
      this.enemyStrengthMultiplier = 1.0 - (this.state.dangerLevel * 0.3); // Up to -30%

      if (!this.state.mechanicsActive.has(ComebackType.GATE_BOOST)) {
        this.state.mechanicsActive.add(ComebackType.GATE_BOOST);
        this.state.mechanicsActive.add(ComebackType.ENEMY_REDUCTION);
      }
    } else {
      // Return to normal
      this.gateValueMultiplier = 1.0;
      this.enemyStrengthMultiplier = 1.0;
      this.state.mechanicsActive.delete(ComebackType.GATE_BOOST);
      this.state.mechanicsActive.delete(ComebackType.ENEMY_REDUCTION);
    }
  }

  /**
   * Trigger active comeback mechanic
   */
  private triggerActiveComebackMechanic(): void {
    if (this.timeSinceLastHelp < this.HELP_COOLDOWN) {
      return; // On cooldown
    }

    // Choose mechanic based on danger level
    let type: ComebackType;

    if (this.state.dangerLevel >= 0.8) {
      // Critical danger - powerful help
      type = Math.random() < 0.5 ? ComebackType.POWERUP_RAIN : ComebackType.SHIELD_GRANT;
    } else {
      // Moderate danger
      type = ComebackType.SHIELD_GRANT;
    }

    this.state.mechanicsActive.add(type);
    this.timeSinceLastHelp = 0;

    if (this.onComebackTriggered) {
      this.onComebackTriggered(type, this.state.dangerLevel);
    }
  }

  /**
   * Check if player should get second chance
   * @param crowdSize Current crowd size
   * @returns true if second chance triggered
   */
  public checkSecondChance(crowdSize: number): boolean {
    if (!this.state.secondChanceUsed && crowdSize <= this.SECOND_CHANCE_THRESHOLD && crowdSize > 0) {
      this.state.secondChanceUsed = true;

      if (this.onSecondChanceUsed) {
        this.onSecondChanceUsed();
      }

      return true;
    }

    return false;
  }

  /**
   * Update system
   */
  public update(deltaTime: number): void {
    this.timeSinceLastHelp += deltaTime;

    // Deactivate time-limited mechanics
    // (Most mechanics are passive and updated via multipliers)
  }

  /**
   * Get gate value multiplier
   */
  public getGateValueMultiplier(): number {
    return this.gateValueMultiplier;
  }

  /**
   * Get enemy strength multiplier
   */
  public getEnemyStrengthMultiplier(): number {
    return this.enemyStrengthMultiplier;
  }

  /**
   * Get current danger level
   */
  public getDangerLevel(): number {
    return this.state.dangerLevel;
  }

  /**
   * Check if in danger
   */
  public isInDanger(): boolean {
    return this.state.isInDanger;
  }

  /**
   * Get active comeback mechanics
   */
  public getActiveMechanics(): ReadonlySet<ComebackType> {
    return this.state.mechanicsActive;
  }

  /**
   * Check if specific mechanic is active
   */
  public isMechanicActive(type: ComebackType): boolean {
    return this.state.mechanicsActive.has(type);
  }

  /**
   * Has second chance been used
   */
  public isSecondChanceUsed(): boolean {
    return this.state.secondChanceUsed;
  }

  public reset(): void {
    this.state = {
      isInDanger: false,
      dangerLevel: 0,
      mechanicsActive: new Set(),
      secondChanceUsed: false
    };
    this.timeSinceLastHelp = 0;
    this.gateValueMultiplier = 1.0;
    this.enemyStrengthMultiplier = 1.0;
  }

  public destroy(): void {
    this.reset();
  }
}
