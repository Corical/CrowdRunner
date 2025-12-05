import { IUIManager } from '@/core/Interfaces';
import { Config } from '@/core/Config';

/**
 * UIManager - Manages all DOM-based UI elements
 * Single Responsibility: UI updates and event handling
 */
export class UIManager implements IUIManager {
  private crowdCountElement!: HTMLElement;
  private distanceValueElement!: HTMLElement;
  private startScreen!: HTMLElement;
  private gameOverScreen!: HTMLElement;
  private startButton!: HTMLElement;
  private restartButton!: HTMLElement;
  private finalScoreElement!: HTMLElement;
  private finalDistanceElement!: HTMLElement;
  private loadingElement!: HTMLElement;
  private speedSlider!: HTMLInputElement;
  private speedValue!: HTMLElement;
  private frequencySlider!: HTMLInputElement;
  private frequencyValue!: HTMLElement;

  // Debug panel elements
  private debugFps!: HTMLElement;
  private debugRestartButton!: HTMLElement;
  private debugGodMode!: HTMLInputElement;
  private debugDetailedModels!: HTMLInputElement;
  private debugFloatingText!: HTMLInputElement;
  private debugAnimations!: HTMLInputElement;
  private debugSound!: HTMLInputElement;
  private debugRandomEvents!: HTMLInputElement;
  private debugMomentum!: HTMLInputElement;
  private debugPatterns!: HTMLInputElement;
  private debugAdaptive!: HTMLInputElement;

  private startGameCallback?: () => void;
  private restartGameCallback?: () => void;
  private speedChangeCallback?: (speed: number) => void;
  private frequencyChangeCallback?: (interval: number) => void;

  // FPS tracking
  private fpsFrames: number = 0;
  private fpsLastTime: number = 0;

  /**
   * Initialize UI elements
   */
  public initialize(): void {
    // Get DOM elements
    this.crowdCountElement = this.getElement('crowd-count');
    this.distanceValueElement = this.getElement('distance-value');
    this.startScreen = this.getElement('start-screen');
    this.gameOverScreen = this.getElement('game-over-screen');
    this.startButton = this.getElement('start-button');
    this.restartButton = this.getElement('restart-button');
    this.finalScoreElement = this.getElement('final-score');
    this.finalDistanceElement = this.getElement('final-distance');
    this.loadingElement = this.getElement('loading');
    this.speedSlider = this.getElement('speed-slider') as HTMLInputElement;
    this.speedValue = this.getElement('speed-value');
    this.frequencySlider = this.getElement('frequency-slider') as HTMLInputElement;
    this.frequencyValue = this.getElement('frequency-value');

    // Debug panel elements
    this.debugFps = this.getElement('debug-fps');
    this.debugRestartButton = this.getElement('debug-restart-button');
    this.debugGodMode = this.getElement('debug-god-mode') as HTMLInputElement;
    this.debugDetailedModels = this.getElement('debug-detailed-models') as HTMLInputElement;
    this.debugFloatingText = this.getElement('debug-floating-text') as HTMLInputElement;
    this.debugAnimations = this.getElement('debug-animations') as HTMLInputElement;
    this.debugSound = this.getElement('debug-sound') as HTMLInputElement;
    this.debugRandomEvents = this.getElement('debug-random-events') as HTMLInputElement;
    this.debugMomentum = this.getElement('debug-momentum') as HTMLInputElement;
    this.debugPatterns = this.getElement('debug-patterns') as HTMLInputElement;
    this.debugAdaptive = this.getElement('debug-adaptive') as HTMLInputElement;

    // Initialize debug checkboxes from Config
    this.debugGodMode.checked = Config.GOD_MODE;
    this.debugDetailedModels.checked = Config.ENABLE_DETAILED_MODELS;
    this.debugFloatingText.checked = Config.ENABLE_FLOATING_TEXT;
    this.debugAnimations.checked = Config.ENABLE_FANCY_ANIMATIONS;
    this.debugSound.checked = Config.ENABLE_SOUND;
    this.debugRandomEvents.checked = Config.ENABLE_RANDOM_EVENTS;
    this.debugMomentum.checked = Config.ENABLE_MOMENTUM_SYSTEM;
    this.debugPatterns.checked = Config.ENABLE_OBSTACLE_PATTERNS;
    this.debugAdaptive.checked = Config.ENABLE_ADAPTIVE_DIFFICULTY;

    // Setup debug panel listeners
    this.setupDebugListeners();

    // Hide loading screen
    this.loadingElement.classList.add('hidden');

    // Setup button event listeners
    this.startButton.addEventListener('click', () => {
      if (this.startGameCallback) {
        this.startGameCallback();
      }
    });

    this.restartButton.addEventListener('click', () => {
      if (this.restartGameCallback) {
        this.restartGameCallback();
      }
    });

    // Debug restart button (hidden on start screen, visible during gameplay)
    this.debugRestartButton.addEventListener('click', () => {
      console.log('🔄 Debug restart triggered');
      if (this.restartGameCallback) {
        this.restartGameCallback();
      }
    });

    // Setup slider event listeners
    this.speedSlider.addEventListener('input', () => {
      const speed = parseFloat(this.speedSlider.value);
      this.speedValue.textContent = `${speed.toFixed(1)}x`;
      if (this.speedChangeCallback) {
        this.speedChangeCallback(speed);
      }
    });

    this.frequencySlider.addEventListener('input', () => {
      const interval = parseFloat(this.frequencySlider.value) / 10;
      const label = interval < 1.5 ? 'Very High' :
                   interval < 2.0 ? 'High' :
                   interval < 2.5 ? 'Normal' :
                   interval < 3.0 ? 'Low' : 'Very Low';
      this.frequencyValue.textContent = label;
      if (this.frequencyChangeCallback) {
        this.frequencyChangeCallback(interval);
      }
    });
  }

  /**
   * Update crowd count display
   */
  public updateCrowdCount(count: number): void {
    this.crowdCountElement.textContent = count.toString();
  }

  /**
   * Update distance display
   */
  public updateDistance(distance: number): void {
    this.distanceValueElement.textContent = `${Math.floor(distance)}m`;
  }

  /**
   * Show start screen
   */
  public showStartScreen(): void {
    this.startScreen.classList.remove('hidden');
    // Hide debug restart on start screen (use Start button instead)
    this.debugRestartButton.style.display = 'none';
  }

  /**
   * Hide start screen
   */
  public hideStartScreen(): void {
    this.startScreen.classList.add('hidden');
    // Show debug restart during gameplay
    this.debugRestartButton.style.display = 'block';
  }

  /**
   * Show game over screen with final stats
   */
  public showGameOver(score: number, distance: number): void {
    this.finalScoreElement.textContent = score.toString();
    this.finalDistanceElement.textContent = Math.floor(distance).toString();
    this.gameOverScreen.classList.remove('hidden');
    // Hide debug restart on game over (use Play Again button instead)
    this.debugRestartButton.style.display = 'none';
  }

  /**
   * Hide game over screen
   */
  public hideGameOver(): void {
    this.gameOverScreen.classList.add('hidden');
    // Show debug restart when back in game
    this.debugRestartButton.style.display = 'block';
  }

  /**
   * Register callback for start game button
   */
  public onStartGame(callback: () => void): void {
    this.startGameCallback = callback;
  }

  /**
   * Register callback for restart game button
   */
  public onRestartGame(callback: () => void): void {
    this.restartGameCallback = callback;
  }

  /**
   * Register callback for speed change
   */
  public onSpeedChange(callback: (speed: number) => void): void {
    this.speedChangeCallback = callback;
  }

  /**
   * Register callback for frequency change
   */
  public onFrequencyChange(callback: (interval: number) => void): void {
    this.frequencyChangeCallback = callback;
  }

  /**
   * Setup debug panel listeners
   */
  private setupDebugListeners(): void {
    // God mode toggle (takes effect immediately - no restart needed!)
    this.debugGodMode.addEventListener('change', () => {
      (Config as any).GOD_MODE = this.debugGodMode.checked;
      console.log('🛡️ God Mode:', Config.GOD_MODE ? 'ON (Invincible!)' : 'OFF');
    });

    // Performance toggles
    this.debugDetailedModels.addEventListener('change', () => {
      (Config as any).ENABLE_DETAILED_MODELS = this.debugDetailedModels.checked;
      console.log('⚙️ Detailed Models:', Config.ENABLE_DETAILED_MODELS);
    });

    this.debugFloatingText.addEventListener('change', () => {
      (Config as any).ENABLE_FLOATING_TEXT = this.debugFloatingText.checked;
      console.log('⚙️ Floating Text:', Config.ENABLE_FLOATING_TEXT);
    });

    this.debugAnimations.addEventListener('change', () => {
      (Config as any).ENABLE_FANCY_ANIMATIONS = this.debugAnimations.checked;
      console.log('⚙️ Fancy Animations:', Config.ENABLE_FANCY_ANIMATIONS);
    });

    this.debugSound.addEventListener('change', () => {
      (Config as any).ENABLE_SOUND = this.debugSound.checked;
      console.log('⚙️ Sound:', Config.ENABLE_SOUND);
    });

    // Dynamic systems toggles
    this.debugRandomEvents.addEventListener('change', () => {
      (Config as any).ENABLE_RANDOM_EVENTS = this.debugRandomEvents.checked;
      console.log('⚙️ Random Events:', Config.ENABLE_RANDOM_EVENTS);
    });

    this.debugMomentum.addEventListener('change', () => {
      (Config as any).ENABLE_MOMENTUM_SYSTEM = this.debugMomentum.checked;
      console.log('⚙️ Momentum System:', Config.ENABLE_MOMENTUM_SYSTEM);
    });

    this.debugPatterns.addEventListener('change', () => {
      (Config as any).ENABLE_OBSTACLE_PATTERNS = this.debugPatterns.checked;
      console.log('⚙️ Obstacle Patterns:', Config.ENABLE_OBSTACLE_PATTERNS);
    });

    this.debugAdaptive.addEventListener('change', () => {
      (Config as any).ENABLE_ADAPTIVE_DIFFICULTY = this.debugAdaptive.checked;
      console.log('⚙️ Adaptive Difficulty:', Config.ENABLE_ADAPTIVE_DIFFICULTY);
    });

    // Initialize FPS counter
    this.fpsLastTime = performance.now();
  }

  /**
   * Update FPS counter
   */
  public updateFPS(): void {
    this.fpsFrames++;
    const currentTime = performance.now();
    const elapsed = currentTime - this.fpsLastTime;

    // Update every second
    if (elapsed >= 1000) {
      const fps = Math.round((this.fpsFrames * 1000) / elapsed);
      this.debugFps.textContent = fps.toString();

      // Color code based on performance
      if (fps >= 55) {
        this.debugFps.style.color = '#10b981'; // Green
      } else if (fps >= 30) {
        this.debugFps.style.color = '#fbbf24'; // Yellow
      } else {
        this.debugFps.style.color = '#ef4444'; // Red
      }

      this.fpsFrames = 0;
      this.fpsLastTime = currentTime;
    }
  }

  /**
   * Helper to safely get DOM element
   */
  private getElement(id: string): HTMLElement {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`UI element with id "${id}" not found`);
    }
    return element;
  }
}
