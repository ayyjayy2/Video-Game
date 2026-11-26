import * as THREE from 'three';
import { buildCat, animateCat } from './cat.js';
import { GRAVITY } from './level.js';
import { Input } from './input.js';
import { Sound } from './audio.js';
import { UI } from './ui.js';
import { WORLDS, ABILITIES, INTRO, INTRO_TALK, AFTER, ENDING } from './story.js';
import { LEVELS } from './levels/index.js';

const V = THREE.Vector3;
const STATS = { asher: { speed: 7.5, jump: 11.5 }, capp: { speed: 5.6, jump: 9.6 } };
const SAVE_KEY = 'whisker-worlds-save-v1';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const lerpAngle = (a, b, t) => {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
};

function freshSave() {
  return { notes: [], treats: 0, abilities: {}, seenIntro: false, done: false, collar: -1 };
}

export class Game {
  constructor() {
    this.canvas = document.getElementById('view');
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 400);
    this.input = new Input(this.canvas, document.getElementById('touchLayer'));
    this.sound = new Sound();
    this.ui = new UI();
    this.save = this.loadSave();
    this.hints = new Set();
    this.state = 'title';
    this.level = null;
    this.yaw = Math.PI;
    this.pitch = 0.38;
    this.camDist = 6.2;
    this.camTarget = new V();
    this.senseT = 0;
    this.skillIndex = 0;
    this.carrying = false;

    this.cats = { capp: this.makeChar('capp'), asher: this.makeChar('asher') };
    this.active = this.cats.asher;
    this.follower = this.cats.capp;
    this.active.isActive = true;
    this.applyCollar();

    // Firefly lantern companion
    this.firefly = new THREE.Group();
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfff08a }));
    this.firefly.add(bulb);
    this.fireflyLight = new THREE.PointLight(0xffe27a, 12, 12);
    this.firefly.add(this.fireflyLight);

    window.addEventListener('resize', () => this.resize());
    this.resize();
    this.last = performance.now();
    requestAnimationFrame((t) => this.frame(t));
    window.game = this;
  }

  makeChar(kind) {
    const model = buildCat(kind);
    return { kind, model, pos: new V(), vel: new V(), r: 0.36, h: 0.95, grounded: false, ground: null, facing: 0, coyote: 0, isActive: false, waiting: false, dashT: 0, dashing: false, chargeT: 0, gliding: false, stuckT: 0, canPush: kind === 'capp', careful: false, jumpBuffer: 0 };
  }

  // ---------- save ----------
  loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return Object.assign(freshSave(), JSON.parse(raw));
    } catch (e) { /* storage unavailable */ }
    return freshSave();
  }

  persist() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.save)); } catch (e) { /* ignore */ }
  }

  resetSave() {
    this.save = freshSave();
    this.persist();
    this.applyCollar();
  }

  // ---------- helpers used by levels ----------
  say(lines) { return this.ui.say(lines); }
  objective(t) { this.ui.objective(t); }
  toast(t, ms) { this.ui.toast(t, ms); }
  hint(key, text) {
    if (this.hints.has(key)) return;
    this.hints.add(key);
    this.ui.toast(text, 3600);
  }

  poof(x, y, z) {
    const L = this.level;
    if (!L) return;
    const parts = [];
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
    for (let i = 0; i < 8; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 5), m);
      p.position.set(x, y + 0.5, z);
      p.userData.v = new V(Math.random() - 0.5, Math.random() * 0.8, Math.random() - 0.5).multiplyScalar(5);
      L.add(p);
      parts.push(p);
    }
    const start = L.t;
    L.every((t, dt) => {
      const k = (t - start) / 0.6;
      parts.forEach((p) => { p.position.addScaledVector(p.userData.v, dt); p.scale.setScalar(1 + k); });
      m.opacity = Math.max(0, 0.9 * (1 - k));
      if (k >= 1) { parts.forEach((p) => { L.scene.remove(p); p.geometry.dispose(); }); return false; }
      return true;
    });
  }

  skills() { return ['spring', 'dash', 'echo'].filter((s) => this.save.abilities[s]); }
  selectedSkill() {
    const s = this.skills();
    if (!s.length) return null;
    return s[this.skillIndex % s.length];
  }

  nextWorld() {
    for (const w of WORLDS) {
      if (w.id === 'finale') return this.save.done ? null : w;
      if (!this.save.notes.includes(w.id)) return w;
    }
    return null;
  }

  applyCollar() {
    const colors = [0xd5857e, 0x2bb3b0, 0xffc93c, 0x8a68c9, 0xe63946];
    for (const c of Object.values(this.cats)) {
      c.model.collar.visible = this.save.collar >= 0;
      if (this.save.collar >= 0) c.model.collar.material.color.setHex(colors[this.save.collar % colors.length]);
    }
  }

  setActive(kind) {
    if (this.active.kind === kind) return;
    this.swap(true);
  }

  // ---------- flow ----------
  async start() {
    this.sound.init();
    document.getElementById('title').hidden = true;
    if (!this.save.seenIntro) {
      this.state = 'cards';
      await this.ui.cards(INTRO);
      this.save.seenIntro = true;
      this.persist();
      await this.load('hub');
      await this.say(INTRO_TALK);
    } else {
      await this.load('hub');
    }
  }

  async load(id, opts = {}) {
    this.state = 'loading';
    const meta = WORLDS.find((w) => w.id === id);
    if (meta) this.ui.showLoading(meta.name, meta.img, meta.tip, meta.color);
    else this.ui.showLoading('Apartment 41C', 'art/hub-apartment.jpg', this.nextWorld() ? `Next: ${this.nextWorld().name}, in ${this.nextWorld().where}.` : 'Every note is home.');
    document.body.classList.add('playing');
    await wait(60);
    if (this.level) this.level.dispose();
    this.carrying = false;
    this.senseT = 0;
    const L = LEVELS[id](this, opts);
    this.level = L;
    L.add(this.cats.capp.model.root);
    L.add(this.cats.asher.model.root);
    L.add(this.firefly);
    const sp = opts.spawn || L.spawn;
    const facing = opts.facing ?? L.spawnFacing;
    this.placeCats(sp, facing);
    L.checkpoint = { pos: sp.clone(), facing };
    this.yaw = facing + Math.PI;
    this.camTarget.copy(sp).add(new V(0, 1.1, 0));
    this.sound.startMusic(L.music);
    this.ui.objective(L.startObjective || '');
    this.renderer.compile(L.scene, this.camera);
    await wait(meta ? 900 : 500);
    this.ui.hideLoading();
    this.state = 'play';
    if (L.onStart) await L.onStart();
  }

  placeCats(p, facing) {
    const a = this.active;
    const f = this.follower;
    a.pos.copy(p);
    a.vel.set(0, 0, 0);
    a.facing = facing;
    f.pos.set(p.x - Math.sin(facing) * 1.3 + Math.cos(facing) * 0.6, p.y + 0.05, p.z - Math.cos(facing) * 1.3);
    f.vel.set(0, 0, 0);
    f.facing = facing;
    f.waiting = false;
    a.grounded = f.grounded = false;
    a.ground = f.ground = null;
  }

  enterWorld(id) {
    this.sound.chime();
    this.load(id);
  }

  async collectNote(id) {
    const meta = WORLDS.find((w) => w.id === id);
    this.state = 'cards';
    this.sound.homesong(meta.n, 0.32);
    if (!this.save.notes.includes(id)) this.save.notes.push(id);
    const ab = meta.ability;
    const fresh = ab && !this.save.abilities[ab];
    if (ab) this.save.abilities[ab] = true;
    this.persist();
    await wait(400);
    await this.ui.card({
      title: `${meta.note === 'Do2' ? 'Do' : meta.note} is home`,
      img: meta.img, color: meta.color,
      text: fresh ? `New ability: ${ABILITIES[ab].name}. ${ABILITIES[ab].desc}` : 'The note returns to the music box.',
    });
    const after = AFTER[id];
    if (after && fresh) {
      await this.ui.card(after.card);
      await this.load('hub', { fromWorld: id });
      await this.say(after.talk);
    } else {
      await this.load('hub', { fromWorld: id });
    }
  }

  async finishGame() {
    this.state = 'cards';
    this.save.done = true;
    this.persist();
    this.sound.stopMusic();
    this.sound.homesong(8, 0.45);
    await this.ui.cards(ENDING);
    await this.load('hub', { fromWorld: 'finale' });
  }

  // ---------- main loop ----------
  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = w < h ? 72 : 60;
    this.camera.updateProjectionMatrix();
  }

  frame(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000) || 0.016;
    this.last = now;
    const inp = this.input;
    inp.update(dt);
    const modal = this.ui.modal;
    if (modal === 'dialog' || modal === 'card') {
      if (inp.consume('jump') || inp.consume('paw') || inp.consume('confirm')) { this.sound.click(); this.ui.advance(); }
    } else if (modal === 'duet') {
      if ((inp.consume('jump') || inp.consume('paw') || inp.consume('confirm')) && this.ui.duetTap) this.ui.duetTap();
    } else if (modal === 'menu') {
      if (inp.consume('pause')) this.ui.hideMenu();
    } else if (modal === 'map') {
      if (inp.consume('map') || inp.consume('pause') || inp.consume('confirm')) this.ui.hideMap();
    } else if (this.state === 'play' && this.level) {
      if (inp.consume('pause')) this.ui.showMenu(this.level.id !== 'hub');
      else if (inp.consume('map')) this.ui.showMap(this);
      else this.update(dt);
    }
    if (this.level) {
      this.animate(dt);
      this.renderer.render(this.level.scene, this.camera);
    }
    inp.endFrame();
    requestAnimationFrame((t) => this.frame(t));
  }

  update(dt) {
    const L = this.level;
    this.senseT = Math.max(0, this.senseT - dt);
    L.update(dt, this);

    // Sitting cats double as a step for Asher to jump from (Boost).
    const catSolids = [];
    const f = this.follower;
    if (!this.carrying && f.grounded && Math.hypot(f.vel.x, f.vel.z) < 0.6) {
      catSolids.push({ min: new V(f.pos.x - 0.42, f.pos.y, f.pos.z - 0.42), max: new V(f.pos.x + 0.42, f.pos.y + 0.75, f.pos.z + 0.42), catSolid: true, owner: f, o: {}, active: true, solidNow: true, delta: new V() });
    }
    this.updatePlayer(dt, catSolids);
    this.updateFollower(dt, catSolids);
    this.updateZones(dt);
    this.updateCamera(dt);
    this.ui.hudUpdate(this);
  }

  updatePlayer(dt, catSolids) {
    const c = this.active;
    const L = this.level;
    const inp = this.input;
    const st = STATS[c.kind];
    c.careful = c.kind === 'capp';
    c.isActive = true;
    c.canPush = c.kind === 'capp';

    const fx = -Math.sin(this.yaw);
    const fz = -Math.cos(this.yaw);
    const wx = fx * inp.move.y + -fz * inp.move.x;
    const wz = fz * inp.move.y + fx * inp.move.x;
    const wl = Math.hypot(wx, wz);
    let speed = st.speed * (this.carrying ? 0.82 : 1) * (c.chargeT > 0 ? 0.25 : 1) * (c.gliding ? 1.12 : 1);

    if (c.dashT > 0) {
      c.dashT -= dt;
      c.dashing = true;
      c.vel.x = Math.sin(c.facing) * 16;
      c.vel.z = Math.cos(c.facing) * 16;
    } else {
      c.dashing = false;
      const k = c.grounded ? 14 : 7;
      c.vel.x += (wx * speed - c.vel.x) * Math.min(1, k * dt);
      c.vel.z += (wz * speed - c.vel.z) * Math.min(1, k * dt);
      if (wl > 0.1) c.facing = lerpAngle(c.facing, Math.atan2(wx, wz), Math.min(1, dt * 12));
    }

    // Jump (with coyote time and a small buffer)
    c.coyote = c.grounded ? 0.12 : c.coyote - dt;
    if (inp.consume('jump')) c.jumpBuffer = 0.14;
    else c.jumpBuffer -= dt;
    if (c.jumpBuffer > 0 && c.coyote > 0) {
      let v = st.jump * (this.carrying ? 0.88 : 1);
      if (c.ground && c.ground.catSolid && c.kind === 'asher') {
        v = 14.5;
        this.hint('boost', 'Boost! Asher springs off Cappuccino\'s back.');
      }
      c.vel.y = v;
      c.coyote = 0;
      c.jumpBuffer = 0;
      c.grounded = false;
      this.sound.jump(v > 12);
    }

    // Glide
    c.gliding = !!this.save.abilities.glide && !c.grounded && inp.held.jump && c.vel.y < 0;
    c.vel.y -= GRAVITY * dt;
    if (c.gliding) c.vel.y = Math.max(c.vel.y, -2.4);
    c.vel.y = Math.max(c.vel.y, -28);

    // Vents: bubbles, gusts, warm wind
    for (const v of L.vents) {
      if (!v.enabled()) continue;
      const d = Math.hypot(c.pos.x - v.x, c.pos.z - v.z);
      if (d < v.r && c.pos.y > v.bottom - 0.5 && c.pos.y < v.top) c.vel.y = Math.max(c.vel.y, v.speed);
    }

    // Skills
    const sk = this.selectedSkill();
    if (sk === 'spring') {
      if (inp.held.skill && c.grounded) c.chargeT = Math.min(0.8, c.chargeT + dt);
      else if (c.chargeT > 0) {
        if (c.grounded || c.coyote > 0) {
          c.vel.y = 11.5 + 6.5 * (c.chargeT / 0.8);
          c.grounded = false;
          this.sound.jump(true);
        }
        c.chargeT = 0;
      }
      inp.consume('skill');
    } else {
      c.chargeT = 0;
      if (inp.consume('skill')) {
        if (sk === 'dash') {
          if (c.kind === 'asher') { c.dashT = 0.35; this.sound.dash(); } else this.toast('Spin Dash is Asher\'s move. Swap to him.');
        } else if (sk === 'echo') this.echo(c);
      }
    }
    if (inp.consume('cycle') && this.skills().length > 1) {
      this.skillIndex++;
      this.sound.click();
      this.toast('Skill: ' + ABILITIES[this.selectedSkill()].name, 1200);
    }

    // Paw: interact, or the cat's own move
    if (inp.consume('paw')) {
      const it = this.nearInteract;
      if (it) {
        if (it.who !== 'any' && it.who !== c.kind) {
          if (it.who === 'capp') this.say([['asher', 'Hmm. This needs a calm, careful touch. That\'s Cappuccino.']]);
          else this.say([['capp', 'This one needs a bold, bouncy cat. Asher\'s department.']]);
        } else it.use(c);
      } else if (c.kind === 'asher') {
        if (c.grounded) {
          c.vel.x = Math.sin(c.facing) * 11;
          c.vel.z = Math.cos(c.facing) * 11;
          c.vel.y = 5;
          c.grounded = false;
          this.sound.jump(false);
        }
      } else {
        this.senseT = 8;
        this.sound.sense();
        this.toast('Whisker Sense: hidden things shimmer for a few seconds.', 1800);
      }
    }

    if (inp.consume('swap')) this.swap();
    if (inp.consume('recenter')) this.yaw = c.facing + Math.PI;

    const wasGrounded = c.grounded;
    const vyBefore = c.vel.y;
    L.moveChar(c, dt, L.collidables(c, catSolids), this);
    if (!wasGrounded && c.grounded && vyBefore < -7) this.sound.land();
    if (c.edgeStopped && wl > 0.3) this.hint('careful', 'Cappuccino is careful: she won\'t walk off an edge. Press Jump to hop down.');

    // Falling, water, hazards
    let fall = c.pos.y < L.killY;
    if (L.waterY !== null && c.pos.y < L.waterY) fall = true;
    for (const h of L.hazards) if (h.active && this.inBox(c, h)) fall = true;
    if (fall) this.respawn();
  }

  inBox(c, b) {
    return c.pos.x > b.min.x && c.pos.x < b.max.x && c.pos.y + 0.5 > b.min.y && c.pos.y < b.max.y && c.pos.z > b.min.z && c.pos.z < b.max.z;
  }

  updateFollower(dt, catSolids) {
    const f = this.follower;
    const p = this.active;
    const L = this.level;
    f.isActive = false;
    f.careful = false;
    f.dashing = false;
    if (this.carrying) {
      f.pos.set(p.pos.x - Math.sin(p.facing) * 0.1, p.pos.y + 0.72, p.pos.z - Math.cos(p.facing) * 0.1);
      f.facing = p.facing;
      f.vel.set(0, 0, 0);
      f.grounded = true;
      return;
    }
    if (f.waiting) {
      f.vel.x = 0;
      f.vel.z = 0;
    } else {
      const tx = p.pos.x - Math.sin(p.facing) * 1.5;
      const tz = p.pos.z - Math.cos(p.facing) * 1.5;
      const dx = tx - f.pos.x;
      const dz = tz - f.pos.z;
      const d = Math.hypot(dx, dz);
      const st = STATS[f.kind];
      if (d > 0.9) {
        const sp = Math.min(st.speed * 1.2, d * 3);
        f.vel.x += ((dx / d) * sp - f.vel.x) * Math.min(1, dt * 10);
        f.vel.z += ((dz / d) * sp - f.vel.z) * Math.min(1, dt * 10);
        f.facing = lerpAngle(f.facing, Math.atan2(dx, dz), Math.min(1, dt * 10));
      } else {
        f.vel.x *= 0.8;
        f.vel.z *= 0.8;
      }
      if (f.grounded && p.pos.y > f.pos.y + 0.5 && d < 4.5) { f.vel.y = st.jump; f.grounded = false; }
      const far = d > 10 || (p.grounded && Math.abs(p.pos.y - f.pos.y) > 2.2) || (p.grounded && !f.grounded && f.pos.y < p.pos.y - 1.5);
      f.stuckT = far ? f.stuckT + dt : 0;
    }
    f.vel.y = Math.max(f.vel.y - GRAVITY * dt, -28);
    L.moveChar(f, dt, L.collidables(f, catSolids), this);
    let lost = f.pos.y < L.killY || (L.waterY !== null && f.pos.y < L.waterY);
    for (const h of L.hazards) if (h.active && this.inBox(f, h)) lost = true;
    if (lost && f.waiting) {
      f.waiting = false;
    }
    if ((f.stuckT > 0.8 || lost) && p.grounded && !f.waiting) {
      f.pos.set(p.pos.x - Math.sin(p.facing) * 0.9, p.pos.y + 0.3, p.pos.z - Math.cos(p.facing) * 0.9);
      f.vel.set(0, 0, 0);
      f.stuckT = 0;
      this.poof(f.pos.x, f.pos.y, f.pos.z);
    }
  }

  swap(silent) {
    if (this.carrying || this.level.noSwap) {
      if (!silent) this.toast('Asher is carrying Cappuccino. No swapping now.');
      return;
    }
    const old = this.active;
    this.active = this.follower;
    this.follower = old;
    old.isActive = false;
    old.chargeT = 0;
    old.dashT = 0;
    old.vel.x = 0;
    old.vel.z = 0;
    old.waiting = this.onPlate(old);
    this.active.waiting = false;
    this.active.isActive = true;
    this.active.stuckT = 0;
    if (!silent) {
      this.sound.meow(this.active.kind === 'asher' ? 1.25 : 0.9);
      this.toast(this.active.kind === 'asher' ? 'Asher' : 'Cappuccino', 900);
      if (old.waiting) this.hint('wait', (old.kind === 'asher' ? 'Asher' : 'Cappuccino') + ' will hold that plate until you swap back.');
    }
  }

  setCarry(on) {
    if (on && this.active.kind !== 'asher') { this.carrying = false; this.swap(true); }
    this.carrying = on;
    this.follower.waiting = false;
  }

  echo(c) {
    this.sound.meow(c.kind === 'asher' ? 1.3 : 0.9);
    const L = this.level;
    let n = 0;
    for (const s of L.solids) {
      const d = Math.hypot(s.cur.x - c.pos.x, s.cur.z - c.pos.z);
      if (s.o.reveal === 'echo' && !s.echoed && d < 14) { s.echoed = true; n++; }
      if (s.o.echoBreak && s.active && d < 11) { L.removeSolid(s); n++; if (s.o.onBreak) s.o.onBreak(); }
    }
    // Ripple visual
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 6, 40), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.copy(c.pos).add(new V(0, 0.6, 0));
    L.add(ring);
    const start = L.t;
    L.every((t) => {
      const k = (t - start) / 0.8;
      ring.scale.setScalar(1 + k * 12);
      ring.material.opacity = 0.8 * (1 - k);
      if (k >= 1) { L.scene.remove(ring); ring.geometry.dispose(); ring.material.dispose(); return false; }
      return true;
    });
    if (n) this.sound.chime();
  }

  onPlate(c) {
    for (const p of this.level.plates) {
      if (Math.abs(c.pos.x - p.x) < p.w / 2 && Math.abs(c.pos.z - p.z) < p.d / 2 && Math.abs(c.pos.y - p.top) < 0.4) return true;
    }
    return false;
  }

  respawn() {
    const L = this.level;
    const cp = L.checkpoint;
    this.sound.splash();
    this.ui.flash();
    this.active.pos.copy(cp.pos);
    this.active.vel.set(0, 0, 0);
    this.active.chargeT = 0;
    this.active.dashT = 0;
    if (!this.follower.waiting) {
      this.follower.pos.set(cp.pos.x - Math.sin(cp.facing) * 1.2, cp.pos.y + 0.1, cp.pos.z - Math.cos(cp.facing) * 1.2);
      this.follower.vel.set(0, 0, 0);
    }
    this.active.grounded = false;
    this.active.ground = null;
    L.resetCrumbles();
    if (L.onRespawn) L.onRespawn();
  }

  updateZones(dt) {
    const L = this.level;
    const c = this.active;
    // Plates
    for (const p of L.plates) {
      let pressed = false;
      for (const k of [this.active, this.follower]) {
        if (this.carrying && k === this.follower) continue;
        if (Math.abs(k.pos.x - p.x) < p.w / 2 && Math.abs(k.pos.z - p.z) < p.d / 2 && Math.abs(k.pos.y - p.top) < 0.4) pressed = true;
      }
      for (const s of L.solids) {
        if (s.o.pushable && Math.abs(s.cur.x - p.x) < p.w / 2 + 0.4 && Math.abs(s.cur.z - p.z) < p.d / 2 + 0.4 && Math.abs(s.min.y - p.top) < 0.35) pressed = true;
      }
      if (pressed !== p.pressed) {
        p.pressed = pressed;
        p.glow.material.emissive.setHex(pressed ? 0x886622 : 0x000000);
        p.glow.position.y = p.top + (pressed ? -0.02 : 0.02);
        this.sound.click();
        if (p.onChange) p.onChange(pressed);
      }
    }
    // Triggers
    for (const t of L.triggers) {
      if (t.done) continue;
      if (this.inBox(c, t)) { if (t.once) t.done = true; t.fn(); }
    }
    // Pickups
    for (const p of L.pickups) {
      if (p.taken) continue;
      if (p.visibleWhen && !p.visibleWhen()) continue;
      const d = Math.hypot(c.pos.x - p.pos.x, c.pos.y + 0.5 - p.pos.y, c.pos.z - p.pos.z);
      if (d < p.r) {
        p.taken = true;
        p.mesh.visible = false;
        if (p.kind === 'treat') { this.save.treats++; this.sound.collect(); }
        else if (p.kind === 'note') { this.collectNote(L.id); }
        else { this.sound.item(); if (p.label) this.toast(p.label); }
        if (p.onPick) p.onPick();
      }
    }
    // Sunbeam checkpoints
    for (const cp of L.checkpoints) {
      if (Math.hypot(c.pos.x - cp.pos.x, c.pos.z - cp.pos.z) < 1.6 && Math.abs(c.pos.y - cp.pos.y) < 1.5 && c.grounded) {
        if (L.checkpoint.pos.distanceTo(cp.pos) > 0.5) {
          L.checkpoint = { pos: cp.pos.clone(), facing: c.facing };
          if (!cp.reached) { this.toast('Sunbeam: you will come back here if you fall.', 1800); this.sound.chime(); }
          cp.reached = true;
          this.persist();
        }
      }
    }
    // Interactables
    let best = null;
    let bestD = 1e9;
    for (const it of L.interacts) {
      if (!it.enabled()) continue;
      const d = Math.hypot(c.pos.x - it.pos.x, (c.pos.y - it.pos.y) * 1.5, c.pos.z - it.pos.z);
      if (d < it.r && d < bestD) { best = it; bestD = d; }
    }
    this.nearInteract = best;
    if (best) {
      const label = typeof best.label === 'function' ? best.label() : best.label;
      const who = best.who === 'capp' ? ' (Cappuccino)' : best.who === 'asher' ? ' (Asher)' : '';
      this.ui.prompt(`Paw: ${label}${who}`);
    } else this.ui.prompt('');
    // Darkness and the firefly lantern
    let inDark = false;
    for (const z of L.darkZones) if (c.pos.x > z.minX && c.pos.x < z.maxX && c.pos.z > z.minZ && c.pos.z < z.maxZ) inDark = true;
    const lantern = !!this.save.abilities.lantern;
    this.ui.darkness(inDark ? (lantern ? 0.25 : 0.82) : 0);
    this.inDark = inDark;
    this.firefly.visible = lantern && (inDark || L.alwaysLantern);
    if (this.firefly.visible) {
      const t = L.t;
      this.firefly.position.set(c.pos.x + Math.cos(t * 2) * 0.8, c.pos.y + 1.8 + Math.sin(t * 3) * 0.2, c.pos.z + Math.sin(t * 2) * 0.8);
    }
  }

  updateCamera(dt) {
    const inp = this.input;
    const c = this.active;
    this.yaw -= inp.look.x;
    this.pitch = Math.max(0.05, Math.min(1.15, this.pitch + inp.look.y));
    this.camDist = Math.max(3.5, Math.min(11, this.camDist + inp.zoom * 0.5));
    const idle = performance.now() - inp.lastLook > 1400;
    const moving = Math.hypot(c.vel.x, c.vel.z) > 1;
    if (idle && moving && Math.abs(inp.move.y) > 0.2) this.yaw = lerpAngle(this.yaw, c.facing + Math.PI, Math.min(1, dt * 1.2));
    const goal = new V(c.pos.x, c.pos.y + 1.1, c.pos.z);
    this.camTarget.lerp(goal, 1 - Math.exp(-dt * 10));
  }

  animate(dt) {
    const L = this.level;
    const t = L.t;
    for (const c of [this.cats.capp, this.cats.asher]) {
      const m = c.model;
      m.root.position.copy(c.pos);
      m.root.rotation.y = c.facing;
      const sp = Math.hypot(c.vel.x, c.vel.z) / STATS[c.kind].speed;
      animateCat(m, { speed: sp, grounded: c.grounded, vy: c.vel.y, time: t, gliding: c.gliding, dash: c.dashing, forceSit: (c.waiting || (this.carrying && c === this.follower)) }, dt);
    }
    // Camera
    const cp = Math.cos(this.pitch);
    const dir = new V(Math.sin(this.yaw) * cp, Math.sin(this.pitch), Math.cos(this.yaw) * cp);
    // Pull the camera in front of anything solid between it and the cat.
    let d = this.camDist;
    const o = this.camTarget;
    for (const s of L.solids) {
      if (!s.active || !s.solidNow || s.o.noCam) continue;
      let tmin = 0;
      let tmax = d;
      let hit = true;
      for (const ax of ['x', 'y', 'z']) {
        const dv = dir[ax];
        const lo = s.min[ax] - 0.15;
        const hi = s.max[ax] + 0.15;
        if (Math.abs(dv) < 1e-6) { if (o[ax] < lo || o[ax] > hi) { hit = false; break; } continue; }
        let t1 = (lo - o[ax]) / dv;
        let t2 = (hi - o[ax]) / dv;
        if (t1 > t2) [t1, t2] = [t2, t1];
        tmin = Math.max(tmin, t1);
        tmax = Math.min(tmax, t2);
        if (tmin > tmax) { hit = false; break; }
      }
      if (hit && tmin > 0.2 && tmin < d) d = tmin;
    }
    this.camDistNow = this.camDistNow === undefined ? d : (d < this.camDistNow ? d : this.camDistNow + (d - this.camDistNow) * Math.min(1, dt * 3));
    d = Math.max(1.2, this.camDistNow - 0.1);
    this.camera.position.copy(o).addScaledVector(dir, d);
    if (L.camFloor !== undefined) this.camera.position.y = Math.max(this.camera.position.y, L.camFloor);
    this.camera.lookAt(this.camTarget);
    if (L.sun) {
      L.sun.position.copy(this.active.pos).add(L.sunOffset);
      L.sun.target.position.copy(this.active.pos);
    }
  }
}
