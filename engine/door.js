import { ActionCue } from './action-cue.js';
const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));

// Every landmark is placed in the original painting's coordinates. Camera
// drift and cover scaling are shared by the art and its interactive carvings.
export class Door {
  constructor({ world, plane, interaction, image, seals, onSeal, onComplete, onEnergy, reducedMotion }) {
    Object.assign(this, { world, plane, interaction, image, onSeal, onComplete, onEnergy, reducedMotion });
    this.anchors = seals;
    this.seals = [...interaction.querySelectorAll('.seal')];
    this.push = interaction.querySelector('#door-push');
    this.cue = new ActionCue(interaction);
    this.reset();
    this.seals.forEach((element, index) => this.bind(element, index));
    this.bind(this.push, 'push');
    this.hovered = -1;
    this.seals.forEach((element, index) => {
      element.addEventListener('pointerenter', () => { this.hovered = index; });
      element.addEventListener('pointerleave', () => { if (this.hovered === index) this.hovered = -1; });
    });
  }

  bind(element, id) {
    element.addEventListener('pointerdown', (event) => {
      if (!this.enabled || element.disabled || (id === 'push' && this.lit.size < this.seals.length)) return;
      if (event.button !== 0) return;
      event.preventDefault();
      element.setPointerCapture(event.pointerId);
      this.active = { id, element, pointerId: event.pointerId, began: performance.now(), x: event.clientX, y: event.clientY };
      element.classList.add('holding');
      this.onEnergy({ kind: 'touch', id, x: event.clientX, y: event.clientY, progress: 0 });
    });
    const release = () => {
      if (this.active?.element !== element) return;
      element.classList.remove('holding');
      this.active = null;
    };
    element.addEventListener('pointerup', release);
    element.addEventListener('pointercancel', release);
    element.addEventListener('lostpointercapture', release);
    element.addEventListener('pointermove', (event) => {
      if (this.active?.element !== element) return;
      const box = element.getBoundingClientRect();
      if (event.clientX < box.left - 35 || event.clientX > box.right + 35 || event.clientY < box.top - 35 || event.clientY > box.bottom + 35) release();
    });
    element.addEventListener('click', (event) => {
      // Native Enter/Space activation follows the same scene response; a
      // pointer click alone cannot bypass the physical hold interaction.
      if (event.detail === 0 && this.enabled && !element.disabled) this.commit(id, element, true);
    });
  }

  reset() {
    this.cue?.hide();
    this.enabled = false; this.lit = new Set(); this.active = null;
    this.progress = [0, 0, 0]; this.open = 0; this.done = false;
    this.lastTime = 0; this.targetOpen = 0;
    this.hovered = -1;
    this.seals?.forEach((element) => {
      element.disabled = false; element.classList.remove('lit', 'holding');
      element.style.setProperty('--charge', '0');
    });
    if (this.push) { this.push.hidden = true; this.push.disabled = false; this.push.classList.remove('holding'); this.push.style.setProperty('--charge', '0'); }
    this.world.dataset.seals = '0';
    this.world.style.setProperty('--door-open', '0');
    this.world.style.setProperty('--gate-heat', '0');
  }

  resize() {
    const { width, height } = this.world.getBoundingClientRect();
    this.width = width; this.height = height;
    const scale = Math.max(width / this.image.naturalWidth, height / this.image.naturalHeight) * 1.055;
    this.scale = scale;
    this.planeWidth = this.image.naturalWidth * scale;
    this.planeHeight = this.image.naturalHeight * scale;
    this.left = (width - this.planeWidth) / 2;
    this.top = (height - this.planeHeight) * (width < 701 ? .44 : .48);
    Object.assign(this.plane.style, { width: this.planeWidth + 'px', height: this.planeHeight + 'px', left: this.left + 'px', top: this.top + 'px' });
    this.plane.style.setProperty('--plane-width', this.planeWidth + 'px');
    this.plane.style.setProperty('--plane-height', this.planeHeight + 'px');
    for (const [name, x, y, w, h] of [['left', 625, 178, 215, 558], ['right', 840, 178, 220, 558]]) {
      const leaf = this.plane.querySelector('.door-' + name);
      Object.assign(leaf.style, { left: x * scale + 'px', top: y * scale + 'px', width: w * scale + 'px', height: h * scale + 'px', backgroundPosition: -x * scale + 'px ' + -y * scale + 'px' });
    }
    if (!this.carvings) this.prepareCarvings();
    for (const layer of this.carvings) {
      const { canvas, x, y, width: w, height: h } = layer;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      canvas.width = Math.round(w * scale * dpr); canvas.height = Math.round(h * scale * dpr);
      Object.assign(canvas.style, { left: (layer.leaf ? 0 : x * scale) + 'px',
        top: (layer.leaf ? 0 : y * scale) + 'px', width: w * scale + 'px', height: h * scale + 'px' });
      layer.context.setTransform(scale * dpr, 0, 0, scale * dpr, -x * scale * dpr, -y * scale * dpr);
    }
    this.seals.forEach((element, i) => {
      element.style.width = Math.max(48, this.anchors[i].width * scale) + 'px';
      element.style.height = Math.max(48, this.anchors[i].height * scale) + 'px';
    });
    this.push.style.width = Math.max(48, 45 * scale) + 'px';
    this.push.style.height = 152 * scale + 'px';
    this.position(0, 0);
  }

  prepareCarvings() {
    const regions = [
      { id: 0, x: 653, y: 270, width: 150, height: 300 },
      { id: 0, x: 665, y: 603, width: 112, height: 99 },
      { id: 1, x: 878, y: 270, width: 151, height: 300 },
      { id: 1, x: 898, y: 603, width: 112, height: 99 },
      { id: 2, x: 625, y: 33, width: 427, height: 200 },
    ];
    // Derive light from the red/gold ridges of the source relief. No new symbol
    // or decal is painted over it; the texture itself supplies every lit pixel.
    const masks = regions.map(region => {
      const mask = document.createElement('canvas'), work = document.createElement('canvas');
      mask.width = work.width = region.width; mask.height = work.height = region.height;
      const context = mask.getContext('2d', { willReadFrequently: true });
      context.drawImage(this.image, region.x, region.y, region.width, region.height, 0, 0, region.width, region.height);
      const data = context.getImageData(0, 0, region.width, region.height), source = new Uint8ClampedArray(data.data);
      for (let y = 0; y < region.height; y++) for (let x = 0; x < region.width; x++) {
        const i = (y * region.width + x) * 4;
        const r = source[i] / 255, g = source[i + 1] / 255, b = source[i + 2] / 255;
        const brightness = (r + g + b) / 3;
        const warm = clamp((r - g) * 7 + (r - b) * 2);
        const neighbor = Math.min(source.length - 4, i + 4);
        const ridge = Math.abs(source[i] - source[neighbor]) / 255;
        const edge = clamp(Math.min(x / 10, (region.width - x) / 10, y / 10, (region.height - y) / 10));
        const alpha = warm * (brightness * 1.8 + ridge * 2.2) * edge;
        data.data[i] = 255; data.data[i + 1] = 155 + brightness * 65;
        data.data[i + 2] = 62 + brightness * 70; data.data[i + 3] = clamp(alpha) * 255;
      }
      context.putImageData(data, 0, 0);
      return { ...region, mask, work, context: work.getContext('2d') };
    });
    this.carvings = [
      { leaf: 'left', x: 625, y: 178, width: 215, height: 558, ids: [0] },
      { leaf: 'right', x: 840, y: 178, width: 220, height: 558, ids: [1] },
      { x: 625, y: 33, width: 427, height: 200, ids: [2] },
    ].map(layer => {
      const canvas = document.createElement('canvas'); canvas.className = 'carving-light'; canvas.setAttribute('aria-hidden', 'true');
      (layer.leaf ? this.plane.querySelector('.door-' + layer.leaf) : this.plane).append(canvas);
      return { ...layer, canvas, context: canvas.getContext('2d'), masks: masks.filter(mask => layer.ids.includes(mask.id)) };
    });
  }

  illuminate(time) {
    const invited = this.seals.findIndex(element => !element.disabled);
    for (const layer of this.carvings || []) {
      const ctx = layer.context;
      ctx.clearRect(layer.x, layer.y, layer.width, layer.height);
      for (const part of layer.masks) {
        const charge = this.progress[part.id], hover = this.enabled &&
          (this.hovered === part.id || this.seals[part.id].matches(':focus-visible'));
        const breath = this.reducedMotion ? .6 : .5 + Math.sin(time / 1200 + part.id * 1.8) * .3;
        const guiding = this.enabled && part.id === invited;
        ctx.globalAlpha = .14 + breath * .12 + (guiding ? .42 + breath * .22 : 0) + (hover ? .15 : 0);
        ctx.drawImage(part.mask, part.x, part.y);
        if (guiding && !charge && !this.reducedMotion) {
          const work = part.context;
          work.globalCompositeOperation = 'source-over'; work.clearRect(0, 0, part.width, part.height);
          work.drawImage(part.mask, 0, 0); work.globalCompositeOperation = 'source-in';
          const center = (1 - (time % 2600) / 2600) * part.height;
          const scan = work.createLinearGradient(0, center - 70, 0, center + 70);
          scan.addColorStop(0, '#fff2bb00'); scan.addColorStop(.5, '#fff6db'); scan.addColorStop(1, '#fff2bb00');
          work.fillStyle = scan; work.fillRect(0, 0, part.width, part.height);
          ctx.globalAlpha = .95; ctx.drawImage(part.work, part.x, part.y);
        }
        if (!charge) continue;
        const work = part.context;
        work.clearRect(0, 0, part.width, part.height);
        work.globalCompositeOperation = 'source-over'; work.drawImage(part.mask, 0, 0);
        work.globalCompositeOperation = 'destination-in';
        const front = part.height * (1 - charge);
        const light = work.createLinearGradient(0, Math.max(0, front - part.height * .18), 0, Math.max(1, front + part.height * .05));
        light.addColorStop(0, 'rgba(255,255,255,0)'); light.addColorStop(1, '#fff');
        work.fillStyle = light; work.fillRect(0, 0, part.width, part.height);
        ctx.globalAlpha = .68 + breath * .3; ctx.drawImage(part.work, part.x, part.y);
        // A narrow moving highlight follows the texture's carved scrollwork.
        if (charge === 1 && !this.reducedMotion) {
          work.globalCompositeOperation = 'source-in';
          const center = ((time / 3400 + part.id * .31) % 1) * part.height;
          const scan = work.createLinearGradient(0, center - 30, 0, center + 30);
          scan.addColorStop(0, '#ffc67700'); scan.addColorStop(.5, '#fff0ce'); scan.addColorStop(1, '#ffc67700');
          work.fillStyle = scan; work.fillRect(0, 0, part.width, part.height);
          ctx.globalAlpha = .8; ctx.drawImage(part.work, part.x, part.y);
        }
      }
      ctx.globalAlpha = 1;
    }
  }

  position(driftX, driftY) {
    this.driftX = driftX; this.driftY = driftY;
    const place = (element, anchor) => {
      element.style.left = this.left + anchor.x * this.scale + driftX + 'px';
      element.style.top = this.top + anchor.y * this.scale + driftY + 'px';
    };
    this.seals.forEach((element, index) => place(element, this.anchors[index]));
    place(this.push, { x: 839, y: 480 });
  }

  commit(id, element, keyboard = false) {
    if (!this.enabled || this.done || element.disabled) return;
    this.active = null; element.classList.remove('holding');
    if (id === 'push') {
      if (this.lit.size < this.seals.length) return;
      this.done = true; this.enabled = false; this.targetOpen = 1;
      element.disabled = true;
      this.onComplete();
    } else {
      this.lit.add(id); this.progress[id] = 1;
      element.disabled = true; element.classList.add('lit');
      element.style.setProperty('--charge', '1');
      this.world.dataset.seals = String(this.lit.size);
      const point = this.anchors[id];
      this.onSeal({ index: id, count: this.lit.size, keyboard, x: this.left + point.x * this.scale + (this.driftX || 0), y: this.top + point.y * this.scale + (this.driftY || 0) });
      if (this.lit.size === this.seals.length) this.push.hidden = false;
    }
  }

  invite() { this.targetOpen = 1.65; }

  release() {
    this.active?.element.classList.remove('holding');
    this.active = null;
  }

  draw(time) {
    if (!this.scale) return;
    const dt = Math.min((time - (this.lastTime || time)) / 1000, .05);
    this.lastTime = time;
    for (let id = 0; id < this.seals.length; id++) {
      if (this.lit.has(id)) continue;
      this.progress[id] = this.active?.id === id
        ? clamp((time - this.active.began) / 900)
        : Math.max(0, this.progress[id] - dt * 1.4);
      this.seals[id].style.setProperty('--charge', this.progress[id].toFixed(3));
      if (this.progress[id] >= 1) this.commit(id, this.seals[id]);
    }
    if (this.active?.id === 'push') {
      const progress = clamp((time - this.active.began) / 1350);
      this.targetOpen = progress;
      this.push.style.setProperty('--charge', progress.toFixed(3));
      if (progress >= 1) this.commit('push', this.push);
    } else if (!this.done) this.targetOpen = 0;
    this.open += (this.targetOpen - this.open) * Math.min(1, dt * 6);
    this.world.style.setProperty('--door-open', this.open.toFixed(3));
    const energy = Math.max(...this.progress);
    this.heat = this.lit.size / 3 + (this.active ? energy * .25 : 0);
    this.world.style.setProperty('--gate-heat', this.heat.toFixed(3));
    if (this.world.dataset.realm === 'gate') this.illuminate(time);
    if (this.enabled) {
      const id = this.active?.id ?? this.seals.findIndex(element => !element.disabled);
      const element = id === 'push' || id === -1 ? this.push : this.seals[id];
      const box = element.getBoundingClientRect(), world = this.world.getBoundingClientRect();
      this.cue.show(this.active ? 'Tetap tahan…' : id === -1 ? 'TAHAN CELAH PINTU' : 'TAHAN UKIRAN INI',
        { x: box.left - world.left + box.width / 2, y: box.top - world.top + box.height / 2 },
        { below: id === 2, busy: Boolean(this.active) });
      this.interaction.dataset.target = id === -1 ? 'push' : String(id);
    } else this.cue.hide();
    if (this.active) this.onEnergy({ kind: 'charge', id: this.active.id, x: this.active.x, y: this.active.y, progress: this.active.id === 'push' ? this.open : this.progress[this.active.id] });
  }
}
