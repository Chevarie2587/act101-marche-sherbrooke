import './style.css';
import { dateField, initDatePicker } from './calendar.js';
import { contact, kiosques, equipements, tableIncluse } from './data.js';

const app = document.querySelector('#app');
const money = n => new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(n);
const storageKey = 'mps-reservations-v1';
let scene = null;
let cleanup = () => {};

function validDate(s) {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const date = new Date(s + 'T12:00:00Z');
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === s;
}
function read() {
    try {
        const entries = JSON.parse(localStorage.getItem(storageKey) || '[]');
        return Array.isArray(entries) ? entries.filter(v => v && typeof v.id === 'string' && typeof v.kiosque === 'string' && validDate(v.debut) && validDate(v.fin)).map(v => ({ ...v, kiosque: kiosques.find(k => k.ancienId === v.kiosque)?.id || v.kiosque })) : [];
    } catch { return []; }
}
function today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function days(a, b) {
    return validDate(a) && validDate(b) && b >= a ? Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000) + 1 : 0;
}
const dateText = value => new Intl.DateTimeFormat('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value + 'T12:00:00'));
const levelText = k => k.etage ? 'Mezzanine' : 'Rez-de-chaussée';
const escapeHtml = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${({ calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18"/>', menu: '<path d="M4 6h16M4 12h16M4 18h16"/>', plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>', reset: '<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>', close: '<path d="m6 6 12 12M6 18 18 6"/>', eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>', pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>' })[name] || ''}</svg>`;
const navigation = page => `<a href="#/" ${page === 'home' ? 'aria-current="page"' : ''}>Le marché</a><a href="#/contact" ${page === 'contact' ? 'aria-current="page"' : ''}>Contact</a>`;

const header = page => `<a class="skip" href="#main">Aller au contenu</a>
<header><div class="wrap header-inner">
    <a class="brand" href="#/">Banque à trouvailles<small>SHERBROOKE</small></a>
    <nav aria-label="Navigation principale">
        <div class="nav-links">${navigation(page)}</div>
        <details class="nav-menu"><summary>${icon('menu')}<span>Menu</span></summary><div class="nav-popover">${navigation(page)}</div></details>
        <div class="header-actions"><a class="btn small" href="#/reservation" ${page === 'reservation' ? 'aria-current="page"' : ''}>${icon('calendar')}Réserver un kiosque</a>
        <a class="btn reservation-shortcut" id="my-reservations" href="#/reservation?mes-reservations=1" aria-label="Mes réservations" title="Mes réservations" ${read().length ? '' : 'hidden'}><img src="${import.meta.env.BASE_URL}reservation.png" width="24" height="24" alt=""></a></div>
    </nav>
</div></header>`;
const footer = () => `<footer><div class="wrap footer-inner"><span>© 2026 Banque à trouvailles. Tous droits réservés.</span><a href="#/contact">Une question? Contactez-nous</a></div></footer>`;

function home() {
    const events = [
        ['Rencontres', 'Entre entreprises d’ici', 'Échangez entre entreprises, partagez votre expérience et développez votre réseau local.'],
        ['Artisanat', 'Le week-end des créateurs', 'Céramique, illustrations et objets faits main : découvrez les créations et les gens derrière.'],
        ['Temps des fêtes', 'Les cadeaux d’ici', 'Créations artisanales et coffrets locaux pour trouver un cadeau qui a une histoire.'],
        ['Découverte', 'La première rencontre', 'Visitez le lieu et faites connaissance avec les premiers exposants.'],
        ['Saveurs locales', 'Les découvertes gourmandes', 'Dégustations et produits locaux à rapporter chez soi.'],
        ['Seconde main', 'La chasse aux trouvailles', 'Objets vintage, décoration et seconde main : dénichez votre prochaine trouvaille.'],
        ['Ateliers', 'Créer, réparer, réinventer', 'Avec les artisans, apprenez à donner une nouvelle vie aux objets.']
    ];
    return `<main id="main" class="home-page">
    <section class="home-hero" aria-labelledby="home-title">
        <img class="home-cover" src="${import.meta.env.BASE_URL}marche.jpg" alt="Illustration du marché imaginé dans l’ancienne banque, avec ses comptoirs en bois et sa mezzanine." fetchpriority="high" width="1440" height="1080">
        <div class="wrap home-hero-inner">
            <h1 id="home-title"><span>Banque</span> <span>à trouvailles</span></h1>
            <a class="btn" href="#/reservation">Réserver un kiosque</a>
        </div>
    </section>
    <section id="le-lieu" class="wrap home-place" tabindex="-1" aria-labelledby="place-title">
        <h2 id="place-title">Une nouvelle façon d’investir local.</h2>
        <p>Un projet de marché dans une ancienne banque, au cœur de Sherbrooke. Un lieu pour présenter vos créations, rencontrer votre clientèle et échanger entre entreprises d’ici.</p>
    </section>
    <section class="wrap home-spaces" aria-labelledby="spaces-title">
        <a class="home-model" href="#/reservation" aria-label="Choisir un kiosque dans le plan 3D"><img src="${import.meta.env.BASE_URL}kiosques-3d.png" alt="Aperçu du modèle 3D : kiosques autour d’un hall central et mezzanine ouverte." width="900" height="541" loading="lazy"></a>
        <div class="home-spaces-copy"><h2 id="spaces-title">Un kiosque<br>à votre image.</h2><p>Explorez les lieux en 3D et choisissez votre espace parmi les ${kiosques.length} kiosques.</p><a class="btn" href="#/reservation">Choisir mon kiosque</a></div>
    </section>
    <section class="home-equipment" aria-labelledby="equipment-title"><div class="wrap home-equipment-layout"><h2 id="equipment-title">Une table est fournie gratuitement avec chaque réservation.</h2><div class="home-equipment-copy"><p>Besoin de plus? Ajoutez des chaises, un réfrigérateur ou un présentoir.</p></div></div></section>
    <section class="home-gatherings" aria-labelledby="events-title"><div class="wrap">
        <div class="home-events-heading"><h2 id="events-title">Programmation découvertes</h2><div class="event-navigation"><button type="button" class="event-arrow" id="events-prev" aria-label="Événements précédents" aria-controls="events-track">←</button><button type="button" class="event-arrow" id="events-next" aria-label="Événements suivants" aria-controls="events-track">→</button></div></div>
        <div class="events-track" id="events-track" role="region" aria-roledescription="carrousel" aria-labelledby="events-title" tabindex="0">
            ${events.map(([category, title, description], index) => `<article class="event-slide" role="group" aria-roledescription="diapositive" aria-label="${index + 1} sur ${events.length}"><div class="event-slide-top"><span>${category}</span></div><h3>${title}</h3><p>${description}</p></article>`).join('')}
        </div>
    </div></section>
    <section class="home-thanks" aria-labelledby="thanks-title"><div class="wrap home-thanks-layout"><img src="${import.meta.env.BASE_URL}banque-3d.png" width="1000" height="800" loading="lazy" draggable="false" alt="Vue 3D de l’ancienne banque, avec sa façade à colonnes."><div><h2 id="thanks-title">Merci de<br>choisir local.</h2><p>Chaque visite fait une place aux talents d’ici. Venez nous rencontrer et découvrir vos prochaines trouvailles.</p></div></div></section></main>`;
}

function initHome() {
    const track = document.querySelector('#events-track');
    const slides = [...track.children];
    const previous = document.querySelector('#events-prev'), next = document.querySelector('#events-next');
    const events = new AbortController();
    const options = { signal: events.signal };
    const stride = () => slides[1].offsetLeft - slides[0].offsetLeft;
    function update() {
        previous.disabled = track.scrollLeft <= 2;
        next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
    }
    function move(direction) {
        const index = Math.round(track.scrollLeft / stride());
        track.scrollTo({ left: (index + direction) * stride(), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }
    previous.addEventListener('click', () => move(-1), options);
    next.addEventListener('click', () => move(1), options);
    track.addEventListener('scroll', update, { ...options, passive: true });
    track.addEventListener('keydown', e => {
        track.classList.remove('is-pointer-active');
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); move(e.key === 'ArrowRight' ? 1 : -1); }
    }, options);
    let drag = null;
    track.addEventListener('blur', () => track.classList.remove('is-pointer-active'), options);
    track.addEventListener('pointerdown', e => {
        track.classList.add('is-pointer-active');
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        e.preventDefault();
        track.focus({ preventScroll: true });
        drag = { id: e.pointerId, x: e.clientX, scroll: track.scrollLeft };
        track.classList.add('is-dragging');
        track.setPointerCapture(e.pointerId);
    }, options);
    track.addEventListener('pointermove', e => {
        if (drag?.id === e.pointerId) track.scrollLeft = drag.scroll + drag.x - e.clientX;
    }, options);
    const stopDrag = e => {
        if (drag?.id !== e.pointerId) return;
        const left = Math.round(track.scrollLeft / stride()) * stride();
        drag = null;
        track.classList.remove('is-dragging');
        if (track.hasPointerCapture(e.pointerId)) track.releasePointerCapture(e.pointerId);
        track.scrollTo({ left, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    };
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) track.addEventListener(type, stopDrag, options);
    const observer = new ResizeObserver(update); observer.observe(track); update();
    cleanup = () => { events.abort(); observer.disconnect(); };
}

function booking() {
    return `<main id="main" class="wrap reservation-page">
    <div class="page-head"><h1>Réservation de kiosque</h1></div>
    <p id="booking-status" class="status" role="status" aria-live="polite"></p>
    <section id="confirmation" class="confirmation panel" hidden aria-labelledby="confirmation-title"></section>
    <form id="booking-form" class="booking-layout">
        <div class="booking-content">
            <section id="step-one" aria-labelledby="space-title">
                <div class="date-bar"><div class="date-search">
                    ${dateField('start', 'debut', 'Date de début')}
                    ${dateField('end', 'fin', 'Date de fin')}
                    <div class="field floor-filter"><span id="floor-label">Niveau</span><input id="floor" type="hidden" value="all"><button class="floor-trigger" id="floor-trigger" type="button" aria-labelledby="floor-label floor-current" aria-haspopup="listbox" aria-expanded="false" aria-controls="floor-options"><span id="floor-current">Tout le marché</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button><div class="floor-options" id="floor-options" role="listbox" aria-labelledby="floor-label" hidden>${[['all', 'Tout le marché'], ['0', 'Rez-de-chaussée'], ['1', 'Mezzanine']].map(([value, label]) => `<button type="button" role="option" data-floor="${value}" aria-selected="${value === 'all'}" tabindex="-1"><span>${label}</span><span class="floor-check" aria-hidden="true">✓</span></button>`).join('')}</div></div>
                </div><p class="fine" id="date-help" aria-live="polite"></p></div>
                <section class="panel plan-panel">
                    <div class="plan-heading"><h2 id="space-title" tabindex="-1">Choisissez un kiosque</h2><span class="fine" id="available-count" aria-live="polite"></span></div>
                    <div class="planbar">
                        <div class="view-switch" role="group" aria-label="Affichage des kiosques"><button type="button" data-view="plan" aria-pressed="true">3D</button><button type="button" data-view="list" aria-pressed="false">Liste</button></div>
                    </div>
                    <div id="plan-view"><div class="scene-stage"><div id="scene" role="group" aria-label="Plan interactif du marché. Utilisez les repères ou la vue Liste pour choisir au clavier."></div>
                    <div class="map-controls" role="group" aria-label="Contrôles du plan"><button type="button" id="zoom-in" aria-label="Agrandir le plan">${icon('plus')}</button><button type="button" id="zoom-out" aria-label="Réduire le plan">${icon('minus')}</button><button type="button" id="reset-view" aria-label="Recentrer le plan">${icon('reset')}</button></div></div>
                    </div>
                    <div id="list-view" hidden><div id="booth-list" role="group" aria-label="Kiosques"></div></div>
                </section>
            </section>
            <fieldset id="step-two" class="panel contact-fields" hidden disabled>
                <legend class="visually-hidden">Vos coordonnées</legend>
                <button type="button" class="text-button back-button" id="back">Retour au choix du kiosque</button>
                <h2 id="details-title" tabindex="-1">Vos coordonnées</h2><p class="fine form-hint">Tous les champs sont requis, sauf indication contraire.</p>
                <div class="row"><label class="field">Nom complet<input name="nom" autocomplete="name" required maxlength="100"></label><label class="field">Entreprise<input name="entreprise" autocomplete="organization" required maxlength="120"></label></div>
                <div class="row"><label class="field">Courriel<input name="courriel" type="email" autocomplete="email" required maxlength="160"></label><label class="field">Téléphone<input name="telephone" type="tel" autocomplete="tel" required maxlength="30"></label></div>
                <label class="field">Produits ou services<select name="categorie" required><option value="">Choisir une catégorie</option><option>Alimentation</option><option>Art et artisanat</option><option>Maison et décoration</option><option>Objets et accessoires</option><option>Services et autres</option></select></label>
                <details class="equipment-details"><summary>Ajouter de l’équipement <span class="optional">Facultatif</span></summary><p class="fine">Une table est déjà incluse. Tarifs supplémentaires par jour.</p>
                    ${equipements.map(e => `<div class="equip-row"><label for="eq-${e.id}">${e.nom}<small>${money(e.prix)} / unité</small></label><div class="quantity-control"><input id="eq-${e.id}" name="eq-${e.id}" type="number" min="0" max="${e.max}" step="1" value="0" aria-label="Quantité : ${e.nom}"><div class="quantity-arrows">${[1, -1].map(step => `<button type="button" data-equipment="${e.id}" data-step-quantity="${step}" aria-label="${step > 0 ? 'Augmenter' : 'Diminuer'} la quantité : ${e.nom}"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${step > 0 ? 'm5 12 5-5 5 5' : 'm5 8 5 5 5-5'}"/></svg></button>`).join('')}</div></div></div>`).join('')}
                </details>
                <details class="notes-details"><summary>Un besoin particulier? <span class="optional">Facultatif</span></summary><label class="field"><span class="visually-hidden">Besoins particuliers</span><textarea name="notes" maxlength="1000" placeholder="Prise électrique, installation…"></textarea></label></details>
            </fieldset>
        </div>
        <aside class="panel booking-summary" aria-labelledby="summary-title"><h2 id="summary-title">Votre réservation</h2>
            <div class="selection-block"><div id="selection" class="selection" aria-live="polite"></div>
            <button type="button" class="clear-selection" id="clear-selection" aria-label="Retirer le kiosque sélectionné" hidden>${icon('close')}</button></div>
            <div id="summary" aria-live="polite"></div>
            <button class="btn wide" type="button" id="continue" disabled>Continuer</button>
            <button class="btn wide" type="submit" id="reserve" hidden>Enregistrer la réservation</button>
            <p class="fine action-hint" id="action-hint"></p>
        </aside>
    </form>
    <details class="saved-reservations" id="saved-reservations" hidden><summary>Mes réservations <span id="reservation-count"></span></summary><div id="reservations"></div></details>
    </main>`;
}

function contactPage() {
    return `<main id="main" class="wrap"><div class="page-head"><h1>Contact</h1><p>Une question sur votre kiosque ou le marché?</p></div>
    <div class="contact-grid"><section aria-label="Coordonnées et horaires"><p><a href="mailto:${contact.courriel}">${contact.courriel}</a><br><a href="tel:+18195550100">${contact.telephone}</a></p><h2 class="contact-hours-title">Adresse et horaires</h2><p>${contact.adresse}</p><ul class="hours"><li><span>Lundi à jeudi</span><span>10 h - 18 h</span></li><li><span>Vendredi</span><span>10 h - 21 h</span></li><li><span>Samedi</span><span>9 h - 17 h</span></li><li><span>Dimanche</span><span>10 h - 16 h</span></li></ul></section>
    <form id="contact-form" class="panel contact-fields"><h2>Écrivez-nous</h2><label class="field">Nom<input name="nom" autocomplete="name" required maxlength="100"></label><label class="field">Courriel<input name="courriel" type="email" autocomplete="email" required maxlength="160"></label><label class="field">Message<textarea name="message" required maxlength="3000"></textarea></label><button class="btn" type="submit">Envoyer le message</button><p id="contact-status" class="status" role="status"></p></form></div></main>`;
}

function initBooking() {
    const compact = matchMedia('(max-width: 760px)').matches;
    let selected = null, mode = compact ? '1' : 'all', step = 1, reservations = read();
    let sceneTask = null, view = 'plan';
    const form = document.querySelector('#booking-form');
    const planPanel = document.querySelector('.plan-panel');
    const planEvents = new AbortController();
    const eventOptions = { signal: planEvents.signal };
    const preventDefault = e => { if (e.cancelable) e.preventDefault(); };
    // Confine browser gestures to the entire chooser, including its overlays.
    for (const type of ['click', 'contextmenu', 'dragstart', 'selectstart']) planPanel.addEventListener(type, preventDefault, eventOptions);
    planPanel.addEventListener('wheel', e => {
        preventDefault(e);
        const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? planPanel.clientHeight : 1;
        if (view === 'list') document.querySelector('#booth-list').scrollBy(e.deltaX * unit, e.deltaY * unit);
        else if (e.deltaY) scene?.zoom(Math.pow(.95, e.deltaY * unit * .01));
    }, { ...eventOptions, passive: false });
    let touchPosition = null;
    planPanel.addEventListener('touchstart', e => {
        const touch = e.touches.length === 1 ? e.touches[0] : null;
        touchPosition = touch ? { x: touch.clientX, y: touch.clientY } : null;
    }, { ...eventOptions, passive: true });
    planPanel.addEventListener('touchmove', e => {
        preventDefault(e);
        const touch = e.touches.length === 1 ? e.touches[0] : null;
        if (view === 'list' && touch && touchPosition) document.querySelector('#booth-list').scrollBy(touchPosition.x - touch.clientX, touchPosition.y - touch.clientY);
        touchPosition = touch ? { x: touch.clientX, y: touch.clientY } : null;
    }, { ...eventOptions, passive: false });
    for (const type of ['touchend', 'touchcancel']) planPanel.addEventListener(type, () => { touchPosition = null; }, eventOptions);
    planPanel.addEventListener('keydown', e => {
        if (!e.target.closest('button, input, select, textarea, a, [contenteditable]') && [' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) preventDefault(e);
    }, eventOptions);
    const start = form.elements.debut, end = form.elements.fin;
    const status = document.querySelector('#booking-status');
    const next = document.querySelector('#continue'), reserve = document.querySelector('#reserve');
    start.value = end.value = today(); start.min = end.min = today();
    document.querySelector('#floor').value = mode;
    const duration = () => days(start.value, end.value);
    const validDates = () => duration() > 0 && start.value >= today();
    const reservationFor = id => reservations.find(v => v.kiosque === id && v.debut <= end.value && v.fin >= start.value);
    const busy = id => !!reservationFor(id);
    const canRent = k => !!k && !k.regulier && !busy(k.id);
    const qty = e => Math.min(e.max, Math.max(0, Math.floor(Number(form.elements['eq-' + e.id].value) || 0)));
    const chosen = () => kiosques.find(k => k.id === selected);
    function message(text = '', error = false) { status.textContent = text; status.classList.toggle('error', error); }
    function refresh() {
        form.querySelectorAll('[data-step-quantity]').forEach(button => {
            const equipment = equipements.find(item => item.id === button.dataset.equipment);
            button.disabled = Number(button.dataset.stepQuantity) > 0 ? qty(equipment) >= equipment.max : qty(equipment) <= 0;
        });
        const valid = validDates(), k = chosen();
        const canBook = valid && canRent(k);
        document.querySelector('#clear-selection').hidden = !k || step !== 1;
        document.querySelector('.booking-summary').classList.toggle('has-selection', !!k);
        start.setAttribute('aria-invalid', String(!validDate(start.value) || start.value < today()));
        end.setAttribute('aria-invalid', String(!duration()));
        document.querySelector('#date-help').textContent = valid ? '' : 'Choisissez des dates valides à partir d’aujourd’hui.';
        const shown = kiosques.filter(k => mode === 'all' || k.etage === Number(mode));
        document.querySelector('#available-count').textContent = valid ? `${shown.filter(canRent).length}/${shown.length} disponibles` : 'Vérifiez vos dates';
        const list = document.querySelector('#booth-list');
        // Reuse buttons so changing an option preserves keyboard focus.
        if (list.dataset.floor !== mode) {
            list.replaceChildren(); list.dataset.floor = mode;
            [1, 0].forEach(etage => {
                const group = shown.filter(k => k.etage === etage);
                if (!group.length) return;
                const section = document.createElement('section'); section.className = 'booth-section';
                const title = document.createElement('h3'); title.id = `booths-floor-${etage}`; title.textContent = levelText({ etage });
                section.setAttribute('aria-labelledby', title.id);
                section.appendChild(title);
                const grid = document.createElement('div'); grid.className = 'booth-grid';
                group.forEach(k => {
                    const b = document.createElement('button'); b.type = 'button'; b.dataset.id = k.id;
                    b.innerHTML = `<span class="booth-id">${k.id}</span><span class="booth-price">${money(k.prix)} <small>/ jour</small></span><span class="booth-state"></span>`;
                    b.onclick = () => select(k.id); grid.appendChild(b);
                });
                section.appendChild(grid); list.appendChild(section);
            });
        }
        list.querySelectorAll('button').forEach(b => {
            const k = kiosques.find(k => k.id === b.dataset.id), unavailable = valid && busy(k.id);
            b.classList.toggle('regular-booth', k.regulier); b.classList.toggle('busy-booth', unavailable && !k.regulier);
            b.setAttribute('aria-pressed', String(k.id === selected));
            b.disabled = !valid || !canRent(k);
            const entreprise = reservationFor(k.id)?.entreprise;
            b.querySelector('.booth-state').textContent = k.regulier ? k.entreprise : unavailable ? (typeof entreprise === 'string' && entreprise.trim() ? entreprise : 'Réservé') : k.id === selected ? 'Sélectionné' : valid ? 'Disponible' : 'Dates à choisir';
        });
        document.querySelector('#selection').innerHTML = k
            ? `<strong>Kiosque ${k.id}</strong><span>${levelText(k)} - ${k.zone}</span><span>${k.largeur.toLocaleString('fr-CA')} × ${k.profondeur.toLocaleString('fr-CA')} m</span>${valid && busy(k.id) ? '<span class="unavailable">Indisponible aux dates choisies.</span>' : ''}`
            : '<p>Cliquer sur un des kiosques pour le réserver.</p>';
        const equipment = equipements.reduce((sum, e) => sum + qty(e) * e.prix, 0) * duration();
        const space = (k?.prix || 0) * duration();
        document.querySelector('#summary').innerHTML = `<dl class="summary-lines"><div><dt>Dates</dt><dd>${valid ? `${dateText(start.value)}${end.value !== start.value ? `<br>au ${dateText(end.value)}` : ''}` : 'À choisir'}</dd></div>${k && valid ? `<div><dt>${duration()} jour${duration() > 1 ? 's' : ''} à ${money(k.prix)}</dt><dd>${money(space)}</dd></div>` : ''}<div><dt>1 table</dt><dd>Incluse</dd></div>${equipment > 0 ? `<div><dt>Équipement supplémentaire</dt><dd>${money(equipment)}</dd></div>` : ''}</dl><div class="total"><span>Total estimé</span><strong>${k && valid ? money(space + equipment) : '-'}</strong></div><p class="fine tax-note">Hors taxes</p>`;
        next.disabled = reserve.disabled = !canBook;
        document.querySelector('#action-hint').textContent = !valid ? 'Vérifiez vos dates.' : k && busy(k.id) ? 'Choisissez un autre kiosque ou d’autres dates.' : '';
        scene?.update(selected, id => !valid || busy(id), reservationFor);
        renderReservations();
    }
    function select(id) {
        if (!validDates() || !canRent(kiosques.find(k => k.id === id))) { message('Ce kiosque est indisponible. Vérifiez vos dates ou choisissez un autre emplacement.', true); return; }
        selected = selected === id ? null : id; message(); refresh();
    }
    function setStep(value) {
        reservations = read();
        if (value === 2 && (!validDates() || !canRent(chosen()))) { refresh(); message('Choisissez un kiosque disponible et vérifiez vos dates.', true); return; }
        step = value; message();
        form.classList.toggle('details-step', step === 2);
        document.querySelector('#step-one').hidden = step !== 1;
        const fields = document.querySelector('#step-two'); fields.hidden = fields.disabled = step !== 2;
        next.hidden = step !== 1; reserve.hidden = step !== 2;
        refresh();
        document.querySelector(step === 1 ? '#space-title' : '#details-title').focus();
    }
    function ensureScene() {
        if (scene) return Promise.resolve();
        if (sceneTask) return sceneTask;
        const host = document.querySelector('#scene');
        host.innerHTML = '<p class="scene-loading" role="status">Chargement du plan…</p>';
        sceneTask = (async () => {
            try {
                const [{ createScene }] = await Promise.all([import('./scene.js'), document.fonts.load('600 16px "Figtree"').catch(() => [])]);
                if (!host.isConnected) return;
                host.replaceChildren();
                scene = createScene(host, select);
                scene.setMode(mode);
                scene.update(selected, id => !validDates() || busy(id), reservationFor);
            } catch {
                if (host.isConnected) { setView('list'); message('Le plan 3D est indisponible. Choisissez votre kiosque dans la liste.'); }
            } finally { sceneTask = null; }
        })();
        return sceneTask;
    }
    function setView(value) {
        view = value;
        document.querySelector('#plan-view').hidden = view === 'list';
        document.querySelector('#list-view').hidden = view !== 'list';
        document.querySelectorAll('button[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
        if (view !== 'list') ensureScene();
    }
    document.querySelectorAll('button[data-view]').forEach(b => b.onclick = () => setView(b.dataset.view));
    const floor = document.querySelector('#floor');
    const floorTrigger = document.querySelector('#floor-trigger');
    const floorMenu = document.querySelector('#floor-options');
    const floorOptions = [...floorMenu.children];
    function syncFloor() {
        floorOptions.forEach(option => option.setAttribute('aria-selected', String(option.dataset.floor === floor.value)));
        document.querySelector('#floor-current').textContent = floorOptions.find(option => option.dataset.floor === floor.value).firstElementChild.textContent;
    }
    function closeFloor(focus = false) {
        floorMenu.hidden = true;
        floorTrigger.setAttribute('aria-expanded', 'false');
        if (focus) floorTrigger.focus({ preventScroll: true });
    }
    function openFloor() {
        datePickers.forEach(picker => picker.close());
        floorMenu.hidden = false;
        floorTrigger.setAttribute('aria-expanded', 'true');
        floorOptions.find(option => option.dataset.floor === floor.value).focus({ preventScroll: true });
    }
    floor.onchange = e => { mode = e.target.value; syncFloor(); scene?.setMode(mode); refresh(); };
    floorTrigger.addEventListener('click', () => floorMenu.hidden ? openFloor() : closeFloor(), eventOptions);
    floorTrigger.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); openFloor(); }
    }, eventOptions);
    floorMenu.addEventListener('keydown', e => {
        const index = floorOptions.indexOf(document.activeElement);
        let target = null;
        if (e.key === 'ArrowDown') target = (index + 1) % floorOptions.length;
        if (e.key === 'ArrowUp') target = (index - 1 + floorOptions.length) % floorOptions.length;
        if (e.key === 'Home') target = 0;
        if (e.key === 'End') target = floorOptions.length - 1;
        if (target !== null) { e.preventDefault(); floorOptions[target].focus(); }
        if (e.key === 'Escape') { e.preventDefault(); closeFloor(true); }
    }, eventOptions);
    floorOptions.forEach(option => option.addEventListener('click', () => {
        floor.value = option.dataset.floor;
        floor.dispatchEvent(new Event('change', { bubbles: true }));
        closeFloor(true);
    }, eventOptions));
    const floorField = floorTrigger.closest('.floor-filter');
    floorField.addEventListener('focusout', e => { if (!floorField.contains(e.relatedTarget)) closeFloor(); }, eventOptions);
    document.addEventListener('pointerdown', e => { if (!floorField.contains(e.target)) closeFloor(); }, eventOptions);
    syncFloor();
    document.querySelector('#reset-view').onclick = () => scene?.reset();
    document.querySelector('#zoom-in').onclick = () => scene?.zoom(1.25);
    document.querySelector('#zoom-out').onclick = () => scene?.zoom(.8);
    document.querySelector('#clear-selection').onclick = () => { selected = null; scene?.reset(); message(); refresh(); };
    next.onclick = () => setStep(2); document.querySelector('#back').onclick = () => setStep(1);
    const datePickers = [];
    for (const input of [start, end]) datePickers.push(initDatePicker(input, {
        signal: planEvents.signal,
        onOpen: () => { closeFloor(); datePickers.forEach(picker => picker.close()); }
    }));
    start.addEventListener('change', () => { end.min = start.value || today(); if (end.value < start.value) end.value = start.value; datePickers.forEach(picker => picker.sync()); message(); refresh(); });
    end.addEventListener('change', () => { datePickers.forEach(picker => picker.sync()); message(); refresh(); });
    equipements.forEach(e => form.elements['eq-' + e.id].addEventListener('input', refresh));
    form.querySelectorAll('[data-step-quantity]').forEach(button => button.addEventListener('click', () => {
        const equipment = equipements.find(item => item.id === button.dataset.equipment);
        const input = form.elements['eq-' + equipment.id];
        input.value = Math.min(equipment.max, Math.max(0, qty(equipment) + Number(button.dataset.stepQuantity)));
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }, eventOptions));
    form.addEventListener('invalid', e => {
        const folded = e.target.closest('details'); if (folded) folded.open = true;
    }, true);
    function renderReservations() {
        const target = document.querySelector('#reservations'); target.replaceChildren();
        syncReservationAccess();
        document.querySelector('#saved-reservations').hidden = reservations.length === 0;
        document.querySelector('#reservation-count').textContent = `(${reservations.length})`;
        if (!reservations.length) { target.innerHTML = '<p class="fine">Aucune réservation enregistrée sur ce navigateur.</p>'; return; }
        reservations.slice().reverse().forEach(v => {
            const item = document.createElement('div'); item.className = 'reservation';
            const text = document.createElement('div');
            text.innerHTML = `<strong>${escapeHtml(v.kiosque)}</strong><span>Du ${dateText(v.debut)} au ${dateText(v.fin)}</span><span>${money(Number(v.total) || 0)}</span>`;
            const button = document.createElement('button'); button.type = 'button'; button.className = 'text-button cancel-button'; button.textContent = 'Annuler'; button.setAttribute('aria-label', `Annuler la réservation ${v.kiosque} du ${dateText(v.debut)}`);
            button.onclick = () => {
                if (!confirm('Annuler cette réservation?')) return;
                try { const fresh = read().filter(x => x.id !== v.id); localStorage.setItem(storageKey, JSON.stringify(fresh)); reservations = fresh; refresh(); message('Réservation annulée.'); }
                catch { message('Impossible d’annuler la réservation sur ce navigateur.', true); }
            };
            item.append(text, button); target.appendChild(item);
        });
    }
    form.addEventListener('submit', e => {
        e.preventDefault();
        if (step === 1) { setStep(2); return; }
        if (!form.reportValidity()) return;
        reservations = read(); const k = chosen();
        if (!validDates() || !canRent(k)) { setStep(1); message('Cet emplacement n’est plus disponible aux dates choisies. Choisissez un autre kiosque.', true); return; }
        const equipment = [{ ...tableIncluse }, ...equipements.filter(e => qty(e) > 0).map(e => ({ id: e.id, nom: e.nom, quantite: qty(e), prix: e.prix }))];
        const total = duration() * (k.prix + equipment.reduce((sum, e) => sum + e.prix * e.quantite, 0));
        const entry = { id: globalThis.crypto?.randomUUID?.() || String(Date.now()), kiosque: k.id, entreprise: form.elements.entreprise.value.trim(), debut: start.value, fin: end.value, equipement: equipment, total };
        try {
            localStorage.setItem(storageKey, JSON.stringify([...reservations, entry])); reservations.push(entry);
            refresh(); form.hidden = true;
            const confirmation = document.querySelector('#confirmation'); confirmation.hidden = false;
            confirmation.innerHTML = `<div class="confirmation-heading"><h2 id="confirmation-title" tabindex="-1">Réservation enregistrée</h2><span class="success-mark" aria-hidden="true">✓</span></div><dl class="confirmation-details"><div><dt>Kiosque</dt><dd>${k.id}</dd></div><div><dt>Date</dt><dd>${entry.debut === entry.fin ? dateText(entry.debut) : `Du ${dateText(entry.debut)} au ${dateText(entry.fin)}`}</dd></div><div><dt>Montant de la facture</dt><dd class="confirmation-total">${money(total)}</dd></div></dl><div class="confirmation-actions"><a class="btn" href="#/reservation" id="new-booking">Faire une autre réservation</a></div>`;
            document.querySelector('#confirmation-title').focus();
            document.querySelector('#new-booking').onclick = e => { e.preventDefault(); render(); };
        } catch { message('La réservation n’a pas pu être enregistrée. Vérifiez que le stockage est autorisé dans votre navigateur.', true); }
    });
    const sync = e => { if (e.key === storageKey || e.key === null) { reservations = read(); if (step === 2 && !canRent(chosen())) { setStep(1); message('Votre kiosque vient d’être réservé aux mêmes dates. Choisissez un autre emplacement.', true); } else refresh(); } };
    window.addEventListener('storage', sync); cleanup = () => { window.removeEventListener('storage', sync); planEvents.abort(); };
    refresh(); setView('plan');
    if (reservations.length && new URLSearchParams(location.hash.split('?')[1]).has('mes-reservations')) {
        const saved = document.querySelector('#saved-reservations'); saved.open = true;
        saved.querySelector('summary').focus();
    }
}

function syncReservationAccess() {
    const button = document.querySelector('#my-reservations');
    if (button) button.hidden = read().length === 0;
}

function render() {
    cleanup(); cleanup = () => {}; scene?.dispose(); scene = null;
    const route = location.hash.split('?')[0];
    const page = route === '#/reservation' ? 'reservation' : route === '#/contact' ? 'contact' : 'home';
    app.innerHTML = header(page) + (page === 'reservation' ? booking() : page === 'contact' ? contactPage() : home()) + footer();
    document.title = `${page === 'reservation' ? 'Réserver un kiosque' : page === 'contact' ? 'Contact' : 'Le marché'} - Banque à trouvailles`;
    if (page === 'reservation') initBooking();
    if (page === 'home') initHome();
    if (page === 'contact') document.querySelector('#contact-form').addEventListener('submit', e => {
        e.preventDefault();
        const fields = new FormData(e.currentTarget);
        const subject = `Message de ${fields.get('nom')} - Banque à trouvailles`;
        const body = `Nom : ${fields.get('nom')}\nCourriel : ${fields.get('courriel')}\n\n${fields.get('message')}`;
        location.href = `mailto:${contact.courriel}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        document.querySelector('#contact-status').textContent = 'Terminez l’envoi dans votre application de courriel.';
    });
    if (!location.hash.includes('mes-reservations')) window.scrollTo(0, 0);
}
window.addEventListener('hashchange', render);
window.addEventListener('storage', e => { if (e.key === storageKey || e.key === null) syncReservationAccess(); });
document.addEventListener('click', e => {
    if (e.target.closest('a[href="#/reservation"]') && document.querySelector('#confirmation:not([hidden])')) {
        e.preventDefault();
        render();
        return;
    }
    if (e.target.closest('#my-reservations')) {
        const saved = document.querySelector('#saved-reservations');
        if (saved && read().length) { e.preventDefault(); saved.open = true; saved.querySelector('summary').focus(); }
    }
    document.querySelectorAll('.nav-menu[open]').forEach(menu => { if (!menu.contains(e.target)) menu.open = false; });
});
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.nav-menu[open]').forEach(menu => { menu.open = false; menu.querySelector('summary').focus(); });
});
render();
