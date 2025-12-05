import {
  Scene,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Color3,
  TransformNode,
} from '@babylonjs/core';
import { Config } from '@/core/Config';

/**
 * StickmanBuilder - Creates low-poly stickman meshes
 * Single Responsibility: Stickman mesh creation
 */
export class StickmanBuilder {
  /**
   * Create a stickman mesh (simple or detailed based on config)
   */
  public static createStickman(
    scene: Scene,
    color: Color3 = new Color3(0.2, 0.4, 0.8)
  ): Mesh {
    return Config.ENABLE_DETAILED_MODELS
      ? this.createDetailedStickman(scene, color)
      : this.createSimpleStickman(scene, color);
  }

  /**
   * Create a simple, low-poly stickman (better performance)
   */
  private static createSimpleStickman(
    scene: Scene,
    color: Color3
  ): Mesh {
    // Create parent node to hold all parts
    const stickman = new TransformNode('stickman', scene);

    // Body (cylinder)
    const body = MeshBuilder.CreateCylinder(
      'body',
      { diameter: 0.3, height: 0.8, tessellation: 6 },
      scene
    );
    body.position.y = 0.4;
    body.parent = stickman;

    // Head (sphere)
    const head = MeshBuilder.CreateSphere(
      'head',
      { diameter: 0.35, segments: 6 },
      scene
    );
    head.position.y = 1.0;
    head.parent = stickman;

    // Left arm (thin cylinder)
    const leftArm = MeshBuilder.CreateCylinder(
      'leftArm',
      { diameter: 0.12, height: 0.6, tessellation: 4 },
      scene
    );
    leftArm.rotation.z = Math.PI / 6; // Slight angle
    leftArm.position.set(-0.3, 0.5, 0);
    leftArm.parent = stickman;

    // Right arm (thin cylinder)
    const rightArm = MeshBuilder.CreateCylinder(
      'rightArm',
      { diameter: 0.12, height: 0.6, tessellation: 4 },
      scene
    );
    rightArm.rotation.z = -Math.PI / 6; // Slight angle
    rightArm.position.set(0.3, 0.5, 0);
    rightArm.parent = stickman;

    // Left leg (thin cylinder)
    const leftLeg = MeshBuilder.CreateCylinder(
      'leftLeg',
      { diameter: 0.15, height: 0.5, tessellation: 4 },
      scene
    );
    leftLeg.position.set(-0.12, -0.25, 0);
    leftLeg.parent = stickman;

    // Right leg (thin cylinder)
    const rightLeg = MeshBuilder.CreateCylinder(
      'rightLeg',
      { diameter: 0.15, height: 0.5, tessellation: 4 },
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
   * Create a detailed stickman mesh with better proportions and detail
   */
  private static createDetailedStickman(
    scene: Scene,
    color: Color3
  ): Mesh {
    // Create parent node to hold all parts
    const stickman = new TransformNode('stickman', scene);

    // Body (capsule-like for better shape)
    const body = MeshBuilder.CreateCylinder(
      'body',
      { diameter: 0.35, height: 0.9, tessellation: 8 },
      scene
    );
    body.position.y = 0.5;
    body.parent = stickman;

    // Neck (small connector)
    const neck = MeshBuilder.CreateCylinder(
      'neck',
      { diameter: 0.15, height: 0.12, tessellation: 6 },
      scene
    );
    neck.position.y = 1.0;
    neck.parent = stickman;

    // Head (larger, more proportional)
    const head = MeshBuilder.CreateSphere(
      'head',
      { diameter: 0.45, segments: 8 },
      scene
    );
    head.position.y = 1.2;
    head.parent = stickman;

    // Upper left arm
    const leftUpperArm = MeshBuilder.CreateCylinder(
      'leftUpperArm',
      { diameter: 0.14, height: 0.4, tessellation: 6 },
      scene
    );
    leftUpperArm.rotation.z = Math.PI / 5;
    leftUpperArm.position.set(-0.35, 0.65, 0);
    leftUpperArm.parent = stickman;

    // Lower left arm (forearm)
    const leftForearm = MeshBuilder.CreateCylinder(
      'leftForearm',
      { diameter: 0.12, height: 0.35, tessellation: 6 },
      scene
    );
    leftForearm.rotation.z = Math.PI / 4.5;
    leftForearm.position.set(-0.52, 0.3, 0);
    leftForearm.parent = stickman;

    // Left hand (small sphere)
    const leftHand = MeshBuilder.CreateSphere(
      'leftHand',
      { diameter: 0.15, segments: 6 },
      scene
    );
    leftHand.position.set(-0.64, 0.08, 0);
    leftHand.parent = stickman;

    // Upper right arm
    const rightUpperArm = MeshBuilder.CreateCylinder(
      'rightUpperArm',
      { diameter: 0.14, height: 0.4, tessellation: 6 },
      scene
    );
    rightUpperArm.rotation.z = -Math.PI / 5;
    rightUpperArm.position.set(0.35, 0.65, 0);
    rightUpperArm.parent = stickman;

    // Lower right arm (forearm)
    const rightForearm = MeshBuilder.CreateCylinder(
      'rightForearm',
      { diameter: 0.12, height: 0.35, tessellation: 6 },
      scene
    );
    rightForearm.rotation.z = -Math.PI / 4.5;
    rightForearm.position.set(0.52, 0.3, 0);
    rightForearm.parent = stickman;

    // Right hand (small sphere)
    const rightHand = MeshBuilder.CreateSphere(
      'rightHand',
      { diameter: 0.15, segments: 6 },
      scene
    );
    rightHand.position.set(0.64, 0.08, 0);
    rightHand.parent = stickman;

    // Left thigh
    const leftThigh = MeshBuilder.CreateCylinder(
      'leftThigh',
      { diameter: 0.18, height: 0.45, tessellation: 6 },
      scene
    );
    leftThigh.position.set(-0.14, -0.175, 0);
    leftThigh.parent = stickman;

    // Left shin
    const leftShin = MeshBuilder.CreateCylinder(
      'leftShin',
      { diameter: 0.15, height: 0.4, tessellation: 6 },
      scene
    );
    leftShin.position.set(-0.14, -0.6, 0);
    leftShin.parent = stickman;

    // Left foot (oval)
    const leftFoot = MeshBuilder.CreateSphere(
      'leftFoot',
      { diameter: 0.2, segments: 6 },
      scene
    );
    leftFoot.scaling.set(0.8, 0.6, 1.3); // Flatten and elongate
    leftFoot.position.set(-0.14, -0.85, 0.08);
    leftFoot.parent = stickman;

    // Right thigh
    const rightThigh = MeshBuilder.CreateCylinder(
      'rightThigh',
      { diameter: 0.18, height: 0.45, tessellation: 6 },
      scene
    );
    rightThigh.position.set(0.14, -0.175, 0);
    rightThigh.parent = stickman;

    // Right shin
    const rightShin = MeshBuilder.CreateCylinder(
      'rightShin',
      { diameter: 0.15, height: 0.4, tessellation: 6 },
      scene
    );
    rightShin.position.set(0.14, -0.6, 0);
    rightShin.parent = stickman;

    // Right foot (oval)
    const rightFoot = MeshBuilder.CreateSphere(
      'rightFoot',
      { diameter: 0.2, segments: 6 },
      scene
    );
    rightFoot.scaling.set(0.8, 0.6, 1.3); // Flatten and elongate
    rightFoot.position.set(0.14, -0.85, 0.08);
    rightFoot.parent = stickman;

    // Create improved material with better shading
    const material = new StandardMaterial('stickmanMat', scene);
    material.diffuseColor = color;
    material.emissiveColor = color.scale(0.15);
    material.specularColor = new Color3(0.4, 0.4, 0.4);
    material.specularPower = 32;

    // Create slightly darker material for head (can add face later)
    const headMaterial = new StandardMaterial('headMat', scene);
    headMaterial.diffuseColor = color.scale(0.95);
    headMaterial.emissiveColor = color.scale(0.1);
    headMaterial.specularColor = new Color3(0.3, 0.3, 0.3);
    headMaterial.specularPower = 64;

    // Apply materials
    body.material = material;
    neck.material = material;
    head.material = headMaterial;
    leftUpperArm.material = material;
    leftForearm.material = material;
    leftHand.material = material;
    rightUpperArm.material = material;
    rightForearm.material = material;
    rightHand.material = material;
    leftThigh.material = material;
    leftShin.material = material;
    leftFoot.material = material;
    rightThigh.material = material;
    rightShin.material = material;
    rightFoot.material = material;

    // Merge all meshes into one for performance
    const meshes = [
      body, neck, head,
      leftUpperArm, leftForearm, leftHand,
      rightUpperArm, rightForearm, rightHand,
      leftThigh, leftShin, leftFoot,
      rightThigh, rightShin, rightFoot
    ];

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
