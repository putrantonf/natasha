import { monumentLayout, monumentWords } from '../scenes/sanctum.js';
import { ActionCue } from './action-cue.js';

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = v => { const p = clamp(v); return p * p * (3 - 2 * p); };
const TAU = Math.PI * 2;
function smoothRoute(points) {
  const samples = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[Math.max(0, i - 1)], b = points[i], c = points[i + 1], d = points[Math.min(points.length - 1, i + 2)];
    for (let j = 0; j < 12; j++) {
      const t = j / 12;
      samples.push([0, 1].map(k => .5 * (2 * b[k] + (-a[k] + c[k]) * t +
        (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t * t +
        (-a[k] + 3 * b[k] - 3 * c[k] + d[k]) * t * t * t)));
    }
  }
  return [...samples, points.at(-1)];
}

// The same renderer handles the garden's material response, the physical spring
// ritual and the mist around a painted monument. Semantic controls provide keyboard access.
export class Sanctum {
  constructor({ canvas, element, surfaces, hint, inscription, realm, painting,
    reducedMotion, announce, onChannel, onAwakening, onComplete }) {
    Object.assign(this, { canvas, element, surfaces, hint, inscription, realm, painting,
      reducedMotion, announce, onChannel, onAwakening, onComplete });
    this.ctx = canvas.getContext('2d');
    this.cue = new ActionCue(element);
    this.waterCanvas = document.createElement('canvas');this.waterContext = this.waterCanvas.getContext('2d');
    this.fogCanvas = document.createElement('canvas');this.fogContext = this.fogCanvas.getContext('2d');
    this.veil = new Image(); this.veil.src = './assets/sanctum-mist.png';
    this.channels = monumentLayout.channels.map(points => ({ points: smoothRoute(points), progress: 0, complete: false }));
    this.inscription.textContent = monumentWords.join('\n');
    this.reset(); this.resize();
    element.addEventListener('pointerdown', e => this.press(e));
    element.addEventListener('pointermove', e => this.move(e));
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) element.addEventListener(type, () => this.release());
  }

  async load() {
    await Promise.all([this.veil.decode(), this.realm.image.decode()]);
    // Light is restricted to actual blue water pixels in the painted grooves.
    this.waterMask=document.createElement('canvas');
    this.waterMask.width=this.realm.image.naturalWidth;this.waterMask.height=this.realm.image.naturalHeight;
    const mask=this.waterMask.getContext('2d',{willReadFrequently:true});mask.drawImage(this.realm.image,0,0);
    const pixels=mask.getImageData(0,0,this.waterMask.width,this.waterMask.height);
    for(let i=0;i<pixels.data.length;i+=4) {
      const r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2];
      pixels.data[i+3]=g-r>12 && b-r>-8 ? 255 : 0;
    }
    mask.putImageData(pixels,0,0);
    this.painting.setFlowers(this.channels.map(channel => ({ x: channel.points.at(-1)[0], y: .755, radius: .027 })));
    this.loaded = true;
  }

  resize() {
    const box = this.canvas.getBoundingClientRect(); this.width = box.width; this.height = box.height;
    const dpr = Math.min(1.5, devicePixelRatio || 1);
    this.canvas.width = Math.round(this.width * dpr); this.canvas.height = Math.round(this.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.waterCanvas.width=this.canvas.width;this.waterCanvas.height=this.canvas.height;
    this.waterContext.setTransform(dpr,0,0,dpr,0,0);
    this.fogCanvas.width=this.canvas.width;this.fogCanvas.height=this.canvas.height;this.fogContext.setTransform(dpr,0,0,dpr,0,0);
    this.position();
  }

  start() {
    this.active = true; this.element.hidden = false;
    this.hint.textContent = 'Sentuh mata air yang berkilau. Ikuti alur batu sampai ke bunga, lalu kembali untuk alur berikutnya.';
    this.buttons = this.channels.map((channel, i) => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'spring-channel';
      button.dataset.channel = String(i); button.dataset.route = JSON.stringify(channel.points);
      button.setAttribute('aria-label', 'Alirkan air ke bunga ' + (i + 1) + '. Dengan keyboard, tekan Enter.');
      button.addEventListener('keydown', e => {
        if (!['Enter', ' '].includes(e.key)) return; e.preventDefault(); e.stopPropagation();
        if (!e.repeat) this.keyboard(i);
      });
      button.addEventListener('click', e => { if (e.detail === 0) this.keyboard(i); });
      return button;
    });
    this.surfaces.replaceChildren(...this.buttons); this.position(); this.buttons[0].focus({ preventScroll: true });
    this.announce(this.hint.textContent + ' Dengan keyboard: Tab dan Enter untuk setiap alur.');
  }

  pointAt(channel, fraction) {
    const points = channel.points.map(([x,y]) => this.realm.project(x,y));
    const lengths = points.slice(1).map((p,i) => Math.hypot(p.x-points[i].x, p.y-points[i].y));
    let remaining = clamp(fraction) * lengths.reduce((a,b) => a+b, 0);
    for (let i = 0; i < lengths.length; i++) {
      if (remaining <= lengths[i] || i === lengths.length - 1) {
        const p = remaining / lengths[i];
        return { x: points[i].x + (points[i+1].x-points[i].x)*p,
          y: points[i].y + (points[i+1].y-points[i].y)*p };
      }
      remaining -= lengths[i];
    }
  }

  nearest(channel, x, y) {
    const points = channel.points.map(([sx,sy]) => this.realm.project(sx,sy));
    const lengths = points.slice(1).map((p,i) => Math.hypot(p.x-points[i].x,p.y-points[i].y));
    const total = lengths.reduce((a,b) => a+b,0);
    let best = { distance: Infinity, progress: 0 }, travelled = 0;
    for (let i=0; i<lengths.length; i++) {
      const a=points[i], b=points[i+1], dx=b.x-a.x, dy=b.y-a.y;
      const p=clamp(((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy));
      const distance=Math.hypot(x-a.x-dx*p,y-a.y-dy*p);
      if (distance < best.distance) best={distance, progress:(travelled+p*lengths[i])/total};
      travelled += lengths[i];
    }
    return best;
  }

  press(e) {
    if (!this.active || this.auto || e.button > 0 || this.hold) return;
    const candidates = this.channels.map((c,i) => ({ c,i, p:this.pointAt(c,c.progress) }))
      .filter(({c,p}) => !c.complete && Math.hypot(e.clientX-p.x,e.clientY-p.y) < 44);
    if (!candidates.length) return;
    e.preventDefault(); this.hold={id:e.pointerId, channel:candidates.length===1 ? candidates[0].i : null};
    this.element.setPointerCapture(e.pointerId);
    this.painting.ripple(e.clientX,e.clientY);
  }

  move(e) {
    if (!this.hold || e.pointerId !== this.hold.id) return;
    if (this.hold.channel === null) {
      const choices=this.channels.map((c,i) => ({c,i,...this.nearest(c,e.clientX,e.clientY)}))
        .filter(c => !c.c.complete && c.progress < .3 && c.distance < 32)
        .sort((a,b) => a.distance-b.distance);
      if (choices[0]?.progress > .035) this.hold.channel=choices[0].i;
      else return;
    }
    const i=this.hold.channel, channel=this.channels[i], near=this.nearest(channel,e.clientX,e.clientY);
    if (near.distance > 42 || near.progress > channel.progress + .20) return;
    channel.progress=Math.max(channel.progress,near.progress);
    if (channel.progress > .95) this.finishChannel(i);
  }

  release() {
    const hold=this.hold; this.hold=null;
    if (hold && this.element.hasPointerCapture(hold.id)) this.element.releasePointerCapture(hold.id);
  }

  keyboard(i) {
    if (!this.active || this.channels[i].complete || this.auto) return;
    this.release(); this.auto=i+1;
  }

  finishChannel(i) {
    const channel=this.channels[i]; if (channel.complete) return;
    channel.progress=1; channel.complete=true; this.auto=0; this.release();
    const count=this.channels.filter(c=>c.complete).length;
    this.buttons[i].disabled=true; this.onChannel?.(i);
    this.painting.chargeFlower(i, 1, true);
    this.canvas.dataset.channels=String(count); this.element.dataset.channels=String(count);
    const next=this.channels.findIndex(c=>!c.complete);
    if (next !== -1) {
      this.hint.textContent='Airnya sudah sampai; kelopaknya menangkap cahaya. Kembali ke mata air untuk alur berikutnya.';
      this.buttons[next].focus({preventScroll:true}); this.announce(this.hint.textContent);
    } else {
      this.active=false; this.hint.textContent='Aliran air berubah. Kabut di tengah taman mulai bergerak…';
      this.revealing=true; this.age=0; this.onAwakening();
      this.announce('Air sampai ke tiga bunga. Kabut perlahan membuka pandangan ke patung Natasha yang megah di tengah taman.');
    }
  }

  position() {
    if (!this.realm.frame || !this.buttons) return;
    this.buttons.forEach((button,i) => {
      const p=this.pointAt(this.channels[i],0);
      Object.assign(button.style,{left:p.x+'px',top:p.y+'px',width:'60px',height:'60px'});
    });
    const next=this.hold?.channel !== null && this.hold?.channel !== undefined ? this.channels[this.hold.channel] : this.channels.find(c=>!c.complete);
    if(this.active&&next)this.cue.show(next.progress>.02 ? 'LANJUTKAN ALIRANNYA' : 'USAP AIR DARI SINI',this.pointAt(next,next.progress));
    else this.cue.hide();
  }

  update(time) {
    this.painting.veilReveal=this.reveal;
    const dt=document.hidden ? 0 : Math.min(.08,this.lastTime ? (time-this.lastTime)/1000 : 0); this.lastTime=time;
    if (this.active) {
      this.position();
      if (this.auto) {
        const i=this.auto-1, c=this.channels[i];
        c.progress=clamp(c.progress+dt/(this.reducedMotion ? .32 : 1.7));
        if (c.progress===1) this.finishChannel(i);
      }
    }
    if (this.revealing) {
      this.age += dt;
      const duration=this.reducedMotion ? 2 : 13;
      this.reveal=clamp(this.age/duration);
      this.canvas.dataset.reveal=this.reveal.toFixed(3);
      if (this.reveal===1) {
        this.revealing=false; this.awake=true; this.canvas.dataset.awake='true';
        this.inscription.hidden=false; this.onComplete();
      }
    }
  }

  drawChannels(time) {
    const ctx=this.waterContext;ctx.clearRect(0,0,this.width,this.height);
    this.channels.forEach((channel,i) => {
      const progress=channel.progress;
      if (progress > 0) {
        const points=Array.from({length:40},(_,j)=>this.pointAt(channel,progress*j/39));
        ctx.save(); ctx.lineCap='round'; ctx.lineJoin='round';
        ctx.beginPath(); points.forEach((p,j)=>j ? ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
        ctx.strokeStyle='#175f6477'; ctx.lineWidth=Math.max(5,this.realm.frame.width*.007); ctx.stroke();
        ctx.strokeStyle='#9dfff2b0'; ctx.lineWidth=Math.max(2,this.realm.frame.width*.0026); ctx.stroke();
        for (let j=0;j<5;j++) {
          const phase=(time*.00018+j*.2)%1;
          if (phase>progress) continue;
          const p=this.pointAt(channel,phase);
          ctx.globalAlpha=.55; ctx.fillStyle='#f6ffff';
          ctx.beginPath(); ctx.ellipse(p.x,p.y,3,1.5,0,0,TAU);ctx.fill();
        }
        ctx.restore();
      }
    });
    if (this.active) {
      const next=this.channels.find(c=>!c.complete), p=this.pointAt(next,next.progress);
      const glow=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,27);
      glow.addColorStop(0,'#faffc85c'); glow.addColorStop(1,'#fff4b000');
      ctx.fillStyle=glow;ctx.fillRect(p.x-27,p.y-27,54,54);
    }
    const f=this.realm.frame;
    ctx.save();ctx.globalCompositeOperation='destination-in';
    ctx.drawImage(this.waterMask,f.left,f.top,f.width,f.height);ctx.restore();
    this.ctx.drawImage(this.waterCanvas,0,0,this.width,this.height);
  }

  drawMist(time) {
    this.painting.veilReveal=this.reveal;
    this.canvas.dataset.mist=(1-smooth((this.reveal-.10)/.77)).toFixed(3);
    if(this.reveal===1 || this.painting.gl && this.painting.veilReady)return;
    const ctx=this.fogContext,f=this.realm.frame,base=this.realm.project(.5,.66);
    const width=f.width*.58,height=f.height*.79,t=this.reducedMotion ? 0 : time/1000;
    ctx.clearRect(0,0,this.width,this.height);
    const part=this.reducedMotion ? 0 : smooth((this.reveal-.24)/.55);
    for(const side of [-1,1]) {
      ctx.globalAlpha=.99;
      const x=base.x-width/2+side*(width*.025+part*width*.26)+Math.sin(t*.27+side)*width*.006;
      ctx.drawImage(this.veil,x,base.y-height,width,height);
    }
    const mask=ctx.createLinearGradient(0,base.y-height,0,base.y);
    for(let j=0;j<=16;j++) {
      const v=j/16,density=1-smooth((this.reveal-.10-v*.34)/.43);
      mask.addColorStop(v,'rgba(0,0,0,'+density+')');
    }
    ctx.save();ctx.globalCompositeOperation='destination-in';ctx.fillStyle=mask;
    ctx.fillRect(0,0,this.width,this.height);ctx.restore();
    const bank=1-smooth((this.reveal-.47)/.48);
    ctx.globalAlpha=bank*.75;
    ctx.drawImage(this.veil,base.x-width*.68,base.y-height*.09,width*1.36,height*.18);
    ctx.globalAlpha=1;this.ctx.drawImage(this.fogCanvas,0,0,this.width,this.height);
  }

  drawSculpture(time) {
    this.drawMist(time);
    if(!this.reveal)return;
    const ctx=this.ctx, frame=this.realm.frame, layout=monumentLayout;
    const revealText=this.reducedMotion ? clamp(this.reveal*1.6) : clamp((this.reveal-.70)/.27);
    monumentWords.forEach((word,i) => {
      const show=clamp(revealText*3-i); if(!show)return;
      const p=this.realm.project(layout.plaque.x,layout.plaque.rows[i]),max=frame.width*layout.plaque.width;
      let font=frame.height*(i===0 ? .019 : i===1 ? .016 : .015);
      ctx.font=font+'px Georgia, serif';font*=Math.min(1,max/ctx.measureText(word).width);
      ctx.font=font+'px Georgia, serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.globalAlpha=show;
      ctx.fillStyle='#fff5d8';ctx.fillText(word,p.x+.6,p.y+.7,max);
      ctx.fillStyle='#775325';ctx.fillText(word,p.x,p.y,max);ctx.globalAlpha=1;
    });
    this.canvas.dataset.engraving=revealText===1 ? 'complete':'revealing';
    if(this.reveal>.65 && !this.reducedMotion) {
      // Small insects drift between flowers and stone, rather than orbiting a UI.
      for(let i=0;i<5;i++) {
        const p=this.realm.project(.5+Math.sin(time*.00014+i*2.17)*.13,
          .44+Math.sin(time*.00023+i*1.31)*.14);
        const wing=.3+Math.abs(Math.sin(time*.008+i))*.7;
        ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.sin(time*.0008+i)*.3);
        ctx.fillStyle=i%2 ? '#f0d1e4':'#fff5d7';ctx.globalAlpha=.65*smooth((this.reveal-.65)/.3);
        for(const side of [-1,1]){ctx.beginPath();ctx.ellipse(side*3.5*wing,0,4*wing,2.4,side*.5,0,TAU);ctx.fill();}
        ctx.restore();
      }
    }
  }

  draw(time) {
    this.ctx.clearRect(0,0,this.width,this.height);
    if (!this.loaded || !this.realm.frame) return;
    this.drawChannels(time); this.drawSculpture(time);
  }

  hide() { this.release(); this.active=false; this.auto=0; this.cue.hide(); this.element.hidden=true; }
  reset() {
    this.hide(); this.buttons=null; this.age=0; this.reveal=0;this.revealing=false;this.awake=false;this.lastTime=0;
    this.channels.forEach(c=>{c.progress=0;c.complete=false;});this.surfaces.replaceChildren();
    this.canvas.dataset.channels='0';this.canvas.dataset.reveal='0.000';this.canvas.dataset.awake='false';
    this.canvas.dataset.engraving='hidden';this.canvas.dataset.mist='1.000';this.inscription.hidden=true;this.element.dataset.channels='0';
    this.painting.flowers.forEach(f=>{f.charge=0;f.lit=false;});
    this.painting.clearGuide();this.painting.veilReveal=0;
    this.ctx?.clearRect(0,0,this.width||0,this.height||0);
  }
}
