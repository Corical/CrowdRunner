# Changelog

## Phase 2 Update - Obstacles & Controls (2025-12-04)

### New Features

#### 1. Obstacle System
- ✅ **Base Obstacle Class** - Abstract base class following Open/Closed Principle
- ✅ **Gate Obstacles** - Multiplication (x2, x5, x10, x100) and Addition (+20, +50, +100) gates
- ✅ **Enemy Crowds** - Red enemy obstacles that subtract from player crowd
- ✅ **Obstacle Manager** - Spawns and manages obstacles with configurable frequency
- ✅ **Collision Detection** - Real-time collision detection between player and obstacles
- ✅ **Visual Feedback** - Gates become transparent after collision, enemies disappear

#### 2. Game Controls
- ✅ **Speed Slider** - Adjust game speed from 0.5x to 2.0x
- ✅ **Frequency Slider** - Control obstacle spawn rate (Very Low to Very High)
- ✅ **Real-time Updates** - Changes apply immediately during gameplay
- ✅ **Visual Control Panel** - Bottom-left UI panel with styled sliders

#### 3. Input System Improvements
- ✅ **Input Queueing** - Multiple rapid key presses are now queued and processed
- ✅ **Fixed Double-Press Issue** - Can now quickly press right twice to go from left to right lane
- ✅ **Debounce System** - Prevents accidental duplicate inputs
- ✅ **Touch Support** - Improved touch/swipe handling for mobile

#### 4. UI Improvements
- ✅ **Moved Crowd Counter** - Now in top-left corner (was blocking center view)
- ✅ **Control Panel** - Added bottom-left controls panel with sliders
- ✅ **Better Layout** - Less cluttered screen with better positioning

### Technical Implementation

#### New Classes
```
src/entities/
├── Obstacle.ts          # Abstract base class
├── Gate.ts              # Multiplication/addition gates
└── EnemyCrowd.ts        # Enemy crowd obstacles

src/systems/
└── ObstacleManager.ts   # Spawning and lifecycle management
```

#### Updated Classes
- **GameManager** - Integrated ObstacleManager, added control callbacks
- **InputHandler** - Implemented input queueing with debounce
- **UIManager** - Added slider controls and callbacks
- **Player** - Enhanced collision detection

### Gameplay Changes

#### Obstacles
- **Spawn Distance**: 50 units ahead of player
- **Spawn Frequency**: Default 2.5 seconds (configurable via slider)
- **Types Distribution**:
  - 40% Multiplication Gates
  - 30% Addition Gates
  - 30% Enemy Crowds

#### Gate Values
- **Multiply**: x2, x5, x10, x100
- **Add**: +20, +50, +100

#### Enemy Crowds
- **Size Range**: 20-100 enemies
- **Effect**: Subtracts count from player
- **Game Over**: When player crowd reaches 0

#### Controls
- **Game Speed**: 0.5x - 2.0x (default 1.0x)
- **Spawn Rate**: 1.0s - 4.0s intervals (default 2.5s)

### Architecture Improvements

#### SOLID Principles
- ✅ **Open/Closed**: Obstacle base class easily extended for new types
- ✅ **Liskov Substitution**: All obstacles interchangeable via base class
- ✅ **Single Responsibility**: Each class has one clear purpose
- ✅ **Dependency Inversion**: GameManager depends on abstractions

#### Design Patterns
- **Abstract Factory**: ObstacleManager creates different obstacle types
- **Template Method**: Obstacle base class defines algorithm structure
- **Strategy**: Different collision behaviors per obstacle type

### Performance Notes

- Obstacles use object pooling-ready architecture
- Maximum 15 obstacles on screen at once
- Efficient collision detection using distance calculations
- Smooth 60 FPS with multiple obstacles

### Known Limitations

- Player still represented as cube (crowd formation coming in Phase 3)
- No visual effects for collisions (particles coming later)
- No sound effects yet
- No difficulty progression (constant spawn rate)

### Next Steps (Phase 3)

1. Replace player cube with actual stickman crowd
2. Add crowd formation system
3. Implement visual effects (particles, animations)
4. Add sound effects
5. Progressive difficulty

---

## Phase 1 - Foundation (Initial Release)

### Features
- Basic 3D scene with Babylon.js
- 3-lane runner system
- Player movement (keyboard/touch)
- UI system (score, distance, game over)
- SOLID architecture
- Complete documentation

See `README.md` and `GAME_DESIGN.md` for full details.
