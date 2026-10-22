import { useState, useEffect, Fragment, type ReactNode } from 'react'
import NavBar from './components/NavBar'
import WhoPage from './components/WhoPage'
import ConceptView from './components/ConceptView'
import Helix3D from './components/Helix3D/Helix3D'
import ScrollLockView from './components/Helix3D/ScrollLockView'
import StrandDetail from './components/StrandDetail'
import Marginalia from './components/Marginalia'
import LoaderGallery from './components/LoaderGallery'
import AnalyticsNotice from './components/AnalyticsNotice'
import MobileHome from './components/Mobile/MobileHome'
import { useIsMobile } from './lib/useIsMobile'
import { trackPageview } from './lib/analytics'
import { STRANDS, STRAND_PAGES } from './data/strands'
import {
  FrameworkPage, CategoryPage, PlasmidsPage, RegisterPage, OutputPage, LockedOutputPage, InfrastructurePage, ServicesPage, NotFoundPage,
} from './components/Framework/pages'
import { categoryById, outputById, isOpen, type CategoryId } from './data/framework'

function useHash() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const handler = () => setHash(window.location.hash)
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])
  return hash
}

export default function App() {
  const hash = useHash()
  // Dev-only: bumping this remounts the current view (it's the
  // `key` on the content Fragment) so effect-driven views like
  // Helix3D fully rebuild without a browser reload.
  const [renderKey, setRenderKey] = useState(0)
  // Helix3D asks for a remount when its WebGL context is lost and not
  // restored (see initThree). Capped so a broken GPU can't loop.
  useEffect(() => {
    let resets = 0
    const onReset = () => { if (resets++ < 2) setRenderKey((k) => k + 1) }
    window.addEventListener('mnth:helix-reset', onReset)
    return () => window.removeEventListener('mnth:helix-reset', onReset)
  }, [])
  // `#strand` (no id) and `#strand/<id>` both route to the detail view.
  const isStrandRoute = hash === '#strand' || hash.startsWith('#strand/')
  // `#marginalia`, `#marginalia/<slug>`, and `#marginalia?strand=<id>`
  // all route to the news section. Strip the query when checking the
  // path-style match so `#marginalia?strand=kindred` still resolves.
  const hashPath = hash.split('?')[0]
  const isMarginaliaRoute =
    hashPath === '#marginalia' || hashPath.startsWith('#marginalia/')
  // `#helix3d?skipIntro=true` — back traversals home carry this param so
  // returning to the scene doesn't replay the loader/gate intro. Only the
  // very first navigation onto the site (no param) plays the intro.
  const hashQuery = new URLSearchParams(hash.includes('?') ? hash.split('?').slice(1).join('?') : '')
  const wantsSkipIntro = hashQuery.get('skipIntro') === 'true'
  // Phones: the 3D scene is the default home; `#helix3d?view=list`
  // (the 3d | list switch) shows the condensed strand list instead.
  const isMobile = useIsMobile()
  const page =
    hashPath === '#helix3d' ? 'helix3d'    : // bare or ?skipIntro=true both route to helix3d
    hash === '#scrolllock' ? 'scrolllock' :
    hashPath === '#who' ? 'who'        : // ?person=<id> opens that profile
    hash === '#loaders' ? 'loaders'    :
    hash === '#concept' ? 'concept'    :
    isStrandRoute       ? 'strand'     :
    isMarginaliaRoute   ? 'marginalia' :
    // Structure v3 routes
    hashPath === '#framework'       ? 'framework' :
    hashPath === '#register'        ? 'register' :
    hashPath === '#plasmids'        ? 'plasmids' :
    hashPath === '#infrastructure'  ? 'infrastructure' :
    hashPath === '#services'        ? 'services' :
    hashPath.startsWith('#category/') ? 'category' :
    hashPath.startsWith('#output/')   ? 'output' :
    'helix3d'

  // Each hash route counts as a pageview. Keyed on the path (not the
  // full hash), so `?strand=` filter tweaks don't re-count.
  useEffect(() => { trackPageview() }, [hashPath])

  const mobileHome = page === 'helix3d' && isMobile && hashQuery.get('view') === 'list'

  let content: ReactNode
  if (mobileHome) {
    content = (
      <>
        <NavBar view="list" />
        <MobileHome />
      </>
    )
  } else if (page === 'helix3d') {
    // Full-viewport takeover with its own chrome (and its own
    // Marginalia tab) — rendered standalone, no shared Header.
    // First load (renderKey 0) plays the loader/gate intro; any
    // dev re-render (renderKey > 0) skips straight to the scene.
    // Phones: the site bar (3d | list · menu) over the scene, in place
    // of the scene's own nav. Helix3D keeps the same tree slot either
    // way, so crossing the breakpoint never remounts the WebGL scene.
    content = (
      <>
        {isMobile && <NavBar view="3d" />}
        <Helix3D skipIntro={renderKey > 0 || wantsSkipIntro} />
      </>
    )
  } else if (page === 'scrolllock') {
    // Frozen scroll-locked variant of the same 3D concept.
    content = <ScrollLockView />
  } else {
    // Pick the strand the route is asking for. `#strand/<id>` resolves
    // first against STRAND_PAGES — one full detail page per helix rung
    // (vr-rt, attraction, analytics, cognition, biomarkers, platform),
    // which is what the in-scene "See full work strand" CTAs link to.
    // Fall back to the legacy STRANDS set, then to the first page with
    // populated `progress` data. Strip any `?query` from the id first.
    const requestedId = hash.startsWith('#strand/')
      ? hash.slice('#strand/'.length).split('?')[0]
      : null
    const detailStrand =
      (requestedId ? STRAND_PAGES.find(s => s.id === requestedId) : null)
      ?? (requestedId ? STRANDS.find(s => s.id === requestedId) : null)
      ?? STRAND_PAGES.find(s => s.progress)
      ?? STRAND_PAGES[0]

    // Mirror the `#strand/<id>` slug-extraction pattern. `null` means
    // we're on the index/list view; any other value asks for the
    // detail page of that article slug. Strip the `?...` query first.
    const marginaliaSlug = hashPath.startsWith('#marginalia/')
      ? hashPath.slice('#marginalia/'.length)
      : null

    // Optional strand filter for the marginalia list view. URL shape
    // is `#marginalia?strand=<id>`. `URLSearchParams` happily parses
    // the bit after the `?` regardless of where it sits in the URL.
    const queryStr = hash.includes('?') ? hash.split('?').slice(1).join('?') : ''
    const strandFilter = new URLSearchParams(queryStr).get('strand')

    // Global NavBar (replaces the archived Header/GridNav +
    // MarginaliaPage). Light/dark is global via NavBar → <html>
    // data-theme; menu items are consistent with the Helix3D nav.
    content = (
      <>
        <NavBar />
        {page === 'who' ? (
          <WhoPage />
        ) : page === 'loaders' ? (
          // #loaders — preview/cycle the loader variants (◀ ▶).
          <LoaderGallery />
        ) : page === 'strand' && detailStrand.progress ? (
          <StrandDetail strand={detailStrand} progress={detailStrand.progress} />
        ) : page === 'marginalia' ? (
          <Marginalia slug={marginaliaSlug} strandFilter={strandFilter} />
        ) : page === 'framework' ? (
          <FrameworkPage />
        ) : page === 'register' ? (
          <RegisterPage query={new URLSearchParams(queryStr)} />
        ) : page === 'plasmids' ? (
          <PlasmidsPage />
        ) : page === 'infrastructure' ? (
          <InfrastructurePage />
        ) : page === 'services' ? (
          <ServicesPage />
        ) : page === 'category' ? (
          (() => {
            const id = hashPath.slice('#category/'.length)
            const c = categoryById(id)
            return !c ? <NotFoundPage what="category" /> : c.id === 'plasmids' ? <PlasmidsPage /> : <CategoryPage key={c.id} id={c.id as CategoryId} />
          })()
        ) : page === 'output' ? (
          (() => {
            const o = outputById(hashPath.slice('#output/'.length))
            return !o ? <NotFoundPage what="output" />
              : isOpen(o) ? <OutputPage key={o.id} o={o} />
              : <LockedOutputPage key={o.id} o={o} />
          })()
        ) : (
          // `#concept` renders the ConceptView. The legacy home view
          // (HomeMashup → RDStrands → Helix → StrandPanel) is
          // intentionally unwired right now; recover it from git
          // history if you want it back as a route.
          <ConceptView />
        )}
      </>
    )
  }

  return (
    <>
      {/* Changing `key` unmounts + remounts the whole view, so
          effect-driven scenes (Helix3D loader/gate/WebGL) rebuild
          from scratch. */}
      <Fragment key={renderKey}>{content}</Fragment>

      {/* First-visit analytics info notice. Outside the keyed Fragment
          so a dev remount doesn't bring it back. */}
      <AnalyticsNotice onHelix={page === 'helix3d' && !mobileHome} />

      {/* Dev-only re-render button. `import.meta.env.DEV` is statically
          false in production builds, so this is dropped from the
          bundle. It's a sibling of `content` (outside the keyed
          Fragment) so it persists across remounts and isn't caught
          by the helix3d `cursor:none` / button reset. */}
      {import.meta.env.DEV && (
        <button
          type="button"
          onClick={() => setRenderKey(k => k + 1)}
          title="Force a full remount of the current view (dev only)"
          style={{
            position: 'fixed', left: 12, bottom: 12, zIndex: 2147483000,
            font: '700 11px/1 "JetBrains Mono", monospace',
            letterSpacing: '0.12em', textTransform: 'uppercase',
            padding: '8px 12px', color: '#FFECE1', background: '#A30B37',
            border: 'none', borderRadius: 3, cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.35)', opacity: 0.85,
          }}
        >
          ⟳ re-render
        </button>
      )}
    </>
  )
}
