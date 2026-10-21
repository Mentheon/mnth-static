/* "Has the Helix3D intro finished?" — a tiny module-level signal.

   The intro lives inside .helix3d-root (its own z-index: 1 stacking
   context), so app-level overlays like the analytics notice would
   paint over it. They wait on this instead. Helix3D calls
   markIntroDone() when its scene starts, whether the intro played
   or was skipped. Once set it stays set for the page's lifetime. */

let done = false

/* "skip always" (intro tickbox): persisted per browser, so the intro
   never plays again on this device until it's unticked. */
const SKIP_ALWAYS_KEY = 'mnth:skipIntroAlways'
export function skipIntroAlways(): boolean {
  try { return localStorage.getItem(SKIP_ALWAYS_KEY) === '1' } catch { return false }
}
export function setSkipIntroAlways(on: boolean): void {
  try { if (on) localStorage.setItem(SKIP_ALWAYS_KEY, '1'); else localStorage.removeItem(SKIP_ALWAYS_KEY) } catch { /* storage unavailable */ }
}
const listeners = new Set<() => void>()

export const isIntroDone = () => done

export function markIntroDone(): void {
  if (done) return
  done = true
  listeners.forEach((fn) => fn())
  listeners.clear()
}

/** Subscribe; returns an unsubscribe. Fires immediately if already done. */
export function onIntroDone(fn: () => void): () => void {
  if (done) { fn(); return () => {} }
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}
