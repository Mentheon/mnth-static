import { useState, useEffect } from 'react'
import Header from './components/Header'
import HeroSection from './components/HeroSection'
import RDStrands from './components/RDStrands'
import Helix from './components/Helix'
import WhoPage from './components/WhoPage'

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
  const page = hash === '#who' ? 'who' : 'home'

  // Selected R&D Strand id, shared between RDStrands buttons and the
  // Helix below — scrolling the helix snaps to a project and updates
  // this; clicking an RDStrands button updates this and scrolls the
  // helix to align that project with the selector.
  const [openStrandId, setOpenStrandId] = useState<string | null>(null)

  return (
    <>
      <Header currentHash={hash} />
      {page === 'who' ? (
        <WhoPage />
      ) : (
        <>
          <HeroSection />
          <RDStrands openId={openStrandId} onSelect={setOpenStrandId} />
          <Helix selectedStrandId={openStrandId} onSelect={setOpenStrandId} />
        </>
      )}
    </>
  )
}
