import * as THREE from 'three';

const cache = new Map();
function m(c, extra) {
  const k = c + (extra ? JSON.stringify(extra) : '');
  if (!cache.has(k)) cache.set(k, new THREE.MeshLambertMaterial({ color: c, ...(extra || {}) }));
  return cache.get(k);
}
function S(g, r, c, x, y, z, sx = 1, sy = 1, sz = 1, extra) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), m(c, extra));
  mesh.position.set(x, y, z);
  mesh.scale.set(sx, sy, sz);
  mesh.castShadow = true;
  g.add(mesh);
  return mesh;
}
function C(g, rt, rb, h, c, x, y, z, seg = 14, extra) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m(c, extra));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  g.add(mesh);
  return mesh;
}
function eyes(g, y, z, spread = 0.1, r = 0.05, white = false) {
  for (const s of [-1, 1]) {
    if (white) S(g, r * 1.6, 0xffffff, s * spread, y, z - 0.01);
    S(g, r, 0x1d1a1a, s * spread, y, z + (white ? r * 0.8 : 0));
  }
}
function topHat(g, y, c = 0x2b2522, band = 0xc9a227, s = 1) {
  C(g, 0.22 * s, 0.22 * s, 0.04, c, 0, y, 0);
  C(g, 0.14 * s, 0.14 * s, 0.26 * s, c, 0, y + 0.14 * s, 0);
  C(g, 0.145 * s, 0.145 * s, 0.05, band, 0, y + 0.05, 0);
}

export function critter(kind) {
  const g = new THREE.Group();
  switch (kind) {
    case 'otter': {
      S(g, 0.5, 0x8a5a3c, 0, 0.75, 0, 0.8, 1.3, 0.75);
      S(g, 0.32, 0xe9d2b4, 0, 0.7, 0.18, 0.9, 1.4, 0.6);
      S(g, 0.34, 0x8a5a3c, 0, 1.55, 0.05);
      S(g, 0.18, 0xe9d2b4, 0, 1.46, 0.28, 1.1, 0.8, 0.8);
      S(g, 0.05, 0x2b2522, 0, 1.5, 0.43);
      eyes(g, 1.62, 0.3, 0.12);
      S(g, 0.09, 0x6e4630, -0.25, 1.82, 0); S(g, 0.09, 0x6e4630, 0.25, 1.82, 0);
      const apron = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.7, 0.05), m(0x2bb3b0));
      apron.position.set(0, 0.75, 0.45); g.add(apron);
      S(g, 0.16, 0x6e4630, 0, 0.3, -0.55, 0.8, 0.6, 2);
      break;
    }
    case 'toad': {
      S(g, 0.6, 0x8b7a3a, 0, 0.55, 0, 1.2, 0.85, 1);
      S(g, 0.42, 0xd6c48a, 0, 0.45, 0.25, 1.1, 0.8, 0.6);
      S(g, 0.12, 0x8b7a3a, -0.25, 1.05, 0.25); S(g, 0.12, 0x8b7a3a, 0.25, 1.05, 0.25);
      eyes(g, 1.08, 0.36, 0.25, 0.05);
      for (let i = 0; i < 6; i++) S(g, 0.06, 0x6f6128, Math.sin(i * 2) * 0.5, 0.75 + (i % 3) * 0.12, Math.cos(i * 2) * 0.3 - 0.1);
      topHat(g, 1.12, 0x3b2f45);
      const mono = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.015, 6, 16), m(0xc9a227));
      mono.position.set(0.25, 1.08, 0.4); g.add(mono);
      break;
    }
    case 'frog': {
      S(g, 0.45, 0x5fae4a, 0, 0.45, 0, 1.1, 0.8, 1);
      S(g, 0.3, 0xcfe8a4, 0, 0.38, 0.2, 1, 0.8, 0.6);
      for (const s of [-1, 1]) { S(g, 0.13, 0x5fae4a, s * 0.2, 0.82, 0.18); S(g, 0.08, 0xffffff, s * 0.2, 0.86, 0.27); S(g, 0.045, 0x1d1a1a, s * 0.2, 0.86, 0.33); }
      C(g, 0.25, 0.25, 0.08, 0xff7a59, 0, 0.98, 0, 10);
      break;
    }
    case 'snail': {
      S(g, 0.3, 0xb7c96a, 0, 0.25, 0.25, 1, 0.8, 2);
      const shell = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.18, 10, 20), m(0xf2a0b8));
      shell.position.set(0, 0.62, -0.1); shell.rotation.y = Math.PI / 2; g.add(shell);
      S(g, 0.2, 0xe07a9a, 0, 0.62, -0.1);
      C(g, 0.02, 0.02, 0.35, 0xb7c96a, -0.08, 0.6, 0.75); C(g, 0.02, 0.02, 0.35, 0xb7c96a, 0.08, 0.6, 0.75);
      S(g, 0.04, 0x1d1a1a, -0.08, 0.8, 0.75); S(g, 0.04, 0x1d1a1a, 0.08, 0.8, 0.75);
      break;
    }
    case 'mouse': {
      S(g, 0.38, 0xcfc6cc, 0, 0.55, 0, 0.9, 1.2, 0.85);
      const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.38, 0.6, 14), m(0xffffff));
      coat.position.set(0, 0.45, 0); g.add(coat);
      S(g, 0.28, 0xcfc6cc, 0, 1.15, 0.05);
      S(g, 0.14, 0xf2c4cc, -0.22, 1.36, 0, 1, 1, 0.4); S(g, 0.14, 0xf2c4cc, 0.22, 1.36, 0, 1, 1, 0.4);
      S(g, 0.04, 0xe58f8f, 0, 1.12, 0.32);
      eyes(g, 1.2, 0.26, 0.09, 0.04);
      C(g, 0.2, 0.18, 0.18, 0xffffff, 0, 1.45, 0); S(g, 0.24, 0xffffff, 0, 1.62, 0, 1, 0.7, 1);
      break;
    }
    case 'robot': {
      C(g, 0.3, 0.34, 0.7, 0xb8863b, 0, 0.55, 0, 12);
      S(g, 0.3, 0xc9a227, 0, 1.02, 0, 1, 0.8, 1);
      S(g, 0.08, 0x7fe0ff, -0.1, 1.05, 0.25, 1, 1, 0.5, { emissive: 0x3aa0c0 });
      S(g, 0.08, 0x7fe0ff, 0.1, 1.05, 0.25, 1, 1, 0.5, { emissive: 0x3aa0c0 });
      const key = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 6, 12), m(0xc9a227));
      key.position.set(0, 0.7, -0.4); g.add(key);
      g.userData.spin = key;
      break;
    }
    case 'fox': {
      const pm = { flatShading: true };
      const body = new THREE.Mesh(new THREE.OctahedronGeometry(0.45), m(0xe8823a, pm));
      body.scale.set(0.8, 0.8, 1.3); body.position.y = 0.6; g.add(body);
      const head = new THREE.Mesh(new THREE.TetrahedronGeometry(0.35), m(0xf0a058, pm));
      head.position.set(0, 1.05, 0.4); head.rotation.set(0.6, 0.8, 0); g.add(head);
      for (const s of [-1, 1]) {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 3), m(0xe8823a, pm));
        ear.position.set(s * 0.15, 1.35, 0.35); g.add(ear);
      }
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.8, 4), m(0xfff3e0, pm));
      tail.position.set(0, 0.8, -0.7); tail.rotation.x = -1.0; g.add(tail);
      eyes(g, 1.1, 0.62, 0.08, 0.035);
      break;
    }
    case 'firefly': {
      S(g, 0.22, 0x5b3a29, 0, 1.2, 0.1, 1, 1, 1.2);
      S(g, 0.3, 0xffe873, 0, 1.15, -0.3, 1, 1, 1.3, { emissive: 0xffc93c });
      S(g, 0.16, 0x5b3a29, 0, 1.35, 0.35);
      eyes(g, 1.4, 0.48, 0.07, 0.035);
      for (const s of [-1, 1]) {
        const w = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 6), m(0xdff6ff, { transparent: true, opacity: 0.55 }));
        w.scale.set(1, 0.15, 0.5); w.position.set(s * 0.35, 1.45, -0.05); w.rotation.z = s * 0.4; g.add(w);
      }
      const crown = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.15, 5), m(0xc9a227));
      crown.position.set(0, 1.55, 0.35); g.add(crown);
      g.userData.float = true;
      break;
    }
    case 'cricket': {
      S(g, 0.55, 0x6e4a2e, 0, 0.55, 0, 1, 0.75, 1.4);
      S(g, 0.32, 0x7d5a38, 0, 0.75, 0.7);
      eyes(g, 0.85, 0.98, 0.14, 0.05);
      for (const s of [-1, 1]) S(g, 0.16, 0x4f341f, s * 0.45, 0.4, 0.75, 1.2, 0.6, 1);
      C(g, 0.015, 0.015, 0.8, 0x4f341f, -0.1, 1.15, 0.95); C(g, 0.015, 0.015, 0.8, 0x4f341f, 0.1, 1.15, 0.95);
      break;
    }
    case 'sock': {
      const cols = [0xe63946, 0xffffff, 0xe63946, 0xffffff, 0xe63946];
      cols.forEach((c, i) => C(g, 0.3, 0.3, 0.3, c, 0, 0.2 + i * 0.3, 0));
      S(g, 0.3, 0xe63946, 0, 0.12, 0.25, 1, 0.6, 1.4);
      eyes(g, 1.15, 0.27, 0.1, 0.05, true);
      topHat(g, 1.55, 0x2b2522, 0xffc93c);
      break;
    }
    case 'pigeon': {
      S(g, 0.45, 0x9aa3b0, 0, 0.6, 0, 1, 1, 1.2);
      S(g, 0.3, 0x6c8f86, 0, 1.0, 0.25, 1, 0.8, 1);
      S(g, 0.26, 0x8e97a4, 0, 1.3, 0.35);
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 6), m(0xe8b931));
      beak.position.set(0, 1.27, 0.62); beak.rotation.x = Math.PI / 2; g.add(beak);
      eyes(g, 1.37, 0.55, 0.12, 0.04);
      C(g, 0.28, 0.28, 0.04, 0x1f2d4a, 0, 1.52, 0.35); C(g, 0.2, 0.22, 0.14, 0x1f2d4a, 0, 1.6, 0.35);
      C(g, 0.205, 0.205, 0.04, 0xc9a227, 0, 1.56, 0.35);
      break;
    }
    case 'pillowcat': {
      S(g, 0.6, 0xf7ece2, 0, 0.35, 0, 1.3, 0.6, 1.1);
      for (const s of [-1, 1]) {
        const e = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.3, 4), m(0xf7ece2));
        e.position.set(s * 0.42, 0.75, 0.1); g.add(e);
      }
      for (const s of [-1, 1]) {
        const l = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.015, 4, 10, Math.PI), m(0x523c39));
        l.position.set(s * 0.18, 0.45, 0.62); l.rotation.z = Math.PI; g.add(l);
      }
      break;
    }
    case 'hush': {
      const fog = { transparent: true, opacity: 0.75 };
      for (let i = 0; i < 9; i++) S(g, 0.6 + (i % 3) * 0.25, 0x8f8aa0, Math.sin(i * 1.7) * 0.9, 1.4 + Math.cos(i * 2.3) * 0.6, Math.cos(i * 1.3) * 0.5, 1, 1, 1, fog);
      S(g, 0.12, 0xf4f1ff, -0.3, 1.7, 0.95, 1, 1.4, 0.5, { emissive: 0x9a96a8 });
      S(g, 0.12, 0xf4f1ff, 0.3, 1.7, 0.95, 1, 1.4, 0.5, { emissive: 0x9a96a8 });
      g.userData.float = true;
      break;
    }
    case 'gull': {
      S(g, 0.42, 0xffffff, 0, 0.6, 0, 1, 1, 1.2);
      S(g, 0.26, 0xffffff, 0, 1.15, 0.3);
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 6), m(0xffc93c));
      beak.position.set(0, 1.12, 0.6); beak.rotation.x = Math.PI / 2; g.add(beak);
      eyes(g, 1.22, 0.5, 0.12, 0.035);
      S(g, 0.3, 0x9aa3b0, 0, 0.75, -0.2, 1.4, 0.4, 1);
      break;
    }
    default:
      S(g, 0.4, 0xff00ff, 0, 0.5, 0);
  }
  return g;
}
