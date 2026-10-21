/* Umami Cloud analytics — cookieless, no personal data stored.

   The tracker is injected from code (not an index.html tag) so we
   can turn off its auto-tracking: it only sees pushState/replaceState,
   and every route here is a hash change. App calls trackPageview()
   whenever the hash path changes; the first pageview fires from the
   script's onload. Production builds only, and `data-domains` keeps
   local `vite preview` runs out of the stats. */

const SRC = 'https://cloud.umami.is/script.js'
const WEBSITE_ID = 'b825fe37-90ce-438f-8b81-89758090468f'
const DOMAINS = 'mentheon.com,www.mentheon.com'

type Payload = Record<string, unknown>

declare global {
  interface Window {
    umami?: { track: (fn: (props: Payload) => Payload) => void }
  }
}

/** Current route as Umami should record it: path + hash, minus any
    `?query` on the hash (e.g. `#helix3d?skipIntro=true`). */
function currentUrl(): string {
  return window.location.pathname + window.location.hash.split('?')[0]
}

/** Record a pageview for the current hash route. No-op until the
    tracker has loaded (its onload sends the first one itself). */
export function trackPageview(): void {
  window.umami?.track((props) => ({ ...props, url: currentUrl() }))
}

/** Inject the tracker once. Run on app boot. */
export function initAnalytics(): void {
  if (!import.meta.env.PROD || document.querySelector(`script[src="${SRC}"]`)) return
  const s = document.createElement('script')
  s.src = SRC
  s.defer = true
  s.dataset.websiteId = WEBSITE_ID
  s.dataset.autoTrack = 'false'
  s.dataset.domains = DOMAINS
  s.onload = trackPageview
  document.head.appendChild(s)
}
