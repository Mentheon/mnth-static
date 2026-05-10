import { useState, useEffect } from 'react'
import Header from './components/Header'
import WhoPage from './components/WhoPage'
import ConceptView from './components/ConceptView'
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
  // `#strand` (no id) and `#strand/<id>` both route to the detail view.
  const isStrandRoute = hash === '#strand' || hash.startsWith('#strand/')
  // `#marginalia`, `#marginalia/<slug>`, and `#marginalia?strand=<id>`
  // all route to the news section. Strip the query when checking the
  // path-style match so `#marginalia?strand=kindred` still resolves.
  const hashPath = hash.split('?')[0]
  const isMarginaliaRoute =
    hashPath === '#marginalia' || hashPath.startsWith('#marginalia/')
  const page =
    hash === '#who'     ? 'who'        :
    hash === '#concept' ? 'concept'    :
    isStrandRoute       ? 'strand'     :
    isMarginaliaRoute   ? 'marginalia' :
    'home'

  // Pick the strand the route is asking for. If `#strand/<id>` matches a
  // known strand, use that; otherwise fall back to the first strand with
  // populated `progress` data (currently Kindreon, the VR Reminiscence
  // Therapy demo).
  const requestedId = hash.startsWith('#strand/') ? hash.slice('#strand/'.length) : null
  const detailStrand =
    (requestedId ? STRANDS.find(s => s.id === requestedId) : null)
    ?? STRANDS.find(s => s.progress)
    ?? STRANDS[0]

  // Mirror the `#strand/<id>` slug-extraction pattern. `null` means
  // we're on the index/list view; any other value asks for the detail
  // page of that article slug. Strip the `?...` query first.
  const marginaliaSlug = hashPath.startsWith('#marginalia/')
    ? hashPath.slice('#marginalia/'.length)
    : null

  // Optional strand filter for the marginalia list view. URL shape is
  // `#marginalia?strand=<id>`. `URLSearchParams` happily parses the
  // bit after the `?` regardless of where it sits in the URL.
  const queryStr = hash.includes('?') ? hash.split('?').slice(1).join('?') : ''
  const strandFilter = new URLSearchParams(queryStr).get('strand')

  return (
    <>
      <Header currentHash={hash} />
      {page === 'who' ? (
        <WhoPage />
      ) : page === 'strand' && detailStrand.progress ? (
        <StrandDetail strand={detailStrand} progress={detailStrand.progress} />
      ) : page === 'marginalia' ? (
        <Marginalia slug={marginaliaSlug} strandFilter={strandFilter} />
      ) : (
        // Default + #concept both render the ConceptView. The legacy
        // home view (HomeMashup → RDStrands → Helix → StrandPanel) is
        // intentionally unwired right now; recover it from git history
        // if you want it back as a separate route.
        <ConceptView />
      )}
    </>
  )
}
