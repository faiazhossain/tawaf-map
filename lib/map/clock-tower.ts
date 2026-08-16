// Per-model prep for the Abraj Al-Bait clock tower GLB, ported from the
// standalone prototype's prepareModel() + attachRealtimeClockHands() wiring
// (index.html at the repo root). Passed to createModelLayer as onModelReady,
// so it runs once after the GLB is first parsed; the returned ModelRuntime
// starts/stops the clock with layer visibility (the tower keeps its parsed
// instance + hands across toggles — see three-model-layer.ts).
//
// Kept in its own module (and dynamic-imported from MapView) so three.js stays
// out of the main bundle — same rule as three-model-layer.ts.

import * as THREE from "three";
import { attachRealtimeClockHands } from "./clock-hands";
import type { ClockHandsController } from "./clock-hands";
import type { ModelRuntime } from "./three-model-layer";

/**
 * Swap every mesh to flat Lambert materials (the tuned prototype look — the
 * Draco export's own materials render too dark/variable) and recompute
 * vertex normals, which the compression pass left inconsistent.
 */
function applyFlatMaterials(root: THREE.Object3D): void {
  root.traverse((c) => {
    const mesh = c as THREE.Mesh;
    if (!(mesh as THREE.Mesh).isMesh || !mesh.geometry) return;
    mesh.geometry.computeVertexNormals();
    const olds = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const hasVC = !!mesh.geometry?.attributes?.color;
    const news = olds.map((m) => {
      const src = m as THREE.MeshStandardMaterial | undefined;
      return new THREE.MeshLambertMaterial({
        color: src?.color?.clone?.() ?? 0xffffff,
        vertexColors: hasVC,
        side: THREE.DoubleSide,
        map: src?.map || null,
        transparent: !!src?.transparent,
        opacity: src?.opacity ?? 1,
        // Keep the tower from z-fighting where it meets the basemap.
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });
    });
    // Free the replaced materials' GPU programs (textures stay — map is shared).
    olds.forEach((m) => m?.dispose?.());
    mesh.material = news.length === 1 ? news[0] : news;
  });
}

/**
 * Prep the freshly parsed clock tower: prototype material treatment + live
 * clock hands (Asia/Riyadh). The returned runtime starts/stops the hands with
 * layer visibility; each hand tick requests a map repaint via `hooks.repaint`
 * (the render loop is on-demand, so the tick IS what animates the clock).
 * Falls back to a static tower if the hands frame node is missing from a
 * re-exported GLB — placement tuning must not break just because the clock
 * node was renamed.
 */
export function prepareClockTower(
  root: THREE.Object3D,
  hooks: { repaint: () => void }
): ModelRuntime {
  if (!root.userData.clockTowerPrepared) {
    applyFlatMaterials(root);
    root.userData.clockTowerPrepared = true;
  }

  // The hands controller is stashed on the root so a cached re-attach (which
  // does NOT re-run this prep) could reuse it if ever needed.
  let clock = root.userData.clockHands as ClockHandsController | undefined;
  if (!clock) {
    try {
      clock = attachRealtimeClockHands(root, {
        onTick: () => hooks.repaint(),
      });
      root.userData.clockHands = clock;
    } catch (err) {
      console.warn("Clock tower rendered without live hands:", err);
    }
  }

  return {
    start: () => clock?.start(),
    stop: () => clock?.stop(),
    dispose: () => {
      clock?.destroy();
      root.userData.clockHands = undefined;
    },
  };
}
