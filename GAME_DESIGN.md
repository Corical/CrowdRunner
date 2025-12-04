# Crowd Runner Game - Design Document

## Game Concept
A 3D crowd runner game inspired by "Count Masters" where players control a crowd of stickmen, avoiding obstacles and passing through multiplication/addition gates to grow their crowd.

## Visual Reference
See screenshots: `WhatsApp Image 2025-12-04 at 17.15.46.jpeg` and `WhatsApp Image 2025-12-04 at 17.15.46 (1).jpeg`

## Core Gameplay

### Objective
- Start with a small crowd (e.g., 5 stickmen)
- Navigate through a 3-lane runner track
- Pass through gates to multiply/add to your crowd
- Avoid red enemy crowds and obstacles
- Survive as long as possible with the highest crowd count

### Game Mechanics

#### Player Movement
- 3 distinct lanes (left, center, right)
- Swipe left/right or use arrow keys to switch lanes
- Smooth lane transitions
- Crowd follows player as a cohesive group

#### Obstacles & Bonuses
1. **Multiplication Gates** (Blue)
   - Format: "x2", "x5", "x10", "x100"
   - Multiplies current crowd count

2. **Addition Gates** (Blue)
   - Format: "+20", "+50", "+100"
   - Adds to current crowd count

3. **Enemy Crowds** (Red)
   - Circular formations with count display
   - Collision subtracts from player count
   - If player count > enemy count: player survives
   - If player count <= enemy count: game over

4. **Static Obstacles** (Gray)
   - Lane dividers/walls
   - Must be avoided by switching lanes

#### Win/Loss Conditions
- **Game Over**: Crowd count reaches 0
- **Success**: Distance traveled + final crowd count = score

## Technical Architecture

### Technology Stack
- **Engine**: Babylon.js (WebGL/3D rendering)
- **Language**: TypeScript (for type safety and SOLID principles)
- **Build Tool**: Vite (fast dev server and bundling)
- **Target**: Mobile-first (with desktop support)

### SOLID Principles Application

#### Single Responsibility Principle (SRP)
Each class has one reason to change:
- `GameManager`: Overall game state and flow
- `SceneManager`: Babylon.js scene setup and rendering
- `Player`: Player crowd behavior and movement
- `ObstacleManager`: Spawning and managing obstacles
- `InputHandler`: Processing user input
- `CollisionDetector`: Detecting and handling collisions
- `UIManager`: Score, distance, game over screens

#### Open/Closed Principle (OCP)
- Base `Obstacle` class can be extended for different types
- `Gate` extends `Obstacle` for multiplication/addition gates
- `EnemyCrowd` extends `Obstacle` for enemy crowds
- New obstacle types can be added without modifying existing code

#### Liskov Substitution Principle (LSP)
- Any `Obstacle` subclass can be used wherever `Obstacle` is expected
- All obstacles implement `update()`, `checkCollision()`, `destroy()`

#### Interface Segregation Principle (ISP)
- `IUpdatable`: for objects that need per-frame updates
- `ICollidable`: for objects with collision detection
- `IRenderable`: for objects with visual representation
- Classes implement only interfaces they need

#### Dependency Inversion Principle (DIP)
- High-level modules depend on abstractions (interfaces)
- `GameManager` depends on `ISceneManager`, not concrete implementation
- Easy to swap rendering engines or input systems

### Project Structure

```
crowdgame/
├── docs/
│   ├── GAME_DESIGN.md          # This file
│   └── ARCHITECTURE.md         # Technical implementation details
├── src/
│   ├── core/
│   │   ├── GameManager.ts      # Main game loop and state
│   │   ├── SceneManager.ts     # Babylon.js scene management
│   │   └── Config.ts           # Game constants and settings
│   ├── entities/
│   │   ├── Player.ts           # Player crowd controller
│   │   ├── Obstacle.ts         # Base obstacle class
│   │   ├── Gate.ts             # Multiplication/addition gates
│   │   └── EnemyCrowd.ts       # Enemy crowd obstacles
│   ├── systems/
│   │   ├── InputHandler.ts     # Keyboard/touch input
│   │   ├── CollisionDetector.ts # Collision detection
│   │   ├── ObstacleManager.ts  # Obstacle spawning
│   │   └── CrowdFormation.ts   # Stickman positioning in crowd
│   ├── ui/
│   │   └── UIManager.ts        # UI rendering and updates
│   ├── utils/
│   │   └── MathHelpers.ts      # Utility functions
│   └── main.ts                 # Entry point
├── public/
│   └── index.html              # Game container
├── package.json
└── tsconfig.json
```

## Development Phases

### Phase 1: Foundation (Current)
- [ ] Project setup with Vite + TypeScript
- [ ] Basic Babylon.js scene with camera
- [ ] Simple player representation (cube placeholder)
- [ ] Lane system implementation
- [ ] Keyboard/touch controls for lane switching
- [ ] Basic UI (crowd count display)

### Phase 2: Core Gameplay
- [ ] Obstacle spawning system
- [ ] Collision detection
- [ ] Gates (multiplication/addition)
- [ ] Enemy crowds
- [ ] Crowd count mechanics
- [ ] Game over condition

### Phase 3: Visual Polish
- [ ] 3D stickman models (low-poly)
- [ ] Crowd formation system
- [ ] Animations (running, merging)
- [ ] Visual effects (particle systems)
- [ ] Improved materials and textures

### Phase 4: Advanced Features
- [ ] Crowd physics simulation
- [ ] Sound effects and music
- [ ] Progressive difficulty
- [ ] Level/stage system
- [ ] Score persistence

### Phase 5: Optimization
- [ ] Mobile performance optimization
- [ ] Instanced rendering for crowds
- [ ] Asset compression
- [ ] Loading screens
- [ ] PWA features

## Performance Targets
- **Target FPS**: 60fps on mobile devices
- **Max Bundle Size**: 20MB (including assets)
- **Load Time**: < 3 seconds on 4G connection
- **Max Crowd Size**: 500+ stickmen without lag

## Asset Requirements

### 3D Models
- Low-poly stickman (< 500 triangles)
- Simple gate mesh
- Lane/road sections

### Textures
- Stickman texture (256x256)
- Ground texture (512x512)
- UI elements (sprites)

### Audio
- Background music (looping)
- Collision sound
- Gate passing sound
- Crowd growth sound

## Next Steps
1. Set up Vite + TypeScript project
2. Install Babylon.js dependencies
3. Create basic class structure
4. Implement Phase 1 features
5. Test on mobile device
