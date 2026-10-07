export class Lore {
  constructor({ trigger, dialog, title, copy, close, onOpen }) {
    Object.assign(this, { trigger, dialog, title, copy, close, onOpen });
    trigger.addEventListener('click', () => this.unroll());
    close.addEventListener('click', () => this.roll());
    dialog.addEventListener('cancel', event => { event.preventDefault(); this.roll(); });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) this.roll();
    });
    dialog.addEventListener('close', () => {
      trigger.setAttribute('aria-expanded', 'false');
      this.opener?.setAttribute('aria-expanded', 'false');
      if (this.opener?.getClientRects().length) this.opener.focus({ preventScroll: true });
    });
  }

  get open() { return this.dialog.open; }

  roll() {
    // Closing hides the dialog synchronously; keep its trigger's accessible
    // state in sync instead of waiting for the deferred native close event.
    this.trigger.setAttribute('aria-expanded', 'false');
    this.opener?.setAttribute('aria-expanded', 'false');
    this.dialog.close();
  }

  prepare(entry) {
    if (this.open) this.roll();
    this.entry = entry; this.trigger.hidden = !entry;
    this.trigger.setAttribute('aria-expanded', 'false');
    if (!entry) return;
    this.trigger.setAttribute('aria-label', `Buka ${entry.label || 'gulungan'}: ${entry.title}`);
    this.trigger.querySelector('.lore-label').textContent = entry.label || 'Gulungan';
    this.dialog.querySelector('.lore-kicker').textContent = entry.kicker || 'CATATAN NERAKA';
    this.title.textContent = entry.title;
    this.copy.replaceChildren(...entry.paragraphs.map(text => {
      const paragraph = document.createElement('p'); paragraph.textContent = text; return paragraph;
    }));
  }

  unroll(opener = this.trigger) {
    if (!this.entry || this.open) return;
    this.opener = opener;
    this.dialog.showModal();
    this.title.focus({ preventScroll: true }); this.dialog.scrollTop = 0;
    this.trigger.setAttribute('aria-expanded', 'true');
    opener.setAttribute('aria-expanded', 'true');
    this.onOpen?.(this.entry);
  }

  reset() { this.prepare(null); }
}
