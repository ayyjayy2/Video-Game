import * as THREE from 'three';
import { mat } from './level.js';

// Decorative builders. None of these collide unless they call L.box without deco.
function mesh(geo, material, x, y, z) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
const glowMat = (c, i = 0.8) => new THREE.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: i });

export function lantern(L, x, y, z, color = 0xff9f6b, light = false) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 4), mat(0x5b3a29), 0, 0.55, 0));
  const body = mesh(new THREE.SphereGeometry(0.28, 12, 10), glowMat(color, 0.7), 0, 0.1, 0);
  body.scale.set(1, 1.25, 1);
  g.add(body);
  g.add(mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 10), mat(0x8a5a3c), 0, 0.42, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.03, 0.06, 0.25, 6), mat(0xe63946), 0, -0.32, 0));
  g.position.set(x, y, z);
  if (light) {
    const pl = new THREE.PointLight(color, 4, 9);
    pl.position.y = 0.1;
    g.add(pl);
  }
  L.add(g);
  const ph = Math.random() * 6;
  L.every((t) => { g.rotation.z = Math.sin(t * 1.5 + ph) * 0.06; });
  return g;
}

export function post(L, x, y, z, h, color = 0x8a5a3c) {
  return L.add(mesh(new THREE.CylinderGeometry(0.12, 0.14, h, 8), mat(color), x, y + h / 2, z));
}

export function lotus(L, x, y, z, s = 1, light = true) {
  const g = new THREE.Group();
  const outer = glowMat(0xffb3c7, 0.35);
  const inner = glowMat(0xffe1a8, 0.6);
  for (let ring = 0; ring < 2; ring++) {
    const n = ring ? 6 : 8;
    for (let i = 0; i < n; i++) {
      const p = mesh(new THREE.SphereGeometry(0.5, 10, 8), ring ? inner : outer, 0, 0, 0);
      p.scale.set(0.45, 0.2, 1);
      const a = (i / n) * Math.PI * 2 + ring * 0.3;
      p.position.set(Math.sin(a) * (ring ? 0.35 : 0.6), 0.25 + ring * 0.2, Math.cos(a) * (ring ? 0.35 : 0.6));
      p.rotation.set(ring ? -0.9 : -0.5, a, 0, 'YXZ');
      g.add(p);
    }
  }
  g.add(mesh(new THREE.SphereGeometry(0.22, 12, 10), glowMat(0xffd678, 1), 0, 0.5, 0));
  if (light) {
    const pl = new THREE.PointLight(0xffd0a0, 8, 14);
    pl.position.y = 1;
    g.add(pl);
  }
  g.scale.setScalar(s);
  g.position.set(x, y, z);
  return L.add(g);
}

export function lilyLeaf(L, x, y, z, r) {
  const m = mesh(new THREE.CylinderGeometry(r, r, 0.08, 20, 1, false, 0.3, Math.PI * 2 - 0.3), mat(0x6fbf5a), x, y, z);
  return L.add(m);
}

export function awningStall(L, x, y, z, rot = 0, c1 = 0xff7a59, c2 = 0xfff3e0, goods = 0xffc93c) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(2.6, 1, 1.2), mat(0x8a5a3c), 0, 0.5, 0));
  for (const sx of [-1.2, 1.2]) g.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 6), mat(0x5b3a29), sx, 1.2, -0.5));
  for (let i = 0; i < 6; i++) {
    const s = mesh(new THREE.BoxGeometry(0.46, 0.06, 1.6), mat(i % 2 ? c1 : c2), -1.15 + i * 0.46, 2.35, 0.1);
    s.rotation.x = 0.25;
    g.add(s);
  }
  for (let i = 0; i < 5; i++) g.add(mesh(new THREE.SphereGeometry(0.16, 8, 6), mat(i % 2 ? goods : 0x7cc26a), -0.9 + i * 0.45, 1.12, 0.2));
  g.position.set(x, y, z);
  g.rotation.y = rot;
  return L.add(g);
}

export function stiltHouse(L, x, y, z, w, d, h, rot = 0, roof = 0x5e548e) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(w, h, d), mat(0xc58b5a), 0, h / 2, 0));
  const r = mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.78, h * 0.7, 4), mat(roof), 0, h + h * 0.35, 0);
  r.rotation.y = Math.PI / 4;
  r.scale.set(1, 1, d / w);
  g.add(r);
  g.add(mesh(new THREE.BoxGeometry(w * 0.3, h * 0.35, 0.05), glowMat(0xffd08a, 0.8), 0, h * 0.5, d / 2 + 0.03));
  g.position.set(x, y, z);
  g.rotation.y = rot;
  return L.add(g);
}

export function gear(L, x, y, z, r, axis = 'z', speed = 0.4, color = 0xc9a227) {
  const g = new THREE.Group();
  const m = mat(color);
  g.add(new THREE.Mesh(new THREE.TorusGeometry(r * 0.8, r * 0.16, 8, 24), m));
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.25, r * 0.25, r * 0.2, 12).rotateX(Math.PI / 2), m));
  const teeth = Math.max(8, Math.round(r * 10));
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const t = new THREE.Mesh(new THREE.BoxGeometry(r * 0.22, r * 0.25, r * 0.2), m);
    t.position.set(Math.cos(a) * r, Math.sin(a) * r, 0);
    t.rotation.z = a;
    g.add(t);
  }
  for (let i = 0; i < 4; i++) {
    const sp = new THREE.Mesh(new THREE.BoxGeometry(r * 1.5, r * 0.1, r * 0.1), m);
    sp.rotation.z = (i * Math.PI) / 4;
    g.add(sp);
  }
  g.position.set(x, y, z);
  if (axis === 'y') g.rotation.x = Math.PI / 2;
  if (axis === 'x') g.rotation.y = Math.PI / 2;
  L.add(g);
  L.every((t, dt) => { g.rotateZ(dt * speed); });
  return g;
}

export function clockFace(L, x, y, z, r) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.4, 40).rotateX(Math.PI / 2), glowMat(0xffe2a6, 0.45)));
  g.add(new THREE.Mesh(new THREE.TorusGeometry(r, 0.3, 8, 40), mat(0xb8863b)));
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.9, 0.1), mat(0x523c39));
    tick.position.set(Math.sin(a) * r * 0.82, Math.cos(a) * r * 0.82, 0.25);
    tick.rotation.z = -a;
    g.add(tick);
  }
  const hand1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, r * 0.6, 0.1), mat(0x523c39));
  hand1.geometry.translate(0, r * 0.3, 0);
  hand1.position.z = 0.3;
  const hand2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, r * 0.85, 0.1), mat(0x523c39));
  hand2.geometry.translate(0, r * 0.42, 0);
  hand2.position.z = 0.35;
  g.add(hand1, hand2);
  g.position.set(x, y, z);
  L.add(g);
  g.userData.hands = [hand1, hand2];
  return g;
}

export function paperMountain(L, x, y, z, r, h, color = 0xe8dcc0) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 5, 1), new THREE.MeshLambertMaterial({ color, flatShading: true }));
  m.position.set(x, y + h / 2, z);
  m.rotation.y = Math.random() * 3;
  m.castShadow = true;
  L.add(m);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(r * 0.3, h * 0.3, 5), new THREE.MeshLambertMaterial({ color: 0x8aa0c8, flatShading: true }));
  cap.position.set(x, y + h * 0.85, z);
  cap.rotation.y = m.rotation.y;
  L.add(cap);
  return m;
}

export function mapleTree(L, x, y, z, s = 1, leaf = 0xe2603d) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.15, 0.25, 2, 6), mat(0x6e4630), 0, 1, 0));
  const lm = new THREE.MeshLambertMaterial({ color: leaf, flatShading: true });
  [[0, 2.4, 0, 1.1], [0.7, 2.1, 0.3, 0.8], [-0.6, 2.2, -0.2, 0.8], [0.1, 2.9, -0.3, 0.7]].forEach(([a, b, c, r]) => g.add(mesh(new THREE.IcosahedronGeometry(r, 0), lm, a, b, c)));
  g.position.set(x, y, z);
  g.scale.setScalar(s);
  return L.add(g);
}

export function palm(L, x, y, z, s = 1) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.12, 0.2, 3, 8), mat(0x8a6a3c), 0, 1.5, 0));
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const leaf = mesh(new THREE.SphereGeometry(1, 10, 6), mat(0x3f9a4a), Math.sin(a) * 0.9, 3, Math.cos(a) * 0.9);
    leaf.scale.set(0.35, 0.08, 1.2);
    leaf.rotation.set(0.5, a, 0, 'YXZ');
    g.add(leaf);
  }
  g.position.set(x, y, z);
  g.scale.setScalar(s);
  return L.add(g);
}

export function bigLeaf(L, x, y, z, s = 1, rot = 0, color = 0x4f9a3a) {
  const m = mesh(new THREE.SphereGeometry(1, 12, 8), mat(color), x, y, z);
  m.scale.set(1.2 * s, 0.1 * s, 2 * s);
  m.rotation.set(-0.3, rot, 0.2);
  return L.add(m);
}

export function cloud(L, x, y, z, s = 1, color = 0xffffff, opacity = 1) {
  const g = new THREE.Group();
  const m = new THREE.MeshLambertMaterial({ color, transparent: opacity < 1, opacity });
  [[0, 0, 0, 1], [1, -0.2, 0.2, 0.8], [-1, -0.2, 0, 0.75], [0.4, 0.5, -0.2, 0.7]].forEach(([a, b, c, r]) => g.add(new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), m).translateX(a).translateY(b).translateZ(c)));
  g.position.set(x, y, z);
  g.scale.setScalar(s);
  return L.add(g);
}

export function star(L, x, y, z, s = 0.4, color = 0xffd678) {
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.45 : 1;
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: false });
  geo.center();
  const m = new THREE.Mesh(geo, glowMat(color, 0.9));
  m.position.set(x, y, z);
  m.scale.setScalar(s);
  L.add(m);
  return m;
}

export function skyStars(L, n = 200, r = 120, color = 0xffffff) {
  const pos = [];
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const b = Math.random() * 0.9 + 0.05;
    pos.push(Math.cos(a) * Math.cos(b) * r, Math.sin(b) * r, Math.sin(a) * Math.cos(b) * r);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ color, size: 0.8, sizeAttenuation: true, fog: false }));
  return L.add(p);
}

export function crystal(L, x, y, z, s = 1, color = 0x8f7bff) {
  const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.5), new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.4, flatShading: true }));
  m.scale.set(0.6 * s, 1.4 * s, 0.6 * s);
  m.position.set(x, y, z);
  L.add(m);
  return m;
}

export function quiltTexture(colors = ['#e9dcf5', '#b9a6e3', '#f7ece2', '#8a68c9'], gold = '#e8c46a') {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      g.fillStyle = colors[(i + j * 3) % colors.length];
      g.fillRect(i * 32, j * 32, 32, 32);
    }
  }
  g.strokeStyle = gold;
  g.setLineDash([3, 3]);
  g.lineWidth = 1.5;
  for (let i = 0; i <= 4; i++) {
    g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32, 128); g.stroke();
    g.beginPath(); g.moveTo(0, i * 32); g.lineTo(128, i * 32); g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function paperTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#efe2c2';
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = 'rgba(140,110,60,0.35)';
  g.lineWidth = 1;
  for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(0, i * 32 + 16); g.lineTo(128, i * 32 + 16); g.stroke(); }
  g.strokeStyle = 'rgba(80,120,160,0.4)';
  g.beginPath(); g.moveTo(0, 90); g.bezierCurveTo(40, 60, 80, 120, 128, 80); g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function woodTexture(base = '#b9805a', line = 'rgba(90,50,30,0.25)') {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = base;
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = line;
  for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(0, i * 16); g.lineTo(128, i * 16); g.stroke(); }
  for (let i = 0; i < 8; i++) { const x = (i * 37) % 128; g.beginPath(); g.moveTo(x, (i % 8) * 16); g.lineTo(x, (i % 8) * 16 + 16); g.stroke(); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function texturedMat(tex, rx, ry, color = 0xffffff) {
  const t = tex.clone();
  t.needsUpdate = true;
  t.repeat.set(rx, ry);
  return new THREE.MeshLambertMaterial({ map: t, color });
}

export function water(L, y, size, color = 0x2bb3b0, opacity = 0.85) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size, 1, 1), new THREE.MeshLambertMaterial({ color, transparent: true, opacity }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = y;
  m.receiveShadow = true;
  L.add(m);
  return m;
}

export function books(L, x0, x1, y, z, depth = 1.6, h = 1.2) {
  const cols = [0xe63946, 0xffc93c, 0x5aa3d9, 0x7cc26a, 0xf4e6c4, 0xb9a6e3, 0xff8fb1, 0x8a5a3c];
  let x = x0;
  let i = 0;
  while (x < x1 - 0.2) {
    const w = 0.22 + ((i * 7) % 5) * 0.05;
    const hh = h * (0.75 + ((i * 3) % 4) * 0.08);
    L.add(mesh(new THREE.BoxGeometry(w, hh, depth), mat(cols[(i * 5) % cols.length]), x + w / 2, y + hh / 2, z));
    x += w + 0.03;
    i++;
  }
}

export function rug(L, x, y, z, r, color = 0xf2d6c2) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 40), mat(color));
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y + 0.02, z);
  m.receiveShadow = true;
  return L.add(m);
}

export function bannerString(L, x0, z0, x1, z1, y, colors = [0xff7a59, 0xffc93c, 0x7cc26a, 0xb9a6e3]) {
  const n = Math.max(4, Math.round(Math.hypot(x1 - x0, z1 - z0) / 0.8));
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    const sag = Math.sin(k * Math.PI) * 0.6;
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.4, 3), mat(colors[i % colors.length]));
    f.position.set(x0 + (x1 - x0) * k, y - sag - 0.2, z0 + (z1 - z0) * k);
    f.rotation.x = Math.PI;
    L.add(f);
  }
}
