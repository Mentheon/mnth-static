import { useEffect, useState } from 'react'
import { isIntroDone, onIntroDone } from '../lib/introGate'
import { useSwipeDown } from '../lib/useSwipeDown'
import styles from './AnalyticsNotice.module.css'

/* One-time info notice about the (cookieless) Umami analytics.
   Informational only — analytics runs regardless; "Got it" just
   dismisses the notice for good. On the Helix3D route it waits for
   the intro to finish so it never sits on top of it. */

const KEY = 'mnth:analyticsNoticeSeen'

function seen(): boolean {
  try { return localStorage.getItem(KEY) === '1' } catch { return false }
}

export default function AnalyticsNotice({ onHelix }: { onHelix: boolean }) {
  const [dismissed, setDismissed] = useState(seen)
  const [introDone, setIntroDone] = useState(isIntroDone)

  useEffect(() => onIntroDone(() => setIntroDone(true)), [])

  const dismiss = () => {
    try { localStorage.setItem(KEY, '1') } catch { /* storage unavailable — hides for this visit only */ }
    setDismissed(true)
  }
  // Swiping the notice down dismisses it, same as "Got it" (short
  // threshold: it's a small panel).
  const swipe = useSwipeDown(dismiss, 40)

  if (dismissed || (onHelix && !introDone)) return null

  return (
    <div className={styles.notice} role="region" aria-label="Analytics notice" style={swipe.style} {...swipe.handlers}>
      <span className={styles.logo} role="img" aria-label="Umami" />
      <p className={styles.text}>
        We use privacy-friendly analytics (Umami) to count visits. No cookies,
        no personal data, nothing shared with advertisers.
      </p>
      <button type="button" className={styles.button} onClick={dismiss}>
        Got it
      </button>
    </div>
  )
}
