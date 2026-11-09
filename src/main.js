import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { topics, solvePhysics, registerCommand } from './modules.js';

const wrap = document.getElementById('canvas-wrap');
const panel = document.getElementById('panel');

// Renderer, scene, camera
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
wrap.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f1a24);
const HOME_POS = new THREE.Vector3(4, 3, 6);
const HOME_TARGET = new THREE.Vector3(0, 0, 0);
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.copy(HOME_POS);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 1.5;
controls.maxDistance = 14;
scene.add(new THREE.HemisphereLight(0xffffff, 0x223344, 1.2));
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(5, 8, 5);
scene.add(sun);

// Lever: fulcrum tip is at the origin
const lever = new THREE.Group();
scene.add(lever);
const makeMat = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, transparent: true });
const parts = {
  beam:    { mesh: new THREE.Mesh(new THREE.BoxGeometry(6, 0.25, 0.6), makeMat(0x3fb8af)), pos: [0, 0.125, 0], offset: [0, 0, 0], label: 'बीम (छड़)' },
  fulcrum: { mesh: new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 32), makeMat(0x8ea3b0)), pos: [0, -0.6, 0], offset: [0, -1.2, 0], label: 'फुलक्रम (आधार बिंदु)' },
  load:    { mesh: new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), makeMat(0xf2a541)), pos: [-2.2, 0.65, 0], offset: [-1, 1.2, 0], label: 'भार (Load)' },
  effort:  { mesh: new THREE.Mesh(new THREE.SphereGeometry(0.4, 32, 16), makeMat(0x9b8cff)), pos: [2.2, 0.65, 0], offset: [1, 1.2, 0], label: 'बल (Effort)' },
};
for (const [key, p] of Object.entries(parts)) {
  p.mesh.name = key;
  p.mesh.userData.label = p.label;
  p.mesh.position.set(...p.pos);
  p.home = new THREE.Vector3(...p.pos);
  p.away = p.home.clone().add(new THREE.Vector3(...p.offset));
  lever.add(p.mesh);
}

// Extra weights the user can add or remove
const SLOTS = [-1.2, 1.2, -0.4, 0.4, 0];
const weights = [];
function addWeight() {
  if (weights.length >= 10) return;
  const i = weights.length;
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), makeMat(0xf2a541));
  m.position.set(SLOTS[i % 5], 0.5 + Math.floor(i / 5) * 0.5, 0);
  m.userData.label = 'अतिरिक्त भार';
  lever.add(m);
  weights.push(m);
}
function removeWeight() {
  const m = weights.pop();
  if (!m) return;
  if (state.selected === m) state.selected = null;
  lever.remove(m);
  m.geometry.dispose();
  m.material.dispose();
}

const state = { selected: null, transparent: false, exploded: false, goal: null };

function applyStyle() {
  for (const m of lever.children) {
    const fade = state.transparent && m !== state.selected;
    m.material.opacity = fade ? 0.3 : 1;
    m.material.depthWrite = !fade;
    m.material.emissive.set(m === state.selected ? 0x663300 : 0x000000);
  }
}

function zoomToSelected() {
  if (!state.selected) return;
  const t = new THREE.Vector3();
  state.selected.getWorldPosition(t);
  state.goal = { target: t, pos: t.clone().add(new THREE.Vector3(1.2, 0.8, 2)) };
}

// Tap to select a part (ignore drags so orbit rotation still works)
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let downAt = null;
renderer.domElement.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', (e) => {
  const moved = downAt ? Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) : 99;
  downAt = null;
  if (moved > 6) return;
  const r = renderer.domElement.getBoundingClientRect();
  pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(lever.children, false)[0];
  state.selected = hit ? hit.object : null;
  applyStyle();
  renderPanel();
});

function resize() {
  const w = wrap.clientWidth, h = wrap.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(wrap);

function animate() {
  requestAnimationFrame(animate);
  if (!wrap.offsetParent) return; // 3D स्क्रीन दिख न रही हो तो रेंडर न करें
  for (const p of Object.values(parts)) {
    p.mesh.position.lerp(state.exploded ? p.away : p.home, 0.1);
  }
  if (state.goal) {
    controls.target.lerp(state.goal.target, 0.08);
    camera.position.lerp(state.goal.pos, 0.08);
    if (camera.position.distanceTo(state.goal.pos) < 0.01) state.goal = null;
  }
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Panel
let currentTopic = 'lever';

function renderPanel() {
  const t = topics[currentTopic];
  if (currentTopic === 'lever') {
    const sel = state.selected?.userData.label;
    panel.innerHTML = `
      <p>${sel ? `चुना गया: <b>${sel}</b>` : 'किसी हिस्से पर टैप करें। स्क्रीन पर उंगली से घुमाकर लीवर को हर तरफ़ से देखें।'}</p>
      <div class="row">
        <button data-act="zoom" ${sel ? '' : 'disabled'}>ज़ूम करें</button>
        <button data-act="transparent" class="${state.transparent ? 'on' : ''}">पारदर्शी</button>
        <button data-act="explode" class="${state.exploded ? 'on' : ''}">हिस्से अलग करें</button>
        <button data-act="add">वज़न जोड़ें</button>
        <button data-act="remove">वज़न हटाएँ</button>
        <button data-act="home">पूरा दृश्य</button>
      </div>`;
  } else if (currentTopic === 'physics') {
    panel.innerHTML = `
      <p>भौतिकी का सवाल लिखें।</p>
      <textarea id="q" rows="2"></textarea>
      <div class="row"><button data-act="solve">हल करें</button></div>
      <p id="out"></p>`;
  } else {
    panel.innerHTML = `<p>${t.note ?? ''}</p>`;
  }
}

async function solve() {
  const q = document.getElementById('q').value.trim();
  const out = document.getElementById('out');
  if (!q) { out.textContent = 'पहले सवाल लिखें।'; return; }
  out.textContent = 'हल हो रहा है...';
  out.textContent = (await solvePhysics(q)).message;
}

panel.addEventListener('click', (e) => {
  const act = e.target.closest('button')?.dataset.act;
  if (!act) return;
  if (act === 'zoom') zoomToSelected();
  if (act === 'transparent') { state.transparent = !state.transparent; applyStyle(); }
  if (act === 'explode') state.exploded = !state.exploded;
  if (act === 'add') { addWeight(); applyStyle(); }
  if (act === 'remove') { removeWeight(); applyStyle(); }
  if (act === 'home') { state.goal = { target: HOME_TARGET.clone(), pos: HOME_POS.clone() }; state.selected = null; applyStyle(); }
  if (act === 'solve') { solve(); return; }
  renderPanel();
});

function setTopic(key) {
  if (!topics[key]) return;
  currentTopic = key;
  document.querySelectorAll('#topics button').forEach((b) => b.classList.toggle('on', b.dataset.topic === key));
  wrap.style.display = topics[key].threeD ? '' : 'none';
  renderPanel();
}
document.getElementById('topics').addEventListener('click', (e) => {
  const key = e.target.closest('button')?.dataset.topic;
  if (key) setTopic(key);
});

// Commands for Jarvis later
registerCommand('openTopic', setTopic);
registerCommand('toggleTransparent', () => { state.transparent = !state.transparent; applyStyle(); renderPanel(); });
registerCommand('toggleExplode', () => { state.exploded = !state.exploded; renderPanel(); });

renderPanel();

// अपडेट बटन: वेब वर्ज़न हमेशा नया लोड हो, कैश को बाईपास करके
document.getElementById('upd').addEventListener('click', () => {
  location.href = location.pathname + '?v=' + Date.now();
});
