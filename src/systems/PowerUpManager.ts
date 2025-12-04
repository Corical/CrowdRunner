import { PowerUpType } from '../entities/PowerUp';
import { IUpdatable, IDestroyable } from '../core/Interfaces';

/**
 * Active power-up state
 */
interface ActivePowerUp {
  type: PowerUpType;
  timeRemaining: number;
  duration: number;
}

/**
 * Manages active power-ups and their effects
 */
export class PowerUpManager implements IUpdatable, IDestroyable {
  private activePowerUps: Map<PowerUpType, ActivePowerUp> = new Map();
  private onPowerUpActivated?: (type: PowerUpType, duration: number) => void;
  private onPowerUpExpired?: (type: PowerUpType) => void;

  constructor(
    onActivated?: (type: PowerUpType, duration: number) => void,
    onExpired?: (type: PowerUpType) => void
  ) {
    this.onPowerUpActivated = onActivated;
    this.onPowerUpExpired = onExpired;
  }

  /**
   * Activate a power-up
   */
  public activatePowerUp(type: PowerUpType, duration: number): void {
    // If already active, extend duration
    const existing = this.activePowerUps.get(type);
    if (existing) {
      existing.timeRemaining = Math.max(existing.timeRemaining, duration);
      existing.duration = duration;
    } else {
      this.activePowerUps.set(type, {
        type,
        timeRemaining: duration,
        duration
      });
    }

    // Notify listeners
    if (this.onPowerUpActivated) {
      this.onPowerUpActivated(type, duration);
    }
  }

  /**
   * Check if a power-up is currently active
   */
  public isActive(type: PowerUpType): boolean {
    return this.activePowerUps.has(type);
  }

  /**
   * Get remaining time for a power-up
   */
  public getTimeRemaining(type: PowerUpType): number {
    return this.activePowerUps.get(type)?.timeRemaining ?? 0;
  }

  /**
   * Get all active power-ups
   */
  public getActivePowerUps(): ActivePowerUp[] {
    return Array.from(this.activePowerUps.values());
  }

  /**
   * Check if shield should protect from damage
   */
  public hasShield(): boolean {
    return this.isActive(PowerUpType.SHIELD);
  }

  /**
   * Check if magnet should auto-collect gates
   */
  public hasMagnet(): boolean {
    return this.isActive(PowerUpType.MAGNET);
  }

  /**
   * Check if speed boost is active
   */
  public hasSpeedBoost(): boolean {
    return this.isActive(PowerUpType.SPEED_BOOST);
  }

  /**
   * Check if multiplier is active
   */
  public hasMultiplier(): boolean {
    return this.isActive(PowerUpType.MULTIPLIER);
  }

  /**
   * Get speed multiplier based on active power-ups
   */
  public getSpeedMultiplier(): number {
    return this.hasSpeedBoost() ? 1.5 : 1.0;
  }

  /**
   * Get gate effect multiplier
   */
  public getGateMultiplier(): number {
    return this.hasMultiplier() ? 2.0 : 1.0;
  }

  /**
   * Consume shield (called when hit by enemy)
   */
  public consumeShield(): boolean {
    if (this.hasShield()) {
      this.activePowerUps.delete(PowerUpType.SHIELD);
      if (this.onPowerUpExpired) {
        this.onPowerUpExpired(PowerUpType.SHIELD);
      }
      return true;
    }
    return false;
  }

  public update(deltaTime: number): void {
    const expiredTypes: PowerUpType[] = [];

    // Update timers
    this.activePowerUps.forEach((powerUp, type) => {
      powerUp.timeRemaining -= deltaTime;

      if (powerUp.timeRemaining <= 0) {
        expiredTypes.push(type);
      }
    });

    // Remove expired power-ups
    expiredTypes.forEach(type => {
      this.activePowerUps.delete(type);
      if (this.onPowerUpExpired) {
        this.onPowerUpExpired(type);
      }
    });
  }

  public destroy(): void {
    this.activePowerUps.clear();
  }
}
