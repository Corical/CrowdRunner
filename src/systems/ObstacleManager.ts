import { Scene, Vector3 } from '@babylonjs/core';
import { IUpdatable } from '@/core/Interfaces';
import { Config, GateType, Lane } from '@/core/Config';
import { Obstacle } from '@/entities/Obstacle';
import { Gate } from '@/entities/Gate';
import { EnemyCrowd } from '@/entities/EnemyCrowd';
import { Player } from '@/entities/Player';

/**
 * ObstacleManager - Manages obstacle spawning and lifecycle
 * Single Responsibility: Obstacle management
 */
export class ObstacleManager implements IUpdatable {
  private scene: Scene;
  private obstacles: Obstacle[] = [];
  private spawnTimer: number = 0;
  private spawnInterval: number = Config.OBSTACLE_SPAWN_INTERVAL;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * Update all obstacles and spawn new ones
   */
  public update(deltaTime: number, player?: Player): void {
    if (!player) return;
    // Update spawn timer
    this.spawnTimer += deltaTime;
    if (
      this.spawnTimer >= this.spawnInterval &&
      this.obstacles.length < Config.MAX_OBSTACLES_ON_SCREEN
    ) {
      this.spawnRandomObstacle();
      this.spawnTimer = 0;
    }

    // Update all obstacles — movement and cleanup only.
    // Collision handling is done by EnhancedGameManager (sound, text, combos, multipliers).
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];
      obstacle.update(deltaTime);

      // Remove obstacles that went past player or were destroyed by collision
      if (obstacle.shouldRemove()) {
        obstacle.destroy();
        this.obstacles.splice(i, 1);
      }
    }
  }

  /**
   * Spawn a random obstacle
   */
  private spawnRandomObstacle(): void {
    // Choose random lane
    const laneValues = [Lane.LEFT, Lane.CENTER, Lane.RIGHT];
    const randomLane = laneValues[Math.floor(Math.random() * laneValues.length)];
    const laneX = this.getLaneXPosition(randomLane);

    // Spawn rates: 12% multiply, 20% add, 10% divide, 58% enemy
    const rand = Math.random();

    if (rand < 0.12) {
      // 12% chance: Multiply gate
      const obstacle = this.createMultiplyGate(laneX, randomLane);
      this.obstacles.push(obstacle);
    } else if (rand < 0.32) {
      // 20% chance: Addition gate
      const obstacle = this.createAddGate(laneX, randomLane);
      this.obstacles.push(obstacle);
    } else if (rand < 0.42) {
      // 10% chance: Division gate (orange warning — scales with crowd size)
      const obstacle = this.createDivideGate(laneX, randomLane);
      this.obstacles.push(obstacle);
    } else {
      // 58% chance: Enemy crowd
      const obstacle = this.createEnemyCrowd(laneX, randomLane);
      this.obstacles.push(obstacle);

      // 30% chance to spawn a gate behind the enemy (risk/reward trap)
      if (Math.random() < Config.TRAP_SPAWN_CHANCE) {
        const trapRoll = Math.random();
        const trapGate = trapRoll < 0.3
          ? this.createMultiplyGate(laneX, randomLane, 15)
          : this.createAddGate(laneX, randomLane, 15);
        this.obstacles.push(trapGate);
      }
    }
  }

  /**
   * Create multiply gate
   * @param offset Optional distance offset (positive = further away)
   */
  private createMultiplyGate(laneX: number, lane: Lane, offset: number = 0): Gate {
    const multipliers = Config.GATE_MULTIPLIERS;
    const value = multipliers[Math.floor(Math.random() * multipliers.length)];
    const position = new Vector3(laneX, 1.5, Config.OBSTACLE_SPAWN_DISTANCE + offset);

    return new Gate(this.scene, position, lane, GateType.MULTIPLY, value);
  }

  /**
   * Create division gate
   */
  private createDivideGate(laneX: number, lane: Lane, offset: number = 0): Gate {
    const divisors = Config.GATE_DIVISORS;
    const value = divisors[Math.floor(Math.random() * divisors.length)];
    const position = new Vector3(laneX, 1.5, Config.OBSTACLE_SPAWN_DISTANCE + offset);

    return new Gate(this.scene, position, lane, GateType.DIVIDE, value);
  }

  /**
   * Create addition gate
   * @param offset Optional distance offset (positive = further away)
   */
  private createAddGate(laneX: number, lane: Lane, offset: number = 0): Gate {
    const additions = Config.GATE_ADDITIONS;
    const value = additions[Math.floor(Math.random() * additions.length)];
    const position = new Vector3(laneX, 1.5, Config.OBSTACLE_SPAWN_DISTANCE + offset);

    return new Gate(this.scene, position, lane, GateType.ADD, value);
  }

  /**
   * Create enemy crowd
   */
  private createEnemyCrowd(laneX: number, lane: Lane): EnemyCrowd {
    const count =
      Math.floor(
        Math.random() * (Config.MAX_ENEMY_COUNT - Config.MIN_ENEMY_COUNT)
      ) + Config.MIN_ENEMY_COUNT;
    const position = new Vector3(laneX, 0.75, Config.OBSTACLE_SPAWN_DISTANCE);

    return new EnemyCrowd(this.scene, position, lane, count);
  }

  /**
   * Get X position for a lane
   */
  private getLaneXPosition(lane: Lane): number {
    switch (lane) {
      case Lane.LEFT:
        return Config.LANES.LEFT;
      case Lane.CENTER:
        return Config.LANES.CENTER;
      case Lane.RIGHT:
        return Config.LANES.RIGHT;
    }
  }

  /**
   * Set spawn interval (affects obstacle frequency)
   */
  public setSpawnInterval(interval: number): void {
    this.spawnInterval = interval;
  }

  /**
   * Clear all obstacles
   */
  public clearAll(): void {
    this.obstacles.forEach((obs) => obs.destroy());
    this.obstacles = [];
    this.spawnTimer = 0;
  }

  /**
   * Get obstacle count
   */
  public getObstacleCount(): number {
    return this.obstacles.length;
  }
}
