// Synthesised sound: no audio files needed. Everything is built from oscillators and noise.
export const NOTES = { Do: 261.63, Re: 293.66, Mi: 329.63, Fa: 349.23, Sol: 392.0, La: 440.0, Ti: 493.88, Do2: 523.25 };
const SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];

export class Sound {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicTimer = null;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.6;
      this.master.connect(this.ctx.destination);
      this.music = this.ctx.createGain();
      this.music.gain.value = 0.16;
      this.music.connect(this.master);
      const len = this.ctx.sampleRate;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) {
      this.ctx = null;
    }
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.6;
  }

  tone(freq, dur, type = 'sine', vol = 0.2, slideTo = null, delay = 0, bus = null) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(bus || this.master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  noiseBurst(dur, vol, freq, delay = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const s = this.ctx.createBufferSource();
    s.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f);
    f.connect(g);
    g.connect(this.master);
    s.start(t);
    s.stop(t + dur + 0.05);
  }

  jump(big) { this.tone(big ? 300 : 420, 0.14, 'square', 0.05, big ? 900 : 700); }
  land() { this.tone(150, 0.08, 'sine', 0.12, 80); }
  bounce() { this.tone(200, 0.25, 'sine', 0.15, 700); }
  collect() { this.tone(988, 0.1, 'sine', 0.12); this.tone(1319, 0.16, 'sine', 0.1, null, 0.07); }
  item() { [523, 659, 784].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.12, null, i * 0.08)); }
  click() { this.tone(660, 0.05, 'triangle', 0.08); }
  poof() { this.noiseBurst(0.3, 0.2, 1200); }
  splash() { this.noiseBurst(0.5, 0.3, 2500); this.tone(300, 0.3, 'sine', 0.08, 120); }
  crumble() { this.noiseBurst(0.25, 0.15, 600); }
  dash() { this.noiseBurst(0.3, 0.15, 3000); this.tone(200, 0.3, 'sawtooth', 0.05, 600); }
  sense() { [1200, 1500, 1800].forEach((f, i) => this.tone(f, 0.4, 'sine', 0.05, f * 1.2, i * 0.05)); }
  door() { this.noiseBurst(0.5, 0.25, 400); this.tone(90, 0.4, 'square', 0.08, 50); }
  chime() { [1047, 1319, 1568, 2093].forEach((f, i) => this.tone(f, 0.8, 'sine', 0.08, null, i * 0.12)); }

  meow(pitch = 1) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(420 * pitch, t);
    o.frequency.linearRampToValueAtTime(760 * pitch, t + 0.15);
    o.frequency.linearRampToValueAtTime(480 * pitch, t + 0.45);
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 3;
    f.frequency.setValueAtTime(900, t);
    f.frequency.linearRampToValueAtTime(1800, t + 0.15);
    f.frequency.linearRampToValueAtTime(1000, t + 0.45);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(f);
    f.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + 0.55);
  }

  purr(dur = 1.2) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = 48;
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 24;
    const lg = this.ctx.createGain();
    lg.gain.value = 0.08;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.1, t + 0.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 300;
    lfo.connect(lg);
    lg.connect(g.gain);
    o.connect(f);
    f.connect(g);
    g.connect(this.master);
    o.start(t);
    lfo.start(t);
    o.stop(t + dur + 0.1);
    lfo.stop(t + dur + 0.1);
  }

  // A sung note of the Homesong: the note, a fifth and an octave shimmer.
  songNote(name, delay = 0) {
    const f = NOTES[name] || 261.63;
    this.tone(f, 1.2, 'triangle', 0.18, null, delay);
    this.tone(f * 2, 1.0, 'sine', 0.06, null, delay + 0.02);
    this.tone(f * 1.5, 0.9, 'sine', 0.04, null, delay + 0.1);
  }

  homesong(upTo = 8, gap = 0.42) {
    const names = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Ti', 'Do2'];
    names.slice(0, upTo).forEach((n, i) => this.songNote(n, i * gap));
  }

  // Gentle generative music built on a world's note.
  startMusic(rootName = 'Do', tempo = 0.5) {
    this.stopMusic();
    if (!this.ctx) return;
    const root = NOTES[rootName] || 261.63;
    const ratio = root / 261.63;
    let beat = 0;
    const melody = [0, 2, 4, 3, 2, 4, 5, 4];
    this.musicTimer = setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running') return;
      const bar = Math.floor(beat / 8);
      if (beat % 8 === 0) {
        this.tone(root / 2, tempo * 7, 'sine', 0.35, null, 0, this.music);
        this.tone(root * 0.75, tempo * 7, 'sine', 0.15, null, 0, this.music);
      }
      if (beat % 2 === 0 || Math.random() < 0.3) {
        const idx = (melody[(beat + bar) % 8] + (bar % 2 ? 1 : 0)) % SCALE.length;
        this.tone(SCALE[idx] * ratio, tempo * 1.6, 'triangle', 0.18, null, 0, this.music);
      }
      beat++;
    }, tempo * 1000);
  }

  stopMusic() {
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
  }
}
