import {
  Scene,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  DynamicTexture,
  TransformNode,
  Mesh,
} from '@babylonjs/core';
import { Obstacle } from './Obstacle';
import { Player } from './Player';
import { Config } from '@/core/Config';

/**
 * EnemyCrowd - Enemy obstacle as red portal gate showing deduction
 * Extends Obstacle base class (Open/Closed Principle)
 */
export class EnemyCrowd extends Obstacle {
  private enemyCount: number;
  private glowParts: Mesh[];
  private animationTime: number = 0;

  constructor(scene: Scene, position: Vector3, lane: number, count: number) {
    super(scene, position, lane);
    this.enemyCount = count;
    this.glowParts = [];

    // Create label after properties are set
    const color = Color3.FromHexString(Config.COLORS.ENEMY);
    this.createLabel(this.mesh as any, color);
  }

  /**
   * Create red portal/arch style gate (similar to regular gates)
   */
  protected createMesh(): void {
    // Initialize glowParts
    if (!this.glowParts) {
      this.glowParts = [];
    }

    // Create parent node
    const gateNode = new TransformNode('enemyGate', this.scene);
    gateNode.position = this.position.clone();

    // Red color for enemy gate
    const color = Color3.FromHexString(Config.COLORS.ENEMY);

    // Create arch/portal frame (3 parts: left, right, top)
    const pillarWidth = 0.4;
    const pillarHeight = 3.5;
    const archWidth = 4;
    const archThickness = 0.3;

    // Left pillar
    const leftPillar = MeshBuilder.CreateBox(
      'leftPillar',
      { width: pillarWidth, height: pillarHeight, depth: archThickness },
      this.scene
    );
    leftPillar.position.x = -archWidth / 2 + pillarWidth / 2;
    leftPillar.position.y = pillarHeight / 2;
    leftPillar.parent = gateNode;
    this.glowParts.push(leftPillar);

    // Right pillar
    const rightPillar = MeshBuilder.CreateBox(
      'rightPillar',
      { width: pillarWidth, height: pillarHeight, depth: archThickness },
      this.scene
    );
    rightPillar.position.x = archWidth / 2 - pillarWidth / 2;
    rightPillar.position.y = pillarHeight / 2;
    rightPillar.parent = gateNode;
    this.glowParts.push(rightPillar);

    // Top arch
    const topArch = MeshBuilder.CreateBox(
      'topArch',
      { width: archWidth, height: pillarWidth, depth: archThickness },
      this.scene
    );
    topArch.position.y = pillarHeight;
    topArch.parent = gateNode;
    this.glowParts.push(topArch);

    // Center fill (semi-transparent energy field)
    const centerFill = MeshBuilder.CreatePlane(
      'centerFill',
      { width: archWidth - pillarWidth * 2, height: pillarHeight },
      this.scene
    );
    centerFill.position.y = pillarHeight / 2;
    centerFill.parent = gateNode;

    // Create glowing material for frame (red/danger)
    const frameMaterial = new StandardMaterial('enemyFrameMat', this.scene);
    frameMaterial.diffuseColor = color;
    frameMaterial.emissiveColor = color.scale(0.6);
    frameMaterial.specularColor = new Color3(1, 1, 1);

    leftPillar.material = frameMaterial;
    rightPillar.material = frameMaterial;
    topArch.material = frameMaterial;

    // Create energy field material (red warning)
    const fillMaterial = new StandardMaterial('enemyFillMat', this.scene);
    fillMaterial.diffuseColor = color;
    fillMaterial.emissiveColor = color.scale(0.4);
    fillMaterial.alpha = 0.3;
    centerFill.material = fillMaterial;

    // Store main mesh reference
    this.mesh = gateNode as any;

    // Store glow parts for animation
    this.glowParts.push(centerFill);
  }

  /**
   * Create text label showing deduction amount
   */
  private createLabel(parent: TransformNode, color: Color3): void {
    const textPlane = MeshBuilder.CreatePlane(
      'enemyLabel',
      { width: 2.5, height: 1.5 },
      this.scene
    );

    textPlane.parent = parent;
    textPlane.position.y = 1.75;
    textPlane.position.z = -0.2;

    const texture = new DynamicTexture(
      'enemyText',
      { width: 512, height: 256 },
      this.scene
    );

    const text = `-${this.enemyCount}`;

    const ctx = texture.getContext() as CanvasRenderingContext2D;

    // Draw background glow (red)
    ctx.fillStyle = `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, 0.3)`;
    ctx.fillRect(0, 0, 512, 256);

    // Draw text (white with red outline)
    ctx.fillStyle = 'white';
    ctx.strokeStyle = `rgb(${color.r * 255}, ${color.g * 255}, ${color.b * 255})`;
    ctx.lineWidth = 8;
    ctx.font = 'bold 140px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText(text, 256, 128);
    ctx.fillText(text, 256, 128);

    texture.update();

    const textMaterial = new StandardMaterial('enemyTextMat', this.scene);
    textMaterial.diffuseTexture = texture;
    textMaterial.emissiveTexture = texture;
    textMaterial.opacityTexture = texture;
    textMaterial.backFaceCulling = false;
    textPlane.material = textMaterial;
  }

  /**
   * Update with pulsing glow animation (danger pulse)
   */
  public update(deltaTime: number): void {
    super.update(deltaTime);

    // Pulsing glow animation (faster pulse for danger)
    this.animationTime += deltaTime * 4;
    const pulseIntensity = 0.5 + Math.sin(this.animationTime) * 0.3;

    this.glowParts.forEach((part) => {
      const mat = part.material as StandardMaterial;
      if (mat && mat.emissiveColor) {
        const baseColor = Color3.FromHexString(Config.COLORS.ENEMY);
        mat.emissiveColor = baseColor.scale(pulseIntensity);
      }
    });

    // Slight rotation for energy field (more chaotic than friendly gates)
    if (this.glowParts.length > 3) {
      const energyField = this.glowParts[3];
      energyField.rotation.z = Math.sin(this.animationTime * 0.7) * 0.15;
    }
  }

  /**
   * Handle collision with player
   */
  public onCollision(player: Player): void {
    // Subtract enemy count from player crowd
    player.removeFromCrowd(this.enemyCount);

    // Visual feedback - fade out all parts
    this.glowParts.forEach((part) => {
      const mat = part.material as StandardMaterial;
      if (mat) {
        mat.alpha = 0.2;
      }
    });
  }

  /**
   * Get collision radius for enemy gate
   */
  public getCollisionRadius(): number {
    return Config.GATE_COLLISION_RADIUS;
  }

  /**
   * Get enemy count
   */
  public getEnemyCount(): number {
    return this.enemyCount;
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.glowParts.forEach((part) => part.dispose());
    this.glowParts = [];
    super.destroy();
  }
}
