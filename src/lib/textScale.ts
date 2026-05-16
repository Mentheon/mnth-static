/* Global text-size control.

   Scales the root <html> font-size, so every rem-based size across
   the whole site (all routes, including the helix3d overlay) grows
   or shrinks together. Persisted to localStorage so it survives
   navigation and reloads. Call initTextScale() once at startup;
   adjustTextScale() from the +/- buttons. */

const KEY = 'mnth:textScale'
export const TEXT_MIN = 0.85
export const TEXT_MAX = 1.4
export const TEXT_STEP = 0.08

const clamp = (n: number) => Math.min(TEXT_MAX, Math.max(TEXT_MIN, n))

export function getTextScale(): number {
  try {
    const raw = parseFloat(localStorage.getItem(KEY) ?? '')
    return Number.isFinite(raw) ? clamp(raw) : 1
  } catch {
    return 1
  }
}

/** Apply a scale (1 = 100% = browser default) to <html> + persist. */
export function applyTextScale(scale: number): number {
  const s = clamp(scale)
  document.documentElement.style.fontSize = `${(s * 100).toFixed(2)}%`
  try {
    localStorage.setItem(KEY, String(s))
  } catch {
    /* storage may be unavailable (private mode) — scale still applies
       for this session, just won't persist. */
  }
  return s
}

/** Nudge the current scale by `delta`; returns the applied value. */
export function adjustTextScale(delta: number): number {
  return applyTextScale(getTextScale() + delta)
}

/** Re-apply the persisted scale. Run once on app boot. */
export function initTextScale(): void {
  applyTextScale(getTextScale())
}
