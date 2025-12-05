import { IUpdatable, IDestroyable } from '../core/Interfaces';

/**
 * Momentum tier levels
 */
export enum MomentumTier {
  NONE = 0,
  HOT = 1,      // 3 consecutive gates
  BLAZING = 2,  // 5 consecutive gates
  UNSTOPPABLE = 3 // 8 consecutive gates
}

/**
 * Tracks player performance and grants momentum bonuses
 */
export class MomentumSystem implements IUpdatable, IDestroyable {
  private consecutiveGates: number = 0;
  private consecutiveNoDamage: number = 0;
  private currentTier: MomentumTier = MomentumTier.NONE;
  private noDamageTimer: number = 0;

  private onTierChange?: (tier: MomentumTier) => void;
  private onAutoShield?: () => void;

  constructor(
    onTierChange?: (tier: MomentumTier) => void,
    onAutoShield?: () => void
  ) {
    this.onTierChange = onTierChange;
    this.onAutoShield = onAutoShield;
  }

  /**
   * Call when player collects a gate
   */
  public onGateCollected(): void {
    this.consecutiveGates++;
    this.updateTier();
  }

  /**
   * Call when player hits an enemy
   */
  public onEnemyHit(): void {
    this.consecutiveGates = 0;
    this.consecutiveNoDamage = 0;
    this.noDamageTimer = 0;
    this.updateTier();
  }

  /**
   * Update momentum tier based on consecutive gates
   */
  private updateTier(): void {
    const oldTier = this.currentTier;
    let newTier = MomentumTier.NONE;

    if (this.consecutiveGates >= 8) {
      newTier = MomentumTier.UNSTOPPABLE;
    } else if (this.consecutiveGates >= 5) {
      newTier = MomentumTier.BLAZING;
    } else if (this.consecutiveGates >= 3) {
      newTier = MomentumTier.HOT;
    }

    if (newTier !== oldTier) {
      this.currentTier = newTier;
      if (this.onTierChange) {
        this.onTierChange(newTier);
      }
    }
  }

  /**
   * Get gate value multiplier based on momentum
   */
  public getGateMultiplier(): number {
    switch (this.currentTier) {
      case MomentumTier.HOT:
        return 1.25; // +25%
      case MomentumTier.BLAZING:
        return 1.5; // +50%
      case MomentumTier.UNSTOPPABLE:
        return 2.0; // +100%
      default:
        return 1.0;
    }
  }

  /**
   * Get current momentum tier
   */
  public getTier(): MomentumTier {
    return this.currentTier;
  }

  /**
   * Get consecutive gates count
   */
  public getConsecutiveGates(): number {
    return this.consecutiveGates;
  }

  /**
   * Get tier name
   */
  public getTierName(): string {
    switch (this.currentTier) {
      case MomentumTier.HOT:
        return 'HOT';
      case MomentumTier.BLAZING:
        return 'BLAZING';
      case MomentumTier.UNSTOPPABLE:
        return 'UNSTOPPABLE';
      default:
        return '';
    }
  }

  public update(deltaTime: number): void {
    // Track no-damage time
    this.noDamageTimer += deltaTime;

    // Auto-shield at 20 seconds no damage
    if (this.noDamageTimer >= 20 && this.consecutiveNoDamage === 0) {
      this.consecutiveNoDamage = 1;
      if (this.onAutoShield) {
        this.onAutoShield();
      }
    }
  }

  public reset(): void {
    this.consecutiveGates = 0;
    this.consecutiveNoDamage = 0;
    this.currentTier = MomentumTier.NONE;
    this.noDamageTimer = 0;
  }

  public destroy(): void {
    this.reset();
  }
}
