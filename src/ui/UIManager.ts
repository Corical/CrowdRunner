import { IUIManager } from '@/core/Interfaces';

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

  private startGameCallback?: () => void;
  private restartGameCallback?: () => void;
  private speedChangeCallback?: (speed: number) => void;
  private frequencyChangeCallback?: (interval: number) => void;

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

    // Setup slider event listeners
    this.speedSlider.addEventListener('input', () => {
      const speed = parseFloat(this.speedSlider.value);
      this.speedValue.textContent = `${(speed / 10).toFixed(1)}x`;
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
  }

  /**
   * Hide start screen
   */
  public hideStartScreen(): void {
    this.startScreen.classList.add('hidden');
  }

  /**
   * Show game over screen with final stats
   */
  public showGameOver(score: number, distance: number): void {
    this.finalScoreElement.textContent = score.toString();
    this.finalDistanceElement.textContent = Math.floor(distance).toString();
    this.gameOverScreen.classList.remove('hidden');
  }

  /**
   * Hide game over screen
   */
  public hideGameOver(): void {
    this.gameOverScreen.classList.add('hidden');
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
