import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  Vector3,
  Color3,
  MeshBuilder,
  StandardMaterial,
  Color4,
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
    // Main light from above
    const light = new HemisphericLight(
      'light',
      new Vector3(0, 1, 0),
      this.scene
    );
    light.intensity = 1.2;
    light.groundColor = new Color3(0.5, 0.5, 0.5);
  }

  /**
   * Create the game environment (road, ground, etc.)
   */
  private createEnvironment(): void {
    // Create ground plane
    const ground = MeshBuilder.CreateGround(
      'ground',
      { width: 100, height: 200 },
      this.scene
    );
    ground.position.y = -0.1;
    ground.position.z = 50;

    const groundMat = new StandardMaterial('groundMat', this.scene);
    groundMat.diffuseColor = Color3.FromHexString(Config.COLORS.GROUND);
    ground.material = groundMat;

    // Create road
    const road = MeshBuilder.CreateGround(
      'road',
      { width: Config.ROAD_WIDTH, height: 200 },
      this.scene
    );
    road.position.y = 0;
    road.position.z = 50;

    const roadMat = new StandardMaterial('roadMat', this.scene);
    roadMat.diffuseColor = Color3.FromHexString(Config.COLORS.ROAD);
    road.material = roadMat;

    // Create lane markers (simple visual guides)
    this.createLaneMarkers();
  }

  /**
   * Create visual lane markers on the road
   */
  private createLaneMarkers(): void {
    const markerMaterial = new StandardMaterial('markerMat', this.scene);
    markerMaterial.diffuseColor = new Color3(0.3, 0.3, 0.3);

    // Left lane marker
    const leftMarker = MeshBuilder.CreateBox(
      'leftMarker',
      { width: 0.2, height: 0.1, depth: 200 },
      this.scene
    );
    leftMarker.position = new Vector3(
      (Config.LANES.LEFT + Config.LANES.CENTER) / 2,
      0.1,
      50
    );
    leftMarker.material = markerMaterial;

    // Right lane marker
    const rightMarker = MeshBuilder.CreateBox(
      'rightMarker',
      { width: 0.2, height: 0.1, depth: 200 },
      this.scene
    );
    rightMarker.position = new Vector3(
      (Config.LANES.RIGHT + Config.LANES.CENTER) / 2,
      0.1,
      50
    );
    rightMarker.material = markerMaterial;
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
