// Custom MapLibre layer that renders a GLB 3D model (Masjid Al-Haram, the
// Makkah clock tower) at a fixed lng/lat, sharing MapLibre's WebGL context
// with three.js.
//
// Mirrors the structure of maplibre-gl's official "Add a 3D model using three.js"
// example, adapted for: (1) maplibre-gl 4.7.1's `render(gl, matrix)` signature
// (the v4 API, not v6's `args.defaultProjectionData.mainMatrix`); (2) our GLBs
// are non-georeferenced — origin is the bbox CENTER, not the base — so we add a
// recenter + base offset that the example's georeferenced model does not need;
// (3) production-grade model lifecycle, mirroring how map services treat
// landmark models:
//
//   - PARSED-INSTANCE CACHE: with a `cacheKey`, the downloaded GLB is parsed
//     and prepared ONCE per page load. Removing the layer (or the whole map)
//     only detaches it; re-adding re-attaches the cached instance instantly —
//     no network, no parse. Bytes additionally live in Cache Storage via
//     lib/map/model-manager.ts, so the NEXT session skips the download too.
//   - TOGGLE = VISIBILITY: `handle.setActive(false)` hides the model (stops
//     its runtime timers, draws nothing) without freeing GPU resources.
//   - ON-DEMAND REPAINTS: render() no longer requests the next frame. Map
//     interactions repaint naturally; animations (the tower's clock hands)
//     request repaints from their tick via the onModelReady repaint hook. A
//     static scene costs zero idle frames.
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
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { fetchModelBytes } from "./model-manager";

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

/** Startable/stopable runtime attached to a model by onModelReady. */
export interface ModelRuntime {
  /** Called when the layer becomes visible (also on cached re-attach). */
  start: () => void;
  /** Called when the layer is hidden or removed while cached. */
  stop: () => void;
  /** Called only when the instance is really discarded (uncached path). */
  dispose: () => void;
}

/** A parsed + prepared model, kept alive for instant re-attachment. */
interface ModelInstance {
  root: THREE.Object3D;
  center: [number, number, number];
  baseCorners: THREE.Vector3[] | null;
  runtime: ModelRuntime | null;
}

// cacheKey -> parsed instance. Module-level so it survives layer/map teardown
// (React StrictMode remounts, page navigation) — only a full page reload clears
// it. Two hero models is a bounded, intentional GPU/RAM budget.
const instanceCache = new Map<string, ModelInstance>();

export interface ModelLayerHandle {
  layer: CustomLayerInterface;
  /** Mutate fields then call map.triggerRepaint() to see the change. */
  transform: ModelTransform;
  /**
   * Show/hide without unloading. Hiding keeps the parsed model + GPU resources
   * for instant re-activation and stops runtime timers (animations) while
   * hidden. This is the production toggle semantic: the 3D button flips
   * visibility; it does not pay a reload cost each way.
   */
  setActive: (active: boolean) => void;
}

export interface CreateModelLayerOptions {
  id: string;
  url: string;
  initial: ModelTransform;
  /**
   * Enable the parsed-instance cache under this key (use the layer id).
   * Without it, the old behavior applies: full dispose on layer removal.
   */
  cacheKey?: string;
  /** Fired before the GLB fetch begins (not fired on cache restore). */
  onLoadStart?: () => void;
  /** Fired with loaded/total bytes (drives the progress bar for large GLBs). */
  onLoadProgress?: (loaded: number, total: number) => void;
  /** Fired when the model is parsed and added to the scene (or restored). */
  onLoadOK?: () => void;
  /** Fired if the GLB fails to load or parse. */
  onLoadError?: (err: unknown) => void;
  /**
   * Per-model prep right after the GLB is first parsed (swap materials,
   * attach runtime animation, etc). Runs ONCE per cacheKey — on cached
   * re-attach it is not called again. `hooks.repaint` requests a map repaint
   * (for animation ticks); return a ModelRuntime so timers start/stop with
   * visibility.
   */
  onModelReady?: (root: THREE.Object3D, hooks: { repaint: () => void }) => ModelRuntime | void;
  /**
   * Light intensities for this layer's own scene. Defaults match the original
   * Masjid tuning; models prepped to flat materials (e.g. the clock tower's
   * Lambert swap) may want brighter ambient.
   */
  lighting?: { ambient: number; directional: number };
}

/** Promise wrapper around GLTFLoader.parse for in-memory GLB bytes. */
function parseGLB(loader: GLTFLoader, bytes: ArrayBuffer): Promise<GLTF> {
  return new Promise((resolve, reject) => {
    loader.parse(
      bytes,
      "",
      (gltf) => resolve(gltf),
      (err) => reject(err)
    );
  });
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

  // Visibility flag behind handle.setActive — render() draws nothing (and
  // requests no repaints) while inactive.
  let active = true;

  // Populated in onAdd; cleared in onRemove.
  let map!: MapLibreMap;
  let renderer: THREE.WebGLRenderer;
  let scene: THREE.Scene;
  let camera: THREE.Camera;
  let modelRoot: THREE.Object3D | null = null;
  // Bounding-box corners (local space) used to lift the model's base onto the
  // ground each frame so it never sinks into the terrain/map.
  let baseCorners: THREE.Vector3[] | null = null;
  let envRenderTarget: THREE.WebGLRenderTarget | null = null;
  // Runtime (clock hands etc) of the attached instance; start/stop with
  // visibility, dispose only on the uncached discard path.
  let currentRuntime: ModelRuntime | null = null;
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
      const { ambient, directional } = opts.lighting ?? { ambient: 0.4, directional: 0.8 };
      scene.add(new THREE.AmbientLight(0xffffff, ambient));
      const directionalLight = new THREE.DirectionalLight(0xffffff, directional);
      // Y is negated below for mercator alignment; mirror the light so shadows
      // read consistently with the model's flipped coordinate space.
      directionalLight.position.set(1, -1, 1).normalize();
      scene.add(directionalLight);

      // A bare Camera is enough: we overwrite projectionMatrix every frame, so
      // the camera's own intrinsic params are never used (matches the official
      // MapLibre three.js example).
      camera = new THREE.Camera();

      // Attach a parsed instance to this layer's scene. Called both for cache
      // restores (instant) and fresh loads.
      const attach = (inst: ModelInstance) => {
        modelRoot = inst.root;
        transform.center = [inst.center[0], inst.center[1], inst.center[2]];
        baseCorners = inst.baseCorners;
        currentRuntime = inst.runtime;
        scene.add(modelRoot);
        if (active) currentRuntime?.start();
        opts.onLoadOK?.();
        // One-shot repaint so the model appears immediately.
        map.triggerRepaint();
      };

      // Cache restore: the GLB was already parsed + prepared this session.
      const cached = opts.cacheKey ? instanceCache.get(opts.cacheKey) : undefined;
      if (cached) {
        attach(cached);
        return;
      }

      // Fresh load: bytes (Cache Storage -> network, deduped with any
      // prefetch in flight) -> parse -> prep -> measure -> cache -> attach.
      opts.onLoadStart?.();
      const loader = new GLTFLoader();
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath("/draco/");
      loader.setDRACOLoader(dracoLoader);

      fetchModelBytes(opts.url, (loaded, total) => opts.onLoadProgress?.(loaded, total))
        .then((bytes) => parseGLB(loader, bytes))
        .then((gltf) => {
          const root = gltf.scene;
          const runtime =
            opts.onModelReady?.(root, { repaint: () => map.triggerRepaint() }) ?? null;

          // Capture the model's local bounding box so render() can lift its
          // lowest point onto the ground (keeps it from sinking into the
          // terrain/map as you zoom or change rotation). Computed AFTER
          // onModelReady so the baked center in model-config.ts stays
          // comparable to the raw GLB's own bbox.
          const box = new THREE.Box3().setFromObject(root);
          let center: [number, number, number] = [...transform.center];
          let corners: THREE.Vector3[] | null = null;
          if (!box.isEmpty()) {
            const c = box.getCenter(new THREE.Vector3());
            center = [c.x, c.y, c.z];
            const { min, max } = box;
            corners = [
              [min.x, min.y, min.z],
              [min.x, min.y, max.z],
              [min.x, max.y, min.z],
              [min.x, max.y, max.z],
              [max.x, min.y, min.z],
              [max.x, min.y, max.z],
              [max.x, max.y, min.z],
              [max.x, max.y, max.z],
            ].map((p) => new THREE.Vector3(p[0], p[1], p[2]));
          }

          const inst: ModelInstance = { root, center, baseCorners: corners, runtime };
          if (opts.cacheKey) instanceCache.set(opts.cacheKey, inst);

          // Layer may have been removed while the (large) download was in
          // flight — keep the parsed instance cached for the next toggle, just
          // don't attach or run its timers.
          if (disposed) {
            inst.runtime?.stop();
            return;
          }
          attach(inst);
        })
        .catch((err) => {
          opts.onLoadError?.(err);
        });
    },

    render(_gl, matrix) {
      if (!renderer || !scene || !camera) return;
      // Hidden (3D toggled off): draw nothing and request no repaints. The
      // toggle is a visibility flip, not a teardown — see handle.setActive.
      if (!active) return;

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
      // altitude. Our GLBs are non-georeferenced (origin = bbox CENTER, not the
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

      // NOTE: no self-requested repaint here (unlike the official example).
      // Repaints are on-demand: camera/style changes come from MapLibre, the
      // clock hands tick requests repaints via the onModelReady repaint hook,
      // and load/toggle fire one-shot repaints. A static scene idles at zero
      // custom frames instead of repainting at 60fps.
    },

    onRemove() {
      disposed = true;
      currentRuntime?.stop();
      const inst = opts.cacheKey ? instanceCache.get(opts.cacheKey) : undefined;
      if (inst) {
        // Cached: detach only. Parsed model + GPU resources stay alive for
        // instant re-activation; freed on full page reload.
        scene.remove(inst.root);
      } else if (modelRoot) {
        // Uncached path (no cacheKey): free the runtime and GPU resources as
        // before.
        currentRuntime?.dispose();
        disposeObject3D(modelRoot);
        scene.remove(modelRoot);
      }
      modelRoot = null;
      envRenderTarget?.dispose();
      envRenderTarget = null;
      renderer.dispose();
      renderer = undefined as unknown as THREE.WebGLRenderer;
      scene = undefined as unknown as THREE.Scene;
      camera = undefined as unknown as THREE.Camera;
    },
  };

  return {
    layer,
    transform,
    setActive: (next: boolean) => {
      if (active === next) return;
      active = next;
      if (next) {
        currentRuntime?.start();
      } else {
        currentRuntime?.stop();
      }
      // One repaint to draw the new state (or clear the model from the frame
      // when hiding). Guarded: setActive may be called before onAdd.
      if (map) map.triggerRepaint();
    },
  };
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
