import { GameManager } from './core/GameManager';

/**
 * Main entry point
 */
async function main() {
  try {
    // Get canvas element
    const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('Canvas element not found');
    }

    // Initialize game
    const game = GameManager.getInstance();
    await game.initialize(canvas);

    console.log('Crowd Runner initialized successfully!');
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
