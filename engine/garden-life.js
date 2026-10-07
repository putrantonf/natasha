const TAU = Math.PI * 2;
const mix = (a, b, t) => a + (b - a) * t;

// Painted animals and flowers live in the same camera as the pond. The source
// atlas provides their brushwork; deformation, buoyancy and water supply motion.
export class GardenLife {
  constructor(canvas, realm, { reducedMotion = false, onSplash } = {}) {
    Object.assign(this, { canvas, realm, reducedMotion, onSplash });
    this.ctx = canvas.getContext('2d');
    this.image = new Image(); this.image.src = './assets/garden-life.png';
    this.fish = [0, 1, 2].map((i) => ({ x: .53 + i * .10, y: .862 + i * .023,
      phase: i * 2.2, direction: 1, size: i ? .028 : .047 }));
    this.lilies = [
      { x: .726, y: .875, size: .034, visible: false, growth: 0, opening: 0 },
      { x: .806, y: .881, size: .036, visible: false, growth: 0, opening: 0 },
    ];
    this.drops = []; this.petals = []; this.blessings = 0;
    this.resize();
  }

  async load() { await this.image.decode(); this.loaded = true; }
  resize() {
    const box = this.canvas.getBoundingClientRect();
    this.width = box.width; this.height = box.height;
    const dpr = Math.min(1.5, devicePixelRatio || 1);
    this.canvas.width = Math.round(box.width * dpr); this.canvas.height = Math.round(box.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  pointer(x, y, down) { this.hand = x === null ? null : { x, y, down }; }
  cue(kind, spot, index) { this.kind = kind; this.spot = spot; this.lilyIndex = index; this.charge = 0; }
  showLily(index) { this.lilies[index].visible = true; }

  leap(spot, free = false) {
    this.hand = null;
    const frame = this.realm.frame;
    const margin = frame.width * (this.fish[0].size * .65 + .017);
    const left = Math.max(.42, (margin - frame.left) / frame.width);
    const right = Math.min(.89, (this.width - margin - frame.left) / frame.width);
    const x = Math.max(left, Math.min(right, spot.x));
    const y = Math.max(.83, Math.min(.93, spot.y));
    this.fish[0].jump = { age: 0, x, y, free };
    this.onSplash?.(x, y);
    if (free) this.blessings |= 1;
  }
  openLily(index, quiet = false) {
    const lily = this.lilies[index];
    lily.visible = true; lily.opened = true; this.blessings |= quiet ? 4 : 2;
    this.flourish = { age: 0, quiet };
    this.onSplash?.(lily.x, lily.y);
    if (!this.reducedMotion) {
      for (let i = 0; i < (quiet ? 38 : 22); i++) {
        this.petals.push({ x: .52 + Math.random() * .36, y: .10 + Math.random() * .36,
          phase: Math.random() * TAU, speed: .035 + Math.random() * .027 });
      }
    }
  }

  splash(x, y) {
    this.onSplash?.(x, y);
    if (this.reducedMotion) return;
    for (let i = 0; i < 17; i++) this.drops.push({ x, y, vx: (Math.random() - .5) * .045,
      vy: -.08 - Math.random() * .09, age: 0, life: .8 + Math.random() * .35 });
  }

  drawFish(fish, time, dt) {
    let x = fish.x, y = fish.y, elevation = 0, rotation = 0, jumped = false;
    if (fish.jump) {
      const jump = fish.jump;
      jump.age += dt;
      const p = Math.min(1, jump.age / 1.35);
      x = jump.x + (p - .5) * .034; y = jump.y;
      elevation = this.reducedMotion ? 0 : Math.sin(p * Math.PI) * Math.min(130, this.height * .15);
      rotation = this.reducedMotion ? 0 : Math.cos(p * Math.PI) * -.55;
      jumped = true; fish.direction = 1;
      if (p === 1) { fish.x = x; fish.y = y; fish.jump = null; this.splash(x, y); }
    } else if (!this.reducedMotion) {
      const focus = Math.max(.47, Math.min(.84, this.realm.current.x));
      const near = this.hand && this.hand.y > .78 && this.hand.y < .99;
      const spacing = fish.phase === 0 ? 0 : fish.phase > 3 ? .063 : -.067;
      let tx = near ? this.hand.x + spacing : focus + spacing + Math.sin(time * .35 + fish.phase) * .034;
      let ty = near ? this.hand.y + (fish.phase === 0 ? 0 : fish.phase > 3 ? -.018 : .023) : .861 + Math.sin(time * .49 + fish.phase) * .025;
      tx = Math.max(.43, Math.min(.87, tx)); ty = Math.max(.821, Math.min(.96, ty));
      const change = 1 - Math.exp(-dt * (near ? 2.3 : .65));
      fish.x = mix(fish.x, tx, change); fish.y = mix(fish.y, ty, change);
      if (Math.abs(tx - fish.x) > .004) fish.direction = tx > fish.x ? 1 : -1;
      x = fish.x; y = fish.y;
      rotation = Math.sin(time * .57 + fish.phase) * .08;
    }
    const p = this.realm.project(x, y);
    if (!p || p.x < -180 || p.x > this.width + 180) return;
    const w = this.realm.frame.width * fish.size, h = w * .45;
    const ctx = this.ctx;
    ctx.save(); ctx.translate(p.x, p.y);
    ctx.globalAlpha = .12;
    ctx.fillStyle = '#153e36'; ctx.beginPath(); ctx.ellipse(0, 9, w * .33, h * .15, 0, 0, TAU); ctx.fill();
    ctx.translate(0, -elevation); ctx.rotate(rotation); ctx.scale(fish.direction, jumped ? 1 : .80);
    ctx.globalAlpha = jumped ? .98 : .74;
    // Contiguous overlapping strips bend the tail without detaching the head.
    const sw = this.image.width, sh = this.image.height / 2, strips = 24;
    for (let i = 0; i < strips; i++) {
      const portion = i / strips;
      const bend = this.reducedMotion ? 0 : Math.sin(time * 7 - portion * 4 + fish.phase) * h * .11 * (1 - portion) ** 2;
      ctx.drawImage(this.image, portion * sw, 0, sw / strips + .5, sh,
        -w / 2 + portion * w, -h / 2 + bend, w / strips + .7, h);
    }
    ctx.restore();
  }

  drawLily(lily, index, time, dt) {
    if (!lily.visible) return;
    lily.growth = this.reducedMotion ? 1 : Math.min(1, lily.growth + dt * .6);
    lily.opening = this.reducedMotion && lily.opened ? 1 : mix(lily.opening, lily.opened ? 1 : 0, 1 - Math.exp(-dt * 1.15));
    const p = this.realm.project(lily.x, lily.y); if (!p || p.x < -150 || p.x > this.width + 150) return;
    const ctx = this.ctx, w = this.realm.frame.width * lily.size;
    const bob = this.reducedMotion ? 0 : Math.sin(time * 1.4 + index * 2) * 2;
    ctx.save(); ctx.translate(p.x, p.y + bob); ctx.scale(lily.growth, lily.growth);
    ctx.globalAlpha = .19; ctx.fillStyle = '#1b493b';
    ctx.beginPath(); ctx.ellipse(0, w * .075, w * .43, w * .10, 0, 0, TAU); ctx.fill();
    const cue = ['lily', 'rest'].includes(this.kind) && this.lilyIndex === index;
    if (cue) {
      ctx.globalAlpha = .13 + this.charge * .20;
      const glow = ctx.createRadialGradient(0, -w * .42, 0, 0, -w * .42, w * .58);
      glow.addColorStop(0, '#fff9bc'); glow.addColorStop(1, '#fff4b000'); ctx.fillStyle = glow;
      ctx.fillRect(-w * .7, -w, w * 1.4, w * 1.3);
    }
    const half = this.image.width / 2;
    ctx.globalAlpha = lily.growth * (1 - lily.opening);
    ctx.drawImage(this.image, 0, this.image.height / 2, half, this.image.height / 2, -w / 2, -w * .83, w, w);
    ctx.globalAlpha = lily.growth * lily.opening;
    ctx.drawImage(this.image, half, this.image.height / 2, half, this.image.height / 2, -w / 2, -w * .83, w, w);
    ctx.restore();
    if (lily.opening > .75) {
      const wing = this.reducedMotion ? .8 : .25 + Math.abs(Math.sin(time * 7)) * .55;
      ctx.save(); ctx.translate(p.x + w * .14, p.y - w * .55);
      ctx.globalAlpha = .8; ctx.fillStyle = '#fff0cb';
      for (const side of [-1, 1]) { ctx.beginPath(); ctx.ellipse(side * 4 * wing, 0, 5 * wing, 3, side * .45, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
  }

  draw(time) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    if (!this.loaded || !this.realm.frame) return;
    const dt = Math.min(.06, this.lastTime ? (time - this.lastTime) / 1000 : 0); this.lastTime = time;
    const t = time / 1000;
    this.fish.forEach(f => this.drawFish(f, t, dt));
    this.lilies.forEach((lily, i) => this.drawLily(lily, i, t, dt));
    this.drops = this.drops.filter(drop => drop.age < drop.life);
    for (const drop of this.drops) {
      drop.age += dt; drop.x += drop.vx * dt; drop.y += drop.vy * dt; drop.vy += .39 * dt;
      const p = this.realm.project(drop.x, drop.y);
      ctx.globalAlpha = Math.max(0, 1 - drop.age / drop.life);
      ctx.strokeStyle = '#e8fcdd'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - drop.vx * 60, p.y - drop.vy * 19); ctx.stroke();
    }
    this.petals = this.petals.filter(petal => petal.y < .99);
    for (const petal of this.petals) {
      petal.y += petal.speed * dt;
      const p = this.realm.project(petal.x + Math.sin(t + petal.phase) * .014, petal.y);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(t * .9 + petal.phase);
      ctx.globalAlpha = .72; ctx.fillStyle = '#fbe6d5'; ctx.beginPath(); ctx.ellipse(0, 0, 3.6, 1.7, 0, 0, TAU); ctx.fill(); ctx.restore();
    }
    ctx.globalAlpha = 1;
    this.canvas.dataset.fish = String(this.fish.length);
    this.canvas.dataset.blessings = String(this.blessings);
    this.canvas.dataset.open = String(this.lilies.filter(lily => lily.opening > .8).length);
  }

  reset() {
    this.hand = null; this.kind = null; this.charge = 0; this.lastTime = 0; this.blessings = 0;
    this.canvas.dataset.blessings = '0'; this.canvas.dataset.open = '0';
    this.drops = []; this.petals = [];
    this.fish.forEach((f, i) => Object.assign(f, { x: .53 + i * .1, y: .862 + i * .023, jump: null }));
    this.lilies.forEach(lily => Object.assign(lily, { visible: false, growth: 0, opening: 0, opened: false }));
  }
}
