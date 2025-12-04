import { GameState } from './Config';
import { ISceneManager, IInputHandler, IUIManager } from './Interfaces';
import { SceneManager } from './SceneManager';
import { InputHandler } from '@/systems/InputHandler';
import { UIManager } from '@/ui/UIManager';
import { Player } from '@/entities/Player';
import { ObstacleManager } from '@/systems/ObstacleManager';

/**
 * GameManager - Main game coordinator (Singleton)
 * Single Responsibility: Orchestrates game flow and manages game state
 * Dependency Inversion: Depends on interfaces, not concrete implementations
 */
export class GameManager {
  private static instance: GameManager;

  private gameState: GameState = GameState.LOADING;
  private distance: number = 0;
  private lastFrameTime: number = 0;

  // Dependencies (injected via interfaces)
  private sceneManager!: ISceneManager;
  private inputHandler!: IInputHandler;
  private uiManager!: IUIManager;

  // Game systems
  private obstacleManager!: ObstacleManager;

  // Game entities
  private player!: Player;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  /**
   * Initialize game systems
   */
  public async initialize(canvas: HTMLCanvasElement): Promise<void> {
    console.log('Initializing game...');

    // Create dependencies (could use DI container in larger projects)
    this.sceneManager = new SceneManager();
    this.inputHandler = new InputHandler();
    this.uiManager = new UIManager();

    // Initialize systems
    await this.sceneManager.initialize(canvas);
    this.inputHandler.initialize();
    this.uiManager.initialize();

    // Create game systems
    this.obstacleManager = new ObstacleManager(this.sceneManager.getScene());

    // Create player
    this.player = new Player(this.sceneManager.getScene());

    // Setup UI callbacks
    this.uiManager.onStartGame(() => this.startGame());
    this.uiManager.onRestartGame(() => this.startGame());
    this.uiManager.onSpeedChange((speed) => {
      this.obstacleManager.setGameSpeed(speed);
    });
    this.uiManager.onFrequencyChange((interval) => {
      this.obstacleManager.setSpawnInterval(interval);
    });

    // Initial UI update
    this.uiManager.updateCrowdCount(this.player.getCrowdCount());
    this.uiManager.updateDistance(0);

    // Show start screen
    this.gameState = GameState.MENU;
    this.uiManager.showStartScreen();

    console.log('Game initialized successfully');
  }

  /**
   * Start/restart the game
   */
  public startGame(): void {
    console.log('Starting game...');

    // Reset game state
    this.gameState = GameState.PLAYING;
    this.distance = 0;
    this.lastFrameTime = performance.now();

    // Reset entities
    this.player.reset();
    this.obstacleManager.clearAll();

    // Update UI
    this.uiManager.hideStartScreen();
    this.uiManager.hideGameOver();
    this.uiManager.updateCrowdCount(this.player.getCrowdCount());
    this.uiManager.updateDistance(this.distance);

    // Start game loop
    this.gameLoop();
  }

  /**
   * Main game loop
   */
  private gameLoop(): void {
    if (this.gameState !== GameState.PLAYING) {
      return;
    }

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = currentTime;

    // Update game
    this.update(deltaTime);

    // Continue loop
    requestAnimationFrame(() => this.gameLoop());
  }

  /**
   * Update game state
   */
  private update(deltaTime: number): void {
    // Get player input
    const inputDirection = this.inputHandler.getInputDirection();
    if (inputDirection !== 0) {
      this.player.switchLane(inputDirection);
    }

    // Update player
    this.player.update(deltaTime);

    // Update obstacles (includes collision detection)
    this.obstacleManager.update(deltaTime, this.player);

    // Update distance
    this.distance += deltaTime * 10; // 10 meters per second

    // Update UI
    this.uiManager.updateCrowdCount(this.player.getCrowdCount());
    this.uiManager.updateDistance(this.distance);

    // Check game over condition
    if (this.player.getCrowdCount() <= 0) {
      this.gameOver();
    }
  }

  /**
   * Trigger game over
   */
  private gameOver(): void {
    console.log('Game over!');
    this.gameState = GameState.GAME_OVER;

    const finalScore = this.player.getCrowdCount();
    const finalDistance = this.distance;

    this.uiManager.showGameOver(finalScore, finalDistance);
  }

  /**
   * Pause game
   */
  public pause(): void {
    if (this.gameState === GameState.PLAYING) {
      this.gameState = GameState.PAUSED;
    }
  }

  /**
   * Resume game
   */
  public resume(): void {
    if (this.gameState === GameState.PAUSED) {
      this.gameState = GameState.PLAYING;
      this.lastFrameTime = performance.now();
      this.gameLoop();
    }
  }

  /**
   * Get current game state
   */
  public getGameState(): GameState {
    return this.gameState;
  }
}
