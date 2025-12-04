import { Scene } from '@babylonjs/core';
import { LaneDirection } from './Config';

/**
 * Interface Segregation Principle:
 * Small, focused interfaces that classes can implement as needed
 */

/**
 * Objects that need per-frame updates
 */
export interface IUpdatable {
  update(deltaTime: number): void;
}

/**
 * Objects that can be destroyed/cleaned up
 */
export interface IDestroyable {
  destroy(): void;
}

/**
 * Objects with collision detection
 */
export interface ICollidable {
  checkCollision(position: { x: number; z: number }, radius: number): boolean;
  getPosition(): { x: number; z: number };
  getCollisionRadius(): number;
}

/**
 * Scene management interface
 * Dependency Inversion: High-level modules depend on this abstraction
 */
export interface ISceneManager {
  initialize(canvas: HTMLCanvasElement): Promise<void>;
  getScene(): Scene;
  render(): void;
  dispose(): void;
}

/**
 * Input handling interface
 */
export interface IInputHandler {
  initialize(): void;
  getInputDirection(): LaneDirection;
  dispose(): void;
}

/**
 * UI management interface
 */
export interface IUIManager {
  initialize(): void;
  updateCrowdCount(count: number): void;
  updateDistance(distance: number): void;
  showStartScreen(): void;
  hideStartScreen(): void;
  showGameOver(score: number, distance: number): void;
  hideGameOver(): void;
  onStartGame(callback: () => void): void;
  onRestartGame(callback: () => void): void;
}
