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

  return (
    <>
      <Header currentHash={hash} />
      {page === 'who' ? (
        <WhoPage />
      ) : (
        <>
          <HeroSection />
          <RDStrands />
          <Helix />
        </>
      )}
    </>
  )
}
