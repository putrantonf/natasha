import { ActionCue } from './action-cue.js';
const clamp = p => Math.max(0, Math.min(1, p));
const mix = (a, b, t) => a + (b - a) * t;
const ease = p => { p = clamp(p); return p * p * (3 - 2 * p); };

// A current reaches a painted bud only as the finger follows the water.
// Holds do not advance it; lifting a finger keeps the reached part intact.
export class Spring {
  constructor(options) {
    Object.assign(this, options);
    this.canvas = document.createElement('canvas'); this.canvas.className = 'spring-life';
    this.canvas.setAttribute('aria-hidden', 'true'); this.realm.image.parentElement.append(this.canvas);
    this.ctx = this.canvas.getContext('2d'); this.cue = new ActionCue(this.element);
    this.work = document.createElement('canvas'); this.workCtx = this.work.getContext('2d');
    this.reset(); this.resize();
    this.element.addEventListener('pointerdown', e => this.press(e));
    this.element.addEventListener('pointermove', e => this.trace(e));
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) this.element.addEventListener(name, () => this.release());
  }
  start(config) {
    this.config = config; this.progress = this.opening = 0; this.finished = false; this.active = this.visible = true;
    this.lastTime = 0; this.keyboard = false; this.bloomAt = null;
    this.element.hidden = false; this.element.dataset.kind = 'stream'; this.element.dataset.progress = '0';
    this.hint.textContent = config.hint;
    this.button = document.createElement('button'); this.button.type = 'button'; this.button.className = 'garden-surface';
    this.button.setAttribute('aria-label', 'Tuntun air sampai ke kuncup. Tekan Enter untuk menuntunnya dengan keyboard.');
    this.button.addEventListener('click', e => { if (e.detail === 0 && this.active && !this.finished) this.keyboard = true; });
    this.surfaces.replaceChildren(this.button); this.makeMask(); this.position();
    this.button.focus({ preventScroll: true }); this.announce(config.hint); this.element.dataset.route = JSON.stringify(config.route);
  }
  resize() {
    this.release(); const box = this.canvas.getBoundingClientRect(); this.width = box.width; this.height = box.height;
    const dpr = Math.min(1.4, devicePixelRatio || 1);
    this.canvas.width = Math.round(box.width * dpr); this.canvas.height = Math.round(box.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); this.work.width = Math.ceil(box.width); this.work.height = Math.ceil(box.height);
  }
  makeMask() {
    if (this.mask) return;
    const mask = document.createElement('canvas'); mask.width = 1086; mask.height = 362;
    const ctx = mask.getContext('2d', { willReadFrequently: true }); ctx.drawImage(this.realm.image, 0, 0, mask.width, mask.height);
    const data = ctx.getImageData(0, 0, mask.width, mask.height);
    for (let i = 0; i < data.data.length; i += 4) {
      const r = data.data[i], g = data.data[i + 1], b = data.data[i + 2];
      const wet = clamp((Math.min(g - r, b - r) + 2) / 24), foam = clamp((Math.min(r, g, b) - 175) / 65);
      data.data[i] = 190; data.data[i + 1] = 249; data.data[i + 2] = 235; data.data[i + 3] = Math.max(wet, foam) * 255;
    }
    ctx.putImageData(data, 0, 0); this.mask = mask;
  }
  point(p = this.progress) {
    const route = this.config.route, n = route.length - 1, i = Math.min(n - 1, Math.floor(p * n)), f = Math.min(1, p * n - i);
    return { x: mix(route[i][0], route[i + 1][0], f), y: mix(route[i][1], route[i + 1][1], f) };
  }
  position() {
    if (!this.active || !this.realm.frame) return;
    const p = this.point(), here = this.realm.project(p.x, p.y); this.here = here;
    Object.assign(this.button.style, { left: here.x + 'px', top: here.y + 'px', width: '80px', height: '80px' });
    this.element.dataset.progress = this.progress.toFixed(3);
    if (this.finished) this.cue.hide();
    else this.cue.show(this.pointer !== null ? 'IKUTI ALIRANNYA' : this.progress > .02 ? 'LANJUTKAN AIR DARI SINI' : 'USAP AIR DARI SINI', here, { busy: this.pointer !== null });
  }
  press(e) {
    if (!this.active || this.finished || this.pointer !== null || e.button > 0) return;
    const box = this.element.getBoundingClientRect(), x = e.clientX - box.left, y = e.clientY - box.top;
    if (!this.here || Math.hypot(x - this.here.x, y - this.here.y) > 66) {
      this.hint.textContent = 'Mulai di riak yang paling terang. Kuncup merah muda menunggu di ujung air.'; return;
    }
    e.preventDefault(); this.pointer = e.pointerId; this.element.setPointerCapture(e.pointerId);
    this.hint.textContent = 'Usap mengikuti aliran yang menyala, sampai ke kuncup merah muda.';
    this.painting.ripple(x, y); this.onRipple?.(x, y);
  }
  trace(e) {
    if (!this.active || this.finished || e.pointerId !== this.pointer) return;
    const box = this.element.getBoundingClientRect(), x = e.clientX - box.left, y = e.clientY - box.top;
    let best = this.progress, distance = Infinity;
    for (let i = Math.max(0, Math.floor(this.progress * 160) - 3); i <= Math.min(160, Math.ceil(this.progress * 160) + 32); i++) {
      const s = this.point(i / 160), p = this.realm.project(s.x, s.y), d = Math.hypot(x - p.x, y - p.y);
      if (d < distance) { distance = d; best = i / 160; }
    }
    if (distance > 49) { this.hint.textContent = 'Airnya ada di bawah riak yang menyala. Geser pelan mengikuti arus.'; return; }
    if (best > this.progress) {
      this.progress = best; this.painting.ripple(x, y);
      if (performance.now() - (this.lastRipple || 0) > 190) { this.lastRipple = performance.now(); this.onRipple?.(x, y); }
      this.position(); if (this.progress >= .96) this.bloom();
    }
  }
  release() {
    const pointer = this.pointer; this.pointer = null;
    if (pointer !== null && this.element.hasPointerCapture(pointer)) this.element.releasePointerCapture(pointer);
    if (this.active && !this.finished && this.progress > 0) this.hint.textContent = 'Airnya berhenti di sini. Sentuh riak yang terang untuk melanjutkan ke bunga.';
  }
  bloom() {
    if (this.finished) return;
    this.progress = 1; this.finished = true; this.keyboard = false; this.bloomAt = performance.now();
    this.button.disabled = true; this.release(); this.cue.hide(); this.painting.blessing[0] = 1;
    const root = this.realm.project(this.config.flower.x, this.config.flower.y);
    this.painting.ripple(root.x, root.y); this.onRipple?.(root.x, root.y);
    this.hint.textContent = 'Airnya sampai. Lihat kuncup itu membuka.';
    this.announce('Aliran sampai ke bunga. Kuncup mekar, kelopaknya terbawa angin ke arah gerbang taman.');
  }
  update(time) {
    if (!this.visible || !this.config) return;
    const dt = Math.min(.08, this.lastTime ? (time - this.lastTime) / 1000 : 0); this.lastTime = time;
    if (this.keyboard && !this.finished) {
      this.progress = clamp(this.progress + dt / (this.reducedMotion ? .65 : 2.7)); if (this.progress >= .999) this.bloom();
    }
    if (this.bloomAt !== null) {
      const elapsed = time - this.bloomAt; this.opening = ease(elapsed / (this.reducedMotion ? 320 : 2700));
      if (this.active && elapsed > (this.reducedMotion ? 650 : 4500)) { this.active = false; this.cue.hide(); this.onComplete(); }
    }
  }
  draw(time) {
    const ctx = this.ctx; ctx.clearRect(0, 0, this.width, this.height);
    if (!this.visible || !this.config || !this.realm.frame || !this.atlas.complete) return;
    this.position(); const frame = this.realm.frame, work = this.workCtx, t = this.reducedMotion ? 0 : time / 1000;
    work.clearRect(0, 0, this.width, this.height); work.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 34; i++) {
      const p = i / 33, s = this.point(p), point = this.realm.project(s.x, s.y);
      const wave = this.reducedMotion ? .5 : Math.max(0, Math.sin(t * 3.2 - p * 19));
      const alpha = p <= this.progress + .025 ? .65 : .10 + wave * .39;
      const light = work.createRadialGradient(point.x, point.y, 0, point.x, point.y, 27);
      light.addColorStop(0, 'rgba(184,255,230,' + alpha + ')'); light.addColorStop(1, '#b8ffe600');
      work.fillStyle = light; work.fillRect(point.x - 27, point.y - 27, 54, 54);
    }
    if (this.active && !this.finished) {
      const p = this.point(), point = this.realm.project(p.x, p.y), radius = 49;
      const light = work.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
      light.addColorStop(0, '#fff7cfdd'); light.addColorStop(1, '#fff7cf00');
      work.fillStyle = light; work.fillRect(point.x - radius, point.y - radius, radius * 2, radius * 2);
    }
    work.globalCompositeOperation = 'destination-in'; work.drawImage(this.mask, frame.left, frame.top, frame.width, frame.height);
    work.globalCompositeOperation = 'source-over'; ctx.drawImage(this.work, 0, 0);
    const flower = this.config.flower, p = this.realm.project(flower.x, flower.y), w = frame.width * flower.size, half = this.atlas.width / 2;
    const bob = this.reducedMotion ? 0 : Math.sin(t * 1.5) * 1.4;
    ctx.save(); ctx.translate(p.x, p.y + bob); ctx.fillStyle = '#123e39'; ctx.globalAlpha = .28;
    ctx.beginPath(); ctx.ellipse(0, w * .085, w * .44, w * .08, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1 - this.opening;
    ctx.drawImage(this.atlas, 0, this.atlas.height / 2, half, this.atlas.height / 2, -w / 2, -w * .83, w, w);
    ctx.globalAlpha = this.opening;
    ctx.drawImage(this.atlas, half, this.atlas.height / 2, half, this.atlas.height / 2, -w / 2, -w * .83, w, w); ctx.restore();
    if (this.opening > .5 && !this.reducedMotion) {
      const age = Math.max(0, (time - this.bloomAt - 1000) / 1000);
      for (let i = 0; i < 9; i++) {
        const life = (age * .23 + i * .12) % 1, s = { x: flower.x + life * .22, y: flower.y - life * .45 + Math.sin(life * 5 + i) * .018 };
        const petal = this.realm.project(s.x, s.y);
        ctx.save(); ctx.translate(petal.x, petal.y); ctx.rotate(t + i); ctx.globalAlpha = Math.sin(life * Math.PI) * .65;
        ctx.fillStyle = i % 2 ? '#ffdddc' : '#fff3c9'; ctx.beginPath(); ctx.ellipse(0, 0, 3.3, 1.7, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
    }
    this.canvas.dataset.open = this.opening.toFixed(3); this.canvas.dataset.flow = this.progress.toFixed(3);
  }
  hide() { this.active = false; this.keyboard = false; this.release(); this.cue?.hide(); }
  reset() { this.hide(); this.visible = false; this.finished = false; this.progress = this.opening = 0; this.bloomAt = null; this.lastTime = 0; this.config = null; }
}
