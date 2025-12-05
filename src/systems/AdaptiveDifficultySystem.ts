import { IUpdatable, IDestroyable } from '../core/Interfaces';

/**
 * Player performance metrics
 */
export interface PerformanceMetrics {
  gatesCollected: number;
  gatesMissed: number;
  enemiesHit: number;
  enemiesAvoided: number;
  averageCrowdSize: number;
  deaths: number;
}

/**
 * Difficulty adjustment state
 */
export enum DifficultyTrend {
  INCREASING = 'increasing',  // Player doing well
  STABLE = 'stable',          // Player balanced
  DECREASING = 'decreasing'   // Player struggling
}

/**
 * Single Responsibility: Adapt game difficulty based on player performance
 * Open/Closed: Easy to add new metrics or adjustment strategies
 * Dependency Inversion: Uses callbacks, not direct game references
 */
export class AdaptiveDifficultySystem implements IUpdatable, IDestroyable {
  private metrics: PerformanceMetrics = {
    gatesCollected: 0,
    gatesMissed: 0,
    enemiesHit: 0,
    enemiesAvoided: 0,
    averageCrowdSize: 0,
    deaths: 0
  };

  private performanceHistory: number[] = [];
  private historySize: number = 10;
  private evaluationInterval: number = 15; // Evaluate every 15 seconds
  private timeSinceEvaluation: number = 0;

  // Difficulty modifiers
  private obstacleFrequencyMultiplier: number = 1.0;
  private enemyStrengthMultiplier: number = 1.0;
  private rewardMultiplier: number = 1.0;
  private powerUpFrequencyMultiplier: number = 1.0;

  private currentTrend: DifficultyTrend = DifficultyTrend.STABLE;

  private onDifficultyAdjusted?: (trend: DifficultyTrend, score: number) => void;

  constructor(onDifficultyAdjusted?: (trend: DifficultyTrend, score: number) => void) {
    this.onDifficultyAdjusted = onDifficultyAdjusted;
  }

  /**
   * Record gate collection
   */
  public recordGateCollected(): void {
    this.metrics.gatesCollected++;
  }

  /**
   * Record missed gate
   */
  public recordGateMissed(): void {
    this.metrics.gatesMissed++;
  }

  /**
   * Record enemy hit
   */
  public recordEnemyHit(): void {
    this.metrics.enemiesHit++;
  }

  /**
   * Record enemy avoided
   */
  public recordEnemyAvoided(): void {
    this.metrics.enemiesAvoided++;
  }

  /**
   * Update average crowd size
   */
  public updateCrowdSize(size: number): void {
    if (this.metrics.averageCrowdSize === 0) {
      this.metrics.averageCrowdSize = size;
    } else {
      // Rolling average
      this.metrics.averageCrowdSize = this.metrics.averageCrowdSize * 0.9 + size * 0.1;
    }
  }

  /**
   * Record death
   */
  public recordDeath(): void {
    this.metrics.deaths++;
  }

  /**
   * Evaluate player performance and adjust difficulty
   */
  public update(deltaTime: number): void {
    this.timeSinceEvaluation += deltaTime;

    if (this.timeSinceEvaluation >= this.evaluationInterval) {
      this.evaluatePerformance();
      this.timeSinceEvaluation = 0;
    }
  }

  /**
   * Calculate performance score (0-1, higher = better)
   */
  private calculatePerformanceScore(): number {
    const totalGates = this.metrics.gatesCollected + this.metrics.gatesMissed;
    const totalEnemies = this.metrics.enemiesHit + this.metrics.enemiesAvoided;

    if (totalGates === 0 && totalEnemies === 0) {
      return 0.5; // Neutral if no data
    }

    // Gate collection rate (0-1)
    const gateRate = totalGates > 0 ? this.metrics.gatesCollected / totalGates : 0.5;

    // Enemy avoidance rate (0-1)
    const avoidanceRate = totalEnemies > 0 ? this.metrics.enemiesAvoided / totalEnemies : 0.5;

    // Crowd size factor (normalized, higher = better)
    const crowdFactor = Math.min(this.metrics.averageCrowdSize / 100, 1.0);

    // Combined score (weighted)
    const score = (gateRate * 0.4) + (avoidanceRate * 0.4) + (crowdFactor * 0.2);

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Evaluate performance and adjust difficulty
   */
  private evaluatePerformance(): void {
    const score = this.calculatePerformanceScore();

    // Add to history
    this.performanceHistory.push(score);
    if (this.performanceHistory.length > this.historySize) {
      this.performanceHistory.shift();
    }

    // Need enough data to make adjustments
    if (this.performanceHistory.length < 3) {
      return;
    }

    // Calculate trend
    const avgScore = this.performanceHistory.reduce((a, b) => a + b, 0) / this.performanceHistory.length;

    // Determine trend
    let newTrend = DifficultyTrend.STABLE;
    if (avgScore > 0.65) {
      newTrend = DifficultyTrend.INCREASING;
    } else if (avgScore < 0.35) {
      newTrend = DifficultyTrend.DECREASING;
    }

    // Apply adjustments if trend changed
    if (newTrend !== this.currentTrend) {
      this.currentTrend = newTrend;
      this.adjustDifficulty(newTrend);

      if (this.onDifficultyAdjusted) {
        this.onDifficultyAdjusted(newTrend, avgScore);
      }
    }
  }

  /**
   * Adjust difficulty multipliers based on trend
   */
  private adjustDifficulty(trend: DifficultyTrend): void {
    switch (trend) {
      case DifficultyTrend.INCREASING:
        // Player doing well - make it harder
        this.obstacleFrequencyMultiplier = Math.min(1.3, this.obstacleFrequencyMultiplier + 0.1);
        this.enemyStrengthMultiplier = Math.min(1.3, this.enemyStrengthMultiplier + 0.1);
        this.rewardMultiplier = Math.max(0.9, this.rewardMultiplier - 0.05);
        this.powerUpFrequencyMultiplier = Math.max(0.8, this.powerUpFrequencyMultiplier - 0.05);
        break;

      case DifficultyTrend.DECREASING:
        // Player struggling - make it easier
        this.obstacleFrequencyMultiplier = Math.max(0.7, this.obstacleFrequencyMultiplier - 0.1);
        this.enemyStrengthMultiplier = Math.max(0.7, this.enemyStrengthMultiplier - 0.1);
        this.rewardMultiplier = Math.min(1.3, this.rewardMultiplier + 0.1);
        this.powerUpFrequencyMultiplier = Math.min(1.4, this.powerUpFrequencyMultiplier + 0.1);
        break;

      case DifficultyTrend.STABLE:
        // Gradually return to baseline
        this.obstacleFrequencyMultiplier = this.lerp(this.obstacleFrequencyMultiplier, 1.0, 0.1);
        this.enemyStrengthMultiplier = this.lerp(this.enemyStrengthMultiplier, 1.0, 0.1);
        this.rewardMultiplier = this.lerp(this.rewardMultiplier, 1.0, 0.1);
        this.powerUpFrequencyMultiplier = this.lerp(this.powerUpFrequencyMultiplier, 1.0, 0.1);
        break;
    }
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  /**
   * Get current multipliers
   */
  public getObstacleFrequencyMultiplier(): number {
    return this.obstacleFrequencyMultiplier;
  }

  public getEnemyStrengthMultiplier(): number {
    return this.enemyStrengthMultiplier;
  }

  public getRewardMultiplier(): number {
    return this.rewardMultiplier;
  }

  public getPowerUpFrequencyMultiplier(): number {
    return this.powerUpFrequencyMultiplier;
  }

  public getCurrentTrend(): DifficultyTrend {
    return this.currentTrend;
  }

  public getMetrics(): Readonly<PerformanceMetrics> {
    return { ...this.metrics };
  }

  public reset(): void {
    this.metrics = {
      gatesCollected: 0,
      gatesMissed: 0,
      enemiesHit: 0,
      enemiesAvoided: 0,
      averageCrowdSize: 0,
      deaths: 0
    };
    this.performanceHistory = [];
    this.timeSinceEvaluation = 0;
    this.obstacleFrequencyMultiplier = 1.0;
    this.enemyStrengthMultiplier = 1.0;
    this.rewardMultiplier = 1.0;
    this.powerUpFrequencyMultiplier = 1.0;
    this.currentTrend = DifficultyTrend.STABLE;
  }

  public destroy(): void {
    this.reset();
  }
}
