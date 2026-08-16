// Real-time clock hands for the Makkah Clock Tower GLB, ported from the
// standalone prototype (clockHands.js at the repo root). Adds a moving
// hour/minute/second hand set to each of the tower's clock faces and hides the
// GLB's own static hands. Requires the "Makkah_Clock__Frame&Anbrala" node; if
// the model is re-exported without it, attachRealtimeClockHands throws and the
// caller (lib/map/clock-tower.ts) degrades to a static tower.

import * as THREE from "three";

/** Face anchor in the GLB's local space (position + orientation). */
export interface ClockFace {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
}

/** Hand/pin look (colors + PBR-ish params for MeshStandardMaterial). */
export interface ClockHandsLook {
  hour: string;
  minute: string;
  second: string;
  pin: string;
  metal: number;
  rough: number;
}

export interface ClockHandsOptions {
  timeZone?: string;
  handScale?: number;
  intervalMs?: number;
  look?: Partial<ClockHandsLook>;
  faces?: ClockFace[];
  hideOriginalHands?: boolean;
  onTick?: (label: string) => void;
}

export interface ClockHandsController {
  start: () => void;
  stop: () => void;
  update: (date?: Date) => string;
  destroy: () => void;
  setLook: (partial: Partial<ClockHandsLook>) => void;
  faceSets: HandSet[];
  look: ClockHandsLook;
}

interface HandSet {
  group: THREE.Group;
  hour: THREE.Mesh;
  minute: THREE.Mesh;
  second: THREE.Mesh;
  pin: THREE.Mesh;
}

export const DEFAULT_FACES: ClockFace[] = [
  { x: -15.086, y: -1.252, z: 435.807, rx: -1.5708, ry: 0.0, rz: 3.1416 },
  { x: -15.0, y: -54.05, z: 436.5, rx: -1.572, ry: 3.158, rz: 3.142 },
  { x: 21.0, y: -27.45, z: 436.5, rx: 0.589, ry: 1.522, rz: 0.972 },
  { x: -50.0, y: -27.25, z: 436.0, rx: -1.5708, ry: -1.571, rz: 3.132 },
];

export const DEFAULT_LOOK: ClockHandsLook = {
  hour: "#000000",
  minute: "#000000",
  second: "#000000",
  pin: "#c9a227",
  metal: 0.35,
  rough: 0.45,
};

// Byte-identical to the node inside the shipped clock_tower_compress.glb.
// A mismatch here hides the GLB's own hands and then throws, leaving the
// faces empty (pinned by tests/unit/clock-hands.test.ts).
export const FRAME_NAME = "Makkah_Clock__Frame&Anbrala";

const HIDE_NAMES = new Set(["HourHand", "MinuteHand", "SecondHand", "Plane.001"]);

function makeHand(
  length: number,
  baseW: number,
  color: string,
  depth: number,
  look: ClockHandsLook
): THREE.Mesh {
  const s = new THREE.Shape();
  const h = baseW / 2;
  const cw = 4;
  s.moveTo(-h, -cw);
  s.lineTo(h, -cw);
  s.lineTo(h, 0);
  s.lineTo(h, length);
  s.lineTo(-h, length);
  s.lineTo(-h, 0);
  s.closePath();

  const geo = new THREE.ExtrudeGeometry(s, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.18,
    bevelSize: 0.15,
    bevelSegments: 2,
  });
  geo.translate(0, 0, -depth / 2);

  const col = new THREE.Color(color);
  return new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      color: col,
      metalness: look.metal,
      roughness: look.rough,
      emissive: col.clone().multiplyScalar(0.08),
      side: THREE.DoubleSide,
    })
  );
}

function createHandSet(scale: number, look: ClockHandsLook): HandSet {
  const group = new THREE.Group();
  const hour = makeHand(18 * scale, 1.8 * scale, look.hour, 1.1 * scale, look);
  const minute = makeHand(23 * scale, 1.3 * scale, look.minute, 0.9 * scale, look);
  const second = makeHand(24 * scale, 0.6 * scale, look.second, 0.6 * scale, look);

  const pinGeo = new THREE.CylinderGeometry(1.4 * scale, 1.4 * scale, 1.8 * scale, 20);
  pinGeo.rotateX(Math.PI / 2);
  const pinCol = new THREE.Color(look.pin);
  const pin = new THREE.Mesh(
    pinGeo,
    new THREE.MeshStandardMaterial({
      color: pinCol,
      metalness: look.metal,
      roughness: look.rough,
      emissive: pinCol.clone().multiplyScalar(0.08),
    })
  );
  pin.position.z = 0.4 * scale;
  pin.name = "ClockPin";

  group.add(hour, minute, second, pin);
  return { group, hour, minute, second, pin };
}

function getClockParts(date: Date, timeZone?: string) {
  if (!timeZone) {
    return {
      h: date.getHours() % 12,
      m: date.getMinutes(),
      s: date.getSeconds(),
      label: date.toLocaleTimeString(),
    };
  }
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const label =
    new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date) + ` (${timeZone})`;
  return { h: get("hour") % 12, m: get("minute"), s: get("second"), label };
}

function paintMesh(mesh: THREE.Mesh | null, hex: string, look: ClockHandsLook) {
  if (!mesh?.material) return;
  const col = new THREE.Color(hex);
  const material = mesh.material as THREE.MeshStandardMaterial;
  material.color.copy(col);
  material.metalness = look.metal;
  material.roughness = look.rough;
  if (material.emissive) material.emissive.copy(col).multiplyScalar(0.08);
  material.needsUpdate = true;
}

/**
 * Attach ticking hands to the tower's clock faces. Does NOT start the update
 * interval — the caller controls the lifecycle via start()/stop() on the
 * returned controller (the 3D layer starts it when visible and stops it when
 * hidden so an invisible tower never burns repaints), and destroy() frees the
 * added geometry/materials.
 */
export function attachRealtimeClockHands(
  root: THREE.Object3D,
  options: ClockHandsOptions = {}
): ClockHandsController {
  const timeZone = options.timeZone ?? "Asia/Riyadh";
  const handScale = options.handScale ?? 0.72;
  const intervalMs = options.intervalMs ?? 80;
  const faces = options.faces ?? DEFAULT_FACES;
  const look: ClockHandsLook = { ...DEFAULT_LOOK, ...(options.look || {}) };
  const hideOriginal = options.hideOriginalHands !== false;
  const onTick = options.onTick;

  let frameNode: THREE.Object3D | null = null;
  root.traverse((c) => {
    if (c.name === FRAME_NAME) frameNode = c;
    if (hideOriginal) {
      if (HIDE_NAMES.has(c.name) || (c.name && c.name.endsWith(".001"))) {
        c.visible = false;
      }
    }
  });

  if (!frameNode) {
    throw new Error(`[clockHands] Frame node "${FRAME_NAME}" not found`);
  }
  // Annotation needed: the assignment happens inside the traverse callback, so
  // control-flow analysis still sees `frameNode` as its initial null.
  const frame: THREE.Object3D = frameNode;

  const faceSets: HandSet[] = [];
  for (const cfg of faces) {
    const set = createHandSet(handScale, look);
    frame.add(set.group);
    set.group.position.set(cfg.x, cfg.y, cfg.z);
    set.group.rotation.set(cfg.rx, cfg.ry, cfg.rz);
    faceSets.push(set);
  }

  function setLook(partial: Partial<ClockHandsLook>) {
    Object.assign(look, partial);
    for (const set of faceSets) {
      paintMesh(set.hour, look.hour, look);
      paintMesh(set.minute, look.minute, look);
      paintMesh(set.second, look.second, look);
      paintMesh(set.pin, look.pin, look);
    }
  }

  function update(date = new Date()) {
    const { h, m, s, label } = getClockParts(date, timeZone);
    const secA = (s / 60) * Math.PI * 2;
    const minA = ((m + s / 60) / 60) * Math.PI * 2;
    const hourA = ((h + m / 60) / 12) * Math.PI * 2;
    for (const set of faceSets) {
      set.second.rotation.z = -secA;
      set.minute.rotation.z = -minA;
      set.hour.rotation.z = -hourA;
    }
    if (onTick) onTick(label);
    return label;
  }

  let timer: ReturnType<typeof setInterval> | null = null;
  function start() {
    if (timer) return;
    update();
    timer = setInterval(() => update(), intervalMs);
  }
  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }
  function destroy() {
    stop();
    for (const set of faceSets) {
      frame.remove(set.group);
      set.group.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
          else mesh.material.dispose();
        }
      });
    }
    faceSets.length = 0;
  }

  return { start, stop, update, destroy, setLook, faceSets, look };
}
