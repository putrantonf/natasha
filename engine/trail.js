import { ActionCue } from './action-cue.js';
const clamp = value => Math.max(0, Math.min(1, value));
const mix = (a, b, t) => a + (b - a) * t;

// A swipe is a step in the painted landscape. Camera, dust and warm cracks
// share source coordinates; there is no screen-space rail or travelling token.
export class Trail {
  constructor({ world, element, stone, hint, realm, reducedMotion, onProgress, onComplete, onGuide }) {
    Object.assign(this, { world, element, stone, hint, realm, reducedMotion, onProgress, onComplete, onGuide });
    this.cue = new ActionCue(element);
    this.canvas = document.createElement('canvas'); this.canvas.className = 'journey-material';
    this.canvas.setAttribute('aria-hidden', 'true'); element.prepend(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.work = document.createElement('canvas'); this.workCtx = this.work.getContext('2d');
    this.enabled = false; this.pointer = null; this.progress = 0; this.dust = [];
    element.addEventListener('pointerdown', event => this.press(event));
    element.addEventListener('pointermove', event => this.trace(event));
    element.addEventListener('pointerup', () => this.release());
    element.addEventListener('pointercancel', () => this.release());
    element.addEventListener('lostpointercapture', () => this.release());
    stone.addEventListener('click', event => {
      if (event.detail === 0 && this.enabled) { this.keyboard = true; this.hint.textContent = 'Kita berjalan. Lepas fokus jika ingin berhenti.'; }
    });
    stone.addEventListener('blur', () => { this.keyboard = false; });
  }

  start(config) {
    this.hide(); this.config = config; this.progress = 0; this.walked = 0;
    this.from = { ...this.realm.current }; this.lastTime = 0; this.stepAt = 0; this.dust = [];
    this.enabled = true; this.stone.disabled = false; this.world.dataset.trail = config.id;
    this.element.hidden = false; this.hint.textContent = config.hint;
    this.resize(); this.position(); this.stone.focus({ preventScroll: true });
  }

  resize() {
    this.release();
    const box = this.element.getBoundingClientRect(); this.width = box.width; this.height = box.height;
    const dpr = Math.min(1.25, devicePixelRatio || 1);
    this.canvas.width = Math.round(box.width * dpr); this.canvas.height = Math.round(box.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.work.width = Math.ceil(box.width); this.work.height = Math.ceil(box.height);
    if (!this.mask && this.realm.image.naturalWidth) this.makeMask();
    this.position();
  }

  makeMask() {
    const mask = document.createElement('canvas'); mask.width = 1086; mask.height = 362;
    const ctx = mask.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(this.realm.image, 0, 0, mask.width, mask.height);
    const pixels = ctx.getImageData(0, 0, mask.width, mask.height), source = new Uint8ClampedArray(pixels.data);
    for (let i = 0; i < source.length; i += 4) {
      const r = source[i] / 255, g = source[i + 1] / 255, b = source[i + 2] / 255;
      const l = (r + g + b) / 3, edge = Math.abs(source[i] - source[Math.min(source.length - 4, i + 4)]) / 255;
      const stone = clamp(l * 2.4 + edge * 3) * (1 - clamp((r - g - .12) * 7));
      pixels.data[i] = 255; pixels.data[i + 1] = 202; pixels.data[i + 2] = 125;
      pixels.data[i + 3] = stone * 255;
    }
    ctx.putImageData(pixels, 0, 0); this.mask = mask;
  }

  sourcePoint(p = this.walked) {
    if (!this.config) return null;
    const route = this.config.route, n = route.length - 1, a = Math.min(n - 1, Math.floor(p * n)), f = Math.min(1, p * n - a);
    return { x: mix(route[a][0], route[a + 1][0], f), y: mix(route[a][1], route[a + 1][1], f) };
  }

  position() {
    if (!this.config || !this.realm.frame) return;
    const source = this.sourcePoint(), point = this.realm.project(source.x, source.y);
    this.here = point;
    const ahead = this.sourcePoint(Math.min(1, this.walked + .12)), next = this.realm.project(ahead.x, ahead.y);
    this.stone.style.left = point.x + 'px'; this.stone.style.top = point.y + 'px';
    this.element.dataset.progress = this.walked.toFixed(3);
    this.element.dataset.sourcePoint = source.x.toFixed(4) + ',' + source.y.toFixed(4);
    this.element.dataset.camera = JSON.stringify(this.realm.current);
    this.onGuide?.(point, next);
    this.cue.show(this.pointer !== null ? 'USAP KE ATAS' : this.walked > .01 ? 'LANJUT DARI BATU INI' : 'MULAI DI BATU INI', point, { busy: this.pointer !== null });
  }

  press(event) {
    if (!this.enabled || this.pointer !== null || event.button > 0) return;
    const box = this.element.getBoundingClientRect(), x = event.clientX - box.left, y = event.clientY - box.top;
    if (!this.here || Math.hypot(x - this.here.x, y - this.here.y) > 88) {
      this.hint.textContent = 'Mulai di batu yang diterangi bara, tepat di bawah petunjuk.'; return;
    }
    event.preventDefault(); this.pointer = event.pointerId; this.lastY = event.clientY;
    this.element.setPointerCapture(event.pointerId); this.element.classList.add('following');
    this.hint.textContent = 'Usap ke atas untuk melangkah. Lepaskan, lalu usap lagi dari batu yang terang.';
  }

  trace(event) {
    if (!this.enabled || this.pointer !== event.pointerId) return;
    const delta = this.lastY - event.clientY; this.lastY = event.clientY;
    // Stationary holds and taps do not travel. Gestures measure distance,
    // rather than precision along an invisible curve.
    if (delta > 0) this.progress = clamp(this.progress + Math.min(35, delta) / Math.max(390, this.height * .70));
  }

  release() {
    const pointer = this.pointer; this.pointer = null;
    if (pointer !== null && this.element.hasPointerCapture(pointer)) this.element.releasePointerCapture(pointer);
    this.element.classList.remove('following');
    if (this.enabled && this.config) {
      this.progress = this.walked;
      this.hint.textContent = this.walked > 0 ? this.config.paused : this.config.hint;
    }
  }

  update(time) {
    if (!this.enabled) return;
    const dt = Math.min(.07, this.lastTime ? (time - this.lastTime) / 1000 : 0); this.lastTime = time;
    if (this.keyboard) this.progress = clamp(this.progress + dt / (this.reducedMotion ? .3 : 3.8));
    if (this.pointer !== null || this.keyboard) {
      this.walked = this.reducedMotion ? this.progress : mix(this.walked, this.progress, 1 - Math.exp(-dt * 19));
      const camera = {}, end = this.config.destination;
      for (const k of ['x', 'y', 'zoom']) camera[k] = mix(this.from[k], end[k], this.walked);
      if (this.config.id === 'crossing') camera.y += Math.sin(this.walked * Math.PI) * .065;
      this.realm.move(camera, 0);
      if (this.walked - this.stepAt > .045) {
        this.stepAt = this.walked; const source = this.sourcePoint();
        if (!this.reducedMotion) for (let i = 0; i < 8; i++) this.dust.push({ ...source, age: 0, vx: (Math.random() - .5) * .009, vy: -.013 - Math.random() * .016 });
        this.onProgress?.(this.walked, this.here?.x || 0, this.here?.y || 0);
      }
      if (this.progress >= .999 && this.walked > .994) this.complete();
    }
  }

  draw(time) {
    this.ctx.clearRect(0, 0, this.width || 0, this.height || 0);
    if (!this.enabled || !this.realm.frame) return;
    this.position();
    const ctx = this.ctx, work = this.workCtx, frame = this.realm.frame, t = this.reducedMotion ? 0 : time / 1000;
    work.clearRect(0, 0, this.width, this.height); work.globalCompositeOperation = 'source-over';
    // Light runs forward across the actual painted relief as a gesture demo.
    for (let i = 0; i < 4; i++) {
      const p = this.sourcePoint(Math.min(1, this.walked + i * .09)), point = this.realm.project(p.x, p.y);
      const radius = i === 0 ? 82 : 47, alpha = i === 0 ? .91 : .12 + Math.max(0, Math.sin(t * 2.6 - i * .9)) * .44;
      work.save(); work.translate(point.x, point.y); work.scale(1, .32);
      const light = work.createRadialGradient(0, 0, 0, 0, 0, radius);
      light.addColorStop(0, 'rgba(255,224,172,' + alpha + ')'); light.addColorStop(1, '#ffe0ac00');
      work.fillStyle = light; work.fillRect(-radius, -radius, radius * 2, radius * 2); work.restore();
    }
    work.globalCompositeOperation = 'destination-in';
    work.drawImage(this.mask, frame.left, frame.top, frame.width, frame.height);
    work.globalCompositeOperation = 'source-over'; ctx.drawImage(this.work, 0, 0);
    if (!this.reducedMotion) {
      this.dust = this.dust.filter(p => p.age < 1.0);
      for (const p of this.dust) {
        p.age += .033; p.x += p.vx * .033; p.y += p.vy * .033;
        const point = this.realm.project(p.x, p.y);
        ctx.globalAlpha = (1 - p.age) * .6; ctx.fillStyle = '#d9a477'; ctx.fillRect(point.x, point.y, 1.8, 1.2);
      }
      ctx.globalAlpha = 1;
    }
  }

  complete() {
    if (!this.enabled) return;
    this.walked = this.progress = 1; this.realm.move(this.config.destination, 0);
    this.enabled = false; this.keyboard = false; this.stone.disabled = true;
    this.release(); this.cue.hide(); this.hint.textContent = this.config.arrival || ''; this.onComplete();
  }
  hide() { this.enabled = false; this.keyboard = false; this.release(); this.cue.hide(); this.element.hidden = true; }
  reset() { this.hide(); this.progress = this.walked = 0; this.config = null; this.dust = []; delete this.world.dataset.trail; this.element.dataset.progress = '0'; }
}
