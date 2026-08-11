// Custom MapLibre layer that renders a GLB 3D model (e.g. Masjid Al-Haram) at a
// fixed lng/lat, sharing MapLibre's WebGL context with three.js.
//
// Implements maplibre-gl 4.7.1's CustomLayerInterface. The `render(gl, matrix)`
// signature receives the projection matrix as a mat4 directly (the v4 API), NOT
// the v6 `args.defaultProjectionData.mainMatrix` form.
//
// This module is dynamically imported from inside a client useEffect (see
// components/map/MapView.tsx) so three.js stays out of the SSR bundle and only
// loads when the user toggles the 3D model on.

import { MercatorCoordinate } from "maplibre-gl";
import type { Map as MapLibreMap, CustomLayerInterface } from "maplibre-gl";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export interface ModelLayerOptions {
  id: string;
  url: string;
  /** Origin [lng, lat] where the model's local origin is placed. */
  origin: [number, number];
  /** Altitude in meters at the origin (lifts the model off the ground). */
  altitudeMeters?: number;
  /** Radians; Math.PI / 2 tilts a standard Y-up export upright. */
  rotateX?: number;
  rotateY?: number;
  /** Radians; heading alignment with true north. */
  rotateZ?: number;
  /** Pure visual scale factor; 1 assumes the model is authored in meters. */
  scaleMultiplier?: number;
  /**
   * Model-space point to recenter on (e.g. the bbox center). The model is
   * shifted so this point lands at `origin`, which matters when the model's
   * local origin is not its geometric center. Omit to place the local origin.
   */
  center?: [number, number, number];
  /** Nudge the placed model east (+) / west (-) in meters. */
  offsetEastMeters?: number;
  /** Nudge the placed model north (+) / south (-) in meters. */
  offsetNorthMeters?: number;
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
 * map. Returns a fresh layer each call (own scene/renderer/dispose state) so
 * toggle on/off/on cycles never leak WebGL resources.
 */
export function createModelLayer(opts: ModelLayerOptions): CustomLayerInterface {
  const {
    id,
    url,
    origin,
    altitudeMeters = 0,
    rotateX = Math.PI / 2,
    rotateY = 0,
    rotateZ = 0,
    scaleMultiplier = 1,
    center,
    offsetEastMeters = 0,
    offsetNorthMeters = 0,
    onLoadStart,
    onLoadProgress,
    onLoadOK,
    onLoadError,
  } = opts;

  // Georeference: convert the origin to Web Mercator and derive the per-meter
  // scale at this latitude. Computed once since origin/altitude are fixed.
  const mercatorOrigin = MercatorCoordinate.fromLngLat([origin[0], origin[1]], altitudeMeters);
  const meterInMercator = mercatorOrigin.meterInMercatorCoordinateUnits();
  const scale = meterInMercator * scaleMultiplier;
  // Final placement in Web Mercator space, including any manual east/north
  // nudge (north is -Y in Web Mercator, hence the sign flip).
  const translateX = mercatorOrigin.x + offsetEastMeters * meterInMercator;
  const translateY = mercatorOrigin.y - offsetNorthMeters * meterInMercator;
  const translateZ = mercatorOrigin.z;
  // Recenter the model so `center` (e.g. its bbox center) lands at the origin,
  // applied in local model space before rotation so heading spins around the
  // center rather than an off-center local origin.
  const recenter = center
    ? new THREE.Matrix4().makeTranslation(-center[0], -center[1], -center[2])
    : null;

  // Populated in onAdd; cleared in onRemove.
  let map: MapLibreMap;
  let renderer: THREE.WebGLRenderer;
  let scene: THREE.Scene;
  let camera: THREE.Camera;
  let modelRoot: THREE.Group | null = null;
  let envRenderTarget: THREE.WebGLRenderTarget | null = null;
  // Guards a GLB that finishes downloading after the layer was removed.
  let disposed = false;

  const layer: CustomLayerInterface = {
    id,
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

      onLoadStart?.();
      const loader = new GLTFLoader();
      loader.load(
        url,
        (gltf) => {
          // Layer may have been removed while the (large) download was in flight.
          if (disposed) {
            disposeObject3D(gltf.scene);
            return;
          }
          modelRoot = gltf.scene;
          scene.add(modelRoot);
          onLoadOK?.();
          // One-shot repaint so the model appears without waiting for the next
          // map-triggered repaint. Do NOT call triggerRepaint inside render().
          map.triggerRepaint();
        },
        (event) => {
          if (event.lengthComputable) {
            onLoadProgress?.(event.loaded, event.total);
          }
        },
        (err) => {
          onLoadError?.(err);
        }
      );
    },

    render(_gl, matrix) {
      if (!renderer || !scene || !camera) return;

      // Rotation matrices for each axis.
      const rotationX = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), rotateX);
      const rotationY = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), rotateY);
      const rotationZ = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), rotateZ);

      // Model matrix: translate(origin) . scale(s, -s, s) . rotX . rotY . rotZ
      // [ . recenter ]. The Y scale is negated to reconcile three.js (Y-up)
      // with Web Mercator (Y increases downward) — the standard MapLibre
      // convention. `recenter` (if set) shifts the model in local space so its
      // bbox center lands at the origin.
      const modelMatrix = new THREE.Matrix4()
        .makeTranslation(translateX, translateY, translateZ)
        .scale(new THREE.Vector3(scale, -scale, scale))
        .multiply(rotationX)
        .multiply(rotationY)
        .multiply(rotationZ);
      if (recenter) {
        modelMatrix.multiply(recenter);
      }

      // Combine the map's projection matrix with the model matrix.
      const projection = new THREE.Matrix4().fromArray(matrix).multiply(modelMatrix);
      camera.projectionMatrix = projection;

      // maplibre leaves arbitrary GL state from its own draw; tell three its
      // cached state is stale before rendering. Required for a clean composite.
      renderer.resetState();
      renderer.render(scene, camera);
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

  return layer;
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
