import * as BABYLON from '@babylonjs/core';
import { Obstacle } from './Obstacle';
import { Player } from './Player';

/**
 * Power-up types
 */
export enum PowerUpType {
  SHIELD = 'shield',
  MAGNET = 'magnet',
  SPEED_BOOST = 'speed_boost',
  MULTIPLIER = 'multiplier',
  VAMPIRE = 'vampire',
  GHOST = 'ghost',
  REGEN = 'regen',
  TIME_SLOW = 'time_slow',
  FRENZY = 'frenzy'
}

interface PowerUpConfig {
  duration: number;
  color: BABYLON.Color3;
  label: string;
  shape: 'sphere' | 'diamond' | 'star' | 'cross' | 'octahedron';
}

/**
 * Power-up entity — distinctive 3D shapes with text labels.
 * Each type has a unique shape + color so players learn to recognise them.
 */
export class PowerUp extends Obstacle {
  private powerUpType: PowerUpType;
  private rotationSpeed: number = 2;
  private floatTime: number = 0;
  private labelMesh: BABYLON.Mesh | null = null;
  private glowMesh: BABYLON.Mesh | null = null;

  private static readonly CONFIGS: Record<PowerUpType, PowerUpConfig> = {
    [PowerUpType.SHIELD]: {
      duration: 10,
      color: BABYLON.Color3.FromHexString('#60A5FA'),
      label: 'SHIELD',
      shape: 'sphere',
    },
    [PowerUpType.MAGNET]: {
      duration: 8,
      color: BABYLON.Color3.FromHexString('#F59E0B'),
      label: 'MAGNET',
      shape: 'diamond',
    },
    [PowerUpType.SPEED_BOOST]: {
      duration: 6,
      color: BABYLON.Color3.FromHexString('#10B981'),
      label: 'SPEED',
      shape: 'octahedron',
    },
    [PowerUpType.MULTIPLIER]: {
      duration: 12,
      color: BABYLON.Color3.FromHexString('#8B5CF6'),
      label: 'x2',
      shape: 'star',
    },
    [PowerUpType.VAMPIRE]: {
      duration: 8,
      color: BABYLON.Color3.FromHexString('#DC2626'),
      label: 'DRAIN',
      shape: 'octahedron',
    },
    [PowerUpType.GHOST]: {
      duration: 5,
      color: BABYLON.Color3.FromHexString('#E5E7EB'),
      label: 'GHOST',
      shape: 'sphere',
    },
    [PowerUpType.REGEN]: {
      duration: 10,
      color: BABYLON.Color3.FromHexString('#22C55E'),
      label: 'HEAL',
      shape: 'cross',
    },
    [PowerUpType.TIME_SLOW]: {
      duration: 6,
      color: BABYLON.Color3.FromHexString('#06B6D4'),
      label: 'SLOW',
      shape: 'diamond',
    },
    [PowerUpType.FRENZY]: {
      duration: 8,
      color: BABYLON.Color3.FromHexString('#F97316'),
      label: 'FRENZY',
      shape: 'star',
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

    // Recreate mesh with correct type (super() calls createMesh before type is set)
    if (this.mesh) {
      this.mesh.dispose();
    }
    this.createMesh();
    this.createTextLabel();
  }

  /**
   * Create the 3D shape for this power-up type
   */
  protected createMesh(): void {
    const config = PowerUp.CONFIGS[this.powerUpType];
    if (!config) return;

    let shape: BABYLON.Mesh;

    switch (config.shape) {
      case 'sphere':
        shape = BABYLON.MeshBuilder.CreateSphere(
          'pu_sphere',
          { diameter: 1.4, segments: 12 },
          this.scene
        );
        break;

      case 'diamond': {
        // Two cones tip-to-tip = diamond
        const top = BABYLON.MeshBuilder.CreateCylinder(
          'pu_top',
          { diameterTop: 0, diameterBottom: 1.2, height: 1, tessellation: 6 },
          this.scene
        );
        top.position.y = 0.5;

        const bottom = BABYLON.MeshBuilder.CreateCylinder(
          'pu_bot',
          { diameterTop: 1.2, diameterBottom: 0, height: 1, tessellation: 6 },
          this.scene
        );
        bottom.position.y = -0.5;

        shape = BABYLON.Mesh.MergeMeshes([top, bottom], true, false)!;
        shape.name = 'pu_diamond';
        break;
      }

      case 'star': {
        // Spiky shape — two intersecting octahedrons at different rotations
        const oct1 = BABYLON.MeshBuilder.CreatePolyhedron(
          'pu_oct1',
          { type: 1, size: 0.6 },
          this.scene
        );
        const oct2 = BABYLON.MeshBuilder.CreatePolyhedron(
          'pu_oct2',
          { type: 1, size: 0.6 },
          this.scene
        );
        oct2.rotation.y = Math.PI / 4;
        oct2.rotation.x = Math.PI / 4;

        shape = BABYLON.Mesh.MergeMeshes([oct1, oct2], true, false)!;
        shape.name = 'pu_star';
        break;
      }

      case 'cross': {
        // Medical cross — three intersecting boxes
        const h = BABYLON.MeshBuilder.CreateBox('pu_h', { width: 1.4, height: 0.4, depth: 0.4 }, this.scene);
        const v = BABYLON.MeshBuilder.CreateBox('pu_v', { width: 0.4, height: 1.4, depth: 0.4 }, this.scene);
        const d = BABYLON.MeshBuilder.CreateBox('pu_d', { width: 0.4, height: 0.4, depth: 1.4 }, this.scene);

        shape = BABYLON.Mesh.MergeMeshes([h, v, d], true, false)!;
        shape.name = 'pu_cross';
        break;
      }

      case 'octahedron':
        shape = BABYLON.MeshBuilder.CreatePolyhedron(
          'pu_octa',
          { type: 1, size: 0.6 },
          this.scene
        );
        break;

      default:
        shape = BABYLON.MeshBuilder.CreateBox('pu_box', { size: 1.2 }, this.scene);
    }

    shape.position = this.position.clone();

    // Glowing material
    const mat = new BABYLON.StandardMaterial('puMat', this.scene);
    mat.diffuseColor = config.color;
    mat.emissiveColor = config.color.scale(0.5);
    mat.specularColor = new BABYLON.Color3(1, 1, 1);
    mat.specularPower = 64;
    shape.material = mat;

    // Outer glow halo
    this.glowMesh = BABYLON.MeshBuilder.CreateSphere(
      'puGlow',
      { diameter: 2.2, segments: 8 },
      this.scene
    );
    this.glowMesh.parent = shape;
    this.glowMesh.position = BABYLON.Vector3.Zero();

    const glowMat = new BABYLON.StandardMaterial('puGlowMat', this.scene);
    glowMat.emissiveColor = config.color;
    glowMat.alpha = 0.15;
    glowMat.backFaceCulling = false;
    this.glowMesh.material = glowMat;

    this.mesh = shape;
  }

  /**
   * Create a readable text label above the power-up (no emoji — plain text)
   */
  private createTextLabel(): void {
    const config = PowerUp.CONFIGS[this.powerUpType];
    if (!config) return;

    const plane = BABYLON.MeshBuilder.CreatePlane(
      'puLabel',
      { width: 2.5, height: 0.8 },
      this.scene
    );
    plane.position = this.position.clone();
    plane.position.y += 2.2;
    plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    plane.renderingGroupId = 1;

    const tex = new BABYLON.DynamicTexture(
      'puLabelTex',
      { width: 512, height: 128 },
      this.scene,
      false
    );

    const ctx = tex.getContext() as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, 512, 128);

    // Background pill
    ctx.fillStyle = `rgba(0, 0, 0, 0.6)`;
    const radius = 30;
    ctx.beginPath();
    ctx.moveTo(radius, 8);
    ctx.lineTo(512 - radius, 8);
    ctx.quadraticCurveTo(504, 8, 504, 8 + radius);
    ctx.lineTo(504, 120 - radius);
    ctx.quadraticCurveTo(504, 120, 504 - radius, 120);
    ctx.lineTo(radius, 120);
    ctx.quadraticCurveTo(8, 120, 8, 120 - radius);
    ctx.lineTo(8, 8 + radius);
    ctx.quadraticCurveTo(8, 8, 8 + radius, 8);
    ctx.closePath();
    ctx.fill();

    // Text
    ctx.font = 'bold 64px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `rgb(${config.color.r * 255}, ${config.color.g * 255}, ${config.color.b * 255})`;
    ctx.fillText(config.label, 256, 68);

    tex.update();

    const mat = new BABYLON.StandardMaterial('puLabelMat', this.scene);
    mat.diffuseTexture = tex;
    mat.emissiveTexture = tex;
    mat.opacityTexture = tex;
    mat.backFaceCulling = false;
    mat.disableLighting = true;
    mat.useAlphaFromDiffuseTexture = true;

    plane.material = mat;
    this.labelMesh = plane;
  }

  public update(deltaTime: number): void {
    super.update(deltaTime);
    if (!this.mesh) return;

    // Spin
    this.mesh.rotation.y += this.rotationSpeed * deltaTime;

    // Float up and down
    this.floatTime += deltaTime * 3;
    this.mesh.position.y = this.position.y + Math.sin(this.floatTime) * 0.3 + 0.3;

    // Pulse glow
    if (this.glowMesh) {
      const scale = 1 + Math.sin(this.floatTime * 2) * 0.15;
      this.glowMesh.scaling.setAll(scale);
    }

    // Track label to mesh
    if (this.labelMesh) {
      this.labelMesh.position.x = this.mesh.position.x;
      this.labelMesh.position.z = this.mesh.position.z;
      this.labelMesh.position.y = this.mesh.position.y + 1.8;
    }
  }

  public onCollision(_player: Player): void {
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
    // Clean up particle systems attached to this mesh
    if (this.mesh) {
      this.scene.particleSystems
        .filter(ps => ps.emitter === this.mesh)
        .forEach(ps => { ps.stop(); ps.dispose(); });
    }

    if (this.labelMesh) {
      if (this.labelMesh.material) this.labelMesh.material.dispose();
      this.labelMesh.dispose();
      this.labelMesh = null;
    }

    if (this.glowMesh) {
      if (this.glowMesh.material) this.glowMesh.material.dispose();
      this.glowMesh.dispose();
      this.glowMesh = null;
    }

    super.destroy();
  }
}
