import { FACES, NAMES, WORLDS, ABILITIES } from './story.js';

const $ = (s) => document.querySelector(s);
const NPC_COLORS = { 'Madame Ottilie': '#2bb3b0', 'Baron Croak': '#8b7a3a', 'Chef Brioche': '#c98b2b', Tock: '#b8863b', Fold: '#e8823a', 'Queen Lumen': '#e8c22a', 'Old Grub': '#6e4a2e', 'Ringmaster Argyle': '#e63946', Pillowcat: '#b9a6e3', 'The Hush': '#8f8aa0', 'Captain Coo': '#5aa0d6' };

export class UI {
  constructor() {
    this.modal = null;
    this.queue = null;
    this.toastT = null;
    this.hud = $('#hud');
  }

  esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  // ----- dialogue -----
  say(lines) {
    return new Promise((resolve) => {
      this.queue = { lines: lines.slice(), resolve };
      this.modal = 'dialog';
      $('#dialog').hidden = false;
      this.showLine();
    });
  }

  showLine() {
    const [who, text] = this.queue.lines.shift();
    const face = FACES[who];
    const name = NAMES[who] || who;
    const img = $('#dlgFace');
    const chip = $('#dlgChip');
    if (face) { img.src = face; img.hidden = false; chip.hidden = true; } else {
      img.hidden = true;
      chip.hidden = false;
      chip.textContent = name.replace(/^The /, '')[0];
      chip.style.background = NPC_COLORS[name] || '#6b5a7a';
    }
    $('#dlgName').textContent = name;
    $('#dlgText').textContent = text;
  }

  advance() {
    if (this.modal === 'dialog') {
      if (this.queue.lines.length) this.showLine();
      else {
        $('#dialog').hidden = true;
        this.modal = null;
        const r = this.queue.resolve;
        this.queue = null;
        r();
      }
    } else if (this.modal === 'card') {
      $('#card').hidden = true;
      this.modal = null;
      const r = this.cardResolve;
      this.cardResolve = null;
      r();
    }
  }

  // ----- story cards -----
  card(c) {
    return new Promise((resolve) => {
      this.modal = 'card';
      this.cardResolve = resolve;
      const el = $('#card');
      el.hidden = false;
      const art = $('#cardArt');
      if (c.img) { art.style.backgroundImage = `url(${c.img})`; art.style.backgroundColor = ''; } else { art.style.backgroundImage = 'none'; art.style.backgroundColor = c.color || '#2f2638'; }
      $('#cardTitle').textContent = c.title;
      $('#cardText').textContent = c.text;
      $('#cardBtn').textContent = c.button || 'Continue';
    });
  }

  async cards(list) { for (const c of list) await this.card(c); }

  // ----- loading -----
  showLoading(title, img, tip, color) {
    const el = $('#loading');
    el.hidden = false;
    const art = $('#loadArt');
    if (img) { art.style.backgroundImage = `url(${img})`; art.style.backgroundColor = ''; } else { art.style.backgroundImage = 'none'; art.style.backgroundColor = color || '#2f2638'; }
    $('#loadName').textContent = title;
    $('#loadTip').textContent = tip || '';
  }

  hideLoading() { $('#loading').hidden = true; }

  // ----- HUD -----
  objective(text) {
    const el = $('#objective');
    el.textContent = text || '';
    el.hidden = !text;
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  }

  toast(text, ms = 2600) {
    const el = $('#toast');
    el.textContent = text;
    el.hidden = false;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(this.toastT);
    this.toastT = setTimeout(() => { el.hidden = true; }, ms);
  }

  prompt(text) {
    const el = $('#prompt');
    if (!text) { el.hidden = true; return; }
    el.hidden = false;
    el.textContent = text;
  }

  hudUpdate(game) {
    $('#pCapp').classList.toggle('on', game.active.kind === 'capp');
    $('#pAsher').classList.toggle('on', game.active.kind === 'asher');
    $('#treats').textContent = game.save.treats;
    const dots = $('#notesRow').children;
    for (let i = 0; i < 7; i++) dots[i].classList.toggle('got', game.save.notes.includes(WORLDS[i].id));
    const sk = game.selectedSkill();
    const btn = $('#skillBtn');
    btn.hidden = !sk;
    if (sk) $('#skillName').textContent = ABILITIES[sk].name.replace('Wind-Up ', '').replace(' Meow', '');
    $('#cycleBtn').hidden = game.skills().length < 2;
    const ch = $('#charge');
    ch.hidden = !(game.active.chargeT > 0);
    if (game.active.chargeT > 0) $('#chargeBar').style.width = Math.round((game.active.chargeT / 0.8) * 100) + '%';
  }

  darkness(level) {
    $('#darkness').style.opacity = level;
  }

  flash() {
    const f = $('#fade');
    f.classList.remove('go');
    void f.offsetWidth;
    f.classList.add('go');
  }

  // ----- map -----
  showMap(game) {
    this.modal = 'map';
    $('#map').hidden = false;
    const layer = $('#mapMarks');
    const pos = { w1: [25.2, 28.2], w2: [14.2, 59.8], w3: [61.3, 47], w4: [40, 53.8], w5: [38.7, 18.8], w6: [55.5, 24.8], w7: [92.9, 29.9], finale: [59.4, 66.7] };
    const next = game.nextWorld();
    layer.innerHTML = WORLDS.map((w) => {
      const done = game.save.notes.includes(w.id) || (w.id === 'finale' && game.save.done);
      const cls = done ? 'done' : (next && next.id === w.id ? 'next' : 'locked');
      const [x, y] = pos[w.id];
      return `<div class="mk ${cls}" style="left:${x}%;top:${y}%"><b>${w.id === 'finale' ? '&#9834;' : w.n}</b><span>${this.esc(w.name)}</span></div>`;
    }).join('');
    $('#mapNext').textContent = next ? `Next: ${next.name}, in ${next.where}.` : 'Every note is home. All worlds are open to replay.';
  }

  hideMap() { $('#map').hidden = true; this.modal = null; }

  showMenu(inWorld) {
    this.modal = 'menu';
    $('#menu').hidden = false;
    $('#mHub').hidden = !inWorld;
  }

  hideMenu() { $('#menu').hidden = true; this.modal = null; }

  // ----- finale rhythm duet -----
  duet(sound) {
    return new Promise((resolve) => {
      this.modal = 'duet';
      const el = $('#duet');
      el.hidden = false;
      const names = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Ti', 'Do2'];
      const labels = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Ti', 'Do'];
      const ring = $('#duetRing');
      const noteEl = $('#duetNote');
      const who = $('#duetWho');
      const msg = $('#duetMsg');
      let i = 0;
      let start = performance.now();
      const period = 1700;
      let raf;
      const hits = [];
      const render = () => {
        const k = ((performance.now() - start) % period) / period;
        const scale = 2.2 - k * 1.8;
        ring.style.transform = `translate(-50%,-50%) scale(${scale})`;
        raf = requestAnimationFrame(render);
      };
      const setNote = () => {
        noteEl.textContent = labels[i];
        who.textContent = i === 7 ? 'Asher\'s new note' : (i % 2 ? 'Asher meows' : 'Cappuccino purrs');
        $('#duetDots').innerHTML = labels.map((l, j) => `<i class="${j < i ? 'got' : ''}"></i>`).join('');
        start = performance.now();
      };
      let finished = false;
      this.duetTap = () => {
        if (finished) return;
        const k = ((performance.now() - start) % period) / period;
        const scale = 2.2 - k * 1.8;
        if (Math.abs(scale - 1) < 0.28) {
          sound.songNote(names[i]);
          if (i % 2) sound.meow(1.2); else sound.purr(0.6);
          hits.push(i);
          i++;
          msg.textContent = ['Lovely!', 'In tune!', 'Beautiful!', 'Yes!'][i % 4];
          if (i >= 8) {
            finished = true;
            cancelAnimationFrame(raf);
            setTimeout(() => { el.hidden = true; this.modal = null; this.duetTap = null; resolve(); }, 900);
            return;
          }
          setNote();
        } else {
          msg.textContent = 'Wait for the ring to meet the circle, then tap.';
          sound.tone(140, 0.15, 'square', 0.04);
        }
      };
      setNote();
      msg.textContent = 'Tap (or press Jump) when the shrinking ring meets the circle.';
      render();
    });
  }
}
