// Unified input: keyboard + mouse, touch (joystick, camera drag, buttons) and gamepad.
const KEYMAP = {
  Space: 'jump', KeyE: 'paw', KeyF: 'paw', Tab: 'swap', ShiftLeft: 'skill', ShiftRight: 'skill',
  KeyQ: 'cycle', Escape: 'pause', KeyP: 'pause', KeyM: 'map', KeyC: 'recenter', Enter: 'confirm',
};
const PAD = { 0: 'jump', 2: 'paw', 3: 'swap', 7: 'skill', 5: 'cycle', 9: 'pause', 8: 'map', 11: 'recenter', 1: 'confirm' };

export class Input {
  constructor(canvas, touchLayer) {
    this.keys = {};
    this.held = {};
    this.pressed = new Set();
    this.move = { x: 0, y: 0 };
    this.look = { x: 0, y: 0 };
    this.zoom = 0;
    this.lastLook = 0;
    this.usingTouch = false;
    this.joy = null;
    this.camTouch = null;
    this.lastCamTap = 0;
    this.padPrev = {};

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Tab') e.preventDefault();
      if (e.code === 'Space' && e.target === document.body) e.preventDefault();
      this.keys[e.code] = true;
      const b = KEYMAP[e.code];
      if (b && !e.repeat) this.down(b);
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      const b = KEYMAP[e.code];
      if (b) this.up(b);
    });
    window.addEventListener('blur', () => { this.keys = {}; this.held = {}; });

    // Mouse drag rotates the camera.
    let dragging = false;
    canvas.addEventListener('mousedown', () => { dragging = true; });
    window.addEventListener('mouseup', () => { dragging = false; });
    window.addEventListener('mousemove', (e) => {
      if (dragging || document.pointerLockElement === canvas) {
        this.look.x += e.movementX * 0.005;
        this.look.y += e.movementY * 0.004;
        this.lastLook = performance.now();
      }
    });
    canvas.addEventListener('wheel', (e) => { this.zoom += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Touch: left half = floating joystick, right half = camera drag.
    const layer = touchLayer;
    layer.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return;
      this.usingTouch = true;
      document.body.classList.add('touch');
      const w = window.innerWidth;
      if (e.clientX < w * 0.45 && !this.joy) {
        this.joy = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY };
        this.showJoy();
      } else if (!this.camTouch) {
        const now = performance.now();
        if (now - this.lastCamTap < 300) this.down('recenter');
        this.lastCamTap = now;
        this.camTouch = { id: e.pointerId, x: e.clientX, y: e.clientY };
      }
      try { layer.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    });
    layer.addEventListener('pointermove', (e) => {
      if (this.joy && e.pointerId === this.joy.id) {
        this.joy.x = e.clientX;
        this.joy.y = e.clientY;
        this.showJoy();
      } else if (this.camTouch && e.pointerId === this.camTouch.id) {
        this.look.x += (e.clientX - this.camTouch.x) * 0.008;
        this.look.y += (e.clientY - this.camTouch.y) * 0.006;
        this.camTouch.x = e.clientX;
        this.camTouch.y = e.clientY;
        this.lastLook = performance.now();
      }
    });
    const end = (e) => {
      if (this.joy && e.pointerId === this.joy.id) { this.joy = null; this.showJoy(); }
      if (this.camTouch && e.pointerId === this.camTouch.id) this.camTouch = null;
    };
    layer.addEventListener('pointerup', end);
    layer.addEventListener('pointercancel', end);

    // On-screen buttons: any element with data-btn.
    document.querySelectorAll('[data-btn]').forEach((el) => {
      const name = el.dataset.btn;
      el.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); this.down(name); el.classList.add('down'); });
      const up = (e) => { e.preventDefault(); this.up(name); el.classList.remove('down'); };
      el.addEventListener('pointerup', up);
      el.addEventListener('pointerleave', up);
      el.addEventListener('pointercancel', up);
    });

    this.joyBase = document.getElementById('joy');
    this.joyKnob = document.getElementById('joyKnob');
  }

  showJoy() {
    if (!this.joyBase) return;
    if (!this.joy) {
      this.joyBase.classList.remove('on');
      return;
    }
    const R = 56;
    let dx = this.joy.x - this.joy.x0;
    let dy = this.joy.y - this.joy.y0;
    const l = Math.hypot(dx, dy);
    if (l > R) { dx *= R / l; dy *= R / l; }
    this.joyBase.classList.add('on');
    this.joyBase.style.left = this.joy.x0 + 'px';
    this.joyBase.style.top = this.joy.y0 + 'px';
    this.joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  down(b) {
    if (!this.held[b]) this.pressed.add(b);
    this.held[b] = true;
  }

  up(b) { this.held[b] = false; }

  consume(b) {
    const had = this.pressed.has(b);
    this.pressed.delete(b);
    return had;
  }

  update(dt) {
    let x = 0;
    let y = 0;
    const k = this.keys;
    if (k.KeyA || k.ArrowLeft) x -= 1;
    if (k.KeyD || k.ArrowRight) x += 1;
    if (k.KeyW || k.ArrowUp) y += 1;
    if (k.KeyS || k.ArrowDown) y -= 1;
    if (this.joy) {
      const R = 56;
      const jx = (this.joy.x - this.joy.x0) / R;
      const jy = -(this.joy.y - this.joy.y0) / R;
      x += Math.max(-1, Math.min(1, jx));
      y += Math.max(-1, Math.min(1, jy));
    }
    // Gamepad
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) {
      if (!p) continue;
      const dz = (v) => (Math.abs(v) < 0.18 ? 0 : v);
      x += dz(p.axes[0] || 0);
      y -= dz(p.axes[1] || 0);
      const lx = dz(p.axes[2] || 0);
      const ly = dz(p.axes[3] || 0);
      if (lx || ly) {
        this.look.x += lx * dt * 2.6;
        this.look.y += ly * dt * 1.6;
        this.lastLook = performance.now();
      }
      p.buttons.forEach((btn, i) => {
        const name = PAD[i];
        if (!name) return;
        const was = this.padPrev[p.index + ':' + i];
        if (btn.pressed && !was) this.down(name);
        if (!btn.pressed && was) this.up(name);
        this.padPrev[p.index + ':' + i] = btn.pressed;
      });
      break;
    }
    const l = Math.hypot(x, y);
    if (l > 1) { x /= l; y /= l; }
    this.move.x = x;
    this.move.y = y;
  }

  endFrame() {
    this.pressed.clear();
    this.look.x = 0;
    this.look.y = 0;
    this.zoom = 0;
  }
}
