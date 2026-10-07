// Animate materials in the original painting. Every field is in source-image
// coordinates, so fire, reflections and fabric follow the art as the camera moves.
const VERTEX = `
attribute vec2 aPoint;
varying vec2 vUV;
void main() {
  vUV = aPoint;
  gl_Position = vec4(aPoint.x * 2.0 - 1.0, 1.0 - aPoint.y * 2.0, 0.0, 1.0);
}`;
const FRAGMENT = `
precision mediump float;
uniform sampler2D uArt;
uniform sampler2D uVeil;
uniform float uVeilReady;
uniform float uVeilReveal;
uniform vec2 uImage;
uniform vec2 uViewport;
uniform vec4 uFrame;
uniform float uTime;
uniform float uMode;
uniform float uMotion;
uniform float uWind;
uniform vec3 uTouch;
uniform vec4 uGuide;
uniform vec4 uRipples[3];
uniform vec4 uBlooms[3];
uniform vec3 uBlessing;
varying vec2 vUV;
float field(vec2 p, vec2 center, vec2 radius) {
  vec2 q = (p - center) / radius;
  return exp(-dot(q, q) * 2.0);
}
float noise(vec2 p) {
  return sin(p.x * 18.0 + sin(p.y * 9.0)) * sin(p.y * 13.0 - p.x * 7.0);
}
float easing(float p) { p=clamp(p,0.0,1.0);return p*p*(3.0-2.0*p); }
vec4 vapor(vec2 p) {
  if(p.x<0.0 || p.x>1.0 || p.y<0.0 || p.y>1.0)return vec4(0.0);
  return texture2D(uVeil,p);
}
void main() {
  vec2 uv = (vUV * uViewport - uFrame.xy) / uFrame.zw;
  if (uMode > 4.5 && (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0)) discard;
  vec4 original = texture2D(uArt, uv);
  vec2 drift = vec2(0.0);
  float glow = 0.0;
  float t = uTime;
  float heat = smoothstep(.12, .42, original.r - original.b)
    * smoothstep(.07, .23, original.r - original.g);
  if (uMode > 4.5) {
    // The princess remains part of the unbroken reflection. Only lava outside
    // the mirror and light caught in its edge respond to the atmosphere.
    float outside = max(1.0 - smoothstep(.18,.24,uv.x),smoothstep(.77,.84,uv.x));
    float fire = outside * heat;
    drift.y += fire * sin(uv.y * 123.0 - t * 3.2) * 2.1 / uImage.y;
    drift.x += fire * sin(uv.y * 87.0 + t * 2.6) * 1.3 / uImage.x;
    glow += fire * (.015 + .025 * sin(t * 2.3 + uv.y * 37.0));
  } else if (uMode < .5) {
    // The stone and trunks stay fixed; only the painted leaves and vines sway.
    float canopy = (1.0 - smoothstep(.29, .38, uv.x) + smoothstep(.66, .75, uv.x))
      * (1.0 - smoothstep(.52, .76, uv.y));
    float green = smoothstep(-.04, .015, original.g - original.r);
    float foliage = canopy * green;
    drift.x += foliage * (sin(t * 1.2 + uv.y * 53.0) * 2.6
      + sin(t * .47 + uv.x * 32.0) * 1.9 + uWind * 3.4) / uImage.x;
    drift.y += foliage * sin(t * .8 + uv.x * 63.0) * 1.4 / uImage.y;
    float clouds = (1.0 - smoothstep(.25, .55, uv.y)) * canopy;
    drift.x += clouds * sin(t * .24 + uv.y * 14.0) * 3.5 / uImage.x;
  } else if (uMode < 1.5) {
    float sky = (1.0 - smoothstep(.29, .51, uv.y)) * heat;
    drift.x += sky * (sin(t * .33 + uv.y * 17.0) * 6.0
      + noise(uv * 5.0 + vec2(t * .015, 0.0)) * 2.5) / uImage.x;
    drift.y += sky * sin(t * .27 + uv.x * 24.0) * 2.0 / uImage.y;
    float fire = heat * smoothstep(.39, .9, original.r) * smoothstep(.34, .48, uv.y);
    drift.x += fire * sin(t * 4.3 + uv.y * 154.0 + uv.x * 47.0) * 2.8 / uImage.x;
    drift.y += fire * sin(t * 3.1 + uv.x * 135.0 - uv.y * 70.0) * 3.6 / uImage.y;
    float lava = heat * smoothstep(.56, .73, uv.y);
    drift.x += lava * sin(uv.y * 142.0 - t * 2.7 + uv.x * 33.0) * 3.4 / uImage.x;
    drift.y += lava * sin(uv.x * 97.0 + t * 2.1) * 2.3 / uImage.y;
    glow += heat * (.038 + .048 * sin(t * 3.7 + uv.x * 43.0 - uv.y * 71.0));

    float mirror = field(uv, vec2(.105,.315), vec2(.037,.19))
      + field(uv, vec2(.244,.425), vec2(.032,.17));
    float silver = 1.0 - smoothstep(.035, .13, abs(original.r - original.g));
    drift.x += mirror * silver * sin(t * .8 + uv.y * 25.0) * 4.0 / uImage.x;
    glow += mirror * silver * max(0.0, sin(uv.x * 57.0 - uv.y * 17.0 + t * .9)) * .095;

    float pan = field(uv, vec2(.468,.23), vec2(.042,.13))
      - field(uv, vec2(.611,.365), vec2(.038,.14));
    drift.y += pan * sin(t * .9) * 2.6 / uImage.y;
    float fabric = field(uv, vec2(.929,.56), vec2(.061,.21)) * heat;
    drift.x += fabric * sin(uv.y * 32.0 - t * 2.8) * (4.0 + uWind * 2.0) / uImage.x;
    drift.y += fabric * sin(uv.x * 29.0 + t * 1.4) * 2.3 / uImage.y;
  } else {
    float green = smoothstep(.012, .10, original.g - original.r)
      * smoothstep(.01, .09, original.g - original.b);
    float canopy = 1.0 - smoothstep(.42, .69, uv.y);
    float beds = smoothstep(.57, .75, uv.y)
      * (1.0 - smoothstep(.20, .29, uv.x) + smoothstep(.79, .87, uv.x));
    float leaves = green * max(canopy, beds);
    drift.x += leaves * (sin(t * 1.25 + uv.y * 51.0) * 3.7
      + sin(t * .57 + uv.x * 67.0) * 1.8 + uWind * 4.5) / uImage.x;
    drift.y += leaves * sin(t * 1.0 + uv.x * 83.0) * 1.6 / uImage.y;

    float wet = smoothstep(.005, .10, original.b - original.r)
      * smoothstep(-.01, .08, original.g - original.r);
    float pond = wet * smoothstep(.73, .79, uv.y)
      * smoothstep(.39, .43, uv.x) * (1.0 - smoothstep(.90, .95, uv.x));
    if (uMode > 3.5) {
      float sidePool = smoothstep(.56,.61,uv.y) * (1.0 - smoothstep(.71,.76,uv.y))
        * max(1.0 - smoothstep(.26,.35,uv.x),smoothstep(.65,.74,uv.x));
      pond = wet * max(sidePool,field(uv,vec2(.50,.943),vec2(.071,.025)));
    }
    drift.x += pond * sin(uv.y * 183.0 - t * 1.8 + uv.x * 37.0) * 4.2 / uImage.x;
    drift.y += pond * sin(uv.x * 197.0 + t * 2.3) * 2.3 / uImage.y;
    glow += pond * max(0.0, sin(uv.x * 131.0 + uv.y * 237.0 - t * 1.4)) * .042;

    float falls = uMode > 3.5 ?
      field(uv,vec2(.08,.56),vec2(.065,.12)) + field(uv,vec2(.20,.57),vec2(.05,.085))
      + field(uv,vec2(.80,.56),vec2(.06,.09)) + field(uv,vec2(.93,.54),vec2(.075,.11)) : uMode > 2.5 ?
      field(uv,vec2(.493,.47),vec2(.044,.18)) + field(uv,vec2(.564,.83),vec2(.085,.15)) :
      field(uv,vec2(.324,.69),vec2(.042,.07)) + field(uv,vec2(.543,.77),vec2(.045,.05))
      + field(uv,vec2(.608,.75),vec2(.044,.07)) + field(uv,vec2(.816,.78),vec2(.075,.06));
    float whiteWater = falls * smoothstep(.56, .83, dot(original.rgb, vec3(.299,.587,.114)));
    drift.y += whiteWater * sin(uv.y * 173.0 - t * (5.4 + uBlessing.y) + uv.x * 22.0) * 1.5 / uImage.y;
    drift.x += whiteWater * sin(uv.y * 139.0 + t * 3.1) * .55 / uImage.x;

    float petals = max(smoothstep(.06,.22,original.r - original.g) * smoothstep(.40,.68,original.r),
      smoothstep(.68,.91,dot(original.rgb,vec3(.299,.587,.114))) * (1.0 - smoothstep(.06,.17,original.g - original.b)));
    float blossoms = petals * (beds + field(uv,vec2(.449,.40),vec2(.07,.29)));
    drift.x += blossoms * sin(t * 1.4 + uv.y * 53.0) * 2.2 / uImage.x;
    drift.y += blossoms * sin(t * .9 + uv.x * 61.0) * 1.2 / uImage.y;

    for (int i = 0; i < 3; i++) {
      vec4 ripple = uRipples[i];
      vec2 delta = (uv - ripple.xy) * vec2(3.0,3.6);
      float radius = ripple.z * .16;
      float wave = exp(-pow((length(delta) - radius) * 57.0, 2.0)) * ripple.w * pond;
      drift += normalize(delta + vec2(.0001)) * wave * vec2(3.2,2.2) / uImage;
      glow += wave * .19;
      vec4 bloom = uBlooms[i];
      float opening = field(uv,bloom.xy,vec2(bloom.z,bloom.z * 1.8)) * petals * bloom.w;
      drift -= normalize((uv - bloom.xy) + vec2(.0001)) * opening * vec2(1.4,1.4) / uImage;
    }
    float guideWater = field(uv, uGuide.xy, vec2(.021,.044)) * pond;
    glow += guideWater * (.13 + sin(t * 1.8) * .035);
  }
  // Marble remains solid, even where its pale material resembles petals.
  if (uMode > 1.5 && uMode < 2.5 && uv.x > .715 && uv.x < .867 && uv.y < .61) drift = vec2(0.0);
  if (uMode > 3.5 && uMode < 4.5 && uv.x > .315 && uv.x < .69 && uv.y < .73) drift = vec2(0.0);
  vec4 color = texture2D(uArt, uv + drift * uMotion);
  float touch = field(uv, uTouch.xy, vec2(55.0) / uFrame.zw) * uTouch.z;
  float here = field(uv, uGuide.xy, vec2(37.0) / uFrame.zw);
  float ahead = field(uv, uGuide.zw, vec2(29.0) / uFrame.zw);
  float luminance = dot(original.rgb, vec3(.299,.587,.114));
  // Light catches the actual rough edges and cracks, rather than drawing a token.
  float stone = smoothstep(.023, .105, luminance) * (1.0 - smoothstep(.23,.44,luminance));
  float guide = (here * .8 + ahead * (.48 + .12 * sin(t * 2.0))) * stone;
  if (uMode > 4.5) color.rgb += vec3(1.0,.45,.13) * glow * uMotion;
  else if (uMode > 1.5) {
    color.rgb += vec3(.70,.92,.74) * (glow * (uMotion * .8 + .2));
    float greenMaterial = smoothstep(.01,.10,original.g - original.r);
    color.rgb += vec3(.07,.10,.035) * greenMaterial * uBlessing.x;
    color.rgb += vec3(.035,.027,.008) * (uBlessing.y + uBlessing.z * .6);
    if (uMode > 2.5) color.rgb += vec3(.95,.84,.46) * here * .24 * smoothstep(.12,.3,luminance);
    float pink = smoothstep(.06, .22, original.r - original.g) * smoothstep(.40,.68,original.r);
    float white = smoothstep(.68,.91,luminance) * (1.0 - smoothstep(.06,.17,original.g - original.b));
    float petals = max(pink, white);
    for (int i = 0; i < 3; i++) {
      vec4 bloom = uBlooms[i];
      float flower = field(uv, bloom.xy, vec2(bloom.z, bloom.z * 1.8)) * petals;
      color.rgb += vec3(.98,.71,.34) * flower * bloom.w * .32;
    }
  } else color.rgb += vec3(1.0,.45,.13) * (glow * uMotion + touch * .19 * stone + guide * .6);
  if (uMode > 3.5 && uMode < 4.5 && uVeilReady > .5 && uVeilReveal < 1.0) {
    // Advect the painted vapor as a continuous field. The sculpture is never
    // displaced; no strip boundaries or geometric wipe cross its silhouette.
    float v=(uv.y+.13)/.79;
    float opening=easing((uVeilReveal-.10-v*.34)/.43);
    for(int i=0;i<2;i++) {
      float side=float(i)*2.0-1.0;
      float curl=(sin(v*8.0-t*.27+side*.5)+sin(v*17.0+t*.18))*.009*.58*uMotion;
      float outward=side*opening*.58*(.26+.025*sin(v*7.0-t*.3))*uMotion;
      vec2 fogUV=vec2((uv.x-.5-side*.58*.025-curl-outward)/.58+.5,v);
      vec4 fog=vapor(fogUV);fog.a*=(1.0-opening)*.99;
      color.rgb=mix(color.rgb,fog.rgb,fog.a);
    }
    vec2 bankUV=vec2((uv.x-.5)/(.58*1.36)+.5,(uv.y-(.66-.79*.09))/(.79*.18));
    vec4 bank=vapor(bankUV);bank.a*=(1.0-easing((uVeilReveal-.47)/.48))*.75;
    color.rgb=mix(color.rgb,bank.rgb,bank.a);
  }
  if (uMode > 4.5 && uFrame.z < uViewport.x) {
    color.a *= smoothstep(0.0,.13,uv.x) * (1.0 - smoothstep(.87,1.0,uv.x));
  }
  gl_FragColor = color;
}`;

export class LivingPainting {
  constructor(canvas, image, { mode = 0, reducedMotion = false } = {}) {
    Object.assign(this, { canvas, image, mode, reducedMotion });
    this.touch = [-2, -2, 0]; this.guide = [-2, -2, -2, -2];
    this.ripples = []; this.flowers = []; this.flowerCue = -1;
    this.wind = 0; this.targetWind = 0;
    this.blessing = [0, 0, 0];
    try {
      const gl = canvas.getContext('webgl', { alpha: mode === 5, premultipliedAlpha: false, antialias: false });
      if (!gl) {
        if (mode >= 2) { this.fallback = canvas.getContext('2d'); canvas.dataset.renderer = 'water-fallback'; }
        return;
      }
      const compile = (kind, source) => {
        const shader = gl.createShader(kind);
        gl.shaderSource(shader, source); gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
        return shader;
      };
      const program = gl.createProgram();
      gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT)); gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);
      const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0, 1,0, 0,1, 0,1, 1,0, 1,1]), gl.STATIC_DRAW);
      const point = gl.getAttribLocation(program, 'aPoint');
      gl.enableVertexAttribArray(point); gl.vertexAttribPointer(point, 2, gl.FLOAT, false, 0, 0);
      this.uniforms = Object.fromEntries(['uImage', 'uViewport', 'uFrame', 'uTime', 'uMode', 'uMotion', 'uWind', 'uTouch', 'uGuide', 'uBlessing', 'uVeilReady', 'uVeilReveal']
        .map(name => [name, gl.getUniformLocation(program, name)]));
      this.uniforms.uRipples = gl.getUniformLocation(program, 'uRipples[0]');
      this.uniforms.uBlooms = gl.getUniformLocation(program, 'uBlooms[0]');
      this.gl = gl; this.program = program;
      canvas.dataset.renderer = 'materials';
    } catch {
      // The underlying img remains the fallback if shader support is absent.
    }
  }

  load() {
    if (!this.gl) { this.canvas.hidden = !this.fallback; this.loaded = Boolean(this.fallback); return; }
    const gl = this.gl;
    const texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
    gl.uniform2f(this.uniforms.uImage, this.image.naturalWidth, this.image.naturalHeight);
    this.loaded = true; this.image.style.visibility = 'hidden';
  }

  resize(width, height) {
    const box = this.canvas.parentElement.getBoundingClientRect();
    this.width = width || box.width; this.height = height || box.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.4, Math.sqrt(950000 / (this.width * this.height)));
    this.canvas.width = Math.round(this.width * dpr); this.canvas.height = Math.round(this.height * dpr);
    if (this.gl) {
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      this.gl.uniform2f(this.uniforms.uViewport, this.width, this.height);
    } else this.fallback?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  loadVeil(image) {
    if(!this.gl)return;
    const gl=this.gl;
    gl.activeTexture(gl.TEXTURE1);
    const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
    gl.uniform1i(gl.getUniformLocation(this.program,'uVeil'),1);
    gl.activeTexture(gl.TEXTURE0);this.veilReady=true;this.veilReveal=0;
  }

  source(x, y) {
    if (!this.frame) return [-2, -2];
    const { left, top, width, height } = this.frame;
    return [(x - left) / width, (y - top) / height];
  }

  stir(x, y) {
    this.touch = [...this.source(x, y), 1];
    this.touchedAt = performance.now();
  }

  point(x, y, nextX, nextY) {
    this.guide = [...this.source(x, y), ...this.source(nextX, nextY)];
  }

  clearGuide() { this.guide = [-2, -2, -2, -2]; }

  pointSource(x, y) { this.guide = [x, y, -2, -2]; }

  ripple(x, y) {
    this.ripples.push({ x: this.source(x, y)[0], y: this.source(x, y)[1], born: performance.now() });
    if (this.ripples.length > 3) this.ripples.shift();
  }

  setFlowers(flowers) {
    this.flowers = flowers.map(flower => ({ ...flower, charge: 0, lit: false }));
    this.flowerCue = -1;
    if (!this.fallback) return;
    // An in-memory mask catches only the painted pale and pink petals.
    this.flowers.forEach(flower => {
      const w = Math.ceil(flower.radius * this.image.naturalWidth * 2);
      const h = Math.ceil(flower.radius * this.image.naturalHeight * 3.6);
      const mask = document.createElement('canvas'); mask.width = w; mask.height = h;
      const ctx = mask.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(this.image, flower.x * this.image.naturalWidth - w / 2,
        flower.y * this.image.naturalHeight - h / 2, w, h, 0, 0, w, h);
      const pixels = ctx.getImageData(0, 0, w, h);
      for (let i = 0; i < pixels.data.length; i += 4) {
        const [r, g, b] = pixels.data.slice(i, i + 3);
        const petals = Math.max(r > 145 ? Math.min(1, (r - g - 15) / 45) : 0,
          r + g + b > 550 && g - b < 35 ? (r + g + b - 550) / 200 : 0);
        pixels.data[i] = 255; pixels.data[i + 1] = 218; pixels.data[i + 2] = 143;
        pixels.data[i + 3] = Math.max(0, Math.min(1, petals)) * 180;
      }
      ctx.putImageData(pixels, 0, 0); flower.mask = mask;
    });
  }

  chargeFlower(index, charge, lit = false) {
    if (!this.flowers[index]) return;
    this.flowers[index].charge = charge; this.flowers[index].lit = lit || this.flowers[index].lit;
  }

  bloomUniforms(time) {
    return new Float32Array(Array.from({ length: 3 }, (_, index) => {
      const flower = this.flowers[index];
      if (!flower) return [-2, -2, .01, 0];
      const cue = index === this.flowerCue ? .3 + (this.reducedMotion ? 0 : Math.sin(time / 800) * .07) : .07;
      return [flower.x, flower.y, flower.radius, flower.lit ? 1 : cue + flower.charge * .9];
    }).flat());
  }

  drawFallback(time, frame) {
    const ctx = this.fallback;
    ctx.clearRect(0, 0, this.width, this.height);
    for (const ripple of this.ripples) {
      const age = (time - ripple.born) / 1000, strength = Math.max(0, 1 - age / 2.6);
      const radius = (this.reducedMotion ? .06 : age * .16) * frame.width / 3;
      ctx.strokeStyle = 'rgba(235,255,235,' + strength * .38 + ')'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(frame.left + ripple.x * frame.width,
        frame.top + ripple.y * frame.height, Math.max(.1, radius), Math.max(.1, radius / 3.6), 0, 0, Math.PI * 2); ctx.stroke();
    }
    const values = this.bloomUniforms(time);
    this.flowers.forEach((flower, index) => {
      ctx.globalAlpha = values[index * 4 + 3] * .55;
      const w = flower.radius * frame.width * 2, h = flower.radius * frame.height * 3.6;
      ctx.drawImage(flower.mask, frame.left + flower.x * frame.width - w / 2,
        frame.top + flower.y * frame.height - h / 2, w, h);
    });
    ctx.globalAlpha = 1;
  }

  draw(time, frame) {
    this.frame = frame;
    if (!this.loaded) return;
    this.ripples = this.ripples.filter(ripple => time - ripple.born < 2600);
    if (this.fallback) { this.drawFallback(time, frame); return; }
    const gl = this.gl, u = this.uniforms;
    if (this.mode === 5) gl.clear(gl.COLOR_BUFFER_BIT);
    this.wind += (this.targetWind - this.wind) * .05;
    this.touch[2] = Math.max(0, 1 - (time - (this.touchedAt || -10000)) / 1200);
    gl.uniform4f(u.uFrame, frame.left, frame.top, frame.width, frame.height);
    gl.uniform1f(u.uTime, this.reducedMotion ? 0 : time / 1000);
    gl.uniform1f(u.uMode, this.mode); gl.uniform1f(u.uMotion, this.reducedMotion ? 0 : 1);
    gl.uniform1f(u.uVeilReady,this.veilReady?1:0);gl.uniform1f(u.uVeilReveal,this.veilReveal||0);
    gl.uniform1f(u.uWind, this.wind); gl.uniform3fv(u.uTouch, this.touch); gl.uniform4fv(u.uGuide, this.guide);
    gl.uniform3fv(u.uBlessing, this.blessing);
    gl.uniform4fv(u.uRipples, new Float32Array(Array.from({ length: 3 }, (_, index) => {
      const ripple = this.ripples[index];
      if (!ripple) return [-2, -2, 0, 0];
      const age = (time - ripple.born) / 1000;
      return [ripple.x, ripple.y, this.reducedMotion ? .35 : age, Math.max(0, 1 - age / 2.6)];
    }).flat()));
    gl.uniform4fv(u.uBlooms, this.bloomUniforms(time));
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}
