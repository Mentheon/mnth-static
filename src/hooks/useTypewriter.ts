import { useState, useEffect } from 'react'

interface Options {
  speed?: number
  eraseDelay?: number
}

export function useTypewriter(strings: string[], { speed = 35, eraseDelay = 1800 }: Options = {}) {
  const [text, setText] = useState('')

  useEffect(() => {
    let cancelled = false
    let i = 0
    let j = 0
    let deleting = false

    setText('')

    function tick() {
      if (cancelled) return
      const full = strings[i]

      if (!deleting) {
        j++
        setText(full.slice(0, j))
        if (j === full.length) {
          if (strings.length === 1) return
          setTimeout(() => {
            if (!cancelled) { deleting = true; tick() }
          }, eraseDelay)
          return
        }
      } else {
        j--
        setText(full.slice(0, j))
        if (j === 0) {
          deleting = false
          i = (i + 1) % strings.length
        }
      }
      setTimeout(tick, deleting ? 18 : speed)
    }

    tick()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strings.join('||'), speed, eraseDelay])

  return text
}
