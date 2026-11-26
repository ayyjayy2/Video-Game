import * as THREE from 'three';
import { Level, mat } from '../level.js';
import { lantern, post, star, cloud, crystal, skyStars, quiltTexture, texturedMat, bannerString, gear, stiltHouse } from '../props.js';
import { critter } from '../critters.js';

const V = THREE.Vector3;
const treats = (L, list) => list.forEach(([x, y, z]) => L.pickup(x, y + 0.6, z, 'treat'));
const steps = (game, list) => {
  let i = 0;
  const go = (n) => { i = n; game.objective(list[n]); };
  return { go, get: () => i };
};

// ---------------------------------------------------------------- World 5
export function buildW5(game) {
  const L = new Level(game, 'w5');
  L.music = 'Sol';
  L.setSky('#2a1a2e', '#7a2a3a', 0x3a1f2e, 40, 120);
  L.lights({ sky: 0xffe8f0, ground: 0x5a2a3a, hemi: 1.3, sun: 0xfff0d0, sunI: 1.6, dir: [4, 24, 8] });
  L.killY = -8;
  const S = steps(game, [
    'Talk to Ringmaster Argyle',
    'Cross the beat platforms up to the trapeze stand',
    'Swing across the trapezes to the far stand',
    'Reach the high perch and pull the lever',
    'Find the chime in the dark lint caverns',
    'Take the note!',
  ]);
  L.startObjective = 'Talk to Ringmaster Argyle';

  // Ring floor
  L.box(0, 0, 0, 28, 28, 1, 0xf3e3c3, { cyl: true, seg: 40 });
  const ringEdge = new THREE.Mesh(new THREE.TorusGeometry(14, 0.35, 8, 60), mat(0xe63946));
  ringEdge.rotation.x = Math.PI / 2;
  ringEdge.position.y = 0.1;
  L.add(ringEdge);
  // Big top tent
  const tentGeo = new THREE.CylinderGeometry(34, 34, 30, 24, 1, true);
  const tc = document.createElement('canvas');
  tc.width = 256; tc.height = 8;
  const tg = tc.getContext('2d');
  for (let i = 0; i < 16; i++) { tg.fillStyle = i % 2 ? '#fff3e0' : '#e63946'; tg.fillRect(i * 16, 0, 16, 8); }
  const tt = new THREE.CanvasTexture(tc);
  tt.colorSpace = THREE.SRGBColorSpace;
  const tent = new THREE.Mesh(tentGeo, new THREE.MeshLambertMaterial({ map: tt, side: THREE.BackSide }));
  tent.position.y = 8;
  L.add(tent);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(34, 14, 24, 1, true), new THREE.MeshLambertMaterial({ map: tt, side: THREE.BackSide }));
  roof.position.y = 30;
  L.add(roof);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    bannerString(L, Math.cos(a) * 30, Math.sin(a) * 30, 0, 0, 24, [0xffc93c, 0xe63946, 0xb9a6e3, 0x2bb3b0]);
  }
  const spot = new THREE.SpotLight(0xfff0d0, 80, 50, 0.5, 0.5);
  spot.position.set(0, 26, 0);
  L.add(spot);

  // Beat platforms: each is solid for part of a 2.4 second cycle and flickers before it vanishes.
  const beat = (x, top, z, off, color) => {
    const s = L.box(x, top, z, 2.2, 2.2, 0.4, color, { when: () => ((L.t + off) % 2.4) < 1.8 });
    L.every((t) => { const k = (t + off) % 2.4; if (k > 1.4 && k < 1.8) s.mesh.material.opacity = 0.45 + Math.sin(t * 40) * 0.3; });
    return s;
  };
  beat(-3, 1.2, -2, 0, 0xffc93c);
  beat(-5.5, 2.4, -4.5, 1.2, 0x2bb3b0);
  beat(-7.6, 3.6, -7.2, 0, 0xffc93c);
  L.box(-11, 3.6, -11, 6, 6, 0.6, 0x8a5a3c);
  L.trigger(-14, 3, -14, -8, 6, -8, () => { if (S.get() <= 1) S.go(2); });
  // Trapezes
  for (const [cx, sign] of [[-3, 1], [3, -1]]) {
    const tp = L.box(cx, 3.4, -11, 2, 2, 0.4, 0xffffff, { move: (t) => ({ x: sign * Math.sin(t * 1.2) * 2.5 }) });
    for (const sx of [-0.9, 0.9]) {
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 14, 4), mat(0xd9c5a0));
      rope.position.set(sx, 7, 0);
      tp.mesh.add(rope);
    }
  }
  L.box(11, 3.6, -11, 6, 6, 0.6, 0x8a5a3c);
  L.trigger(8, 3, -14, 14, 6, -8, () => {
    if (S.get() <= 2) {
      S.go(3);
      game.hint('boost', 'Too high for one jump. Let Cappuccino sit still next to the perch, then jump onto her back with Asher. Boost! (Or wind up the spring.)');
    }
  });
  // High perch with the lever
  L.box(11, 6.6, -13, 2, 2, 0.5, 0xffc93c);
  const lever = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 6), mat(0xe63946));
  lever.position.set(11, 7.2, -13);
  lever.rotation.z = 0.5;
  L.add(lever);
  // Curtain to the caverns
  const curtain = L.block(13.4, 0, 0.6, 16, 0, 6, 0xb3243a);
  L.interact(11, 6.6, -13, {
    label: 'Pull the lever', r: 2.2, enabled: () => S.get() <= 3,
    use: () => {
      lever.rotation.z = -0.5;
      L.removeSolid(curtain);
      game.sound.door();
      game.toast('The curtain to the lint caverns swings open!');
      S.go(4);
    },
  });
  // Lint caverns (dark)
  L.dark(14, -10, 40, 10);
  L.box(17, 0, 0, 6, 6, 1, 0x8a7f9a);
  L.box(22.5, 0, 0.5, 2.4, 2.4, 0.5, 0xb9a6e3, { reveal: 'lantern' });
  L.box(26, 0.4, -1, 2.4, 2.4, 0.5, 0xb9a6e3, { reveal: 'lantern' });
  L.box(29.5, 0.8, 0.5, 2.4, 2.4, 0.5, 0xb9a6e3, { reveal: 'lantern' });
  L.box(34, 0.8, 0, 6, 6, 1, 0x8a7f9a);
  for (let i = 0; i < 12; i++) cloud(L, 18 + i * 1.8, -3 - (i % 3), (i % 2 ? 5 : -5), 0.7, 0x9a96a8);
  const chime = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.8 + i * 0.2, 8), mat(0xffd678, { emissive: 0x664400 }));
    tube.position.set(-0.3 + i * 0.2, 1.6 - i * 0.1, 0);
    chime.add(tube);
  }
  chime.position.set(34, 0.8, -1.5);
  L.add(chime);
  L.interact(34, 0.8, -1, {
    label: 'Ring the chime', r: 2.6, enabled: () => S.get() === 4,
    use: async () => {
      game.sound.chime();
      await game.say([['asher', 'Found it! Ding ding ding!'], ['Ringmaster Argyle', '(far away) THE SHOW GOES ON!']]);
      L.pickup(34, 2.4, 0.5, 'note');
      S.go(5);
    },
  });

  // Socks in the audience
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.3;
    if (Math.cos(a) > 0.6) continue;
    const s = critter('sock');
    s.position.set(Math.cos(a) * 17, -1, Math.sin(a) * 17);
    s.rotation.y = -a - Math.PI / 2;
    L.add(s);
    const ph = i;
    L.every((t) => { s.position.y = -1 + Math.abs(Math.sin(t * 3 + ph)) * 0.4; });
  }
  L.npc('sock', 0, 0, 6, 0);
  L.interact(0, 0, 6, {
    label: 'Talk to Ringmaster Argyle', r: 2.6,
    use: async () => {
      if (S.get() === 0) {
        await game.say([
          ['Ringmaster Argyle', 'Ladies, gentlemen and cats! Welcome to the Lost Sock Spectacular!'],
          ['Ringmaster Argyle', 'Or there would be a spectacular, if our star had not vanished. Your glowing note became the chime on our trapeze, and it rolled off into the lint caverns.'],
          ['Ringmaster Argyle', 'The curtain to the caverns opens with the lever on the high perch. Cross the beat platforms, swing the trapezes, and up you go!'],
          ['capp', 'Platforms that disappear. Wonderful. Asher, wait for them to appear before you jump.'],
        ]);
        S.go(1);
      } else game.say([['Ringmaster Argyle', 'The show must go on!']]);
    },
  });
  L.sunbeam(-11, 3.6, -11);
  L.sunbeam(12.5, 3.6, -9);
  L.sunbeam(16, 0, 0);
  treats(L, [[-3, 1.2, -2], [-5.5, 2.4, -4.5], [-7.6, 3.6, -7.2], [-12, 3.6, -12], [0, 3.4, -11], [12, 3.6, -10], [11, 6.8, -13], [22.5, 0, 0.5], [26, 0.4, -1], [29.5, 0.8, 0.5], [5, 0, 5], [-6, 0, 6], [6, 0, -4]]);
  L.spawn = new V(0, 0, 10);
  L.spawnFacing = Math.PI;
  L.camFloor = 0.5;
  L.onStart = () => game.say([['asher', 'A circus! Inside the dryer! Best. Day. Ever.'], ['capp', 'Everything is spinning. I would like it to stop spinning.']]);
  return L;
}

// ---------------------------------------------------------------- World 6
export function buildW6(game) {
  const L = new Level(game, 'w6');
  L.music = 'La';
  L.setSky('#120f30', '#6a4aa9', 0x2a2050, 40, 140);
  L.lights({ sky: 0xd8ccff, ground: 0x3a2a5a, hemi: 1.4, sun: 0xe8e0ff, sunI: 1.1, dir: [-6, 22, 8] });
  L.killY = -10;
  skyStars(L, 300, 130);
  const quilt = (rx, ry) => texturedMat(quiltTexture(), rx, ry);
  const Q = (x, top, z, w, d, h = 1.2) => L.box(x, top, z, w, d, h, 0xffffff, { mat: quilt(Math.max(1, w / 3), Math.max(1, d / 3)) });
  const S = steps(game, [
    'Talk to Pillowcat',
    'Light the three star pedestals (0/3)',
    'Cross the star bridge to the North Star',
    'Carry Cappuccino across the fading bridge!',
    'Take the North Star!',
  ]);
  L.startObjective = 'Talk to Pillowcat';
  let lit = 0;

  Q(0, 0, 21, 12, 10);
  // West island with a bounce cushion up to pedestal 1
  L.box(-10, 0, 18, 8, 2, 0.5, 0xb9a6e3);
  Q(-18, 0, 16, 8, 8);
  L.box(-16, 0.3, 13.6, 1.8, 1.8, 0.3, 0xffc93c, { bounce: 18, cyl: true });
  Q(-19, 4, 16.5, 3, 3, 0.8);
  // East island guarded by a drifting patch of Hush fog
  L.box(10, 0, 18, 8, 2, 0.5, 0xb9a6e3);
  Q(18, 0, 16, 8, 8);
  const fog = L.hazard(14, 0, 14.6, 16.2, 3, 17.4, { visual: true });
  let fogDir = 1;
  L.every((t, dt) => {
    const dx = fogDir * dt * 2.2;
    L.moveHazard(fog, dx, 0);
    if (fog.max.x > 22 && fogDir > 0) fogDir = -1;
    if (fog.min.x < 14 && fogDir < 0) fogDir = 1;
  });
  // North cushions to island C
  L.box(0, 0.8, 13.5, 2.4, 2.4, 0.6, 0xf7ece2);
  L.box(1, 1.6, 10.4, 2.6, 2.6, 0.6, 0xf7ece2);
  Q(0, 2, 2.5, 8, 9);
  // Pedestals
  const pedestal = (x, y, z) => {
    L.box(x, y + 0.8, z, 1.2, 1.2, 0.8, 0xe8c46a, { deco: true, cyl: true });
    const st = star(L, x, y + 1.6, z, 0.4, 0x8a8aa0);
    st.material = new THREE.MeshLambertMaterial({ color: 0x8a8aa0 });
    let done = false;
    L.every((t) => { st.rotation.y = t; });
    L.interact(x, y, z, {
      label: 'Light the star', r: 2.4, enabled: () => !done && S.get() >= 1,
      use: () => {
        done = true;
        lit++;
        st.material = new THREE.MeshLambertMaterial({ color: 0xffd678, emissive: 0xffb020 });
        const pl = new THREE.PointLight(0xffd678, 10, 12);
        pl.position.set(x, y + 2, z);
        L.add(pl);
        game.sound.songNote(['Do', 'Mi', 'Sol'][lit - 1]);
        if (lit >= 3) { game.toast('A bridge of starlight appears to the north!'); S.go(2); } else game.objective(`Light the three star pedestals (${lit}/3)`);
      },
    });
  };
  pedestal(-19, 4, 16.5);
  pedestal(20, 0, 13);
  pedestal(0, 2, 4);
  // Star bridge and the fading tiles
  L.box(0, 2, -6, 2.4, 8, 0.4, 0xffe9a8, { when: () => lit >= 3, emissive: 0x665522 });
  for (const z of [-11.8, -14.8, -17.8]) L.box(0, 2, z, 2.2, 2.2, 0.4, 0xffe9a8, { crumble: true, emissive: 0x665522 });
  Q(0, 2, -25, 10, 10);
  // The North Star (the note), hidden until the attack
  let hush = null;
  let hushOn = false;
  const hushHaz = L.hazard(-3, 0, 100, 3, 6, 103);
  const hushModel = critter('hush');
  hushModel.scale.setScalar(1.6);
  hushModel.visible = false;
  L.add(hushModel);
  const placeHush = (z) => {
    hush = z;
    hushHaz.min.z = z - 1.2;
    hushHaz.max.z = z + 1.2;
    hushModel.position.set(0, 1.5, z);
  };
  L.every((t, dt) => {
    if (!hushOn) return;
    if (hush > -19) placeHush(hush - dt * 2.0);
    hushModel.rotation.y = Math.sin(t) * 0.3;
  });
  L.onRespawn = () => { if (hushOn) placeHush(-2); };
  L.trigger(-1.5, 1.5, -10, 1.5, 5, -8.5, async () => {
    if (S.get() !== 2) return;
    hushModel.visible = true;
    placeHush(-3);
    await game.say([
      ['The Hush', 'Shhhhhh...'],
      ['The Hush', 'So much noise. So much colour. I will make it all quiet.'],
      ['asher', 'Cappy! The grey fog is all over you!'],
      ['capp', 'I am... so tired, Asher. I cannot... walk.'],
      ['asher', 'Then I\'ll carry you. Hold on. We\'re taking that star home.'],
    ]);
    game.setCarry(true);
    L.checkpoint = { pos: new V(0, 2, -8.5), facing: Math.PI };
    hushOn = true;
    S.go(3);
    L.pickup(0, 3.6, -25, 'note');
  });
  L.trigger(-5, 1.5, -30, 5, 6, -20, () => { if (S.get() === 3) S.go(4); });

  // Scenery
  for (let i = 0; i < 16; i++) cloud(L, Math.sin(i * 1.9) * 40, -6 + (i % 4) * 3, Math.cos(i * 1.3) * 40, 3 + (i % 3), 0xb9a6e3, 0.85);
  for (let i = 0; i < 10; i++) crystal(L, Math.sin(i * 2.7) * 26, 4 + (i % 4) * 3, Math.cos(i * 2.1) * 26, 1.5, [0x8f7bff, 0x6ab0ff][i % 2]);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(6, 24, 16), new THREE.MeshBasicMaterial({ color: 0xfff3c8, fog: false }));
  moon.position.set(-40, 40, -70);
  L.add(moon);
  const tel = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 2.4, 10), mat(0xc9a227));
  tel.position.set(-2, 3.6, 0);
  tel.rotation.z = 0.9;
  L.add(tel);
  for (const [x, z] of [[-5, 25], [5, 25], [-21, 19], [21, 19], [-3, 6], [3, -1]]) { post(L, x, x > -10 && x < 10 && z < 10 ? 2 : 0, z, 1.6, 0xe8c46a); lantern(L, x, (x > -10 && x < 10 && z < 10 ? 2 : 0) + 2.4, z, 0xfff0a0, false); }

  L.npc('pillowcat', 2.5, 0, 18, -0.3);
  L.interact(2.5, 0, 18, {
    label: 'Talk to Pillowcat', r: 2.6,
    use: async () => {
      if (S.get() === 0) {
        await game.say([
          ['Pillowcat', 'Mmm... visitors... in the middle of the night...'],
          ['Pillowcat', 'The Hush is eating my stars, one by one. Your note became the North Star, and the Hush wants it most of all.'],
          ['Pillowcat', 'Light the three star pedestals and a bridge of starlight will carry you to it. One is up on the west cushion, one is past the fog in the east, one is to the north.'],
          ['Pillowcat', 'Stay out of the grey fog. Zzzz...'],
        ]);
        S.go(1);
        game.objective(`Light the three star pedestals (${lit}/3)`);
      } else game.say([['Pillowcat', 'Zzzz... light the stars... zzz...']]);
    },
  });
  L.sunbeam(-18, 0, 18);
  L.sunbeam(0, 2, 5.5);
  treats(L, [[-10, 0, 18], [10, 0, 18], [-20, 0, 13], [-19, 4, 15.5], [16, 0, 19], [21, 0, 18], [0, 0.8, 13.5], [1.5, 1.6, 10], [-3, 2, 0], [3, 2, 5], [0, 2, -6], [-4, 2, -26], [4, 2, -26]]);
  L.spawn = new V(0, 0, 24);
  L.spawnFacing = Math.PI;
  L.onStart = () => game.say([['asher', 'We\'re inside the quilt! It\'s so soft.'], ['capp', 'It is so quiet here. Too quiet. Stay close to me.']]);
  return L;
}

// ---------------------------------------------------------------- World 7
export function buildW7(game) {
  const L = new Level(game, 'w7');
  L.music = 'Ti';
  L.setSky('#4a8ed0', '#ffd3b0', 0xcfe3f0, 50, 170);
  L.lights({ sky: 0xffffff, ground: 0x8aa0c0, hemi: 1.6, sun: 0xfff0d8, sunI: 1.5, dir: [10, 22, 10] });
  L.killY = -14;
  const CLOUD = 0xfafcff;
  const S = steps(game, [
    'Talk to Captain Coo',
    'Fix the three weather vanes (0/3)',
    'Jump into the gust beside the harbor and ride it up to the fog bank',
    'Clear the fog with Echo Meow (Skill)',
    'Sound the foghorn',
    'Take the note!',
  ]);
  L.startObjective = 'Talk to Captain Coo';
  let vanes = 0;

  const pier = (x, top, z, w, d) => {
    L.box(x, top, z, w, d, 1.2, CLOUD);
    for (let i = 0; i < 5; i++) cloud(L, x + (Math.sin(i * 2.1) * w) / 2.4, top - 1.2, z + (Math.cos(i * 1.7) * d) / 2.4, 1.4, CLOUD);
    L.box(x, top + 0.06, z, w * 0.6, d * 0.8, 0.1, 0xc58b5a, { deco: true });
  };
  pier(0, 0, 21, 12, 10);
  L.box(-8.6, 0.6, 14.5, 2.4, 2.4, 0.6, CLOUD);
  L.box(-11.8, 1.1, 11.6, 2.4, 2.4, 0.6, CLOUD);
  pier(-18, 1.5, 10, 8, 8);
  const ship = L.box(10, 0.6, 15.5, 3, 4, 0.6, 0x8a5a3c, { move: (t) => ({ x: Math.sin(t * 0.5) * 3.5 }) });
  const balloon = new THREE.Mesh(new THREE.SphereGeometry(2, 16, 12), mat(0xe63946));
  balloon.scale.set(1, 0.8, 1.5);
  balloon.position.y = 4.5;
  ship.mesh.add(balloon);
  pier(18, 1.5, 10, 8, 8);
  // Weather vanes
  const vane = (x, y, z) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 6), mat(0xc9a227)));
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.25, 1.4, 4), mat(0xc9a227));
    arrow.rotation.z = Math.PI / 2;
    arrow.position.y = 1.1;
    g.add(arrow);
    g.position.set(x, y + 1.2, z);
    g.rotation.z = 0.5;
    L.add(g);
    let fixed = false;
    L.every((t, dt) => { if (fixed) g.rotation.y += dt * 3; });
    L.interact(x, y, z, {
      label: 'Fix the weather vane', r: 2.4, enabled: () => !fixed && S.get() >= 1,
      use: () => {
        fixed = true;
        g.rotation.z = 0;
        vanes++;
        game.sound.chime();
        if (vanes >= 3) { game.toast('The wind returns! A gust is blowing up just north of the harbor.'); S.go(2); } else game.objective(`Fix the three weather vanes (${vanes}/3)`);
      },
    });
  };
  vane(-4, 0, 24.5);
  vane(-18, 1.5, 8.5);
  vane(18, 1.5, 8.5);
  // The gust
  L.vent(0, 13.4, 1.5, -3, 9.4, 'gust', () => vanes >= 3, 8);
  // Upper pier and the fog bank
  pier(0, 7.5, 2, 12, 16);
  L.box(0, 13.5, -5, 12, 1.6, 6, 0x9a96a8, { echoBreak: true, opacity: 0.88, onBreak: () => { game.toast('The fog melts away. The foghorn!'); S.go(4); } });
  for (let i = 0; i < 6; i++) cloud(L, -5 + i * 2, 9 + (i % 2), -5, 1.5, 0x9a96a8, 0.7);
  L.trigger(-6, 7, -4, 6, 11, 2, () => { if (S.get() === 2) S.go(3); }, false);
  pier(0, 7.5, -11, 8, 10);
  const horn = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.2, 16, 1, true), mat(0xc9a227));
  horn.rotation.x = Math.PI / 2;
  horn.position.set(0, 8.8, -13);
  L.add(horn);
  L.interact(0, 7.5, -12, {
    label: 'Sound the foghorn', r: 2.6, enabled: () => S.get() === 4,
    use: async () => {
      await game.say([['capp', 'Together?'], ['asher', 'Together!']]);
      game.sound.tone(110, 1.6, 'sawtooth', 0.12);
      game.sound.tone(165, 1.6, 'sine', 0.1);
      L.pickup(0, 8.8, -10, 'note');
      S.go(5);
    },
  });
  // Hint at the fog
  L.trigger(-6, 7, -3, 6, 11, 0, () => game.hint('fog', 'Thick Hush fog. Echo Meow (Skill) should clear it.'));

  // City far below, more clouds, birds
  for (let i = 0; i < 60; i++) {
    const h = 8 + ((i * 37) % 22);
    const x = Math.sin(i * 12.9) * 70;
    const z = Math.cos(i * 7.3) * 70;
    L.box(x, -30 + h, z, 4, 4, h, [0x5e548e, 0x6b5f9e, 0x8a7fb8][i % 3], { deco: true, cast: false });
  }
  for (let i = 0; i < 18; i++) cloud(L, Math.sin(i * 2.4) * 45, -4 + (i % 5) * 4, Math.cos(i * 1.9) * 45, 3 + (i % 3), 0xffffff, 0.9);
  for (let i = 0; i < 3; i++) {
    const s = L.add(new THREE.Group());
    const hull = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 6), mat(0x8a5a3c));
    const bal = new THREE.Mesh(new THREE.SphereGeometry(2.4, 14, 10), mat([0xffc93c, 0x2bb3b0, 0xb9a6e3][i]));
    bal.scale.set(1, 0.8, 1.6);
    bal.position.y = 4;
    s.add(hull, bal);
    L.every((t) => { const a = t * 0.08 + i * 2; s.position.set(Math.cos(a) * 34, 6 + i * 4, Math.sin(a) * 34); s.rotation.y = -a; });
  }
  stiltHouse(L, 3.6, 0, 24.8, 2.6, 2, 2, 0, 0x2f5d8a);
  L.npc('pigeon', 2, 0, 18.5, -0.2);
  L.npc('gull', -17, 1.5, 12, 0.5);
  L.interact(2, 0, 18.5, {
    label: 'Talk to Captain Coo', r: 2.6,
    use: async () => {
      if (S.get() === 0) {
        await game.say([
          ['Captain Coo', 'Ahoy, cats! Captain Coo of the Sky Harbor fleet. Or what is left of it.'],
          ['Captain Coo', 'The Hush smothered our winds. Without wind nothing flies, and your note is our foghorn, lost up in that fog bank.'],
          ['Captain Coo', 'Fix the three weather vanes: one on this pier, one on the west pier, one on the east pier. The winds will come home and carry you up.'],
          ['capp', 'Over the clouds. Above the whole city. Of course.'],
        ]);
        S.go(1);
      } else game.say([['Captain Coo', vanes >= 3 ? 'Into the gust, cats! It will carry you up.' : `${vanes} of 3 vanes. Keep at it!`]]);
    },
  });
  L.sunbeam(-18, 1.5, 11.5);
  L.sunbeam(17, 1.5, 11.5);
  L.sunbeam(0, 7.5, 6);
  treats(L, [[-8.6, 0.6, 14.5], [-11.8, 1.1, 11.6], [-20, 1.5, 8], [10, 0.6, 15.5], [20, 1.5, 8], [0, 7.5, 9], [-4, 7.5, 2], [4, 7.5, 2], [0, 7.5, -8], [-3, 0, 23], [5, 0, 21]]);
  L.spawn = new V(0, 0, 24);
  L.spawnFacing = Math.PI;
  L.onStart = () => game.say([['asher', 'We\'re above the whole city!'], ['capp', 'Do not look down. I am looking down. Why did I look down.']]);
  return L;
}

// ---------------------------------------------------------------- Finale
export function buildFinale(game) {
  const L = new Level(game, 'finale');
  L.music = 'Do2';
  L.setSky('#1a1220', '#5a3a2a', 0x2a1a20, 40, 120);
  L.lights({ sky: 0xffe6c0, ground: 0x3a2020, hemi: 1.2, sun: 0xffd8a0, sunI: 1.3, dir: [6, 26, 6] });
  L.killY = -6;
  const has = (a) => !!game.save.abilities[a];
  L.startObjective = 'Light the seven chandeliers (0/7)';
  let lit = 0;
  let ended = false;

  // Ballroom floor with a turning inlay
  L.box(0, 0, 0, 40, 40, 1, 0x6b4a3a);
  const inlay = new THREE.Mesh(new THREE.RingGeometry(4, 9, 48), mat(0xc9a227));
  inlay.rotation.x = -Math.PI / 2;
  inlay.position.y = 0.03;
  L.add(inlay);
  L.every((t, dt) => { inlay.rotation.z += dt * 0.2; });
  for (const [x, z, w, d] of [[0, -20.3, 41, 0.6], [0, 20.3, 41, 0.6], [-20.3, 0, 0.6, 41], [20.3, 0, 0.6, 41]]) L.block(x, z, w, d, 0, 14, 0x7a4a3a);
  gear(L, -12, 9, -19.9, 4, 'z', 0.2);
  gear(L, 10, 7, -19.9, 3, 'z', -0.3);
  gear(L, 19.9, 8, -6, 3.5, 'x', 0.25);
  gear(L, -19.9, 6, 6, 3, 'x', -0.3);

  // Chandeliers
  const chand = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const g = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.08, 6, 24), mat(0xc9a227));
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
    const glass = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 10), new THREE.MeshLambertMaterial({ color: 0x6a5a6a }));
    g.add(glass);
    const light = new THREE.PointLight(0xffd678, 0, 26);
    g.add(light);
    g.position.set(Math.cos(a) * 10, 12, Math.sin(a) * 10);
    L.add(g);
    chand.push({ glass, light });
  }
  const hushModel = critter('hush');
  hushModel.scale.setScalar(3.2);
  hushModel.position.set(0, 7, 0);
  L.add(hushModel);
  L.every((t) => { hushModel.position.y = 7 + Math.sin(t) * 0.5; hushModel.rotation.y = t * 0.2; });

  const lightOne = async (name) => {
    const c = chand[lit];
    c.glass.material = new THREE.MeshLambertMaterial({ color: 0xffe9a8, emissive: 0xffb020 });
    c.light.intensity = 14;
    lit++;
    game.sound.songNote(['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Ti'][lit - 1]);
    game.toast(`${name}: chandelier ${lit} of 7 is lit!`);
    hushModel.scale.setScalar(3.2 - lit * 0.3);
    if (lit < 7) { game.objective(`Light the seven chandeliers (${lit}/7)`); return; }
    if (ended) return;
    ended = true;
    game.objective('Sing the Homesong');
    await game.say([
      ['The Hush', 'No... the light... the noise...'],
      ['capp', 'It is not noise. It is a song. Sing it with me, Asher.'],
      ['asher', 'I don\'t know the words!'],
      ['capp', 'You do. You have been learning them all week.'],
    ]);
    await game.ui.duet(game.sound);
    hushModel.visible = false;
    game.finishGame();
  };
  const gem = (x, y, z, color, name) => L.pickup(x, y, z, 'gem', { color, onPick: () => lightOne(name) });

  // 1. Bubble Hop
  L.block(-16, -16, 4, 4, 0, 6, 0x8a5a3c);
  L.vent(-12.6, -16, 1.2, 0, 7.4, 'bubble', () => has('bubble'), 7);
  gem(-16, 6.8, -16, 0x2bb3b0, 'Bubble Hop');
  // 2. Wind-Up Spring
  L.block(16, -16, 4, 4, 0, 4.6, 0x8a5a3c);
  gem(16, 5.4, -16, 0xc98b2b, 'Wind-Up Spring');
  // 3. Paper Glide
  L.block(-11, 13, 2, 2, 0, 1.2, 0x8a5a3c);
  L.block(-13, 13, 2, 2, 0, 2.4, 0x8a5a3c);
  L.block(-16, 12, 4, 4, 0, 3.6, 0x8a5a3c);
  L.box(-16.5, 3.0, -1.5, 3, 3, 0.5, 0xf4e6c4);
  gem(-16.5, 3.8, -1.5, 0xe8823a, 'Paper Glide');
  // 4. Firefly Lantern (dark corner)
  L.dark(9, 8, 20, 20);
  [[12, 1.2, 10], [14.5, 2.4, 12], [17, 3.6, 14], [17, 4.8, 17]].forEach(([x, y, z]) => L.box(x, y, z, 2, 2, 0.4, 0xffe873, { reveal: 'lantern' }));
  gem(17, 5.6, 17, 0x4f9a3a, 'Firefly Lantern');
  // 5. Spin Dash vault
  L.block(-4.3, 17, 0.6, 6, 0, 4, 0x7a4a3a);
  L.block(4.3, 17, 0.6, 6, 0, 4, 0x7a4a3a);
  L.block(0, 20.1, 9.2, 0.4, 0, 4, 0x7a4a3a);
  L.block(0, 17, 9.2, 7, 4, 4.4, 0x7a4a3a);
  L.block(0, 13.7, 8, 0.6, 0, 4, 0xb3243a, { breakable: 'dash', hint: 'A heavy red door. Asher\'s Spin Dash (Skill) could burst through.' });
  gem(0, 0.9, 17, 0xe63946, 'Spin Dash');
  // 6. Echo Meow
  [[-2, 1.2, -11], [0, 2.4, -13.5], [2, 3.6, -16], [0, 4.8, -18.4]].forEach(([x, y, z]) => L.box(x, y, z, 2, 2, 0.4, 0xb9a6e3, { reveal: 'echo' }));
  gem(0, 5.6, -18.4, 0x8a68c9, 'Echo Meow');
  L.trigger(-4, 0, -14, 4, 3, -8, () => game.hint('echo', 'Something hidden is up there. Try Echo Meow (Skill).'));
  // 7. Wind Whiskers
  L.vent(14, 2, 1.4, 0, 10.4, 'wind', () => has('wind'), 8);
  L.box(17.5, 9, 3, 4, 4, 0.6, 0x8a5a3c);
  gem(17.5, 9.8, 3, 0x5aa0d6, 'Wind Whiskers');

  for (const [x, z] of [[-6, 6], [6, 6], [-6, -6], [6, -6]]) { post(L, x, 0, z, 3, 0xc9a227); lantern(L, x, 3.6, z, 0xffd08a, true); }
  L.sunbeam(0, 0, 8);
  treats(L, [[-8, 0, 0], [8, 0, 0], [0, 0, -6], [-14, 0, 6], [14, 0, -6]]);
  L.spawn = new V(0, 0, 8);
  L.spawnFacing = Math.PI;
  L.onStart = () => game.say([
    ['capp', 'Grandma Ines\'s music box. From the inside.'],
    ['asher', 'Seven chandeliers, all dark. And... that.'],
    ['The Hush', 'Shhhhh. Quiet now, little cats. Quiet forever.'],
    ['capp', 'Not tonight. Light the chandeliers, Asher. Every trick we have learned, one for each.'],
  ]);
  void stiltHouse;
  return L;
}
