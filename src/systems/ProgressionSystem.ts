import { IDestroyable } from '../core/Interfaces';

/**
 * Game statistics
 */
export interface GameStats {
  score: number;
  distance: number;
  crowdCount: number;
  maxCrowd: number;
  gatesCollected: number;
  enemiesDefeated: number;
  maxCombo: number;
  powerUpsCollected: number;
  timePlayed: number;
}

/**
 * High score entry
 */
export interface HighScoreEntry {
  score: number;
  distance: number;
  maxCrowd: number;
  date: string;
  maxCombo: number;
}

/**
 * Milestone achievements
 */
export enum Milestone {
  FIRST_GATE = 'first_gate',
  CROWD_50 = 'crowd_50',
  CROWD_100 = 'crowd_100',
  CROWD_200 = 'crowd_200',
  CROWD_500 = 'crowd_500',
  DISTANCE_100 = 'distance_100',
  DISTANCE_500 = 'distance_500',
  DISTANCE_1000 = 'distance_1000',
  COMBO_5 = 'combo_5',
  COMBO_10 = 'combo_10',
  COMBO_20 = 'combo_20',
  POWER_UP_MASTER = 'power_up_master',
  SURVIVOR = 'survivor'
}

/**
 * Manages progression, high scores, and achievements
 */
export class ProgressionSystem implements IDestroyable {
  private static readonly STORAGE_KEY = 'crowdgame_highscores';
  private static readonly STATS_KEY = 'crowdgame_stats';
  private static readonly MILESTONES_KEY = 'crowdgame_milestones';

  private currentStats: GameStats;
  private allTimeStats: GameStats;
  private unlockedMilestones: Set<Milestone> = new Set();
  private onMilestoneUnlocked?: (milestone: Milestone) => void;

  constructor(onMilestoneUnlocked?: (milestone: Milestone) => void) {
    this.onMilestoneUnlocked = onMilestoneUnlocked;
    this.currentStats = this.createEmptyStats();
    this.allTimeStats = this.loadAllTimeStats();
    this.unlockedMilestones = this.loadMilestones();
  }

  /**
   * Create empty stats object
   */
  private createEmptyStats(): GameStats {
    return {
      score: 0,
      distance: 0,
      crowdCount: 5,
      maxCrowd: 5,
      gatesCollected: 0,
      enemiesDefeated: 0,
      maxCombo: 0,
      powerUpsCollected: 0,
      timePlayed: 0
    };
  }

  /**
   * Start a new game session
   */
  public startNewGame(): void {
    this.currentStats = this.createEmptyStats();
  }

  /**
   * Update current game stats
   */
  public updateStats(stats: Partial<GameStats>): void {
    Object.assign(this.currentStats, stats);

    // Update max values
    if (this.currentStats.crowdCount > this.currentStats.maxCrowd) {
      this.currentStats.maxCrowd = this.currentStats.crowdCount;
    }

    // Check for milestones
    this.checkMilestones();
  }

  /**
   * Get current game stats
   */
  public getCurrentStats(): GameStats {
    return { ...this.currentStats };
  }

  /**
   * Calculate final score based on stats
   */
  public calculateScore(): number {
    const distancePoints = this.currentStats.distance * 10;
    const crowdPoints = this.currentStats.maxCrowd * 5;
    const gateBonus = this.currentStats.gatesCollected * 50;
    const enemyBonus = this.currentStats.enemiesDefeated * 25;
    const comboBonus = this.currentStats.maxCombo * 100;

    return Math.floor(
      distancePoints +
      crowdPoints +
      gateBonus +
      enemyBonus +
      comboBonus
    );
  }

  /**
   * End game and save high score
   */
  public endGame(): { score: number; isNewHighScore: boolean; rank: number } {
    const score = this.calculateScore();
    this.currentStats.score = score;

    // Update all-time stats
    this.updateAllTimeStats();

    // Save high score
    const { isNewHighScore, rank } = this.saveHighScore();

    return { score, isNewHighScore, rank };
  }

  /**
   * Update all-time cumulative stats
   */
  private updateAllTimeStats(): void {
    this.allTimeStats.gatesCollected += this.currentStats.gatesCollected;
    this.allTimeStats.enemiesDefeated += this.currentStats.enemiesDefeated;
    this.allTimeStats.powerUpsCollected += this.currentStats.powerUpsCollected;
    this.allTimeStats.timePlayed += this.currentStats.timePlayed;

    // Update maximums
    if (this.currentStats.maxCrowd > this.allTimeStats.maxCrowd) {
      this.allTimeStats.maxCrowd = this.currentStats.maxCrowd;
    }
    if (this.currentStats.maxCombo > this.allTimeStats.maxCombo) {
      this.allTimeStats.maxCombo = this.currentStats.maxCombo;
    }
    if (this.currentStats.distance > this.allTimeStats.distance) {
      this.allTimeStats.distance = this.currentStats.distance;
    }
    if (this.currentStats.score > this.allTimeStats.score) {
      this.allTimeStats.score = this.currentStats.score;
    }

    this.saveAllTimeStats();
  }

  /**
   * Check and unlock milestones
   */
  private checkMilestones(): void {
    const checks: [Milestone, boolean][] = [
      [Milestone.FIRST_GATE, this.currentStats.gatesCollected >= 1],
      [Milestone.CROWD_50, this.currentStats.crowdCount >= 50],
      [Milestone.CROWD_100, this.currentStats.crowdCount >= 100],
      [Milestone.CROWD_200, this.currentStats.crowdCount >= 200],
      [Milestone.CROWD_500, this.currentStats.crowdCount >= 500],
      [Milestone.DISTANCE_100, this.currentStats.distance >= 100],
      [Milestone.DISTANCE_500, this.currentStats.distance >= 500],
      [Milestone.DISTANCE_1000, this.currentStats.distance >= 1000],
      [Milestone.COMBO_5, this.currentStats.maxCombo >= 5],
      [Milestone.COMBO_10, this.currentStats.maxCombo >= 10],
      [Milestone.COMBO_20, this.currentStats.maxCombo >= 20],
      [Milestone.POWER_UP_MASTER, this.currentStats.powerUpsCollected >= 10],
      [Milestone.SURVIVOR, this.currentStats.enemiesDefeated >= 50]
    ];

    checks.forEach(([milestone, condition]) => {
      if (condition && !this.unlockedMilestones.has(milestone)) {
        this.unlockMilestone(milestone);
      }
    });
  }

  /**
   * Unlock a milestone
   */
  private unlockMilestone(milestone: Milestone): void {
    this.unlockedMilestones.add(milestone);
    this.saveMilestones();

    if (this.onMilestoneUnlocked) {
      this.onMilestoneUnlocked(milestone);
    }
  }

  /**
   * Get milestone display info
   */
  public getMilestoneInfo(milestone: Milestone): { title: string; description: string } {
    const info: Record<Milestone, { title: string; description: string }> = {
      [Milestone.FIRST_GATE]: { title: 'First Steps', description: 'Collect your first gate' },
      [Milestone.CROWD_50]: { title: 'Growing Strong', description: 'Reach 50 crowd members' },
      [Milestone.CROWD_100]: { title: 'Century Club', description: 'Reach 100 crowd members' },
      [Milestone.CROWD_200]: { title: 'Massive Crowd', description: 'Reach 200 crowd members' },
      [Milestone.CROWD_500]: { title: 'Legendary Army', description: 'Reach 500 crowd members' },
      [Milestone.DISTANCE_100]: { title: 'Marathon', description: 'Travel 100 units' },
      [Milestone.DISTANCE_500]: { title: 'Ultra Marathon', description: 'Travel 500 units' },
      [Milestone.DISTANCE_1000]: { title: 'Epic Journey', description: 'Travel 1000 units' },
      [Milestone.COMBO_5]: { title: 'Combo Starter', description: 'Achieve 5x combo' },
      [Milestone.COMBO_10]: { title: 'Combo Master', description: 'Achieve 10x combo' },
      [Milestone.COMBO_20]: { title: 'Combo Legend', description: 'Achieve 20x combo' },
      [Milestone.POWER_UP_MASTER]: { title: 'Power Up Master', description: 'Collect 10 power-ups' },
      [Milestone.SURVIVOR]: { title: 'Survivor', description: 'Defeat 50 enemy crowds' }
    };

    return info[milestone];
  }

  /**
   * Get all unlocked milestones
   */
  public getUnlockedMilestones(): Milestone[] {
    return Array.from(this.unlockedMilestones);
  }

  /**
   * Save high score
   */
  private saveHighScore(): { isNewHighScore: boolean; rank: number } {
    const highScores = this.getHighScores();

    const newEntry: HighScoreEntry = {
      score: this.currentStats.score,
      distance: this.currentStats.distance,
      maxCrowd: this.currentStats.maxCrowd,
      maxCombo: this.currentStats.maxCombo,
      date: new Date().toISOString()
    };

    highScores.push(newEntry);
    highScores.sort((a, b) => b.score - a.score);

    // Keep top 10
    const top10 = highScores.slice(0, 10);

    try {
      localStorage.setItem(ProgressionSystem.STORAGE_KEY, JSON.stringify(top10));
    } catch (error) {
      console.warn('Could not save high score:', error);
    }

    const rank = top10.findIndex(entry => entry === newEntry) + 1;
    const isNewHighScore = rank === 1;

    return { isNewHighScore, rank };
  }

  /**
   * Get high scores list
   */
  public getHighScores(): HighScoreEntry[] {
    try {
      const data = localStorage.getItem(ProgressionSystem.STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn('Could not load high scores:', error);
    }
    return [];
  }

  /**
   * Load all-time stats
   */
  private loadAllTimeStats(): GameStats {
    try {
      const data = localStorage.getItem(ProgressionSystem.STATS_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn('Could not load stats:', error);
    }
    return this.createEmptyStats();
  }

  /**
   * Save all-time stats
   */
  private saveAllTimeStats(): void {
    try {
      localStorage.setItem(ProgressionSystem.STATS_KEY, JSON.stringify(this.allTimeStats));
    } catch (error) {
      console.warn('Could not save stats:', error);
    }
  }

  /**
   * Get all-time stats
   */
  public getAllTimeStats(): GameStats {
    return { ...this.allTimeStats };
  }

  /**
   * Load milestones
   */
  private loadMilestones(): Set<Milestone> {
    try {
      const data = localStorage.getItem(ProgressionSystem.MILESTONES_KEY);
      if (data) {
        return new Set(JSON.parse(data));
      }
    } catch (error) {
      console.warn('Could not load milestones:', error);
    }
    return new Set();
  }

  /**
   * Save milestones
   */
  private saveMilestones(): void {
    try {
      const milestones = Array.from(this.unlockedMilestones);
      localStorage.setItem(ProgressionSystem.MILESTONES_KEY, JSON.stringify(milestones));
    } catch (error) {
      console.warn('Could not save milestones:', error);
    }
  }

  public destroy(): void {
    // Nothing to clean up
  }
}
