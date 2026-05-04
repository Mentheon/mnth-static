import { useState, useEffect } from 'react'
import Header from './components/Header'
import HeroSection from './components/HeroSection'
import RDStrands from './components/RDStrands'
import StrandPanel from './components/StrandPanel'
import Helix from './components/Helix'
import WhoPage from './components/WhoPage'
import ConceptView from './components/ConceptView'
import StrandDetail from './components/StrandDetail'
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
  const page =
    hash === '#who'     ? 'who'     :
    hash === '#concept' ? 'concept' :
    isStrandRoute       ? 'strand'  :
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

  // Selected R&D Strand id, shared between the StrandPanel, the
  // RDStrands buttons, and the Helix — scrolling the helix snaps to a
  // project and updates this; clicking an RDStrands button updates this
  // and scrolls the helix to align that project with the selector.
  const [openStrandId, setOpenStrandId] = useState<string | null>(null)
  const openStrand = STRANDS.find(s => s.id === openStrandId) ?? null

  return (
    <>
      <Header currentHash={hash} />
      {page === 'who' ? (
        <WhoPage />
      ) : page === 'concept' ? (
        <ConceptView />
      ) : page === 'strand' && detailStrand.progress ? (
        <StrandDetail strand={detailStrand} progress={detailStrand.progress} />
      ) : (
        <>
          <HeroSection />
          {/* Top: three circular bubbles (Kindreon / Aevorix / Acumentra). */}
          <RDStrands openId={openStrandId} onSelect={setOpenStrandId} />
          {/* Middle: scrollable helix. Snapping a project here lights
              the matching bubble above; clicking a bubble scrolls the
              helix to that project. */}
          <Helix selectedStrandId={openStrandId} onSelect={setOpenStrandId} />
          {/* Bottom: detail panel for whatever's currently selected. */}
          {openStrand && (
            <StrandPanel
              key={openStrand.id}
              strand={openStrand}
              isOpen={openStrandId !== null}
              onClose={() => setOpenStrandId(null)}
            />
          )}
        </>
      )}
    </>
  )
}
