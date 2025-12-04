import {
  Scene,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Color3,
  TransformNode,
} from '@babylonjs/core';

/**
 * StickmanBuilder - Creates low-poly stickman meshes
 * Single Responsibility: Stickman mesh creation
 */
export class StickmanBuilder {
  /**
   * Create a simple stickman mesh
   */
  public static createStickman(
    scene: Scene,
    color: Color3 = new Color3(0.2, 0.4, 0.8)
  ): Mesh {
    // Create parent node to hold all parts
    const stickman = new TransformNode('stickman', scene);

    // Body (cylinder)
    const body = MeshBuilder.CreateCylinder(
      'body',
      { diameter: 0.3, height: 0.8 },
      scene
    );
    body.position.y = 0.4;
    body.parent = stickman;

    // Head (sphere)
    const head = MeshBuilder.CreateSphere(
      'head',
      { diameter: 0.35 },
      scene
    );
    head.position.y = 1.0;
    head.parent = stickman;

    // Left arm (thin cylinder)
    const leftArm = MeshBuilder.CreateCylinder(
      'leftArm',
      { diameter: 0.12, height: 0.6 },
      scene
    );
    leftArm.rotation.z = Math.PI / 6; // Slight angle
    leftArm.position.set(-0.3, 0.5, 0);
    leftArm.parent = stickman;

    // Right arm (thin cylinder)
    const rightArm = MeshBuilder.CreateCylinder(
      'rightArm',
      { diameter: 0.12, height: 0.6 },
      scene
    );
    rightArm.rotation.z = -Math.PI / 6; // Slight angle
    rightArm.position.set(0.3, 0.5, 0);
    rightArm.parent = stickman;

    // Left leg (thin cylinder)
    const leftLeg = MeshBuilder.CreateCylinder(
      'leftLeg',
      { diameter: 0.15, height: 0.5 },
      scene
    );
    leftLeg.position.set(-0.12, -0.25, 0);
    leftLeg.parent = stickman;

    // Right leg (thin cylinder)
    const rightLeg = MeshBuilder.CreateCylinder(
      'rightLeg',
      { diameter: 0.15, height: 0.5 },
      scene
    );
    rightLeg.position.set(0.12, -0.25, 0);
    rightLeg.parent = stickman;

    // Create material
    const material = new StandardMaterial('stickmanMat', scene);
    material.diffuseColor = color;
    material.emissiveColor = color.scale(0.2);
    material.specularColor = new Color3(0.2, 0.2, 0.2);

    // Apply material to all parts
    body.material = material;
    head.material = material;
    leftArm.material = material;
    rightArm.material = material;
    leftLeg.material = material;
    rightLeg.material = material;

    // Merge all meshes into one for performance
    const meshes = [body, head, leftArm, rightArm, leftLeg, rightLeg];
    const merged = Mesh.MergeMeshes(
      meshes,
      true, // dispose source meshes
      true, // allow different materials
      undefined,
      false,
      true // use material clone
    );

    if (merged) {
      merged.name = 'stickman';
      return merged;
    }

    // Fallback if merge fails
    return body;
  }

  /**
   * Create a template stickman for instancing
   */
  public static createStickmanTemplate(
    scene: Scene,
    color: Color3 = new Color3(0.2, 0.4, 0.8)
  ): Mesh {
    const stickman = this.createStickman(scene, color);
    stickman.setEnabled(false); // Template is invisible
    return stickman;
  }
}
