export type UIPrefs = { autoTunePlan: boolean };
const K = 'dm.uiprefs.v1';
export function loadUIPrefs(): UIPrefs {
  try { const raw = localStorage.getItem(K); if (raw) return JSON.parse(raw); } catch {}
  return { autoTunePlan: true };
}
export function saveUIPrefs(p: UIPrefs) {
  try { localStorage.setItem(K, JSON.stringify(p)); } catch {}
}
