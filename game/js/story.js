// World list, abilities and all story text.
export const WORLDS = [
  { id: 'w1', n: 1, note: 'Do', name: 'Lilypad Bazaar', where: 'the bathtub', ability: 'bubble', img: 'art/scene-market.jpg', tip: 'Fall in the water and you pop back to the last sunbeam. Cats hate baths anyway.' },
  { id: 'w2', n: 2, note: 'Re', name: 'Clockwork Bakery', where: 'the oven', ability: 'spring', img: 'art/scene-bakery.jpg', tip: 'Cappuccino\'s Whisker Sense (Paw with nothing nearby) shows things that are hidden.' },
  { id: 'w3', n: 3, note: 'Mi', name: 'Folded Atlas', where: 'the old atlas on the bookshelf', ability: 'glide', img: 'art/scene-paper.jpg', tip: 'Hold Skill to wind up the spring, then let go to leap.' },
  { id: 'w4', n: 4, note: 'Fa', name: 'Canopy Hollow', where: 'the potted palm', ability: 'lantern', img: 'art/scene-jungle.jpg', tip: 'Hold Jump while falling to glide on your paper crane.' },
  { id: 'w5', n: 5, note: 'Sol', name: 'Spin Cycle Circus', where: 'the dryer', ability: 'dash', img: null, color: '#e63946', tip: 'Asher can jump off Cappuccino\'s back to reach high places. Let her sit still first.' },
  { id: 'w6', n: 6, note: 'La', name: 'Quilted Dreamsky', where: 'the quilt on the bed', ability: 'echo', img: 'art/scene-dream.jpg', tip: 'Stay away from the grey fog. That is the Hush.' },
  { id: 'w7', n: 7, note: 'Ti', name: 'Sky Harbor', where: 'the balcony wind chimes', ability: 'wind', img: null, color: '#5aa0d6', tip: 'Echo Meow (Skill) clears Hush fog and shows hidden paths.' },
  { id: 'finale', n: 8, note: 'Do2', name: 'Music Box Ballroom', where: 'the music box', ability: null, img: null, color: '#b8902a', tip: 'Every ability you have earned is needed here.' },
];

export const ABILITIES = {
  bubble: { name: 'Bubble Hop', desc: 'Stand in a column of rising bubbles to float up to high places.' },
  spring: { name: 'Wind-Up Spring', desc: 'Hold Skill to wind up, then let go for a huge leap.', skill: true },
  glide: { name: 'Paper Glide', desc: 'Hold Jump while falling to glide on a paper crane.' },
  lantern: { name: 'Firefly Lantern', desc: 'A firefly friend lights dark places and shows paths hidden in the dark.' },
  dash: { name: 'Spin Dash', desc: 'Asher only. Press Skill to roll forward fast and burst through heavy doors.', skill: true },
  echo: { name: 'Echo Meow', desc: 'Press Skill to meow. It clears Hush fog and reveals hidden paths nearby.', skill: true },
  wind: { name: 'Wind Whiskers', desc: 'Ride warm updrafts higher than any jump.' },
};

export const INTRO = [
  { title: 'Apartment 41C', img: 'art/room-living.jpg', text: 'High above Lumen City live two cats. Cappuccino is an older calico, cautious and careful, who checks every ledge twice. Asher is young, white and grey, and has never met a shelf he didn\'t want to climb.' },
  { title: 'Monday morning', img: 'art/cats-together.jpg', text: 'Their human, Noor, has gone away for a week. The neighbor fills the food bowls every morning. Everything is calm. Then Asher gets the zoomies.' },
  { title: 'Crash', img: null, color: '#2f2638', text: 'Grandma Ines\'s music box tumbles off the coffee table and cracks open. Seven glowing notes fly out of it and dive into the furniture.' },
  { title: 'The Hush', img: null, color: '#3a3648', text: 'Without its song, the tiny worlds hidden in the apartment begin to leak, and a grey quiet called the Hush creeps in. Find all seven notes before Noor comes home on Sunday night.' },
];

export const INTRO_TALK = [
  ['capp', 'Asher. What. Did. You. Do.'],
  ['asher', 'It fell near me!'],
  ['capp', 'That music box has played Grandma Ines\'s song every night for fourteen years. We are getting those notes back. Carefully.'],
  ['asher', 'Carefully. Sure. Hey, look, the bathtub is glowing!'],
  ['capp', 'Of course it is. Stay close, and look before you leap. One of us has to.'],
];

// Shown after each note is recovered: the night's dream and the next morning.
export const AFTER = {
  w1: {
    card: { title: 'Monday night', img: 'art/room-bedroom.jpg', text: 'Cappuccino dreams of Grandma Ines humming while she baked, the kitchen as warm as a sunbeam.' },
    talk: [['asher', 'Morning! Do you smell bread? I smell bread.'], ['capp', 'The oven. It is glowing. Those bubbles leaking from the bathroom might lift you up to it.'], ['asher', 'Bubble Hop time!']],
  },
  w2: {
    card: { title: 'Tuesday night', img: 'art/room-living.jpg', text: 'In her dream, Grandma Ines reads aloud from her old atlas, pointing to faraway places, a tiny calico kitten asleep on her lap.' },
    talk: [['capp', 'Her atlas. It is on the very top of the bookshelf, and it is glowing.'], ['asher', 'Too high to jump... unless I wind up the spring!'], ['capp', 'Hold the Skill button to wind it. And please land on something.']],
  },
  w3: {
    card: { title: 'Wednesday night', img: 'art/room-living.jpg', text: 'Grandma Ines waters her palm and tells it about her day, as if it could listen. Maybe it could.' },
    talk: [['asher', 'The palm by the sofa is glowing now.'], ['capp', 'Hold Jump while you fall and the paper crane will carry you. Or use your spring. Gently.']],
  },
  w4: {
    card: { title: 'Thursday night', img: 'art/room-bedroom.jpg', text: 'Warm laundry fresh from the dryer, a kitten asleep in the middle of it, and Grandma Ines laughing too hard to move her.' },
    talk: [['capp', 'The laundry closet. It is far too dark in there.'], ['asher', 'Not with our firefly friend! Come on, the dryer is humming.']],
  },
  w5: {
    card: { title: 'Friday night', img: 'art/room-bedroom.jpg', text: 'The patchwork quilt, stitched one square at a time. "One square for every good day," Grandma Ines said.' },
    talk: [['capp', 'The bedroom has gone completely silent. The Hush is in there.'], ['asher', 'That door is heavy. Good thing I can Spin Dash now.'], ['capp', 'Be careful, Asher. I mean it.']],
  },
  w6: {
    card: { title: 'Saturday night', img: 'art/room-balcony.jpg', text: 'Grandma Ines by the window as the wind chimes ring. "Wherever I go," she says, "this song always finds its way home."' },
    talk: [['asher', 'You were really tired yesterday. Are you okay?'], ['capp', 'I am fine. You carried me. I will not forget that.'], ['asher', '...The balcony is fogged up. Echo Meow?'], ['capp', 'Echo Meow.']],
  },
  w7: {
    card: { title: 'Sunday evening', img: 'art/room-living.jpg', text: 'Seven notes are back. Only the music box itself is left, and the Hush is waiting inside it.' },
    talk: [['capp', 'This is it. Noor will be home tonight.'], ['asher', 'We do it together. Carefully.'], ['capp', 'Carefully. And maybe a little boldly.']],
  },
};

export const ENDING = [
  { title: 'The Homesong', img: null, color: '#2f2638', text: 'The seven notes rise and the Homesong fills the apartment again. Then the song finds an eighth note, one that was never in it before. It sounds a lot like a bold young cat.' },
  { title: 'Sunday night', img: 'art/cats-together.jpg', text: 'Noor comes home, winds the music box, and listens. She finds two cats asleep on the green sofa, curled up together.' },
  { title: 'Second Verse', img: 'art/room-living.jpg', text: 'Thank you for playing. Every world stays open: go back for the fish treats you missed. Your progress is saved.' },
];

export const FACES = { capp: 'art/face-cappuccino.jpg', asher: 'art/face-asher.jpg' };
export const NAMES = { capp: 'Cappuccino', asher: 'Asher' };
