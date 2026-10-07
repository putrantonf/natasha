import { gateScene } from './scenes/gate.js';
import { journeyScenes } from './scenes/journey.js';
import { passageScenes } from './scenes/passage.js';
import { gardenScenes } from './scenes/garden.js';
import { sanctumScenes } from './scenes/sanctum.js';
import { farewellScene } from './scenes/farewell.js';
import { Character } from './engine/character.js';
import { Door } from './engine/door.js';
import { Realm } from './engine/realm.js';
import { Trail } from './engine/trail.js';
import { Lore } from './engine/lore.js';
import { Garden } from './engine/garden.js';
import { GardenLife } from './engine/garden-life.js';
import { Spring } from './engine/spring.js';
import { Sanctum } from './engine/sanctum.js';
import { Mirror } from './engine/mirror.js';
import { LivingPainting } from './engine/living-painting.js';
import { Embers, AmbientAudio } from './engine/ambience.js';

const byId = (id) => document.getElementById(id);
const elements = Object.fromEntries([
  'world', 'arrival', 'gate-hint', 'gate-whisper', 'door-interaction', 'gate-plane',
  'gate-art', 'hell-art', 'gate-motion', 'hell-motion', 'chapter-mark', 'chapter-name', 'speaker-name', 'speaker-role',
  'garden-art', 'garden-motion', 'garden-interaction', 'garden-surfaces', 'garden-hint', 'garden-life', 'ending-letter',
  'passage-plane', 'passage-art', 'passage-motion',
  'sanctum-plane', 'sanctum-art', 'sanctum-motion', 'sanctum-life',
  'sanctum-interaction', 'sanctum-surfaces', 'sanctum-hint', 'monument-inscription',
  'mirror-art', 'mirror-motion', 'mirror-reflection', 'mirror-interaction', 'mirror-glass', 'mirror-hint',
  'dialogue', 'dialogue-text', 'dialogue-aside', 'answer-row', 'answer-button', 'continue-button',
  'lore-trigger', 'lore-dialog', 'lore-title', 'lore-copy', 'lore-close',
  'trail', 'trail-stone', 'trail-hint', 'ending', 'replay-button',
  'sound-toggle', 'sound-label', 'announcement', 'load-error',
].map((id) => [id, byId(id)]));
const birthdayScene = { ...gardenScenes.at(-1), realm: 'sanctum', portrait: true,
  camera: { x: .5, y: .5, zoom: 1 }, travel: 3800 };
const scenes = [gateScene, ...journeyScenes, ...passageScenes, ...gardenScenes.slice(0, -1), ...sanctumScenes, farewellScene, birthdayScene];
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const character = new Character(byId('lucifer'), { reducedMotion: motionQuery.matches });
const embers = new Embers(byId('embers'), motionQuery.matches);
const gatePainting = new LivingPainting(elements['gate-motion'], elements['gate-art'], { reducedMotion: motionQuery.matches });
const hellPainting = new LivingPainting(elements['hell-motion'], elements['hell-art'], { mode: 1, reducedMotion: motionQuery.matches });
const realm = new Realm(elements['hell-art'], motionQuery.matches, hellPainting);
const gardenPainting = new LivingPainting(elements['garden-motion'], elements['garden-art'], { mode: 2, reducedMotion: motionQuery.matches });
const gardenRealm = new Realm(elements['garden-art'], motionQuery.matches, gardenPainting);
const passagePainting = new LivingPainting(elements['passage-motion'], elements['passage-art'], { mode: 3, reducedMotion: motionQuery.matches });
const passageRealm = new Realm(elements['passage-art'], motionQuery.matches, passagePainting);
const sanctumPainting = new LivingPainting(elements['sanctum-motion'], elements['sanctum-art'], { mode: 4, reducedMotion: motionQuery.matches });
const sanctumRealm = new Realm(elements['sanctum-art'], motionQuery.matches, sanctumPainting);
const mirrorPainting = new LivingPainting(elements['mirror-motion'], elements['mirror-art'], { mode: 5, reducedMotion: motionQuery.matches });
const mirrorRealm = new Realm(elements['mirror-art'], motionQuery.matches, mirrorPainting);
const realmFor = name => ({ sanctum: sanctumRealm, garden: gardenRealm, passage: passageRealm, mirror: mirrorRealm })[name] || realm;
const life = new GardenLife(elements['garden-life'], gardenRealm, { reducedMotion: motionQuery.matches,
  onSplash(x, y) { const p = gardenRealm.project(x, y); if (p) { gardenPainting.ripple(p.x, p.y); audio.waterTouch(); } },
});
const audio = new AmbientAudio();
const state = { phase: 'loading', scene: 0, line: 0, typing: false, quiet: false };
const scene = () => scenes[state.scene];
const line = () => scene().lines[state.line];
const cameraFor = entry => {
  const camera = { ...entry.camera };
  if (entry.realm === 'sanctum' && innerWidth > innerHeight * 1.2) {
    if (entry.ritual) camera.y = .80;
    else if (['goddess', 'birthday'].includes(entry.id)) camera.y = .34;
  }
  return camera;
};
let writer, generation = 0, pointerX = 0, pointerY = 0, driftX = 0, driftY = 0;
let lastFootstep = 0, quietTimer, lastFrame = 0, wind = 0, windTarget = 0, lastPointerPosition, portal;
const announce = (text) => { elements.announcement.textContent = text; };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const modalOpen = () => lore.open;

const lore = new Lore({
  trigger: elements['lore-trigger'], dialog: elements['lore-dialog'],
  title: elements['lore-title'], copy: elements['lore-copy'], close: elements['lore-close'],
  onOpen(entry) { audio.rune(0); announce(`Gulungan terbuka: ${entry.title}.`); },
});

const mirror = new Mirror({
  canvas: elements['mirror-reflection'], element: elements['mirror-interaction'],
  button: elements['mirror-glass'], hint: elements['mirror-hint'], realm: mirrorRealm, reducedMotion: motionQuery.matches,
  announce, onComplete: arrive,
});

const garden = new Garden({
  element: elements['garden-interaction'], surfaces: elements['garden-surfaces'],
  hint: elements['garden-hint'], realm: gardenRealm,
  painting: gardenPainting, life, reducedMotion: motionQuery.matches, announce,
  onRipple(x, y) { audio.waterTouch(); embers.setPointer(x, y); },
  onComplete: arrive,
});

const spring = new Spring({ element: elements['garden-interaction'], surfaces: elements['garden-surfaces'],
  hint: elements['garden-hint'], realm: passageRealm, painting: passagePainting, atlas: life.image,
  reducedMotion: motionQuery.matches, announce, onRipple() { audio.waterTouch(); }, onComplete: arrive });

const sanctum = new Sanctum({
  canvas: elements['sanctum-life'], element: elements['sanctum-interaction'],
  surfaces: elements['sanctum-surfaces'], hint: elements['sanctum-hint'],
  inscription: elements['monument-inscription'], realm: sanctumRealm, painting: sanctumPainting,
  reducedMotion: motionQuery.matches, announce,
  onChannel() { audio.waterTouch(); },
  onAwakening() {
    setPhase('awakening'); audio.recognition(); audio.waterTouch();
    sanctumRealm.move(cameraFor(sanctumScenes[2]), motionQuery.matches ? 0 : 6200);
  },
  onComplete: arrive,
});

const door = new Door({
  world: elements.world, plane: elements['gate-plane'],
  interaction: elements['door-interaction'], image: elements['gate-art'],
  seals: gateScene.seals, reducedMotion: motionQuery.matches,
  onSeal({ index, count, keyboard, x, y }) {
    audio.rune(index); embers.emit(x, y, 'rune');
    elements['gate-whisper'].textContent = gateScene.ritual.whispers[count];
    elements['gate-hint'].textContent = count === 3 ? gateScene.ritual.ready : gateScene.ritual.hint;
    announce(`Lambang ${gateScene.seals[index].name} menyala. ${count} dari 3. ${elements['gate-hint'].textContent}`);
    if (keyboard) requestAnimationFrame(() => {
      if (state.phase !== 'arrival') return;
      const next = count === 3 ? door.push : door.seals.find(element => !element.disabled);
      next?.focus({ preventScroll: true });
    });
  },
  onEnergy({ kind, id, x, y, progress }) {
    if (kind === 'charge') embers.charge(x, y, progress);
    else {
      embers.emit(x, y); setTouch(x, y);
      if (id === 'push') audio.push();
    }
  },
  onComplete: summon,
});

const trail = new Trail({
  world: elements.world, element: elements.trail, stone: elements['trail-stone'],
  hint: elements['trail-hint'], realm, reducedMotion: motionQuery.matches,
  onProgress(progress, x, y) {
    embers.charge(x, y, progress); hellPainting.stir(x, y);
    const now = performance.now();
    if (now - lastFootstep > 340) { audio.thud(0, .16); lastFootstep = now; }
  },
  onGuide(here, ahead) {
    hellPainting.point(here.x, here.y, ahead.x, ahead.y); embers.guideFloor(here, ahead);
  },
  onComplete: arrive,
});

function setPhase(phase) {
  state.phase = phase;
  elements.world.dataset.phase = phase;
  elements.arrival.hidden = !['loading', 'arrival', 'summoning'].includes(phase);
  elements['door-interaction'].hidden = !['arrival', 'summoning'].includes(phase);
  elements.dialogue.hidden = phase !== 'dialogue';
  elements.ending.hidden = phase !== 'ending';
  if (phase !== 'trail') { trail.hide(); hellPainting.clearGuide(); embers.guide = null; }
  if (phase !== 'garden-interaction') { garden.hide(); spring.hide(); }
  if (phase !== 'mirror-interaction') mirror.hide();
  if (!['sanctum-interaction', 'awakening'].includes(phase)) sanctum.hide();
  door.enabled = phase === 'arrival';
  embers.phase = phase;
  character.visible = ['entering', 'dialogue', 'ending', 'transfiguring'].includes(phase) && scene().id !== 'monument' && scene().portrait !== false;
}

embers.sourceProject = (x, y) => elements.world.dataset.realm === 'sanctum' ? sanctumRealm.project(x, y) :
  elements.world.dataset.realm === 'mirror' ? mirrorRealm.project(x, y) :
  elements.world.dataset.realm === 'garden' ? gardenRealm.project(x, y) :
  elements.world.dataset.realm === 'passage' ? passageRealm.project(x, y) :
  elements.world.dataset.realm === 'hell' ? realm.project(x, y) :
  { x: door.left + x * door.planeWidth + driftX, y: door.top + y * door.planeHeight + driftY, scale: door.scale };

function setChapter(index) {
  state.scene = index;
  elements.world.dataset.scene = scene().id;
  character.staging = scene().id;
  elements['chapter-mark'].textContent = scene().chapter;
  elements['chapter-name'].textContent = scene().title;
}

async function summon() {
  const currentGeneration = generation;
  const pushBox = door.push.getBoundingClientRect();
  if (door.open < .1) audio.push();
  embers.emit(pushBox.left + pushBox.width / 2, pushBox.top + pushBox.height / 2, 'stone');
  setPhase('summoning');
  announce('Pintu terbuka. Kota yang terbakar terlihat di baliknya.');
  await sleep(motionQuery.matches ? 30 : 950);
  if (currentGeneration !== generation) return;
  elements.world.dataset.realm = 'hell'; embers.realm = 'hell';
  audio.setRealm('hell'); setChapter(0); setPhase('entering');
  character.visible = true; character.setGesture('listen');
  audio.footsteps();
  await sleep(motionQuery.matches ? 30 : 1150);
  if (currentGeneration !== generation) return;
  setPhase('dialogue'); showLine(0);
}

function settle(current) {
  character.speaking = false;
  if (current.listening) character.setGesture(current.listening);
}

function finishTyping() {
  if (!state.typing || state.phase !== 'dialogue' || modalOpen()) return;
  writer?.abort();
  const current = line();
  elements['dialogue-text'].textContent = current.text;
  elements['dialogue-text'].classList.remove('typing');
  state.typing = false; settle(current); finishLine(current);
}

function finishLine(current) {
  if (!current.quiet || motionQuery.matches) { revealAction(current); return; }
  state.quiet = true;
  const currentGeneration = generation;
  quietTimer = setTimeout(() => {
    if (currentGeneration !== generation || state.phase !== 'dialogue' || line() !== current) return;
    state.quiet = false; revealAction(current);
  }, current.quiet);
}

function revealAction(current) {
  if (state.phase !== 'dialogue') return;
  elements['answer-row'].hidden = !current.answer;
  elements['continue-button'].hidden = Boolean(current.answer);
  if (current.answer) {
    elements['answer-button'].textContent = current.answer;
    if (!modalOpen()) elements['answer-button'].focus({ preventScroll: true });
  } else if (!modalOpen()) elements['continue-button'].focus({ preventScroll: true });
  const speaker = current.kind === 'thought' ? 'Dalam hati Lucifer' : current.speaker || 'Lucifer';
  announce(`${speaker}: ${current.text}${current.answer ? ` Jawabanmu: ${current.answer}` : ''}`);
}

async function showLine(index) {
  clearTimeout(quietTimer); state.quiet = false;
  writer?.abort(); writer = new AbortController();
  const signal = writer.signal;
  state.line = index; state.typing = true;
  const current = line(), speaker = current.speaker || 'Lucifer';
  const spoken = speaker === 'Lucifer' && current.kind !== 'thought';
  elements.world.dataset.line = current.id;
  elements.dialogue.dataset.speaker = speaker;
  elements.dialogue.dataset.kind = current.kind || 'speech';
  elements['speaker-name'].textContent = speaker;
  elements['speaker-role'].textContent = current.kind === 'thought' ? 'DALAM HATI' : speaker === 'Natasha' ? 'SUARAMU' :
    character.canvas.dataset.form === 'divine' ? 'LUCIFER' : 'THE FALLEN ANGEL';
  elements['dialogue-aside'].hidden = !current.aside;
  elements['dialogue-aside'].textContent = current.aside || '';
  lore.prepare(current.lore && current.lore === scene().lore?.id ? scene().lore : null);
  elements['answer-row'].hidden = true; elements['continue-button'].hidden = true;
  elements['dialogue-text'].textContent = '';
  character.setExpression(current.expression || 'calm');
  character.setGesture(current.gesture || 'guard'); character.speaking = false;
  character.setReaction(current.reaction);
  if (current.id === 'the-creator') audio.recognition();
  elements['dialogue-text'].classList.add('typing');
  if (current.pause && !motionQuery.matches) await sleep(current.pause);
  if (signal.aborted || state.phase !== 'dialogue') return;
  if (motionQuery.matches) { finishTyping(); return; }
  character.speaking = spoken;
  for (let i = 0; i < current.text.length; i++) {
    while (modalOpen() && !signal.aborted) await sleep(80);
    if (signal.aborted || state.phase !== 'dialogue') return;
    const letter = current.text[i];
    elements['dialogue-text'].textContent += letter;
    if (spoken && '.!?'.includes(letter) && i > 3) character.beat();
    const delay = '.!?'.includes(letter) ? 180 : letter === '\n' ? 270 : 27;
    await sleep(delay);
  }
  if (signal.aborted || state.phase !== 'dialogue') return;
  state.typing = false; settle(current);
  elements['dialogue-text'].classList.remove('typing'); finishLine(current);
}

function nextLine() {
  if (line().action === 'divine' && character.canvas.dataset.form !== 'divine') { transfigure(); return; }
  if (state.line + 1 < scene().lines.length) showLine(state.line + 1);
  else if (scene().ritual === true) {
    writer?.abort(); character.speaking = false;
    setPhase('sanctum-interaction'); sanctum.start();
  }
  else if (scene().mirror) {
    writer?.abort(); character.speaking = false;
    setPhase('mirror-interaction'); mirror.start();
  } else if (scene().trail) {
    beginTrail();
  } else if (scene().interaction) {
    writer?.abort(); character.speaking = false; character.setGesture('permit');
    setPhase('garden-interaction');
    const inPassage = elements.world.dataset.realm === 'passage';
    if (scene().interaction.kind === 'stream') spring.start(scene().interaction);
    else garden.start(scene().interaction, inPassage ? passageRealm : gardenRealm, inPassage ? passagePainting : gardenPainting);
  } else if (state.scene + 1 < scenes.length) {
    arrive();
  } else {
    writer?.abort(); character.speaking = false; character.setGesture('permit');
    setPhase('ending');
    lore.prepare(scene().lore);
    announce('Selamat ulang tahun ya sayang. Aku senang kamu ada. I love you sayang. Surat untukmu dapat dibaca kembali.');
    elements['ending-letter'].focus({ preventScroll: true });
  }
}

async function beginTrail() {
  const currentGeneration = generation;
  writer?.abort(); character.speaking = false; character.setGesture('permit');
  if (elements.world.dataset.realm === 'mirror') {
    setPhase('travelling');
    realm.move({ x: .14, y: .47, zoom: 1.08 }, 0); realm.draw(performance.now());
    elements.world.dataset.realm = 'hell'; embers.realm = 'hell'; audio.footsteps();
    announce('Meninggalkan cermin, kembali ke jalan batu menuju alun-alun.');
    await sleep(motionQuery.matches ? 30 : 2200);
    if (currentGeneration !== generation) return;
  }
  setPhase('trail'); trail.start(scene().trail);
  announce(`${scene().trail.hint} Dengan keyboard, tekan Enter pada lantai yang berpendar untuk melanjutkan.`);
}

async function transfigure() {
  const currentGeneration = generation;
  writer?.abort(); character.speaking = false; setPhase('transfiguring');
  audio.recognition(); character.revealDivine();
  announce('Cahaya hangat menyusuri jubah Lucifer. Sayap dan wujud divine dengan wajah yang familier muncul.');
  await sleep(motionQuery.matches ? 550 : 4800);
  if (currentGeneration !== generation) return;
  character.formProgress(performance.now()); setPhase('dialogue'); showLine(state.line + 1);
}

async function arrive() {
  if (!['trail', 'garden-interaction', 'mirror-interaction', 'dialogue', 'awakening'].includes(state.phase)) return;
  const currentGeneration = generation;
  const index = state.scene + 1, next = scenes[index];
  if (!next) return;
  writer?.abort(); character.speaking = false;
  setPhase(next.reveal ? 'reveal' : 'travelling');
  const destination = next.realm || 'hell', crossing = elements.world.dataset.realm !== destination;
  const duration = destination === 'garden' && crossing ? 5700 : next.travel || (crossing ? 3200 : 1200);
  if (destination === 'garden' && crossing) {
    gardenRealm.move({ x: .16, y: .55, zoom: 1.04 }, 0);
    gardenRealm.draw(performance.now());
    portal = { started: performance.now(), duration };
    elements.world.dataset.portal = 'opening'; audio.setRealm('garden');
  } else if (crossing) {
    const camera = realmFor(destination);
    camera.move(destination === 'sanctum' ? { x: .5, y: .69, zoom: 1.15 } : destination === 'mirror' ?
      { x: .5, y: .5, zoom: 1.04 } : { x: .16, y: .54, zoom: 1.03 }, 0);
    camera.draw(performance.now());
    if (destination === 'mirror') {
      realm.move({ x: .102, y: .44, zoom: 1.08 }, 1100); realm.draw(performance.now());
      mirror.update(performance.now(), true);
    }
    if (destination === 'sanctum') sanctum.draw(performance.now());
    elements.world.dataset.realm = destination;
    const atmosphere = destination === 'sanctum' ? 'garden' : destination === 'mirror' ? 'hell' : destination;
    embers.reset(); embers.realm = atmosphere; audio.setRealm(atmosphere);
  }
  realmFor(destination).move(cameraFor(next), duration);
  if (!['recognition', 'apology', 'reflection'].includes(next.id)) audio.footsteps();
  announce(next.realm === 'sanctum' ? next.reveal ? 'Pandangan mengikuti patung Natasha dan pahatan namanya.' : 'Mengikuti air ke halaman utama. Langit dan taman membuka pandangan ke panggung batu.' :
    next.reveal ? 'Pandangan mengikuti air, lalu terangkat ke patung raksasa kalian.' :
    crossing ? destination === 'mirror' ? 'Mendekati cermin berbingkai emas di lorong neraka. Kacanya tertutup abu.' :
    destination === 'garden' ? 'Melewati lengkung hidup. Cahaya taman terbuka di balik akar.' :
    'Meninggalkan lava, memasuki lorong batu dan mata air.' : 'Melangkah ke ' + next.title.toLowerCase() + '.');
  await sleep(motionQuery.matches ? 50 : duration + 100);
  if (currentGeneration !== generation) return;
  if (portal) {
    // Keep the fully open aperture until its plane is no longer on screen.
    const p = passageRealm.project(.841, .37);
    elements['passage-plane'].style.maskImage = 'radial-gradient(ellipse 5000px 5000px at ' + p.x + 'px ' + p.y + 'px,transparent 99%,#000)';
    elements.world.dataset.realm = 'garden'; embers.reset(); embers.realm = 'garden';
    portal = null; delete elements.world.dataset.portal;
    life.canvas.style.maskImage = '';
  }
  setChapter(index); setPhase('dialogue'); showLine(0);
}

function advance() {
  if (state.phase !== 'dialogue' || state.quiet || modalOpen()) return;
  if (state.typing) { finishTyping(); return; }
  if (!line().answer) nextLine();
}

function replay() {
  generation += 1; writer?.abort(); audio.reset(); audio.setRealm('gate');
  clearTimeout(quietTimer); state.quiet = false; lore.reset(); garden.reset(); spring.reset(); life.reset(); mirror.reset(); sanctum.reset(); character.setReaction(null);
  portal = null; delete elements.world.dataset.portal; elements['passage-plane'].style.maskImage = '';
  life.canvas.style.maskImage = '';
  gardenPainting.blessing = [0, 0, 0]; passagePainting.blessing = [0, 0, 0];
  sanctumPainting.blessing = [0, 0, 0];
  elements['ending-letter'].setAttribute('aria-expanded', 'false');
  state.scene = 0; state.line = 0; state.typing = false;
  character.visible = false; character.speaking = false;
  character.setExpression('calm'); character.setGesture('guard'); character.releasePointer(); character.resetActing();
  character.resetForm();
  door.reset(); trail.reset(); embers.reset(); embers.realm = 'gate';
  realm.move(gateScene.camera, 0);
  gardenRealm.move(gardenScenes[0].camera, 0);
  passageRealm.move(passageScenes[0].camera, 0);
  mirrorRealm.move(journeyScenes[0].camera, 0);
  sanctumRealm.move(sanctumScenes[1].camera, 0);
  elements.world.dataset.realm = 'gate';
  elements.world.classList.remove('touching');
  hellPainting.touch = gatePainting.touch = gardenPainting.touch = [-2, -2, 0];
  delete elements.world.dataset.line; delete elements.world.dataset.scene;
  elements['chapter-mark'].textContent = 'PROLOG'; elements['chapter-name'].textContent = 'Gerbang pertama';
  elements['gate-hint'].textContent = gateScene.ritual.intro;
  elements['gate-whisper'].textContent = gateScene.ritual.whispers[0];
  setPhase('arrival'); door.seals[0].focus({ preventScroll: true });
  announce('Kembali ke gerbang. Sentuh dan tahan ketiga lambang untuk membukanya.');
}

function pointerPosition(event) {
  const box = elements.world.getBoundingClientRect();
  return [event.clientX - box.left, event.clientY - box.top];
}

function setTouch(x, y) {
  elements.world.style.setProperty('--pointer-x', x + 'px');
  elements.world.style.setProperty('--pointer-y', y + 'px');
  elements.world.classList.add('touching');
}

elements['answer-button'].addEventListener('click', () => {
  if (state.phase === 'dialogue' && !state.typing && !state.quiet && !modalOpen() && line().answer) nextLine();
});
elements['continue-button'].addEventListener('click', advance);
elements['dialogue-text'].addEventListener('click', () => { if (state.typing) finishTyping(); });
elements['replay-button'].addEventListener('click', replay);
elements['ending-letter'].addEventListener('click', () => lore.unroll(elements['ending-letter']));
elements['sound-toggle'].addEventListener('click', async () => {
  try {
    const enabled = await audio.toggle();
    elements['sound-toggle'].setAttribute('aria-pressed', String(enabled));
    elements['sound-toggle'].setAttribute('aria-label', enabled ? 'Matikan suara' : 'Aktifkan suara');
    elements['sound-label'].textContent = enabled ? 'Suara hidup' : 'Suara mati';
  } catch {
    elements['sound-label'].textContent = 'Suara tidak tersedia';
    announce('Suara tidak tersedia. Cerita tetap dapat dilanjutkan.');
  }
});

window.addEventListener('keydown', (event) => {
  if (modalOpen()) return;
  if (event.key !== ' ' && event.key !== 'Enter') return;
  if (event.target instanceof HTMLButtonElement || state.phase !== 'dialogue') return;
  event.preventDefault();
  if (state.typing) finishTyping(); else advance();
});
elements.world.addEventListener('pointermove', (event) => {
  if (modalOpen()) return;
  const [x, y] = pointerPosition(event);
  embers.setPointer(x, y); character.receivePointer(x, y);
  if (lastPointerPosition) windTarget = Math.max(-1, Math.min(1, (x - lastPointerPosition.x) / 30));
  lastPointerPosition = { x, y };
  elements.world.style.setProperty('--pointer-x', x + 'px'); elements.world.style.setProperty('--pointer-y', y + 'px');
  if (event.pointerType === 'mouse') {
    elements.world.classList.add('has-pointer');
    if (!motionQuery.matches) { pointerX = (x / character.width - .5) * -10; pointerY = (y / character.height - .5) * -5; }
  }
});
elements.world.addEventListener('pointerdown', (event) => {
  if (['garden-interaction', 'mirror-interaction', 'sanctum-interaction', 'awakening'].includes(state.phase)) return;
  if (event.target.closest('button, .dialogue, .ending, dialog')) return;
  const [x, y] = pointerPosition(event);
  setTouch(x, y); embers.emit(x, y); embers.setPointer(x, y);
  if (state.phase === 'dialogue' && character.hitTest(x, y)) character.reactToTouch(x, y);
  else if (elements.world.dataset.realm === 'hell') hellPainting.stir(x, y);
  else if (elements.world.dataset.realm === 'sanctum') sanctumPainting.ripple(x, y);
  else if (elements.world.dataset.realm === 'garden' && state.phase !== 'garden-interaction') {
    gardenPainting.stir(x, y);
    const [sourceX, sourceY] = gardenPainting.source(x, y);
    if (sourceY > .73 && sourceX > .34 && sourceX < .80) gardenPainting.ripple(x, y);
  }
});
window.addEventListener('pointerup', () => elements.world.classList.remove('touching'));
window.addEventListener('pointercancel', () => elements.world.classList.remove('touching'));
elements.world.addEventListener('pointerleave', () => {
  pointerX = 0; pointerY = 0; embers.pointer.active = false;
  character.releasePointer(); elements.world.classList.remove('has-pointer', 'touching');
  windTarget = 0; lastPointerPosition = null;
});
window.addEventListener('blur', () => { door.release(); trail.release(); garden.release(); spring.release(); mirror.release(); sanctum.release(); });
window.addEventListener('resize', () => {
  character.resize(); embers.resize(); door.resize(); realm.resize(); gardenRealm.resize(); passageRealm.resize(); mirrorRealm.resize();
  life.resize(); mirror.resize(); garden.position(); spring.resize(); sanctumRealm.resize(); sanctum.resize();
  if (elements.world.dataset.realm === 'sanctum') sanctumRealm.move(cameraFor(state.phase === 'awakening' ? sanctumScenes[2] : scene()), 0);
  gatePainting.resize(door.planeWidth, door.planeHeight);
  if (state.phase === 'trail') trail.resize();
});
motionQuery.addEventListener('change', () => {
  spring.reducedMotion = motionQuery.matches;
  trail.reducedMotion = motionQuery.matches;
  character.reducedMotion = embers.reducedMotion = door.reducedMotion = realm.reducedMotion = gardenRealm.reducedMotion = garden.reducedMotion = motionQuery.matches;
  gatePainting.reducedMotion = hellPainting.reducedMotion = gardenPainting.reducedMotion = motionQuery.matches;
  passagePainting.reducedMotion = passageRealm.reducedMotion = life.reducedMotion = mirror.reducedMotion = motionQuery.matches;
  sanctum.reducedMotion = sanctumRealm.reducedMotion = sanctumPainting.reducedMotion = motionQuery.matches;
  mirrorPainting.reducedMotion = mirrorRealm.reducedMotion = motionQuery.matches;
  if (motionQuery.matches) { pointerX = 0; pointerY = 0; driftX = 0; driftY = 0; finishTyping(); }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { door.release(); trail.release(); garden.release(); spring.release(); mirror.release(); sanctum.release(); audio.suspend(); }
  else audio.resume();
});

function frame(time) {
  if (!document.hidden && time - lastFrame >= 30) {
    lastFrame = time;
    windTarget *= .93; wind += (windTarget - wind) * .04;
    const breeze = motionQuery.matches ? 0 : wind + Math.sin(time / 3900) * .18;
    embers.wind = character.wind = breeze;
    gatePainting.targetWind = hellPainting.targetWind = passagePainting.targetWind = mirrorPainting.targetWind = breeze;
    gardenPainting.targetWind = breeze * (life.blessings & 4 ? .5 : 1);
    sanctumPainting.targetWind = breeze;
    driftX += (pointerX - driftX) * .035; driftY += (pointerY - driftY) * .035;
    door.position(driftX, driftY);
    door.draw(time);
    const heat = ['hell', 'mirror'].includes(elements.world.dataset.realm) ? .9 : elements.world.dataset.realm === 'passage' ? .32 :
      ['garden', 'sanctum'].includes(elements.world.dataset.realm) ? .12 : door.heat || 0;
    embers.heat = heat; character.warmth = heat;
    character.draw(time); embers.draw(time);
    elements.world.style.setProperty('--drift-x', `${driftX.toFixed(2)}px`);
    elements.world.style.setProperty('--drift-y', `${driftY.toFixed(2)}px`);
    elements.world.style.setProperty('--light-breath', motionQuery.matches ? '1' :
      (1 + Math.sin(time / 1700) * .018 + Math.sin(time / 113) * .002).toFixed(4));
    audio.update(time);
    if (elements.world.dataset.realm === 'sanctum') {
      sanctumRealm.draw(time, driftX, driftY); sanctum.update(time); sanctum.draw(time);
    } else if (elements.world.dataset.realm === 'garden') {
      gardenRealm.draw(time, driftX, driftY); life.draw(time); garden.update(time);
    } else if (elements.world.dataset.realm === 'passage') {
      passageRealm.draw(time, driftX, driftY); garden.update(time); spring.update(time); spring.draw(time);
    } else if (elements.world.dataset.realm === 'mirror') {
      realm.draw(time, driftX, driftY); mirrorRealm.draw(time, driftX, driftY);
    } else if (elements.world.dataset.realm === 'hell') {
      trail.update(time); realm.draw(time, state.phase === 'trail' ? 0 : driftX, state.phase === 'trail' ? 0 : driftY); trail.draw(time);
    }
    else gatePainting.draw(time, { left: 0, top: 0, width: door.planeWidth, height: door.planeHeight });
    mirror.update(time, elements.world.dataset.realm === 'mirror');
    if (portal) {
      gardenRealm.draw(time, driftX, driftY); life.draw(time);
      const p = passageRealm.project(.841, .37);
      const progress = motionQuery.matches ? 1 : Math.min(1, (time - portal.started) / portal.duration);
      const expansion = 1 + progress * progress * 17;
      const rx = passageRealm.frame.width * .026 * expansion, ry = passageRealm.frame.height * .19 * expansion;
      elements['passage-plane'].style.maskImage = `radial-gradient(ellipse ${rx}px ${ry}px at ${p.x}px ${p.y}px,transparent 0%,transparent 74%,#000 99%)`;
      life.canvas.style.maskImage = `radial-gradient(ellipse ${rx}px ${ry}px at ${p.x}px ${p.y}px,#000 0%,#000 74%,transparent 99%)`;
      elements.world.style.setProperty('--portal-light', String(Math.sin(progress * Math.PI) * .36));
    }
  }
  requestAnimationFrame(frame);
}

async function init() {
  try {
    await Promise.all([character.load(), life.load(), mirror.load(), sanctum.load(), elements['gate-art'].decode(), elements['hell-art'].decode(), elements['garden-art'].decode(), elements['passage-art'].decode(), elements['sanctum-art'].decode(), elements['mirror-art'].decode()]);
    gatePainting.load(); hellPainting.load(); gardenPainting.load(); passagePainting.load(); sanctumPainting.load(); mirrorPainting.load();
    sanctumPainting.loadVeil(sanctum.veil);
    door.resize(); realm.resize(); gardenRealm.resize(); passageRealm.resize(); mirrorRealm.resize(); realm.move(gateScene.camera, 0);
    gardenRealm.move(gardenScenes[0].camera, 0);
    passageRealm.move(passageScenes[0].camera, 0);
    mirrorRealm.move(journeyScenes[0].camera, 0);
    sanctumRealm.resize(); sanctum.resize(); sanctumRealm.move(sanctumScenes[1].camera, 0);
    gatePainting.resize(door.planeWidth, door.planeHeight); realm.draw(performance.now());
    setPhase('arrival'); requestAnimationFrame(frame);
  } catch (error) {
    elements.arrival.hidden = true; elements['door-interaction'].hidden = true;
    elements['load-error'].hidden = false;
    elements['load-error'].textContent = 'Dunia belum dapat terlihat. Muat ulang halaman untuk mencoba lagi.';
    console.error(error);
  }
}
init();

