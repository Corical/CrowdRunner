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
  private labelMesh!: TransformNode;

  constructor(scene: Scene, position: Vector3, speed: number, count: number) {
    super(scene, position, speed);
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
      { width: 1, height: 0.6 },
      this.scene
    );

    textPlane.parent = this.mesh;
    textPlane.position.y = 2.5;
    textPlane.position.z = 0.01; // Slightly in front
    textPlane.billboardMode = 7; // Face camera

    const texture = new DynamicTexture(
      'enemyText',
      { width: 256, height: 128 },
      this.scene
    );

    const text = `-${this.enemyCount}`;

    const ctx = texture.getContext();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 64);

    texture.update();

    const textMaterial = new StandardMaterial('enemyTextMat', this.scene);
    textMaterial.diffuseTexture = texture;
    textMaterial.emissiveTexture = texture;
    textMaterial.opacityTexture = texture;
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
