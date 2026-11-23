import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { kiosques } from './data.js';

// Le bâtiment est schématique : 24 × 24 m, niveau supérieur à 4,2 m.
// La mezzanine est un U ouvert vers l'avant, avec un vide au-dessus du hall.
export function createScene(container, onSelect) {
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#eff1eb');
    const camera = new THREE.OrthographicCamera(-18, 18, 16, -16, .1, 180);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); container.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.minZoom = .55; controls.maxZoom = 2.8; controls.maxPolarAngle = Math.PI / 2.08;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x909b87, 2.5));
    const sun = new THREE.DirectionalLight(0xfff5df, 2.5); sun.position.set(8, 25, 15); scene.add(sun);
    const root = new THREE.Group(); scene.add(root); const levels = [new THREE.Group(), new THREE.Group()]; levels.forEach(g => root.add(g));
    const meshes = [];
    function box(group, w, h, d, x, y, z, color) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: .86 })); m.position.set(x, y, z); group.add(m); return m; }
    function label(group, text, x, y, z, width = 2.5, color = '#254b3c') {
        const c = document.createElement('canvas'); c.width = 512; c.height = 128; const ctx = c.getContext('2d'); ctx.fillStyle = color; ctx.font = '600 48px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 256, 64);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false })); sprite.position.set(x, y, z); sprite.scale.set(width, width / 4, 1); group.add(sprite);
    }
    const y = 4.2;
    box(levels[0], 24, .3, 24, 0, -.2, 0, '#e5d7bc');
    box(levels[0], 24, 1, .2, 0, .35, -12, '#e7e3d9'); box(levels[0], .2, 1, 24, -12, .35, 0, '#e7e3d9');
    // Dalles latérales et galerie du fond, sans dalle au-dessus du vide central.
    box(levels[1], 7, .3, 24, -8.5, y - .2, 0, '#dfceb0'); box(levels[1], 7, .3, 24, 8.5, y - .2, 0, '#dfceb0'); box(levels[1], 10, .3, 4, 0, y - .2, -10, '#dfceb0');
    function rail(x1, z1, x2, z2) { const dx = x2 - x1, dz = z2 - z1, len = Math.hypot(dx, dz); for (const h of [.3, .65, 1.05]) { const m = box(levels[1], len, .045, .045, (x1 + x2) / 2, y + h, (z1 + z2) / 2, '#45564c'); m.rotation.y = -Math.atan2(dz, dx); } const n = Math.ceil(len / 2); for (let i = 0; i <= n; i++)box(levels[1], .055, 1.1, .055, x1 + dx * i / n, y + .52, z1 + dz * i / n, '#45564c'); }
    rail(-5, 12, -5, -8); rail(5, 12, 5, -8); rail(-5, -8, 5, -8);
    // Colonnes décoratives indicatives ; aucun escalier inventé.
    for (const x of [-5.3, 5.3]) for (const z of [-9, 0, 9]) box(levels[0], .42, 4, .42, x, 1.85, z, '#e7e4dc');
    label(levels[0], 'ENTRÉE / HALL', 0, .12, 10.5, 4);
    label(levels[1], 'GALERIE', 0, y + .35, -10, 3.2);
    kiosques.forEach(k => {
        const level = levels[k.etage];
        const base = k.etage * y;
        const kioskGroup = new THREE.Group();
        kioskGroup.position.set(k.x, base, k.z);
        kioskGroup.rotation.y = k.rotation ?? 0;
        level.add(kioskGroup);

        const floor = box(kioskGroup, k.largeur, .16, k.profondeur, 0, .04, 0, '#80a18b');
        meshes.push(floor);

        // Le comptoir fait face à l'allée intérieure à la mezzanine.
        box(kioskGroup, k.largeur * .72, .85, .65, 0, .5, 1, '#bc9569');
        box(kioskGroup, k.largeur * .82, 1.65, .32, 0, .86, -1.35, '#d7bb8c');
        for (const h of [.55, 1.05, 1.55]) {
            box(kioskGroup, k.largeur * .86, .08, .45, 0, h, -1.32, '#a7845d');
        }
        for (let i = 0; i < 3; i++) {
            box(kioskGroup, .24, .3, .24, -.6 + i * .6, 1.24, -1.27, '#ece7d4');
        }
        kioskGroup.traverse(object => {
            if (object.isMesh) object.userData.id = k.id;
        });
        label(level, k.id, k.x, base + 2.1, k.z, 1.75);
    });
    let mode = 'all';
    function reset() { camera.position.set(30, 31, 35); camera.zoom = 1; controls.target.set(0, mode === '1' ? y : 1.5, 0); camera.updateProjectionMatrix(); controls.update(); }
    function setMode(value) { mode = value; levels[0].visible = value !== '1'; levels[1].visible = value !== '0'; reset(); }
    function update(selected, isBusy) { meshes.forEach(m => m.material.color.set(m.userData.id === selected ? '#d3973b' : isBusy(m.userData.id) ? '#abb2b3' : '#80a18b')); }
    const ray = new THREE.Raycaster(), pointer = new THREE.Vector2(); let start = null;
    renderer.domElement.addEventListener('pointerdown', e => { start = { x: e.clientX, y: e.clientY }; });
    renderer.domElement.addEventListener('pointercancel', () => start = null);
    renderer.domElement.addEventListener('pointerup', e => { if (!start || Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6) { start = null; return; } start = null; const b = renderer.domElement.getBoundingClientRect(); pointer.set((e.clientX - b.left) / b.width * 2 - 1, -(e.clientY - b.top) / b.height * 2 + 1); ray.setFromCamera(pointer, camera); const candidates = []; levels.filter(g => g.visible).forEach(g => g.traverse(o => { if (o.isMesh) candidates.push(o); })); const hit = ray.intersectObjects(candidates, false)[0]; if (hit?.object.userData.id) onSelect(hit.object.userData.id); });
    const observer = new ResizeObserver(() => { const w = container.clientWidth, h = container.clientHeight; if (!w || !h) return; camera.left = -16 * w / h; camera.right = 16 * w / h; camera.top = 16; camera.bottom = -16; camera.updateProjectionMatrix(); renderer.setSize(w, h); }); observer.observe(container);
    reset(); renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });
    return { setMode, reset, update, dispose() { observer.disconnect(); renderer.setAnimationLoop(null); controls.dispose(); root.traverse(o => { o.geometry?.dispose(); if (o.material) { o.material.map?.dispose(); o.material.dispose(); } }); renderer.dispose(); renderer.domElement.remove(); } };
}
