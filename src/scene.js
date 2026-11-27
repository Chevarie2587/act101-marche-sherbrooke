import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { kiosques } from './data.js';
import { createExterior } from './exterior.js';

// Le bâtiment est schématique : 24 × 24 m, niveau supérieur à 4,2 m.
// La mezzanine est un U ouvert vers l'avant, avec un vide au-dessus du hall.
export function createScene(container, onSelect) {
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#eeeae3');
    const camera = new THREE.OrthographicCamera(-18, 18, 16, -16, .1, 360);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); container.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.minZoom = .32; controls.maxZoom = 2.8; controls.maxPolarAngle = Math.PI / 2.08;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x909b87, 2.5));
    const sun = new THREE.DirectionalLight(0xfff5df, 2.5); sun.position.set(8, 25, 15); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22 }); sun.shadow.bias = -.001; scene.add(sun);
    const root = new THREE.Group(); scene.add(root); const levels = [new THREE.Group(), new THREE.Group()]; levels.forEach(g => root.add(g));
    const records = [];
    const exterior = createExterior(scene);
    const money = n => new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(n);
    const pins = document.createElement('div'); pins.className = 'map-pins'; container.appendChild(pins);
    const tooltip = document.createElement('div'); tooltip.className = 'booth-tooltip'; tooltip.id = 'booth-tooltip'; tooltip.setAttribute('role', 'tooltip'); tooltip.hidden = true; container.appendChild(tooltip);
    const entry = document.createElement('button'); entry.type = 'button'; entry.className = 'exterior-entry'; entry.hidden = true;
    entry.innerHTML = '<strong>Banque à trouvailles</strong><span>Entrer dans le marché</span>';
    entry.onclick = () => { reset(); container.setAttribute('tabindex', '-1'); container.focus({ preventScroll: true }); };
    container.appendChild(entry);
    let mode = 'all', selectedId = null, hoverId = null, isBusy = () => false, reservationFor = () => null;
    let motion = null, disposed = false, outside = false, initialized = false;
    let interiorZoom = 1;
    const interiorBounds = new THREE.Box3();
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    function box(group, w, h, d, x, y, z, color) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: .86 })); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; group.add(m); return m; }
    function label(group, text, x, y, z, width = 2.5, color = '#254b3c') {
        const c = document.createElement('canvas'); c.width = 512; c.height = 128; const ctx = c.getContext('2d'); ctx.fillStyle = color; ctx.font = '600 48px Figtree, Arial'; ctx.font = `600 ${Math.min(48, 48 * 480 / ctx.measureText(text).width)}px Figtree, Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 256, 64);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false })); sprite.position.set(x, y, z); sprite.scale.set(width, width / 4, 1); group.add(sprite);
    }
    function plant(group, x, base, z, scale = 1) {
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(.26 * scale, .19 * scale, .45 * scale, 12), new THREE.MeshStandardMaterial({ color: '#b77456' }));
        pot.position.set(x, base + .225 * scale, z); group.add(pot);
        for (let i = 0; i < 5; i++) {
            const angle = i * Math.PI * 2 / 5;
            const leaf = new THREE.Mesh(new THREE.SphereGeometry(.25 * scale, 8, 6), new THREE.MeshStandardMaterial({ color: i % 2 ? '#6e8650' : '#42654b', roughness: .9 }));
            leaf.scale.set(.7, 1.9, .65);
            leaf.position.set(x + Math.cos(angle) * .16 * scale, base + .65 * scale, z + Math.sin(angle) * .16 * scale);
            leaf.rotation.z = Math.cos(angle) * .5; group.add(leaf);
        }
    }
    const y = 4.2;
    box(levels[0], 24, .3, 24, 0, -.2, 0, '#e5d7bc');
    // Lames de bois, tapis du hall et coins de rencontre.
    for (let x = -11.5; x < 12; x += .8) box(levels[0], .025, .012, 24, x, -.043, 0, '#cdbb9c');
    box(levels[0], 6, .035, 11, 0, -.025, 1, '#c99b78');
    for (const x of [-3.6, 3.6]) {
        box(levels[0], .6, .45, 3, x, .2, 5, '#b58b60');
        box(levels[0], .65, .12, 3.1, x, .48, 5, '#dbc2a0');
        plant(levels[0], x, 0, 8, 1.6);
    }
    box(levels[0], 24, 1, .2, 0, .35, -12, '#e7e3d9'); box(levels[0], .2, 1, 24, -12, .35, 0, '#e7e3d9');
    // Dalles latérales et galerie du fond, sans dalle au-dessus du vide central.
    box(levels[1], 7, .3, 24, -8.5, y - .2, 0, '#dfceb0'); box(levels[1], 7, .3, 24, 8.5, y - .2, 0, '#dfceb0'); box(levels[1], 10, .3, 4, 0, y - .2, -10, '#dfceb0');
    function rail(x1, z1, x2, z2) { const dx = x2 - x1, dz = z2 - z1, len = Math.hypot(dx, dz); for (const h of [.3, .65, 1.05]) { const m = box(levels[1], len, .045, .045, (x1 + x2) / 2, y + h, (z1 + z2) / 2, '#45564c'); m.rotation.y = -Math.atan2(dz, dx); } const n = Math.ceil(len / 2); for (let i = 0; i <= n; i++)box(levels[1], .055, 1.1, .055, x1 + dx * i / n, y + .52, z1 + dz * i / n, '#45564c'); }
    rail(-5, 12, -5, -8); rail(5, 12, 5, -8); rail(-5, -8, 5, -8);
    // Colonnes décoratives indicatives ; aucun escalier inventé.
    for (const x of [-5.3, 5.3]) for (const z of [-9, 0, 9]) box(levels[0], .42, 4, .42, x, 1.85, z, '#e7e4dc');
    label(levels[0], 'Entrée', 0, .12, 10.5, 3);
    // Guirlandes au-dessus du hall, conservées avec le niveau du bas.
    for (const z of [-5, 2, 9]) {
        const points = [];
        for (let i = 0; i <= 20; i++) {
            const x = -4.8 + i * .48, height = 6.2 - .7 * Math.sin(i / 20 * Math.PI);
            points.push(new THREE.Vector3(x, height, z));
            if (i % 2 === 0) {
                const bulb = new THREE.Mesh(new THREE.SphereGeometry(.1, 8, 6), new THREE.MeshStandardMaterial({ color: '#ffe1a1', emissive: '#ffc465', emissiveIntensity: 1.5 }));
                bulb.position.set(x, height - .12, z); levels[0].add(bulb);
            }
        }
        levels[0].add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: '#4e5146' })));
    }
    for (const x of [-5.5, 5.5]) for (const z of [-6, 3, 10]) plant(levels[1], x, y, z, 1.05);
    kiosques.forEach(k => {
        const level = levels[k.etage];
        const base = k.etage * y;
        const kioskGroup = new THREE.Group();
        kioskGroup.position.set(k.x, base, k.z);
        kioskGroup.rotation.y = k.rotation ?? 0;
        level.add(kioskGroup);

        const floor = box(kioskGroup, k.largeur, .16, k.profondeur, 0, .04, 0, k.regulier ? '#c9b4dd' : '#80a18b');
        floor.userData.regulier = k.regulier;

        // Le comptoir fait face à l'allée intérieure à la mezzanine.
        box(kioskGroup, k.largeur * .72, .85, .65, 0, .5, 1, '#bc9569');
        box(kioskGroup, k.largeur * .66, .58, .025, 0, .52, 1.34, k.regulier ? '#c9b4dd' : '#80a18b');
        box(kioskGroup, k.largeur * .82, 1.65, .32, 0, .86, -1.35, '#d7bb8c');
        for (const h of [.55, 1.05, 1.55]) {
            box(kioskGroup, k.largeur * .86, .08, .45, 0, h, -1.32, '#a7845d');
        }
        for (let i = 0; i < 3; i++) {
            box(kioskGroup, .24, .3 + (i % 2) * .13, .24, -.6 + i * .6, 1.24, -1.27, ['#eee3c9', '#b77456', '#70846a'][i]);
        }
        // Table incluse, pots et enseigne de bois au-dessus des présentoirs.
        box(kioskGroup, 1.4, .09, .65, 0, .95, .05, '#e6cba3');
        for (const x of [-.55, .55]) box(kioskGroup, .06, .85, .5, x, .48, .05, '#4e5146');
        plant(kioskGroup, k.largeur / 2 - .35, 0, -.7, .8);
        box(kioskGroup, k.largeur * .88, .35, .12, 0, 2.45, -1.35, k.regulier ? '#c9b4dd' : '#80a18b');
        for (const x of [-k.largeur * .4, k.largeur * .4]) box(kioskGroup, .06, .8, .06, x, 2.05, -1.35, '#ad885e');
        kioskGroup.traverse(object => {
            if (object.isMesh) object.userData.id = k.id;
        });
        // A border stays readable even when a counter covers the floor.
        const outline = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(k.largeur + .06, .18, k.profondeur + .06)), new THREE.LineBasicMaterial({ color: '#70452f' }));
        outline.position.set(0, .16, 0); kioskGroup.add(outline); outline.visible = false;
        const pin = document.createElement('button'); pin.type = 'button'; pin.className = 'map-pin'; pin.dataset.booth = k.id; pin.textContent = k.id;
        pin.onclick = () => { showHover(null); onSelect(k.id); };
        pin.addEventListener('pointerenter', () => showHover(k.id));
        pin.addEventListener('pointerleave', () => showHover(null));
        pin.addEventListener('focus', () => showHover(k.id));
        pin.addEventListener('blur', () => showHover(null));
        pins.appendChild(pin);
        records.push({ k, pin, floor, outline, point: new THREE.Vector3() });
    });
    function paint() {
        records.forEach(r => {
            const selected = r.k.id === selectedId, busy = isBusy(r.k.id), hover = r.k.id === hoverId;
            const unavailable = r.k.regulier || busy;
            const color = r.k.regulier ? '#c9b4dd' : busy ? '#756d68' : selected ? '#70452f' : hover ? '#c3a184' : '#80a18b';
            r.floor.material.color.set(color);
            r.outline.visible = !unavailable && (selected || hover);
            r.pin.classList.toggle('is-selected', selected); r.pin.classList.toggle('is-busy', busy && !r.k.regulier); r.pin.classList.toggle('is-regular', r.k.regulier);
            r.pin.disabled = unavailable;
            r.pin.setAttribute('aria-pressed', String(selected)); r.pin.setAttribute('aria-disabled', String(unavailable));
            r.pin.setAttribute('aria-label', `Kiosque ${r.k.id}, ${r.k.etage ? 'mezzanine' : 'rez-de-chaussée'}, ${money(r.k.prix)} par jour, ${r.k.regulier ? 'régulier, non réservable' : busy ? 'réservé ou dates invalides' : selected ? 'sélectionné' : 'disponible'}`);
        });
    }
    function showHover(id) {
        if (outside || matchMedia('(hover: none), (max-width: 760px)').matches) id = null;
        hoverId = id; tooltip.hidden = !id;
        records.forEach(r => r.pin.removeAttribute('aria-describedby'));
        const r = records.find(r => r.k.id === id);
        if (r) {
            const reservation = reservationFor(r.k.id);
            if (r.k.regulier || reservation) {
                const title = document.createElement('strong'); title.textContent = `Kiosque ${r.k.id}`;
                const company = document.createElement('span'); company.className = 'tooltip-company';
                company.textContent = r.k.regulier ? r.k.entreprise : (typeof reservation.entreprise === 'string' && reservation.entreprise.trim() ? reservation.entreprise : 'Entreprise non précisée');
                const status = document.createElement('span'); status.className = 'tooltip-status';
                status.textContent = r.k.regulier ? 'Régulier' : 'Réservé';
                tooltip.replaceChildren(title, company, status);
            } else tooltip.innerHTML = `<strong>Kiosque ${r.k.id}</strong><b>${money(r.k.prix)} <small>/ jour</small></b><span>Table incluse</span>`;
            r.pin.setAttribute('aria-describedby', tooltip.id);
        }
        paint();
    }
    function flyTo(target, position, zoom = 1) {
        if (reducedMotion) { controls.target.copy(target); camera.position.copy(position); camera.zoom = zoom; camera.updateProjectionMatrix(); controls.update(); return; }
        motion = { from: camera.position.clone(), targetFrom: controls.target.clone(), to: position, targetTo: target, zoomFrom: camera.zoom, zoomTo: zoom, start: performance.now() };
    }
    function fittedZoom(position, target) {
        const probe = camera.clone(); probe.position.copy(position); probe.zoom = 1; probe.lookAt(target); probe.updateMatrixWorld(true); probe.updateProjectionMatrix();
        let left = Infinity, right = -Infinity, top = -Infinity, bottom = Infinity;
        const point = new THREE.Vector3();
        for (const x of [interiorBounds.min.x, interiorBounds.max.x]) for (const y of [interiorBounds.min.y, interiorBounds.max.y]) for (const z of [interiorBounds.min.z, interiorBounds.max.z]) {
            point.set(x, y, z).project(probe);
            left = Math.min(left, point.x); right = Math.max(right, point.x); top = Math.max(top, point.y); bottom = Math.min(bottom, point.y);
        }
        // L'intérieur occupe jusqu'à 90 % du cadre, quel que soit le format d'écran.
        return THREE.MathUtils.clamp(1.8 / Math.max(right - left, top - bottom), controls.minZoom, controls.maxZoom);
    }
    function frame() {
        const w = container.clientWidth, h = container.clientHeight; if (!w || !h) return;
        const halfWidth = Math.max(20, 15 * w / h);
        const halfHeight = halfWidth * h / w;
        camera.left = -halfWidth; camera.right = halfWidth; camera.top = halfHeight; camera.bottom = -halfHeight; camera.updateProjectionMatrix(); renderer.setSize(w, h);
        if (initialized && !motion) {
            const ratio = camera.zoom / interiorZoom;
            interiorZoom = fittedZoom(camera.position, controls.target);
            camera.zoom = THREE.MathUtils.clamp(interiorZoom * ratio, controls.minZoom, controls.maxZoom); camera.updateProjectionMatrix();
        }
    }
    function reset() {
        const target = interiorBounds.getCenter(new THREE.Vector3());
        const position = target.clone().add(new THREE.Vector3(29, 29, 34));
        interiorZoom = fittedZoom(position, target);
        if (!initialized) {
            initialized = true; camera.position.copy(position); controls.target.copy(target); camera.zoom = interiorZoom; camera.updateProjectionMatrix(); controls.update();
        } else flyTo(target, position, interiorZoom);
    }
    function setMode(value) {
        mode = value;
        levels[0].visible = value !== '1'; levels[1].visible = value !== '0';
        interiorBounds.makeEmpty(); levels.filter(g => g.visible).forEach(g => interiorBounds.union(new THREE.Box3().setFromObject(g)));
        showHover(null); frame(); reset();
    }
    function zoom(factor) { motion = null; camera.zoom = THREE.MathUtils.clamp(camera.zoom * factor, controls.minZoom, controls.maxZoom); camera.updateProjectionMatrix(); }
    function update(selected, busy, reservations = () => null) { selectedId = selected; isBusy = busy; reservationFor = reservations; paint(); if (hoverId) showHover(hoverId); }
    function canSelect(id) { const k = kiosques.find(k => k.id === id); return !!k && !k.regulier && !isBusy(id); }
    const ray = new THREE.Raycaster(), pointer = new THREE.Vector2(); let start = null;
    renderer.domElement.addEventListener('pointerdown', e => { start = { x: e.clientX, y: e.clientY }; });
    renderer.domElement.addEventListener('pointercancel', () => start = null);
    function hitAt(e) {
        const b = renderer.domElement.getBoundingClientRect(); pointer.set((e.clientX - b.left) / b.width * 2 - 1, -(e.clientY - b.top) / b.height * 2 + 1); ray.setFromCamera(pointer, camera);
        if (outside) {
            const hit = ray.intersectObject(exterior.group, true)[0];
            return hit?.object.userData.enterMarket ? '__market__' : null;
        }
        const candidates = []; levels.filter(g => g.visible).forEach(g => g.traverse(o => { if (o.isMesh) candidates.push(o); }));
        const id = ray.intersectObjects(candidates, false)[0]?.object.userData.id;
        const k = kiosques.find(k => k.id === id);
        return k ? id : null;
    }
    renderer.domElement.addEventListener('pointermove', e => { if (e.buttons || e.pointerType === 'touch') return; const id = hitAt(e); if (id !== hoverId) showHover(id === '__market__' ? null : id); renderer.domElement.style.cursor = id === '__market__' || canSelect(id) ? 'pointer' : id ? 'not-allowed' : 'grab'; });
    renderer.domElement.addEventListener('pointerleave', () => showHover(null));
    renderer.domElement.addEventListener('pointerup', e => { if (!start || Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6) { start = null; return; } start = null; const id = hitAt(e); if (id === '__market__') reset(); else if (canSelect(id)) { showHover(null); onSelect(id); } });
    controls.addEventListener('start', () => { motion = null; showHover(null); });
    function positionPins() {
        const w = container.clientWidth, h = container.clientHeight;
        records.forEach(r => {
            const visible = mode === 'all' || r.k.etage === Number(mode);
            r.point.set(r.k.x, r.k.etage * y + 2.9, r.k.z);
            r.point.project(camera);
            const x = (r.point.x + 1) * w / 2, yPos = (-r.point.y + 1) * h / 2;
            r.pin.hidden = outside || !visible || r.point.z < -1 || r.point.z > 1 || x < 22 || x > w - 22 || yPos < 16 || yPos > h - 16;
            r.pin.style.opacity = String(1 - Math.min(1, exterior.amount * 2));
            r.pin.style.transform = `translate(${x}px, ${yPos}px) translate(-50%, -50%)`;
            r.pin.style.zIndex = r.k.id === selectedId ? '3' : r.k.etage ? '2' : '1';
            if (r.k.id === hoverId) { tooltip.style.left = `${Math.max(102, Math.min(w - 102, x))}px`; tooltip.style.top = `${Math.max(148, yPos - 24)}px`; }
        });
        entry.hidden = !outside || exterior.amount < .85;
        if (!entry.hidden) {
            const anchor = new THREE.Vector3(0, 18, 5).project(camera);
            const x = (anchor.x + 1) * w / 2, y = (-anchor.y + 1) * h / 2;
            entry.style.left = `${THREE.MathUtils.clamp(x, 105, Math.max(105, w - 105))}px`;
            entry.style.top = `${THREE.MathUtils.clamp(y, 35, Math.max(35, h - 80))}px`;
        }
    }
    function updateExterior() {
        exterior.update(camera.zoom / interiorZoom, false);
        // Recul réel en plus du zoom orthographique : le premier plan du quartier
        // doit rester devant la caméra, même quand toute la rue est affichée.
        if (exterior.amount > .002) {
            const offset = camera.position.clone().sub(controls.target);
            const distance = 100 + exterior.amount * 100;
            if (offset.length() < distance) camera.position.copy(controls.target).add(offset.setLength(distance));
        }
        root.visible = exterior.amount < .999;
        const next = exterior.amount > .5;
        container.dataset.view = next ? 'exterior' : 'interior';
        if (next !== outside) { outside = next; showHover(null); }
    }
    const observer = new ResizeObserver(frame); observer.observe(container);
    setMode('all');
    renderer.setAnimationLoop(() => {
        if (disposed || !container.clientWidth || !container.clientHeight) return;
        if (motion) {
            const t = THREE.MathUtils.clamp((performance.now() - motion.start) / 550, 0, 1), ease = 1 - Math.pow(1 - t, 3);
            camera.position.lerpVectors(motion.from, motion.to, ease); controls.target.lerpVectors(motion.targetFrom, motion.targetTo, ease); camera.zoom = THREE.MathUtils.lerp(motion.zoomFrom, motion.zoomTo, ease); camera.updateProjectionMatrix();
            if (t === 1) motion = null;
        }
        controls.update(); updateExterior(); renderer.render(scene, camera); positionPins();
    });
    return { setMode, zoom, reset, update, dispose() {
        disposed = true; observer.disconnect(); renderer.setAnimationLoop(null); controls.dispose();
        const geometries = new Set(), materials = new Set();
        scene.traverse(o => { if (o.geometry) geometries.add(o.geometry); if (o.material) materials.add(o.material); });
        geometries.forEach(g => g.dispose()); materials.forEach(m => { m.map?.dispose(); m.dispose(); });
        sun.shadow.map?.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove(); pins.remove(); tooltip.remove(); entry.remove();
    } };
}
