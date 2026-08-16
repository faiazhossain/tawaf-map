/**
 * Real-time clock hands for Makkah Clock Tower GLB.
 *
 *   import { attachRealtimeClockHands } from './clockHands.js';
 *
 *   const clock = attachRealtimeClockHands(gltf.scene, {
 *     timeZone: 'Asia/Riyadh',
 *     handScale: 0.72,
 *     look: { hour: '#3a3a3a', ambient handled by host },
 *   });
 */

import * as THREE from 'three';

const DEFAULT_FACES = [
  { x: -15.086, y: -1.252,  z: 435.807, rx: -1.5708, ry:  0.0000, rz: 3.1416 },
  { x: -15.000, y: -54.050, z: 436.500, rx: -1.5720, ry:  3.1580, rz: 3.1420 },
  { x:  21.000, y: -27.450, z: 436.500, rx:  0.5890, ry:  1.5220, rz: 0.9720 },
  { x: -50.000, y: -27.250, z: 436.000, rx: -1.5708, ry: -1.5710, rz: 3.1320 },
];

/** Final hand look (colors + material) */
const DEFAULT_LOOK = {
  hour: '#3a3a3a',
  minute: '#3a3a3a',
  second: '#3a3a3a',
  pin: '#c9a227',
  metal: 0.35,
  rough: 0.45,
};

const FRAME_NAME = 'Makkah_Clock__Frame&Anbrala';
const HIDE_NAMES = new Set(['HourHand', 'MinuteHand', 'SecondHand', 'Plane.001']);

function makeHand(length, baseW, color, depth, look) {
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

function createHandSet(scale, look) {
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
  pin.name = 'ClockPin';

  group.add(hour, minute, second, pin);
  return { group, hour, minute, second, pin };
}

function getClockParts(date, timeZone) {
  if (!timeZone) {
    return {
      h: date.getHours() % 12,
      m: date.getMinutes(),
      s: date.getSeconds(),
      label: date.toLocaleTimeString(),
    };
  }
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).formatToParts(date);
  const get = (t) => +parts.find((p) => p.type === t).value;
  const label =
    new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date) + ` (${timeZone})`;
  return { h: get('hour') % 12, m: get('minute'), s: get('second'), label };
}

function paintMesh(mesh, hex, look) {
  if (!mesh?.material) return;
  const col = new THREE.Color(hex);
  mesh.material.color.copy(col);
  mesh.material.metalness = look.metal;
  mesh.material.roughness = look.rough;
  if (mesh.material.emissive) mesh.material.emissive.copy(col).multiplyScalar(0.08);
  mesh.material.needsUpdate = true;
}

/**
 * @param {THREE.Object3D} root - gltf.scene
 * @param {object} [options]
 * @param {string} [options.timeZone='Asia/Riyadh']
 * @param {number} [options.handScale=0.72]
 * @param {number} [options.intervalMs=80]
 * @param {object} [options.look] - override DEFAULT_LOOK
 * @param {Array}  [options.faces]
 * @param {boolean}[options.hideOriginalHands=true]
 * @param {(label:string)=>void} [options.onTick]
 */
export function attachRealtimeClockHands(root, options = {}) {
  const timeZone = options.timeZone ?? 'Asia/Riyadh';
  const handScale = options.handScale ?? 0.72;
  const intervalMs = options.intervalMs ?? 80;
  const faces = options.faces ?? DEFAULT_FACES;
  const look = { ...DEFAULT_LOOK, ...(options.look || {}) };
  const hideOriginal = options.hideOriginalHands !== false;
  const onTick = options.onTick;

  let frameNode = null;
  root.traverse((c) => {
    if (c.name === FRAME_NAME) frameNode = c;
    if (hideOriginal) {
      if (HIDE_NAMES.has(c.name) || (c.name && c.name.endsWith('.001'))) {
        c.visible = false;
      }
    }
  });

  if (!frameNode) {
    throw new Error(`[clockHands] Frame node "${FRAME_NAME}" not found`);
  }

  const faceSets = [];
  for (const cfg of faces) {
    const set = createHandSet(handScale, look);
    frameNode.add(set.group);
    set.group.position.set(cfg.x, cfg.y, cfg.z);
    set.group.rotation.set(cfg.rx, cfg.ry, cfg.rz);
    faceSets.push(set);
  }

  function setLook(partial) {
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

  let timer = null;
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
      frameNode.remove(set.group);
      set.group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
          else o.material.dispose();
        }
      });
    }
    faceSets.length = 0;
  }

  start();
  return { start, stop, update, destroy, setLook, faceSets, look };
}

export { DEFAULT_FACES, DEFAULT_LOOK, FRAME_NAME };
