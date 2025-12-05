import { Scene, Vector3 } from '@babylonjs/core';
import { IUpdatable, ICollidable } from '@/core/Interfaces';
import { Config, Lane, LaneDirection } from '@/core/Config';
import { CrowdFormation } from '@/systems/CrowdFormation';

/**
 * Player - Represents the player's crowd
 * Single Responsibility: Player state and movement
 * Open/Closed: Can be extended for different player types
 */
export class Player implements IUpdatable, ICollidable {
  private crowdCount: number;
  private currentLane: Lane;
  private targetLane: Lane;
  private position: Vector3;
  private scene: Scene;
  private laneTransitionProgress: number = 1; // 0 to 1, 1 means transition complete
  private laneTransitionStartX: number = 0;
  private laneTransitionTargetX: number = 0;
  private crowdFormation: CrowdFormation;

  constructor(scene: Scene) {
    this.scene = scene;
    this.crowdCount = Config.INITIAL_CROWD_COUNT;
    this.currentLane = Lane.CENTER;
    this.targetLane = Lane.CENTER;
    this.position = new Vector3(
      Config.LANES.CENTER,
      Config.PLAYER_HEIGHT,
      Config.PLAYER_Z_POSITION
    );

    // Create crowd formation instead of single mesh
    this.crowdFormation = new CrowdFormation(this.scene, this.position);
    this.crowdFormation.setCrowdCount(this.crowdCount);
  }


  /**
   * Switch to adjacent lane
   */
  public switchLane(direction: LaneDirection): void {
    if (direction === LaneDirection.NONE) return;
    if (this.laneTransitionProgress < 1) return; // Already transitioning

    const newLane = this.currentLane + direction;

    // Validate lane bounds
    if (newLane < Lane.LEFT || newLane > Lane.RIGHT) {
      return;
    }

    // Start lane transition
    this.targetLane = newLane as Lane;
    this.laneTransitionProgress = 0;
    this.laneTransitionStartX = this.position.x;
    this.laneTransitionTargetX = this.getLaneXPosition(this.targetLane);
  }

  /**
   * Get X position for a given lane
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
   * Add to crowd count
   */
  public addToCrowd(count: number): void {
    this.crowdCount += count;
    this.crowdFormation.setCrowdCount(this.crowdCount);
  }

  /**
   * Remove from crowd count
   */
  public removeFromCrowd(count: number): void {
    this.crowdCount = Math.max(0, this.crowdCount - count);
    this.crowdFormation.setCrowdCount(this.crowdCount);
  }

  /**
   * Multiply crowd count
   */
  public multiplyCrowd(multiplier: number): void {
    this.crowdCount = Math.floor(this.crowdCount * multiplier);
    this.crowdFormation.setCrowdCount(this.crowdCount);
  }

  /**
   * Get position as Vector3
   */
  public getPositionVector(): Vector3 {
    return this.position.clone();
  }

  /**
   * Get current crowd count
   */
  public getCrowdCount(): number {
    return this.crowdCount;
  }

  /**
   * Get current lane
   */
  public getCurrentLane(): Lane {
    return this.currentLane;
  }

  /**
   * Update player state
   */
  public update(deltaTime: number): void {
    // Update lane transition
    if (this.laneTransitionProgress < 1) {
      this.laneTransitionProgress = Math.min(
        1,
        this.laneTransitionProgress +
          deltaTime / Config.PLAYER_LANE_SWITCH_DURATION
      );

      // Smooth interpolation (ease-out)
      const t = this.easeOutCubic(this.laneTransitionProgress);
      this.position.x =
        this.laneTransitionStartX +
        (this.laneTransitionTargetX - this.laneTransitionStartX) * t;

      // Update current lane when transition completes
      if (this.laneTransitionProgress >= 1) {
        this.currentLane = this.targetLane;
      }
    }

    // Update crowd formation position and animation
    this.crowdFormation.setPosition(this.position);
    this.crowdFormation.update(deltaTime);
  }

  /**
   * Ease-out cubic interpolation
   */
  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * Check collision with a point
   */
  public checkCollision(
    position: { x: number; z: number },
    radius: number
  ): boolean {
    const dx = this.position.x - position.x;
    const dz = this.position.z - position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    return distance < Config.COLLISION_RADIUS + radius;
  }

  /**
   * Get player position
   */
  public getPosition(): { x: number; z: number } {
    return { x: this.position.x, z: this.position.z };
  }

  /**
   * Get collision radius
   */
  public getCollisionRadius(): number {
    return Config.COLLISION_RADIUS;
  }

  /**
   * Reset player to initial state
   */
  public reset(): void {
    this.crowdCount = Config.INITIAL_CROWD_COUNT;
    this.currentLane = Lane.CENTER;
    this.targetLane = Lane.CENTER;
    this.position.x = Config.LANES.CENTER;
    this.laneTransitionProgress = 1;
    this.crowdFormation.setCrowdCount(this.crowdCount);
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.crowdFormation.dispose();
  }
}
