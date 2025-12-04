# Architecture Documentation

## Overview
This document describes the technical architecture of the Crowd Runner game, following SOLID principles and clean code practices.

## Core Design Patterns

### 1. Singleton Pattern
**Used for**: GameManager, SceneManager
**Reason**: Only one instance should exist throughout the game lifecycle

```typescript
class GameManager {
  private static instance: GameManager;

  private constructor() {}

  public static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }
}
```

### 2. Factory Pattern
**Used for**: Obstacle creation
**Reason**: Centralized creation logic for different obstacle types

```typescript
class ObstacleFactory {
  createObstacle(type: ObstacleType, position: Vector3): Obstacle {
    switch(type) {
      case ObstacleType.MULTIPLY_GATE:
        return new MultiplyGate(position);
      case ObstacleType.ENEMY_CROWD:
        return new EnemyCrowd(position);
      // ... more types
    }
  }
}
```

### 3. Observer Pattern
**Used for**: Event system (score changes, collisions, game state)
**Reason**: Decoupled communication between systems

```typescript
interface IGameEvent {
  type: string;
  data: any;
}

class EventManager {
  private listeners: Map<string, Function[]>;

  subscribe(eventType: string, callback: Function): void {}
  unsubscribe(eventType: string, callback: Function): void {}
  emit(event: IGameEvent): void {}
}
```

### 4. Component Pattern
**Used for**: Entity behaviors
**Reason**: Flexible, composable entity system

```typescript
interface IComponent {
  update(deltaTime: number): void;
  destroy(): void;
}

class Entity {
  private components: IComponent[] = [];

  addComponent(component: IComponent): void {
    this.components.push(component);
  }

  update(deltaTime: number): void {
    this.components.forEach(c => c.update(deltaTime));
  }
}
```

## Class Hierarchy

### Core Classes

#### GameManager
**Responsibility**: Orchestrates game flow and state management

```typescript
class GameManager {
  // State
  private gameState: GameState;
  private score: number;
  private crowdCount: number;

  // Dependencies (interfaces)
  private sceneManager: ISceneManager;
  private inputHandler: IInputHandler;
  private obstacleManager: IObstacleManager;
  private uiManager: IUIManager;

  // Methods
  public initialize(): void {}
  public start(): void {}
  public pause(): void {}
  public resume(): void {}
  public gameOver(): void {}
  public update(deltaTime: number): void {}
}
```

#### SceneManager
**Responsibility**: Babylon.js scene setup and rendering

```typescript
class SceneManager implements ISceneManager {
  private engine: BABYLON.Engine;
  private scene: BABYLON.Scene;
  private camera: BABYLON.Camera;
  private light: BABYLON.Light;

  public initialize(canvas: HTMLCanvasElement): void {}
  public createCamera(): void {}
  public createLighting(): void {}
  public render(): void {}
  public getScene(): BABYLON.Scene {}
}
```

### Entity Classes

#### Player
**Responsibility**: Player crowd behavior and movement

```typescript
class Player implements IUpdatable, ICollidable {
  private crowdCount: number;
  private currentLane: Lane;
  private position: BABYLON.Vector3;
  private mesh: BABYLON.Mesh;
  private stickmen: Stickman[];

  public switchLane(direction: LaneDirection): void {}
  public addTocrowd(count: number): void {}
  public removeFromCrowd(count: number): void {}
  public update(deltaTime: number): void {}
  public checkCollision(obstacle: Obstacle): boolean {}
}
```

#### Obstacle (Abstract Base Class)
**Responsibility**: Common obstacle behavior

```typescript
abstract class Obstacle implements IUpdatable, ICollidable {
  protected position: BABYLON.Vector3;
  protected mesh: BABYLON.Mesh;
  protected speed: number;

  public abstract onCollision(player: Player): void;
  public update(deltaTime: number): void {
    // Move obstacle towards player
    this.position.z -= this.speed * deltaTime;
  }
  public checkCollision(player: Player): boolean {}
  public destroy(): void {}
}
```

#### Gate (Extends Obstacle)
**Responsibility**: Multiplication/addition gates

```typescript
class Gate extends Obstacle {
  private gateType: GateType; // MULTIPLY or ADD
  private value: number;

  public onCollision(player: Player): void {
    if (this.gateType === GateType.MULTIPLY) {
      player.addToCloud(player.getCrowdCount() * (this.value - 1));
    } else {
      player.addToCloud(this.value);
    }
  }
}
```

#### EnemyCrowd (Extends Obstacle)
**Responsibility**: Enemy crowd obstacles

```typescript
class EnemyCrowd extends Obstacle {
  private enemyCount: number;

  public onCollision(player: Player): void {
    const playerCount = player.getCrowdCount();
    if (playerCount > this.enemyCount) {
      player.removeFromCrowd(this.enemyCount);
      this.destroy();
    } else {
      // Game over
      EventManager.getInstance().emit({
        type: 'GAME_OVER',
        data: { reason: 'defeated' }
      });
    }
  }
}
```

### System Classes

#### InputHandler
**Responsibility**: Processing user input

```typescript
class InputHandler implements IInputHandler {
  private touchStartX: number;
  private keyState: Map<string, boolean>;

  public initialize(): void {
    this.setupKeyboardListeners();
    this.setupTouchListeners();
  }

  public getInputDirection(): LaneDirection {
    // Returns LEFT, RIGHT, or NONE
  }

  private setupKeyboardListeners(): void {}
  private setupTouchListeners(): void {}
}
```

#### ObstacleManager
**Responsibility**: Spawning and managing obstacles

```typescript
class ObstacleManager implements IObstacleManager, IUpdatable {
  private obstacles: Obstacle[] = [];
  private factory: ObstacleFactory;
  private spawnTimer: number = 0;
  private spawnInterval: number = 2.0; // seconds

  public update(deltaTime: number): void {
    // Update spawn timer
    this.spawnTimer += deltaTime;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnRandomObstacle();
      this.spawnTimer = 0;
    }

    // Update all obstacles
    this.obstacles.forEach(obs => obs.update(deltaTime));

    // Remove off-screen obstacles
    this.obstacles = this.obstacles.filter(obs =>
      obs.getPosition().z > -50
    );
  }

  public spawnRandomObstacle(): void {}
  public clearAll(): void {}
}
```

#### CollisionDetector
**Responsibility**: Detecting collisions between entities

```typescript
class CollisionDetector {
  public checkCollision(
    obj1: ICollidable,
    obj2: ICollidable
  ): boolean {
    // AABB collision detection
    const box1 = obj1.getBoundingBox();
    const box2 = obj2.getBoundingBox();

    return (
      box1.min.x <= box2.max.x &&
      box1.max.x >= box2.min.x &&
      box1.min.z <= box2.max.z &&
      box1.max.z >= box2.min.z
    );
  }

  public checkPlayerObstacleCollisions(
    player: Player,
    obstacles: Obstacle[]
  ): Obstacle | null {
    for (const obstacle of obstacles) {
      if (this.checkCollision(player, obstacle)) {
        return obstacle;
      }
    }
    return null;
  }
}
```

## Interfaces

### IUpdatable
```typescript
interface IUpdatable {
  update(deltaTime: number): void;
}
```

### ICollidable
```typescript
interface ICollidable {
  getBoundingBox(): BABYLON.BoundingBox;
  checkCollision(other: ICollidable): boolean;
}
```

### ISceneManager
```typescript
interface ISceneManager {
  initialize(canvas: HTMLCanvasElement): void;
  getScene(): BABYLON.Scene;
  render(): void;
}
```

### IInputHandler
```typescript
interface IInputHandler {
  initialize(): void;
  getInputDirection(): LaneDirection;
}
```

## Enums and Types

```typescript
enum GameState {
  MENU,
  PLAYING,
  PAUSED,
  GAME_OVER
}

enum Lane {
  LEFT = -1,
  CENTER = 0,
  RIGHT = 1
}

enum LaneDirection {
  LEFT = -1,
  NONE = 0,
  RIGHT = 1
}

enum ObstacleType {
  MULTIPLY_GATE,
  ADD_GATE,
  ENEMY_CROWD,
  STATIC_WALL
}

enum GateType {
  MULTIPLY,
  ADD
}

type Vector3 = BABYLON.Vector3;
```

## Configuration

```typescript
// Config.ts
export const Config = {
  // Game settings
  INITIAL_CROWD_COUNT: 5,
  GAME_SPEED: 10, // units per second
  LANE_WIDTH: 5,

  // Player settings
  PLAYER_LANE_SWITCH_SPEED: 0.3, // seconds

  // Obstacle settings
  OBSTACLE_SPAWN_INTERVAL: 2.0, // seconds
  OBSTACLE_SPEED: 10,
  MIN_ENEMY_COUNT: 20,
  MAX_ENEMY_COUNT: 100,

  // Camera settings
  CAMERA_POSITION: new BABYLON.Vector3(0, 15, -20),
  CAMERA_TARGET: new BABYLON.Vector3(0, 0, 10),

  // Performance
  TARGET_FPS: 60,
  MAX_OBSTACLES: 20
};
```

## Data Flow

```
User Input
    ↓
InputHandler
    ↓
GameManager.update()
    ├→ Player.update() (move to new lane)
    ├→ ObstacleManager.update() (spawn & move obstacles)
    ├→ CollisionDetector.check()
    │   └→ Obstacle.onCollision() (modify player crowd)
    ├→ UIManager.update() (update score display)
    └→ SceneManager.render() (draw frame)
```

## Memory Management

### Object Pooling
For frequently created/destroyed objects (obstacles, stickmen):

```typescript
class ObjectPool<T> {
  private available: T[] = [];
  private inUse: T[] = [];
  private factory: () => T;

  constructor(factory: () => T, initialSize: number) {
    this.factory = factory;
    for (let i = 0; i < initialSize; i++) {
      this.available.push(factory());
    }
  }

  public acquire(): T {
    if (this.available.length === 0) {
      this.available.push(this.factory());
    }
    const obj = this.available.pop()!;
    this.inUse.push(obj);
    return obj;
  }

  public release(obj: T): void {
    const index = this.inUse.indexOf(obj);
    if (index !== -1) {
      this.inUse.splice(index, 1);
      this.available.push(obj);
    }
  }
}
```

## Testing Strategy

### Unit Tests
- Individual class methods
- Collision detection algorithms
- Game state transitions

### Integration Tests
- Player-obstacle interactions
- Spawn system behavior
- Score calculation

### Performance Tests
- FPS monitoring
- Memory leak detection
- Mobile device testing

## Future Improvements

### Planned Refactoring
1. **State Machine**: Implement formal state machine for game states
2. **ECS Architecture**: Consider Entity-Component-System for better scalability
3. **Asset Manager**: Centralized asset loading and caching
4. **Analytics**: Track player behavior and difficulty balancing

### Optimization Opportunities
1. **Instanced Meshes**: Reduce draw calls for crowd rendering
2. **LOD System**: Switch to simpler models when far from camera
3. **Frustum Culling**: Don't render off-screen objects
4. **Web Workers**: Move physics calculations off main thread
