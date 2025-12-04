# Crowd Runner Game 🏃‍♂️👥

A 3D crowd runner game built with Babylon.js and TypeScript, inspired by "Count Masters". Control a crowd of stickmen, collect gates to multiply your numbers, and avoid enemy crowds!

![Game Preview](https://img.shields.io/badge/Status-In%20Development-yellow) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue) ![Babylon.js](https://img.shields.io/badge/Babylon.js-8.40.0-green)

## 🎮 Live Demo

Run locally with `npm run dev` and open http://localhost:3000

## ✨ Features

### Current (Phase 2)
- ✅ **3D Stickman Crowds** - Actual stickman formations using instanced rendering
- ✅ **Portal-Style Gates** - Glowing arch gates with pulsing effects
  - Multiplication gates: x2, x5, x10, x100
  - Addition gates: +20, +50, +100
- ✅ **Enemy Crowd Formations** - Red stickman crowds with floating labels
- ✅ **3-Lane Runner System** - Smooth lane switching with animations
- ✅ **Speed Controls** - Adjust game speed (0.5x - 5.0x)
- ✅ **Obstacle Frequency** - Control spawn rate from Very Low to Very High
- ✅ **Input Queueing** - Rapid key presses for quick lane changes
- ✅ **Touch/Swipe Controls** - Mobile-optimized controls
- ✅ **60 FPS Performance** - Handles 100+ stickmen smoothly

## 🎯 How to Play

1. **Start** with 5 stickmen
2. **Move** left/right using:
   - Arrow Keys or A/D (keyboard)
   - Swipe left/right (touch)
3. **Collect** blue/green gates to grow your crowd
4. **Avoid** red enemy crowds
5. **Survive** - Game over when crowd reaches 0

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm

### Installation
```bash
# Clone repository
git clone https://github.com/Corical/CrowdRunner.git
cd CrowdRunner

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open http://localhost:3000 in your browser!

### Build for Production
```bash
npm run build
npm run preview
```

## 🏗️ Architecture

Built following **SOLID principles** for clean, maintainable code:

### Project Structure
```
src/
├── core/               # Core game systems
│   ├── GameManager.ts  # Main game coordinator (Singleton)
│   ├── SceneManager.ts # Babylon.js scene management
│   ├── Config.ts       # Game constants
│   └── Interfaces.ts   # TypeScript interfaces (ISP)
├── entities/           # Game entities
│   ├── Player.ts       # Player crowd controller
│   ├── Obstacle.ts     # Abstract base class (OCP)
│   ├── Gate.ts         # Portal gates
│   └── EnemyCrowd.ts   # Enemy obstacles
├── systems/            # Game systems
│   ├── CrowdFormation.ts    # Crowd arrangement & rendering
│   ├── InputHandler.ts      # Input processing
│   └── ObstacleManager.ts   # Obstacle spawning
├── ui/
│   └── UIManager.ts    # UI updates
└── utils/
    └── StickmanBuilder.ts   # Stickman mesh creation
```

### Design Patterns
- **Singleton**: GameManager
- **Abstract Factory**: ObstacleManager
- **Template Method**: Obstacle base class
- **Strategy**: Different collision behaviors
- **Observer**: Ready for event system

### Performance Optimizations
- **Instanced Meshes**: 1 template, infinite copies
- **Object Pooling Ready**: Architecture supports it
- **Efficient Collision**: Distance-based calculations
- **60 FPS Target**: Achieved with 100+ stickmen

## 📚 Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technical patterns and class hierarchy
- **[GAME_DESIGN.md](GAME_DESIGN.md)** - Complete game design (5 phases)
- **[CHANGELOG.md](CHANGELOG.md)** - Feature history
- **[GETTING_STARTED.md](GETTING_STARTED.md)** - Development guide

## 🎨 Technologies

- **[Babylon.js](https://www.babylonjs.com/)** 8.40.0 - 3D rendering engine
- **[TypeScript](https://www.typescriptlang.org/)** 5.9.3 - Type safety
- **[Vite](https://vitejs.dev/)** 6.4.1 - Fast dev server & bundling
- **ES2020** - Modern JavaScript features

## 🗺️ Roadmap

### Phase 3 (Next) - Visual Effects
- [ ] Particle effects on gate collection
- [ ] Screen shake on collisions
- [ ] Number pop-ups (+50, x2, etc.)
- [ ] Trail effects behind player

### Phase 4 - Audio & Polish
- [ ] Background music
- [ ] Sound effects (collect, hit, grow)
- [ ] Better camera (zoom with crowd size)
- [ ] Mobile optimization

### Phase 5 - Advanced Features
- [ ] Progressive difficulty
- [ ] Power-ups (shield, magnet)
- [ ] Level system
- [ ] High score tracking
- [ ] Daily challenges

See [GAME_DESIGN.md](GAME_DESIGN.md) for full roadmap.

## 🎮 Controls

### Keyboard
- `Arrow Left` or `A` - Move left
- `Arrow Right` or `D` - Move right

### Touch/Mobile
- Swipe left - Move left lane
- Swipe right - Move right lane

### Game Settings
- **Game Speed**: Slider (bottom-left) - 0.5x to 5.0x
- **Obstacle Frequency**: Slider (bottom-left) - Very Low to Very High

## 🤝 Contributing

Contributions welcome! This project follows SOLID principles and clean code practices.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

ISC License - See LICENSE file for details

## 🙏 Acknowledgments

- Inspired by "Count Masters" mobile game
- Built with [Babylon.js](https://www.babylonjs.com/) game engine
- Reference images from Count Masters

## 📞 Contact

Created by [@Corical](https://github.com/Corical)

Repository: [https://github.com/Corical/CrowdRunner](https://github.com/Corical/CrowdRunner)

---

**🤖 Generated with [Claude Code](https://claude.com/claude-code)**

**⭐ Star this repo if you find it helpful!**
