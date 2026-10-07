import { ActionCue } from './action-cue.js';
// Physical surfaces are expressed in the painting's coordinates. Their native
// buttons serve the keyboard; pointer gestures act on the water, steps or lily.
export class Garden {
  constructor({ element, surfaces, hint, realm, painting, life, reducedMotion, onRipple, onComplete, announce }) {
    Object.assign(this, { element, surfaces, hint, realm, painting, life, reducedMotion, onRipple, onComplete, announce });
    this.cue = new ActionCue(element);
    this.active = false;
    element.addEventListener('pointerdown', event => this.press(event));
    element.addEventListener('pointermove', event => this.move(event));
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) element.addEventListener(name, () => this.release());
  }

  start(config, realm = this.realm, painting = this.painting) {
    this.hide(); Object.assign(this, { config, realm, painting, active: true, busy: false, finished: false });
    this.noticeRemaining = 0; this.progress = 0; this.lastTime = 0;
    this.element.hidden = false; this.element.dataset.kind = config.kind; this.element.dataset.progress = '0';
    this.hint.textContent = config.hint;
    this.button = document.createElement('button');
    this.button.type = 'button'; this.button.className = 'garden-surface'; this.button.dataset.surface = '0';
    this.button.setAttribute('aria-label', config.hint + ' Dengan keyboard, tekan Enter untuk melakukan sentuhan ini.');
    this.button.addEventListener('keydown', event => {
      if (!['Enter', ' '].includes(event.key)) return;
      event.preventDefault(); event.stopPropagation();
      if (!event.repeat) this.keyboard();
    });
    this.button.addEventListener('click', event => { if (event.detail === 0) this.keyboard(); });
    this.surfaces.replaceChildren(this.button);
    if (['lily', 'rest'].includes(config.kind)) this.life.showLily(config.lily);
    this.life.cue(config.kind, config.spot, config.lily);
    this.painting.pointSource(config.spot.x, config.spot.y);
    this.position(); this.button.focus({ preventScroll: true });
    this.announce(config.hint + ' Dengan keyboard, tekan Enter.');
  }

  onSurface(x, y) {
    if (this.config.area) {
      const [left, top, right, bottom] = this.config.area;
      return x >= left && x <= right && y >= top && y <= bottom;
    }
    const spot = this.config.spot, radius = this.config.radius;
    return ((x - spot.x) / radius) ** 2 + ((y - spot.y) / (radius * 2.0)) ** 2 < 1.5;
  }

  press(event) {
    if (!this.active || this.busy || event.button > 0) return;
    const [x, y] = this.painting.source(event.clientX, event.clientY);
    if (!this.onSurface(x, y)) return;
    event.preventDefault();
    this.holding = { id: event.pointerId, x: event.clientX, y: event.clientY, sx: x, sy: y, distance: 0, elapsed: 0 };
    this.element.setPointerCapture(event.pointerId);
    this.button.focus({ preventScroll: true });
    this.life.pointer(x, y, true);
    if (this.config.kind !== 'passage') this.ripple(event.clientX, event.clientY);
  }

  move(event) {
    if (!this.holding || event.pointerId !== this.holding.id) return;
    const [sx, sy] = this.painting.source(event.clientX, event.clientY), hold = this.holding;
    if (!this.onSurface(sx, sy) && this.config.kind !== 'passage') { this.release(); return; }
    hold.distance += Math.min(25, Math.hypot(event.clientX - hold.x, event.clientY - hold.y));
    hold.x = event.clientX; hold.y = event.clientY; hold.sx = sx; hold.sy = sy;
    this.life.pointer(sx, sy, true);
    if (['stream', 'beckon', 'fish'].includes(this.config.kind) && performance.now() - (this.lastRipple || 0) > 180) this.ripple(hold.x, hold.y);
  }

  ripple(x, y) {
    this.lastRipple = performance.now(); this.painting.ripple(x, y); this.onRipple?.(x, y);
  }

  release() {
    const hold = this.holding; this.holding = null;
    this.life.pointer(null, null, false);
    if (hold && this.element.hasPointerCapture(hold.id)) this.element.releasePointerCapture(hold.id);
    if (this.active && !this.busy && this.config.kind !== 'passage') {
      this.progress = 0; this.element.dataset.progress = '0'; this.life.charge = 0;
    }
  }

  keyboard() {
    if (!this.active || this.busy || this.holding) return;
    this.keyboardWalking = true;
    // Identical outcome and reveal, without requiring a pointer or sustained key.
    if (this.config.kind !== 'passage') this.perform(this.config.spot);
  }

  perform(spot) {
    if (!this.active || this.busy) return;
    this.release(); this.busy = true; this.keyboardWalking = false;
    this.element.dataset.progress = '1'; this.painting.clearGuide(); this.life.charge = 0;
    const kind = this.config.kind, point = this.realm.project(spot.x, spot.y);
    if (kind === 'stream') {
      this.ripple(point.x, point.y);
      this.painting.blessing[0] = 1;
      this.hint.textContent = 'Riak menyusuri batu. Di sela akar, daun-daun menangkap cahaya.';
      this.noticeRemaining = this.reducedMotion ? 80 : 2300;
    } else if (kind === 'passage') {
      this.hint.textContent = ''; this.noticeRemaining = 50;
    } else if (kind === 'beckon' || kind === 'fish') {
      this.life.leap(spot, kind === 'fish');
      this.hint.textContent = kind === 'fish' ? 'Ia memilih arahnya sendiri.' : 'Ia mendekat…';
      this.noticeRemaining = this.reducedMotion ? 80 : 3000;
    } else {
      this.life.openLily(this.config.lily, kind === 'rest');
      this.painting.blessing[kind === 'rest' ? 2 : 1] = 1;
      this.hint.textContent = kind === 'rest' ? 'Tidak perlu melakukan apa-apa. Nikmati sebentar.' : 'Kelopaknya membuka. Air terus mengalir untuknya.';
      this.noticeRemaining = this.reducedMotion ? 80 : kind === 'rest' ? 6500 : 4800;
    }
    this.announce(this.hint.textContent);
  }

  position() {
    if (!this.active || !this.realm.frame) return;
    if (this.busy) { this.cue.hide(); return; }
    const spot = this.config.spot, p = this.realm.project(spot.x, spot.y);
    const radius = this.config.radius || .035, frame = this.realm.frame;
    Object.assign(this.button.style, { left: p.x + 'px', top: p.y + 'px',
      width: Math.max(60, frame.width * radius * 2) + 'px',
      height: Math.max(60, frame.height * radius * 4) + 'px' });
    this.cue.show(this.config.kind === 'passage' ? (this.holding || this.keyboardWalking ? 'SEDANG BERJALAN…' : 'TAHAN ANAK TANGGA INI') :
      ['lily', 'rest'].includes(this.config.kind) ? 'TAHAN KUNCUP INI' : 'USAP AIR DEKAT IKAN', p,
      { busy: Boolean(this.holding || this.keyboardWalking) });
  }

  update(time) {
    if (!this.active) return;
    const dt = Math.min(80, this.lastTime ? time - this.lastTime : 0); this.lastTime = time;
    this.position();
    if (this.noticeRemaining > 0) {
      this.noticeRemaining -= dt;
      if (this.noticeRemaining <= 0) this.complete();
      return;
    }
    if (!this.holding && !this.keyboardWalking) return;
    const hold = this.holding, kind = this.config.kind;
    if (kind === 'passage') {
      this.progress = Math.min(1, this.progress + dt / (this.reducedMotion ? 350 : 4300));
      const p = this.progress;
      this.realm.move({ x: .83 + p * .012, y: .50 - p * .08, zoom: 1.03 + p * .38 }, 0);
      this.element.dataset.progress = p.toFixed(3);
      if (p >= 1) this.perform(this.config.spot);
      return;
    }
    hold.elapsed += dt;
    const required = kind === 'rest' ? 1800 : kind === 'lily' ? 1100 : kind === 'beckon' ? 1100 : 1000;
    this.progress = Math.min(1, hold.elapsed / required);
    this.life.charge = this.progress; this.element.dataset.progress = this.progress.toFixed(3);
    if (kind === 'fish') {
      if ((hold.distance > 95 && hold.elapsed > 700) || hold.elapsed > 2700) this.perform({ x: hold.sx, y: hold.sy });
    } else if (this.progress >= 1) this.perform(kind === 'beckon' ? { x: hold.sx, y: hold.sy } : this.config.spot);
  }

  complete() {
    if (this.finished) return;
    this.finished = true; this.onComplete();
  }

  hide() {
    this.cue?.hide();
    this.release(); this.active = false; this.element.hidden = true; this.keyboardWalking = false;
    this.noticeRemaining = 0; this.painting.clearGuide(); this.life.cue(null);
  }

  reset() {
    this.hide(); this.surfaces.replaceChildren(); this.progress = 0;
  }
}
