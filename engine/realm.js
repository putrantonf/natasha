const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);

// A single painting supplies the whole route. Camera coordinates refer to its
// original dimensions, so a landmark stays in the same place at every size.
export class Realm {
  constructor(image, reducedMotion, painting) {
    this.image = image; this.reducedMotion = reducedMotion; this.painting = painting;
    this.current = { x: .16, y: .55, zoom: 1.08 };
    this.resize();
  }

  resize() {
    const box = this.image.parentElement.getBoundingClientRect();
    this.width = box.width; this.height = box.height;
    this.painting?.resize();
  }

  move(camera, duration = 1100) {
    this.advance(performance.now());
    this.from = { ...this.current }; this.target = { ...camera };
    this.started = performance.now(); this.duration = this.reducedMotion ? 0 : duration;
    if (!this.duration) this.current = { ...this.target };
  }

  advance(time) {
    if (!this.target || !this.duration) return;
    const progress = Math.min(1, Math.max(0, (time - this.started) / this.duration));
    for (const key of ['x', 'y', 'zoom']) this.current[key] = lerp(this.from[key], this.target[key], smooth(progress));
    if (progress === 1) this.duration = 0;
  }

  draw(time, driftX = 0, driftY = 0) {
    this.advance(time);
    if (!this.image.naturalWidth) return;
    const portrait = this.image.dataset.fit === 'portrait' && this.width > this.height;
    const scale = (portrait ? this.height / this.image.naturalHeight :
      Math.max(this.width / this.image.naturalWidth, this.height / this.image.naturalHeight)) * this.current.zoom;
    const width = this.image.naturalWidth * scale, height = this.image.naturalHeight * scale;
    const left = width < this.width ? (this.width - width) / 2 :
      Math.min(0, Math.max(this.width - width, this.width / 2 - this.current.x * width));
    const top = Math.min(0, Math.max(this.height - height, this.height / 2 - this.current.y * height));
    this.image.style.width = `${width.toFixed(2)}px`;
    this.image.style.height = `${height.toFixed(2)}px`;
    this.image.style.transform = `translate3d(${(left + driftX * .4).toFixed(2)}px,${(top + driftY * .4).toFixed(2)}px,0)`;
    this.frame = { left: left + driftX * .4, top: top + driftY * .4, width, height };
    this.painting?.draw(time, this.frame);
  }

  project(x, y) {
    const frame = this.frame;
    return frame ? { x: frame.left + x * frame.width, y: frame.top + y * frame.height,
      scale: frame.width / this.image.naturalWidth } : null;
  }
}
