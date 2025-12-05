import { IUpdatable, IDestroyable } from '../core/Interfaces';

/**
 * Random event types that modify gameplay temporarily
 */
export enum RandomEventType {
  DOUBLE_TROUBLE = 'double_trouble',   // 2x enemies AND 2x gates
  FAMINE = 'famine',                   // Only enemies spawn
  FEAST = 'feast',                     // Only gates spawn
  CHAOS = 'chaos',                     // Random lane swapping
  GOLDEN_RUSH = 'golden_rush',         // All gates worth 2x
  SPEED_DEMON = 'speed_demon',         // Everything moves faster
  SLOW_MOTION = 'slow_motion',         // Everything slows down
  MEGA_ENEMIES = 'mega_enemies',       // Fewer but much bigger enemies
  TINY_GATES = 'tiny_gates',           // More frequent but smaller gates
  JACKPOT = 'jackpot',                 // Rare! All gates are +100
}

/**
 * Event configuration
 */
interface EventConfig {
  name: string;
  duration: number;
  rarity: number; // 0-1, lower = more rare
  description: string;
}

/**
 * Active event state
 */
interface ActiveEvent {
  type: RandomEventType;
  timeRemaining: number;
  config: EventConfig;
}

/**
 * Random Event System - Creates dynamic gameplay moments
 */
export class RandomEventSystem implements IUpdatable, IDestroyable {
  private activeEvent: ActiveEvent | null = null;
  private timeSinceLastEvent: number = 0;
  private minEventInterval: number = 30; // Min 30s between events
  private maxEventInterval: number = 60; // Max 60s between events
  private nextEventTime: number;

  private onEventStart?: (type: RandomEventType) => void;
  private onEventEnd?: (type: RandomEventType) => void;

  private static readonly EVENTS: Record<RandomEventType, EventConfig> = {
    [RandomEventType.DOUBLE_TROUBLE]: {
      name: 'Double Trouble',
      duration: 15,
      rarity: 0.8,
      description: '2x enemies, 2x gates!'
    },
    [RandomEventType.FAMINE]: {
      name: 'Famine',
      duration: 10,
      rarity: 0.7,
      description: 'Only enemies!'
    },
    [RandomEventType.FEAST]: {
      name: 'Feast',
      duration: 10,
      rarity: 0.6,
      description: 'Only gates!'
    },
    [RandomEventType.CHAOS]: {
      name: 'Chaos Mode',
      duration: 12,
      rarity: 0.5,
      description: 'Obstacles switch lanes!'
    },
    [RandomEventType.GOLDEN_RUSH]: {
      name: 'Golden Rush',
      duration: 8,
      rarity: 0.4,
      description: 'All gates 2x value!'
    },
    [RandomEventType.SPEED_DEMON]: {
      name: 'Speed Demon',
      duration: 10,
      rarity: 0.7,
      description: '2x speed!'
    },
    [RandomEventType.SLOW_MOTION]: {
      name: 'Slow Motion',
      duration: 8,
      rarity: 0.6,
      description: '0.5x speed!'
    },
    [RandomEventType.MEGA_ENEMIES]: {
      name: 'Mega Enemies',
      duration: 12,
      rarity: 0.5,
      description: 'Huge enemies!'
    },
    [RandomEventType.TINY_GATES]: {
      name: 'Tiny Gates',
      duration: 15,
      rarity: 0.6,
      description: 'Small but frequent!'
    },
    [RandomEventType.JACKPOT]: {
      name: '💰 JACKPOT 💰',
      duration: 5,
      rarity: 0.1,
      description: 'ALL GATES +100!'
    }
  };

  constructor(
    onStart?: (type: RandomEventType) => void,
    onEnd?: (type: RandomEventType) => void
  ) {
    this.onEventStart = onStart;
    this.onEventEnd = onEnd;
    this.nextEventTime = this.getRandomInterval();
  }

  private getRandomInterval(): number {
    return this.minEventInterval + Math.random() * (this.maxEventInterval - this.minEventInterval);
  }

  private selectRandomEvent(): RandomEventType {
    // Weighted random selection based on rarity
    const events = Object.entries(RandomEventSystem.EVENTS);
    const totalWeight = events.reduce((sum, [_, config]) => sum + config.rarity, 0);

    let random = Math.random() * totalWeight;
    for (const [type, config] of events) {
      random -= config.rarity;
      if (random <= 0) {
        return type as RandomEventType;
      }
    }

    return RandomEventType.DOUBLE_TROUBLE;
  }

  public update(deltaTime: number): void {
    // Update active event
    if (this.activeEvent) {
      this.activeEvent.timeRemaining -= deltaTime;

      if (this.activeEvent.timeRemaining <= 0) {
        // Event ended
        if (this.onEventEnd) {
          this.onEventEnd(this.activeEvent.type);
        }
        this.activeEvent = null;
        this.timeSinceLastEvent = 0;
        this.nextEventTime = this.getRandomInterval();
      }
    } else {
      // Check if it's time for a new event
      this.timeSinceLastEvent += deltaTime;

      if (this.timeSinceLastEvent >= this.nextEventTime) {
        const eventType = this.selectRandomEvent();
        const config = RandomEventSystem.EVENTS[eventType];

        this.activeEvent = {
          type: eventType,
          timeRemaining: config.duration,
          config
        };

        if (this.onEventStart) {
          this.onEventStart(eventType);
        }
      }
    }
  }

  public getActiveEvent(): ActiveEvent | null {
    return this.activeEvent;
  }

  public isEventActive(type: RandomEventType): boolean {
    return this.activeEvent?.type === type;
  }

  public hasActiveEvent(): boolean {
    return this.activeEvent !== null;
  }

  public getEventMultipliers(): {
    gateSpawnMultiplier: number;
    enemySpawnMultiplier: number;
    gateValueMultiplier: number;
    enemySizeMultiplier: number;
    speedMultiplier: number;
  } {
    if (!this.activeEvent) {
      return {
        gateSpawnMultiplier: 1.0,
        enemySpawnMultiplier: 1.0,
        gateValueMultiplier: 1.0,
        enemySizeMultiplier: 1.0,
        speedMultiplier: 1.0
      };
    }

    switch (this.activeEvent.type) {
      case RandomEventType.DOUBLE_TROUBLE:
        return { gateSpawnMultiplier: 2, enemySpawnMultiplier: 2, gateValueMultiplier: 1, enemySizeMultiplier: 1, speedMultiplier: 1 };
      case RandomEventType.FAMINE:
        return { gateSpawnMultiplier: 0, enemySpawnMultiplier: 2, gateValueMultiplier: 1, enemySizeMultiplier: 1, speedMultiplier: 1 };
      case RandomEventType.FEAST:
        return { gateSpawnMultiplier: 2, enemySpawnMultiplier: 0, gateValueMultiplier: 1, enemySizeMultiplier: 1, speedMultiplier: 1 };
      case RandomEventType.GOLDEN_RUSH:
        return { gateSpawnMultiplier: 1, enemySpawnMultiplier: 1, gateValueMultiplier: 2, enemySizeMultiplier: 1, speedMultiplier: 1 };
      case RandomEventType.SPEED_DEMON:
        return { gateSpawnMultiplier: 1, enemySpawnMultiplier: 1, gateValueMultiplier: 1, enemySizeMultiplier: 1, speedMultiplier: 2 };
      case RandomEventType.SLOW_MOTION:
        return { gateSpawnMultiplier: 1, enemySpawnMultiplier: 1, gateValueMultiplier: 1, enemySizeMultiplier: 1, speedMultiplier: 0.5 };
      case RandomEventType.MEGA_ENEMIES:
        return { gateSpawnMultiplier: 1, enemySpawnMultiplier: 0.5, gateValueMultiplier: 1, enemySizeMultiplier: 3, speedMultiplier: 1 };
      case RandomEventType.TINY_GATES:
        return { gateSpawnMultiplier: 2, enemySpawnMultiplier: 1, gateValueMultiplier: 0.5, enemySizeMultiplier: 1, speedMultiplier: 1 };
      case RandomEventType.JACKPOT:
        return { gateSpawnMultiplier: 1, enemySpawnMultiplier: 1, gateValueMultiplier: 10, enemySizeMultiplier: 1, speedMultiplier: 1 };
      case RandomEventType.CHAOS:
        return { gateSpawnMultiplier: 1, enemySpawnMultiplier: 1, gateValueMultiplier: 1, enemySizeMultiplier: 1, speedMultiplier: 1 };
      default:
        return { gateSpawnMultiplier: 1, enemySpawnMultiplier: 1, gateValueMultiplier: 1, enemySizeMultiplier: 1, speedMultiplier: 1 };
    }
  }

  public destroy(): void {
    this.activeEvent = null;
  }
}
