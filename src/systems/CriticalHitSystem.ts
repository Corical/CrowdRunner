import { IUpdatable, IDestroyable } from '../core/Interfaces';

/**
 * Critical hit type
 */
export enum CriticalType {
  NORMAL = 'normal',      // 2x multiplier
  MEGA = 'mega',          // 5x multiplier
  ULTRA = 'ultra'         // 10x multiplier
}

/**
 * Critical hit event
 */
export interface CriticalHitEvent {
  type: CriticalType;
  multiplier: number;
  value: number;
  finalValue: number;
}

/**
 * Single Responsibility: Handle critical hit (random massive bonuses) for gate collections
 * Open/Closed: Easy to add new critical types
 * Dependency Inversion: Uses callbacks for communication
 */
export class CriticalHitSystem implements IUpdatable, IDestroyable {
  private baseCritChance: number = 0.10; // 10% base crit chance
  private megaCritChance: number = 0.02; // 2% mega crit chance
  private ultraCritChance: number = 0.005; // 0.5% ultra crit chance

  // Luck modifier (can be affected by combos, power-ups, etc.)
  private luckMultiplier: number = 1.0;

  private totalCrits: number = 0;
  private critsByType: Map<CriticalType, number> = new Map();

  private onCriticalHit?: (event: CriticalHitEvent) => void;

  private static readonly MULTIPLIERS = {
    [CriticalType.NORMAL]: 2.0,
    [CriticalType.MEGA]: 5.0,
    [CriticalType.ULTRA]: 10.0
  };

  constructor(onCriticalHit?: (event: CriticalHitEvent) => void) {
    this.onCriticalHit = onCriticalHit;
    this.critsByType.set(CriticalType.NORMAL, 0);
    this.critsByType.set(CriticalType.MEGA, 0);
    this.critsByType.set(CriticalType.ULTRA, 0);
  }

  /**
   * Roll for critical hit on gate collection
   * @param baseValue The base gate value
   * @returns Modified value if crit, otherwise original value
   */
  public rollCritical(baseValue: number): number {
    const roll = Math.random();

    // Check for crits in order of rarity (rarest first)
    const adjustedUltraChance = this.ultraCritChance * this.luckMultiplier;
    const adjustedMegaChance = this.megaCritChance * this.luckMultiplier;
    const adjustedNormalChance = this.baseCritChance * this.luckMultiplier;

    let critType: CriticalType | null = null;

    if (roll < adjustedUltraChance) {
      critType = CriticalType.ULTRA;
    } else if (roll < adjustedMegaChance) {
      critType = CriticalType.MEGA;
    } else if (roll < adjustedNormalChance) {
      critType = CriticalType.NORMAL;
    }

    if (critType) {
      const multiplier = CriticalHitSystem.MULTIPLIERS[critType];
      const finalValue = Math.floor(baseValue * multiplier);

      this.totalCrits++;
      this.critsByType.set(critType, (this.critsByType.get(critType) || 0) + 1);

      const event: CriticalHitEvent = {
        type: critType,
        multiplier,
        value: baseValue,
        finalValue
      };

      if (this.onCriticalHit) {
        this.onCriticalHit(event);
      }

      return finalValue;
    }

    // No crit
    return baseValue;
  }

  /**
   * Set luck multiplier (affects crit chance)
   */
  public setLuckMultiplier(multiplier: number): void {
    this.luckMultiplier = Math.max(0, multiplier);
  }

  /**
   * Get current luck multiplier
   */
  public getLuckMultiplier(): number {
    return this.luckMultiplier;
  }

  /**
   * Get total crits
   */
  public getTotalCrits(): number {
    return this.totalCrits;
  }

  /**
   * Get crits by type
   */
  public getCritsByType(): ReadonlyMap<CriticalType, number> {
    return this.critsByType;
  }

  /**
   * Get effective crit chance
   */
  public getEffectiveCritChance(): {
    normal: number;
    mega: number;
    ultra: number;
  } {
    return {
      normal: Math.min(1.0, this.baseCritChance * this.luckMultiplier),
      mega: Math.min(1.0, this.megaCritChance * this.luckMultiplier),
      ultra: Math.min(1.0, this.ultraCritChance * this.luckMultiplier)
    };
  }

  public update(_deltaTime: number): void {
    // No per-frame updates needed
  }

  public reset(): void {
    this.totalCrits = 0;
    this.critsByType.clear();
    this.critsByType.set(CriticalType.NORMAL, 0);
    this.critsByType.set(CriticalType.MEGA, 0);
    this.critsByType.set(CriticalType.ULTRA, 0);
    this.luckMultiplier = 1.0;
  }

  public destroy(): void {
    this.reset();
  }
}
