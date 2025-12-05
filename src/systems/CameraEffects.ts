import * as BABYLON from '@babylonjs/core';
import { IUpdatable, IDestroyable } from '../core/Interfaces';

/**
 * Manages camera effects like screen shake, zoom, and dynamic movement
 */
export class CameraEffects implements IUpdatable, IDestroyable {
  private camera: BABYLON.ArcRotateCamera;
  private basePosition: BABYLON.Vector3;
  private baseTarget: BABYLON.Vector3;
  private baseFOV: number;

  // Screen shake
  private shakeIntensity: number = 0;
  private shakeDuration: number = 0;
  private shakeTimer: number = 0;

  // Dynamic zoom
  private targetFOV: number;
  private fovTransitionSpeed: number = 2.0;

  // Camera follow smoothing
  private targetOffset: BABYLON.Vector3;
  private smoothSpeed: number = 3.0;

  constructor(camera: BABYLON.ArcRotateCamera) {
    this.camera = camera;
    this.basePosition = camera.position.clone();
    this.baseTarget = camera.target.clone();
    this.baseFOV = camera.fov;
    this.targetFOV = camera.fov;
    this.targetOffset = BABYLON.Vector3.Zero();
  }

  /**
   * Trigger screen shake effect
   * @param intensity - Shake strength (0-1)
   * @param duration - Duration in seconds
   */
  public shake(intensity: number = 0.5, duration: number = 0.3): void {
    this.shakeIntensity = Math.min(1, intensity);
    this.shakeDuration = duration;
    this.shakeTimer = 0;
  }

  /**
   * Quick shake for light impacts
   */
  public shakeLight(): void {
    this.shake(0.3, 0.2);
  }

  /**
   * Medium shake for standard impacts
   */
  public shakeMedium(): void {
    this.shake(0.5, 0.3);
  }

  /**
   * Heavy shake for major impacts
   */
  public shakeHeavy(): void {
    this.shake(0.8, 0.5);
  }

  /**
   * Zoom camera in/out temporarily
   * @param fovMultiplier - FOV multiplier (< 1 = zoom in, > 1 = zoom out)
   * @param duration - Duration in seconds
   */
  public zoom(fovMultiplier: number, duration: number = 0.5): void {
    this.targetFOV = this.baseFOV * fovMultiplier;

    // Return to normal after duration
    setTimeout(() => {
      this.targetFOV = this.baseFOV;
    }, duration * 1000);
  }

  /**
   * Zoom in effect (for excitement)
   */
  public zoomIn(amount: number = 0.8): void {
    this.zoom(amount, 0.5);
  }

  /**
   * Zoom out effect (for overview)
   */
  public zoomOut(amount: number = 1.2): void {
    this.zoom(amount, 0.5);
  }

  /**
   * Dynamic FOV based on crowd size
   * @param crowdCount - Current crowd count
   * @param maxCrowd - Maximum crowd for scaling
   */
  public adjustForCrowdSize(crowdCount: number, maxCrowd: number = 500): void {
    // Gradually zoom out as crowd grows
    const crowdRatio = Math.min(crowdCount / maxCrowd, 1);
    const fovRange = 0.3; // Max FOV increase
    this.targetFOV = this.baseFOV + (crowdRatio * fovRange);
  }

  /**
   * Pan camera left or right temporarily
   * @param direction - -1 for left, 1 for right
   * @param intensity - Pan amount
   * @param duration - Duration in seconds
   */
  public pan(direction: number, intensity: number = 2, duration: number = 0.3): void {
    this.targetOffset.x = direction * intensity;

    setTimeout(() => {
      this.targetOffset.x = 0;
    }, duration * 1000);
  }

  /**
   * Reset all camera effects to default
   */
  public reset(): void {
    this.shakeIntensity = 0;
    this.shakeTimer = 0;
    this.targetFOV = this.baseFOV;
    this.targetOffset = BABYLON.Vector3.Zero();
  }

  public update(deltaTime: number): void {
    let offsetX = 0;
    let offsetY = 0;
    let offsetZ = 0;

    // Update screen shake
    if (this.shakeTimer < this.shakeDuration) {
      this.shakeTimer += deltaTime;
      const progress = this.shakeTimer / this.shakeDuration;

      // Decay shake intensity over time
      const currentIntensity = this.shakeIntensity * (1 - progress);

      // Generate random shake offset
      offsetX = (Math.random() - 0.5) * currentIntensity * 2;
      offsetY = (Math.random() - 0.5) * currentIntensity * 2;
      offsetZ = (Math.random() - 0.5) * currentIntensity * 1;
    }

    // Smooth FOV transition
    const fovDiff = this.targetFOV - this.camera.fov;
    if (Math.abs(fovDiff) > 0.001) {
      this.camera.fov += fovDiff * this.fovTransitionSpeed * deltaTime;
    }

    // Smooth target offset transition
    const targetDiff = this.targetOffset.subtract(BABYLON.Vector3.Zero());
    if (targetDiff.length() > 0.01) {
      const smoothOffset = BABYLON.Vector3.Lerp(
        BABYLON.Vector3.Zero(),
        this.targetOffset,
        this.smoothSpeed * deltaTime
      );
      this.camera.target.x = this.baseTarget.x + smoothOffset.x;
    } else {
      this.camera.target.x = this.baseTarget.x;
    }

    // Apply shake to camera position
    this.camera.position.x = this.basePosition.x + offsetX;
    this.camera.position.y = this.basePosition.y + offsetY;
    this.camera.position.z = this.basePosition.z + offsetZ;

    // Keep camera target stable (only shake position)
    if (this.shakeTimer >= this.shakeDuration) {
      this.camera.target.y = this.baseTarget.y + offsetY * 0.5;
    }
  }

  public destroy(): void {
    this.reset();
  }
}
