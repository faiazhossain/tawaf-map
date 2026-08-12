// Custom MapLibre layer that renders a GLB 3D model (e.g. Masjid Al-Haram) at a
// fixed lng/lat, sharing MapLibre's WebGL context with three.js.
//
// Mirrors the structure of maplibre-gl's official "Add a 3D model using three.js"
// example, adapted for two things: (1) we're on maplibre-gl 4.7.1, whose
// `render(gl, matrix)` signature passes the projection matrix directly (the v4
// API, not v6's `args.defaultProjectionData.mainMatrix`); (2) our GLB is
// non-georeferenced — its origin is the bbox CENTER, not the base — so we add a
// recenter + base offset that the example's georeferenced model does not need.
//
// The transform (origin, rotation, scale, offsets) lives in a MUTABLE object
// returned alongside the layer. Mutate its fields and call map.triggerRepaint()
// to update the model live — no re-download. This powers the dev tuning widget.
//
// This module is dynamically imported from inside a client useEffect (see
// components/map/MapView.tsx) so three.js stays out of the SSR bundle and only
// loads when the user toggles the 3D model on.

import { MercatorCoordinate } from "maplibre-gl";
import type { Map as MapLibreMap, CustomLayerInterface } from "maplibre-gl";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/** Live-tunable transform. Mutate fields, then call map.triggerRepaint(). */
export interface ModelTransform {
  originLng: number;
  originLat: number;
  altitudeMeters: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  scaleMultiplier: number;
  offsetEastMeters: number;
  offsetNorthMeters: number;
  /** Fixed model-space recenter point (bbox center). Not tuned live. */
  center: [number, number, number];
}

export interface ModelLayerHandle {
  layer: CustomLayerInterface;
  /** Mutate fields then call map.triggerRepaint() to see the change. */
  transform: ModelTransform;
}

export interface CreateModelLayerOptions {
  id: string;
  url: string;
  initial: ModelTransform;
  /** Fired before the GLB fetch begins. */
  onLoadStart?: () => void;
  /** Fired with loaded/total bytes (drives the progress bar for large GLBs). */
  onLoadProgress?: (loaded: number, total: number) => void;
  /** Fired when the model is parsed and added to the scene. */
  onLoadOK?: () => void;
  /** Fired if the GLB fails to load or parse. */
  onLoadError?: (err: unknown) => void;
}

/**
 * Build a CustomLayerInterface that renders a GLB model georeferenced to the
 * map. Returns a fresh layer + mutable transform each call (own
 * scene/renderer/dispose state) so toggle on/off/on cycles never leak WebGL
 * resources.
 */
export function createModelLayer(opts: CreateModelLayerOptions): ModelLayerHandle {
  // The mutable transform object — render() reads from this every frame.
  const transform: ModelTransform = { ...opts.initial };

  // Populated in onAdd; cleared in onRemove.
  let map!: MapLibreMap;
  let renderer: THREE.WebGLRenderer;
  let scene: THREE.Scene;
  let camera: THREE.Camera;
  let modelRoot: THREE.Group | null = null;
  // Bounding-box corners (local space) used to lift the model's base onto the
  // ground each frame so it never sinks into the terrain/map.
  let baseCorners: THREE.Vector3[] | null = null;
  let envRenderTarget: THREE.WebGLRenderTarget | null = null;
  // Guards a GLB that finishes downloading after the layer was removed.
  let disposed = false;

  const layer: CustomLayerInterface = {
    id: opts.id,
    type: "custom",
    renderingMode: "3d",

    onAdd(mapInstance, gl) {
      map = mapInstance;

      // Adopt MapLibre's existing canvas + WebGL2 context. Do NOT create a new
      // context (that would fight MapLibre for the drawing buffer).
      renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl as WebGL2RenderingContext,
        antialias: true,
      });
      // CRITICAL: if three clears the framebuffer it wipes the map MapLibre
      // just drew, leaving a black canvas with a floating model.
      renderer.autoClear = false;

      scene = new THREE.Scene();

      // PBR (MeshStandardMaterial) glTF assets need image-based lighting to
      // render at correct brightness — without an environment map, metallic /
      // rough surfaces come out near-black. Generate a neutral studio
      // environment from RoomEnvironment and use it as the scene's ambient.
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      envRenderTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
      scene.environment = envRenderTarget.texture;
      pmremGenerator.dispose();

      // A directional light adds a sun-like highlight on top of the env map.
      scene.add(new THREE.AmbientLight(0xffffff, 0.4));
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      // Y is negated below for mercator alignment; mirror the light so shadows
      // read consistently with the model's flipped coordinate space.
      directionalLight.position.set(1, -1, 1).normalize();
      scene.add(directionalLight);

      // A bare Camera is enough: we overwrite projectionMatrix every frame, so
      // the camera's own intrinsic params are never used (matches the official
      // MapLibre three.js example).
      camera = new THREE.Camera();

      opts.onLoadStart?.();
      const loader = new GLTFLoader();
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath("/draco/");
      loader.setDRACOLoader(dracoLoader);
      loader.load(
        opts.url,
        (gltf) => {
          // Layer may have been removed while the (large) download was in flight.
          if (disposed) {
            disposeObject3D(gltf.scene);
            return;
          }
          modelRoot = gltf.scene;
          scene.add(modelRoot);
          // Capture the model's local bounding box so render() can lift its
          // lowest point onto the ground (keeps it from sinking into the
          // terrain/map as you zoom or change rotation).
          const box = new THREE.Box3().setFromObject(modelRoot);
          if (!box.isEmpty()) {
            const { min, max } = box;
            const center = box.getCenter(new THREE.Vector3());
            transform.center = [center.x, center.y, center.z];
            baseCorners = [
              [min.x, min.y, min.z],
              [min.x, min.y, max.z],
              [min.x, max.y, min.z],
              [min.x, max.y, max.z],
              [max.x, min.y, min.z],
              [max.x, min.y, max.z],
              [max.x, max.y, min.z],
              [max.x, max.y, max.z],
            ].map((c) => new THREE.Vector3(c[0], c[1], c[2]));
          }
          opts.onLoadOK?.();
          // One-shot repaint so the model appears immediately on load; render()
          // also calls triggerRepaint() each frame to keep the layer in sync.
          map.triggerRepaint();
        },
        (event) => {
          if (event.lengthComputable) {
            opts.onLoadProgress?.(event.loaded, event.total);
          }
        },
        (err) => {
          opts.onLoadError?.(err);
        }
      );
    },

    render(_gl, matrix) {
      if (!renderer || !scene || !camera) return;

      // Read the (possibly mutated) transform every frame for live tuning.
      const t = transform;
      const meterInMercator = MercatorCoordinate.fromLngLat(
        [t.originLng, t.originLat],
        0
      ).meterInMercatorCoordinateUnits();
      const scale = meterInMercator * t.scaleMultiplier;
      const originXY = MercatorCoordinate.fromLngLat([t.originLng, t.originLat], 0);
      // Final horizontal placement in Web Mercator space, including any manual
      // east/north nudge (north is -Y in Web Mercator, hence the sign flip).
      const translateX = originXY.x + t.offsetEastMeters * meterInMercator;
      const translateY = originXY.y - t.offsetNorthMeters * meterInMercator;

      // Rotate around the model's own bbox center instead of around the scene
      // origin. The pivot is derived from the loaded geometry so the model spins
      // around its actual center point.
      const recenter = new THREE.Matrix4().makeTranslation(
        -t.center[0],
        -t.center[1],
        -t.center[2]
      );
      const rotationX = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), t.rotateX);
      const rotationY = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), t.rotateY);
      const rotationZ = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), t.rotateZ);
      const modelSpace = new THREE.Matrix4()
        .scale(new THREE.Vector3(scale, -scale, scale))
        .multiply(rotationX)
        .multiply(rotationY)
        .multiply(rotationZ)
        .multiply(recenter);

      // Base offset: place the model's lowest bbox point ON the chosen ground
      // altitude. Our GLB is non-georeferenced (origin = bbox CENTER, not the
      // base), so unlike the official example — whose georeferenced model sits
      // base-down at z=0 — we lift the lowest point to `altitudeMeters` each
      // frame so it stays grounded as scale/rotation change during tuning.
      const groundZ = MercatorCoordinate.fromLngLat([t.originLng, t.originLat], t.altitudeMeters).z;
      let lowestRelZ = 0;
      if (baseCorners) {
        let min = Infinity;
        for (const corner of baseCorners) {
          const z = corner.clone().applyMatrix4(modelSpace).z;
          if (z < min) min = z;
        }
        lowestRelZ = min;
      }
      const translateZ = groundZ - lowestRelZ;

      // Model matrix: translate(placement) . R.
      const modelMatrix = new THREE.Matrix4()
        .makeTranslation(translateX, translateY, translateZ)
        .multiply(modelSpace);

      // Combine the map's projection matrix with the model matrix.
      const projection = new THREE.Matrix4().fromArray(matrix).multiply(modelMatrix);
      camera.projectionMatrix = projection;

      // maplibre leaves arbitrary GL state from its own draw; tell three its
      // cached state is stale before rendering. Required for a clean composite.
      renderer.resetState();
      renderer.render(scene, camera);

      // Keep the custom layer in sync each frame, matching the official
      // maplibre-gl three.js example. This requests the next repaint so the
      // model re-renders even when the map is otherwise idle; the trade-off is
      // continuous repainting while the 3D layer is on.
      map.triggerRepaint();
    },

    onRemove() {
      disposed = true;
      if (modelRoot) {
        disposeObject3D(modelRoot);
        scene.remove(modelRoot);
        modelRoot = null;
      }
      envRenderTarget?.dispose();
      envRenderTarget = null;
      renderer.dispose();
      renderer = undefined as unknown as THREE.WebGLRenderer;
      scene = undefined as unknown as THREE.Scene;
      camera = undefined as unknown as THREE.Camera;
    },
  };

  return { layer, transform };
}

/** Walk a subtree and free GPU-backed geometry / materials / textures. */
function disposeObject3D(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const material = (mesh as THREE.Mesh).material;
    if (Array.isArray(material)) {
      material.forEach((mat) => disposeMaterial(mat));
    } else if (material) {
      disposeMaterial(material);
    }
  });
}

/** Dispose a material and any textures it references. */
function disposeMaterial(material: THREE.Material): void {
  const record = material as unknown as Record<string, unknown>;
  for (const key in record) {
    const value = record[key];
    const texture = value as THREE.Texture | undefined;
    if (texture && typeof texture === "object" && "isTexture" in texture) {
      texture.dispose();
    }
  }
  material.dispose();
}
