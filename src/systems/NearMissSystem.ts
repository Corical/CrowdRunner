import { IUpdatable, IDestroyable } from '../core/Interfaces';

/**
 * Near miss bonus tier
 */
export enum NearMissTier {
  CLOSE = 'close',         // Within 3 units
  VERY_CLOSE = 'very_close', // Within 2 units
  EXTREME = 'extreme'      // Within 1 unit
}

/**
 * Near miss event data
 */
export interface NearMissEvent {
  tier: NearMissTier;
  distance: number;
  bonus: number;
  timestamp: number;
}

/**
 * Single Responsibility: Track and reward near misses with enemies
 * Open/Closed: Easy to add new tiers or bonus calculations
 * Dependency Inversion: Uses callbacks, no direct game references
 */
export class NearMissSystem implements IUpdatable, IDestroyable {
  private recentMisses: NearMissEvent[] = [];
  private missStreak: number = 0;
  private lastMissTime: number = 0;
  private streakTimeout: number = 3; // seconds

  private onNearMiss?: (event: NearMissEvent) => void;
  private onStreakBonus?: (streak: number, totalBonus: number) => void;

  private static readonly TIER_THRESHOLDS = {
    [NearMissTier.EXTREME]: 1.0,
    [NearMissTier.VERY_CLOSE]: 2.0,
    [NearMissTier.CLOSE]: 3.0
  };

  private static readonly TIER_BONUSES = {
    [NearMissTier.EXTREME]: 15,
    [NearMissTier.VERY_CLOSE]: 8,
    [NearMissTier.CLOSE]: 3
  };

  constructor(
    onNearMiss?: (event: NearMissEvent) => void,
    onStreakBonus?: (streak: number, totalBonus: number) => void
  ) {
    this.onNearMiss = onNearMiss;
    this.onStreakBonus = onStreakBonus;
  }

  /**
   * Check if a near miss occurred
   * @param enemyPosition Enemy position
   * @param playerPosition Player position
   * @param currentTime Current game time
   */
  public checkNearMiss(
    enemyPosition: { x: number; z: number },
    playerPosition: { x: number; z: number },
    currentTime: number
  ): void {
    // Calculate lateral distance (X-axis only, as enemy passes)
    const lateralDistance = Math.abs(enemyPosition.x - playerPosition.x);

    // Check if it's a near miss (within thresholds)
    let tier: NearMissTier | null = null;

    if (lateralDistance <= NearMissSystem.TIER_THRESHOLDS[NearMissTier.EXTREME]) {
      tier = NearMissTier.EXTREME;
    } else if (lateralDistance <= NearMissSystem.TIER_THRESHOLDS[NearMissTier.VERY_CLOSE]) {
      tier = NearMissTier.VERY_CLOSE;
    } else if (lateralDistance <= NearMissSystem.TIER_THRESHOLDS[NearMissTier.CLOSE]) {
      tier = NearMissTier.CLOSE;
    }

    if (tier) {
      this.registerNearMiss(tier, lateralDistance, currentTime);
    }
  }

  /**
   * Register a near miss event
   */
  private registerNearMiss(tier: NearMissTier, distance: number, timestamp: number): void {
    // Calculate streak
    if (timestamp - this.lastMissTime <= this.streakTimeout) {
      this.missStreak++;
    } else {
      this.missStreak = 1;
    }

    this.lastMissTime = timestamp;

    // Calculate bonus (base + streak multiplier)
    const baseBonus = NearMissSystem.TIER_BONUSES[tier];
    const streakMultiplier = 1 + (this.missStreak - 1) * 0.2; // +20% per streak
    const bonus = Math.floor(baseBonus * streakMultiplier);

    const event: NearMissEvent = {
      tier,
      distance,
      bonus,
      timestamp
    };

    this.recentMisses.push(event);

    // Trim history
    if (this.recentMisses.length > 10) {
      this.recentMisses.shift();
    }

    if (this.onNearMiss) {
      this.onNearMiss(event);
    }

    // Check for streak bonus
    if (this.missStreak >= 3 && this.missStreak % 3 === 0) {
      const streakBonus = this.missStreak * 10;
      if (this.onStreakBonus) {
        this.onStreakBonus(this.missStreak, streakBonus);
      }
    }
  }

  /**
   * Update system (check for streak timeout)
   */
  public update(_deltaTime: number): void {
    const currentTime = performance.now() / 1000;

    if (currentTime - this.lastMissTime > this.streakTimeout) {
      this.missStreak = 0;
    }
  }

  /**
   * Get current near miss streak
   */
  public getStreak(): number {
    return this.missStreak;
  }

  /**
   * Get recent near misses
   */
  public getRecentMisses(): ReadonlyArray<NearMissEvent> {
    return this.recentMisses;
  }

  /**
   * Get total bonus from recent misses
   */
  public getTotalRecentBonus(): number {
    return this.recentMisses.reduce((sum, miss) => sum + miss.bonus, 0);
  }

  public reset(): void {
    this.recentMisses = [];
    this.missStreak = 0;
    this.lastMissTime = 0;
  }

  public destroy(): void {
    this.reset();
  }
}
