import { useCallback, useState } from 'react'

export interface UseDisclosureReturn {
  isOpen: boolean
  toggle: () => void
  open: () => void
  close: () => void
}

// Generic open/close state used by the beacon → progress timeline
// disclosure. Stays small on purpose; keyboard handling is owned by
// whatever component renders the trigger (it calls toggle() on
// Enter / Space).
export default function useDisclosure(initial = false): UseDisclosureReturn {
  const [isOpen, setIsOpen] = useState<boolean>(initial)
  const toggle = useCallback(() => setIsOpen(o => !o), [])
  const open   = useCallback(() => setIsOpen(true),    [])
  const close  = useCallback(() => setIsOpen(false),   [])
  return { isOpen, toggle, open, close }
}
