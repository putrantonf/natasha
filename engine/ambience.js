const TAU = Math.PI * 2;

export class Embers {
  constructor(canvas, reducedMotion) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.reducedMotion = reducedMotion;
    this.pointer = { active: false, x: 0, y: 0 };
    this.heat = 0; this.phase = 'arrival'; this.realm = 'gate'; this.sparks = []; this.lastCharge = 0;
    this.particles = Array.from({ length: 58 }, (_, index) => ({
      x: Math.random(), y: Math.random(), depth: .35 + Math.random() * .9,
      size: .5 + Math.random() * 1.4, offset: Math.random() * TAU,
      vx: 0, vy: 0, ember: index % 3 !== 0,
    }));
    this.glow = this.sprite('255,187,103');
    this.fog = this.sprite('143,164,176');
    this.hotFog = this.sprite('184,107,76');
    this.petalGlow = this.sprite('248,235,181');
    this.wind = 0; this.sourceProject = null; this.smoke = []; this.lastSourceEmission = 0;
    this.fireSources = [[.049,.633,21], [.169,.627,24], [.265,.624,23], [.334,.636,20], [.955,.739,19]];
    this.leaves = Array.from({ length: 13 }, (_, i) => ({
      x: .34 + Math.random() * .33, y: Math.random() * .9, size: 2.5 + Math.random() * 3,
      phase: i * 1.7, speed: .012 + Math.random() * .012,
    }));
    this.petals = Array.from({ length: 17 }, (_, i) => ({
      x: .26 + Math.random() * .47, y: Math.random() * .87,
      size: 1.5 + Math.random() * 2.2, phase: i * 2.1, speed: .013 + Math.random() * .013,
    }));
    this.resize();
  }

  sprite(color) {
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 96;
    const ctx = sprite.getContext('2d');
    const gradient = ctx.createRadialGradient(48, 48, 0, 48, 48, 48);
    gradient.addColorStop(0, `rgba(${color},.7)`);
    gradient.addColorStop(.16, `rgba(${color},.25)`);
    gradient.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 96, 96);
    return sprite;
  }

  resize() {
    const { width, height } = this.canvas.getBoundingClientRect();
    this.width = width; this.height = height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(width * dpr); this.canvas.height = Math.round(height * dpr);
    this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  setPointer(x, y, active = true) { Object.assign(this.pointer, { x, y, active }); }

  emit(x, y, kind = 'touch') {
    if (this.reducedMotion) return;
    const count = kind === 'rune' ? 28 : kind === 'recognition' ? 22 : kind === 'stone' ? 36 : 8;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * TAU, speed = 13 + Math.random() * (kind === 'stone' ? 85 : 55);
      this.sparks.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 18,
        size: .5 + Math.random() * 1.4, life: .6 + Math.random() * 1.4, age: 0 });
    }
    if (this.sparks.length > 160) this.sparks.splice(0, this.sparks.length - 160);
  }

  charge(x, y, progress) {
    const now = performance.now();
    if (now - this.lastCharge < 125 || progress < .1) return;
    this.lastCharge = now;
    this.emit(x + (Math.random() - .5) * 22, y + (Math.random() - .5) * 22);
  }

  reset() { this.sparks = []; this.smoke = []; this.heat = 0; this.lastTime = 0; this.lastSourceEmission = 0; this.guide = null; }

  guideFloor(here, ahead) { this.guide = { here, ahead }; }

  drawGarden(t, dt) {
    const ctx = this.context;
    for (const petal of this.petals) {
      petal.y += petal.speed * dt;
      if (petal.y > .95) { petal.y = .06; petal.x = .26 + Math.random() * .47; }
      const p = this.sourceProject(petal.x + Math.sin(t * .55 + petal.phase) * .023 + this.wind * .012, petal.y);
      if (!p || p.x < -20 || p.x > this.width + 20) continue;
      const size = petal.size * Math.min(1.7, p.scale);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(t * .8 + petal.phase);
      ctx.scale(1, .35 + Math.abs(Math.sin(t * 1.5 + petal.phase)) * .65);
      ctx.globalAlpha = .55; ctx.fillStyle = petal.phase % 3 < 1.5 ? '#f6dfd4' : '#fff1ca';
      ctx.beginPath(); ctx.ellipse(0, 0, size, size * .6, .4, 0, TAU); ctx.fill(); ctx.restore();
    }
    for (const [index, x, y] of [[0,.40,.60], [1,.73,.60], [2,.19,.42]]) {
      const p = this.sourceProject(x + Math.sin(t * .29 + index * 3) * .033,
        y + Math.sin(t * .47 + index * 2) * .040);
      if (!p || p.x < -20 || p.x > this.width + 20) continue;
      const size = Math.min(8, 4 * p.scale), wing = .2 + Math.abs(Math.sin(t * 8.0 + index)) * .8;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.sin(t * .8 + index) * .3);
      ctx.globalAlpha = .63; ctx.fillStyle = index === 1 ? '#eac8df' : '#faf0c6';
      for (const side of [-1, 1]) {
        ctx.beginPath(); ctx.ellipse(side * size * .45 * wing, -size * .15,
          size * .55 * wing, size * .42, side * -.5, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = '#776442'; ctx.fillRect(-.45, -size * .28, .9, size * .63); ctx.restore();
    }
  }

  drawMaterials(t, dt) {
    if (!this.sourceProject) return;
    const ctx = this.context;
    if (this.realm === 'garden' || this.realm === 'passage') { this.drawGarden(t, dt); return; }
    if (this.realm === 'gate') {
      for (const leaf of this.leaves) {
        leaf.y += leaf.speed * dt;
        if (leaf.y > .94) { leaf.y = .08; leaf.x = .34 + Math.random() * .33; }
        const p = this.sourceProject(leaf.x + Math.sin(t * .5 + leaf.phase) * .022, leaf.y);
        if (!p || p.x < -20 || p.x > this.width + 20) continue;
        ctx.save(); ctx.translate(p.x, p.y);
        ctx.rotate(t * 1.2 + leaf.phase); ctx.scale(1, .4 + Math.abs(Math.sin(t * 1.8 + leaf.phase)) * .6);
        ctx.fillStyle = '#8c987c'; ctx.globalAlpha = .35;
        const size = leaf.size * Math.min(p.scale, 1.6);
        ctx.beginPath(); ctx.moveTo(-size, 0); ctx.quadraticCurveTo(0, -size * .55, size, 0);
        ctx.quadraticCurveTo(0, size * .55, -size, 0); ctx.fill(); ctx.restore();
      }
      return;
    }
    const emit = t - this.lastSourceEmission > .16;
    if (emit) this.lastSourceEmission = t;
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    for (const [x, y, height] of this.fireSources) {
      const p = this.sourceProject(x, y);
      if (!p || p.x < -80 || p.x > this.width + 80 || p.y < 0 || p.y > this.height + 40) continue;
      const h = height * p.scale, sway = (Math.sin(t * 5.1 + x * 81) + this.wind * 1.4) * h * .18;
      const near = this.pointer.active && Math.hypot(p.x - this.pointer.x, p.y - this.pointer.y) < 95 ? 1.35 : 1;
      ctx.globalAlpha = .16 + Math.sin(t * 4.7 + x * 29) ** 2 * .17;
      ctx.drawImage(this.glow, p.x - h * 1.6, p.y - h * 2, h * 3.2, h * 3.2);
      const flame = ctx.createLinearGradient(0, p.y, 0, p.y - h * near);
      flame.addColorStop(0, '#ffd795dd'); flame.addColorStop(.35, '#ffa14399'); flame.addColorStop(1, '#e8501a00');
      ctx.fillStyle = flame; ctx.globalAlpha = .65;
      ctx.beginPath(); ctx.moveTo(p.x - h * .22, p.y);
      ctx.bezierCurveTo(p.x - h * .35, p.y - h * .4, p.x + sway, p.y - h * .6, p.x + sway, p.y - h * near);
      ctx.bezierCurveTo(p.x + sway + h * .1, p.y - h * .4, p.x + h * .3, p.y - h * .25, p.x + h * .22, p.y);
      ctx.closePath(); ctx.fill();
      if (emit && this.sparks.length < 120 && Math.random() < .65) {
        this.sparks.push({ x: p.x, y: p.y - h * .6, vx: 4 + this.wind * 14,
          vy: -15 - Math.random() * 16, size: .6 + Math.random(), life: 1.5 + Math.random(), age: 0 });
      }
      if (emit && this.smoke.length < 32 && Math.random() < .16) {
        this.smoke.push({ x: p.x, y: p.y - h, size: h * 1.3, age: 0, phase: x * 80 });
      }
    }
    for (const smoke of this.smoke) {
      smoke.age += dt; smoke.y -= 12 * dt; smoke.x += this.wind * 9 * dt;
      const size = smoke.size + smoke.age * 14;
      ctx.globalAlpha = Math.sin(Math.min(1, smoke.age / 4) * Math.PI) * .095;
      ctx.drawImage(this.hotFog, smoke.x - size / 2 + Math.sin(t + smoke.phase) * 7,
        smoke.y - size / 2, size, size * 1.3);
    }
    this.smoke = this.smoke.filter(smoke => smoke.age < 4);
    ctx.restore();
    if (this.guide) {
      // A few embers lift from the next stone; the illuminated rock is the cue.
      const { here, ahead } = this.guide;
      const alpha = .12 + Math.sin(t * 2.1) ** 2 * .12;
      ctx.globalAlpha = alpha; ctx.drawImage(this.glow, here.x - 24, here.y - 14, 48, 28);
      ctx.drawImage(this.glow, ahead.x - 15, ahead.y - 10, 30, 20); ctx.globalAlpha = 1;
    }
  }

  draw(time) {
    const ctx = this.context, w = this.width, h = this.height;
    const dt = Math.min((time - (this.lastTime || time)) / 1000, .05), t = time / 1000;
    this.lastTime = time;
    ctx.clearRect(0, 0, w, h);
    if (this.reducedMotion) {
      if (this.guide) {
        ctx.globalAlpha = .35;
        ctx.drawImage(this.glow, this.guide.here.x - 30, this.guide.here.y - 18, 60, 36);
        ctx.drawImage(this.glow, this.guide.ahead.x - 20, this.guide.ahead.y - 12, 40, 24); ctx.globalAlpha = 1;
      }
      return;
    }
    this.drawMaterials(t, dt);
    for (let i = 0; i < (this.realm === 'garden' ? 0 : 6); i++) {
      const x = ((i * .23 + t * .003 * (i % 2 ? 1 : -1) + 1) % 1) * w;
      const y = h * (.72 + Math.sin(t * .12 + i) * .035 + (i % 3) * .065);
      ctx.globalAlpha = .13 + Math.sin(t * .18 + i) * .025;
      ctx.drawImage(this.realm === 'hell' ? this.hotFog : this.fog, x - w * .28, y - 45, w * .56, 100 + i * 12);
    }
    ctx.globalAlpha = 1;
    for (const p of this.particles) {
      const x = p.x * w, y = p.y * h;
      if (this.pointer.active) {
        const dx = x - this.pointer.x, dy = y - this.pointer.y, distance = Math.hypot(dx, dy);
        if (distance > 1 && distance < 115) {
          const force = (1 - distance / 115) * 30 * p.depth;
          p.vx += dx / distance * force * dt; p.vy += dy / distance * force * dt;
        }
      }
      p.vx *= Math.exp(-dt * 1.8); p.vy *= Math.exp(-dt * 1.8);
      p.x += (Math.sin(t * .35 + p.offset) * 4 * p.depth + p.vx + this.wind * 12 * p.depth) * dt / w;
      p.y += (-9 * p.depth * (1 + this.heat * .3) + p.vy) * dt / h;
      if (p.y < -.03) { p.y = 1.03; p.x = Math.random(); }
      if (p.x < -.03) p.x = 1.03; else if (p.x > 1.03) p.x = -.03;
      const alpha = (.12 + .27 * Math.sin(t * .6 + p.offset) ** 2) * Math.min(p.y * 4, 1);
      ctx.fillStyle = this.realm === 'garden' ? `rgba(253,237,172,${alpha * .7})` : p.ember ? `rgba(241,175,91,${alpha})` : this.realm === 'hell' ?
        `rgba(181,147,128,${alpha * .65})` : `rgba(160,174,182,${alpha * .65})`;
      ctx.beginPath(); ctx.arc(p.x * w, p.y * h, p.size * p.depth, 0, TAU); ctx.fill();
      if (p.ember && p.depth > 1) {
        ctx.globalAlpha = alpha * .2;
        ctx.drawImage(this.glow, p.x * w - 7, p.y * h - 7, 14, 14);
        ctx.globalAlpha = 1;
      }
    }
    this.sparks = this.sparks.filter((p) => p.age < p.life);
    for (const p of this.sparks) {
      p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy -= dt * 9;
      p.vx *= Math.exp(-dt * .8);
      const alpha = Math.max(0, 1 - p.age / p.life);
      ctx.globalAlpha = alpha;
      ctx.drawImage(this.realm === 'garden' ? this.petalGlow : this.glow, p.x - 7, p.y - 7, 14, 14);
      ctx.fillStyle = this.realm === 'garden' ? '#fff0c8' : '#ffe0a4';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

export class AmbientAudio {
  constructor() { this.enabled = false; this.effects = new Set(); this.realm = 'gate'; }

  toggle() {
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) throw new Error('Audio tidak didukung perangkat ini.');
      this.context = new AudioContext();
      this.output = this.context.createGain(); this.output.gain.value = 0;
      this.output.connect(this.context.destination);
      this.drones = this.context.createGain(); this.drones.gain.value = 1; this.drones.connect(this.output);
      for (const [frequency, amplitude] of [[61.74, .014], [92.5, .006], [123.47, .003]]) {
        const oscillator = this.context.createOscillator(), gain = this.context.createGain();
        oscillator.type = 'sine'; oscillator.frequency.value = frequency; gain.gain.value = amplitude;
        oscillator.connect(gain); gain.connect(this.drones); oscillator.start();
      }
      const air = this.context.createBufferSource(); air.buffer = this.noiseBuffer(4); air.loop = true;
      const filter = this.context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 380;
      this.windFilter = filter;
      this.wind = this.context.createGain(); this.wind.gain.value = .055;
      air.connect(filter); filter.connect(this.wind); this.wind.connect(this.output); air.start();
      const tide = this.context.createOscillator(), tideGain = this.context.createGain();
      tide.frequency.value = .12; tideGain.gain.value = .018;
      tide.connect(tideGain); tideGain.connect(this.wind.gain); tide.start();
      const water = this.context.createBufferSource(); water.buffer = this.noiseBuffer(4); water.loop = true;
      const waterFilter = this.context.createBiquadFilter(); waterFilter.type = 'bandpass';
      waterFilter.frequency.value = 880; waterFilter.Q.value = .45;
      this.water = this.context.createGain(); this.water.gain.value = 0;
      water.connect(waterFilter); waterFilter.connect(this.water); this.water.connect(this.output); water.start();
    }
    if (this.context.state === 'suspended') this.context.resume().catch(() => {});
    this.enabled = !this.enabled;
    this.setRealm(this.realm);
    this.output.gain.setTargetAtTime(this.enabled ? 1 : 0, this.context.currentTime, .15);
    return this.enabled;
  }

  noiseBuffer(seconds) {
    const buffer = this.context.createBuffer(1, Math.ceil(this.context.sampleRate * seconds), this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  track(source, nodes, start, duration) {
    this.effects.add(source);
    source.onended = () => { this.effects.delete(source); source.disconnect(); nodes.forEach(node => node.disconnect()); };
    source.start(start); source.stop(start + duration);
  }

  thud(delay = 0, strength = 1) {
    if (!this.enabled) return;
    const ctx = this.context, start = ctx.currentTime + delay;
    const oscillator = ctx.createOscillator(), gain = ctx.createGain();
    oscillator.frequency.setValueAtTime(105, start);
    oscillator.frequency.exponentialRampToValueAtTime(37, start + .21);
    gain.gain.setValueAtTime(.13 * strength, start); gain.gain.exponentialRampToValueAtTime(.001, start + .5);
    oscillator.connect(gain); gain.connect(this.output); this.track(oscillator, [gain], start, .55);
  }

  rune(index) {
    if (!this.enabled) return;
    const ctx = this.context, start = ctx.currentTime;
    const oscillator = ctx.createOscillator(), gain = ctx.createGain();
    const frequency = [164.81, 196, 246.94][index];
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.005, start + .6);
    gain.gain.setValueAtTime(.001, start); gain.gain.linearRampToValueAtTime(.027, start + .06);
    gain.gain.exponentialRampToValueAtTime(.001, start + 1.5);
    oscillator.connect(gain); gain.connect(this.output); this.track(oscillator, [gain], start, 1.55);
    if (this.realm !== 'garden') this.thud(0, .2);
  }

  push() {
    if (!this.enabled) return;
    const ctx = this.context, start = ctx.currentTime;
    const stone = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
    stone.buffer = this.noiseBuffer(1.8);
    filter.type = 'bandpass'; filter.frequency.setValueAtTime(190, start);
    filter.frequency.exponentialRampToValueAtTime(70, start + 1.6); filter.Q.value = 2;
    gain.gain.setValueAtTime(.001, start); gain.gain.linearRampToValueAtTime(.17, start + .25);
    gain.gain.exponentialRampToValueAtTime(.001, start + 1.7);
    stone.connect(filter); filter.connect(gain); gain.connect(this.output);
    this.track(stone, [filter, gain], start, 1.8); this.thud(.12, .8);
  }

  footsteps() { [.3, .8, 1.3].forEach((delay, index) => this.thud(delay, this.realm === 'garden' ? .10 : .25 + index * .1)); }

  waterTouch() {
    if (!this.enabled) return;
    const ctx = this.context, start = ctx.currentTime;
    const water = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
    water.buffer = this.noiseBuffer(.35); filter.type = 'bandpass'; filter.frequency.value = 750; filter.Q.value = .8;
    gain.gain.setValueAtTime(.001, start); gain.gain.linearRampToValueAtTime(.023, start + .045);
    gain.gain.exponentialRampToValueAtTime(.001, start + .34);
    water.connect(filter); filter.connect(gain); gain.connect(this.output);
    this.track(water, [filter, gain], start, .35);
  }

  update(time) {
    if (!this.enabled || this.realm !== 'garden' || this.context.state !== 'running' || time < (this.nextBirdAt || 0)) return;
    this.nextBirdAt = time + 8500 + Math.random() * 7000;
    const ctx = this.context;
    for (let index = 0; index < 3; index++) {
      const start = ctx.currentTime + index * .15, bird = ctx.createOscillator(), gain = ctx.createGain();
      const note = 1720 + Math.random() * 280;
      bird.frequency.setValueAtTime(note, start); bird.frequency.exponentialRampToValueAtTime(note * 1.36, start + .065);
      bird.frequency.exponentialRampToValueAtTime(note * .95, start + .13);
      gain.gain.setValueAtTime(.001, start); gain.gain.linearRampToValueAtTime(.005, start + .025);
      gain.gain.exponentialRampToValueAtTime(.001, start + .15);
      bird.connect(gain); gain.connect(this.output); this.track(bird, [gain], start, .16);
    }
  }

  recognition() {
    if (!this.enabled) return;
    const ctx = this.context;
    for (const [index, frequency] of [220, 329.63, 440].entries()) {
      const start = ctx.currentTime + index * .09;
      const oscillator = ctx.createOscillator(), gain = ctx.createGain();
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(.001, start); gain.gain.linearRampToValueAtTime(.015, start + .06);
      gain.gain.exponentialRampToValueAtTime(.001, start + 1.2);
      oscillator.connect(gain); gain.connect(this.output); this.track(oscillator, [gain], start, 1.25);
    }
  }

  reset() {
    this.effects.forEach(source => { try { source.stop(); } catch {} });
    this.effects.clear();
  }

  setRealm(realm) {
    this.realm = realm;
    if (!this.context) return;
    const now = this.context.currentTime;
    this.drones.gain.setTargetAtTime(realm === 'garden' ? .10 : realm === 'passage' ? .42 : 1, now, 1.2);
    this.water.gain.setTargetAtTime(realm === 'garden' ? .026 : realm === 'passage' ? .012 : 0, now, 1.0);
    this.wind.gain.setTargetAtTime(realm === 'garden' ? .035 : realm === 'hell' ? .075 : .055, now, .8);
    this.windFilter.frequency.setTargetAtTime(realm === 'hell' ? 540 : 380, now, .8);
    if (realm === 'garden') this.nextBirdAt = performance.now() + 4000;
  }

  suspend() { if (this.context?.state === 'running') this.context.suspend().catch(() => {}); }
  resume() { if (this.enabled && this.context?.state === 'suspended') this.context.resume().catch(() => {}); }
}

