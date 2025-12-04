import { Vector3 } from '@babylonjs/core';

/**
 * Central configuration for game constants
 * Single Responsibility: Manages all game configuration values
 */
export const Config = {
  // Game settings
  INITIAL_CROWD_COUNT: 20, // Increased for better starting experience
  GAME_SPEED: 10, // units per second
  LANE_WIDTH: 5,
  ROAD_WIDTH: 15,

  // Feature flags
  ENABLE_FANCY_ANIMATIONS: false, // Disable floating text, particles, screen shake, etc.

  // Lane positions
  LANES: {
    LEFT: -5,
    CENTER: 0,
    RIGHT: 5,
  },

  // Player settings
  PLAYER_LANE_SWITCH_DURATION: 0.3, // seconds
  PLAYER_HEIGHT: 1,
  PLAYER_Z_POSITION: -10,

  // Obstacle settings
  OBSTACLE_SPAWN_INTERVAL: 2.5, // seconds
  OBSTACLE_SPAWN_DISTANCE: 100, // distance ahead of player
  OBSTACLE_SPEED: 10,
  OBSTACLE_DESPAWN_DISTANCE: -20, // behind player
  MIN_ENEMY_COUNT: 10,
  MAX_ENEMY_COUNT: 50,

  // Gate settings
  GATE_MULTIPLIERS: [2, 3, 5, 10], // Not used (multiplication disabled)
  GATE_ADDITIONS: [10, 20, 30, 50], // Increased for addition-only gameplay

  // Camera settings
  CAMERA_POSITION: new Vector3(0, 20, -25),
  CAMERA_TARGET: new Vector3(0, 0, 5),
  CAMERA_FOV: 0.8,

  // Rendering
  TARGET_FPS: 60,
  MAX_OBSTACLES_ON_SCREEN: 15,

  // Collision
  COLLISION_RADIUS: 2,
  GATE_COLLISION_RADIUS: 3,

  // Colors
  COLORS: {
    PLAYER: '#3182CE',
    ENEMY: '#E53E3E',
    GATE_MULTIPLY: '#4299E1',
    GATE_ADD: '#48BB78',
    ROAD: '#D4A574',
    GROUND: '#90CDF4',
  },
} as const;

/**
 * Game state enumeration
 */
export enum GameState {
  LOADING = 'LOADING',
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
}

/**
 * Lane enumeration
 */
export enum Lane {
  LEFT = -1,
  CENTER = 0,
  RIGHT = 1,
}

/**
 * Lane direction for input
 */
export enum LaneDirection {
  LEFT = -1,
  NONE = 0,
  RIGHT = 1,
}

/**
 * Obstacle types
 */
export enum ObstacleType {
  MULTIPLY_GATE = 'MULTIPLY_GATE',
  ADD_GATE = 'ADD_GATE',
  ENEMY_CROWD = 'ENEMY_CROWD',
}

/**
 * Gate types
 */
export enum GateType {
  MULTIPLY = 'MULTIPLY',
  ADD = 'ADD',
}
