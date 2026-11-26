import * as THREE from 'three';
import { Level, mat } from '../level.js';
import {
  lantern, post, lotus, lilyLeaf, awningStall, stiltHouse, gear, clockFace, paperMountain, mapleTree,
  palm, bigLeaf, water, texturedMat, paperTexture, bannerString, star, cloud, crystal,
} from '../props.js';

const V = THREE.Vector3;
const treats = (L, list) => list.forEach(([x, y, z]) => L.pickup(x, y + 0.6, z, 'treat'));
const steps = (game, list) => {
  let i = 0;
  const go = (n) => { i = n; game.objective(list[n]); };
  return { go, get: () => i };
};

// ---------------------------------------------------------------- World 1
export function buildW1(game) {
  const L = new Level(game, 'w1');
  L.music = 'Do';
  L.setSky('#2a7f8a', '#ffc9a3', 0xbfe3dc, 45, 150);
  L.lights({ sky: 0xfff0e0, ground: 0x2bb3b0, hemi: 1.5, sun: 0xffd9b0, sunI: 1.5, dir: [-10, 20, 8] });
  water(L, 0, 400, 0x2bb3b0, 0.92);
  L.waterY = 0.15;
  L.killY = -5;
  const DOCK = 0x8a5a3c;
  const PAD = 0x6fbf5a;
  const S = steps(game, [
    'Talk to Madame Ottilie',
    'Trade the soap pearl with Shelly the snail (across the lily pads)',
    'Trade the snail polish with the lantern frog (ride the duck ferry)',
    'Trade the lantern wick with the map frog on the rooftop',
    'Trade the canal map with the fly catcher (east lily pads)',
    'Raise the drawbridge: one cat holds the winch plate, the other crosses',
    'Win the auction: talk to Baron Croak',
    'Calm the Baron with Cappuccino\'s Calm Purr',
    'Take the note!',
  ]);
  L.startObjective = 'Talk to Madame Ottilie';

  const dock = (x, top, z, w, d) => {
    L.box(x, top, z, w, d, 1.2, DOCK);
    for (const [px, pz] of [[x - w / 2 + 0.4, z - d / 2 + 0.4], [x + w / 2 - 0.4, z - d / 2 + 0.4], [x - w / 2 + 0.4, z + d / 2 - 0.4], [x + w / 2 - 0.4, z + d / 2 - 0.4]]) post(L, px, -1, pz, top + 0.4, 0x6e4630);
  };
  const pad = (x, z) => { L.box(x, 0.6, z, 2.8, 2.8, 0.3, PAD, { cyl: true }); lotus(L, x + 1.6, 0.1, z + 1.2, 0.35, false); };

  // Dock A (start)
  dock(0, 1, 26, 12, 6);
  awningStall(L, 3.2, 1, 23.6, 0, 0xff7a59, 0xfff3e0);
  lantern(L, -5.4, 2.8, 23.4, 0xff9f6b, true);
  post(L, -5.4, 1, 23.4, 1.9);
  // Lily pads to dock B
  [[-8.6, 24.5], [-11.4, 21.6], [-13.8, 18.4], [-15.6, 15.2]].forEach(([x, z]) => pad(x, z));
  dock(-16, 1, 10, 8, 6);
  awningStall(L, -16, 1, 8, 0, 0xb9a6e3, 0xfff3e0, 0xf2a0b8);
  // Duck ferry B -> C
  const ferry = L.box(-16, 0.9, -0.5, 3, 4, 0.6, 0xffc93c, { move: (t) => ({ z: Math.sin(t * 0.6) * 4 }) });
  const duckHead = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 10), mat(0xffc93c));
  duckHead.position.set(0, 1.2, -1.6);
  ferry.mesh.add(duckHead);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 8), mat(0xff7a59));
  beak.rotation.x = -Math.PI / 2;
  beak.position.set(0, 1.1, -2.2);
  ferry.mesh.add(beak);
  // Dock C with stilt house
  dock(-15, 1, -11.5, 10, 7);
  stiltHouse(L, -18, 1, -13.5, 3, 3, 2.2, 0, 0x5e548e);
  // Arched bridge C -> D
  L.box(-8.5, 1.3, -11, 3, 2, 0.4, 0xc58b5a);
  L.box(-5, 1.6, -11, 4, 2, 0.4, 0xc58b5a);
  L.box(-1.5, 1.3, -11, 3, 2, 0.4, 0xc58b5a);
  for (const x of [-9.5, -6, -3, -0.5]) { post(L, x, 1.3, -12, 1, 0xc58b5a); post(L, x, 1.3, -10, 1, 0xc58b5a); }
  // Dock D with the flat-roofed map house
  dock(6, 1, -12, 12, 8);
  L.block(8.5, -13, 5, 4, 1, 3.2, 0xc58b5a);
  L.box(8.5, 3.4, -13, 5.4, 4.4, 0.2, 0x5e548e, { deco: true });
  L.block(4.2, -9.8, 1.8, 1.8, 1, 2.1, 0xb07a4a);
  lantern(L, 7, 4.8, -11.4, 0xffd08a, true);
  // Lily pads to dock E
  [[14.2, -6.2], [16.8, -3.0], [19.0, 0.2]].forEach(([x, z]) => pad(x, z));
  dock(21, 1, 6, 10, 8);
  awningStall(L, 23, 1, 3, Math.PI / 2, 0x2bb3b0, 0xfff3e0);
  // Winch plate + drawbridge to the lotus stage
  let plateDown = false;
  let locked = false;
  L.plate(24, 1.1, 8.2, 2.2, 2.2, 0xffc93c, (p) => {
    plateDown = p;
    if (p && S.get() >= 5 && !locked) game.hint('bridge', 'The drawbridge is up! Press Swap: this cat stays on the plate while the other one crosses.');
  });
  const winch = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.6, 12), mat(0x6e4630));
  winch.rotation.z = Math.PI / 2;
  winch.position.set(24, 1.9, 9.8);
  L.add(winch);
  L.box(9.75, 1.2, 2, 12.5, 2, 0.4, 0xd9a066, { when: () => (plateDown && S.get() >= 5) || locked });
  // Lotus stage
  L.box(0, 1.4, 2, 8, 8, 0.8, 0xe9c7a0, { cyl: true });
  lotus(L, 0, 1.4, 4.6, 1.3, true);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    post(L, Math.cos(a) * 3.6, 1.4, 2 + Math.sin(a) * 3.6, 1.6, 0xc9a227);
    lantern(L, Math.cos(a) * 3.6, 3.4, 2 + Math.sin(a) * 3.6, 0xff9f6b, false);
  }
  bannerString(L, -3.6, 2, 3.6, 2, 4.4);
  L.trigger(-3.4, 1, -1.4, 3.4, 4, 5.4, () => {
    if (S.get() === 5 && !locked) {
      locked = true;
      game.follower.waiting = false;
      game.toast('The drawbridge clicks into place.');
      S.go(6);
    }
  }, false);

  // Scenery
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const r = 42 + (i % 3) * 6;
    stiltHouse(L, Math.cos(a) * r, 0, Math.sin(a) * r, 5, 4, 4 + (i % 3), a, [0x5e548e, 0xe63946, 0x2f5d8a][i % 3]);
  }
  for (let i = 0; i < 24; i++) lilyLeaf(L, Math.sin(i * 7.1) * 30, 0.05, Math.cos(i * 3.3) * 30, 0.8 + (i % 3) * 0.4);
  for (let i = 0; i < 10; i++) lotus(L, Math.sin(i * 4.3) * 25, 0.05, Math.cos(i * 2.7) * 25, 0.5, false);

  // Residents
  L.npc('otter', 2.2, 1, 24.3, 0.4);
  L.npc('snail', -14.5, 1, 9.3, -0.6);
  L.npc('frog', -13, 1, -10.2, 0.8);
  L.npc('frog', 9, 3.2, -13.4, 0.3);
  L.npc('frog', 20.5, 1, 4.5, 0.2);
  L.npc('toad', 0, 1.4, 0.6, 0);
  L.npc('frog', 4.5, 1, 27.6, -1.2, { scale: 0.8 });

  // Trading
  const items = ['Soap Pearl', 'Snail Polish', 'Lantern Wick', 'Canal Map', 'Golden Fly'];
  L.interact(2.2, 1, 24.3, {
    label: 'Talk to Madame Ottilie', r: 2.6,
    use: async () => {
      if (S.get() === 0) {
        await game.say([
          ['Madame Ottilie', 'Welcome to the Lilypad Bazaar, darlings! You must be the cats that glowing note came looking for.'],
          ['Madame Ottilie', 'Here, everything is for trade. Nothing is for sale.'],
          ['Madame Ottilie', 'Your note is on Baron Croak\'s auction block. He thinks it is a singing coin, and he only trades for the rarest things.'],
          ['capp', 'And we have nothing to trade.'],
          ['Madame Ottilie', 'You do now! A soap pearl. Shelly the snail has wanted one for ages. Trade up, darlings, trade up!'],
        ]);
        game.sound.item();
        game.toast('Got: Soap Pearl');
        S.go(1);
      } else game.say([['Madame Ottilie', S.get() < 5 ? `Trade up, darlings! You have the ${items[S.get() - 1]}.` : 'Go on, the Baron is waiting on the lotus stage!']]);
    },
  });
  const trader = (x, y, z, name, need, lines, before) => L.interact(x, y, z, {
    label: `Talk to ${name}`, r: 2.6,
    use: async () => {
      if (S.get() === need) {
        await game.say(lines);
        game.sound.item();
        game.toast(`Traded for: ${items[need]}`);
        S.go(need + 1);
      } else if (S.get() < need) game.say([[name, before]]);
      else game.say([[name, 'Thank you again, cats!']]);
    },
  });
  trader(-14.5, 1, 9.3, 'Shelly', 1, [['Shelly', 'A soap pearl! Oh, it\'s perfect. Take my snail polish.'], ['Shelly', 'The lantern frog across the ferry is always grumbling about dull lanterns.']], 'Hmm? I only trade for soap pearls, dear.');
  trader(-13, 1, -10.2, 'Lamplighter Lou', 2, [['Lamplighter Lou', 'Snail polish! My lanterns will shine like new. Here, a spare lantern wick.'], ['Lamplighter Lou', 'The map frog up on that rooftop reads all night and keeps running out. Hop up on the crate.']], 'Lanterns are so dull lately. If only someone had snail polish.');
  trader(9, 3.2, -13.4, 'Mapmaker Mira', 3, [['Mapmaker Mira', 'A wick! Light at last. Take this canal map.'], ['Mapmaker Mira', 'The fly catcher across the east lily pads has been lost for days.']], 'Too dark to read. I need a lantern wick.');
  trader(20.5, 1, 4.5, 'Fletcher', 4, [
    ['Fletcher', 'A map! I can find my way home! Take the golden fly, the rarest thing on the water.'],
    ['Fletcher', 'The Baron is on the lotus stage. The drawbridge only rises while someone stands on the winch plate behind me.'],
    ['capp', 'One of us holds the plate, the other crosses. I will hold it. You cross. Carefully.'],
  ], 'I\'m lost, so lost. A map would help.');
  // The Baron
  L.interact(0, 1.4, 0.6, {
    label: () => (S.get() === 7 ? 'Calm Purr' : 'Talk to Baron Croak'), r: 2.6,
    who: 'any',
    use: async (c) => {
      const s = S.get();
      if (s === 6) {
        await game.say([
          ['Baron Croak', 'A cat? At MY auction?'],
          [c.kind, 'We will trade you this golden fly for the singing coin.'],
          ['Baron Croak', 'A golden fly... magnificent. Fine! Take the coin. It never sang for me anyway.'],
          ['Baron Croak', 'Wait. WAIT. If it sings for you, it must be worth MORE! Hrrrk! Croooak! Not fair!'],
          ['capp', 'He is working himself into a tantrum. Let me handle this. Gently.'],
        ]);
        S.go(7);
      } else if (s === 7) {
        if (c.kind !== 'capp') { game.say([['asher', 'He\'s too upset to listen to me. This needs Cappuccino\'s Calm Purr. (Swap to her.)']]); return; }
        game.sound.purr(1.6);
        await game.say([['capp', 'Purrrrrr...'], ['Baron Croak', '...Oh. Oh my. That is very soothing.'], ['Baron Croak', 'Take it. A song should go home.']]);
        L.pickup(0, 2.8, 3, 'note');
        S.go(8);
      } else if (s < 6) game.say([['Baron Croak', 'Only the rarest treasures, please. Go away.']]);
    },
  });

  L.sunbeam(-15, 1, -9.2);
  L.sunbeam(19, 1, 8);
  treats(L, [[-8.6, 0.6, 24.5], [-11.4, 0.6, 21.6], [-13.8, 0.6, 18.4], [-15.6, 0.6, 15.2], [-18, 1, 12], [-16, 1, -3], [-12, 1, -13], [-5, 1.6, -11], [3, 1, -9], [8.5, 3.2, -14.4], [14.2, 0.6, -6.2], [16.8, 0.6, -3], [19, 0.6, 0.2], [25, 1, 3], [-4, 1, 28], [5, 1, 28]]);

  L.spawn = new V(0, 1, 27.5);
  L.spawnFacing = Math.PI;
  L.onStart = () => game.say([['asher', 'Whoa. We\'re tiny! And dry. Mostly.'], ['capp', 'A market floating on the bath water. Stay away from the edges, Asher.'], ['asher', 'An otter is waving at us!']]);
  return L;
}

// ---------------------------------------------------------------- World 2
export function buildW2(game) {
  const L = new Level(game, 'w2');
  L.music = 'Re';
  L.setSky('#2b1d22', '#d98a4a', 0x6a3f30, 40, 120);
  L.lights({ sky: 0xffe0b0, ground: 0x4a2a20, hemi: 1.3, sun: 0xffc890, sunI: 1.5, dir: [6, 20, 10] });
  L.killY = -8;
  const WOOD = 0x9a6a44;
  const BRASS = 0xc9a227;
  const S = steps(game, [
    'Talk to Chef Brioche',
    'Find the flour, eggs and jam (0/3). Some are hidden: use Cappuccino\'s Whisker Sense',
    'Bring the ingredients to Chef Brioche',
    'Climb the great clock: ride the gears up',
    'Free the note from the clock',
    'Take the note!',
  ]);
  L.startObjective = 'Talk to Chef Brioche';
  let found = 0;
  const gotOne = () => {
    found++;
    if (S.get() === 1) {
      if (found >= 3) S.go(2);
      else game.objective(`Find the flour, eggs and jam (${found}/3). Some are hidden: use Cappuccino's Whisker Sense`);
    }
  };

  // Start platform
  L.box(0, 0, 0, 10, 10, 1, WOOD);
  stiltHouse(L, -3.2, 0, -3.2, 2.6, 2.6, 2.2, 0.3, 0xe63946);
  // North: crate puzzle
  L.box(0, 0, -6.5, 2.4, 3, 0.6, WOOD);
  L.box(0, 0, -13, 12, 10, 1, WOOD);
  L.block(-4, -16, 4, 4, -1, 2.6, 0x8a5a3c);
  L.box(3, 1.6, -11, 1.6, 1.6, 1.6, 0xb07a4a, { pushable: true });
  L.pickup(-4, 3.2, -16, 'item', { label: 'Found: eggs', onPick: gotOne });
  L.trigger(-6, 0, -18, 6, 2, -8, () => game.hint('eggs', 'The eggs are on that high ledge. Cappuccino can push the crate over to make a step.'));
  // East: conveyor to the flour
  const belt = L.box(11, 0, 0, 12, 2, 0.4, 0x4a4040, { conveyor: [2.5, 0] });
  for (let i = 0; i < 8; i++) {
    const a = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.6, 3), mat(0xffc93c));
    a.rotation.z = -Math.PI / 2;
    a.position.set(-5 + i * 1.5, 0.25, 0);
    belt.mesh.add(a);
  }
  L.box(21, 0, 0, 8, 8, 1, WOOD);
  L.pickup(21, 0.6, 0, 'item', { label: 'Found: flour (Whisker Sense!)', visibleWhen: () => game.senseT > 0, onPick: gotOne });
  L.trigger(17, 0, -4, 25, 2, 4, () => game.hint('flour', 'It smells of flour here, but nothing is visible. Cappuccino\'s Whisker Sense (Paw with nothing nearby) shows hidden things.'));
  // West: hidden steps to the jam
  L.box(-8, 0, 0, 2.4, 2.4, 0.5, 0xffd678, { reveal: 'sense' });
  L.box(-11.5, 0.6, -1, 2.4, 2.4, 0.5, 0xffd678, { reveal: 'sense' });
  L.box(-15, 1.2, 0, 2.4, 2.4, 0.5, 0xffd678, { reveal: 'sense' });
  L.box(-19.5, 1.2, 0, 5, 6, 1, WOOD);
  L.pickup(-19.5, 1.8, 0, 'item', { label: 'Found: berry jam', onPick: gotOne });
  L.trigger(-5, 0, -3, -3.5, 2, 3, () => game.hint('jamsteps', 'There is a jar of jam on that far platform, and nothing to stand on. Or is there? Try Whisker Sense.'));
  // Clock climb
  L.box(0, 1.2, 8.5, 2.4, 2.4, 0.5, BRASS, { move: (t) => ({ x: Math.cos(t * 0.8) * 1.8, z: Math.sin(t * 0.8) * 1.8 }) });
  L.box(0, 2.6, 13.5, 6, 3, 0.6, WOOD);
  L.box(4.6, 1.6, 13.5, 2.4, 2.4, 0.5, BRASS, { move: (t) => ({ y: 2.3 + 2.3 * Math.sin(t * 0.7) }) });
  L.box(9.75, 6.2, 14, 4.5, 4, 0.6, WOOD);
  const belt2 = L.box(0, 6.2, 17, 20, 2, 0.4, 0x4a4040, { conveyor: [2.5, 0] });
  for (let i = 0; i < 12; i++) {
    const a = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.6, 3), mat(0xffc93c));
    a.rotation.z = -Math.PI / 2;
    a.position.set(-9 + i * 1.6, 0.25, 0);
    belt2.mesh.add(a);
  }
  L.box(-12, 6.2, 17, 4, 4, 0.6, WOOD);
  L.box(-12, 7.8, 21, 2, 2, 0.5, BRASS);
  L.box(-9, 9.4, 22.5, 2, 2, 0.5, BRASS);
  L.box(0, 10.6, 23.5, 12, 3, 0.6, WOOD);
  const clock = clockFace(L, 0, 17, 26.4, 7.5);
  clock.rotation.y = Math.PI;
  let clockSpeed = 0;
  L.every((t, dt) => { clock.userData.hands[0].rotation.z += dt * clockSpeed * 0.2; clock.userData.hands[1].rotation.z += dt * clockSpeed; });
  L.trigger(-6, 10, 22, 6, 13, 25, () => { if (S.get() === 3) S.go(4); });
  L.sunbeam(0, 2.6, 13.5);
  L.sunbeam(-12, 6.2, 17);

  // Scenery: gears, ovens, lanterns
  gear(L, -14, 6, 30, 5, 'z', 0.25);
  gear(L, 14, 9, 30, 4, 'z', -0.35);
  gear(L, 22, 4, 12, 3, 'x', 0.5, 0xb8863b);
  gear(L, -24, 3, -6, 4, 'x', -0.3, 0xb8863b);
  gear(L, 0, -6, -24, 6, 'z', 0.15);
  for (const [x, z] of [[-4, 4], [4, 4], [-5, -17], [5, -9], [24, 3], [-22, 2]]) { post(L, x, 0, z, 2.4, 0x6e4630); lantern(L, x, 2.8, z, 0xffb070, false); }
  const dome = new THREE.Mesh(new THREE.SphereGeometry(3, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x7a4a3a));
  dome.position.set(24, 0, -8);
  L.add(dome);
  const ovenMouth = new THREE.Mesh(new THREE.CircleGeometry(1.2, 20), new THREE.MeshBasicMaterial({ color: 0xffa040 }));
  ovenMouth.position.set(24, 1, -5.05);
  L.add(ovenMouth);

  // Residents
  L.npc('mouse', 1.5, 0, -2.5, 0);
  L.npc('robot', -2, 0, 2.5, 0.6);
  L.npc('mouse', 22, 0, 2.5, -1.2, { scale: 0.9 });
  L.npc('mouse', -18.5, 1.2, 1.5, 1.0, { scale: 0.9 });
  L.interact(1.5, 0, -2.5, {
    label: 'Talk to Chef Brioche', r: 2.6,
    use: async () => {
      const s = S.get();
      if (s === 0) {
        await game.say([
          ['Chef Brioche', 'Cats! Oh dear, oh dear. Please do not eat my bakers.'],
          ['capp', 'We would never. We are looking for a note. A glowing one.'],
          ['Chef Brioche', 'It flew straight into the great clock and jammed it! No clock, no baking, and the festival needs a thousand loaves by midnight.'],
          ['Chef Brioche', 'Worse, my helpers dropped the flour, the eggs and the berry jam. Some of it fell where no eye can see.'],
          ['capp', 'Leave the seeing to me. My whiskers notice everything.'],
        ]);
        S.go(1);
        game.objective(`Find the flour, eggs and jam (${found}/3). Some are hidden: use Cappuccino's Whisker Sense`);
        if (found >= 3) S.go(2);
      } else if (s === 1) game.say([['Chef Brioche', `${found} of 3 so far! Flour went east, jam went west, eggs went north.`]]);
      else if (s === 2) {
        await game.say([['Chef Brioche', 'Flour! Eggs! Jam! You marvels.'], ['Chef Brioche', 'Now the clock. Ride the gears south, up to the clock face, and free that note.']]);
        S.go(3);
      } else game.say([['Chef Brioche', 'Up the gears, up the gears!']]);
    },
  });
  L.interact(-2, 0, 2.5, { label: 'Talk to Tock', r: 2.2, use: () => game.say([['Tock', 'Tick. Tock. The belts carry you along. Walk against them if you must. Tick.']]) });
  L.interact(0, 10.6, 23.8, {
    label: 'Free the note', r: 2.8, enabled: () => S.get() === 4,
    use: async () => {
      await game.say([['asher', 'Got it... come ON... there!']]);
      game.sound.chime();
      clockSpeed = 3;
      L.pickup(0, 11.9, 23.2, 'note');
      S.go(5);
    },
  });
  treats(L, [[3, 0, 3], [-3, 0, -9], [4, 0, -16], [8, 0, 0], [14, 0, 0], [24, 0, -2], [-8, 0, 0], [-19, 1.2, -2], [0, 2.6, 13], [9, 6.2, 14], [-4, 6.2, 17], [-12, 7.8, 21], [4, 10.6, 23.5], [-4, 10.6, 23.5]]);
  L.spawn = new V(0, 0, 3);
  L.spawnFacing = Math.PI;
  L.onStart = () => game.say([['asher', 'It smells like the best morning ever.'], ['capp', 'Everything has stopped. Listen. No ticking.']]);
  return L;
}

// ---------------------------------------------------------------- World 3
export function buildW3(game) {
  const L = new Level(game, 'w3');
  L.music = 'Mi';
  L.setSky('#9fc7e8', '#f7ead0', 0xf2e6cc, 50, 150);
  L.lights({ sky: 0xffffff, ground: 0xc8a878, hemi: 1.7, sun: 0xfff0d8, sunI: 1.4, dir: [12, 22, 6] });
  water(L, 0, 400, 0x2f5d8a, 0.95);
  L.waterY = 0.15;
  L.killY = -5;
  const paper = texturedMat(paperTexture(), 3, 3);
  const P = (x, top, z, w, d, h = 1.2) => L.box(x, top, z, w, d, h, 0xefe2c2, { mat: paper });
  const S = steps(game, [
    'Talk to Fold the paper fox',
    'Find the torn map pieces (0/3)',
    'Cross the unfolded bridge and climb the folded mountain',
    'Ring the Bell of the Pass',
    'Take the note!',
  ]);
  L.startObjective = 'Talk to Fold the paper fox';
  let pieces = 0;
  const piece = () => {
    pieces++;
    game.sound.chime();
    game.toast(`Map piece ${pieces} of 3. A section of bridge unfolds!`);
    if (S.get() <= 1) {
      if (pieces >= 3) S.go(2);
      else if (S.get() === 1) game.objective(`Find the torn map pieces (${pieces}/3)`);
    }
  };
  const mapPiece = () => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.7), new THREE.MeshLambertMaterial({ map: paperTexture(), side: THREE.DoubleSide, emissive: 0x332200 }));
    return m;
  };

  P(0, 1, 20, 16, 12);
  star(L, -3, 1.05, 21, 0.9, 0xc9a227).rotation.x = -Math.PI / 2;
  // Boat to the west island
  const boat = L.box(-16, 0.8, 18, 3, 3, 0.5, 0xfff8e8, { move: (t) => ({ x: Math.sin(t * 0.5) * 6 }) });
  const sail = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2.4, 3), new THREE.MeshLambertMaterial({ color: 0xfff8e8, flatShading: true }));
  sail.position.y = 1.4;
  boat.mesh.add(sail);
  P(-28, 1, 16, 8, 10);
  mapleTree(L, -29, 1, 19, 1.2);
  L.pickup(-28, 1.8, 13, 'item', { mesh: mapPiece(), label: '', onPick: piece });
  // Tall rock on the start island (needs the Wind-Up Spring)
  L.block(6, 24, 4, 4, 1, 5.2, 0xd9c9a3, { mat: paper });
  L.pickup(6, 5.9, 24, 'item', { mesh: mapPiece(), label: '', onPick: piece });
  L.trigger(2, 1, 20, 8, 3, 26, () => game.hint('rock', 'A map piece sits on top of that tall rock. Hold Skill to wind up the spring, then let go.'));
  // Stepping stones east
  L.box(10.8, 1.2, 19.5, 2.2, 2.2, 0.5, 0xe8dcc0, { mat: paper });
  L.box(14.2, 1.5, 20.5, 2.2, 2.2, 0.5, 0xe8dcc0, { mat: paper });
  L.box(17.6, 1.8, 19.5, 2.2, 2.2, 0.5, 0xe8dcc0, { mat: paper });
  P(25, 1.8, 20, 10, 12);
  mapleTree(L, 27, 1.8, 16, 1.1, 0xe8b931);
  L.pickup(27, 2.6, 22, 'item', { mesh: mapPiece(), label: '', onPick: piece });
  // Bridge sections unfold as pieces return
  [[10.5, 1], [3.5, 2], [-3.5, 3]].forEach(([z, need]) => L.box(0, 1.0, z, 3, 7, 0.4, 0xfff3d8, { when: () => pieces >= need }));
  // Folded mountain
  P(0, 1, -14.5, 12, 15);
  L.block(-1, -16, 7, 6, 1, 2.6, 0xd8ccb0, { mat: paper });
  L.block(-2, -18.5, 5, 4, 1, 4.2, 0xd0c4a8, { mat: paper });
  L.block(-2.5, -20.5, 3, 3, 1, 5.8, 0xc8bca0, { mat: paper });
  paperMountain(L, 6, 1, -24, 7, 16);
  paperMountain(L, -10, 0, -26, 8, 20, 0xe2d4b6);
  // The bell
  const bell = new THREE.Group();
  const bm = mat(0xc9a227);
  bell.add(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.7, 1, 16, 1, true), bm));
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), bm);
  top.position.y = 0.5;
  bell.add(top);
  bell.position.set(-2.5, 8.2, -21.2);
  L.add(bell);
  L.box(-3.9, 9, -21.2, 0.2, 0.2, 3.2, 0x8a5a3c, { deco: true });
  L.box(-1.1, 9, -21.2, 0.2, 0.2, 3.2, 0x8a5a3c, { deco: true });
  L.box(-2.5, 9.1, -21.2, 3, 0.3, 0.2, 0x8a5a3c, { deco: true });
  L.trigger(-4, 5.5, -22, -1, 8, -19, () => { if (S.get() === 2) S.go(3); }, false);
  L.interact(-2.5, 5.8, -20.5, {
    label: 'Ring the Bell of the Pass', r: 2.6, enabled: () => S.get() === 3,
    use: () => {
      game.sound.chime();
      game.sound.songNote('Mi');
      let k = 0;
      L.every((t, dt) => { k += dt; bell.rotation.z = Math.sin(k * 10) * 0.5 * Math.max(0, 1 - k / 2); return k < 2; });
      L.pickup(-2.5, 7, -19.8, 'note');
      S.go(4);
    },
  });

  // Scenery
  paperMountain(L, -40, 0, -10, 10, 24);
  paperMountain(L, 40, 0, -20, 12, 28, 0xe2d4b6);
  paperMountain(L, 30, 0, 40, 9, 20);
  paperMountain(L, -35, 0, 35, 8, 18);
  mapleTree(L, -5, 1, 16, 1);
  mapleTree(L, 4, 1, -9, 1, 0xe8b931);
  for (const [x, z] of [[-6, 25], [6, 15], [22, 25], [-25, 20]]) { post(L, x, 1, z, 2.4, 0x8a5a3c); lantern(L, x, 3.4, z, 0xff9f6b, false); }
  for (let i = 0; i < 6; i++) cloud(L, Math.sin(i * 2) * 45, 18 + i * 2, Math.cos(i * 2) * 45, 3, 0xfff8e8);
  // Paper cranes circling
  for (let i = 0; i < 4; i++) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.1, 3), new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide, flatShading: true }));
    c.scale.set(2, 1, 0.6);
    L.add(c);
    L.every((t) => { const a = t * 0.3 + i * 1.6; c.position.set(Math.cos(a) * 18, 10 + i, Math.sin(a) * 18); c.rotation.y = -a; });
  }

  L.npc('fox', 3, 1, 17, 0.3);
  L.interact(3, 1, 17, {
    label: 'Talk to Fold', r: 2.6,
    use: async () => {
      if (S.get() === 0) {
        await game.say([
          ['Fold', 'Oh! Visitors, and not made of paper. Mind the creases.'],
          ['Fold', 'A great gust tore my map to pieces, and now the land is drifting apart.'],
          ['Fold', 'Your note became the Bell of the Pass, up on the folded mountain. But the bridge to it is torn too.'],
          ['Fold', 'Find the three torn map pieces. Each one you find unfolds a little more bridge.'],
          ['asher', 'One on the boat island, one on that tall rock, one across the stepping stones?'],
          ['Fold', 'You read maps very well, for a cat.'],
        ]);
        S.go(1);
        if (pieces >= 3) S.go(2); else game.objective(`Find the torn map pieces (${pieces}/3)`);
      } else game.say([['Fold', pieces >= 3 ? 'The bridge is whole! Up the mountain you go.' : `${pieces} of 3 pieces. The boat sails west, the stones lead east, and the tall rock needs a big leap.`]]);
    },
  });
  L.sunbeam(24, 1.8, 18);
  L.sunbeam(2, 1, -9);
  treats(L, [[-6, 1, 23], [-16, 0.8, 18], [-26, 1, 19], [-30, 1, 13], [10.8, 1.2, 19.5], [14.2, 1.5, 20.5], [17.6, 1.8, 19.5], [23, 1.8, 24], [0, 1, 10.5], [0, 1, 3.5], [0, 1, -3.5], [3, 1, -12], [-1, 2.6, -14], [-2, 4.2, -18]]);
  L.spawn = new V(0, 1, 23);
  L.spawnFacing = Math.PI;
  L.onStart = () => game.say([['asher', 'Everything is made of paper! Even the mountains.'], ['capp', 'Careful where you step. Paper tears, and that river is pure ink.']]);
  return L;
}

// ---------------------------------------------------------------- World 4
export function buildW4(game) {
  const L = new Level(game, 'w4');
  L.music = 'Fa';
  L.setSky('#1f3a2a', '#9ccc6a', 0x3f6a3a, 35, 110);
  L.lights({ sky: 0xe8ffd8, ground: 0x2f4a2a, hemi: 1.4, sun: 0xfff2c0, sunI: 1.3, dir: [-8, 22, 6] });
  L.killY = -8;
  const STONE = 0x9a9a88;
  const MOSS = 0x5a8a3a;
  const S = steps(game, [
    'Climb up to Queen Lumen\'s treehouse',
    'Turn the old water wheel by the waterfall',
    'Ride the lily lift to the plaza and press the rune plates in order',
    'Find Old Grub in the roots, through the root gate',
    'Take the note!',
  ]);
  L.startObjective = 'Climb up to Queen Lumen\'s treehouse';
  let wheelOn = false;

  L.box(0, 0, 0, 44, 44, 1, MOSS);
  // Ruins climb to the treehouse
  L.block(-6, -2, 4, 4, 0, 1.6, STONE);
  L.block(-8.5, -6.5, 3, 3, 0, 3.2, STONE);
  L.block(-12, -8.5, 4, 3, 0, 4.8, STONE);
  L.box(-13, 6.4, -13.5, 6, 5, 0.5, 0x8a5a3c);
  L.box(-13, 4, -16.5, 1.6, 1.6, 8, 0x6e4630, { deco: true, cyl: true });
  stiltHouse(L, -14.5, 6.4, -15.2, 2.4, 1.8, 1.8, 0, 0x3f9a4a);
  lantern(L, -10.4, 7.8, -11.4, 0xffe873, true);
  // Floating leaves for gliders (treats)
  L.box(-4, 5.4, -14, 3, 2, 0.3, 0x4f9a3a);
  L.box(2, 4.6, -13, 3, 2, 0.3, 0x4f9a3a);
  // Water wheel and waterfall
  const wheel = gear(L, 17, 3.5, -8, 3, 'x', 0, 0x8a5a3c);
  const fall = new THREE.Mesh(new THREE.PlaneGeometry(3, 12), new THREE.MeshLambertMaterial({ color: 0x8fd3ee, transparent: true, opacity: 0.7, emissive: 0x224455 }));
  fall.position.set(19.5, 6, -8);
  fall.rotation.y = -Math.PI / 2;
  L.add(fall);
  L.block(20.5, -8, 2, 10, 0, 12, STONE);
  L.every((t, dt) => { if (wheelOn) wheel.rotateZ(dt * 1.2); });
  L.interact(14.5, 0, -8, {
    label: 'Turn the water wheel', r: 2.8, enabled: () => S.get() === 1,
    use: async () => {
      await game.say([['asher', 'Hnnng... it\'s turning!'], ['capp', 'Listen. Water is flowing again. Something is rising by the plaza.']]);
      wheelOn = true;
      game.sound.door();
      S.go(2);
    },
  });
  // Lily lift and plaza
  L.box(10, 0.3, 4, 2.6, 2.6, 0.4, 0x6fbf5a, { cyl: true, move: (t) => ({ y: wheelOn ? 1.35 - 1.35 * Math.cos(t * 0.8) : 0 }) });
  L.box(12, 3.0, 12, 12, 12, 3, STONE);
  const order = [];
  const want = ['leaf', 'petal', 'sun'];
  let solved = false;
  const rune = (name, x, z, color) => L.plate(x, 3.1, z, 2, 2, color, (p) => {
    if (!p || solved) return;
    if (S.get() !== 2) { game.toast('The rune glows faintly, then fades.'); return; }
    order.push(name);
    const ok = order.every((n, i) => n === want[i]);
    if (!ok) { order.length = 0; game.toast('The runes go dark. Start again from the first one.'); game.sound.tone(150, 0.3, 'square', 0.06); return; }
    game.sound.songNote(['Do', 'Mi', 'Sol'][order.length - 1]);
    if (order.length === 3) {
      solved = true;
      game.toast('The root gate rumbles open!');
      L.removeSolid(gate);
      game.sound.door();
      S.go(3);
    }
  });
  rune('leaf', 8.5, 9, 0x4f9a3a);
  rune('petal', 12, 15, 0xff8fb1);
  rune('sun', 15.5, 9, 0xffd678);
  L.block(12, 7.2, 3, 0.6, 3, 5, 0x7a7a6a);
  L.interact(12, 3, 7.8, { label: 'Read the stone tablet', r: 2.4, use: () => game.say([['capp', 'The tablet shows a leaf, then a petal, then a sun.']]) });
  // Root cave behind a gate
  L.box(12, 0, 26, 12, 12, 1, 0x4a3a2a);
  L.block(5.7, 26, 0.6, 12.6, 0, 9, STONE);
  L.block(18.3, 26, 0.6, 12.6, 0, 9, STONE);
  L.block(12, 32.3, 13.2, 0.6, 0, 9, STONE);
  L.block(7.7, 19.7, 4.6, 0.6, 0, 9, STONE);
  L.block(16.3, 19.7, 4.6, 0.6, 0, 9, STONE);
  const gate = L.block(12, 19.7, 4, 0.6, 0, 9, 0x6e4630);
  for (let i = 0; i < 8; i++) {
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.3, 6, 6), new THREE.MeshLambertMaterial({ color: 0x8a5a3c, emissive: 0xffa040, emissiveIntensity: 0.35 }));
    r.position.set(7 + (i % 4) * 3, 3, 22 + Math.floor(i / 4) * 8);
    r.rotation.z = (i % 3 - 1) * 0.6;
    L.add(r);
  }
  const rootLight = new THREE.PointLight(0xffa040, 10, 16);
  rootLight.position.set(12, 4, 27);
  L.add(rootLight);
  L.trigger(6, 0, 20.5, 18, 4, 32, () => { if (S.get() === 3) game.hint('grub', 'Old Grub is grumpy. Only a calm purr will do: swap to Cappuccino.'); }, false);
  L.npc('cricket', 12, 0, 28.5, Math.PI);
  L.interact(12, 0, 28.5, {
    label: () => (S.get() === 3 ? 'Calm Purr' : 'Talk to Old Grub'), r: 3, who: 'capp',
    use: async () => {
      if (S.get() !== 3) { game.say([['Old Grub', 'HRRM. Who is down here? Go away.']]); return; }
      game.sound.purr(1.6);
      await game.say([
        ['Old Grub', 'HRRMM. Who digs in MY roots? Back! Back!'],
        ['capp', 'Shhh. Purrrr. We only want the note. It is not yours to keep.'],
        ['Old Grub', '...Hrm. It hums so nicely though. Fine. FINE. Take it.'],
      ]);
      L.pickup(12, 1.4, 25.5, 'note');
      S.go(4);
    },
  });

  // Scenery
  for (const [x, z, s] of [[-18, 10, 1.6], [16, -18, 1.4], [-20, -4, 1.2], [8, -18, 1.1], [-6, 18, 1.5], [20, 18, 1.3]]) palm(L, x, 0, z, s);
  for (let i = 0; i < 14; i++) bigLeaf(L, Math.sin(i * 2.3) * 19, 0.5 + (i % 3) * 0.4, Math.cos(i * 1.7) * 19, 1.2, i);
  for (const [x, z] of [[4, 10], [-4, 6], [9, -2], [-15, 4]]) { lotus(L, x, 0.02, z, 0.6, false); }
  for (const [x, y, z] of [[-17, 0, 16], [18, 0, 2], [-2, 0, -18]]) crystal(L, x, y + 0.8, z, 1.2, 0xffd0e8);
  for (let i = 0; i < 18; i++) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffe873 }));
    L.add(f);
    L.every((t) => { const a = t * 0.4 + i; f.position.set(Math.sin(a * 1.3) * 14, 2 + Math.sin(a * 2) * 1.5 + (i % 4), Math.cos(a) * 14); f.visible = Math.sin(t * 3 + i) > 0.2; });
  }

  L.npc('firefly', -13, 6.4, -13.5, 0.4);
  L.interact(-13, 6.4, -13.5, {
    label: 'Talk to Queen Lumen', r: 2.8,
    use: async () => {
      if (S.get() === 0) {
        await game.say([
          ['Queen Lumen', 'Visitors from the Big World. Forgive the dark.'],
          ['Queen Lumen', 'Your note fell into the roots beneath the old ruins. Without its hum my fireflies cannot glow, and the Glow Festival begins tonight.'],
          ['Queen Lumen', 'The root gate opens only when the rune plates on the plaza are pressed in the right order. But the plaza\'s lily lift has no water to run it.'],
          ['Queen Lumen', 'Turn the old water wheel by the waterfall, east of here.'],
          ['asher', 'Leave it to us. Well, the wheel part is me.'],
        ]);
        S.go(1);
      } else game.say([['Queen Lumen', 'Please hurry. The festival cannot start in the dark.']]);
    },
  });
  L.sunbeam(-13, 6.4, -12);
  L.sunbeam(12, 3, 13);
  treats(L, [[-6, 1.6, -2], [-8.5, 3.2, -6.5], [-12, 4.8, -8.5], [-4, 5.4, -14], [2, 4.6, -13], [14, 0, -4], [10, 0, 0], [8, 3, 16], [16, 3, 16], [12, 0, 23], [-10, 0, 10], [6, 0, 8], [-16, 0, -2]]);
  L.spawn = new V(0, 0, 12);
  L.spawnFacing = Math.PI;
  L.onStart = () => game.say([['asher', 'Fireflies! Wait. Why aren\'t they glowing?'], ['capp', 'The light here is wrong. Something is missing. Let us find whoever is in charge, up in that treehouse.']]);
  return L;
}
