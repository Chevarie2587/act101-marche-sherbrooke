const parse = value => new Date(`${value}T12:00:00`);
const iso = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const fullDate = new Intl.DateTimeFormat('fr-CA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const monthLabel = new Intl.DateTimeFormat('fr-CA', { month: 'long', year: 'numeric' });
const shortDate = new Intl.DateTimeFormat('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' });

export function dateField(id, name, label) {
    return `<div class="field date-field"><span id="${id}-label">${label}</span><input id="${id}" name="${name}" type="hidden"><button type="button" class="date-trigger" aria-labelledby="${id}-label ${id}-value" aria-haspopup="dialog" aria-expanded="false" aria-controls="${id}-calendar"><span id="${id}-value"></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18"/></svg></button><div id="${id}-calendar" class="date-calendar" role="dialog" aria-modal="false" aria-labelledby="${id}-label" hidden><div class="calendar-heading"><button type="button" data-month="-1" aria-label="Mois précédent">←</button><strong id="${id}-month" aria-live="polite"></strong><button type="button" data-month="1" aria-label="Mois suivant">→</button></div><table class="calendar-grid" role="grid" aria-labelledby="${id}-month"><thead><tr>${['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => `<th scope="col">${day}</th>`).join('')}</tr></thead><tbody></tbody></table></div></div>`;
}

export function initDatePicker(input, { signal, onOpen }) {
    const field = input.closest('.date-field');
    const trigger = field.querySelector('.date-trigger');
    const popup = field.querySelector('.date-calendar');
    const heading = field.querySelector('.calendar-heading strong');
    const grid = field.querySelector('tbody');
    const previous = field.querySelector('[data-month="-1"]');
    const options = { signal };
    let focused = input.value;
    let rendering = false;
    let month = parse(input.value); month.setDate(1);
    const minimum = () => input.min;
    function close(restoreFocus = false) {
        popup.hidden = true;
        trigger.setAttribute('aria-expanded', 'false');
        if (restoreFocus) trigger.focus({ preventScroll: true });
    }
    function render(focusDay = false) {
        heading.textContent = monthLabel.format(month);
        const firstMonth = iso(month) <= minimum().slice(0, 7) + '-01';
        if (firstMonth && document.activeElement === previous) field.querySelector('[data-month="1"]').focus({ preventScroll: true });
        previous.disabled = firstMonth;
        const first = new Date(month); first.setDate(1 - ((month.getDay() + 6) % 7));
        const today = iso(new Date());
        let rows = '';
        for (let week = 0; week < 6; week++) {
            rows += '<tr>';
            for (let day = 0; day < 7; day++) {
                const date = new Date(first); date.setDate(first.getDate() + week * 7 + day);
                const value = iso(date), disabled = value < minimum();
                rows += `<td role="gridcell" aria-selected="${value === input.value}"><button type="button" data-date="${value}" aria-label="${fullDate.format(date)}" ${value === today ? 'aria-current="date"' : ''} ${disabled ? 'disabled' : ''} tabindex="${value === focused && !disabled ? '0' : '-1'}" class="${date.getMonth() !== month.getMonth() ? 'other-month' : ''}">${date.getDate()}</button></td>`;
            }
            rows += '</tr>';
        }
        rendering = true;
        grid.innerHTML = rows;
        if (focusDay) grid.querySelector(`[data-date="${focused}"]`)?.focus({ preventScroll: true });
        rendering = false;
    }
    function sync() {
        field.querySelector(`#${input.id}-value`).textContent = shortDate.format(parse(input.value));
        if (!popup.hidden) { focused = input.value; month = parse(focused); month.setDate(1); render(); }
    }
    function open() {
        onOpen();
        focused = input.value < minimum() ? minimum() : input.value;
        month = parse(focused); month.setDate(1);
        popup.hidden = false;
        trigger.setAttribute('aria-expanded', 'true');
        render(true);
    }
    trigger.addEventListener('click', () => popup.hidden ? open() : close(true), options);
    trigger.addEventListener('keydown', event => {
        if (event.key === 'ArrowDown') { event.preventDefault(); open(); }
    }, options);
    popup.addEventListener('click', event => {
        const day = event.target.closest('button[data-date]');
        if (day && !day.disabled) {
            input.value = day.dataset.date;
            input.dispatchEvent(new Event('change', { bubbles: true }));
            sync(); close(true);
        }
        const navigation = event.target.closest('[data-month]');
        if (navigation && !navigation.disabled) {
            month.setMonth(month.getMonth() + Number(navigation.dataset.month));
            focused = iso(month) < minimum() ? minimum() : iso(month);
            render();
        }
    }, options);
    popup.addEventListener('keydown', event => {
        if (event.key === 'Escape') { event.preventDefault(); close(true); return; }
        const day = event.target.closest('button[data-date]');
        if (!day) return;
        const date = parse(day.dataset.date);
        const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, Home: -((date.getDay() + 6) % 7), End: 6 - ((date.getDay() + 6) % 7) };
        if (Object.hasOwn(offsets, event.key)) date.setDate(date.getDate() + offsets[event.key]);
        else if (event.key === 'PageUp' || event.key === 'PageDown') {
            const originalDay = date.getDate();
            date.setDate(1); date.setMonth(date.getMonth() + (event.key === 'PageDown' ? 1 : -1));
            const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
            date.setDate(Math.min(originalDay, lastDay));
        } else return;
        event.preventDefault();
        focused = iso(date) < minimum() ? minimum() : iso(date);
        month = parse(focused); month.setDate(1); render(true);
    }, options);
    field.addEventListener('focusout', event => { if (!rendering && !field.contains(event.relatedTarget)) close(); }, options);
    document.addEventListener('pointerdown', event => { if (!field.contains(event.target)) close(); }, options);
    sync();
    return { close, sync };
}
