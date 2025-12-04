import * as BABYLON from '@babylonjs/core';
import { IDestroyable } from '../core/Interfaces';

/**
 * Sound effect types
 */
export enum SoundType {
  GATE_COLLECT = 'gate_collect',
  ENEMY_HIT = 'enemy_hit',
  GAME_OVER = 'game_over',
  POWER_UP = 'power_up',
  COMBO = 'combo',
  MILESTONE = 'milestone'
}

/**
 * Manages all sound effects and background music
 * Uses Web Audio API through Babylon.js Sound system
 */
export class SoundSystem implements IDestroyable {
  private scene: BABYLON.Scene;
  private sounds: Map<SoundType, BABYLON.Sound> = new Map();
  private backgroundMusic: BABYLON.Sound | null = null;
  private isMuted: boolean = false;
  private musicVolume: number = 0.3;
  private sfxVolume: number = 0.5;

  constructor(scene: BABYLON.Scene) {
    this.scene = scene;
    this.initializeSounds();
  }

  /**
   * Initialize procedural sounds
   * Using Web Audio API to generate sounds programmatically
   */
  private initializeSounds(): void {
    // Generate sounds procedurally since we don't have audio files
    this.createGateCollectSound();
    this.createEnemyHitSound();
    this.createGameOverSound();
    this.createPowerUpSound();
    this.createComboSound();
    this.createMilestoneSound();
    this.createBackgroundMusic();
  }

  /**
   * Creates a pleasant "ding" sound for gate collection
   */
  private createGateCollectSound(): void {
    const sound = this.createOscillatorSound(
      [523.25, 659.25, 783.99], // C5, E5, G5 - Major chord
      [0.05, 0.05, 0.15],
      0.3,
      'sine'
    );
    if (sound) {
      this.sounds.set(SoundType.GATE_COLLECT, sound);
    }
  }

  /**
   * Creates an impact sound for enemy collisions
   */
  private createEnemyHitSound(): void {
    const sound = this.createNoiseSound(0.15, 0.4);
    if (sound) {
      this.sounds.set(SoundType.ENEMY_HIT, sound);
    }
  }

  /**
   * Creates a descending "game over" sound
   */
  private createGameOverSound(): void {
    const sound = this.createOscillatorSound(
      [440, 392, 349.23, 293.66], // A4, G4, F4, D4 - Descending
      [0.2, 0.2, 0.2, 0.4],
      0.5,
      'triangle'
    );
    if (sound) {
      this.sounds.set(SoundType.GAME_OVER, sound);
    }
  }

  /**
   * Creates an ascending "power up" sound
   */
  private createPowerUpSound(): void {
    const sound = this.createOscillatorSound(
      [261.63, 329.63, 392, 523.25], // C4, E4, G4, C5 - Ascending
      [0.08, 0.08, 0.08, 0.2],
      0.4,
      'square'
    );
    if (sound) {
      this.sounds.set(SoundType.POWER_UP, sound);
    }
  }

  /**
   * Creates a quick "combo" notification sound
   */
  private createComboSound(): void {
    const sound = this.createOscillatorSound(
      [880, 1046.5], // A5, C6
      [0.05, 0.1],
      0.3,
      'sine'
    );
    if (sound) {
      this.sounds.set(SoundType.COMBO, sound);
    }
  }

  /**
   * Creates a celebratory milestone sound
   */
  private createMilestoneSound(): void {
    const sound = this.createOscillatorSound(
      [523.25, 659.25, 783.99, 1046.5], // C5, E5, G5, C6 - Major chord arpeggio
      [0.1, 0.1, 0.1, 0.3],
      0.4,
      'sine'
    );
    if (sound) {
      this.sounds.set(SoundType.MILESTONE, sound);
    }
  }

  /**
   * Creates background music using a simple melody
   */
  private createBackgroundMusic(): void {
    // Create a looping ambient background track
    const melody = [
      523.25, 587.33, 659.25, 783.99, // C5, D5, E5, G5
      783.99, 659.25, 587.33, 523.25, // G5, E5, D5, C5
    ];
    const durations = Array(8).fill(0.5);

    const sound = this.createOscillatorSound(
      melody,
      durations,
      0.15,
      'sine',
      true // Loop
    );

    if (sound) {
      this.backgroundMusic = sound;
    }
  }

  /**
   * Helper to create oscillator-based sounds
   */
  private createOscillatorSound(
    frequencies: number[],
    durations: number[],
    volume: number,
    waveType: OscillatorType = 'sine',
    loop: boolean = false
  ): BABYLON.Sound | null {
    try {
      // Create audio buffer
      const audioContext = BABYLON.Engine.audioEngine?.audioContext;
      if (!audioContext) return null;

      const totalDuration = durations.reduce((a, b) => a + b, 0);
      const sampleRate = audioContext.sampleRate;
      const buffer = audioContext.createBuffer(1, totalDuration * sampleRate, sampleRate);
      const channel = buffer.getChannelData(0);

      let offset = 0;
      frequencies.forEach((freq, index) => {
        const duration = durations[index];
        const samples = duration * sampleRate;

        for (let i = 0; i < samples; i++) {
          const t = i / sampleRate;
          const envelope = Math.exp(-3 * t / duration); // Exponential decay

          let sample = 0;
          // Generate waveform
          switch (waveType) {
            case 'sine':
              sample = Math.sin(2 * Math.PI * freq * t);
              break;
            case 'square':
              sample = Math.sign(Math.sin(2 * Math.PI * freq * t));
              break;
            case 'triangle':
              sample = 2 * Math.abs(2 * ((freq * t) % 1) - 1) - 1;
              break;
            case 'sawtooth':
              sample = 2 * ((freq * t) % 1) - 1;
              break;
          }

          channel[offset + i] = sample * envelope * volume;
        }
        offset += samples;
      });

      // Create Babylon.js sound from buffer
      const sound = new BABYLON.Sound(
        `procedural_${waveType}_${Date.now()}`,
        buffer,
        this.scene,
        null,
        {
          loop: loop,
          autoplay: false,
          volume: loop ? this.musicVolume : this.sfxVolume
        }
      );

      return sound;
    } catch (error) {
      console.warn('Could not create sound:', error);
      return null;
    }
  }

  /**
   * Helper to create noise-based sounds (for impacts)
   */
  private createNoiseSound(duration: number, volume: number): BABYLON.Sound | null {
    try {
      const audioContext = BABYLON.Engine.audioEngine?.audioContext;
      if (!audioContext) return null;

      const sampleRate = audioContext.sampleRate;
      const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
      const channel = buffer.getChannelData(0);

      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        const envelope = Math.exp(-10 * t / duration); // Fast decay
        channel[i] = (Math.random() * 2 - 1) * envelope * volume;
      }

      const sound = new BABYLON.Sound(
        `noise_${Date.now()}`,
        buffer,
        this.scene,
        null,
        {
          loop: false,
          autoplay: false,
          volume: this.sfxVolume
        }
      );

      return sound;
    } catch (error) {
      console.warn('Could not create noise sound:', error);
      return null;
    }
  }

  /**
   * Play a specific sound effect
   */
  public playSound(type: SoundType): void {
    if (this.isMuted) return;

    const sound = this.sounds.get(type);
    if (sound && sound.isReady()) {
      // Stop if already playing to allow rapid triggering
      if (sound.isPlaying) {
        sound.stop();
      }
      sound.play();
    }
  }

  /**
   * Start background music
   */
  public playBackgroundMusic(): void {
    if (this.isMuted || !this.backgroundMusic) return;

    if (!this.backgroundMusic.isPlaying) {
      this.backgroundMusic.play();
    }
  }

  /**
   * Stop background music
   */
  public stopBackgroundMusic(): void {
    if (this.backgroundMusic?.isPlaying) {
      this.backgroundMusic.stop();
    }
  }

  /**
   * Toggle mute state
   */
  public toggleMute(): void {
    this.isMuted = !this.isMuted;

    if (this.isMuted) {
      this.stopBackgroundMusic();
      this.sounds.forEach(sound => {
        if (sound.isPlaying) {
          sound.stop();
        }
      });
    }
  }

  /**
   * Set music volume (0-1)
   */
  public setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.backgroundMusic) {
      this.backgroundMusic.setVolume(this.musicVolume);
    }
  }

  /**
   * Set sound effects volume (0-1)
   */
  public setSFXVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach(sound => {
      sound.setVolume(this.sfxVolume);
    });
  }

  /**
   * Get mute state
   */
  public isSoundMuted(): boolean {
    return this.isMuted;
  }

  public destroy(): void {
    this.stopBackgroundMusic();

    // Dispose all sounds
    this.sounds.forEach(sound => sound.dispose());
    this.sounds.clear();

    if (this.backgroundMusic) {
      this.backgroundMusic.dispose();
      this.backgroundMusic = null;
    }
  }
}
