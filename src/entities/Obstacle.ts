import { Scene, Mesh, Vector3 } from '@babylonjs/core';
import { IUpdatable, ICollidable, IDestroyable } from '@/core/Interfaces';
import { Config } from '@/core/Config';
import { Player } from './Player';

/**
 * Obstacle - Abstract base class for all obstacles
 * Open/Closed Principle: Closed for modification, open for extension
 * Liskov Substitution: All obstacles can be used interchangeably
 */
export abstract class Obstacle
  implements IUpdatable, ICollidable, IDestroyable
{
  protected position: Vector3;
  protected mesh!: Mesh;
  protected scene: Scene;
  protected speed: number;
  protected hasCollided: boolean = false;

  constructor(scene: Scene, position: Vector3, speed: number) {
    this.scene = scene;
    this.position = position.clone();
    this.speed = speed;
    this.createMesh();
  }

  /**
   * Create the visual mesh for this obstacle
   * Subclasses must implement this
   */
  protected abstract createMesh(): void;

  /**
   * Handle collision with player
   * Subclasses must implement this
   */
  public abstract onCollision(player: Player): void;

  /**
   * Update obstacle position (move towards player)
   */
  public update(deltaTime: number): void {
    // Move obstacle towards player (negative Z direction)
    this.position.z -= this.speed * deltaTime;
    this.mesh.position.z = this.position.z;
  }

  /**
   * Check if obstacle should be removed (went past player)
   */
  public shouldRemove(): boolean {
    return this.position.z < Config.OBSTACLE_DESPAWN_DISTANCE;
  }

  /**
   * Check collision with player
   */
  public checkCollision(
    position: { x: number; z: number },
    radius: number
  ): boolean {
    if (this.hasCollided) return false;

    const dx = this.position.x - position.x;
    const dz = this.position.z - position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    const collisionDistance = this.getCollisionRadius() + radius;
    const isColliding = distance < collisionDistance;

    if (isColliding) {
      this.hasCollided = true;
    }

    return isColliding;
  }

  /**
   * Get obstacle position
   */
  public getPosition(): { x: number; z: number } {
    return { x: this.position.x, z: this.position.z };
  }

  /**
   * Get collision radius
   */
  public abstract getCollisionRadius(): number;

  /**
   * Check if this obstacle has already collided
   */
  public hasAlreadyCollided(): boolean {
    return this.hasCollided;
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.mesh) {
      this.mesh.dispose();
    }
  }
}
