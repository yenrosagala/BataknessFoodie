import { longDate } from './format.js';

export const localISO = d =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function deliveryDates(preorder) {
  const out = [];
  if (!preorder || preorder.open === false) return out;
  const now = new Date();
  const weekday = preorder.deliveryWeekday ?? 6;
  const cutDays = preorder.cutoffDaysBefore ?? 0;
  const cutHour = preorder.cutoffHour ?? 0;
  const weeks = preorder.weeks ?? 4;
  const base = new Date(now);
  base.setHours(0, 0, 0, 0);

  for (let w = 0; w < weeks; w++) {
    const d = new Date(base);
    d.setDate(base.getDate() + ((weekday - base.getDay() + 7) % 7) + w * 7);
    const cut = new Date(d);
    cut.setDate(d.getDate() - cutDays);
    cut.setHours(cutHour, 0, 0, 0);
    if (cut.getTime() >= now.getTime()) out.push(d);
  }
  return out;
}

export function fillDateSelect(select, preorder) {
  const dates = deliveryDates(preorder);
  select.replaceChildren(...dates.map(d => {
    const o = document.createElement('option');
    o.value = localISO(d);
    o.textContent = longDate(d);
    return o;
  }));
  return dates.length;
}
