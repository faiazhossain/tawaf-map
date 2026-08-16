import { describe, it, expect, vi } from "vitest";
import * as THREE from "three";
import { prepareClockTower } from "@/lib/map/clock-tower";

// The GLB's clock-hands frame node is absent from a bare Object3D, so these
// tests cover the graceful-degradation + lifecycle contract without any model.
describe("prepareClockTower", () => {
  it("returns a start/stop/dispose runtime even without a hands frame node", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const root = new THREE.Object3D();
    const repaint = vi.fn();

    const runtime = prepareClockTower(root, { repaint });

    expect(typeof runtime.start).toBe("function");
    expect(typeof runtime.stop).toBe("function");
    expect(typeof runtime.dispose).toBe("function");
    expect(warn).toHaveBeenCalledOnce();
    expect(repaint).not.toHaveBeenCalled();

    runtime.start();
    runtime.stop();
    runtime.dispose();
  });

  it("marks the model prepared so a second prep skips the material pass", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const root = new THREE.Object3D();
    const runtimeA = prepareClockTower(root, { repaint: () => {} });
    const runtimeB = prepareClockTower(root, { repaint: () => {} });

    expect(root.userData.clockTowerPrepared).toBe(true);
    runtimeA.dispose();
    runtimeB.dispose();
  });
});
