import { IUpdatable, IDestroyable } from '../core/Interfaces';

/**
 * Difficulty progression system that adjusts game parameters over time
 */
export class DifficultySystem implements IUpdatable, IDestroyable {
  private distance: number = 0;
  private currentLevel: number = 1;
  private maxLevel: number = 10;

  // Base values
  private baseObstacleInterval: number = 2.5;
  private baseEnemyCountMin: number = 10;
  private baseEnemyCountMax: number = 50;

  // Current scaled values
  private obstacleIntervalMultiplier: number = 1.0;
  private enemyCountMultiplier: number = 1.0;
  private gameSpeedMultiplier: number = 1.0;
  private powerUpChance: number = 0.15; // 15% base chance

  // Callbacks
  private onLevelUp?: (level: number) => void;

  constructor(onLevelUp?: (level: number) => void) {
    this.onLevelUp = onLevelUp;
  }

  /**
   * Update difficulty based on distance traveled
   */
  public updateDistance(distance: number): void {
    this.distance = distance;

    // Calculate level based on distance (every 100 units = 1 level)
    const newLevel = Math.min(
      Math.floor(distance / 100) + 1,
      this.maxLevel
    );

    if (newLevel > this.currentLevel) {
      this.currentLevel = newLevel;
      if (this.onLevelUp) {
        this.onLevelUp(this.currentLevel);
      }
    }

    // Update difficulty multipliers
    this.updateMultipliers();
  }

  /**
   * Calculate difficulty multipliers based on current level
   */
  private updateMultipliers(): void {
    const levelProgress = (this.currentLevel - 1) / (this.maxLevel - 1);

    // Obstacle spawn rate increases (interval decreases)
    // Level 1: 2.5s, Level 10: 1.2s
    this.obstacleIntervalMultiplier = 1.0 - (levelProgress * 0.52); // 1.0 -> 0.48

    // Enemy count increases
    // Level 1: 10-50, Level 10: 20-100
    this.enemyCountMultiplier = 1.0 + (levelProgress * 1.0); // 1.0 -> 2.0

    // Game speed increases slightly
    // Level 1: 1.0x, Level 10: 1.3x
    this.gameSpeedMultiplier = 1.0 + (levelProgress * 0.3); // 1.0 -> 1.3

    // Power-up chance decreases slightly (more challenging)
    // Level 1: 15%, Level 10: 10%
    this.powerUpChance = 0.15 - (levelProgress * 0.05); // 0.15 -> 0.10
  }

  /**
   * Get current level
   */
  public getLevel(): number {
    return this.currentLevel;
  }

  /**
   * Get obstacle spawn interval (in seconds)
   */
  public getObstacleInterval(): number {
    return this.baseObstacleInterval * this.obstacleIntervalMultiplier;
  }

  /**
   * Get enemy count range for current difficulty
   */
  public getEnemyCountRange(): { min: number; max: number } {
    return {
      min: Math.floor(this.baseEnemyCountMin * this.enemyCountMultiplier),
      max: Math.floor(this.baseEnemyCountMax * this.enemyCountMultiplier)
    };
  }

  /**
   * Get game speed multiplier
   */
  public getSpeedMultiplier(): number {
    return this.gameSpeedMultiplier;
  }

  /**
   * Get power-up spawn chance (0-1)
   */
  public getPowerUpChance(): number {
    return this.powerUpChance;
  }

  /**
   * Get enemy crowd percentage (vs gates)
   * Increases with difficulty
   */
  public getEnemyPercentage(): number {
    const levelProgress = (this.currentLevel - 1) / (this.maxLevel - 1);
    // Level 1: 25%, Level 10: 40%
    return 0.25 + (levelProgress * 0.15);
  }

  /**
   * Get multiply gate percentage
   */
  public getMultiplyGatePercentage(): number {
    // Decreases slightly with difficulty (harder to grow)
    const levelProgress = (this.currentLevel - 1) / (this.maxLevel - 1);
    // Level 1: 45%, Level 10: 35%
    return 0.45 - (levelProgress * 0.10);
  }

  /**
   * Get addition gate percentage
   */
  public getAdditionGatePercentage(): number {
    // Remainder after enemy and multiply gates
    return 1.0 - this.getEnemyPercentage() - this.getMultiplyGatePercentage() - this.getPowerUpChance();
  }

  /**
   * Get level progress (0-1 within current level)
   */
  public getLevelProgress(): number {
    const distanceInLevel = this.distance % 100;
    return distanceInLevel / 100;
  }

  /**
   * Get distance to next level
   */
  public getDistanceToNextLevel(): number {
    if (this.currentLevel >= this.maxLevel) {
      return 0;
    }
    return 100 - (this.distance % 100);
  }

  /**
   * Get difficulty name for current level
   */
  public getDifficultyName(): string {
    if (this.currentLevel <= 2) return 'Easy';
    if (this.currentLevel <= 4) return 'Normal';
    if (this.currentLevel <= 6) return 'Hard';
    if (this.currentLevel <= 8) return 'Expert';
    return 'Master';
  }

  /**
   * Get difficulty color
   */
  public getDifficultyColor(): string {
    if (this.currentLevel <= 2) return '#48BB78'; // Green
    if (this.currentLevel <= 4) return '#3B82F6'; // Blue
    if (this.currentLevel <= 6) return '#F59E0B'; // Amber
    if (this.currentLevel <= 8) return '#EF4444'; // Red
    return '#8B5CF6'; // Purple
  }

  /**
   * Reset difficulty for new game
   */
  public reset(): void {
    this.distance = 0;
    this.currentLevel = 1;
    this.updateMultipliers();
  }

  public update(_deltaTime: number): void {
    // Difficulty updates happen through updateDistance() calls
  }

  public destroy(): void {
    // Nothing to clean up
  }
}
