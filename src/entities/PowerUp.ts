import * as BABYLON from '@babylonjs/core';
import { Obstacle } from './Obstacle';
import { Player } from './Player';

/**
 * Power-up types
 */
export enum PowerUpType {
  SHIELD = 'shield',           // Protects from next enemy hit
  MAGNET = 'magnet',           // Auto-collect nearby gates
  SPEED_BOOST = 'speed_boost', // Temporary speed increase
  MULTIPLIER = 'multiplier'    // Doubles next gate effect
}

/**
 * Power-up configuration
 */
interface PowerUpConfig {
  duration: number;
  color: BABYLON.Color3;
  icon: string;
}

/**
 * Power-up entity that grants special abilities
 */
export class PowerUp extends Obstacle {
  private powerUpType: PowerUpType;
  private rotationSpeed: number = 2;
  private floatOffset: number = 0;
  private label: BABYLON.Mesh | null = null;

  private static readonly CONFIGS: Record<PowerUpType, PowerUpConfig> = {
    [PowerUpType.SHIELD]: {
      duration: 10,
      color: BABYLON.Color3.FromHexString('#60A5FA'), // Blue
      icon: '🛡️'
    },
    [PowerUpType.MAGNET]: {
      duration: 8,
      color: BABYLON.Color3.FromHexString('#F59E0B'), // Amber
      icon: '🧲'
    },
    [PowerUpType.SPEED_BOOST]: {
      duration: 6,
      color: BABYLON.Color3.FromHexString('#10B981'), // Green
      icon: '⚡'
    },
    [PowerUpType.MULTIPLIER]: {
      duration: 12,
      color: BABYLON.Color3.FromHexString('#8B5CF6'), // Purple
      icon: '✨'
    }
  };

  constructor(
    scene: BABYLON.Scene,
    position: BABYLON.Vector3,
    lane: number,
    powerUpType: PowerUpType
  ) {
    super(scene, position, lane);
    this.powerUpType = powerUpType;
    // Recreate mesh with proper power-up type now that it's set
    if (this.mesh) {
      this.mesh.dispose();
    }
    this.createMesh();
    this.createLabel();
  }

  /**
   * Creates the power-up mesh (rotating cube with glow)
   */
  protected createMesh(): void {
    const config = PowerUp.CONFIGS[this.powerUpType];
    if (!config) return; // Guard against undefined type

    // Create main cube
    const cube = BABYLON.MeshBuilder.CreateBox(
      'powerup',
      { size: 1.5 },
      this.scene
    );
    cube.position = this.position;

    // Create glowing material
    const material = new BABYLON.StandardMaterial('powerupMat', this.scene);
    material.diffuseColor = config.color;
    material.emissiveColor = config.color.scale(0.7);
    material.specularColor = new BABYLON.Color3(1, 1, 1);
    material.specularPower = 64;
    cube.material = material;

    // Create outer glow sphere
    const glow = BABYLON.MeshBuilder.CreateSphere(
      'powerupGlow',
      { diameter: 2.5, segments: 16 },
      this.scene
    );
    glow.parent = cube;
    glow.position = BABYLON.Vector3.Zero();

    const glowMat = new BABYLON.StandardMaterial('glowMat', this.scene);
    glowMat.emissiveColor = config.color;
    glowMat.alpha = 0.2;
    glow.material = glowMat;

    // Add particle ring effect
    this.createRingParticles(cube, config.color);

    this.mesh = cube;
  }

  /**
   * Creates orbiting particle effect around power-up
   */
  private createRingParticles(parent: BABYLON.Mesh, color: BABYLON.Color3): void {
    const particleSystem = new BABYLON.ParticleSystem(
      'powerupParticles',
      50,
      this.scene
    );

    particleSystem.emitter = parent;
    particleSystem.particleTexture = this.createSimpleTexture();

    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.3;
    particleSystem.minLifeTime = 1.0;
    particleSystem.maxLifeTime = 2.0;

    particleSystem.color1 = new BABYLON.Color4(color.r, color.g, color.b, 1);
    particleSystem.color2 = new BABYLON.Color4(color.r, color.g, color.b, 0.5);
    particleSystem.colorDead = new BABYLON.Color4(color.r, color.g, color.b, 0);

    particleSystem.emitRate = 20;
    particleSystem.minEmitPower = 1;
    particleSystem.maxEmitPower = 2;

    particleSystem.createSphereEmitter(1.5);
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

    particleSystem.start();
  }

  /**
   * Creates icon label above power-up
   */
  private createLabel(): void {
    const config = PowerUp.CONFIGS[this.powerUpType];

    // Create label plane
    const plane = BABYLON.MeshBuilder.CreatePlane(
      'powerupLabel',
      { width: 2, height: 2 },
      this.scene
    );
    plane.position = this.position.clone();
    plane.position.y += 2.5;
    plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

    // Create dynamic texture for icon
    const texture = new BABYLON.DynamicTexture(
      'powerupLabelTexture',
      { width: 256, height: 256 },
      this.scene,
      false
    );

    const ctx = texture.getContext() as CanvasRenderingContext2D;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.arc(128, 128, 120, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = 'bold 120px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.icon, 128, 128);

    texture.update();

    const material = new BABYLON.StandardMaterial('powerupLabelMat', this.scene);
    material.diffuseTexture = texture;
    material.emissiveTexture = texture;
    material.opacityTexture = texture;
    material.backFaceCulling = false;
    material.disableLighting = true;

    plane.material = material;
    this.label = plane;
  }

  /**
   * Creates simple particle texture
   */
  private createSimpleTexture(): BABYLON.Texture {
    const size = 32;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new BABYLON.Texture('data:powerupTexture', this.scene, false, false);
    texture.updateURL(canvas.toDataURL());

    return texture;
  }

  public update(deltaTime: number): void {
    super.update(deltaTime);

    if (!this.mesh) return;

    // Rotate the power-up
    this.mesh.rotation.y += this.rotationSpeed * deltaTime;
    this.mesh.rotation.x += this.rotationSpeed * 0.5 * deltaTime;

    // Floating animation
    this.floatOffset += deltaTime * 2;
    this.mesh.position.y = this.position.y + Math.sin(this.floatOffset) * 0.3;

    // Update label position
    if (this.label) {
      this.label.position.x = this.mesh.position.x;
      this.label.position.z = this.mesh.position.z;
      this.label.position.y = this.mesh.position.y + 2.5;
    }

    // Pulse glow effect
    if (this.mesh.getChildMeshes()[0]) {
      const glow = this.mesh.getChildMeshes()[0];
      const scale = 1 + Math.sin(this.floatOffset * 2) * 0.1;
      glow.scaling = new BABYLON.Vector3(scale, scale, scale);
    }
  }

  public onCollision(_player: Player): void {
    // Power-up will be applied by PowerUpManager
    // Just mark for destruction
    this.shouldDestroy = true;
  }

  public getCollisionRadius(): number {
    return 1.5;
  }

  public getPowerUpType(): PowerUpType {
    return this.powerUpType;
  }

  public getDuration(): number {
    return PowerUp.CONFIGS[this.powerUpType].duration;
  }

  public getColor(): BABYLON.Color3 {
    return PowerUp.CONFIGS[this.powerUpType].color;
  }

  public destroy(): void {
    if (this.mesh) {
      // Stop all particle systems
      this.scene.particleSystems.forEach(ps => {
        if (ps.emitter === this.mesh) {
          ps.stop();
          ps.dispose();
        }
      });

      this.mesh.dispose();
    }

    if (this.label) {
      if (this.label.material) {
        this.label.material.dispose();
      }
      this.label.dispose();
      this.label = null;
    }

    super.destroy();
  }
}
