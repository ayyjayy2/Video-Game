import * as THREE from 'three';

// Colours sampled from the character sheets.
export const CAT_STYLE = {
  capp: { name: 'Cappuccino', base: 0xf7ece2, chest: 0xfdf8f2, p1: 0xd88344, p2: 0x523c39, ear: 0xe1a08a, eye: 0x8db04a, fluff: 1.14, scale: 1.06 },
  asher: { name: 'Asher', base: 0xf4e7e3, chest: 0xfffaf8, p1: 0x817279, p2: 0xb7a5a7, ear: 0xd5857e, eye: 0x93c047, fluff: 1.0, scale: 0.96 },
};

const lam = (c) => new THREE.MeshLambertMaterial({ color: c });

function sph(r, mat, x, y, z, sx = 1, sy = 1, sz = 1, seg = 14) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(8, seg - 4)), mat);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = true;
  return m;
}

export function buildCat(kind) {
  const s = CAT_STYLE[kind];
  const M = { base: lam(s.base), chest: lam(s.chest), p1: lam(s.p1), p2: lam(s.p2), ear: lam(s.ear), eye: lam(s.eye), black: lam(0x1d1a1a), nose: lam(0xe58f8f), white: lam(0xffffff) };
  const root = new THREE.Group();
  const rig = new THREE.Group();
  rig.scale.setScalar(s.scale);
  root.add(rig);
  const f = s.fluff;

  // Body
  const body = new THREE.Group();
  body.position.set(0, 0.62, 0);
  rig.add(body);
  body.add(sph(0.5, M.base, 0, 0, 0, 0.44 * f, 0.38 * f, 0.66));
  body.add(sph(0.3, M.chest, 0, -0.06, 0.26, 0.85 * f, 0.9, 0.75));

  // Patches
  if (kind === 'capp') {
    body.add(sph(0.26, M.p1, 0.12, 0.13, -0.12, 1, 0.75, 1.3));
    body.add(sph(0.22, M.p2, -0.14, 0.15, 0.06, 1, 0.7, 1.2));
    body.add(sph(0.2, M.p2, 0.08, 0.12, -0.36, 1.1, 0.7, 0.9));
    body.add(sph(0.16, M.p1, -0.17, 0.02, -0.3, 0.8, 0.9, 1));
  } else {
    body.add(sph(0.22, M.p1, 0.06, 0.15, -0.1, 1.1, 0.65, 1.3));
    body.add(sph(0.16, M.p2, -0.13, 0.12, 0.12, 0.9, 0.7, 1));
    body.add(sph(0.14, M.p1, -0.1, 0.13, -0.33, 1, 0.7, 1));
  }

  // Head
  const head = new THREE.Group();
  head.position.set(0, 0.38, 0.3);
  body.add(head);
  head.add(sph(0.3, M.base, 0, 0, 0, 1.0 * f, 0.9, 0.92));
  head.add(sph(0.14, M.chest, 0, -0.08, 0.2, 1.2, 0.75, 0.8));
  head.add(sph(0.035, M.nose, 0, -0.02, 0.32, 1.2, 0.8, 0.8, 8));
  if (kind === 'capp') {
    head.add(sph(0.2, M.p1, -0.13, 0.05, 0.02, 1, 1, 1));
    head.add(sph(0.18, M.p2, 0.12, 0.1, -0.02, 1, 0.9, 1));
  } else {
    head.add(sph(0.29, M.p1, 0, 0.09, -0.02, 1.02 * f, 0.62, 0.92));
  }
  // Eyes (green), with a white blaze between them on both cats.
  head.add(sph(0.06, M.chest, 0, 0.06, 0.27, 0.6, 1.4, 0.5, 8));
  for (const sx of [-1, 1]) {
    head.add(sph(0.068, M.eye, sx * 0.12, 0.04, 0.24, 1, 1.1, 0.6, 10));
    head.add(sph(0.032, M.black, sx * 0.12, 0.04, 0.275, 0.55, 1.1, 0.5, 8));
    head.add(sph(0.014, M.white, sx * 0.105, 0.07, 0.29, 1, 1, 1, 6));
  }
  // Ears
  const earMat = kind === 'asher' ? M.p1 : null;
  [-1, 1].forEach((sx) => {
    const outer = kind === 'capp' ? (sx < 0 ? M.p1 : M.p2) : earMat;
    const e = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.26, 4), outer);
    e.position.set(sx * 0.16, 0.26, -0.02);
    e.rotation.set(-0.1, Math.PI / 4, sx * -0.28);
    e.castShadow = true;
    head.add(e);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.17, 4), M.ear);
    inner.position.set(sx * 0.16, 0.24, 0.03);
    inner.rotation.set(-0.1, Math.PI / 4, sx * -0.28);
    head.add(inner);
  });
  // Whiskers
  const wm = new THREE.LineBasicMaterial({ color: 0xffffff });
  const pts = [];
  for (const sx of [-1, 1]) {
    for (const dy of [-0.02, 0.02]) {
      pts.push(new THREE.Vector3(sx * 0.1, -0.06, 0.28), new THREE.Vector3(sx * 0.36, -0.06 + dy * 3, 0.24));
    }
  }
  head.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), wm));

  // Legs
  const legs = [];
  const legGeo = new THREE.CylinderGeometry(0.075, 0.065, 0.46, 8);
  [[-0.17, 0.27], [0.17, 0.27], [-0.17, -0.27], [0.17, -0.27]].forEach(([x, z], i) => {
    const hip = new THREE.Group();
    hip.position.set(x, -0.05, z);
    body.add(hip);
    let legMat = M.base;
    if (kind === 'capp' && i === 3) legMat = M.p1;
    if (kind === 'asher' && i === 2) legMat = M.p2;
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.y = -0.25;
    leg.castShadow = true;
    hip.add(leg);
    hip.add(sph(0.08, M.chest, 0, -0.5, 0.03, 1, 0.7, 1.3, 8));
    legs.push(hip);
  });

  // Tail: a chain of segments so it can curl.
  const tail = [];
  let parent = body;
  const tailMats = kind === 'capp' ? [M.base, M.p1, M.p2, M.p1, M.p2, M.p2] : [M.p2, M.p1, M.p1, M.p1, M.p2, M.p1];
  for (let i = 0; i < 6; i++) {
    const seg = new THREE.Group();
    seg.position.set(0, i === 0 ? 0.12 : 0, i === 0 ? -0.3 : -0.12);
    parent.add(seg);
    seg.add(sph(0.075 * f * (1 - i * 0.06), tailMats[i], 0, 0, -0.06, 1, 1, 1.3, 8));
    tail.push(seg);
    parent = seg;
  }

  // Accessories that abilities show.
  const crane = buildCrane();
  crane.visible = false;
  crane.position.set(0, 1.25, 0);
  rig.add(crane);

  // Collar (cosmetic, chosen in the cat tree shop).
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.035, 6, 16), lam(0xd5857e));
  collar.position.set(0, 0.23, 0.22);
  collar.rotation.x = Math.PI / 2 - 0.5;
  collar.visible = false;
  body.add(collar);

  return { root, rig, body, head, legs, tail, crane, collar, kind, style: s, phase: Math.random() * 6, sit: 0, idle: 0 };
}

function buildCrane() {
  const g = new THREE.Group();
  const m = new THREE.MeshLambertMaterial({ color: 0xf4e6c4, side: THREE.DoubleSide, flatShading: true });
  const wing = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.06, 3), m);
  wing.scale.set(2.2, 1, 0.5);
  g.add(wing);
  const neck = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.5, 4), m);
  neck.position.set(0, 0.1, 0.4);
  neck.rotation.x = 1.0;
  g.add(neck);
  return g;
}

// Procedural animation. st: { speed (0..1+), grounded, vy, time, gliding, carry, dash }
export function animateCat(c, st, dt) {
  const moving = st.speed > 0.08;
  c.idle = moving || !st.grounded ? 0 : c.idle + dt;
  const sitTarget = c.idle > 2.2 || st.forceSit ? 1 : 0;
  c.sit += (sitTarget - c.sit) * Math.min(1, dt * 4);
  c.phase += dt * (4 + st.speed * 10);
  const amp = Math.min(1, st.speed) * 0.75;

  if (st.grounded) {
    c.legs.forEach((hip, i) => {
      const off = i === 0 || i === 3 ? 0 : Math.PI;
      let r = Math.sin(c.phase + off) * amp;
      if (i >= 2) r -= c.sit * 1.3;
      hip.rotation.x += (r - hip.rotation.x) * Math.min(1, dt * 20);
    });
    const bob = moving ? Math.abs(Math.sin(c.phase)) * 0.05 * amp : 0;
    c.body.position.y = 0.62 + bob - c.sit * 0.14;
    c.body.rotation.x = -c.sit * 0.42;
    c.head.rotation.x = c.sit * 0.35;
  } else {
    const stretch = st.vy > 0 ? -0.7 : 0.4;
    c.legs.forEach((hip, i) => {
      const r = i < 2 ? stretch : -stretch;
      hip.rotation.x += (r - hip.rotation.x) * Math.min(1, dt * 10);
    });
    c.body.position.y = 0.62;
    c.body.rotation.x = Math.max(-0.4, Math.min(0.4, -st.vy * 0.04));
    c.head.rotation.x = 0;
  }
  if (st.dash) c.body.rotation.z += dt * 30; else c.body.rotation.z *= 0.6;

  const tt = st.time;
  c.tail.forEach((seg, i) => {
    const up = st.grounded ? (moving ? 0.25 : 0.45) : -0.2;
    seg.rotation.x = (i === 0 ? -0.9 + up : -0.22) + Math.sin(tt * 3 + i * 0.8) * 0.06;
    seg.rotation.y = Math.sin(tt * (moving ? 6 : 2) + i * 0.7) * (0.12 + i * 0.03);
  });
  c.crane.visible = !!st.gliding;
  if (st.gliding) c.crane.rotation.z = Math.sin(tt * 8) * 0.2;
}
