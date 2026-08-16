import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { attachRealtimeClockHands, DEFAULT_FACES, FRAME_NAME } from "@/lib/map/clock-hands";

// Node name copied verbatim from the shipped clock_tower_compress.glb (read
// from its JSON chunk). It must stay byte-identical to the asset: a mismatch
// hides the GLB's own hands and then throws, so the tower renders with empty
// faces. This literal is intentionally NOT derived from FRAME_NAME — pinning
// it here is what guards against a typo like the Anbrila/Anbrala regression.
const GLB_FRAME_NODE = "Makkah_Clock__Frame&Anbrala";

/** Minimal tower: a root whose frame child is named like the real GLB's. */
function buildTowerRoot(): { root: THREE.Object3D; frame: THREE.Object3D } {
  const root = new THREE.Object3D();
  const frame = new THREE.Object3D();
  frame.name = GLB_FRAME_NODE;
  root.add(frame);
  return { root, frame };
}

describe("attachRealtimeClockHands", () => {
  it("attaches under the exact frame-node name the shipped GLB uses", () => {
    const { root, frame } = buildTowerRoot();
    const clock = attachRealtimeClockHands(root);

    expect(FRAME_NAME).toBe(GLB_FRAME_NODE);
    // One hand set per configured face, all parented to the frame node.
    expect(clock.faceSets).toHaveLength(DEFAULT_FACES.length);
    for (const set of clock.faceSets) {
      expect(set.group.parent).toBe(frame);
    }

    clock.destroy();
  });

  it("hides the GLB's original static hands on attach", () => {
    const { root } = buildTowerRoot();
    const hourHand = new THREE.Object3D();
    hourHand.name = "HourHand";
    root.add(hourHand);

    const clock = attachRealtimeClockHands(root);

    expect(hourHand.visible).toBe(false);

    clock.destroy();
  });

  it("drives hand angles from a fixed UTC time without starting timers", () => {
    const { root } = buildTowerRoot();
    const clock = attachRealtimeClockHands(root, { timeZone: "UTC" });
    const set = clock.faceSets[0];

    // 06:30:15 UTC — hour hand at quarter past the 6, second hand at 90 deg.
    clock.update(new Date(Date.UTC(2026, 0, 1, 6, 30, 15)));

    const twoPi = Math.PI * 2;
    const secA = (15 / 60) * twoPi;
    const minA = ((30 + 15 / 60) / 60) * twoPi;
    const hourA = ((6 + 30 / 60) / 12) * twoPi;
    expect(set.second.rotation.z).toBeCloseTo(-secA, 5);
    expect(set.minute.rotation.z).toBeCloseTo(-minA, 5);
    expect(set.hour.rotation.z).toBeCloseTo(-hourA, 5);

    clock.destroy();
  });

  it("destroy removes the added hand groups", () => {
    const { root, frame } = buildTowerRoot();
    const clock = attachRealtimeClockHands(root);

    clock.destroy();

    expect(frame.children).toHaveLength(0);
    expect(clock.faceSets).toHaveLength(0);
  });
});
