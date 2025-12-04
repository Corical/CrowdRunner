import { EnhancedGameManager } from './core/EnhancedGameManager';

/**
 * Main entry point - Now with ALL the amazing new features!
 * - Particle effects (explosions, trails, celebrations)
 * - Sound system (music + SFX)
 * - Power-ups (shield, magnet, speed, multiplier)
 * - Combo system with multipliers
 * - Screen shake and camera effects
 * - Floating damage/gain numbers
 * - High score tracking with localStorage
 * - Progressive difficulty system
 * - Milestone achievements
 */
async function main() {
  try {
    // Get canvas element
    const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('Canvas element not found');
    }

    // Initialize enhanced game with all new systems
    const game = EnhancedGameManager.getInstance();
    await game.initialize(canvas);

    console.log('🎮 Enhanced Crowd Runner initialized successfully!');
    console.log('✨ New features: Particles, Sound, Power-ups, Combos, Progression & more!');
  } catch (error) {
    console.error('Failed to initialize game:', error);
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.textContent = 'Failed to load game. Please refresh.';
      loadingElement.style.color = 'red';
    }
  }
}

// Start the game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
