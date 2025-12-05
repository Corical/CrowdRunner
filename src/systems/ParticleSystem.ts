import * as BABYLON from '@babylonjs/core';
import { IUpdatable, IDestroyable } from '../core/Interfaces';

/**
 * Particle effect types
 */
export enum ParticleEffectType {
  GATE_COLLECT = 'gate_collect',
  ENEMY_HIT = 'enemy_hit',
  TRAIL = 'trail',
  CELEBRATION = 'celebration',
  POWER_UP = 'power_up'
}

/**
 * Manages particle effects throughout the game
 * Provides factory methods for creating different effect types
 */
export class ParticleSystem implements IUpdatable, IDestroyable {
  private scene: BABYLON.Scene;
  private particleSystems: BABYLON.ParticleSystem[] = [];
  private trailSystem: BABYLON.ParticleSystem | null = null;

  constructor(scene: BABYLON.Scene) {
    this.scene = scene;
  }

  /**
   * Creates a gate collection effect at the specified position
   * @param position - World position for the effect
   * @param color - Color of the gate (blue for multiply, green for add)
   */
  public createGateCollectEffect(position: BABYLON.Vector3, color: BABYLON.Color3): void {
    const particleSystem = new BABYLON.ParticleSystem(
      'gateCollect',
      500,
      this.scene
    );

    // Create emitter
    const emitter = BABYLON.MeshBuilder.CreateBox('emitter', { size: 0.1 }, this.scene);
    emitter.position = position.clone();
    emitter.isVisible = false;
    particleSystem.emitter = emitter;

    // Particle appearance
    particleSystem.particleTexture = this.createParticleTexture();
    particleSystem.minSize = 0.3;
    particleSystem.maxSize = 0.8;
    particleSystem.minLifeTime = 0.5;
    particleSystem.maxLifeTime = 1.0;

    // Colors
    particleSystem.color1 = new BABYLON.Color4(color.r, color.g, color.b, 1);
    particleSystem.color2 = new BABYLON.Color4(color.r * 0.8, color.g * 0.8, color.b * 0.8, 0.5);
    particleSystem.colorDead = new BABYLON.Color4(color.r * 0.5, color.g * 0.5, color.b * 0.5, 0);

    // Emission
    particleSystem.emitRate = 0; // Burst mode
    particleSystem.manualEmitCount = 50;
    particleSystem.minEmitPower = 3;
    particleSystem.maxEmitPower = 6;
    particleSystem.updateSpeed = 0.016;

    // Direction
    particleSystem.direction1 = new BABYLON.Vector3(-1, 1, -1);
    particleSystem.direction2 = new BABYLON.Vector3(1, 2, 1);

    // Gravity
    particleSystem.gravity = new BABYLON.Vector3(0, -9.8, 0);

    // Blending
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

    // Start and auto-dispose
    particleSystem.start();
    this.particleSystems.push(particleSystem);

    // Clean up after animation
    setTimeout(() => {
      particleSystem.stop();
      setTimeout(() => {
        particleSystem.dispose();
        emitter.dispose();
        const index = this.particleSystems.indexOf(particleSystem);
        if (index > -1) {
          this.particleSystems.splice(index, 1);
        }
      }, 1000);
    }, 100);
  }

  /**
   * Creates an explosion effect for enemy collisions
   * @param position - World position for the explosion
   */
  public createEnemyHitEffect(position: BABYLON.Vector3): void {
    const particleSystem = new BABYLON.ParticleSystem(
      'enemyHit',
      800,
      this.scene
    );

    // Create emitter
    const emitter = BABYLON.MeshBuilder.CreateBox('emitter', { size: 0.1 }, this.scene);
    emitter.position = position.clone();
    emitter.isVisible = false;
    particleSystem.emitter = emitter;

    // Particle appearance
    particleSystem.particleTexture = this.createParticleTexture();
    particleSystem.minSize = 0.4;
    particleSystem.maxSize = 1.2;
    particleSystem.minLifeTime = 0.3;
    particleSystem.maxLifeTime = 0.8;

    // Red explosion colors
    particleSystem.color1 = new BABYLON.Color4(1, 0.2, 0.2, 1);
    particleSystem.color2 = new BABYLON.Color4(1, 0.5, 0, 0.8);
    particleSystem.colorDead = new BABYLON.Color4(0.3, 0.3, 0.3, 0);

    // Emission - explosive burst
    particleSystem.emitRate = 0;
    particleSystem.manualEmitCount = 100;
    particleSystem.minEmitPower = 8;
    particleSystem.maxEmitPower = 15;
    particleSystem.updateSpeed = 0.016;

    // Spherical emission
    particleSystem.createSphereEmitter(2);

    // Gravity
    particleSystem.gravity = new BABYLON.Vector3(0, -15, 0);

    // Additive blending for bright effect
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

    // Start and auto-dispose
    particleSystem.start();
    this.particleSystems.push(particleSystem);

    setTimeout(() => {
      particleSystem.stop();
      setTimeout(() => {
        particleSystem.dispose();
        emitter.dispose();
        const index = this.particleSystems.indexOf(particleSystem);
        if (index > -1) {
          this.particleSystems.splice(index, 1);
        }
      }, 800);
    }, 50);
  }

  /**
   * Creates a continuous trail effect behind the player
   * @param position - Position to attach the trail (player position)
   */
  public createTrailEffect(position: BABYLON.Vector3): void {
    if (this.trailSystem) {
      return; // Already exists
    }

    const particleSystem = new BABYLON.ParticleSystem(
      'playerTrail',
      2000,
      this.scene
    );

    // Create emitter
    const emitter = BABYLON.MeshBuilder.CreateBox('trailEmitter', { size: 0.1 }, this.scene);
    emitter.position = position.clone();
    emitter.isVisible = false;
    particleSystem.emitter = emitter;

    // Particle appearance
    particleSystem.particleTexture = this.createParticleTexture();
    particleSystem.minSize = 0.2;
    particleSystem.maxSize = 0.5;
    particleSystem.minLifeTime = 0.5;
    particleSystem.maxLifeTime = 1.0;

    // Cyan/white trail colors
    particleSystem.color1 = new BABYLON.Color4(0.3, 0.8, 1, 0.8);
    particleSystem.color2 = new BABYLON.Color4(0.5, 0.9, 1, 0.5);
    particleSystem.colorDead = new BABYLON.Color4(0.8, 0.8, 1, 0);

    // Continuous emission
    particleSystem.emitRate = 100;
    particleSystem.minEmitPower = 0.5;
    particleSystem.maxEmitPower = 2;
    particleSystem.updateSpeed = 0.016;

    // Direction - mostly backward
    particleSystem.direction1 = new BABYLON.Vector3(-0.5, 0, -2);
    particleSystem.direction2 = new BABYLON.Vector3(0.5, 0.5, -3);

    // Slight gravity
    particleSystem.gravity = new BABYLON.Vector3(0, -2, 0);

    // Additive blending
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

    // Start
    particleSystem.start();
    this.trailSystem = particleSystem;
    this.particleSystems.push(particleSystem);
  }

  /**
   * Updates the trail position to follow the player
   * @param position - New position for the trail emitter
   */
  public updateTrailPosition(position: BABYLON.Vector3): void {
    if (this.trailSystem && this.trailSystem.emitter) {
      (this.trailSystem.emitter as BABYLON.Mesh).position.copyFrom(position);
    }
  }

  /**
   * Stops and removes the trail effect
   */
  public stopTrail(): void {
    if (this.trailSystem) {
      this.trailSystem.stop();
      const index = this.particleSystems.indexOf(this.trailSystem);
      if (index > -1) {
        this.particleSystems.splice(index, 1);
      }
      setTimeout(() => {
        if (this.trailSystem) {
          this.trailSystem.dispose();
          if (this.trailSystem.emitter) {
            (this.trailSystem.emitter as BABYLON.Mesh).dispose();
          }
          this.trailSystem = null;
        }
      }, 1000);
    }
  }

  /**
   * Creates a celebration effect (for milestones or achievements)
   * @param position - World position for the effect
   */
  public createCelebrationEffect(position: BABYLON.Vector3): void {
    // Create multiple bursts in different colors
    const colors = [
      new BABYLON.Color3(1, 0.84, 0), // Gold
      new BABYLON.Color3(0.5, 0.5, 1), // Blue
      new BABYLON.Color3(1, 0.3, 0.8), // Pink
      new BABYLON.Color3(0.3, 1, 0.3), // Green
    ];

    colors.forEach((color, index) => {
      setTimeout(() => {
        const particleSystem = new BABYLON.ParticleSystem(
          `celebration_${index}`,
          300,
          this.scene
        );

        const emitter = BABYLON.MeshBuilder.CreateBox('emitter', { size: 0.1 }, this.scene);
        emitter.position = position.clone();
        emitter.position.y += 3;
        emitter.isVisible = false;
        particleSystem.emitter = emitter;

        particleSystem.particleTexture = this.createParticleTexture();
        particleSystem.minSize = 0.3;
        particleSystem.maxSize = 0.7;
        particleSystem.minLifeTime = 1.0;
        particleSystem.maxLifeTime = 2.0;

        particleSystem.color1 = new BABYLON.Color4(color.r, color.g, color.b, 1);
        particleSystem.color2 = new BABYLON.Color4(color.r * 0.8, color.g * 0.8, color.b * 0.8, 0.7);
        particleSystem.colorDead = new BABYLON.Color4(color.r * 0.5, color.g * 0.5, color.b * 0.5, 0);

        particleSystem.emitRate = 0;
        particleSystem.manualEmitCount = 50;
        particleSystem.minEmitPower = 5;
        particleSystem.maxEmitPower = 10;
        particleSystem.updateSpeed = 0.016;

        particleSystem.createConeEmitter(1, Math.PI / 4);
        particleSystem.gravity = new BABYLON.Vector3(0, -5, 0);
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

        particleSystem.start();
        this.particleSystems.push(particleSystem);

        setTimeout(() => {
          particleSystem.stop();
          setTimeout(() => {
            particleSystem.dispose();
            emitter.dispose();
            const idx = this.particleSystems.indexOf(particleSystem);
            if (idx > -1) {
              this.particleSystems.splice(idx, 1);
            }
          }, 2000);
        }, 100);
      }, index * 150);
    });
  }

  /**
   * Creates a simple particle texture
   */
  private createParticleTexture(): BABYLON.Texture {
    // Create a simple circular gradient texture
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d')!;

    // Create radial gradient
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);

    // Convert to texture
    const texture = new BABYLON.Texture('data:particleTexture', this.scene, false, false);
    texture.updateURL(canvas.toDataURL());

    return texture;
  }

  public update(_deltaTime: number): void {
    // Particle systems auto-update in Babylon.js
  }

  public destroy(): void {
    // Stop and dispose all particle systems
    this.particleSystems.forEach(ps => {
      ps.stop();
      ps.dispose();
      if (ps.emitter) {
        (ps.emitter as BABYLON.Mesh).dispose();
      }
    });
    this.particleSystems = [];
    this.trailSystem = null;
  }
}
