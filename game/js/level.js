import * as THREE from 'three';
import { critter } from './critters.js';

const V = THREE.Vector3;
const matCache = new Map();
export function mat(color, extra) {
  const key = color + (extra ? JSON.stringify(extra) : '');
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshLambertMaterial({ color, ...(extra || {}) }));
  return matCache.get(key);
}

export const GRAVITY = 32;

// A Level owns a scene plus every gameplay object in it. Solids are axis-aligned boxes.
export class Level {
  constructor(game, id) {
    this.game = game;
    this.id = id;
    this.scene = new THREE.Scene();
    this.t = 0;
    this.solids = [];
    this.hazards = [];
    this.triggers = [];
    this.interacts = [];
    this.pickups = [];
    this.vents = [];
    this.plates = [];
    this.updaters = [];
    this.darkZones = [];
    this.checkpoints = [];
    this.killY = -20;
    this.waterY = null;
    this.spawn = new V(0, 0, 0);
    this.spawnFacing = 0;
    this.checkpoint = { pos: new V(), facing: 0 };
    this.noSwap = false;
    this.onRespawn = null;
    this.music = 'Do';
  }

  // ---------- environment ----------
  setSky(top, bottom, fog, near = 40, far = 140) {
    const c = document.createElement('canvas');
    c.width = 4;
    c.height = 256;
    const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, top);
    gr.addColorStop(1, bottom);
    g.fillStyle = gr;
    g.fillRect(0, 0, 4, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.scene.background = tex;
    this.scene.fog = new THREE.Fog(fog, near, far);
  }

  lights({ sky = 0xffffff, ground = 0x886655, hemi = 1.6, sun = 0xfff1dd, sunI = 1.6, dir = [8, 18, 6] } = {}) {
    const h = new THREE.HemisphereLight(sky, ground, hemi);
    this.scene.add(h);
    const d = new THREE.DirectionalLight(sun, sunI);
    d.position.set(...dir);
    d.castShadow = true;
    d.shadow.mapSize.set(1024, 1024);
    const sc = d.shadow.camera;
    sc.left = -22; sc.right = 22; sc.top = 22; sc.bottom = -22; sc.near = 1; sc.far = 80;
    d.shadow.bias = -0.0008;
    this.sunOffset = new V(...dir);
    this.scene.add(d, d.target);
    this.sun = d;
    this.hemi = h;
  }

  add(o) { this.scene.add(o); return o; }
  every(fn) { this.updaters.push(fn); }

  // ---------- solids ----------
  // box(x, top, z, width, depth, height, colour, options). x/z are the centre, top is the walkable surface.
  box(x, top, z, w, d, h = 0.6, color = 0xffffff, o = {}) {
    let geo;
    if (o.cyl) geo = new THREE.CylinderGeometry(w / 2, (o.cylBottom ?? w / 2), h, o.seg || 28);
    else geo = new THREE.BoxGeometry(w, h, d);
    const needsOwn = o.reveal || o.echoBreak || o.when || o.ghost || o.crumble || o.fade;
    const material = o.mat || (needsOwn
      ? new THREE.MeshLambertMaterial({ color, transparent: true, opacity: o.opacity ?? (o.reveal ? 0 : 1), emissive: o.emissive ?? 0x000000 })
      : mat(color, o.emissive ? { emissive: o.emissive } : undefined));
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x, top - h / 2, z);
    mesh.receiveShadow = true;
    mesh.castShadow = o.cast !== false;
    this.scene.add(mesh);
    if (o.deco) return mesh;
    const cw = o.cyl ? w * 0.86 : w;
    const cd = o.cyl ? w * 0.86 : d;
    const s = {
      min: new V(x - cw / 2, top - h, z - cd / 2), max: new V(x + cw / 2, top, z + cd / 2),
      mesh, o, active: true, solidNow: true, delta: new V(), cur: new V(x, top, z), base: new V(x, top, z), w: cw, d: cd, h,
      revealed: !o.reveal, echoed: false, crumbleT: -1, vy: 0,
    };
    this.solids.push(s);
    return s;
  }

  // A block defined by bottom and top heights.
  block(x, z, w, d, bottom, top, color, o) { return this.box(x, top, z, w, d, top - bottom, color, o); }

  setSolidCenter(s, x, top, z) {
    const dx = x - s.cur.x;
    const dy = top - s.cur.y;
    const dz = z - s.cur.z;
    s.min.x += dx; s.max.x += dx; s.min.y += dy; s.max.y += dy; s.min.z += dz; s.max.z += dz;
    s.mesh.position.x += dx; s.mesh.position.y += dy; s.mesh.position.z += dz;
    s.cur.set(x, top, z);
    s.delta.set(dx, dy, dz);
  }

  removeSolid(s, fade = true) {
    s.active = false;
    if (fade) {
      s.mesh.material = s.mesh.material.clone();
      s.mesh.material.transparent = true;
      const m = s.mesh.material;
      const start = this.t;
      this.every(() => {
        const k = Math.max(0, 1 - (this.t - start) * 2);
        m.opacity = k;
        if (k <= 0) s.mesh.visible = false;
        return k > 0;
      });
    } else s.mesh.visible = false;
  }

  // ---------- gameplay objects ----------
  hazard(minX, minY, minZ, maxX, maxY, maxZ, o = {}) {
    const hz = { min: new V(minX, minY, minZ), max: new V(maxX, maxY, maxZ), o, active: true };
    if (o.visual) {
      const g = new THREE.Group();
      const cx = (minX + maxX) / 2;
      const cz = (minZ + maxZ) / 2;
      const fm = new THREE.MeshLambertMaterial({ color: 0x8f8aa0, transparent: true, opacity: 0.6 });
      for (let i = 0; i < 7; i++) {
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.7 + (i % 3) * 0.3, 10, 8), fm);
        b.position.set((Math.random() - 0.5) * (maxX - minX), (maxY - minY) * (0.3 + Math.random() * 0.5), (Math.random() - 0.5) * (maxZ - minZ));
        g.add(b);
      }
      g.position.set(cx, minY, cz);
      this.scene.add(g);
      hz.mesh = g;
      hz.center = new V(cx, minY, cz);
    }
    this.hazards.push(hz);
    return hz;
  }

  moveHazard(hz, dx, dz) {
    hz.min.x += dx; hz.max.x += dx; hz.min.z += dz; hz.max.z += dz;
    if (hz.mesh) { hz.mesh.position.x += dx; hz.mesh.position.z += dz; }
  }

  trigger(minX, minY, minZ, maxX, maxY, maxZ, fn, once = true) {
    const t = { min: new V(minX, minY, minZ), max: new V(maxX, maxY, maxZ), fn, once, done: false };
    this.triggers.push(t);
    return t;
  }

  interact(x, y, z, o) {
    // o: { label, r, who: 'any'|'capp'|'asher', use(cat), enabled() }
    const it = { pos: new V(x, y, z), r: o.r || 2.2, label: o.label || 'Interact', who: o.who || 'any', use: o.use, enabled: o.enabled || (() => true), marker: null };
    if (o.marker !== false) {
      const mk = new THREE.Mesh(new THREE.OctahedronGeometry(0.16), new THREE.MeshBasicMaterial({ color: 0xffd678 }));
      mk.position.set(x, y + (o.markerY ?? 2.3), z);
      this.scene.add(mk);
      it.marker = mk;
    }
    this.interacts.push(it);
    return it;
  }

  npc(kind, x, y, z, face = 0, o = {}) {
    const g = critter(kind);
    g.position.set(x, y, z);
    g.rotation.y = face;
    if (o.scale) g.scale.setScalar(o.scale);
    this.scene.add(g);
    const by = y;
    const ph = Math.random() * 6;
    this.every((t) => {
      g.position.y = by + (g.userData.float ? 0.25 + Math.sin(t * 2 + ph) * 0.15 : Math.abs(Math.sin(t * 2.2 + ph)) * 0.05);
      if (g.userData.spin) g.userData.spin.rotation.z = t * 3;
    });
    return g;
  }

  pickup(x, y, z, kind = 'treat', o = {}) {
    let mesh;
    if (kind === 'treat') mesh = makeFish();
    else if (kind === 'note') mesh = makeNote();
    else mesh = o.mesh || makeGem(o.color || 0xffd678);
    mesh.position.set(x, y, z);
    this.scene.add(mesh);
    const p = { pos: new V(x, y, z), mesh, kind, taken: false, r: o.r || (kind === 'note' ? 1.2 : 0.9), onPick: o.onPick, visibleWhen: o.visibleWhen, label: o.label };
    this.pickups.push(p);
    return p;
  }

  vent(x, z, r, bottom, top, kind, enabled, speed = 7) {
    const v = { x, z, r, bottom, top, kind, enabled, speed };
    // Particle column visual
    const n = 18;
    const geo = new THREE.SphereGeometry(kind === 'bubble' ? 0.18 : 0.08, 8, 6);
    const mt = new THREE.MeshLambertMaterial({ color: kind === 'bubble' ? 0xdff6ff : 0xffffff, transparent: true, opacity: 0.7, emissive: kind === 'bubble' ? 0x335566 : 0x445566 });
    const parts = [];
    for (let i = 0; i < n; i++) {
      const p = new THREE.Mesh(geo, mt);
      p.userData.o = Math.random();
      p.userData.a = Math.random() * 6.28;
      p.userData.rr = Math.random() * r * 0.9;
      this.scene.add(p);
      parts.push(p);
    }
    this.every((t) => {
      const on = enabled();
      mt.opacity = on ? 0.7 : 0.12;
      parts.forEach((p) => {
        const k = (p.userData.o + t * (on ? 0.35 : 0.1)) % 1;
        p.position.set(x + Math.cos(p.userData.a + t) * p.userData.rr, bottom + k * (top - bottom), z + Math.sin(p.userData.a + t) * p.userData.rr);
      });
    });
    this.vents.push(v);
    return v;
  }

  plate(x, top, z, w, d, color, onChange) {
    const base = this.box(x, top, z, w, d, 0.2, 0x6b5a4a);
    const glow = this.box(x, top + 0.06, z, w * 0.75, d * 0.75, 0.08, color, { deco: true, emissive: 0x000000 });
    glow.material = new THREE.MeshLambertMaterial({ color, emissive: 0x000000 });
    const p = { x, top, z, w, d, pressed: false, onChange, glow, base };
    this.plates.push(p);
    return p;
  }

  sunbeam(x, y, z) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.3, 7, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }));
    m.position.set(x, y + 3.5, z);
    this.scene.add(m);
    const spot = new THREE.Mesh(new THREE.CircleGeometry(1.2, 20), new THREE.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: 0.35, depthWrite: false }));
    spot.rotation.x = -Math.PI / 2;
    spot.position.set(x, y + 0.03, z);
    this.scene.add(spot);
    const cp = { pos: new V(x, y, z), mesh: m, reached: false };
    this.checkpoints.push(cp);
    return cp;
  }

  dark(minX, minZ, maxX, maxZ) { this.darkZones.push({ minX, minZ, maxX, maxZ }); }

  // ---------- per-frame ----------
  update(dt, game) {
    this.t += dt;
    const t = this.t;
    for (const s of this.solids) {
      s.delta.set(0, 0, 0);
      if (s.o.move && s.active) {
        const off = s.o.move(t);
        this.setSolidCenter(s, s.base.x + (off.x || 0), s.base.y + (off.y || 0), s.base.z + (off.z || 0));
      }
      if (s.o.spinMesh) s.mesh.rotation.y += dt * s.o.spinMesh;
      if (s.o.crumble && s.crumbleT >= 0 && s.active) {
        s.crumbleT += dt;
        s.mesh.material.opacity = Math.max(0.1, 1 - s.crumbleT / 0.8);
        s.mesh.position.y = s.cur.y - s.h / 2 - Math.random() * 0.04;
        if (s.crumbleT > 0.8) { s.active = false; s.mesh.visible = false; game.sound.crumble(); }
      }
      if (s.o.pushable && s.active) this.crateGravity(s, dt);
      // Visibility for conditional solids
      if (s.o.reveal) {
        let on = false;
        if (s.o.reveal === 'sense') on = game.senseT > 0;
        else if (s.o.reveal === 'lantern') on = game.save.abilities.lantern && game.active && game.active.pos.distanceTo(s.cur) < 8;
        else if (s.o.reveal === 'echo') on = s.echoed;
        s.solidNow = on;
        const target = on ? 0.9 : (s.o.reveal === 'sense' ? 0.06 : 0.0);
        s.mesh.material.opacity += (target - s.mesh.material.opacity) * Math.min(1, dt * 6);
        s.mesh.visible = s.mesh.material.opacity > 0.02;
        s.mesh.material.emissive.setHex(on ? 0x333322 : 0x000000);
      }
      if (s.o.when) {
        const on = s.o.when();
        s.solidNow = on;
        const m = s.mesh.material;
        m.opacity += ((on ? 1 : 0.0) - m.opacity) * Math.min(1, dt * 5);
        s.mesh.visible = m.opacity > 0.02;
      }
    }
    for (let i = this.updaters.length - 1; i >= 0; i--) {
      if (this.updaters[i](t, dt) === false) this.updaters.splice(i, 1);
    }
    for (const p of this.pickups) {
      if (p.taken) continue;
      p.mesh.rotation.y += dt * 2;
      p.mesh.position.y = p.pos.y + Math.sin(t * 2.5 + p.pos.x) * 0.12;
      if (p.visibleWhen) p.mesh.visible = p.visibleWhen();
    }
    for (const it of this.interacts) {
      if (it.marker) {
        it.marker.visible = it.enabled();
        it.marker.rotation.y += dt * 2;
        it.marker.position.y = it.pos.y + 2.3 + Math.sin(t * 3) * 0.1;
      }
    }
  }

  // Solids a character collides with this frame.
  collidables(ch, catSolids) {
    const out = [];
    for (const s of this.solids) if (s.active && s.solidNow) out.push(s);
    for (const c of catSolids) if (c.owner !== ch) out.push(c);
    return out;
  }

  // ---------- character physics ----------
  moveChar(ch, dt, list, game) {
    // Ride moving ground and conveyors.
    if (ch.grounded && ch.ground) {
      const g = ch.ground;
      if (g.active !== false) {
        ch.pos.add(g.delta);
        if (g.o && g.o.conveyor) { ch.pos.x += g.o.conveyor[0] * dt; ch.pos.z += g.o.conveyor[1] * dt; }
      }
    }
    const vmax = Math.max(Math.abs(ch.vel.x), Math.abs(ch.vel.y), Math.abs(ch.vel.z));
    const steps = Math.max(1, Math.ceil((vmax * dt) / 0.2));
    const sdt = dt / steps;
    const wasGrounded = ch.grounded;
    let grounded = false;
    let ground = null;
    ch.edgeStopped = false;
    for (let i = 0; i < steps; i++) {
      const ox = ch.pos.x;
      const oz = ch.pos.z;
      ch.pos.x += ch.vel.x * sdt;
      this.resolveAxis(ch, list, 'x', wasGrounded, game);
      ch.pos.z += ch.vel.z * sdt;
      this.resolveAxis(ch, list, 'z', wasGrounded, game);
      // Cappuccino is careful: she will not walk off a ledge unless you tell her to jump.
      if (ch.careful && wasGrounded && ch.vel.y <= 0 && !this.hasSupport(ch, list)) {
        ch.pos.x = ox;
        ch.pos.z = oz;
        ch.vel.x = 0;
        ch.vel.z = 0;
        ch.edgeStopped = true;
      }
      const py = ch.pos.y;
      ch.pos.y += ch.vel.y * sdt;
      for (const s of list) {
        if (!this.overlaps(ch, s)) continue;
        if (ch.vel.y <= 0 && py >= s.max.y - 0.3) {
          ch.pos.y = s.max.y;
          ch.vel.y = 0;
          grounded = true;
          ground = s;
        } else if (ch.vel.y > 0 && py + ch.h <= s.min.y + 0.3) {
          ch.pos.y = s.min.y - ch.h - 0.001;
          ch.vel.y = 0;
        } else {
          ch.pos.y = s.max.y;
          ch.vel.y = Math.max(0, ch.vel.y);
          grounded = true;
          ground = s;
        }
      }
    }
    ch.grounded = grounded;
    ch.ground = ground;
    if (grounded && ground && ground.o) {
      if (ground.o.bounce) {
        ch.vel.y = ground.o.bounce;
        ch.grounded = false;
        game.sound.bounce();
      }
      if (ground.o.crumble && ground.crumbleT < 0) ground.crumbleT = 0;
    }
  }

  overlaps(ch, s) {
    return ch.pos.x - ch.r < s.max.x && ch.pos.x + ch.r > s.min.x
      && ch.pos.y < s.max.y && ch.pos.y + ch.h > s.min.y
      && ch.pos.z - ch.r < s.max.z && ch.pos.z + ch.r > s.min.z;
  }

  resolveAxis(ch, list, ax, wasGrounded, game) {
    for (const s of list) {
      if (!this.overlaps(ch, s)) continue;
      const rise = s.max.y - ch.pos.y;
      if (wasGrounded && rise > 0 && rise <= 0.36 && !s.catSolid) {
        ch.pos.y = s.max.y;
        continue;
      }
      if (s.o && s.o.pushable) {
        if (ch.canPush && this.pushCrate(s, ch, ax, list)) continue;
        if (!ch.canPush && ch.isActive) game.hint('crate', 'Too heavy for Asher. Swap to Cappuccino: she can push it.');
      }
      if (s.o && s.o.breakable === 'dash' && ch.dashing) {
        this.removeSolid(s);
        game.sound.door();
        game.poof(s.cur.x, s.cur.y - s.h / 2, s.cur.z);
        if (s.o.onBreak) s.o.onBreak();
        continue;
      }
      if (s.o && s.o.breakable === 'dash' && ch.isActive && !ch.dashing) game.hint('dash' + s.mesh.id, s.o.hint || 'Something heavy blocks the way.');
      const c = ax === 'x' ? (s.min.x + s.max.x) / 2 : (s.min.z + s.max.z) / 2;
      if (ax === 'x') ch.pos.x = ch.pos.x < c ? s.min.x - ch.r - 0.001 : s.max.x + ch.r + 0.001;
      else ch.pos.z = ch.pos.z < c ? s.min.z - ch.r - 0.001 : s.max.z + ch.r + 0.001;
      ch.hitWall = s;
    }
  }

  hasSupport(ch, list) {
    const x0 = ch.pos.x - 0.12;
    const x1 = ch.pos.x + 0.12;
    const z0 = ch.pos.z - 0.12;
    const z1 = ch.pos.z + 0.12;
    for (const s of list) {
      if (s.max.y < ch.pos.y - 0.65 || s.max.y > ch.pos.y + 0.05) continue;
      if (x0 < s.max.x && x1 > s.min.x && z0 < s.max.z && z1 > s.min.z) return true;
    }
    return false;
  }

  pushCrate(s, ch, ax, list) {
    const pen = ax === 'x'
      ? (ch.pos.x < (s.min.x + s.max.x) / 2 ? ch.pos.x + ch.r - s.min.x : ch.pos.x - ch.r - s.max.x)
      : (ch.pos.z < (s.min.z + s.max.z) / 2 ? ch.pos.z + ch.r - s.min.z : ch.pos.z - ch.r - s.max.z);
    const dx = ax === 'x' ? pen + Math.sign(pen) * 0.002 : 0;
    const dz = ax === 'z' ? pen + Math.sign(pen) * 0.002 : 0;
    for (const o of list) {
      if (o === s || o.catSolid) continue;
      if (s.min.x + dx < o.max.x && s.max.x + dx > o.min.x && s.min.y + 0.05 < o.max.y && s.max.y > o.min.y && s.min.z + dz < o.max.z && s.max.z + dz > o.min.z) return false;
    }
    this.setSolidCenter(s, s.cur.x + dx, s.cur.y, s.cur.z + dz);
    s.delta.set(0, 0, 0);
    return true;
  }

  crateGravity(s, dt) {
    s.vy -= GRAVITY * dt;
    let dy = s.vy * dt;
    for (const o of this.solids) {
      if (o === s || !o.active || !o.solidNow) continue;
      if (s.min.x < o.max.x - 0.01 && s.max.x > o.min.x + 0.01 && s.min.z < o.max.z - 0.01 && s.max.z > o.min.z + 0.01) {
        if (o.max.y <= s.min.y + 0.01 && s.min.y + dy < o.max.y) { dy = o.max.y - s.min.y; s.vy = 0; }
      }
    }
    if (dy !== 0) this.setSolidCenter(s, s.cur.x, s.cur.y + dy, s.cur.z);
    s.delta.set(0, 0, 0);
    if (s.cur.y < this.killY) { this.setSolidCenter(s, s.base.x, s.base.y, s.base.z); s.vy = 0; }
  }

  resetCrumbles() {
    for (const s of this.solids) {
      if (s.o.crumble) {
        s.active = true;
        s.crumbleT = -1;
        s.mesh.visible = true;
        s.mesh.material.opacity = 1;
        s.mesh.position.y = s.cur.y - s.h / 2;
      }
    }
  }

  dispose() {
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material && !Array.isArray(o.material) && ![...matCache.values()].includes(o.material)) {
        if (o.material.map) o.material.map.dispose();
        o.material.dispose();
      }
    });
    if (this.scene.background && this.scene.background.dispose) this.scene.background.dispose();
  }
}

// ---------- small meshes ----------
export function makeFish() {
  const g = new THREE.Group();
  const m = new THREE.MeshLambertMaterial({ color: 0xff9f6b, emissive: 0x552200 });
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), m);
  b.scale.set(1.3, 0.8, 0.5);
  g.add(b);
  const t = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.22, 3), m);
  t.rotation.z = Math.PI / 2;
  t.position.x = -0.36;
  g.add(t);
  g.position.y = 0.5;
  return g;
}

export function makeNote() {
  const g = new THREE.Group();
  const m = new THREE.MeshLambertMaterial({ color: 0xffd678, emissive: 0xc98a1a });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12), m);
  head.scale.set(1.25, 0.9, 0.7);
  head.rotation.z = 0.35;
  g.add(head);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8), m);
  stem.position.set(0.33, 0.6, 0);
  g.add(stem);
  const flag = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.08), m);
  flag.position.set(0.48, 1.12, 0);
  flag.rotation.z = -0.5;
  g.add(flag);
  const light = new THREE.PointLight(0xffd678, 6, 8);
  light.position.y = 0.5;
  g.add(light);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.18, depthWrite: false }));
  g.add(halo);
  return g;
}

export function makeGem(color) {
  const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.35), new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.4, flatShading: true }));
  return m;
}
