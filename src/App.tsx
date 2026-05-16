import { useState, useEffect, Fragment, type ReactNode } from 'react'
import Header from './components/Header'
import WhoPage from './components/WhoPage'
import ConceptView from './components/ConceptView'
import Helix3D from './components/Helix3D/Helix3D'
import ScrollLockView from './components/Helix3D/ScrollLockView'
import StrandDetail from './components/StrandDetail'
import Marginalia from './components/Marginalia'
import { STRANDS } from './data/strands'

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
  // `#strand` (no id) and `#strand/<id>` both route to the detail view.
  const isStrandRoute = hash === '#strand' || hash.startsWith('#strand/')
  // `#marginalia`, `#marginalia/<slug>`, and `#marginalia?strand=<id>`
  // all route to the news section. Strip the query when checking the
  // path-style match so `#marginalia?strand=kindred` still resolves.
  const hashPath = hash.split('?')[0]
  const isMarginaliaRoute =
    hashPath === '#marginalia' || hashPath.startsWith('#marginalia/')
  const page =
    hash === '#helix3d'    ? 'helix3d'    :
    hash === '#helix3d?skipIntro=true' ? 'helix3d'    : // explicit skipIntro param also routes to helix3d
    hash === '#scrolllock' ? 'scrolllock' :
    hash === '#who'     ? 'who'        :
    hash === '#concept' ? 'concept'    :
    isStrandRoute       ? 'strand'     :
    isMarginaliaRoute   ? 'marginalia' :
    'home'

  let content: ReactNode
  if (page === 'helix3d') {
    // Full-viewport takeover with its own chrome (and its own
    // Marginalia tab) — rendered standalone, no shared Header.
    // First load (renderKey 0) plays the loader/gate intro; any
    // dev re-render (renderKey > 0) skips straight to the scene.
    content = <Helix3D skipIntro={renderKey > 0} />
  } else if (page === 'scrolllock') {
    // Frozen scroll-locked variant of the same 3D concept.
    content = <ScrollLockView />
  } else {
    // Pick the strand the route is asking for. If `#strand/<id>`
    // matches a known strand, use that; otherwise fall back to the
    // first strand with populated `progress` data (currently
    // Kindreon, the VR Reminiscence Therapy demo).
    const requestedId = hash.startsWith('#strand/') ? hash.slice('#strand/'.length) : null
    const detailStrand =
      (requestedId ? STRANDS.find(s => s.id === requestedId) : null)
      ?? STRANDS.find(s => s.progress)
      ?? STRANDS[0]

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

    content = (
      <>
        <Header currentHash={hash} />
        {page === 'who' ? (
          <WhoPage />
        ) : page === 'strand' && detailStrand.progress ? (
          <StrandDetail strand={detailStrand} progress={detailStrand.progress} />
        ) : page === 'marginalia' ? (
          <Marginalia slug={marginaliaSlug} strandFilter={strandFilter} />
        ) : (
          // Default + #concept both render the ConceptView. The
          // legacy home view (HomeMashup → RDStrands → Helix →
          // StrandPanel) is intentionally unwired right now; recover
          // it from git history if you want it back as a route.
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
