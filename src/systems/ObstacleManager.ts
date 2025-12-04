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

    // Update all obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];
      obstacle.update(deltaTime);

      // Check collision with player
      if (!obstacle.hasAlreadyCollided()) {
        const playerPos = player.getPosition();
        const playerRadius = player.getCollisionRadius();

        if (obstacle.checkCollision(playerPos, playerRadius)) {
          obstacle.onCollision(player);
        }
      }

      // Remove obstacles that went past player
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

    // Random obstacle type (multiplication disabled to prevent exponential growth)
    const rand = Math.random();
    let obstacle: Obstacle;

    if (rand < 0.7) {
      // 70% chance: Addition gate
      obstacle = this.createAddGate(laneX, randomLane);
      this.obstacles.push(obstacle);
    } else {
      // 30% chance: Enemy crowd
      obstacle = this.createEnemyCrowd(laneX, randomLane);
      this.obstacles.push(obstacle);

      // 30% chance to spawn a gate behind the enemy (risk/reward trap)
      if (Math.random() < Config.TRAP_SPAWN_CHANCE) {
        const trapGate = this.createAddGate(laneX, randomLane, 15); // 15 units behind enemy
        this.obstacles.push(trapGate);
      }
    }
  }

  /**
   * Create multiplication gate
   */
  private createMultiplyGate(laneX: number, lane: Lane): Gate {
    const multipliers = Config.GATE_MULTIPLIERS;
    const value = multipliers[Math.floor(Math.random() * multipliers.length)];
    const position = new Vector3(laneX, 1.5, Config.OBSTACLE_SPAWN_DISTANCE);

    return new Gate(this.scene, position, lane, GateType.MULTIPLY, value);
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
