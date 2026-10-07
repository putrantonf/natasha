import { PortraitMesh } from './portrait-mesh.js';

const loadImage = (url) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('Art tidak dapat dimuat: ' + url));
  image.src = url;
});

// Keep the supplied portrait intact. The atlas is used only for small facial
// details; its differently sized head and body are never assembled on screen.
const FACE_PATCHES = {
  blink: { x: 302, y: 382, width: 158, height: 80, column: 0, row: 1, shiftX: 0, shiftY: 10,
    areas: [[343, 411, 33, 19, .28], [421, 433, 31, 19, .28]] },
  surprised: { x: 297, y: 371, width: 167, height: 94, column: 1, row: 1, shiftX: 7, shiftY: 14,
    areas: [[343, 407, 39, 29, .28], [421, 429, 35, 29, .28]] },
};

function alignEyes(sourceLeft, sourceRight, targetLeft, targetRight) {
  const sx = sourceRight[0] - sourceLeft[0], sy = sourceRight[1] - sourceLeft[1];
  const tx = targetRight[0] - targetLeft[0], ty = targetRight[1] - targetLeft[1];
  const lengthSquared = sx * sx + sy * sy;
  const a = (tx * sx + ty * sy) / lengthSquared;
  const b = (ty * sx - tx * sy) / lengthSquared;
  return [a, b, -b, a,
    targetLeft[0] - a * sourceLeft[0] + b * sourceLeft[1],
    targetLeft[1] - b * sourceLeft[0] - a * sourceLeft[1]];
}

const FACE_TRANSFORM = alignEyes([343, 411], [421, 433], [539.55, 450.72], [624.94, 471]);

function makeFacePatch(atlas, patch) {
  const texture = document.createElement('canvas');
  texture.width = patch.width; texture.height = patch.height;
  const ctx = texture.getContext('2d');
  ctx.drawImage(atlas, patch.shiftX - patch.column * atlas.width / 2 - patch.x,
    patch.shiftY - patch.row * atlas.height / 2 - patch.y);
  const mask = document.createElement('canvas');
  mask.width = patch.width; mask.height = patch.height;
  const maskContext = mask.getContext('2d');
  for (const [x, y, rx, ry, angle] of patch.areas) {
    maskContext.save();
    maskContext.translate(x - patch.x, y - patch.y);
    maskContext.rotate(angle); maskContext.scale(rx, ry);
    const fade = maskContext.createRadialGradient(0, 0, 0, 0, 0, 1);
    fade.addColorStop(0, '#fff'); fade.addColorStop(.65, '#fff');
    fade.addColorStop(1, 'rgba(255,255,255,0)');
    maskContext.fillStyle = fade;
    maskContext.fillRect(-1, -1, 2, 2);
    maskContext.restore();
  }
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(mask, 0, 0);
  return { ...patch, texture };
}

const smoothStep = (value) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

// A pose bends the continuous illustration, with a soft falloff through the
// neck and shoulders. Values are angle, head lift, chest lean, and wrist lift.
const GESTURES = {
  guard: [.03, 0, 0, -2],
  listen: [-.032, 3, 9, 4],
  startle: [-.055, -10, -12, 8],
  reassess: [.045, 2, 2, -8],
  permit: [-.044, 1, -7, 12],
};

export class Character {
  constructor(canvas, { reducedMotion = false } = {}) {
    this.canvas = canvas;
    try {
      this.mesh = new PortraitMesh(canvas);
    } catch {
      // A failed WebGL context cannot be reused for Canvas2D.
      this.canvas = canvas.cloneNode(false);
      canvas.replaceWith(this.canvas);
    }
    if (!this.mesh?.gl) this.context = this.canvas.getContext('2d');
    this.canvas.dataset.renderer = this.mesh?.gl ? 'mesh' : 'canvas';
    this.reducedMotion = reducedMotion;
    this.expression = 'calm';
    this.speaking = false;
    this.visible = false;
    this.blinkAt = 3.6;
    this.blinkStart = -10;
    this.changeAt = 0;
    this.reactionFrom = 0;
    this.concealAt = -10;
    this.origin = performance.now();
    this.gesture = 'guard';
    this.pose = new Float32Array(GESTURES.guard);
    this.poseFrom = [...this.pose];
    this.gestureAt = 0;
    this.look = [0, 0];
    this.lookTarget = [0, 0];
    this.beatAt = -10;
    this.warmth = 0;
    this.wind = 0; this.idleAt = -10; this.nextIdleAt = 5;
    this.idleKind = 0; this.touchAt = -10; this.lastPointerAt = -10;
    this.resetForm();
    this.resize();
  }

  async load() {
    const [portrait, atlas, divine] = await Promise.all([
      loadImage('./assets/lucifer-intact.png'),
      loadImage('./assets/lucifer-rig.png'),
      loadImage('./assets/lucifer-divine.png'),
    ]);
    this.portrait = portrait;
    this.divine = divine;
    this.facePatches = Object.fromEntries(Object.entries(FACE_PATCHES)
      .map(([name, patch]) => [name, makeFacePatch(atlas, patch)]));
    if (this.mesh?.gl) {
      const faces = ['blink', 'surprised'].map((name) => {
        const layer = document.createElement('canvas');
        layer.width = portrait.width; layer.height = portrait.height;
        const ctx = layer.getContext('2d'), patch = this.facePatches[name];
        ctx.transform(...FACE_TRANSFORM);
        ctx.drawImage(patch.texture, patch.x, patch.y, patch.width, patch.height);
        return layer;
      });
      this.mesh.load(portrait, ...faces, divine);
    }
    const mask = document.createElement('canvas');
    mask.width = 96; mask.height = 144;
    const maskContext = mask.getContext('2d', { willReadFrequently: true });
    maskContext.drawImage(portrait, 0, 0, 96, 144);
    this.hitMask = maskContext.getImageData(0, 0, 96, 144).data;
    this.fallenHitMask = this.hitMask;
    maskContext.clearRect(0, 0, 96, 144); maskContext.drawImage(divine, -.48, 6.34, 96, 144);
    this.divineHitMask = maskContext.getImageData(0, 0, 96, 144).data;
  }

  resetForm() {
    this.divineStarted = null; this.formDuration = 0;
    this.canvas.dataset.form = 'fallen'; this.canvas.dataset.transformation = '0';
    delete this.canvas.dataset.formDuration;
    this.canvas.setAttribute('aria-label', 'Lucifer, malaikat jatuh dan penguasa neraka, bertanduk dengan jubah gelap');
    if (this.fallenHitMask) this.hitMask = this.fallenHitMask;
  }
  revealDivine(duration = 4600) {
    this.divineStarted = performance.now(); this.formDuration = this.reducedMotion ? 450 : duration;
    this.canvas.dataset.formDuration = String(this.formDuration);
    this.canvas.dataset.form = 'transfiguring'; this.setGesture('listen');
  }
  formProgress(now) {
    if (this.divineStarted === null) return 0;
    const p = Math.min(1, (now - this.divineStarted) / this.formDuration);
    this.canvas.dataset.transformation = p.toFixed(3);
    if (p >= 1 && this.canvas.dataset.form !== 'divine') {
      this.canvas.dataset.form = 'divine'; this.hitMask = this.divineHitMask;
      this.canvas.setAttribute('aria-label', 'Lucifer dalam wujud divine, berwajah familier dengan sayap ivory, halo dan jubah emas');
    }
    return p;
  }

  resize() {
    const { width, height } = this.canvas.getBoundingClientRect();
    this.width = width;
    this.height = height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    if (this.mesh?.gl) this.mesh.resize(width, height, this.canvas.width, this.canvas.height);
    else this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  setGesture(name) {
    if (!GESTURES[name] || this.gesture === name) return;
    this.poseFrom = [...this.pose];
    this.gesture = name;
    this.gestureAt = (performance.now() - this.origin) / 1000;
    this.canvas.dataset.pose = name;
  }

  beat() { this.beatAt = (performance.now() - this.origin) / 1000; }

  receivePointer(x, y) {
    this.lookTarget = [Math.max(-1, Math.min(1, (x / this.width - .6) * 2)),
      Math.max(-1, Math.min(1, y / this.height - .4))];
    this.lastPointerAt = (performance.now() - this.origin) / 1000;
  }

  releasePointer() { this.lookTarget = [0, 0]; }

  reactToTouch(x, y) {
    this.receivePointer(x, y); this.beat();
    this.touchAt = (performance.now() - this.origin) / 1000;
    this.canvas.dataset.action = 'regard';
  }

  resetActing() {
    this.idleAt = this.touchAt = -10;
    this.nextIdleAt = (performance.now() - this.origin) / 1000 + 5;
    this.canvas.dataset.action = 'still';
  }

  hitTest(x, y) {
    if (!this.visible || !this.bounds || !this.hitMask) return false;
    const { left, top, width, height } = this.bounds;
    const mx = Math.floor((x - left) / width * 96), my = Math.floor((y - top) / height * 144);
    return mx >= 0 && mx < 96 && my >= 0 && my < 144 && this.hitMask[(my * 96 + mx) * 4 + 3] > 80;
  }

  setExpression(expression) {
    if (this.expression === expression) return;
    const t = (performance.now() - this.origin) / 1000;
    this.reactionFrom = this.reactionWeight(t);
    this.expression = expression;
    this.changeAt = t;
    this.blinkStart = -10;
    this.blinkAt = t + 3.6;
  }

  reactionWeight(t) {
    const target = this.expression === 'surprised' ? 1 : 0;
    if (this.reducedMotion) return target;
    return this.reactionFrom + (target - this.reactionFrom) * smoothStep((t - this.changeAt) / .24);
  }

  setReaction(name) {
    this.canvas.dataset.reaction = name || 'none';
    const t = (performance.now() - this.origin) / 1000;
    this.concealAt = name === 'conceal' ? t : -10;
    if (name === 'conceal') {
      this.blinkStart = -10; this.blinkAt = t + 3.6;
    }
  }

  concealedReaction(t) {
    if (this.reducedMotion) return 0;
    const age = t - this.concealAt;
    if (age < 0 || age > .85) return 0;
    // A small intake in the eyes, contained before any spoken response.
    return .28 * smoothStep(age / .12) * (1 - smoothStep((age - .22) / .63));
  }

  drawFacePatch(name, opacity) {
    if (opacity <= 0) return;
    const patch = this.facePatches[name];
    this.context.globalAlpha = opacity;
    this.context.drawImage(patch.texture, patch.x, patch.y, patch.width, patch.height);
    this.context.globalAlpha = 1;
  }

  draw(now) {
    const ctx = this.context;
    if (!this.visible || !this.portrait) {
      if (this.mesh?.gl) this.mesh.clear();
      else ctx.clearRect(0, 0, this.width, this.height);
      this.wasVisible = false;
      return;
    }
    const t = (now - this.origin) / 1000;
    const form = this.formProgress(now);
    if (!this.wasVisible) {
      this.visibleSince = t; this.blinkAt = t + 3.6; this.blinkStart = -10;
      this.nextIdleAt = t + 4.8;
      this.wasVisible = true;
    }
    const mobile = this.width < 701;
    const portrait = this.portrait;
    const besideMirror = mobile && this.staging === 'reflection';
    const heightLimit = Math.min(this.height * (besideMirror ? .53 : mobile ? .75 : .82), 900);
    const scale = Math.min(heightLimit / portrait.height,
      this.width * (mobile ? .96 : .48) / portrait.width);
    const transition = this.reducedMotion ? 1 : smoothStep((t - this.gestureAt) / .72);
    GESTURES[this.gesture].forEach((target, index) => {
      this.pose[index] = this.poseFrom[index] + (target - this.poseFrom[index]) * transition;
    });
    if (t >= this.nextIdleAt && !this.reducedMotion && this.concealedReaction(t) < .01) {
      this.idleAt = t; this.idleKind = (this.idleKind + 1) % 3;
      this.nextIdleAt = t + 6.5 + Math.random() * 3.0;
    }
    const idleAge = t - this.idleAt;
    const idle = !this.reducedMotion && idleAge >= 0 && idleAge < 3.4
      ? Math.sin(idleAge / 3.4 * Math.PI) ** 2 : 0;
    const touchAge = t - this.touchAt;
    const touch = !this.reducedMotion && touchAge >= 0 && touchAge < 2.0
      ? Math.sin(touchAge / 2.0 * Math.PI) ** 2 : 0;
    this.canvas.dataset.action = touch > .05 ? 'regard' : idle > .05
      ? ['glance', 'adjust-wrist', 'shift-weight'][this.idleKind] : 'still';
    const autoLook = t - this.lastPointerAt > 2.2 ? [-.8 * idle, -.17 * idle] : this.lookTarget;
    this.look = this.look.map((value, i) => value + (autoLook[i] - value) * .06);
    const actedPose = [...this.pose];
    actedPose[0] += idle * (this.idleKind === 0 ? -.027 : .009) + touch * .018;
    actedPose[1] -= touch * 3;
    actedPose[2] += idle * (this.idleKind === 2 ? 7 : 2) - touch * 5;
    actedPose[3] -= idle * (this.idleKind === 1 ? 17 : 3) + touch * 9;
    const entrance = this.reducedMotion ? 0 : (1 - smoothStep((t - this.visibleSince) / 1.4)) * 18;
    const center = this.width * (besideMirror ? .79 : mobile ? .51 : .67) + (this.gesture === 'permit' ? transition * 8 : 0);
    const farewell = ['divine-farewell', 'birthday'].includes(this.staging);
    const baseline = this.height * (mobile ? farewell ? 1.035 : .85 : 1.02) + entrance;
    const beatAge = t - this.beatAt;
    const nod = this.reducedMotion || beatAge < 0 || beatAge > .65 ? 0 : Math.sin(beatAge / .65 * Math.PI);
    const reaction = Math.max(this.reactionWeight(t), this.concealedReaction(t));
    let blink = 0;
    if (this.expression === 'calm' && reaction < .001 && !this.reducedMotion) {
      if (t >= this.blinkAt) {
        this.blinkStart = t;
        this.blinkAt = t + 3.8 + Math.random() * 3.5;
      }
      const progress = (t - this.blinkStart) / .19;
      blink = progress >= 0 && progress <= 1 ? Math.sin(progress * Math.PI) : 0;
    }
    this.bounds = { left: center - portrait.width * scale / 2, top: baseline - portrait.height * scale,
      width: portrait.width * scale, height: portrait.height * scale };
    if (this.mesh?.gl) {
      this.mesh.draw({ time: t, center, baseline, scale, look: this.look, pose: actedPose,
        reducedMotion: this.reducedMotion, speaking: this.speaking, nod, zoom: 1,
        blink: blink * (1 - form), surprised: reaction * (1 - form), warmth: this.warmth, wind: this.wind, form });
      return;
    }
    // Devices without WebGL retain the complete portrait and dialogue flow.
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.save();
    ctx.translate(center, baseline);
    ctx.rotate(actedPose[0] * .2);
    ctx.scale(scale, scale * (1 + (this.reducedMotion ? 0 : Math.sin(t * 1.05) * .003)));
    ctx.translate(-portrait.width / 2, -portrait.height);
    // One continuous illustration preserves the artist's neck, collar,
    // shoulder width and silhouette through every frame and expression.
    const blend = smoothStep((form - .39) / .22);
    ctx.globalAlpha = 1 - blend; ctx.drawImage(portrait, 0, 0);
    ctx.globalAlpha = blend; ctx.drawImage(this.divine, -portrait.width * .005, portrait.height * .044); ctx.globalAlpha = 1;
    if (form > 0 && form < 1 && !this.reducedMotion) {
      ctx.globalCompositeOperation = 'source-atop';
      const glow = ctx.createRadialGradient(575, 784, 10, 575, 784, 680);
      glow.addColorStop(0, '#ffecbba6'); glow.addColorStop(1, '#ffecbb00');
      ctx.globalAlpha = Math.sin(form * Math.PI) ** 3; ctx.fillStyle = glow; ctx.fillRect(0, 0, portrait.width, portrait.height);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    }
    ctx.transform(...FACE_TRANSFORM);
    this.drawFacePatch('surprised', reaction * (1 - form));
    this.drawFacePatch('blink', blink * (1 - form));
    ctx.restore();
  }
}
