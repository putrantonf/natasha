// The instruction belongs to the lit material, never to a floating icon.
export class ActionCue {
  constructor(parent) {
    this.element = document.createElement('div');
    this.element.className = 'action-cue';
    this.element.setAttribute('aria-hidden', 'true');
    this.element.hidden = true;
    parent.append(this.element);
  }
  show(text, point, { below = false, busy = false } = {}) {
    if (!point || !text) { this.hide(); return; }
    const box = this.element.parentElement.getBoundingClientRect();
    const x = Math.max(90, Math.min(box.width - 90, point.x));
    const y = Math.max(100, Math.min(box.height - 110, point.y + (below ? 54 : -66)));
    this.element.textContent = text;
    this.element.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;
    this.element.style.setProperty('--stem-length', Math.max(10, Math.hypot(point.x - x, point.y - y) - 10) + 'px');
    this.element.style.setProperty('--stem-angle', (Math.atan2(point.y - y, point.x - x) - Math.PI / 2) + 'rad');
    this.element.dataset.below = String(below);
    this.element.dataset.busy = String(busy);
    this.element.hidden = false;
  }
  hide() { this.element.hidden = true; }
}
