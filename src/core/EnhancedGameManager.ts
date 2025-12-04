import * as BABYLON from '@babylonjs/core';
import { Config, GameState } from './Config';
import { ISceneManager, IInputHandler, IUIManager } from './Interfaces';
import { SceneManager } from './SceneManager';
import { InputHandler } from '@/systems/InputHandler';
import { UIManager } from '@/ui/UIManager';
import { Player } from '@/entities/Player';
import { ObstacleManager } from '@/systems/ObstacleManager';
import { ParticleSystem } from '@/systems/ParticleSystem';
import { SoundSystem, SoundType } from '@/systems/SoundSystem';
import { PowerUpManager } from '@/systems/PowerUpManager';
import { PowerUp, PowerUpType } from '@/entities/PowerUp';
import { ComboSystem } from '@/systems/ComboSystem';
import { CameraEffects } from '@/systems/CameraEffects';
import { FloatingTextSystem } from '@/systems/FloatingText';
import { ProgressionSystem, Milestone } from '@/systems/ProgressionSystem';
import { DifficultySystem } from '@/systems/DifficultySystem';
import { Gate } from '@/entities/Gate';
import { EnemyCrowd } from '@/entities/EnemyCrowd';

/**
 * Enhanced GameManager with all new systems integrated
 * Features: Particles, Sound, Power-ups, Combos, Progression, Difficulty
 */
export class EnhancedGameManager {
  private static instance: EnhancedGameManager;

  private gameState: GameState = GameState.LOADING;
  private distance: number = 0;
  private lastFrameTime: number = 0;
  private timePlayed: number = 0;

  // Core dependencies
  private sceneManager!: ISceneManager;
  private inputHandler!: IInputHandler;
  private uiManager!: IUIManager;

  // Game systems
  private obstacleManager!: ObstacleManager;
  private particleSystem!: ParticleSystem;
  private soundSystem!: SoundSystem;
  private powerUpManager!: PowerUpManager;
  private comboSystem!: ComboSystem;
  private cameraEffects!: CameraEffects;
  private floatingText!: FloatingTextSystem;
  private progressionSystem!: ProgressionSystem;
  private difficultySystem!: DifficultySystem;

  // Game entities
  private player!: Player;

  // Power-ups on field
  private activePowerUps: PowerUp[] = [];

  // Feature flags
  private animationsEnabled: boolean = false;

  // Manual speed control (from UI slider)
  private manualSpeedMultiplier: number = 1.0;

  private constructor() {}

  public static getInstance(): EnhancedGameManager {
    if (!EnhancedGameManager.instance) {
      EnhancedGameManager.instance = new EnhancedGameManager();
    }
    return EnhancedGameManager.instance;
  }

  /**
   * Initialize all game systems
   */
  public async initialize(canvas: HTMLCanvasElement): Promise<void> {
    console.log('🎮 Initializing Enhanced Game...');

    // Create core dependencies
    this.sceneManager = new SceneManager();
    this.inputHandler = new InputHandler();
    this.uiManager = new UIManager();

    // Initialize core systems
    await this.sceneManager.initialize(canvas);
    this.inputHandler.initialize();
    this.uiManager.initialize();

    const scene = this.sceneManager.getScene();

    // Initialize all new systems
    this.obstacleManager = new ObstacleManager(scene);
    this.particleSystem = new ParticleSystem(scene);
    this.soundSystem = new SoundSystem(scene);
    this.powerUpManager = new PowerUpManager(
      (type, duration) => this.onPowerUpActivated(type, duration),
      (type) => this.onPowerUpExpired(type)
    );
    this.comboSystem = new ComboSystem(
      (combo, multiplier) => this.onComboChanged(combo, multiplier),
      () => this.onComboExpired(),
      (maxCombo) => this.onNewMaxCombo(maxCombo)
    );
    this.floatingText = new FloatingTextSystem(scene);
    this.progressionSystem = new ProgressionSystem(
      (milestone) => this.onMilestoneUnlocked(milestone)
    );
    this.difficultySystem = new DifficultySystem(
      (level) => this.onLevelUp(level)
    );

    // Initialize camera effects
    const camera = scene.activeCamera as BABYLON.ArcRotateCamera;
    this.cameraEffects = new CameraEffects(camera);

    // Create player
    this.player = new Player(scene);

    // Helper for checking if fancy animations are enabled
    this.animationsEnabled = Config.ENABLE_FANCY_ANIMATIONS;

    // Setup UI callbacks
    this.uiManager.onStartGame(() => this.startGame());
    this.uiManager.onRestartGame(() => this.startGame());
    this.uiManager.onSpeedChange?.((speed: number) => {
      this.manualSpeedMultiplier = speed;
    });
    this.uiManager.onFrequencyChange?.((interval: number) => {
      this.obstacleManager.setSpawnInterval(interval);
    });

    // Initial UI update
    this.uiManager.updateCrowdCount(this.player.getCrowdCount());
    this.uiManager.updateDistance(0);

    // Show start screen
    this.gameState = GameState.MENU;
    this.uiManager.showStartScreen();

    console.log('✅ Enhanced Game initialized successfully');
  }

  /**
   * Start/restart the game
   */
  public startGame(): void {
    console.log('🚀 Starting game...');

    // Reset game state
    this.gameState = GameState.PLAYING;
    this.distance = 0;
    this.timePlayed = 0;
    this.lastFrameTime = performance.now();

    // Reset all systems
    this.player.reset();
    this.obstacleManager.clearAll();
    this.activePowerUps.forEach(pu => pu.destroy());
    this.activePowerUps = [];
    this.comboSystem.resetCombo();
    this.difficultySystem.reset();
    this.progressionSystem.startNewGame();

    if (this.animationsEnabled) {
      this.cameraEffects.reset();
      // Start effects
      this.particleSystem.createTrailEffect(this.player.getPositionVector());
    }
    this.soundSystem.playBackgroundMusic();

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
    const deltaTime = (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;

    // Update game
    this.update(deltaTime);

    // Continue loop
    requestAnimationFrame(() => this.gameLoop());
  }

  /**
   * Update all game systems
   */
  private update(deltaTime: number): void {
    // Combine all speed multipliers:
    // - Manual (UI slider)
    // - Difficulty (progression-based)
    // - Power-up (temporary boosts)
    const difficultySpeed = this.difficultySystem.getSpeedMultiplier();
    const powerUpSpeed = this.powerUpManager.getSpeedMultiplier();
    const speedMultiplier = this.manualSpeedMultiplier * difficultySpeed * powerUpSpeed;
    const adjustedDelta = deltaTime * speedMultiplier;

    // Get player input
    const inputDirection = this.inputHandler.getInputDirection();
    if (inputDirection !== 0) {
      this.player.switchLane(inputDirection);
    }

    // Update player
    this.player.update(adjustedDelta);

    if (this.animationsEnabled) {
      // Update particle trail to follow player
      this.particleSystem.updateTrailPosition(this.player.getPositionVector());
    }

    // Update obstacles with difficulty-based spawn interval
    const difficultyInterval = this.difficultySystem.getObstacleInterval();
    this.obstacleManager.setSpawnInterval(difficultyInterval);
    this.obstacleManager.update(adjustedDelta, this.player);

    // Check for gate collisions (with combo tracking)
    this.checkGateCollisions();

    // Check for enemy collisions
    this.checkEnemyCollisions();

    // Update power-ups on field
    this.updatePowerUps(adjustedDelta);

    // Check for power-up collisions
    this.checkPowerUpCollisions();

    // Update all systems
    this.powerUpManager.update(deltaTime);
    this.comboSystem.update(deltaTime);

    if (this.animationsEnabled) {
      this.cameraEffects.update(deltaTime);
      this.floatingText.update(deltaTime);
      this.particleSystem.update(deltaTime);
    }

    // Update distance and difficulty
    const distanceGain = adjustedDelta * 10;
    this.distance += distanceGain;
    this.timePlayed += deltaTime;
    this.difficultySystem.updateDistance(this.distance);

    if (this.animationsEnabled) {
      // Update camera FOV based on crowd size
      this.cameraEffects.adjustForCrowdSize(this.player.getCrowdCount(), 500);
    }

    // Update progression stats
    this.progressionSystem.updateStats({
      distance: Math.floor(this.distance),
      crowdCount: this.player.getCrowdCount(),
      timePlayed: this.timePlayed
    });

    // Update UI
    this.uiManager.updateCrowdCount(this.player.getCrowdCount());
    this.uiManager.updateDistance(this.distance);

    // Check game over condition
    if (this.player.getCrowdCount() <= 0) {
      this.gameOver();
    }
  }

  /**
   * Check collisions with gates and handle combo system
   */
  private checkGateCollisions(): void {
    const obstacles = (this.obstacleManager as any).obstacles;
    const playerPos = this.player.getPosition();
    const playerRadius = this.player.getCollisionRadius();

    obstacles.forEach((obstacle: any) => {
      if (obstacle instanceof Gate && !obstacle.hasAlreadyCollided()) {
        if (obstacle.checkCollision(playerPos, playerRadius)) {
          // Call original collision handler
          obstacle.onCollision(this.player);

          // Add to combo
          this.comboSystem.addToCombo();

          // Audio feedback
          this.soundSystem.playSound(SoundType.GATE_COLLECT);

          if (this.animationsEnabled) {
            // Visual feedback
            const gateColor = (obstacle as any).gateType === 0
              ? BABYLON.Color3.Blue()
              : BABYLON.Color3.Green();
            this.particleSystem.createGateCollectEffect(obstacle.getPosition() as any, gateColor);
            this.cameraEffects.shakeLight();
            this.cameraEffects.zoomIn(0.9);

            // Show floating text
            const gateValue = (obstacle as any).value;
            const gateType = (obstacle as any).gateType;
            const pos = new BABYLON.Vector3(obstacle.getPosition().x, 2, obstacle.getPosition().z);

            if (gateType === 0) { // Multiply
              this.floatingText.showMultiplier(gateValue, pos);
            } else { // Add
              this.floatingText.showGain(gateValue, pos);
            }
          }

          // Update stats
          this.progressionSystem.updateStats({
            gatesCollected: this.progressionSystem.getCurrentStats().gatesCollected + 1
          });
        }
      }
    });
  }

  /**
   * Check collisions with enemies and handle shield
   */
  private checkEnemyCollisions(): void {
    const obstacles = (this.obstacleManager as any).obstacles;
    const playerPos = this.player.getPosition();
    const playerRadius = this.player.getCollisionRadius();

    obstacles.forEach((obstacle: any) => {
      if (obstacle instanceof EnemyCrowd && !obstacle.hasAlreadyCollided()) {
        if (obstacle.checkCollision(playerPos, playerRadius)) {
          // Check for shield protection
          if (this.powerUpManager.hasShield()) {
            this.powerUpManager.consumeShield();
            this.soundSystem.playSound(SoundType.POWER_UP);
            if (this.animationsEnabled) {
              this.floatingText.showPowerUpActivated('SHIELD SAVED!', this.player.getPositionVector());
            }
            obstacle.destroy();
            return;
          }

          // Normal enemy collision
          obstacle.onCollision(this.player);

          // Reset combo on enemy hit
          this.comboSystem.resetCombo();

          // Audio feedback
          this.soundSystem.playSound(SoundType.ENEMY_HIT);

          if (this.animationsEnabled) {
            // Visual feedback
            const pos = obstacle.getPosition() as any;
            this.particleSystem.createEnemyHitEffect(new BABYLON.Vector3(pos.x, 1, pos.z));
            this.cameraEffects.shakeHeavy();

            // Show damage number
            const enemyCount = (obstacle as any).enemyCount;
            this.floatingText.showLoss(enemyCount, new BABYLON.Vector3(pos.x, 2, pos.z));
          }

          // Update stats
          this.progressionSystem.updateStats({
            enemiesDefeated: this.progressionSystem.getCurrentStats().enemiesDefeated + 1
          });
        }
      }
    });
  }

  /**
   * Update power-ups on field
   */
  private updatePowerUps(deltaTime: number): void {
    // Spawn power-ups occasionally based on difficulty
    if (Math.random() < this.difficultySystem.getPowerUpChance() * deltaTime) {
      this.spawnPowerUp();
    }

    // Update existing power-ups
    for (let i = this.activePowerUps.length - 1; i >= 0; i--) {
      const powerUp = this.activePowerUps[i];
      powerUp.update(deltaTime);

      if (powerUp.shouldRemove()) {
        powerUp.destroy();
        this.activePowerUps.splice(i, 1);
      }
    }
  }

  /**
   * Spawn a random power-up
   */
  private spawnPowerUp(): void {
    const types = [
      PowerUpType.SHIELD,
      PowerUpType.MAGNET,
      PowerUpType.SPEED_BOOST,
      PowerUpType.MULTIPLIER
    ];

    const randomType = types[Math.floor(Math.random() * types.length)];
    const lanes = [-5, 0, 5]; // LEFT, CENTER, RIGHT
    const randomLane = lanes[Math.floor(Math.random() * lanes.length)];

    const position = new BABYLON.Vector3(randomLane, 1, 50);
    const powerUp = new PowerUp(this.sceneManager.getScene(), position, randomLane / 5, randomType);
    this.activePowerUps.push(powerUp);
  }

  /**
   * Check power-up collisions
   */
  private checkPowerUpCollisions(): void {
    const playerPos = this.player.getPosition();
    const playerRadius = this.player.getCollisionRadius();

    this.activePowerUps.forEach(powerUp => {
      if (!powerUp.hasAlreadyCollided() && powerUp.checkCollision(playerPos, playerRadius)) {
        powerUp.onCollision(this.player);

        // Activate power-up
        this.powerUpManager.activatePowerUp(powerUp.getPowerUpType(), powerUp.getDuration());

        // Audio feedback
        this.soundSystem.playSound(SoundType.POWER_UP);

        if (this.animationsEnabled) {
          // Visual feedback
          this.particleSystem.createGateCollectEffect(
            new BABYLON.Vector3(playerPos.x, 1, playerPos.z),
            powerUp.getColor()
          );
          this.cameraEffects.zoomIn(0.85);
        }

        // Update stats
        this.progressionSystem.updateStats({
          powerUpsCollected: this.progressionSystem.getCurrentStats().powerUpsCollected + 1
        });
      }
    });
  }

  /**
   * Callback: Power-up activated
   */
  private onPowerUpActivated(type: PowerUpType, duration: number): void {
    console.log(`⚡ Power-up activated: ${type} for ${duration}s`);
    if (this.animationsEnabled) {
      const pos = this.player.getPositionVector();
      pos.y += 2;
      this.floatingText.showPowerUpActivated(type.toUpperCase(), pos);
    }
  }

  /**
   * Callback: Power-up expired
   */
  private onPowerUpExpired(type: PowerUpType): void {
    console.log(`⏱️ Power-up expired: ${type}`);
  }

  /**
   * Callback: Combo changed
   */
  private onComboChanged(combo: number, multiplier: number): void {
    console.log(`🔥 Combo: ${combo}x (${multiplier}x multiplier)`);

    if (combo >= 5) {
      this.soundSystem.playSound(SoundType.COMBO);
      if (this.animationsEnabled) {
        const tier = this.comboSystem.getComboTier();
        const pos = this.player.getPositionVector();
        pos.y += 3;
        this.floatingText.showCombo(combo, tier, pos);
      }
    }
  }

  /**
   * Callback: Combo expired
   */
  private onComboExpired(): void {
    console.log('💔 Combo expired');
  }

  /**
   * Callback: New max combo achieved
   */
  private onNewMaxCombo(maxCombo: number): void {
    console.log(`🏆 New max combo: ${maxCombo}`);
    this.progressionSystem.updateStats({ maxCombo });
  }

  /**
   * Callback: Level up
   */
  private onLevelUp(level: number): void {
    console.log(`📈 Level up! Now level ${level}`);
    this.soundSystem.playSound(SoundType.MILESTONE);
    if (this.animationsEnabled) {
      const difficultyName = this.difficultySystem.getDifficultyName();
      const pos = this.player.getPositionVector();
      pos.y += 4;
      this.floatingText.showMilestone(`LEVEL ${level} - ${difficultyName}`, pos);
      this.particleSystem.createCelebrationEffect(pos);
      this.cameraEffects.shake(0.4, 0.4);
    }
  }

  /**
   * Callback: Milestone unlocked
   */
  private onMilestoneUnlocked(milestone: Milestone): void {
    const info = this.progressionSystem.getMilestoneInfo(milestone);
    console.log(`🎉 Milestone unlocked: ${info.title}`);

    this.soundSystem.playSound(SoundType.MILESTONE);
    if (this.animationsEnabled) {
      const pos = this.player.getPositionVector();
      pos.y += 3;
      this.floatingText.showMilestone(info.title, pos);
      this.particleSystem.createCelebrationEffect(pos);
    }
  }

  /**
   * Trigger game over
   */
  private gameOver(): void {
    console.log('💀 Game over!');
    this.gameState = GameState.GAME_OVER;

    // Stop effects and play sound
    this.soundSystem.stopBackgroundMusic();
    this.soundSystem.playSound(SoundType.GAME_OVER);

    if (this.animationsEnabled) {
      this.particleSystem.stopTrail();
      // Camera effects
      this.cameraEffects.shakeHeavy();
      this.cameraEffects.zoomOut(1.3);
    }

    // Save progression
    const { score, isNewHighScore } = this.progressionSystem.endGame();

    // Show game over screen
    this.uiManager.showGameOver(score, this.distance);

    // Celebration if new high score
    if (isNewHighScore && this.animationsEnabled) {
      const pos = this.player.getPositionVector();
      pos.y += 5;
      this.particleSystem.createCelebrationEffect(pos);
      this.floatingText.showMilestone('NEW HIGH SCORE!', pos);
    }
  }

  /**
   * Pause game
   */
  public pause(): void {
    if (this.gameState === GameState.PLAYING) {
      this.gameState = GameState.PAUSED;
      this.soundSystem.stopBackgroundMusic();
    }
  }

  /**
   * Resume game
   */
  public resume(): void {
    if (this.gameState === GameState.PAUSED) {
      this.gameState = GameState.PLAYING;
      this.lastFrameTime = performance.now();
      this.soundSystem.playBackgroundMusic();
      this.gameLoop();
    }
  }

  public getGameState(): GameState {
    return this.gameState;
  }
}
