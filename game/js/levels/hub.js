import * as THREE from 'three';
import { Level, mat } from '../level.js';
import { rug, books, palm, lantern, woodTexture, texturedMat, star } from '../props.js';
import { WORLDS } from '../story.js';

const V = THREE.Vector3;

// The apartment, built at cat scale with low cut-away walls like the concept art.
// North row: bathroom, bedroom, laundry closet. South row: kitchen, living room, study and balcony.
export function buildHub(game, opts = {}) {
  const L = new Level(game, 'hub');
  const save = game.save;
  const has = (a) => !!save.abilities[a];
  L.music = 'Do';
  L.setSky('#3b2f45', '#ffc9a3', 0xe8d2c4, 60, 160);
  L.lights({ sky: 0xfff3e6, ground: 0x8a6a5a, hemi: 1.5, sun: 0xffe2c0, sunI: 1.4, dir: [10, 24, 14] });
  L.killY = -10;

  const WALL = 0x5e4570;
  const WALL_H = 2.6;
  const wood = texturedMat(woodTexture(), 16, 12);
  // Floors per room
  L.box(0, 0, 0, 64, 48, 1, 0xb9805a, { mat: wood });
  const tile = (x0, z0, x1, z1, c) => L.box((x0 + x1) / 2, 0.02, (z0 + z1) / 2, x1 - x0, z1 - z0, 0.05, c, { deco: true, cast: false });
  tile(-32, -24, -12, -6, 0xcfe3df); // bathroom tiles
  tile(12, -24, 32, -6, 0xd9d2e6); // laundry
  tile(16, 10, 32, 24, 0x9c8a7a); // balcony deck

  // Walls (outer and inner), low so the camera can see over them.
  const wall = (x0, z0, x1, z1, h = WALL_H, c = WALL) => L.block((x0 + x1) / 2, (z0 + z1) / 2, Math.max(0.6, x1 - x0), Math.max(0.6, z1 - z0), 0, h, c);
  wall(-32.3, -24.3, 32.3, -23.7); // north
  wall(-32.3, 23.7, 16, 24.3); // south (living, kitchen)
  wall(-32.3, -24, -31.7, 24); // west
  wall(31.7, -24, 32.3, 10); // east (study, laundry)
  // z = -6 divider with doorways
  wall(-32, -6.3, -25, -5.7);
  wall(-19, -6.3, -3, -5.7);
  wall(3, -6.3, 19, -5.7);
  wall(25, -6.3, 32, -5.7);
  // x = -12 (bathroom|bedroom full, kitchen|living with opening)
  wall(-12.3, -24, -11.7, -6);
  wall(-12.3, -6, -11.7, 4);
  wall(-12.3, 12, -11.7, 24);
  // x = 12 (bedroom|laundry)
  wall(11.7, -24, 12.3, -6);
  // x = 16 (living|study+balcony) with a study doorway
  wall(15.7, -6, 16.3, -2);
  wall(15.7, 4, 16.3, 14);
  // study | balcony: glass
  L.block(24, 10, 16, 0.4, 0, 2.6, 0xbfe6ff, { mat: new THREE.MeshLambertMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.35 }) });
  // balcony railing
  L.block(24, 24, 16, 0.3, 0, 1.4, 0x3b3350);
  L.block(32, 17, 0.3, 14, 0, 1.4, 0x3b3350);
  // Bedroom door (Spin Dash)
  const door = L.block(0, -6, 6, 0.6, 0, WALL_H + 0.6, 0x8a5a3c, { breakable: 'dash', hint: 'The bedroom door is shut tight. Something faster and heavier might burst it open.', onBreak: () => game.toast('The bedroom door bursts open!') });
  if (has('dash')) { door.active = false; door.mesh.visible = false; }
  // Balcony fog (Echo Meow)
  const fog = L.block(16, 17, 0.6, 6, 0, WALL_H + 0.4, 0x9a96a8, { echoBreak: true, opacity: 0.85, onBreak: () => game.toast('The fog clears from the balcony door.') });
  if (has('echo')) { fog.active = false; fog.mesh.visible = false; } else wall(15.7, 20, 16.3, 24);
  if (has('echo')) wall(15.7, 20, 16.3, 24);

  // ---------- Bathroom ----------
  const tubC = new V(-22, 0, -15);
  L.block(-22, -17.2, 10, 0.8, 0, 2.4, 0xffffff); // back rim
  L.block(-22, -12.8, 10, 0.8, 0, 2.4, 0xffffff); // front rim
  L.block(-26.6, -15, 0.8, 3.6, 0, 2.4, 0xffffff);
  L.block(-17.4, -15, 0.8, 3.6, 0, 2.4, 0xffffff);
  L.block(-22, -15, 8.4, 3.6, 0, 1.2, 0xffffff);
  L.box(-22, 1.75, -15, 8.4, 3.6, 0.1, 0x9fe3ee, { deco: true, mat: new THREE.MeshLambertMaterial({ color: 0x9fe3ee, transparent: true, opacity: 0.8 }) });
  for (const [x, z] of [[-26.3, -17], [-17.7, -17], [-26.3, -13], [-17.7, -13]]) L.box(x, 0.4, z, 0.6, 0.6, 0.4, 0xc9a227, { deco: true, cyl: true });
  L.box(-22, 1.2, -10.8, 3.4, 2, 1.2, 0x7cc26a); // bath mat step
  L.block(-30, -21, 3, 3, 0, 3.2, 0xffffff); // sink cabinet
  L.block(-30, -9, 2.6, 2.6, 0, 1.6, 0xf3f3f3); // laundry basket
  // ---------- Kitchen ----------
  L.block(-30, 8, 4, 24, 0, 4, 0xf7ece2); // counters along the west wall
  L.box(-30, 4.05, 8, 4.2, 24.2, 0.2, 0x6c7a89, { deco: true });
  L.block(-29, -3.7, 4, 4.4, 0, 8, 0xf2f2e8); // fridge
  const stove = L.block(-21, -3.8, 6, 4, 0, 4.5, 0xefe7da); // stove and oven
  L.box(-21, 2.8, -1.75, 4.2, 0.1, 2.4, 0x2a2238, { deco: true });
  const ovenGlow = L.box(-21, 2.6, -1.68, 3.6, 0.1, 2, 0xffb070, { deco: true, emissive: 0x000000 });
  ovenGlow.material = new THREE.MeshLambertMaterial({ color: 0xffb070, emissive: 0x000000 });
  L.box(-21, 4.6, -3.8, 5.8, 3.8, 0.1, 0x2a2238, { deco: true });
  // Dining table and chairs (far from the stove so the stove needs Bubble Hop)
  L.block(-20, 16, 7, 5, 3.0, 3.4, 0x8a5a3c);
  for (const [x, z] of [[-24, 18.5], [-16, 18.5], [-24, 13.5], [-16, 13.5]]) L.block(x, z, 0.5, 0.5, 0, 3.0, 0x6e4630);
  L.block(-25.5, 16, 2, 2, 0, 1.8, 0x6e4630);
  // Food bowls
  L.box(-15, 0.5, 20, 1.4, 1.4, 0.5, 0xd88344, { deco: true, cyl: true });
  L.box(-13, 0.5, 20, 1.4, 1.4, 0.5, 0x2bb3b0, { deco: true, cyl: true });
  L.interact(-14, 0, 20, { label: 'Eat breakfast', r: 2.4, marker: false, use: () => { game.sound.purr(); game.say([['asher', 'Crunch crunch crunch.'], ['capp', 'Chew, Asher. Chew.']]); } });
  // Bubble vent from the bathroom leak, in front of the stove
  L.vent(-21, -0.4, 1.1, 0, 6.2, 'bubble', () => has('bubble'), 7);
  L.trigger(-23, 0, -2, -19, 1.5, 1.2, () => { if (!has('bubble')) game.hint('stove', 'The stove top is too high to reach. Maybe something will lift you up there later.'); }, false);

  // ---------- Living room ----------
  rug(L, 2, 0, 10, 7, 0xf2d6c2);
  // Sofa
  L.block(2, 18.5, 16, 5, 0, 2.0, 0x5f7d5a);
  L.block(2, 22.3, 16, 2.2, 0, 4.4, 0x56724f);
  L.block(-6.6, 18.5, 1.6, 5, 0, 3.0, 0x56724f);
  L.block(10.6, 18.5, 1.6, 5, 0, 3.0, 0x56724f);
  L.box(-2, 2.6, 19.5, 3, 2, 1.2, 0xd88344, { deco: true });
  L.box(5, 2.6, 19.5, 3, 2, 1.2, 0xf7ece2, { deco: true });
  // Coffee table with the music box, ottoman step
  L.box(2, 2.2, 6, 6, 6, 0.4, 0x8a5a3c, { cyl: true });
  L.block(2, 6, 1, 1, 0, 1.8, 0x6e4630, { cyl: true });
  L.block(-3.2, 9.6, 2.6, 2.6, 0, 1.1, 0xd5857e, { cyl: true });
  const box = new THREE.Group();
  const boxMat = mat(0xc9a227);
  const bb = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 1), boxMat);
  bb.position.y = 0.4;
  box.add(bb);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 1), mat(0xe0bb45));
  lid.position.set(0, 0.86, -0.4);
  lid.rotation.x = save.done ? 0 : -0.9;
  lid.geometry.translate(0, 0, 0.5);
  box.add(lid);
  box.position.set(2, 2.2, 6);
  L.add(box);
  // Cat tree: the collar shop
  L.block(-9, 2, 2.6, 2.6, 0, 1.6, 0xd9b38c);
  L.block(-7.4, 0.4, 2, 2, 0, 3.4, 0xd9b38c);
  L.block(-9, -1.4, 2, 2, 0, 5.2, 0xd9b38c);
  L.box(-8.4, 5.2, 0.4, 0.5, 0.5, 5.2, 0xcaa77f, { deco: true, cyl: true });
  const collarNames = ['rose', 'teal', 'gold', 'violet', 'red'];
  L.interact(-9, 1.6, 2, {
    label: () => (save.treats >= 10 ? 'New collar (10 treats)' : 'Collar shop (needs 10 treats)'), r: 2.6,
    use: () => {
      if (save.treats < 10) { game.toast(`You have ${save.treats} fish treats. Collars cost 10. Find treats in the worlds.`); return; }
      save.treats -= 10;
      save.collar = (save.collar + 1) % collarNames.length;
      game.applyCollar();
      game.persist();
      game.sound.item();
      game.toast(`New ${collarNames[save.collar]} collars for both cats!`);
    },
  });
  // Bookshelf: three stepped columns. The top needs Wind-Up Spring.
  L.block(9.2, -4.3, 2.4, 2.2, 0, 1.8, 0x8a5a3c);
  L.block(11.4, -4.3, 2.0, 2.2, 0, 3.6, 0x8a5a3c);
  L.block(13.4, -4.3, 2.0, 2.2, 0, 7.6, 0x8a5a3c);
  books(L, 8.1, 10.3, 0.1, -3.4, 0.4, 1.3);
  books(L, 10.5, 12.3, 1.9, -3.4, 0.4, 1.3);
  books(L, 12.5, 14.3, 3.8, -3.4, 0.4, 1.3);
  books(L, 12.5, 14.3, 5.7, -3.4, 0.4, 1.3);
  const atlas = L.box(13.4, 7.85, -4.3, 1.6, 1.2, 0.25, 0xe2603d, { deco: true });
  // Potted palm (glide or spring to reach the soil)
  L.block(-0.5, -3, 3, 3, 0, 2.6, 0xd9774a, { cyl: true });
  palm(L, -0.5, 2.6, -3, 1.3);
  // Floor lamp
  L.box(-10, 6, 12, 0.3, 0.3, 6, 0x3b3350, { deco: true, cyl: true });
  lantern(L, -10, 6.2, 12, 0xffd08a, true);

  // ---------- Bedroom ----------
  L.block(0, -16, 12, 9, 0, 3.35, 0x7a5a8a); // bed frame
  const quilt = L.box(0, 3.35, -15.6, 11.4, 8, 0.35, 0xb9a6e3, { deco: true });
  L.box(0, 3.6, -19.4, 6, 1.4, 0.5, 0xffffff, { deco: true });
  L.block(-8.4, -18, 2.4, 2.4, 0, 1.8, 0x8a5a3c); // nightstand
  lantern(L, -8.4, 2.6, -18, 0xffd08a, false);
  star(L, 5, 6, -22.5, 0.6);
  // ---------- Laundry closet (dark until the firefly lantern) ----------
  L.dark(12, -24, 32, -6.3);
  L.block(17, -21.5, 4, 3.6, 0, 3.6, 0xf3f3f8); // washer
  L.block(22, -21.5, 4, 3.6, 0, 3.6, 0xf3f3f8); // dryer
  L.box(17, 2.0, -19.65, 2.4, 0.1, 2.4, 0x9fd3e8, { deco: true, cyl: true }).rotation.x = Math.PI / 2;
  const dryerDoor = L.box(22, 2.0, -19.65, 2.4, 0.1, 2.4, 0xffb38a, { deco: true, cyl: true });
  dryerDoor.rotation.x = Math.PI / 2;
  L.block(28, -21, 4, 4, 0, 2.2, 0xc9b8e0); // laundry basket
  // ---------- Study ----------
  L.block(24, -1, 8, 3.6, 2.8, 3.2, 0x8a5a3c); // desk top
  for (const [x, z] of [[20.4, -2.4], [27.6, -2.4], [20.4, 0.4], [27.6, 0.4]]) L.block(x, z, 0.5, 0.5, 0, 2.8, 0x6e4630);
  L.block(24, 3, 2.4, 2.4, 0, 1.8, 0x6e4630); // chair seat
  L.block(30.6, 4, 2.2, 6, 0, 6, 0x8a5a3c); // second bookshelf
  books(L, 29.6, 31.6, 0.1, 4, 5.6, 1.6);
  // ---------- Balcony ----------
  L.block(29.5, 21.5, 3, 3, 0, 1.6, 0xd9774a, { cyl: true });
  palm(L, 29.5, 1.6, 21.5, 1);
  L.block(19, 21.5, 3, 3, 0, 1.2, 0xd9774a, { cyl: true });
  // Wind chimes
  const chimes = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1 + i * 0.25, 6), mat(0xc9a227));
    tube.position.set(-0.5 + i * 0.25, -0.6 - i * 0.12, 0);
    chimes.add(tube);
  }
  chimes.position.set(24, 4.5, 21);
  L.add(chimes);
  L.every((t) => { chimes.rotation.z = Math.sin(t * 1.3) * 0.08; });
  // City beyond the balcony
  for (let i = 0; i < 26; i++) {
    const h = 10 + ((i * 37) % 30);
    L.box(-40 + i * 4.2, h - 30, 50 + ((i * 13) % 12), 3.4, 3.4, h, i % 2 ? 0x5e548e : 0x6b5f9e, { deco: true, cast: false });
  }

  // ---------- Thresholds ----------
  const TH = {
    w1: { pos: new V(-22, 1.2, -15), r: 3.6, need: () => true },
    w2: { pos: new V(-21, 4.5, -3.8), r: 3.0, need: () => true },
    w3: { pos: new V(13.4, 7.6, -4.3), r: 2.4, need: () => true },
    w4: { pos: new V(-0.5, 2.6, -3), r: 2.6, need: () => true },
    w5: { pos: new V(22, 0, -18.6), r: 3.0, need: () => has('lantern'), why: 'It is too dark in here. Cappuccino will not take another step without a light.' },
    w6: { pos: new V(0, 3.35, -15.6), r: 4.2, need: () => true },
    w7: { pos: new V(24, 0, 21), r: 3.0, need: () => true },
    finale: { pos: new V(2, 2.2, 6), r: 2.8, need: () => save.notes.length >= 7 },
  };
  const next = game.nextWorld();
  for (const w of WORLDS) {
    const th = TH[w.id];
    const done = save.notes.includes(w.id) || (w.id === 'finale' && save.done);
    const isNext = next && next.id === w.id;
    if (!done && !isNext) continue;
    // Glow ring + light
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.08, 8, 40), new THREE.MeshBasicMaterial({ color: isNext ? 0xffd678 : 0x9fe3c8, transparent: true, opacity: 0.9 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.copy(th.pos).add(new V(0, 0.4, 0));
    L.add(ring);
    if (isNext) {
      const pl = new THREE.PointLight(0xffd678, 18, 14);
      pl.position.copy(th.pos).add(new V(0, 1.6, 0));
      L.add(pl);
      const motes = [];
      for (let i = 0; i < 10; i++) {
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffe9a8 }));
        m.userData.o = Math.random();
        m.userData.a = Math.random() * 6.28;
        L.add(m);
        motes.push(m);
      }
      L.every((t) => {
        ring.scale.setScalar(1 + Math.sin(t * 3) * 0.12);
        motes.forEach((m) => {
          const k = (m.userData.o + t * 0.3) % 1;
          m.position.set(th.pos.x + Math.cos(m.userData.a + t) * 1.1, th.pos.y + 0.3 + k * 3, th.pos.z + Math.sin(m.userData.a + t) * 1.1);
        });
      });
      if (w.id === 'w2') ovenGlow.material.emissive.setHex(0xff7a30);
      if (w.id === 'w5') dryerDoor.material = new THREE.MeshLambertMaterial({ color: 0xffb38a, emissive: 0xff7a30 });
    }
    L.interact(th.pos.x, th.pos.y, th.pos.z, {
      label: done ? `Revisit ${w.name}` : `Enter ${w.name}`, r: th.r, marker: false,
      use: () => {
        if (!th.need()) { game.say([['capp', th.why || 'Not yet.']]); return; }
        game.enterWorld(w.id);
      },
    });
  }
  // A grey haze that thins as notes return.
  const greyness = Math.max(0, 1 - save.notes.length / 7);
  L.scene.fog.color.lerp(new THREE.Color(0x9a96a8), greyness * 0.6);
  L.scene.fog.near = 30 + (1 - greyness) * 40;

  // Spawn: by the world you came back from, otherwise on the rug.
  L.spawn = new V(6, 0, 10);
  L.spawnFacing = -2.36;
  if (opts.fromWorld) {
    const back = {
      w1: [new V(-22, 0, -8.5), Math.PI], w2: [new V(-21, 0, 2.5), Math.PI], w3: [new V(9, 0, 0), Math.PI], w4: [new V(-0.5, 0, 1.5), Math.PI],
      w5: [new V(22, 0, -14), Math.PI], w6: [new V(0, 0, -9), Math.PI], w7: [new V(24, 0, 16), Math.PI], finale: [new V(2, 0, 12), Math.PI],
    }[opts.fromWorld];
    if (back) { L.spawn = back[0]; L.spawnFacing = back[1]; }
  }
  L.sunbeam(2, 0, 12);
  L.startObjective = next ? `Go to the glow: ${next.where}` : 'All notes are home. Revisit any world.';
  void atlas; void quilt; void stove; void tubC;
  return L;
}
