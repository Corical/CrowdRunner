import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  DirectionalLight,
  Vector3,
  Color3,
  MeshBuilder,
  StandardMaterial,
  Color4,
  DynamicTexture,
  Mesh,
  InstancedMesh,
} from '@babylonjs/core';
import { ISceneManager } from './Interfaces';
import { Config } from './Config';

/**
 * SceneManager - Manages Babylon.js scene, camera, and lighting
 * Single Responsibility: Scene setup and rendering
 * Open/Closed: Can be extended for different scene types
 */
export class SceneManager implements ISceneManager {
  private engine!: Engine;
  private scene!: Scene;
  private camera!: ArcRotateCamera;
  private roadMaterial!: StandardMaterial;
  private scrollOffset: number = 0;

  // Track static meshes/materials for freezing
  private staticMeshes: (Mesh | InstancedMesh)[] = [];
  private staticMaterials: StandardMaterial[] = [];

  /**
   * Initialize the Babylon.js engine and scene
   */
  public async initialize(canvas: HTMLCanvasElement): Promise<void> {
    // Create engine
    this.engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });

    // Create scene
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.56, 0.8, 0.96, 1); // Sky blue

    // Setup camera
    this.createCamera(canvas);

    // Setup lighting
    this.createLighting();

    // Create environment
    this.createEnvironment();

    // Start render loop
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      this.engine.resize();
    });
  }

  /**
   * Create and configure the camera
   */
  private createCamera(canvas: HTMLCanvasElement): void {
    this.camera = new ArcRotateCamera(
      'camera',
      0,
      0,
      10,
      Vector3.Zero(),
      this.scene
    );

    // Position camera for runner game perspective
    this.camera.setPosition(Config.CAMERA_POSITION);
    this.camera.setTarget(Config.CAMERA_TARGET);
    this.camera.fov = Config.CAMERA_FOV;

    // Disable user camera control
    this.camera.attachControl(canvas, false);
    this.camera.inputs.clear();
  }

  /**
   * Create scene lighting
   */
  private createLighting(): void {
    // Ambient fill light
    const hemiLight = new HemisphericLight(
      'hemiLight',
      new Vector3(0, 1, 0),
      this.scene
    );
    hemiLight.intensity = 0.8;
    hemiLight.groundColor = new Color3(0.4, 0.4, 0.5);

    // Directional sun light for shadows and depth
    const sunLight = new DirectionalLight(
      'sunLight',
      new Vector3(-0.5, -1, 0.5),
      this.scene
    );
    sunLight.intensity = 0.6;
    sunLight.diffuse = new Color3(1, 0.95, 0.85);
  }

  /**
   * Create the game environment (road, ground, props)
   */
  private createEnvironment(): void {
    // Create ground plane (grass)
    const ground = MeshBuilder.CreateGround(
      'ground',
      { width: 120, height: 300 },
      this.scene
    );
    ground.position.y = -0.1;
    ground.position.z = 75;

    const groundMat = new StandardMaterial('groundMat', this.scene);
    groundMat.diffuseColor = new Color3(0.35, 0.65, 0.3); // Grass green
    groundMat.specularColor = Color3.Black();
    ground.material = groundMat;

    // Create scrolling road with lane markings texture
    const road = MeshBuilder.CreateGround(
      'road',
      { width: Config.ROAD_WIDTH, height: 300 },
      this.scene
    );
    road.position.y = 0;
    road.position.z = 75;

    this.roadMaterial = new StandardMaterial('roadMat', this.scene);
    this.roadMaterial.specularColor = Color3.Black();

    // Create a procedural road texture with lane dashes
    const roadTex = new DynamicTexture('roadTex', { width: 512, height: 1024 }, this.scene);
    const ctx = roadTex.getContext() as CanvasRenderingContext2D;

    // Road surface
    ctx.fillStyle = '#555555';
    ctx.fillRect(0, 0, 512, 1024);

    // Road edges (white solid lines)
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(8, 0); ctx.lineTo(8, 1024);
    ctx.moveTo(504, 0); ctx.lineTo(504, 1024);
    ctx.stroke();

    // Lane dashes (white dashed center lines)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 4;
    ctx.setLineDash([40, 30]);
    // Left lane divider
    ctx.beginPath();
    ctx.moveTo(170, 0); ctx.lineTo(170, 1024);
    ctx.stroke();
    // Right lane divider
    ctx.beginPath();
    ctx.moveTo(342, 0); ctx.lineTo(342, 1024);
    ctx.stroke();

    roadTex.update();
    this.roadMaterial.diffuseTexture = roadTex;
    // Tile the texture so dashes repeat and can scroll
    roadTex.uScale = 1;
    roadTex.vScale = 8;
    road.material = this.roadMaterial;

    // Animate road scrolling in render loop
    this.scene.registerBeforeRender(() => {
      this.scrollOffset += 0.002 * Config.GAME_SPEED;
      if (roadTex) {
        roadTex.vOffset = this.scrollOffset;
      }
    });

    // Track ground and road as static
    this.staticMeshes.push(ground);
    this.staticMaterials.push(groundMat);

    // Road borders (raised curbs)
    this.createRoadBorders();

    // Environment props along sides
    this.createEnvironmentProps();

    // Freeze everything static — tells Babylon to stop recalculating
    // transforms and shader uniforms for things that never move
    this.freezeStaticScene();
  }

  /**
   * Freeze all static meshes and materials to skip per-frame recalculation.
   * - freezeWorldMatrix() stops transform recomputation (saves CPU)
   * - material.freeze() stops shader uniform recalculation (saves CPU+GPU)
   */
  private freezeStaticScene(): void {
    for (const mesh of this.staticMeshes) {
      mesh.freezeWorldMatrix();
      mesh.isPickable = false; // Not needed for gameplay — skip ray intersection tests
    }
    for (const mat of this.staticMaterials) {
      mat.freeze();
    }
  }

  /**
   * Create raised curb borders along the road edges
   */
  private createRoadBorders(): void {
    const curbMat = new StandardMaterial('curbMat', this.scene);
    curbMat.diffuseColor = new Color3(0.6, 0.6, 0.6);
    curbMat.specularColor = Color3.Black();
    this.staticMaterials.push(curbMat);

    const halfRoad = Config.ROAD_WIDTH / 2;
    const curbWidth = 0.4;

    for (const side of [-1, 1]) {
      const curb = MeshBuilder.CreateBox(
        `curb_${side}`,
        { width: curbWidth, height: 0.3, depth: 300 },
        this.scene
      );
      curb.position = new Vector3(side * (halfRoad + curbWidth / 2), 0.05, 75);
      curb.material = curbMat;
      this.staticMeshes.push(curb);
    }
  }

  /**
   * Create trees, rocks, and barriers along the road sides.
   * All props are static — frozen after placement.
   */
  private createEnvironmentProps(): void {
    const halfRoad = Config.ROAD_WIDTH / 2 + 2;

    // Static materials — created once, frozen later
    const trunkMat = new StandardMaterial('trunkMat', this.scene);
    trunkMat.diffuseColor = new Color3(0.45, 0.28, 0.15);
    trunkMat.specularColor = Color3.Black();
    this.staticMaterials.push(trunkMat);

    const leafMat = new StandardMaterial('leafMat', this.scene);
    leafMat.diffuseColor = new Color3(0.2, 0.55, 0.15);
    leafMat.specularColor = Color3.Black();
    this.staticMaterials.push(leafMat);

    const rockMat = new StandardMaterial('rockMat', this.scene);
    rockMat.diffuseColor = new Color3(0.5, 0.48, 0.45);
    rockMat.specularColor = Color3.Black();
    this.staticMaterials.push(rockMat);

    // Templates for instancing
    const trunkTemplate = MeshBuilder.CreateCylinder(
      'trunkTemplate',
      { diameter: 0.6, height: 2, tessellation: 6 },
      this.scene
    );
    trunkTemplate.material = trunkMat;
    trunkTemplate.setEnabled(false);

    const canopyTemplate = MeshBuilder.CreateCylinder(
      'canopyTemplate',
      { diameterTop: 0, diameterBottom: 2.5, height: 3, tessellation: 6 },
      this.scene
    );
    canopyTemplate.material = leafMat;
    canopyTemplate.setEnabled(false);

    const rockTemplate = MeshBuilder.CreateSphere(
      'rockTemplate',
      { diameter: 1, segments: 4 },
      this.scene
    );
    rockTemplate.material = rockMat;
    rockTemplate.setEnabled(false);

    // Place trees and rocks along both sides
    for (let z = -10; z < 150; z += 8) {
      for (const side of [-1, 1]) {
        const xBase = side * (halfRoad + 4 + Math.random() * 6);
        const zJitter = z + (Math.random() - 0.5) * 4;

        if (Math.random() < 0.7) {
          // Tree
          const trunk = trunkTemplate.createInstance(`trunk_${z}_${side}`);
          trunk.position = new Vector3(xBase, 1, zJitter);
          this.staticMeshes.push(trunk);

          const canopy = canopyTemplate.createInstance(`canopy_${z}_${side}`);
          canopy.position = new Vector3(xBase, 3.2, zJitter);
          const scale = 0.8 + Math.random() * 0.5;
          canopy.scaling.set(scale, scale, scale);
          this.staticMeshes.push(canopy);
        } else {
          // Rock cluster
          const rockCount = 1 + Math.floor(Math.random() * 3);
          for (let r = 0; r < rockCount; r++) {
            const rock = rockTemplate.createInstance(`rock_${z}_${side}_${r}`);
            const rockScale = 0.4 + Math.random() * 0.8;
            rock.scaling.set(rockScale, rockScale * 0.6, rockScale);
            rock.position = new Vector3(
              xBase + (Math.random() - 0.5) * 2,
              rockScale * 0.25,
              zJitter + (Math.random() - 0.5) * 2
            );
            this.staticMeshes.push(rock);
          }
        }
      }
    }
  }

  /**
   * Get the scene instance
   */
  public getScene(): Scene {
    return this.scene;
  }

  /**
   * Render a single frame
   */
  public render(): void {
    this.scene.render();
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    this.scene.dispose();
    this.engine.dispose();
  }
}
