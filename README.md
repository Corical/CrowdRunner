# Crowd Runner Game

A 3D crowd runner game built with Babylon.js and TypeScript, inspired by "Count Masters". This is the basic foundation following SOLID principles.

## What's Built So Far (Phase 1 - Foundation)

### Completed Features
- ✅ Project setup with Vite + TypeScript
- ✅ Babylon.js scene with 3D camera and lighting
- ✅ 3-lane runner system (left, center, right)
- ✅ Player representation (currently a blue cube, will be crowd later)
- ✅ Smooth lane switching with easing animation
- ✅ Keyboard controls (Arrow keys or A/D)
- ✅ Touch/swipe controls for mobile
- ✅ UI system (score, distance, game over)
- ✅ Basic game loop and state management
- ✅ SOLID architecture with interfaces and dependency injection

### Current Gameplay
- Start with 5 crowd members (represented by cube size)
- Use Arrow Keys or A/D to switch lanes
- Swipe left/right on mobile devices
- Distance counter tracks progress
- Game currently runs infinitely (obstacles coming in Phase 2)

## Project Structure

```
crowdgame/
├── docs/
│   ├── GAME_DESIGN.md          # Complete game design document
│   └── ARCHITECTURE.md         # Technical architecture details
├── src/
│   ├── core/
│   │   ├── Config.ts           # Game constants and enums
│   │   ├── Interfaces.ts       # Interface definitions (ISP)
│   │   ├── SceneManager.ts     # Babylon.js scene management
│   │   └── GameManager.ts      # Main game coordinator (Singleton)
│   ├── entities/
│   │   └── Player.ts           # Player crowd controller
│   ├── systems/
│   │   └── InputHandler.ts     # Keyboard/touch input
│   ├── ui/
│   │   └── UIManager.ts        # UI rendering and updates
│   └── main.ts                 # Entry point
├── public/
│   └── index.html              # Game container with UI
└── package.json
```

## SOLID Principles Applied

### Single Responsibility Principle (SRP)
Each class has one clear purpose:
- `GameManager`: Game flow and state
- `SceneManager`: 3D scene setup
- `Player`: Player behavior
- `InputHandler`: Input processing
- `UIManager`: DOM manipulation

### Open/Closed Principle (OCP)
- Base classes designed for extension
- `Player` can be extended for different player types
- Ready for `Obstacle` base class to be extended

### Liskov Substitution Principle (LSP)
- Interfaces ensure substitutability
- Any `ISceneManager` implementation can replace `SceneManager`

### Interface Segregation Principle (ISP)
- Small, focused interfaces:
  - `IUpdatable` - for objects needing updates
  - `ICollidable` - for collision detection
  - `IDestroyable` - for cleanup

### Dependency Inversion Principle (DIP)
- `GameManager` depends on abstractions (`ISceneManager`, `IInputHandler`, etc.)
- Easy to swap implementations for testing or features

## Running the Game

### Development Mode
```bash
npm run dev
```
Then open http://localhost:3000

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Controls

### Keyboard
- `Arrow Left` or `A` - Move to left lane
- `Arrow Right` or `D` - Move to right lane

### Touch/Mobile
- Swipe left - Move to left lane
- Swipe right - Move to right lane

## What's Next (Phase 2 - Core Gameplay)

The foundation is ready. Next phase will add:

1. **Obstacle System**
   - `Obstacle` base class (abstract)
   - `Gate` class (multiplication/addition gates)
   - `EnemyCrowd` class (red enemy obstacles)
   - `ObstacleManager` for spawning

2. **Collision Detection**
   - `CollisionDetector` system
   - Gate effects (multiply/add to crowd)
   - Enemy collision (subtract from crowd)
   - Game over when crowd reaches 0

3. **Visual Improvements**
   - Replace cube with actual crowd formation
   - Gate meshes with numbers
   - Enemy crowd visuals

See `GAME_DESIGN.md` for the complete roadmap through Phase 5.

## Architecture Highlights

### Dependency Injection Ready
```typescript
// GameManager depends on interfaces, not implementations
private sceneManager: ISceneManager;
private inputHandler: IInputHandler;

// Easy to swap for testing or new features
this.sceneManager = new SceneManager();
```

### Event-Driven (Ready for Observer Pattern)
The architecture is designed to add an `EventManager` later for:
- Score changes
- Collisions
- Game state changes

### Object Pooling Ready
`ARCHITECTURE.md` includes designs for:
- Obstacle pooling
- Stickman model reuse
- Performance optimization

## Performance

Current implementation:
- Runs at 60 FPS
- Mobile-optimized touch controls
- Minimal draw calls (will use instancing for crowds)

## Development Notes

### Adding New Features
1. Create interface in `Interfaces.ts`
2. Implement class following SRP
3. Inject via `GameManager` (DIP)
4. Update `Config.ts` for new constants

### Testing
Architecture supports unit testing:
```typescript
// Mock implementations of interfaces for testing
class MockSceneManager implements ISceneManager {
  // Test implementation
}
```

## Technologies

- **Babylon.js 8.40.0** - 3D rendering engine
- **TypeScript 5.9.3** - Type safety and OOP
- **Vite 6.4.1** - Fast dev server and bundling
- **ES2020** - Modern JavaScript features

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers with WebGL support

## Documentation

- `GAME_DESIGN.md` - Complete game design, features, and phases
- `ARCHITECTURE.md` - Technical implementation details, patterns, and class diagrams
- Code comments - JSDoc style documentation in all files

## License

ISC

---

**Ready to continue?** Check `GAME_DESIGN.md` for Phase 2 tasks to implement next!
