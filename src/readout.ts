/**
 * Update a readout value (e.g. `<div class="v">1.89<span class="unit">eV</span></div>`)
 * without wiping its unit span, which plain `textContent = …` would do.
 * Pass `unit` to set or change the unit; omit it to keep the existing one.
 */
export function setReadout(el: HTMLElement | null, value: string, unit?: string): void {
  if (!el) return;
  let unitEl = el.querySelector<HTMLElement>('.unit');
  if (unit !== undefined) {
    if (!unitEl) {
      unitEl = document.createElement('span');
      unitEl.className = 'unit';
    }
    unitEl.textContent = unit;
  }
  el.textContent = value;
  if (unitEl?.textContent) el.appendChild(unitEl);
}
