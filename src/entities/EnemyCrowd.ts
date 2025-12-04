import {
  Scene,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  DynamicTexture,
  TransformNode,
} from '@babylonjs/core';
import { Obstacle } from './Obstacle';
import { Player } from './Player';
import { Config } from '@/core/Config';
import { CrowdFormation } from '@/systems/CrowdFormation';

/**
 * EnemyCrowd - Enemy crowd obstacle with actual stickman formation
 * Extends Obstacle base class (Open/Closed Principle)
 */
export class EnemyCrowd extends Obstacle {
  private enemyCount: number;
  private crowdFormation: CrowdFormation;

  constructor(scene: Scene, position: Vector3, lane: number, count: number) {
    super(scene, position, lane);
    this.enemyCount = count;

    // Create crowd formation for enemy
    const redColor = Color3.FromHexString(Config.COLORS.ENEMY);
    this.crowdFormation = new CrowdFormation(scene, position, redColor);
    this.crowdFormation.setCrowdCount(count);
  }

  /**
   * Create visual representation of enemy crowd
   */
  protected createMesh(): void {
    // Create parent node for label
    this.mesh = new TransformNode('enemyCrowd', this.scene) as any;
    (this.mesh as any).position = this.position.clone();

    // Add count label floating above
    this.createLabel();
  }

  /**
   * Create text label showing enemy count
   */
  private createLabel(): void {
    // Background circle
    const labelBg = MeshBuilder.CreateDisc(
      'enemyLabelBg',
      { radius: 0.6 },
      this.scene
    );
    labelBg.parent = this.mesh;
    labelBg.position.y = 2.5;
    labelBg.billboardMode = 7; // Face camera

    const bgMaterial = new StandardMaterial('enemyBgMat', this.scene);
    bgMaterial.diffuseColor = Color3.FromHexString(Config.COLORS.ENEMY);
    bgMaterial.emissiveColor = Color3.FromHexString(Config.COLORS.ENEMY).scale(
      0.4
    );
    labelBg.material = bgMaterial;

    // Text plane
    const textPlane = MeshBuilder.CreatePlane(
      'enemyLabel',
      { width: 1.2, height: 0.7 },
      this.scene
    );

    textPlane.parent = this.mesh;
    textPlane.position.y = 2.5;
    textPlane.position.z = 0.05; // Further in front to avoid z-fighting
    textPlane.billboardMode = 7; // Face camera

    const texture = new DynamicTexture(
      'enemyText',
      { width: 512, height: 256 },
      this.scene,
      false // Don't generate mipmaps for text
    );

    const text = `-${this.enemyCount}`;

    const ctx = texture.getContext() as CanvasRenderingContext2D;
    // Fill background with semi-transparent red for debugging
    ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
    ctx.fillRect(0, 0, 512, 256);

    // Draw white text with black outline for better visibility
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 8;
    ctx.fillStyle = 'white';
    ctx.font = 'bold 160px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText(text, 256, 128);
    ctx.fillText(text, 256, 128);

    texture.update();

    const textMaterial = new StandardMaterial('enemyTextMat', this.scene);
    textMaterial.diffuseTexture = texture;
    textMaterial.emissiveTexture = texture;
    textMaterial.emissiveColor = new Color3(1, 1, 1);
    textMaterial.backFaceCulling = false;
    textMaterial.transparencyMode = 2; // ALPHABLEND
    textPlane.material = textMaterial;
  }

  /**
   * Update enemy crowd position and formation
   */
  public update(deltaTime: number): void {
    super.update(deltaTime);

    // Update crowd formation
    this.crowdFormation.setPosition(this.position);
    this.crowdFormation.update(deltaTime);

    // Update label position
    if (this.mesh) {
      (this.mesh as any).position.copyFrom(this.position);
    }
  }

  /**
   * Handle collision with player
   */
  public onCollision(player: Player): void {
    // Subtract enemy count from player crowd
    player.removeFromCrowd(this.enemyCount);

    // Make enemy disappear
    this.crowdFormation.setCrowdCount(0);
    if (this.mesh) {
      (this.mesh as any).setEnabled(false);
    }
  }

  /**
   * Get collision radius for enemy crowd
   */
  public getCollisionRadius(): number {
    return Config.COLLISION_RADIUS;
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
    this.crowdFormation.dispose();
    super.destroy();
  }
}
