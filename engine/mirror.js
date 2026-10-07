import { ActionCue } from './action-cue.js';
const clamp = v => Math.max(0, Math.min(1, v));
const smooth = v => { const p = clamp(v); return p * p * (3 - 2 * p); };

// Natasha, the glass and its surroundings are painted together. Only the soot
// on the glass is removed; no portrait is positioned or animated over the art.
export class Mirror {
  constructor({ canvas, element, button, hint, realm, reducedMotion, onComplete, announce }) {
    Object.assign(this, { canvas, element, button, hint, realm, reducedMotion, onComplete, announce });
    this.ctx = canvas.getContext('2d');
    this.cue = new ActionCue(element);
    this.dirty = new Image(); this.dirty.src = './assets/mirror-chamber-ash.png';
    this.ash = document.createElement('canvas'); this.ash.width = 384; this.ash.height = 576;
    this.ashContext = this.ash.getContext('2d');
    this.reset(); this.resize();
    element.addEventListener('pointerdown', e => this.press(e));
    element.addEventListener('pointermove', e => this.move(e));
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) element.addEventListener(name, () => this.release());
    button.addEventListener('keydown', e => {
      if (!['Enter', ' '].includes(e.key)) return;
      e.preventDefault(); e.stopPropagation();
      if (!e.repeat && this.active && !this.busy) this.keyboard = true;
    });
    button.addEventListener('click', e => { if (e.detail === 0 && this.active && !this.busy) this.keyboard = true; });
  }
  async load() { await this.dirty.decode(); this.prepareAsh(); this.loaded = true; }
  resize() {
    const box = this.canvas.getBoundingClientRect(), dpr = Math.min(1.5, devicePixelRatio || 1);
    this.width = box.width; this.height = box.height;
    this.canvas.width = Math.round(box.width * dpr); this.canvas.height = Math.round(box.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  glass(x, y) { return ((x - .5) / .276) ** 2 + ((y - .444) / .348) ** 2 <= 1; }
  prepareAsh() {
    const ctx = this.ashContext, w = this.ash.width, h = this.ash.height;
    ctx.clearRect(0, 0, w, h); ctx.save();
    ctx.beginPath();
    ctx.moveTo(.50*w,.098*h);
    ctx.bezierCurveTo(.70*w,.096*h,.794*w,.276*h,.783*w,.448*h);
    ctx.bezierCurveTo(.80*w,.629*h,.702*w,.789*h,.498*w,.795*h);
    ctx.bezierCurveTo(.292*w,.793*h,.208*w,.636*h,.213*w,.448*h);
    ctx.bezierCurveTo(.207*w,.273*h,.321*w,.10*h,.50*w,.098*h); ctx.closePath(); ctx.clip();
    if (this.dirty.naturalWidth) ctx.drawImage(this.dirty,0,0,w,h);
    else { ctx.fillStyle='#373330';ctx.fillRect(0,0,w,h); }
    ctx.restore();
    this.cells=[];
    for(let y=.13;y<.78;y+=.024) for(let x=.24;x<.78;x+=.024) {
      if(this.glass(x,y)) this.cells.push({x,y,clear:false});
    }
  }
  geometry() {
    const f=this.realm.frame;
    return f && {x:f.left+.5*f.width,y:f.top+.444*f.height,rx:.276*f.width,ry:.348*f.height};
  }
  source(x,y) {
    const f=this.realm.frame; return f && {x:(x-f.left)/f.width,y:(y-f.top)/f.height};
  }
  position() {
    const p=this.geometry(); if(!p)return;
    Object.assign(this.button.style,{left:p.x+'px',top:p.y+'px',width:p.rx*2+'px',height:p.ry*2+'px'});
    if(this.active&&!this.busy)this.cue.show('USAP ABU DI KACA',this.realm.project(.5,.63));
    else this.cue.hide();
  }
  start() {
    this.active=true; this.busy=false; this.keyboard=false; this.element.hidden=false;
    this.hint.textContent='Usap abu di kaca dengan jarimu. Coba dua atau tiga usapan lebar.';
    this.position();this.button.focus({preventScroll:true});this.announce(this.hint.textContent+' Dengan keyboard, tekan Enter.');
  }
  wipe(p) {
    const ctx=this.ashContext,w=this.ash.width,h=this.ash.height,r=w*.082;
    const x=p.x*w,y=p.y*h;
    const brush=ctx.createRadialGradient(x,y,r*.62,x,y,r);
    brush.addColorStop(0,'#000');brush.addColorStop(1,'#00000000');
    ctx.save();ctx.globalCompositeOperation='destination-out';ctx.fillStyle=brush;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore();
    for(const cell of this.cells) if(Math.hypot((cell.x-p.x)*w,(cell.y-p.y)*h)<r*.75)cell.clear=true;
    this.coverage=this.cells.filter(c=>c.clear).length/this.cells.length;
    this.canvas.dataset.coverage=this.coverage.toFixed(3);
    if(this.coverage>=.34 && !this.busy) {
      this.release();this.busy=true;this.clearing=0;this.keyboard=false;
      this.hint.textContent='Abunya luruh. Kacanya memperlihatkan sesuatu yang berbeda.';
      this.announce('Abu di kaca luruh. Pantulan Natasha terlihat seperti putri, dan ia terkejut melihatnya.');
    }
  }
  press(e) {
    const p=this.source(e.clientX,e.clientY);
    if(!this.active || this.busy || e.button>0 || !p || !this.glass(p.x,p.y))return;
    e.preventDefault();this.pointer={id:e.pointerId,...p};this.element.setPointerCapture(e.pointerId);this.wipe(p);
  }
  move(e) {
    if(!this.pointer || e.pointerId!==this.pointer.id || this.busy)return;
    const p=this.source(e.clientX,e.clientY);if(!p || !this.glass(p.x,p.y)){this.release();return;}
    const before={...this.pointer},steps=Math.max(1,Math.ceil(Math.hypot((p.x-before.x)*384,(p.y-before.y)*576)/10));
    this.pointer.x=p.x;this.pointer.y=p.y;
    for(let i=1;i<=steps && !this.busy;i++)this.wipe({x:before.x+(p.x-before.x)*i/steps,y:before.y+(p.y-before.y)*i/steps});
  }
  release() {
    const p=this.pointer;this.pointer=null;
    if(p && this.element.hasPointerCapture(p.id))this.element.releasePointerCapture(p.id);
  }
  update(time,shown) {
    const ctx=this.ctx;ctx.clearRect(0,0,this.width,this.height);
    const dt=document.hidden?0:Math.min(.08,this.lastTime?(time-this.lastTime)/1000:0);this.lastTime=time;
    if(this.active) {
      this.position();
      if(this.keyboard && !this.busy) {
        this.keyboardAge=(this.keyboardAge||0)+dt;
        const t=this.keyboardAge/(this.reducedMotion ? .65 : 3.2);
        this.wipe({x:.50+Math.sin(t*Math.PI*6)*.14,y:.22+clamp(t)*.46});
      }
      if(this.busy) {
        this.clearing+=dt;
        this.reveal=smooth(this.clearing/(this.reducedMotion ? .35 : 2.6));
        if(this.clearing>(this.reducedMotion ? .45 : 3.6)){this.hide();this.onComplete();}
      } else this.reveal=this.coverage*.65;
    }
    this.canvas.dataset.reveal=this.reveal.toFixed(3);
    if(!this.loaded || !shown || this.reveal===1)return;
    const f=this.realm.frame;if(!f)return;
    ctx.globalAlpha=this.busy?smooth(1-this.reveal):1;
    ctx.drawImage(this.ash,f.left,f.top,f.width,f.height);ctx.globalAlpha=1;
  }
  hide(){this.release();this.active=false;this.keyboard=false;this.cue.hide();this.element.hidden=true;}
  reset(){this.hide();this.reveal=0;this.coverage=0;this.busy=false;this.keyboardAge=0;this.clearing=0;this.lastTime=0;this.prepareAsh();this.canvas.dataset.reveal='0.000';this.canvas.dataset.coverage='0.000';}
}
