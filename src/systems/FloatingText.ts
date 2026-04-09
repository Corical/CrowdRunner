import * as BABYLON from '@babylonjs/core';
import { IUpdatable, IDestroyable } from '../core/Interfaces';

/**
 * Floating text animation (damage numbers, gains, etc.)
 */
class FloatingTextInstance {
  public mesh: BABYLON.Mesh;
  public velocity: BABYLON.Vector3;
  public lifetime: number;
  public age: number = 0;
  public fadeStart: number;

  constructor(
    mesh: BABYLON.Mesh,
    velocity: BABYLON.Vector3,
    lifetime: number,
    fadeStart: number
  ) {
    this.mesh = mesh;
    this.velocity = velocity;
    this.lifetime = lifetime;
    this.fadeStart = fadeStart;
  }
}

/**
 * Manages floating text effects for visual feedback
 */
export class FloatingTextSystem implements IUpdatable, IDestroyable {
  private scene: BABYLON.Scene;
  private instances: FloatingTextInstance[] = [];

  constructor(scene: BABYLON.Scene) {
    this.scene = scene;
  }

  /**
   * Show a floating number (positive = gain, negative = loss)
   * @param text - Text to display
   * @param position - World position
   * @param color - Text color
   * @param scale - Text scale multiplier
   */
  public showFloatingText(
    text: string,
    position: BABYLON.Vector3,
    color: BABYLON.Color3 = BABYLON.Color3.Green(),
    scale: number = 1.0
  ): void {
    // Create dynamic texture for text — wider canvas for long text
    const texWidth = 1024;
    const texHeight = 256;
    const texture = new BABYLON.DynamicTexture(
      'floatingText',
      { width: texWidth, height: texHeight },
      this.scene,
      false
    );

    const ctx = texture.getContext() as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, texWidth, texHeight);

    // Measure text to auto-size font
    let fontSize = 120;
    ctx.font = `bold ${fontSize}px Arial`;
    let textWidth = ctx.measureText(text).width;
    // Shrink font if text is too wide for canvas
    while (textWidth > texWidth * 0.9 && fontSize > 40) {
      fontSize -= 10;
      ctx.font = `bold ${fontSize}px Arial`;
      textWidth = ctx.measureText(text).width;
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Outline
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 8;
    ctx.strokeText(text, texWidth / 2, texHeight / 2);

    // Fill
    const hexColor = color.toHexString();
    ctx.fillStyle = hexColor;
    ctx.fillText(text, texWidth / 2, texHeight / 2);

    texture.update();

    // Create plane for text
    const plane = BABYLON.MeshBuilder.CreatePlane(
      'floatingTextPlane',
      { width: 4 * scale, height: 2 * scale },
      this.scene
    );

    plane.position = position.clone();
    plane.position.y = Math.max(position.y, 3) + 2; // Always well above road
    plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

    // Render on top of scene geometry so road/ground never clips text
    plane.renderingGroupId = 1;

    // Create material
    const material = new BABYLON.StandardMaterial('floatingTextMat', this.scene);
    material.diffuseTexture = texture;
    material.emissiveTexture = texture;
    material.opacityTexture = texture;
    material.backFaceCulling = false;
    material.disableLighting = true;
    material.useAlphaFromDiffuseTexture = true;

    plane.material = material;

    // Create instance with upward velocity
    const velocity = new BABYLON.Vector3(
      (Math.random() - 0.5) * 0.5,
      3 + Math.random() * 2,
      (Math.random() - 0.5) * 0.5
    );

    const instance = new FloatingTextInstance(
      plane,
      velocity,
      2.0, // 2 second lifetime
      1.0  // Start fading after 1 second
    );

    this.instances.push(instance);
  }

  /**
   * Show a gain number (green, with + prefix)
   */
  public showGain(amount: number, position: BABYLON.Vector3, scale: number = 1.0): void {
    this.showFloatingText(
      `+${amount}`,
      position,
      BABYLON.Color3.FromHexString('#48BB78'), // Green
      scale
    );
  }

  /**
   * Show a multiplication (blue, with x prefix)
   */
  public showMultiplier(multiplier: number, position: BABYLON.Vector3): void {
    this.showFloatingText(
      `x${multiplier}`,
      position,
      BABYLON.Color3.FromHexString('#3B82F6'), // Blue
      1.3
    );
  }

  /**
   * Show a loss number (red, with - prefix)
   */
  public showLoss(amount: number, position: BABYLON.Vector3): void {
    this.showFloatingText(
      `-${amount}`,
      position,
      BABYLON.Color3.FromHexString('#EF4444'), // Red
      1.0
    );
  }

  /**
   * Show combo text
   */
  public showCombo(combo: number, tier: string, position: BABYLON.Vector3): void {
    this.showFloatingText(
      `${combo}x ${tier}!`,
      position,
      BABYLON.Color3.FromHexString('#F59E0B'), // Amber
      1.5
    );
  }

  /**
   * Show power-up activation
   */
  public showPowerUpActivated(name: string, position: BABYLON.Vector3): void {
    this.showFloatingText(
      name,
      position,
      BABYLON.Color3.FromHexString('#8B5CF6'), // Purple
      1.2
    );
  }

  /**
   * Show milestone achievement
   */
  public showMilestone(text: string, position: BABYLON.Vector3): void {
    this.showFloatingText(
      text,
      position,
      BABYLON.Color3.FromHexString('#FBBF24'), // Gold
      1.8
    );
  }

  public update(deltaTime: number): void {
    const toRemove: FloatingTextInstance[] = [];

    this.instances.forEach(instance => {
      instance.age += deltaTime;

      // Update position
      instance.mesh.position.addInPlace(instance.velocity.scale(deltaTime));

      // Apply gravity to velocity
      instance.velocity.y -= 5 * deltaTime;

      // Fade out
      if (instance.age > instance.fadeStart) {
        const fadeProgress = (instance.age - instance.fadeStart) / (instance.lifetime - instance.fadeStart);
        const alpha = 1 - fadeProgress;

        if (instance.mesh.material && instance.mesh.material instanceof BABYLON.StandardMaterial) {
          instance.mesh.material.alpha = Math.max(0, alpha);
        }
      }

      // Scale animation (start big, shrink slightly)
      const scaleProgress = Math.min(instance.age / 0.3, 1);
      const scale = 1.3 - (scaleProgress * 0.3); // 1.3 -> 1.0
      instance.mesh.scaling = new BABYLON.Vector3(scale, scale, scale);

      // Mark for removal if expired
      if (instance.age >= instance.lifetime) {
        toRemove.push(instance);
      }
    });

    // Remove expired instances
    toRemove.forEach(instance => {
      const index = this.instances.indexOf(instance);
      if (index > -1) {
        this.instances.splice(index, 1);
      }

      // Clean up
      if (instance.mesh.material) {
        instance.mesh.material.dispose();
      }
      instance.mesh.dispose();
    });
  }

  public destroy(): void {
    this.instances.forEach(instance => {
      if (instance.mesh.material) {
        instance.mesh.material.dispose();
      }
      instance.mesh.dispose();
    });
    this.instances = [];
  }
}
