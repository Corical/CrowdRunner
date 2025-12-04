import {
  Scene,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  DynamicTexture,
  Mesh,
  TransformNode,
} from '@babylonjs/core';
import { Obstacle } from './Obstacle';
import { Player } from './Player';
import { Config, GateType } from '@/core/Config';

/**
 * Gate - Improved portal/arch style gate with glowing effects
 * Extends Obstacle base class (Open/Closed Principle)
 */
export class Gate extends Obstacle {
  private gateType: GateType;
  private value: number;
  private glowParts: Mesh[] = [];
  private animationTime: number = 0;

  constructor(
    scene: Scene,
    position: Vector3,
    speed: number,
    gateType: GateType,
    value: number
  ) {
    super(scene, position, speed);
    this.gateType = gateType;
    this.value = value;
  }

  /**
   * Create portal/arch style gate
   */
  protected createMesh(): void {
    // Create parent node
    const gateNode = new TransformNode('gate', this.scene);
    gateNode.position = this.position.clone();

    // Get color based on type
    const color =
      this.gateType === GateType.MULTIPLY
        ? Color3.FromHexString(Config.COLORS.GATE_MULTIPLY)
        : Color3.FromHexString(Config.COLORS.GATE_ADD);

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

    // Create glowing material for frame
    const frameMaterial = new StandardMaterial('frameMat', this.scene);
    frameMaterial.diffuseColor = color;
    frameMaterial.emissiveColor = color.scale(0.6);
    frameMaterial.specularColor = new Color3(1, 1, 1);

    leftPillar.material = frameMaterial;
    rightPillar.material = frameMaterial;
    topArch.material = frameMaterial;

    // Create energy field material
    const fillMaterial = new StandardMaterial('fillMat', this.scene);
    fillMaterial.diffuseColor = color;
    fillMaterial.emissiveColor = color.scale(0.4);
    fillMaterial.alpha = 0.3;
    centerFill.material = fillMaterial;

    // Add text label
    this.createLabel(gateNode, color);

    // Store main mesh reference (we'll use the parent node)
    this.mesh = gateNode as any;

    // Store glow parts for animation
    this.glowParts.push(centerFill);
  }

  /**
   * Create text label showing gate value
   */
  private createLabel(parent: TransformNode, color: Color3): void {
    const textPlane = MeshBuilder.CreatePlane(
      'gateLabel',
      { width: 2.5, height: 1.5 },
      this.scene
    );

    textPlane.parent = parent;
    textPlane.position.y = 1.75;
    textPlane.position.z = -0.2;

    const texture = new DynamicTexture(
      'gateText',
      { width: 512, height: 256 },
      this.scene
    );

    const text =
      this.gateType === GateType.MULTIPLY ? `x${this.value}` : `+${this.value}`;

    const ctx = texture.getContext();

    // Draw background glow
    ctx.fillStyle = `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, 0.3)`;
    ctx.fillRect(0, 0, 512, 256);

    // Draw text
    ctx.fillStyle = 'white';
    ctx.strokeStyle = `rgb(${color.r * 255}, ${color.g * 255}, ${color.b * 255})`;
    ctx.lineWidth = 8;
    ctx.font = 'bold 140px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText(text, 256, 128);
    ctx.fillText(text, 256, 128);

    texture.update();

    const textMaterial = new StandardMaterial('gateTextMat', this.scene);
    textMaterial.diffuseTexture = texture;
    textMaterial.emissiveTexture = texture;
    textMaterial.opacityTexture = texture;
    textMaterial.backFaceCulling = false;
    textPlane.material = textMaterial;
  }

  /**
   * Update with pulsing glow animation
   */
  public update(deltaTime: number): void {
    super.update(deltaTime);

    // Pulsing glow animation
    this.animationTime += deltaTime * 3;
    const pulseIntensity = 0.5 + Math.sin(this.animationTime) * 0.2;

    this.glowParts.forEach((part) => {
      const mat = part.material as StandardMaterial;
      if (mat && mat.emissiveColor) {
        const baseColor =
          this.gateType === GateType.MULTIPLY
            ? Color3.FromHexString(Config.COLORS.GATE_MULTIPLY)
            : Color3.FromHexString(Config.COLORS.GATE_ADD);

        mat.emissiveColor = baseColor.scale(pulseIntensity);
      }
    });

    // Slight rotation for energy field
    if (this.glowParts.length > 3) {
      const energyField = this.glowParts[3];
      energyField.rotation.z = Math.sin(this.animationTime * 0.5) * 0.1;
    }
  }

  /**
   * Handle collision with player
   */
  public onCollision(player: Player): void {
    if (this.gateType === GateType.MULTIPLY) {
      player.multiplyCrowd(this.value);
    } else {
      player.addToCrowd(this.value);
    }

    // Visual feedback - fade out all parts
    this.glowParts.forEach((part) => {
      const mat = part.material as StandardMaterial;
      if (mat) {
        mat.alpha = 0.2;
      }
    });
  }

  /**
   * Get collision radius for gate
   */
  public getCollisionRadius(): number {
    return Config.GATE_COLLISION_RADIUS;
  }

  /**
   * Clean up
   */
  public destroy(): void {
    this.glowParts.forEach((part) => part.dispose());
    this.glowParts = [];
    super.destroy();
  }
}
