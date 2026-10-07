const VERTEX = `
attribute vec2 aUV;
uniform vec2 uImage;
uniform vec2 uViewport;
uniform vec2 uOrigin;
uniform vec2 uLook;
uniform vec4 uPose;
uniform float uScale;
uniform float uTime;
uniform float uMotion;
uniform float uSpeaking;
uniform float uNod;
uniform float uZoom;
uniform float uWind;
varying vec2 vUV;
vec2 turn(vec2 p, vec2 anchor, float angle) {
  float c=cos(angle),s=sin(angle); vec2 q=p-anchor;
  return anchor+vec2(q.x*c-q.y*s,q.x*s+q.y*c);
}
void main() {
  vUV=aUV;
  vec2 p=aUV*uImage;
  float head=1.0-smoothstep(535.0,880.0,p.y);
  float angle=uPose.x+uMotion*(uLook.x*.022+sin(uTime*1.6)*.007*uSpeaking+uNod*.025);
  p=turn(p,vec2(558.0,714.0),angle*head);
  p.y+=head*(uPose.y-uNod*6.0*uMotion+uLook.y*5.0*uMotion);
  float chest=exp(-pow((p.y-850.0)/360.0,2.0));
  float breath=sin(uTime*1.05)*uMotion;
  p.x+=(p.x-520.0)*chest*breath*.006;
  p.x+=chest*uPose.z*.55;
  p.y-=chest*(breath*4.0+uPose.z);
  float hand=exp(-dot((p-vec2(790.0,868.0))/vec2(140.0,130.0),(p-vec2(790.0,868.0))/vec2(140.0,130.0)));
  vec2 wrist=turn(p,vec2(727.0,1007.0),uPose.w*.0018*hand);
  p=mix(p,wrist,hand);
  p.y+=hand*(uPose.w+sin(uTime*1.8)*3.0*uSpeaking*uMotion);
  vec2 hairLeft=(p-vec2(411.0,668.0))/vec2(84.0,171.0);
  vec2 hairRight=(p-vec2(660.0,739.0))/vec2(66.0,183.0);
  float hair=exp(-dot(hairLeft,hairLeft))+exp(-dot(hairRight,hairRight));
  p.x+=sin(uTime*1.7+p.y*.015)*hair*5.8*uMotion*(1.0+uWind*.35);
  float cloth=smoothstep(780.0,1350.0,p.y);
  float edge=smoothstep(130.0,360.0,abs(p.x-520.0));
  p.x+=sin(uTime*1.45+p.y*.014)*cloth*(2.0+edge*11.0)*uMotion*(1.0+uWind*.5);
  p.y+=sin(uTime*1.1+p.x*.015)*cloth*2.0*uMotion;
  vec2 screen=uOrigin+vec2((p.x-uImage.x*.5)*uScale*uZoom,(p.y-uImage.y)*uScale*uZoom);
  gl_Position=vec4(screen.x/uViewport.x*2.0-1.0,1.0-screen.y/uViewport.y*2.0,0.0,1.0);
}`;

const FRAGMENT = `
precision highp float;
uniform sampler2D uPortrait;
uniform sampler2D uBlink;
uniform sampler2D uSurprise;
uniform sampler2D uDivine;
uniform float uForm;
uniform float uBlinkWeight;
uniform float uSurpriseWeight;
uniform float uWarmth;
uniform float uTime;
uniform float uMotion;
uniform vec2 uLook;
uniform vec2 uImage;
varying vec2 vUV;
vec4 over(vec4 base, vec4 detail, float weight) {
  float alpha=detail.a*weight;
  return vec4(mix(base.rgb,detail.rgb,alpha),alpha+base.a*(1.0-alpha));
}
void main() {
  vec2 face=vUV*uImage;
  vec2 eyeA=(face-vec2(539.55,450.72))/vec2(14.0,7.0);
  vec2 eyeB=(face-vec2(624.94,471.0))/vec2(13.0,7.0);
  float eyes=exp(-dot(eyeA,eyeA)*2.0)+exp(-dot(eyeB,eyeB)*2.0);
  vec2 gaze=uLook*vec2(2.3,1.1)*eyes*uMotion/uImage;
  vec4 color=texture2D(uPortrait,vUV-gaze);
  color=over(color,texture2D(uSurprise,vUV),uSurpriseWeight);
  color=over(color,texture2D(uBlink,vUV),uBlinkWeight);
  // Align the entire new illustration to the master; never move only a face.
  vec2 divineUV=vUV+vec2(.005,-.044);
  vec4 divine=texture2D(uDivine,divineUV);
  if(divineUV.x<0.0||divineUV.x>1.0||divineUV.y<0.0||divineUV.y>1.0)divine=vec4(0.0);
  float blend=smoothstep(.39,.61,uForm);
  float alpha=mix(color.a,divine.a,blend);
  // Straight-alpha interpolation avoids dark fringes across either silhouette.
  vec3 pigment=mix(color.rgb*color.a,divine.rgb*divine.a,blend)/max(alpha,.0001);
  float radiance=pow(max(0.0,sin(uForm*3.141593)),3.0);
  vec2 heart=(vUV-vec2(.57,.51))/vec2(.51,.65);
  pigment+=vec3(1.0,.77,.36)*radiance*exp(-dot(heart,heart)*.7)*.84;
  color=vec4(pigment,alpha);
  float fire=.5+.23*sin(uTime*2.7)+.12*sin(uTime*6.1);
  float side=smoothstep(.35,.98,vUV.x);
  float bounce=uWarmth*(.025+fire*.10*uMotion)*side;
  color.rgb*=vec3(1.0+bounce,1.0+bounce*.33,1.0-bounce*.25);
  gl_FragColor=color;
}`;

export class PortraitMesh {
  constructor(canvas) {
    this.gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
    if (!this.gl) return;
    const gl = this.gl;
    const compile = (kind, source) => {
      const shader = gl.createShader(kind); gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
      return shader;
    };
    this.program = gl.createProgram();
    gl.attachShader(this.program, compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(this.program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(this.program));
    gl.useProgram(this.program);
    const columns = 36, rows = 54, vertices = [], indices = [];
    for (let y = 0; y <= rows; y++) for (let x = 0; x <= columns; x++) vertices.push(x / columns, y / rows);
    for (let y = 0; y < rows; y++) for (let x = 0; x < columns; x++) {
      const a = y * (columns + 1) + x, b = a + 1, c = a + columns + 1, d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
    this.count = indices.length;
    const vertexBuffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    const attribute = gl.getAttribLocation(this.program, 'aUV');
    gl.enableVertexAttribArray(attribute); gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
    const indexBuffer = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    this.uniforms = Object.fromEntries(['uImage', 'uViewport', 'uOrigin', 'uLook', 'uPose', 'uScale', 'uTime', 'uMotion', 'uSpeaking', 'uNod', 'uZoom', 'uBlinkWeight', 'uSurpriseWeight', 'uWarmth', 'uWind', 'uForm']
      .map(name => [name, gl.getUniformLocation(this.program, name)]));
  }

  load(portrait, blink, surprised, divine) {
    const gl = this.gl;
    [portrait, blink, surprised, divine].forEach((image, index) => {
      const texture = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + index); gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.uniform1i(gl.getUniformLocation(this.program, ['uPortrait', 'uBlink', 'uSurprise', 'uDivine'][index]), index);
    });
    gl.uniform2f(this.uniforms.uImage, portrait.width, portrait.height);
    this.loaded = true;
  }

  resize(width, height, pixelWidth, pixelHeight) {
    const gl = this.gl;
    if (!gl) return;
    gl.viewport(0, 0, pixelWidth, pixelHeight);
    gl.uniform2f(this.uniforms.uViewport, width, height);
  }

  clear() { this.gl.clearColor(0, 0, 0, 0); this.gl.clear(this.gl.COLOR_BUFFER_BIT); }

  draw({ time, center, baseline, scale, look, pose, reducedMotion, speaking, nod, zoom, blink, surprised, warmth, wind, form = 0 }) {
    const gl = this.gl;
    this.clear();
    const u = this.uniforms;
    gl.uniform2f(u.uOrigin, center, baseline); gl.uniform2f(u.uLook, ...look);
    gl.uniform4fv(u.uPose, pose);
    for (const [name, value] of Object.entries({ uScale: scale, uTime: time, uMotion: reducedMotion ? 0 : 1, uSpeaking: speaking ? 1 : 0,
      uNod: nod, uZoom: zoom, uBlinkWeight: blink, uSurpriseWeight: surprised, uWarmth: warmth, uWind: wind || 0, uForm: form })) gl.uniform1f(u[name], value);
    gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
  }
}
