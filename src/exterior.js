import * as THREE from 'three';

// Reconstitution schématique à partir des vues fournies, sans données de relevé.
// La façade donne vers +Z, la rue longe le bâtiment suivant l'axe X.
export function createExterior(scene) {
    const group = new THREE.Group(); group.name = 'Rue Wellington et ancienne banque';
    scene.add(group); group.visible = false;
    const building = new THREE.Group(); building.name = 'Banque à trouvailles'; group.add(building);
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const materials = new Map();
    function material(color) {
        if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: .92, transparent: true, opacity: 0 }));
        return materials.get(color);
    }
    function box(parent, w, h, d, x, y, z, color) {
        const mesh = new THREE.Mesh(geometry, material(color)); mesh.scale.set(w, h, d); mesh.position.set(x, y, z);
        mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh); return mesh;
    }
    function text(parent, value, x, y, z, w, h, color = '#736d60', background = '#d6cebb') {
        const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 128;
        const ctx = canvas.getContext('2d'); ctx.fillStyle = background; ctx.fillRect(0, 0, 1024, 128);
        ctx.fillStyle = color; ctx.font = '500 54px Figtree, Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(value, 512, 64, 980);
        const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
        const mat = new THREE.MeshStandardMaterial({ map, roughness: 1, transparent: true, opacity: 0 });
        materials.set(`text-${materials.size}`, mat);
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); mesh.position.set(x, y, z); parent.add(mesh);
    }
    function beam(parent, from, to, thickness, color) {
        const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
        const mesh = box(parent, thickness, a.distanceTo(b), thickness, ...a.clone().add(b).multiplyScalar(.5).toArray(), color);
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize());
    }
    function window(parent, x, y, z, w = 1.7, h = 2.5, trim = '#d7d1c3') {
        box(parent, w + .32, h + .35, .25, x, y, z, trim);
        box(parent, w, h, .12, x, y, z + .17, '#425358');
        box(parent, .07, h, .06, x, y, z + .26, trim);
        box(parent, w, .08, .06, x, y + .25, z + .26, trim);
        box(parent, w + .55, .16, .5, x, y - h / 2 - .12, z + .22, trim);
    }

    // Corps en brique ocre, soubassement et couronnement de pierre.
    const stone = '#c9c2ae', lightStone = '#ded8c8', brick = '#9a8061';
    box(building, 24.6, 12.5, .5, 0, 6.1, -12.3, brick);
    box(building, .5, 12.5, 24.6, -12.3, 6.1, 0, brick);
    box(building, .5, 12.5, 24.6, 12.3, 6.1, 0, brick);
    box(building, 24.6, 12.5, .6, 0, 6.1, 12.3, brick);
    box(building, 25.4, .7, 25.4, 0, 12.4, 0, lightStone);
    box(building, 24.5, .24, 24.5, 0, 12.9, 0, '#77756c');
    for (const x of [-12.3, 12.3]) box(building, .8, 1.9, 24.6, x, .75, 0, stone);
    for (const x of [-8.4, 8.4]) box(building, 7.8, 1.9, .9, x, .75, 12.6, stone);
    // Assises de maçonnerie, discrètes à cette échelle.
    for (let y = 2.2; y < 10; y += .48) box(building, 24, .025, .025, 0, y, 12.62, '#af9678');
    for (const x of [-8, 8]) {
        window(building, x, 4, 12.7, 3.9, 3.4, stone);
        window(building, x, 8.3, 12.7, 3.9, 2.3, stone);
    }
    box(building, 5.1, 8.1, .4, 0, 5.3, 12.8, stone);
    box(building, 4.45, 7.5, .2, 0, 5.3, 13.04, '#24383b');
    box(building, .16, 7.5, .16, 0, 5.3, 13.2, '#b6aa8f');
    box(building, 4.45, .16, .16, 0, 7.3, 13.2, '#b6aa8f');
    for (const x of [-.3, .3]) box(building, .1, 1.1, .12, x, 3.8, 13.35, '#c1ad77');
    text(building, '93', 0, 8.4, 13.2, 1.1, .45, '#d3c8aa', '#24383b');

    // Portique à quatre colonnes et fronton triangulaire, repère de la photo.
    const shaft = new THREE.CylinderGeometry(.63, .78, 8.4, 20);
    const capitalRing = new THREE.TorusGeometry(.28, .09, 6, 16);
    for (const x of [-9, -3.2, 3.2, 9]) {
        box(building, 2.1, .4, 2.1, x, 1.45, 15.5, stone);
        box(building, 1.7, .26, 1.7, x, 1.78, 15.5, lightStone);
        const column = new THREE.Mesh(shaft, material(lightStone)); column.position.set(x, 6.1, 15.5); column.castShadow = true; building.add(column);
        box(building, 1.8, .38, 1.8, x, 10.4, 15.5, stone);
        box(building, 2.2, .22, 2, x, 10.7, 15.5, lightStone);
        for (const dx of [-.65, .65]) {
            const scroll = new THREE.Mesh(capitalRing, material('#b0aa99')); scroll.position.set(x + dx, 10.38, 16.39); building.add(scroll);
        }
    }
    box(building, 26, 1.2, 4.6, 0, 11.4, 14.3, stone);
    box(building, 26.8, .35, 4.9, 0, 12.15, 14.3, lightStone);
    text(building, 'BANK OF MONTREAL', 0, 11.5, 16.63, 20.5, .85);
    const triangle = new THREE.Shape(); triangle.moveTo(-13, 0); triangle.lineTo(0, 4.1); triangle.lineTo(13, 0); triangle.closePath();
    const pediment = new THREE.Mesh(new THREE.ExtrudeGeometry(triangle, { depth: 3, bevelEnabled: false }), material(lightStone));
    pediment.position.set(0, 12.35, 13.5); pediment.castShadow = true; building.add(pediment);
    beam(building, [-13.5, 12.35, 16.6], [0, 16.65, 16.6], .35, stone);
    beam(building, [0, 16.65, 16.6], [13.5, 12.35, 16.6], .35, stone);
    beam(building, [-13.5, 12.35, 16.6], [13.5, 12.35, 16.6], .35, stone);
    for (let i = 0; i < 6; i++) box(building, 20 - i * .45, .22, 1, 0, -.05 + i * .22, 20.6 - i * .9, stone);
    // Équipements et acrotères du toit plat visibles depuis la rue.
    for (const [x, z, w, d] of [[-6, -6, 2.7, 2], [6, -8, 1.5, 1.6]]) box(building, w, .8, d, x, 13.3, z, '#aaa79d');
    building.traverse(o => { if (o.isMesh) o.userData.enterMarket = true; });

    function neighbour(x, w, depth, height, color, trim, floors, name) {
        const block = new THREE.Group(); group.add(block);
        const front = 12.6;
        box(block, w, height, depth, x, height / 2 - .3, front - depth / 2, color);
        box(block, w + .4, .45, depth + .4, x, height, front - depth / 2, trim);
        box(block, w - 1, .12, depth - 1, x, height + .3, front - depth / 2, '#85847c');
        box(block, w + .4, .4, .8, x, 4.2, front + .1, trim);
        const count = Math.max(3, Math.round(w / 3.8));
        for (let floor = 1; floor < floors; floor++) for (let col = 0; col < count; col++) {
            const wx = x - w / 2 + (col + .5) * w / count;
            window(block, wx, 4.3 + floor * (height - 4.3) / floors, front + .1, 1.6, 2.2, trim);
        }
        for (let col = 0; col < count; col++) window(block, x - w / 2 + (col + .5) * w / count, 2, front + .1, w / count - .6, 3, trim);
        if (name) {
            box(block, w - .8, .75, .3, x, 3.65, front + .3, '#4b534c');
            text(block, name, x, 3.65, front + .47, w - 1.8, .55, '#ece9dd', '#4b534c');
        }
        box(block, 3, .8, 2, x + w / 5, height + .7, front - depth / 2, '#a9aaa1');
        return block;
    }
    // Gabarits et palette repris des deux rangées visibles sur l'image aérienne.
    neighbour(-26, 22, 32, 16.5, '#887b70', '#b6b7ae', 3, 'WELLINGTON');
    neighbour(-47.5, 20, 28, 22, '#b9b8ab', '#dbd8c9', 5, '');
    neighbour(28, 25, 28, 14.5, '#765e51', '#c4c0b3', 4, 'LA BUVETTE DU CENTRO');
    neighbour(52, 22, 25, 13, '#967260', '#b8bdaf', 3, 'BALADI');
    // Rappel de la brique rouge dans les passages latéraux.
    box(group, .3, 12.5, 25, -14.8, 5.9, -1, '#8a4e40');
    box(group, .3, 12, 24, 15.3, 5.7, -1, '#8c5142');

    box(group, 154, .3, 110, 0, -.8, 1, '#b8bdab');
    box(group, 154, .12, 13, 0, -.45, 29.5, '#777a75');
    for (const z of [20.8, 38]) box(group, 154, .3, 4.2, 0, -.3, z, '#cbc9bd');
    for (const z of [23, 36]) box(group, 154, .3, .2, 0, -.14, z, '#d9d4c6');
    for (let x = -70; x <= 70; x += 10) box(group, 4, .015, .14, x, -.375, 29.5, '#e6dfc8');
    for (let x = -70; x <= 70; x += 3) for (const z of [20.8, 38]) box(group, .025, .015, 4.2, x, -.14, z, '#aba99f');
    const opposite = new THREE.Group(); opposite.rotation.y = Math.PI; opposite.position.set(0, 0, 53); group.add(opposite);
    for (const [x, w, height, color] of [[-48, 23, 13, '#a29480'], [-22, 24, 11, '#a37a66'], [5, 25, 15, '#9a9c92'], [32, 23, 12, '#b0a28a'], [56, 22, 10, '#98796c']]) {
        const block = neighbour(x, w, 20, height, color, '#cfccbc', 3, '');
        group.remove(block); opposite.add(block);
    }
    function tree(x, z, height = 9, tone = '#657958') {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.25, .4, height * .6, 6), material('#77634c')); trunk.position.set(x, height * .3, z); group.add(trunk);
        const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(height * .35, 1), material(tone)); crown.position.set(x, height * .75, z); crown.scale.y = 1.2; crown.castShadow = true; group.add(crown);
    }
    for (const [x, z, h] of [[-13.8, 15, 10], [12.9, 15, 12], [-37, 20, 9], [40, 20, 10], [-22, 39, 8], [24, 39, 9]]) tree(x, z, h);
    for (let i = 0; i < 16; i++) tree(-57 + i * 7.3, -32 - (i % 3) * 7, 10 + (i % 4) * 1.6, ['#647b58', '#778461', '#956e48', '#536c52'][i % 4]);
    // Lampadaires verts et voitures stationnées, sans animation distrayante.
    for (const x of [-10, 35, -48]) {
        box(group, .18, 7.5, .18, x, 3.6, 21.2, '#35574b');
        const globe = new THREE.Mesh(new THREE.SphereGeometry(.5, 10, 8), material('#ded9bc')); globe.position.set(x, 7.5, 21.2); group.add(globe);
    }
    for (const [x, z, color] of [[-26, 25, '#344b4c'], [12, 25, '#7b3430'], [46, 34, '#d7d2c4'], [-45, 34, '#596274']]) {
        box(group, 4.6, 1.1, 1.9, x, .3, z, color); box(group, 2.7, .65, 1.7, x - .15, 1.13, z, '#435458');
        for (const dx of [-1.4, 1.4]) for (const dz of [-.88, .88]) box(group, .65, .65, .18, x + dx, -.02, z + dz, '#353734');
    }

    let amount = 0;
    return {
        group,
        get amount() { return amount; },
        update(relativeZoom, flat) {
            // La transition commence dès qu'on dépasse le cadrage intérieur complet.
            amount = flat ? 0 : 1 - THREE.MathUtils.smoothstep(relativeZoom, .45, 1);
            group.visible = amount > .002;
            if (!group.visible) return;
            materials.forEach(mat => { mat.opacity = amount; mat.depthWrite = amount > .7; });
        }
    };
}
