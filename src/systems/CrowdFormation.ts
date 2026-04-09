import { Scene, Mesh, Matrix, Vector3, Quaternion, Color3 } from '@babylonjs/core';
import { StickmanBuilder } from '@/utils/StickmanBuilder';

/**
 * CrowdFormation - Manages arrangement and rendering of crowd members
 * Uses thin instances for maximum GPU performance:
 * - One draw call for the entire crowd regardless of size
 * - Transform data lives in a Float32Array buffer, not scene nodes
 * - ~10x faster than regular createInstance() for 50+ copies
 */
export class CrowdFormation {
  private template: Mesh;
  private targetCount: number = 0;
  private currentCount: number = 0;
  private rootPosition: Vector3;
  private matrixBuffer: Float32Array;

  // Reusable temp objects to avoid per-frame allocation
  private readonly tmpPosition = Vector3.Zero();
  private readonly tmpRotation = new Quaternion();
  private readonly tmpScale = new Vector3(0.8, 0.8, 0.8);
  private readonly tmpMatrix = Matrix.Identity();

  // Formation settings
  private readonly STICKMAN_SPACING = 0.5;
  private readonly MAX_ROW_WIDTH = 5;
  private readonly ANIMATION_TIME = 0.3;
  private readonly MAX_VISUAL_CROWD = 100;
  private readonly FLOATS_PER_MATRIX = 16;

  constructor(
    scene: Scene,
    position: Vector3,
    color: Color3 = new Color3(0.19, 0.51, 0.81)
  ) {
    this.rootPosition = position;

    // Create single-material template for thin instances
    this.template = StickmanBuilder.createThinInstanceTemplate(scene, color);
    this.template.setEnabled(true);

    // Pre-allocate matrix buffer for max crowd size
    this.matrixBuffer = new Float32Array(this.MAX_VISUAL_CROWD * this.FLOATS_PER_MATRIX);

    // Start with zero thin instances (template itself is hidden by having 0 instances)
    this.template.thinInstanceSetBuffer('matrix', this.matrixBuffer, this.FLOATS_PER_MATRIX, false);
    this.template.thinInstanceCount = 0;
  }

  /**
   * Set target crowd count (will animate to this count)
   * Visual crowd is capped at MAX_VISUAL_CROWD for performance —
   * the score still tracks the real number.
   */
  public setCrowdCount(count: number): void {
    this.targetCount = Math.max(0, Math.min(count, this.MAX_VISUAL_CROWD));
  }

  /**
   * Update formation — adjusts count and rebuilds the matrix buffer
   */
  public update(deltaTime: number): void {
    const diff = this.targetCount - this.currentCount;

    if (diff > 0) {
      const toAdd = Math.min(diff, Math.ceil(5 * deltaTime / this.ANIMATION_TIME));
      this.currentCount += toAdd;
    } else if (diff < 0) {
      const toRemove = Math.min(-diff, Math.ceil(5 * deltaTime / this.ANIMATION_TIME));
      this.currentCount -= toRemove;
    }

    this.currentCount = Math.max(0, Math.min(this.currentCount, this.MAX_VISUAL_CROWD));

    // Rebuild thin instance matrices
    this.updateMatrices();
  }

  /**
   * Rebuild the matrix buffer with running animation transforms.
   * One Matrix.Compose per stickman, written directly into the Float32Array.
   */
  private updateMatrices(): void {
    if (this.currentCount === 0) {
      this.template.thinInstanceCount = 0;
      return;
    }

    const stickmenPerRow = Math.min(this.MAX_ROW_WIDTH, Math.ceil(Math.sqrt(this.currentCount)));
    const time = performance.now() / 1000;

    for (let i = 0; i < this.currentCount; i++) {
      const row = Math.floor(i / stickmenPerRow);
      const col = i % stickmenPerRow;

      // Formation offset from center
      const xOffset = (col - (stickmenPerRow - 1) / 2) * this.STICKMAN_SPACING;
      const zOffset = -row * this.STICKMAN_SPACING;

      // Per-stickman phase for varied animation
      const phase = i * 1.8;

      // Running bounce
      const runCycle = Math.abs(Math.sin(time * 8 + phase));
      const bounceHeight = runCycle * 0.12;

      // Lateral sway + forward sway
      const sway = Math.sin(time * 4 + phase) * 0.04;
      const zSway = Math.sin(time * 6 + phase) * 0.03;

      // Position
      this.tmpPosition.x = this.rootPosition.x + xOffset + sway;
      this.tmpPosition.y = this.rootPosition.y + bounceHeight;
      this.tmpPosition.z = this.rootPosition.z + zOffset + zSway;

      // Rotation — forward lean + left-right tilt
      const tiltZ = Math.sin(time * 8 + phase) * 0.08;
      Quaternion.RotationYawPitchRollToRef(0, 0.1, tiltZ, this.tmpRotation);

      // Compose into matrix and write to buffer
      Matrix.ComposeToRef(this.tmpScale, this.tmpRotation, this.tmpPosition, this.tmpMatrix);
      this.tmpMatrix.copyToArray(this.matrixBuffer, i * this.FLOATS_PER_MATRIX);
    }

    // Push buffer to GPU
    this.template.thinInstanceSetBuffer('matrix', this.matrixBuffer, this.FLOATS_PER_MATRIX, false);
    this.template.thinInstanceCount = this.currentCount;

    // Force bounding info update so frustum culling works
    this.template.thinInstanceRefreshBoundingInfo(false);
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
    this.template.thinInstanceCount = 0;
    this.template.dispose();
  }
}
