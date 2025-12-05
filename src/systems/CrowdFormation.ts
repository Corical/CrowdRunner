import { Scene, Mesh, InstancedMesh, Vector3, Color3 } from '@babylonjs/core';
import { StickmanBuilder } from '@/utils/StickmanBuilder';

/**
 * CrowdFormation - Manages arrangement and rendering of crowd members
 * Single Responsibility: Crowd visual representation
 */
export class CrowdFormation {
  private template: Mesh;
  private instances: InstancedMesh[] = [];
  private targetCount: number = 0;
  private currentCount: number = 0;
  private rootPosition: Vector3;

  // Formation settings
  private readonly STICKMAN_SPACING = 0.5;
  private readonly MAX_ROW_WIDTH = 5; // Max stickmen per row
  private readonly ANIMATION_TIME = 0.3; // Time to add/remove stickmen

  constructor(
    scene: Scene,
    position: Vector3,
    color: Color3 = new Color3(0.19, 0.51, 0.81)
  ) {
    this.rootPosition = position;

    // Create template stickman for instancing
    this.template = StickmanBuilder.createStickmanTemplate(scene, color);
  }

  /**
   * Set target crowd count (will animate to this count)
   */
  public setCrowdCount(count: number): void {
    this.targetCount = Math.max(0, count);
  }

  /**
   * Update formation (handles adding/removing instances)
   */
  public update(deltaTime: number): void {
    const diff = this.targetCount - this.currentCount;

    if (diff > 0) {
      // Need to add stickmen
      const toAdd = Math.min(diff, Math.ceil(5 * deltaTime / this.ANIMATION_TIME));
      for (let i = 0; i < toAdd; i++) {
        this.addStickman();
      }
    } else if (diff < 0) {
      // Need to remove stickmen
      const toRemove = Math.min(-diff, Math.ceil(5 * deltaTime / this.ANIMATION_TIME));
      for (let i = 0; i < toRemove; i++) {
        this.removeStickman();
      }
    }

    // Update positions with slight animation
    this.updatePositions();
  }

  /**
   * Add a stickman instance
   */
  private addStickman(): void {
    const instance = this.template.createInstance(`stickman_${this.currentCount}`);
    instance.scaling = new Vector3(0.8, 0.8, 0.8); // Slightly smaller
    this.instances.push(instance);
    this.currentCount++;
  }

  /**
   * Remove a stickman instance
   */
  private removeStickman(): void {
    if (this.instances.length === 0) return;

    const instance = this.instances.pop();
    if (instance) {
      instance.dispose();
      this.currentCount--;
    }
  }

  /**
   * Update positions of all stickmen in formation
   */
  private updatePositions(): void {
    const stickmenPerRow = Math.min(this.MAX_ROW_WIDTH, Math.ceil(Math.sqrt(this.currentCount)));

    this.instances.forEach((instance, index) => {
      const row = Math.floor(index / stickmenPerRow);
      const col = index % stickmenPerRow;

      // Calculate position offset from center
      const xOffset = (col - (stickmenPerRow - 1) / 2) * this.STICKMAN_SPACING;
      const zOffset = -row * this.STICKMAN_SPACING;

      // Set position relative to root
      instance.position.x = this.rootPosition.x + xOffset;
      instance.position.y = this.rootPosition.y;
      instance.position.z = this.rootPosition.z + zOffset;

      // Add slight random bobbing animation
      const time = performance.now() / 1000;
      const bobOffset = Math.sin(time * 3 + index * 0.5) * 0.05;
      instance.position.y += bobOffset;
    });
  }

  /**
   * Set formation position
   */
  public setPosition(position: Vector3): void {
    this.rootPosition.copyFrom(position);
  }

  /**
   * Get current crowd count
   */
  public getCurrentCount(): number {
    return this.currentCount;
  }

  /**
   * Get formation bounds (for collision)
   */
  public getBounds(): { width: number; depth: number } {
    const stickmenPerRow = Math.min(this.MAX_ROW_WIDTH, Math.ceil(Math.sqrt(this.currentCount)));
    const rows = Math.ceil(this.currentCount / stickmenPerRow);

    return {
      width: stickmenPerRow * this.STICKMAN_SPACING,
      depth: rows * this.STICKMAN_SPACING,
    };
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    this.instances.forEach((instance) => instance.dispose());
    this.instances = [];
    this.template.dispose();
  }

  /**
   * Get all instances for advanced manipulation
   */
  public getInstances(): InstancedMesh[] {
    return this.instances;
  }
}
