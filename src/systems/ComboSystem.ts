import { IUpdatable, IDestroyable } from '../core/Interfaces';

/**
 * Combo system that tracks consecutive successful actions
 * and applies multipliers to scores
 */
export class ComboSystem implements IUpdatable, IDestroyable {
  private comboCount: number = 0;
  private comboTimer: number = 0;
  private comboTimeout: number = 3.0; // Seconds before combo resets
  private maxCombo: number = 0;

  private onComboChanged?: (combo: number, multiplier: number) => void;
  private onComboExpired?: () => void;
  private onNewMaxCombo?: (maxCombo: number) => void;

  constructor(
    onComboChanged?: (combo: number, multiplier: number) => void,
    onComboExpired?: () => void,
    onNewMaxCombo?: (maxCombo: number) => void
  ) {
    this.onComboChanged = onComboChanged;
    this.onComboExpired = onComboExpired;
    this.onNewMaxCombo = onNewMaxCombo;
  }

  /**
   * Register a successful action (gate collection, etc.)
   */
  public addToCombo(): void {
    this.comboCount++;
    this.comboTimer = this.comboTimeout;

    // Track max combo
    if (this.comboCount > this.maxCombo) {
      this.maxCombo = this.comboCount;
      if (this.onNewMaxCombo) {
        this.onNewMaxCombo(this.maxCombo);
      }
    }

    // Notify listeners
    if (this.onComboChanged) {
      this.onComboChanged(this.comboCount, this.getMultiplier());
    }
  }

  /**
   * Reset combo (on enemy hit or timeout)
   */
  public resetCombo(): void {
    if (this.comboCount > 0) {
      this.comboCount = 0;
      this.comboTimer = 0;

      if (this.onComboExpired) {
        this.onComboExpired();
      }
    }
  }

  /**
   * Get current combo count
   */
  public getCombo(): number {
    return this.comboCount;
  }

  /**
   * Get max combo achieved
   */
  public getMaxCombo(): number {
    return this.maxCombo;
  }

  /**
   * Get combo time remaining
   */
  public getTimeRemaining(): number {
    return this.comboTimer;
  }

  /**
   * Get combo timeout duration
   */
  public getTimeout(): number {
    return this.comboTimeout;
  }

  /**
   * Calculate score multiplier based on combo
   * Combo thresholds:
   * 0-2: 1x
   * 3-5: 1.5x
   * 6-9: 2x
   * 10-14: 2.5x
   * 15+: 3x
   */
  public getMultiplier(): number {
    if (this.comboCount >= 15) return 3.0;
    if (this.comboCount >= 10) return 2.5;
    if (this.comboCount >= 6) return 2.0;
    if (this.comboCount >= 3) return 1.5;
    return 1.0;
  }

  /**
   * Get combo tier name
   */
  public getComboTier(): string {
    if (this.comboCount >= 15) return 'LEGENDARY';
    if (this.comboCount >= 10) return 'EPIC';
    if (this.comboCount >= 6) return 'SUPER';
    if (this.comboCount >= 3) return 'GREAT';
    return '';
  }

  /**
   * Check if combo is active
   */
  public isActive(): boolean {
    return this.comboCount > 0;
  }

  public update(deltaTime: number): void {
    if (this.comboTimer > 0) {
      this.comboTimer -= deltaTime;

      if (this.comboTimer <= 0) {
        this.resetCombo();
      }
    }
  }

  public destroy(): void {
    this.resetCombo();
  }
}
